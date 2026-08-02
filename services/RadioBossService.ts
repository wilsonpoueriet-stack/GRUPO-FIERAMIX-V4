import "server-only";

import { stationEngine } from "@/core/StationEngine";
import { radioBossApi } from "@/data/radioboss-api";
import type { Station, StationId } from "@/types/station";
import type { NowPlaying } from "@/types/radio";

type RadioBossPayload = {
  title?: string;
  nowplaying?: string;
  listeners?: number | string;
  artwork?: string;
  track?: {
    title?: string;
    artist?: string;
    artwork?: string;
  };
};

export type NowPlayingResult = NowPlaying & {
  source: "radioboss" | "fallback";
  status: "ok" | "not-configured" | "upstream-error";
};

export type AllNowPlayingResult = Record<StationId, NowPlayingResult>;

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

function normalizeListeners(value: number | string | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function createFallback(
  station: Station,
  configured: boolean,
  status: NowPlayingResult["status"],
): NowPlayingResult {
  return {
    title: "Programación en vivo",
    artist: station.name,
    artwork: station.logo,
    listeners: null,
    configured,
    source: "fallback",
    status,
  };
}

function getPrivateConfig(stationId: StationId) {
  return radioBossApi.stations[stationId];
}

async function getNowPlaying(stationId: StationId): Promise<NowPlayingResult> {
  const station = stationEngine.getStation(stationId);

  if (!station) {
    throw new Error(`Emisora no encontrada: ${stationId}`);
  }

  const config = getPrivateConfig(stationId);

  if (!config?.stationId || !radioBossApi.apiKey) {
    return createFallback(station, false, "not-configured");
  }

  const endpoint =
    `${config.apiBase}/api/info/${encodeURIComponent(config.stationId)}` +
    `?key=${encodeURIComponent(radioBossApi.apiKey)}`;

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`RadioBOSS respondió ${response.status}`);
    }

    const payload = (await response.json()) as RadioBossPayload;

    const rawTitle =
      payload.track?.title ??
      payload.nowplaying ??
      payload.title ??
      "Programación en vivo";

    const parsed = splitTrack(rawTitle);

    return {
      title: parsed.title || rawTitle,
      artist: payload.track?.artist || parsed.artist || station.name,
      artwork: payload.track?.artwork || payload.artwork || station.logo,
      listeners: normalizeListeners(payload.listeners),
      configured: true,
      source: "radioboss",
      status: "ok",
    };
  } catch (error) {
    console.error("RadioBOSS now-playing error", {
      stationId,
      message: error instanceof Error ? error.message : "Error desconocido",
    });

    return createFallback(station, true, "upstream-error");
  }
}

async function getAllNowPlaying(): Promise<AllNowPlayingResult> {
  const entries = await Promise.all(
    stationEngine.getStations().map(async (station) => {
      const result = await getNowPlaying(station.id);
      return [station.id, result] as const;
    }),
  );

  return Object.fromEntries(entries) as AllNowPlayingResult;
}

export const radioBossService = {
  getNowPlaying,
  getAllNowPlaying,
};
