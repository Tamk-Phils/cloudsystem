import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

// ─────────────────────────────────────────────
// POST /api/auth/refresh
// Reads refresh token from HttpOnly cookie and issues a new access token
// ─────────────────────────────────────────────
export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("sb-refresh-token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token found. Please log in again." }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      access_token: data.session.access_token,
    });

    // Rotate the refresh token cookie
    response.cookies.set("sb-refresh-token", data.session.refresh_token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
