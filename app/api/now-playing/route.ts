import { NextRequest, NextResponse } from "next/server";
import { stationEngine } from "@/core/StationEngine";
import { radioBossService } from "@/services/RadioBossService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const stationId = stationEngine.parseStationId(
    request.nextUrl.searchParams.get("station"),
  );

  if (!stationId) {
    return NextResponse.json(
      { error: "Emisora no encontrada" },
      { status: 404 },
    );
  }

  const result = await radioBossService.getNowPlaying(stationId);

  return NextResponse.json(result);
}
