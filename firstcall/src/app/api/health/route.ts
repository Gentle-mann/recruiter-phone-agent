export async function GET() {
  return Response.json({ status: "ok", mode: "demo", liveCallsEnabled: false });
}
