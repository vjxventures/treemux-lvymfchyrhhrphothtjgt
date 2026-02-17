import { NextResponse } from "next/server";
import { getCommunities } from "@/lib/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  const communities = await getCommunities();
  return NextResponse.json(communities);
}
