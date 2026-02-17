import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  db.prepare('UPDATE connections SET status = ? WHERE id = ?').run('accepted', id);
  return NextResponse.json({ success: true });
}
