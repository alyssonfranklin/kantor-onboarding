import { NextRequest, NextResponse } from 'next/server';

interface Params {
  id: string;
}

export async function GET(
  _request: NextRequest,
  context: { params: Params }
) {
  const { id } = context.params;
  return NextResponse.json({ success: true, id, message: 'Test route with ID works' });
}