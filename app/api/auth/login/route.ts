import { NextRequest, NextResponse } from "next/server";
import { validateCredentials } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = String(body?.email ?? "");
  const password = String(body?.password ?? "");

  const user = validateCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, email: user.email, role: user.role });
  response.cookies.set("autoposter_auth", user.email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
