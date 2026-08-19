import { NextRequest, NextResponse } from "next/server";
import { stationEngine } from "@/core/StationEngine";
import { radioBossStations } from "@/config/radiobossStations";
import {
  getCurrentArtworkUrl,
  getOptimizedArtworkUrl,
  getRecentArtworkUrl,
  getStationData,
} from "@/lib/radioboss";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestedStationId =
    request.nextUrl.searchParams.get("station");

  const station = stationEngine
    .getStations()
    .find((item) => item.id === requestedStationId);

  if (!station) {
    return NextResponse.json(
      { error: "Emisora no encontrada" },
      { status: 404 },
    );
  }

  const portalStationId = station.id;

  const radioBossConfig =
    radioBossStations[
      portalStationId as keyof typeof radioBossStations
    ];

  if (!radioBossConfig) {
    return NextResponse.json({
      title: "Programación en vivo",
      artist: station.name,
      artwork: station.logo,
      listeners: null,
      configured: false,
      source: "fallback",
      status: "not-configured",
      recent: [],
    });
  }

  try {
    const data = await getStationData(radioBossConfig, 10);
    const currentSource = getCurrentArtworkUrl(radioBossConfig);
    const currentKey = `${portalStationId}:${data.currenttrack_artist || ""}:${data.currenttrack_title || data.currenttrack || ""}`;

    return NextResponse.json({
      title:
        data.currenttrack_title ||
        data.currenttrack ||
        "Programación en vivo",

      artist:
        data.currenttrack_artist ||
        station.name,

      artwork: getOptimizedArtworkUrl(currentSource, currentKey),

      listeners: data.listeners ?? null,
      configured: true,
      source: "radioboss",
      status: "ok",

      recent: data.recent.map((track) => {
        const source = getRecentArtworkUrl(
          radioBossConfig,
          track.artworkid,
        );
        const key = `${portalStationId}:${track.artworkid || "current"}:${track.trackartist || ""}:${track.tracktitle || track.title || ""}`;

        return {
          title:
            track.tracktitle ||
            track.title ||
            "Canción sin título",

          artist:
            track.trackartist ||
            station.name,

          artwork: getOptimizedArtworkUrl(source, key),
          started: track.started ?? "",
        };
      }),
    });
  } catch (error) {
    console.error("Error cargando RadioBOSS:", {
      stationId: portalStationId,
      message:
        error instanceof Error
          ? error.message
          : "Error desconocido",
    });

    return NextResponse.json({
      title: "Programación en vivo",
      artist: station.name,
      artwork: station.logo,
      listeners: null,
      configured: false,
      source: "fallback",
      status: "upstream-error",
      recent: [],
    });
  }
}