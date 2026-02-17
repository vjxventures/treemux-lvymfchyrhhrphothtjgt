import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export async function GET() {
  try {
    seedDatabase();
    return NextResponse.json({ success: true, message: "Database seeded" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
