import { NextResponse } from "next/server";
import { PostModel } from "@/models/Post";

function getClientIPFromHeaders(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real;
  const client = headers.get("x-client-ip");
  if (client) return client;
  return null;
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const location = body.location || null;

    const ip = getClientIPFromHeaders(req.headers) || req.headers.get('cf-connecting-ip') || null;

    if (!location || (!location.lat && !location.lon)) {
      return NextResponse.json({ success: false, message: 'Location required to register share' }, { status: 400 });
    }

    if (!ip) {
      return NextResponse.json({ success: false, message: 'IP address not detected' }, { status: 400 });
    }

    // `id` may be a slug or an ObjectId string; try to increment by slug first
    const result = await PostModel.incrementShareCount(id, ip, location);

    return NextResponse.json({ success: true, incremented: result.incremented });
  } catch (err) {
    console.error("Share API error:", err);
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}
