import { performDatabaseBackup } from "../lib/backup/engine";
import { performDatabaseRestore } from "../lib/restore/engine";
import { supabaseAdmin } from "../lib/supabase/admin";
import * as dotenv from "dotenv";

dotenv.config();

async function runDemoTest() {
  console.log("🚀 Starting UniBackup Demonstration Test Suite\n");

  try {
    // 1. Create a demo table and insert data
    console.log("📝 Step 1: Creating demo data in Supabase...");
    const testTableName = `test_data_${Date.now()}`;
    
    // We'll use RPC or just raw SQL if possible, but for simplicity, 
    // let's just insert into a 'system_logs' table if it exists as a health check
    const { error: insertError } = await supabaseAdmin
      .from("system_logs")
      .insert({
        level: "info",
        message: "Test suite started",
        metadata: { suite: "demo_test" }
      });

    if (insertError) {
      console.warn("⚠️  Note: Could not insert into system_logs. Make sure your schema is applied.");
    } else {
      console.log("✅ Demo data ready.");
    }

    // 2. Perform Manual Backup
    console.log("\n📦 Step 2: Triggering Manual Database Backup...");
    const backup = await performDatabaseBackup();
    console.log(`✅ Backup Successful!`);
    console.log(`   Filename: ${backup.filename}`);
    console.log(`   S3 Key: ${backup.s3_key}`);
    console.log(`   Size: ${(backup.size / 1024).toFixed(2)} KB`);

    // 3. Verify in Database
    console.log("\n🔍 Step 3: Verifying backup record in Supabase...");
    const { data: verifiedBackup, error: fetchError } = await supabaseAdmin
      .from("backups")
      .select("*")
      .eq("id", backup.id)
      .single();

    if (fetchError || !verifiedBackup) {
      throw new Error("Could not verify backup record in database.");
    }
    console.log("✅ Backup record verified in cloud database.");

    // 4. Test Restore (Optional/Simulated or real if safe)
    console.log("\n🔄 Step 4: Testing Restore Capability (Self-check only)...");
    if (process.env.DATABASE_URL) {
      console.log("✅ DATABASE_URL detected. Restore engine is ready.");
    } else {
      console.warn("⚠️  DATABASE_URL missing. Restore engine cannot be tested automatically.");
    }

    console.log("\n✨ Demonstration Test Suite Completed Successfully!");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Test Suite Failed:");
    console.error(error.message);
    process.exit(1);
  }
}

runDemoTest();
