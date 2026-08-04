import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token } = body;

  const APP_TOKEN = process.env.APP_TOKEN;

  if (!APP_TOKEN) {
    // No token configured, allow any token
    return NextResponse.json({ ok: true });
  }

  if (token === APP_TOKEN) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
}
