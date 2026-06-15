import { NextResponse } from "next/server";

// ─────────────────────────────────────────────
// POST /api/auth/logout
// Clears the refresh token cookie
// ─────────────────────────────────────────────
export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully." });

  response.cookies.set("sb-refresh-token", "", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0, // immediately expire the cookie
  });

  return response;
}
