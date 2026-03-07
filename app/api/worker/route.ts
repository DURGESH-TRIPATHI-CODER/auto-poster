import { NextRequest, NextResponse } from "next/server";
import { runScheduler, runWeeklyReminder } from "@/lib/scheduler";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-worker-secret");
  if (!secret || secret !== process.env.WORKER_SECRET) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const mode = body.mode === "reminder" ? "reminder" : "publish";

  if (mode === "reminder") {
    const result = await runWeeklyReminder(new Date());
    return NextResponse.json(result);
  }

  const result = await runScheduler(new Date());
  return NextResponse.json(result);
}