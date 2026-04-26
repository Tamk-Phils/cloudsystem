import { NextResponse } from "next/server";
import { performDatabaseBackup } from "@/lib/backup/engine";
import { sendAlertEmail } from "@/lib/alerts";

export async function POST() {
  console.log("POST /api/backup/manual triggered");
  try {
    const backup = await performDatabaseBackup();
    console.log("Database backup engine finished successfully:", backup.filename);
    
    // Send success alert
    await sendAlertEmail(
      "Backup Success",
      `Manual database backup ${backup.filename} completed successfully.`
    );

    return Response.json({ 
      success: true, 
      backup 
    });
  } catch (error: any) {
    console.error("Manual backup failed in API route:", error);
    // Send failure alert
    await sendAlertEmail(
      "Backup Failure",
      `Manual database backup failed: ${error.message}`
    );

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
