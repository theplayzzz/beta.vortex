import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}