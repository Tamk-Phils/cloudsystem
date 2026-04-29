import { NextResponse } from "next/server";
import { uploadToS3, getPresignedUrl } from "@/lib/aws/s3";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { data: files, error } = await supabaseAdmin
      .from("system_files")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Generate presigned URLs for each file so they can be viewed
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        try {
          const presignedUrl = await getPresignedUrl(file.url);
          return { ...file, presigned_url: presignedUrl };
        } catch (e) {
          return file; // fallback if generating presigned url fails
        }
      })
    );

    return NextResponse.json(filesWithUrls);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const timestamp = Date.now();
    const s3Key = `media/${timestamp}-${file.name}`;
    
    // Upload to S3
    await uploadToS3(s3Key, buffer, file.type || "application/octet-stream");

    // Save to DB
    const { data: newFile, error } = await supabaseAdmin
      .from("system_files")
      .insert({
        filename: file.name,
        size: buffer.length,
        mime_type: file.type || "application/octet-stream",
        url: s3Key, // Storing the S3 key in the url column
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, file: newFile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    // We only delete the database record to simulate a system disaster where data is lost
    // from the operational database. The physical file remains in S3.
    // If the database is restored from a backup, the record will reappear and link back to the S3 file.
    const { error } = await supabaseAdmin
      .from("system_files")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
