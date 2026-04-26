import { supabaseAdmin } from "@/lib/supabase/admin";
import { downloadFromS3, getPresignedUrl } from "@/lib/aws/s3";
import { decrypt } from "@/lib/encryption";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const encrypted = searchParams.get("encrypted") === "true";

    if (!id) {
      return Response.json({ error: "Backup ID is required" }, { status: 400 });
    }

    // 1. Get backup details from Supabase
    const { data: backup, error } = await supabaseAdmin
      .from("backups")
      .select("s3_key, filename")
      .eq("id", id)
      .single();

    if (error || !backup) {
      return Response.json({ error: "Backup not found" }, { status: 404 });
    }

    // 2. If user wants the raw encrypted version, redirect to presigned URL (faster)
    if (encrypted) {
      const signedUrl = await getPresignedUrl(backup.s3_key);
      return Response.json({ url: signedUrl });
    }

    // 3. Otherwise, download and decrypt
    const encryptedBuffer = await downloadFromS3(backup.s3_key);
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY!;
    const decryptedBuffer = decrypt(encryptedBuffer, encryptionKey);

    const originalFilename = backup.filename.replace(".enc", "");

    // Convert Buffer to Uint8Array for BodyInit compatibility
    const body = new Uint8Array(decryptedBuffer);

    return new Response(body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${originalFilename}"`,
        "Content-Length": decryptedBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Download failed:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
