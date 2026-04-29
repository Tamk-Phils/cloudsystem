import { exec, execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { encrypt } from "../encryption";
import { uploadToS3 } from "../aws/s3";
import { supabaseAdmin } from "../supabase/admin";
import { getIO } from "../socket";

const execFilePromise = promisify(execFile);

const debugLogPath = path.join("/tmp", "BACKUP_DEBUG.log");
function logToFile(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(debugLogPath, line);
  } catch (e) {
    console.error("Failed to write to debug log:", e);
  }
}

function emitStatus(status: string, progress: number) {
  logToFile(`Status Update: ${status} (${progress}%)`);
  const io = getIO();
  if (io) {
    io.emit("backup_status", { status, progress, timestamp: new Date().toISOString() });
  }
}

/**
 * Performs a database backup using high-reliability SQL format.
 */
export async function performDatabaseBackup(customDescription?: string) {
  logToFile(">>> Starting high-reliability SQL backup...");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  let filename = `db-backup-${timestamp}.sql`;
  let encryptedFilename = `${filename}.enc`;
  const tempPath = path.join("/tmp", filename);

  try {
    // 0. Intelligent Description Generation
    let finalDescription = customDescription;
    if (!finalDescription) {
      try {
        const { data: latestStudents } = await supabaseAdmin
          .from("school_students")
          .select("full_name, created_at")
          .order("created_at", { ascending: false })
          .limit(1);
        
        const { count: studentCount } = await supabaseAdmin.from("school_students").select('*', { count: 'exact', head: true });
        
        if (latestStudents && latestStudents.length > 0) {
           const latest = latestStudents[0];
           finalDescription = `Registry Snapshot: ${latest.full_name} (${studentCount} Total)`;
        } else {
           finalDescription = `Empty Registry Snapshot`;
        }
      } catch (e) {
        finalDescription = "Standard Infrastructure Snapshot";
      }
    }

    const dbUrl = process.env.DATABASE_URL!;
    const url = new URL(dbUrl);
    const password = decodeURIComponent(url.password);
    const host = url.hostname;
    const port = url.port || "5432";
    const user = url.username;
    const database = url.pathname.slice(1);

    emitStatus("Checking Environment", 5);
    let useBinaryDump = true;
    try {
      await execFilePromise("pg_dump", ["--version"]);
    } catch (e) {
      logToFile("pg_dump not found. Switching to Universal Fallback (SDK-based snapshot)...");
      useBinaryDump = false;
    }

    if (useBinaryDump) {
      emitStatus("Generating SQL", 10);
      await execFilePromise(
        "pg_dump",
        [
          "-h", host, "-p", port, "-U", user, "-d", database, 
          "-f", tempPath, 
          "--clean", "--if-exists", "--no-owner", "--no-privileges", "--no-acl", "-n", "public"
        ],
        { env: { ...process.env, PGPASSWORD: password } }
      );
    } else {
      emitStatus("SDK Snapshotting", 15);
      const { data: students } = await supabaseAdmin.from("school_students").select("*");
      const { data: staff } = await supabaseAdmin.from("school_staff").select("*");
      
      const virtualImage = JSON.stringify({
        format: "virtual-image-v1",
        tables: { school_students: students, school_staff: staff },
        timestamp: new Date().toISOString()
      });
      
      fs.writeFileSync(tempPath, virtualImage);
      // Change filename to reflect JSON format
      filename = filename.replace(".sql", ".json");
      encryptedFilename = `${filename}.enc`;
    }

    emitStatus("Encrypting (AES-256)", 60);
    const dumpBuffer = fs.readFileSync(tempPath);
    const encryptedBuffer = encrypt(dumpBuffer, process.env.BACKUP_ENCRYPTION_KEY!);
    const s3Key = `backups/database/${encryptedFilename}`;
    
    emitStatus("Uploading to AWS S3", 80);
    await uploadToS3(s3Key, encryptedBuffer, "application/octet-stream");

    emitStatus("Finalizing record", 95);
    const { data: backup, error: backupError } = await supabaseAdmin
      .from("backups")
      .insert({
        filename: encryptedFilename,
        size: encryptedBuffer.length,
        status: "completed",
        s3_key: s3Key,
        type: "database",
        description: `${finalDescription} ${useBinaryDump ? "(Full SQL)" : "(SDK Snapshot)"}`
      })
      .select()
      .single();

    if (backupError) throw backupError;

    emitStatus("completed", 100);
    return backup;
  } catch (error: any) {
    emitStatus(`Failed: ${error.message}`, 0);
    throw error;
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}
