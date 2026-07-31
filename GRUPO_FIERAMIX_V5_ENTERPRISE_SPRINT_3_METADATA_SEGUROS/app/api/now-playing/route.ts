import { NextRequest, NextResponse } from "next/server";
import { stations } from "@/data/stations";
import { radioBossApi } from "@/data/radioboss-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type UnknownRecord = Record<string, unknown>;

type NormalizedMetadata = {
  title: string;
  artist: string;
  artwork: string;
  listeners: number | null;
};

const ENV_PREFIXES: Record<string, string> = {
  fieramix: "FIERAMIX",
  "solo-bachata": "SOLO_BACHATA",
  "solo-merengue": "SOLO_MERENGUE",
  "solo-salsa": "SOLO_SALSA",
  "solo-baladas": "SOLO_BALADAS",
  "solo-reggaeton": "SOLO_REGGAETON",
  "solo-rancheras": "SOLO_RANCHERAS",
  "solo-musica-internacional": "SOLO_MUSICA_INTERNACIONAL",
  "solo-musica-cristiana": "SOLO_MUSICA_CRISTIANA",
};

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function splitTrack(value: string): { artist: string; title: string } {
  const separators = [" - ", " – ", " — "];
  for (const separator of separators) {
    const index = value.indexOf(separator);
    if (index > 0) {
      return {
        artist: value.slice(0, index).trim(),
        title: value.slice(index + separator.length).trim(),
      };
    }
  }
  return { artist: "", title: value.trim() };
}

function normalizePayload(payload: unknown, stationName: string, fallbackArtwork: string): NormalizedMetadata {
  const root = asRecord(payload);
  const track = asRecord(root.track);
  const currentTrack = asRecord(root.current_track);
  const nowPlayingObject = asRecord(root.now_playing);
  const song = asRecord(root.song);

  const rawCombined =
    asString(track.title) ||
    asString(currentTrack.title) ||
    asString(nowPlayingObject.title) ||
    asString(song.title) ||
    asString(root.nowplaying) ||
    asString(root.now_playing) ||
    asString(root.currentSong) ||
    asString(root.title) ||
    "Programación en vivo";

  const parsed = splitTrack(rawCombined);

  const artist =
    asString(track.artist) ||
    asString(currentTrack.artist) ||
    asString(nowPlayingObject.artist) ||
    asString(song.artist) ||
    asString(root.artist) ||
    parsed.artist ||
    stationName;

  const title = parsed.title || rawCombined || "Programación en vivo";

  const artwork =
    asString(track.artwork) ||
    asString(track.cover) ||
    asString(currentTrack.artwork) ||
    asString(currentTrack.cover) ||
    asString(nowPlayingObject.artwork) ||
    asString(nowPlayingObject.cover) ||
    asString(song.artwork) ||
    asString(song.cover) ||
    asString(root.artwork) ||
    asString(root.cover) ||
    asString(root.album_art) ||
    fallbackArtwork;

  const listeners =
    asNumber(root.listeners) ??
    asNumber(root.listener_count) ??
    asNumber(root.current_listeners) ??
    asNumber(asRecord(root.stats).listeners) ??
    null;

  return { title, artist, artwork, listeners };
}

function buildEndpoint(apiBase: string, stationId: string, apiKey: string): string {
  const template =
    process.env.RADIOBOSS_ENDPOINT_TEMPLATE ||
    "{apiBase}/api/info/{stationId}?key={apiKey}";

  return template
    .replaceAll("{apiBase}", apiBase.replace(/\/$/, ""))
    .replaceAll("{stationId}", encodeURIComponent(stationId))
    .replaceAll("{apiKey}", encodeURIComponent(apiKey));
}

function getStationConfig(stationSlug: string) {
  const prefix = ENV_PREFIXES[stationSlug];
  const fallback = radioBossApi.stations[stationSlug];

  return {
    apiKey: process.env.RADIOBOSS_API_KEY?.trim() || "",
    apiBase:
      (prefix ? process.env[`RADIOBOSS_${prefix}_API_BASE`]?.trim() : "") ||
      fallback?.apiBase ||
      "",
    stationId:
      (prefix ? process.env[`RADIOBOSS_${prefix}_STATION_ID`]?.trim() : "") ||
      fallback?.stationId ||
      "",
  };
}

function fallbackResponse(station: (typeof stations)[number], configured: boolean, serviceOnline: boolean) {
  return NextResponse.json(
    {
      title: "Programación en vivo",
      artist: station.name,
      artwork: station.logo,
      listeners: null,
      configured,
      serviceOnline,
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

export async function GET(request: NextRequest) {
  const stationSlug = request.nextUrl.searchParams.get("station") || "";
  const station = stations.find((item) => item.id === stationSlug);

  if (!station) {
    return NextResponse.json({ error: "Emisora no encontrada" }, { status: 404 });
  }

  const config = getStationConfig(stationSlug);
  const configured = Boolean(config.apiKey && config.apiBase && config.stationId);

  if (!configured) return fallbackResponse(station, false, false);

  try {
    const endpoint = buildEndpoint(config.apiBase, config.stationId, config.apiKey);
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error(`RadioBOSS ${stationSlug}: HTTP ${response.status}`);
      return fallbackResponse(station, true, false);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.error(`RadioBOSS ${stationSlug}: respuesta no JSON`);
      return fallbackResponse(station, true, false);
    }

    const payload: unknown = await response.json();
    const metadata = normalizePayload(payload, station.name, station.logo);

    return NextResponse.json(
      {
        ...metadata,
        configured: true,
        serviceOnline: true,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(`RadioBOSS ${stationSlug}:`, error instanceof Error ? error.message : error);
    return fallbackResponse(station, true, false);
  }
}
