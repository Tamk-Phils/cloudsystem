import { performDatabaseBackup } from "@/lib/backup/engine";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-api-key");
    const expectedKey = process.env.EXTERNAL_API_KEY;

    if (!authHeader || authHeader !== expectedKey) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Trigger backup in the background
    // We don't await it here if we want to return immediately, 
    // but the user asked for a "proper walkthrough" so let's await it for the demo.
    const backup = await performDatabaseBackup();

    return Response.json({ 
      success: true, 
      message: "Backup completed successfully via external link",
      backup: {
        filename: backup.filename,
        size: backup.size,
        id: backup.id
      }
    });
  } catch (error: any) {
    console.error("External backup failed:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
