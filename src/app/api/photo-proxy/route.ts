import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST = "firebasestorage.googleapis.com";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.hostname !== ALLOWED_HOST) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const upstream = await fetch(url);
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Upstream fetch failed" },
      { status: upstream.status },
    );
  }

  const blob = await upstream.blob();
  return new NextResponse(blob, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
