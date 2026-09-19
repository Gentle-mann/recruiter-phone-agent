import { NextResponse } from "next/server";
import { createDemoInterview, demoRequestSchema } from "@/lib/demo";

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > 1024) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }
  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    return NextResponse.json(
      { error: "Expected a JSON request." },
      { status: 400 },
    );
  }
  const parsed = demoRequestSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a demo scenario and confirm the demo notice." },
      { status: 400 },
    );
  }
  return NextResponse.json(
    { interview: createDemoInterview(parsed.data) },
    { status: 201 },
  );
}
