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
    
    // Encrypt
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY!;
    const encryptedBuffer = encrypt(buffer, encryptionKey);

    // Upload to S3
    const timestamp = Date.now();
    const s3Key = `backups/files/${timestamp}-${file.name}.enc`;
    await uploadToS3(s3Key, encryptedBuffer, "application/octet-stream");

    // Save metadata
    const { data: backup, error } = await supabaseAdmin
      .from("backups")
      .insert({
        filename: `${file.name}.enc`,
        size: encryptedBuffer.length,
        status: "completed",
        s3_key: s3Key,
        type: "files",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, backup });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
