import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
