import { NextResponse } from "next/server";

export async function POST() {
  // Do not acknowledge delivery until signature validation and durable processing exist.
  return NextResponse.json(
    { error: "WEBHOOK_NOT_CONFIGURED" },
    { status: 501 },
  );
}
