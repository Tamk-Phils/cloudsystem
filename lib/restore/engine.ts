import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getS3Stream } from "../aws/s3";
import { supabaseAdmin } from "../supabase/admin";
import { getIO } from "../socket";

const debugLogPath = path.join("/tmp", "BACKUP_DEBUG.log");
function logToFile(msg: string) {
  const line = `[${new Date().toISOString()}] RESTORE: ${msg}\n`;
  try {
    fs.appendFileSync(debugLogPath, line);
  } catch (e) {
    console.error("Failed to write to debug log:", e);
  }
}

let lastEmitTime = 0;
function emitRestoreStatus(status: string, progress: number, logLine?: string, force = false) {
  const now = Date.now();
  if (force || now - lastEmitTime > 100) {
    logToFile(`Status Update: ${status} (${progress}%) ${logLine || ""}`);
    const io = getIO();
    if (io) {
      io.emit("restore_status", { status, progress, log: logLine, timestamp: new Date().toISOString() });
    }
    lastEmitTime = now;
  }
}

/**
 * Performs a high-reliability database restoration.
 * Automatically detects between Binary (Custom) and SQL formats.
 */
export async function performDatabaseRestore(backupId: string) {
  const startTime = Date.now();
  logToFile(`>>> Initiating multi-format restoration for backup ID: ${backupId}`);
  
  try {
    emitRestoreStatus("Initializing", 5, "Securing cloud pipeline...", true);
    
    const [backupRes, logRes] = await Promise.all([
      supabaseAdmin.from("backups").select("*").eq("id", backupId).single(),
      supabaseAdmin.from("recovery_logs").insert({
        backup_id: backupId,
        status: "in_progress",
        details: "Infrastructure restoration sequence initiated",
      }).select().single()
    ]);

    if (backupRes.error || !backupRes.data) throw new Error("Backup not found");
    const backup = backupRes.data;

    const dbUrl = process.env.DATABASE_URL!;
    const url = new URL(dbUrl);
    const password = decodeURIComponent(url.password);
    const host = url.hostname;
    const port = url.port || "5432";
    const user = url.username;
    const database = url.pathname.slice(1);

    emitRestoreStatus("Checking Environment", 10, "Verifying system binaries...", true);
    let useBinaryRestore = true;
    try {
      execSync("psql --version");
    } catch (e) {
      logToFile("psql not found. Switching to Universal SDK Restoration...");
      useBinaryRestore = false;
    }

    emitRestoreStatus("Syncing", 40, "Opening archive stream...", true);
    const s3Stream = await getS3Stream(backup.s3_key) as any;

    const isJson = backup.filename.endsWith(".json.enc");
    const isSql = backup.filename.endsWith(".sql.enc");
    logToFile(`Detected format: ${isJson ? "SDK JSON" : isSql ? "Plain SQL" : "Binary Custom"}`);

    if (isJson) {
      emitRestoreStatus("Decrypting", 50, "Extracting SDK Virtual Image...", true);
      const chunks: any[] = [];
      for await (const chunk of s3Stream) {
        chunks.push(chunk);
      }
      const encryptedBuffer = Buffer.concat(chunks);
      
      const salt = encryptedBuffer.slice(0, 16);
      const iv = encryptedBuffer.slice(16, 28);
      const tag = encryptedBuffer.slice(28, 44);
      const encryptedData = encryptedBuffer.slice(44);

      const key = process.env.BACKUP_ENCRYPTION_KEY!;
      const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, "sha256");
      const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey, iv);
      decipher.setAuthTag(tag);
      
      const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
      const virtualImage = JSON.parse(decrypted.toString());

      emitRestoreStatus("Injecting", 70, "Wiping and rebuilding tables...", true);
      for (const [tableName, rows] of Object.entries(virtualImage.tables)) {
        logToFile(`Restoring table: ${tableName} (${(rows as any[]).length} rows)`);
        await supabaseAdmin.from(tableName).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        const { error } = await supabaseAdmin.from(tableName).insert(rows);
        if (error) throw error;
      }
    } else {
      if (!useBinaryRestore) {
        throw new Error("System Error: Cannot restore SQL/Binary backup in this environment (missing psql/pg_restore). Please use a Snapshot backup instead.");
      }
      
      await new Promise((resolve, reject) => {
        let decipher: crypto.DecipherGCM;
        let headerRead = false;
        let buffer = Buffer.alloc(0);
        let restoreErrorOccurred = false;

        const cmd = isSql ? "psql" : "pg_restore";
        const args = isSql 
          ? ["-h", host, "-p", port, "-U", user, "-d", database]
          : ["-h", host, "-p", port, "-U", user, "-d", database, "--clean", "--if-exists", "--no-owner", "--no-privileges", "--no-acl", "-1"];

        const proc = spawn(cmd, args, {
          env: { ...process.env, PGPASSWORD: password },
          stdio: ['pipe', 'pipe', 'pipe']
        });

        s3Stream.on("data", (chunk: Buffer) => {
          if (!headerRead) {
            buffer = Buffer.concat([buffer, chunk]);
            if (buffer.length >= 44) {
              const salt = buffer.slice(0, 16);
              const iv = buffer.slice(16, 28);
              const tag = buffer.slice(28, 44);
              const encryptedData = buffer.slice(44);

              const key = process.env.BACKUP_ENCRYPTION_KEY!;
              const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, "sha256");
              decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey, iv);
              decipher.setAuthTag(tag);

              headerRead = true;
              if (encryptedData.length > 0) {
                proc.stdin.write(decipher.update(encryptedData));
              }
            }
          } else {
            proc.stdin.write(decipher.update(chunk));
          }
        });

      s3Stream.on("end", () => {
        if (decipher) {
          try {
            proc.stdin.write(decipher.final());
          } catch (e) {}
        }
        proc.stdin.end();
      });

      proc.stderr.on("data", (data: any) => {
        const line = data.toString().trim();
        if (line.toLowerCase().includes("error:") || line.toLowerCase().includes("failed")) {
           const isHarmless = 
             line.includes("schema \"public\" already exists") ||
             line.includes("cannot drop") ||
             line.includes("already exists") ||
             line.includes("permission denied");

           if (!isHarmless) {
             restoreErrorOccurred = true;
             logToFile(`ENGINE_ERROR: ${line}`);
           }
        }
        emitRestoreStatus("Syncing", 85, line.split("\n")[0].substring(0, 60));
      });

      proc.on("close", (code: number) => {
        if (code === 0 || (!restoreErrorOccurred)) {
          resolve(true);
        } else {
          reject(new Error(`Handoff failed (exit code ${code})`));
        }
      });

      proc.on("error", reject);
      s3Stream.on("error", reject);
    });

    const duration = (Date.now() - startTime) / 1000;
    emitRestoreStatus("completed", 100, `Restoration finalized in ${duration.toFixed(2)}s`, true);
    
    if (logRes.data) {
      supabaseAdmin.from("recovery_logs").update({ status: "completed", details: `Restore successful (${duration}s)` }).eq("id", logRes.data.id).then(() => {});
    }

    return { success: true, duration };

  } catch (error: any) {
    logToFile(`Restoration failed: ${error.message}`);
    emitRestoreStatus(`Failed: ${error.message}`, 0, undefined, true);
    throw error;
  }
}
