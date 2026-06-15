import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

// ─────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const { access_token, refresh_token } = data.session;

    // Store refresh token in an HttpOnly cookie (server-side only)
    const response = NextResponse.json({
      success: true,
      access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });

    response.cookies.set("sb-refresh-token", refresh_token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      // secure: true  ← uncomment in production (HTTPS only)
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
