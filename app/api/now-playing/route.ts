import { NextRequest, NextResponse } from "next/server";
import { stations } from "@/data/stations";
import { radioBossApi } from "@/data/radioboss-api";

export const dynamic = "force-dynamic";

type RadioBossPayload = {
  title?: string;
  nowplaying?: string;
  listeners?: number;
  artwork?: string;
  track?: {
    title?: string;
    artist?: string;
    artwork?: string;
  };
};

function splitTrack(value: string) {
  const separator = value.indexOf(" - ");

  if (separator < 0) {
    return {
      artist: "",
      title: value.trim(),
    };
  }

  return {
    artist: value.slice(0, separator).trim(),
    title: value.slice(separator + 3).trim(),
  };
}

function getFallback(stationId: string, configured: boolean) {
  const station = stations.find((item) => item.id === stationId);

  return {
    title: "Programación en vivo",
    artist: station?.name ?? "GRUPO FIERAMIX.COM",
    artwork: station?.logo ?? "/logos/grupo-fieramix.png",
    listeners: null,
    configured,
  };
}

export async function GET(request: NextRequest) {
  const stationId = request.nextUrl.searchParams.get("station") ?? "";
  const station = stations.find((item) => item.id === stationId);

  if (!station) {
    return NextResponse.json(
      {
        error: "Emisora no encontrada",
        station: stationId,
      },
      { status: 404 },
    );
  }

  const stationKey = stationId as keyof typeof radioBossApi.stations;
  const config = radioBossApi.stations[stationKey];

  if (!config?.stationId || !radioBossApi.apiKey) {
    return NextResponse.json({
      ...getFallback(stationId, false),
      diagnostic: {
        hasApiKey: Boolean(radioBossApi.apiKey),
        hasStationId: Boolean(config?.stationId),
        apiBase: config?.apiBase ?? null,
      },
    });
  }

  const endpoint =
    `${config.apiBase}/api/info/${encodeURIComponent(config.stationId)}` +
    `?key=${encodeURIComponent(radioBossApi.apiKey)}`;

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          ...getFallback(stationId, true),
          diagnostic: {
            success: false,
            status: response.status,
            statusText: response.statusText,
            radioBossResponse: responseText.slice(0, 300),
            apiBase: config.apiBase,
            stationId: config.stationId,
          },
        },
        { status: 502 },
      );
    }

    let payload: RadioBossPayload;

    try {
      payload = JSON.parse(responseText) as RadioBossPayload;
    } catch {
      return NextResponse.json(
        {
          ...getFallback(stationId, true),
          diagnostic: {
            success: false,
            error: "RadioBOSS no devolvió un JSON válido",
            radioBossResponse: responseText.slice(0, 300),
            apiBase: config.apiBase,
            stationId: config.stationId,
          },
        },
        { status: 502 },
      );
    }

    const rawTitle =
      payload.track?.title ??
      payload.nowplaying ??
      payload.title ??
      "Programación en vivo";

    const parsed = splitTrack(rawTitle);

    return NextResponse.json({
      title: parsed.title || rawTitle,
      artist: payload.track?.artist || parsed.artist || station.name,
      artwork: payload.track?.artwork || payload.artwork || station.logo,
      listeners:
        typeof payload.listeners === "number" ? payload.listeners : null,
      configured: true,
      diagnostic: {
        success: true,
        apiBase: config.apiBase,
        stationId: config.stationId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ...getFallback(stationId, true),
        diagnostic: {
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
          apiBase: config.apiBase,
          stationId: config.stationId,
        },
      },
      { status: 502 },
    );
  }
}