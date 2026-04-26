import { supabaseAdmin } from "@/lib/supabase/admin";
import { performDatabaseBackup } from "@/lib/backup/engine";
import { sendAlertEmail } from "@/lib/alerts";

export async function GET() {
  try {
    const { data: students, error: sErr } = await supabaseAdmin.from("school_students").select("*");
    const { data: staff, error: tErr } = await supabaseAdmin.from("school_staff").select("*");

    if (sErr || tErr) throw sErr || tErr;

    return Response.json({ students, staff });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { type, data } = await req.json();
    const table = type === "student" ? "school_students" : "school_staff";
    
    const { data: record, error } = await supabaseAdmin
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    // Trigger backup in background
    performDatabaseBackup().catch(err => console.error("Auto-backup failed:", err));

    return Response.json(record);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");
    const table = type === "student" ? "school_students" : "school_staff";

    if (!id) throw new Error("ID is required");

    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq("id", id);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

