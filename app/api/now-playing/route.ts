import { NextRequest, NextResponse } from "next/server";
import { stations } from "@/data/stations";
import { radioBossApi } from "@/data/radioboss-api";

export const dynamic = "force-dynamic";

type RadioBossPayload = {
  title?: string;
  track?: { title?: string; artist?: string; artwork?: string };
  nowplaying?: string;
  listeners?: number;
  artwork?: string;
};

function splitTrack(value: string) {
  const parts = value.split(" - ");
  if (parts.length > 1) return { artist: parts.shift()?.trim() || "", title: parts.join(" - ").trim() };
  return { artist: "", title: value.trim() };
}

export async function GET(request: NextRequest) {
  const stationId = request.nextUrl.searchParams.get("station") || "";
  const station = stations.find((item) => item.id === stationId);
  if (!station) return NextResponse.json({ error: "Emisora no encontrada" }, { status: 404 });

  const config = radioBossApi.stations[stationId];
  if (!config?.stationId || !radioBossApi.apiKey) {
    return NextResponse.json({
      title: "Programación en vivo",
      artist: station.name,
      artwork: station.logo,
      listeners: null,
      configured: false,
    });
  }

  try {
    const endpoint = `${config.apiBase}/api/info/${config.stationId}?key=${encodeURIComponent(radioBossApi.apiKey)}`;
    const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`RadioBOSS respondió ${response.status}`);
    const payload = (await response.json()) as RadioBossPayload;
    const rawTitle = payload.track?.title || payload.nowplaying || payload.title || "Programación en vivo";
    const parsed = splitTrack(rawTitle);

    return NextResponse.json({
      title: parsed.title || rawTitle,
      artist: payload.track?.artist || parsed.artist || station.name,
      artwork: payload.track?.artwork || payload.artwork || station.logo,
      listeners: typeof payload.listeners === "number" ? payload.listeners : null,
      configured: true,
    });
  } catch {
    return NextResponse.json({
      title: "Programación en vivo",
      artist: station.name,
      artwork: station.logo,
      listeners: null,
      configured: true,
    });
  }
}
