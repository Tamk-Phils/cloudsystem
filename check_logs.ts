import { supabaseAdmin } from "./lib/supabase/admin";

async function checkLogs() {
  const { data: logs, error: lErr } = await supabaseAdmin
    .from("system_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: backups, error: bErr } = await supabaseAdmin
    .from("backups")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  console.log("--- RECENT LOGS ---");
  console.log(JSON.stringify(logs, null, 2));
  console.log("--- RECENT BACKUPS ---");
  console.log(JSON.stringify(backups, null, 2));
}

checkLogs().catch(console.error);
