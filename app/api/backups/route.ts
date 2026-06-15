import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth, isAuthError } from "@/lib/supabase/auth";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  console.log("GET /api/backups triggered");
  try {
    const { data: backups, error } = await supabaseAdmin
      .from("backups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error in /api/backups:", error);
      throw error;
    }

    console.log(`Fetched ${backups?.length || 0} backups`);
    return Response.json(backups || []);
  } catch (error: any) {
    console.error("Crash in /api/backups:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
