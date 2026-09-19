import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "LIVE_CALLS_NOT_CONFIGURED",
      message:
        "Real calling is not implemented. Use /api/demo/calls for fictional sample data.",
    },
    { status: 501 },
  );
}
