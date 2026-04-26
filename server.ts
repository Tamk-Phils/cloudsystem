import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import cron from "node-cron";
import * as dotenv from "dotenv";
dotenv.config();

import { performDatabaseBackup } from "./lib/backup/engine";
import { sendAlertEmail } from "./lib/alerts";

import { initIO } from "./lib/socket";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = initIO(server);


  // Global socket instance for use in other files if needed
  // For simplicity, we can just broadcast from here
  
  // 1. Automated Backups (Daily at midnight)
  cron.schedule("0 0 * * *", async () => {
    console.log("Running scheduled backup...");
    try {
      io.emit("backup_status", { status: "processing", message: "Daily scheduled backup started" });
      const backup = await performDatabaseBackup();
      io.emit("backup_status", { status: "completed", message: "Daily backup successful", backup });
      
      await sendAlertEmail(
        "Scheduled Backup Success",
        `Daily database backup ${backup.filename} completed successfully.`
      );
    } catch (error: any) {
      io.emit("backup_status", { status: "failed", message: `Daily backup failed: ${error.message}` });
      await sendAlertEmail(
        "Scheduled Backup Failure",
        `Daily database backup failed: ${error.message}`
      );
    }
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
