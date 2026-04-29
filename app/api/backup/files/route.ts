import { NextResponse } from "next/server";
import { encrypt } from "@/lib/encryption";
import { uploadToS3 } from "@/lib/aws/s3";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Check if the user is uploading an already encrypted database backup
    const isDatabaseBackup = file.name.startsWith("db-backup-") && file.name.endsWith(".enc");
    
    // Encrypt only if it's a regular file
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY!;
    const finalBuffer = isDatabaseBackup ? buffer : encrypt(buffer, encryptionKey);

    // Upload to S3
    const timestamp = Date.now();
    const finalFilename = isDatabaseBackup ? file.name : `${file.name}.enc`;
    const s3Key = `backups/${isDatabaseBackup ? 'database' : 'files'}/${timestamp}-${finalFilename}`;
    
    await uploadToS3(s3Key, finalBuffer, "application/octet-stream");

    // Save metadata
    const { data: backup, error } = await supabaseAdmin
      .from("backups")
      .insert({
        filename: finalFilename,
        size: finalBuffer.length,
        status: "completed",
        s3_key: s3Key,
        type: isDatabaseBackup ? "database" : "files",
        description: isDatabaseBackup ? "Uploaded Backup Archive" : "Uploaded File"
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, backup });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
