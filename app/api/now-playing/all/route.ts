import { NextResponse } from "next/server";
import { radioBossService } from "@/services/RadioBossService";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await radioBossService.getAllNowPlaying();

  return NextResponse.json(result);
}
