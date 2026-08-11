import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import { stations } from "../../data/stations";

const STORE_NAME = "fieramix-ranking-history";
const DOMINICAN_TIME_ZONE = "America/Santo_Domingo";
const SCHEDULE = "*/15 * * * *";

type RecentTrackPayload = {
  title?: string;
  artist?: string;
  artwork?: string;
  started?: string;
};

type NowPlayingPayload = {
  title?: string;
  artist?: string;
  artwork?: string;
  recent?: RecentTrackPayload[];
  status?: string;
  source?: string;
};

type StoredPlay = {
  id: string;
  stationId: string;
  stationName: string;
  title: string;
  artist: string;
  artwork: string;
  started: string;
  playedAt: string;
  capturedAt: string;
};

type DailyRankingHistory = {
  version: 1;
  date: string;
  updatedAt: string;
  events: Record<string, StoredPlay>;
};

type CollectorStatus = {
  version: 1;
  lastRunAt: string;
  schedule: string;
  stationsChecked: number;
  stationsSucceeded: number;
  stationsFailed: number;
  playsDetected: number;
  newPlaysStored: number;
  affectedDays: string[];
  errors: Array<{
    stationId: string;
    message: string;
  }>;
};

type DominicanDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isPlayableTrack(title: string, artist: string): boolean {
  const safeTitle = normalize(title);
  const safeArtist = normalize(artist);

  if (!safeTitle || !safeArtist) {
    return false;
  }

  const blockedTitles = new Set([
    "programacion en vivo",
    "en vivo",
    "sin informacion",
    "sin información",
  ]);

  return !blockedTitles.has(safeTitle);
}

function getDominicanParts(date: Date): DominicanDateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: DOMINICAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateKey(parts: Pick<DominicanDateParts, "year" | "month" | "day">): string {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function previousDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() - 1);

  return [
    value.getUTCFullYear(),
    pad(value.getUTCMonth() + 1),
    pad(value.getUTCDate()),
  ].join("-");
}

function resolvePlayedAt(
  started: string,
  capturedAt: Date,
): { dateKey: string; iso: string } | null {
  const safeStarted = clean(started);

  if (!safeStarted) {
    return null;
  }

  const fullDateMatch = safeStarted.match(
    /(\d{4})-(\d{2})-(\d{2})[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );

  if (fullDateMatch) {
    const [, year, month, day, hour, minute, second = "00"] = fullDateMatch;
    const dateKey = `${year}-${month}-${day}`;

    return {
      dateKey,
      iso: `${dateKey}T${pad(Number(hour))}:${minute}:${second}-04:00`,
    };
  }

  const dayFirstMatch = safeStarted.match(
    /(\d{1,2})[./-](\d{1,2})[./-](\d{4})[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );

  if (dayFirstMatch) {
    const [, day, month, year, hour, minute, second = "00"] = dayFirstMatch;
    const dateKey = `${year}-${pad(Number(month))}-${pad(Number(day))}`;

    return {
      dateKey,
      iso: `${dateKey}T${pad(Number(hour))}:${minute}:${second}-04:00`,
    };
  }

  const timeMatch = safeStarted.match(
    /(?:^|\s)(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s|$)/,
  );

  if (!timeMatch) {
    return null;
  }

  const [, rawHour, rawMinute, rawSecond = "00"] = timeMatch;
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  const second = Number(rawSecond);

  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  const nowParts = getDominicanParts(capturedAt);
  const currentMinutes = nowParts.hour * 60 + nowParts.minute;
  const trackMinutes = hour * 60 + minute;

  let dateKey = toDateKey(nowParts);

  // Si estamos justo después de medianoche y RadioBOSS devuelve una canción
  // de las 23:xx dentro del historial reciente, pertenece al día anterior.
  if (trackMinutes > currentMinutes + 120) {
    dateKey = previousDateKey(dateKey);
  }

  return {
    dateKey,
    iso: `${dateKey}T${pad(hour)}:${pad(minute)}:${pad(second)}-04:00`,
  };
}

function createEventId(play: Omit<StoredPlay, "id">): string {
  return [
    play.stationId,
    play.playedAt,
    normalize(play.artist),
    normalize(play.title),
  ].join("::");
}

async function fetchStationRotation(
  baseUrl: string,
  stationId: string,
): Promise<NowPlayingPayload> {
  const endpoint =
    `${baseUrl}/api/now-playing?station=${encodeURIComponent(stationId)}`;

  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: {
      "user-agent": "fieramix-ranking-collector/1.0",
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`API respondió ${response.status}`);
  }

  return (await response.json()) as NowPlayingPayload;
}

async function readDay(
  store: ReturnType<typeof getStore>,
  dateKey: string,
): Promise<DailyRankingHistory> {
  const stored = (await store.get(`days/${dateKey}`, {
    type: "json",
  })) as DailyRankingHistory | null;

  if (
    stored &&
    stored.version === 1 &&
    stored.date === dateKey &&
    stored.events &&
    typeof stored.events === "object"
  ) {
    return stored;
  }

  return {
    version: 1,
    date: dateKey,
    updatedAt: new Date(0).toISOString(),
    events: {},
  };
}

export default async function collectRankings(): Promise<Response> {
  const runStartedAt = new Date();
  const siteUrl = clean(process.env.URL || process.env.DEPLOY_PRIME_URL);

  if (!siteUrl) {
    return Response.json(
      {
        ok: false,
        error:
          "No se encontró URL del sitio en el entorno de Netlify.",
      },
      { status: 500 },
    );
  }

  const baseUrl = siteUrl.replace(/\/+$/, "");
  const store = getStore({
    name: STORE_NAME,
    consistency: "strong",
  });

  const playsByDay = new Map<string, StoredPlay[]>();
  const errors: CollectorStatus["errors"] = [];
  let stationsSucceeded = 0;
  let playsDetected = 0;

  const results = await Promise.allSettled(
    stations.map(async (station) => {
      const payload = await fetchStationRotation(baseUrl, station.id);
      const capturedAt = new Date();
      const capturedAtIso = capturedAt.toISOString();

      const recent = Array.isArray(payload.recent)
        ? payload.recent
        : [];

      const stationEvents: StoredPlay[] = [];

      for (const track of recent) {
        const title = clean(track.title);
        const artist = clean(track.artist);
        const started = clean(track.started);

        if (!isPlayableTrack(title, artist) || !started) {
          continue;
        }

        const played = resolvePlayedAt(started, capturedAt);

        if (!played) {
          continue;
        }

        const withoutId: Omit<StoredPlay, "id"> = {
          stationId: station.id,
          stationName: station.name,
          title,
          artist,
          artwork: clean(track.artwork) || station.logo,
          started,
          playedAt: played.iso,
          capturedAt: capturedAtIso,
        };

        stationEvents.push({
          id: createEventId(withoutId),
          ...withoutId,
        });
      }

      return {
        stationId: station.id,
        events: stationEvents,
      };
    }),
  );

  results.forEach((result, index) => {
    const station = stations[index];

    if (result.status === "rejected") {
      errors.push({
        stationId: station.id,
        message:
          result.reason instanceof Error
            ? result.reason.message
            : "Error desconocido",
      });
      return;
    }

    stationsSucceeded += 1;

    for (const event of result.value.events) {
      playsDetected += 1;

      const dateKey = event.playedAt.slice(0, 10);
      const current = playsByDay.get(dateKey) ?? [];
      current.push(event);
      playsByDay.set(dateKey, current);
    }
  });

  let newPlaysStored = 0;
  const affectedDays: string[] = [];

  for (const [dateKey, candidateEvents] of playsByDay) {
    const day = await readDay(store, dateKey);
    let dayChanged = false;

    for (const event of candidateEvents) {
      if (day.events[event.id]) {
        continue;
      }

      day.events[event.id] = event;
      newPlaysStored += 1;
      dayChanged = true;
    }

    if (!dayChanged) {
      continue;
    }

    day.updatedAt = new Date().toISOString();

    await store.setJSON(`days/${dateKey}`, day, {
      metadata: {
        date: dateKey,
        eventCount: Object.keys(day.events).length,
        updatedAt: day.updatedAt,
      },
    });

    affectedDays.push(dateKey);
  }

  const status: CollectorStatus = {
    version: 1,
    lastRunAt: new Date().toISOString(),
    schedule: SCHEDULE,
    stationsChecked: stations.length,
    stationsSucceeded,
    stationsFailed: stations.length - stationsSucceeded,
    playsDetected,
    newPlaysStored,
    affectedDays: affectedDays.sort(),
    errors,
  };

  await store.setJSON("meta/collector", status, {
    metadata: {
      updatedAt: status.lastRunAt,
      newPlaysStored,
      stationsFailed: status.stationsFailed,
    },
  });

  console.log("FIERAMIX ranking collector", status);

  return Response.json({
    ok: true,
    ...status,
  });
}

export const config: Config = {
  schedule: "*/15 * * * *",
};