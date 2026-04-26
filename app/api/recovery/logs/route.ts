import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("recovery_logs")
      .select(`
        *,
        backups (
          filename,
          description
        )
      `)
      .order("restored_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Recovery logs API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
