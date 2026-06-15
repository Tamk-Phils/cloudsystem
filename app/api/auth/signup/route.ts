import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

// ─────────────────────────────────────────────
// POST /api/auth/signup
// Body: { email, password }
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm for this system
    });

    if (error) throw error;

    // Insert a row in public.users with default role
    const { error: profileError } = await supabaseAdmin.from("users").upsert({
      id: data.user.id,
      email: data.user.email,
      role: "user",
    });

    if (profileError) throw profileError;

    return NextResponse.json({
      success: true,
      message: "Account created successfully. You can now sign in.",
      userId: data.user.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
