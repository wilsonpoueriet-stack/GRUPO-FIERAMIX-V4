import { NextRequest, NextResponse } from "next/server";
import { stationEngine } from "@/core/StationEngine";

export const dynamic = "force-dynamic";

type RecentPayload = {
  title?: string;
  trackartist?: string;
  tracktitle?: string;
  artworkid?: string;
  started?: string;
};

type RadioBossPayload = {
  currenttrack?: string;
  currenttrack_artist?: string;
  currenttrack_title?: string;
  listeners?: number;
  recent?: RecentPayload[];
};

const radioBossStations = {
  bachata: {
    server: "c15.radioboss.fm",
    stationId: 221,
  },
} as const;

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

  const apiUrl =
    `${request.nextUrl.origin}/api/radioboss-public` +
    `?server=${encodeURIComponent(radioBossConfig.server)}` +
    `&station=${radioBossConfig.stationId}`;

  try {
    const response = await fetch(apiUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`RadioBOSS respondió ${response.status}`);
    }

    const data = (await response.json()) as RadioBossPayload;

    return NextResponse.json({
      title:
        data.currenttrack_title ||
        data.currenttrack ||
        "Programación en vivo",

      artist:
        data.currenttrack_artist ||
        station.name,

      artwork:
        `https://${radioBossConfig.server}/w/artwork/` +
        `${radioBossConfig.stationId}.jpg?_=${Date.now()}`,

      listeners: data.listeners ?? null,
      configured: true,
      source: "radioboss",
      status: "ok",

      recent: (data.recent ?? []).map((track) => ({
        title:
          track.tracktitle ||
          track.title ||
          "Canción sin título",

        artist:
          track.trackartist ||
          station.name,

        artwork: track.artworkid
          ? `https://${radioBossConfig.server}/w/` +
            `artwork_recent_${track.artworkid}/` +
            `${radioBossConfig.stationId}.jpg`
          : station.logo,

        started: track.started ?? "",
      })),
    });
  } catch (error) {
    console.error("Error cargando RadioBOSS:", error);

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