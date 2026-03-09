// app/api/example/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/new-path', request.url));
}