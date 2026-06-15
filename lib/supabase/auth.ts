import { NextResponse } from "next/server";
import { supabaseAdmin } from "./admin";

/**
 * Verifies the Bearer token in the Authorization header.
 * Returns the authenticated user, or sends a 401 response.
 */
export async function requireAuth(
  req: Request
): Promise<{ user: { id: string; email?: string; role?: string } } | NextResponse> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
  }

  // Fetch role from public.users table
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      role: profile?.role ?? "user",
    },
  };
}

/**
 * Helper: returns true if requireAuth result is a NextResponse (i.e., auth failed).
 */
export function isAuthError(
  result: { user: any } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
