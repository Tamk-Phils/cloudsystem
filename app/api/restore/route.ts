import { NextResponse } from "next/server";
import { performDatabaseRestore } from "@/lib/restore/engine";
import { sendAlertEmail } from "@/lib/alerts";

export async function POST(req: Request) {
  try {
    const { backupId } = await req.json();
    
    if (!backupId) {
      return Response.json({ error: "Backup ID is required" }, { status: 400 });
    }

    await performDatabaseRestore(backupId);
    
    // Send success alert
    await sendAlertEmail(
      "Restore Success",
      `Database restore for backup ${backupId} completed successfully.`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Send failure alert
    await sendAlertEmail(
      "Restore Failure",
      `Database restore failed: ${error.message}`
    );

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
