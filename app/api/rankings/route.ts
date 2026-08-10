import { getStore } from "@netlify/blobs";
import { stations } from "@/data/stations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORE_NAME = "fieramix-ranking-history";
const DOMINICAN_TIME_ZONE = "America/Santo_Domingo";

type RankingPeriod = "actual" | "weekly" | "monthly" | "annual";

type RankingPeriodConfig = {
  id: RankingPeriod;
  label: string;
  limit: number;
  days: number | null;
};

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
  listeners?: number | null;
  recent?: RecentTrackPayload[];
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
  version?: number;
  lastRunAt?: string;
  stationsChecked?: number;
  stationsSucceeded?: number;
  stationsFailed?: number;
  newPlaysStored?: number;
};

type HistoricalAggregate = {
  title: string;
  artist: string;
  artwork: string;
  plays: number;
  stationIds: Set<string>;
  stationNames: Set<string>;
  lastPlayedAt: string;
};

type ActualAggregate = {
  title: string;
  artist: string;
  artwork: string;
  score: number;
  rotations: number;
  stationIds: Set<string>;
  stationNames: Set<string>;
  liveStationIds: Set<string>;
  listeners: number;
};

const periodConfig: Record<RankingPeriod, RankingPeriodConfig> = {
  actual: {
    id: "actual",
    label: "TOP 25 ACTUAL",
    limit: 25,
    days: null,
  },
  weekly: {
    id: "weekly",
    label: "TOP 25 SEMANAL",
    limit: 25,
    days: 7,
  },
  monthly: {
    id: "monthly",
    label: "TOP 50 MENSUAL",
    limit: 50,
    days: 30,
  },
  annual: {
    id: "annual",
    label: "TOP 100 ANUAL",
    limit: 100,
    days: 365,
  },
};

function getRankingLimit(
  period: RankingPeriod,
  stationFilter: string | null,
): number {
  if (!stationFilter) {
    return periodConfig[period].limit;
  }

  if (period === "actual") {
    return 10;
  }

  return periodConfig[period].limit;
}

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

function trackKey(title: string, artist: string): string {
  return `${normalize(title)}::${normalize(artist)}`;
}

function isPlayableTrack(title: string, artist: string): boolean {
  const safeTitle = normalize(title);
  const safeArtist = normalize(artist);

  if (!safeTitle || !safeArtist) {
    return false;
  }

  return ![
    "programacion en vivo",
    "en vivo",
    "sin informacion",
  ].includes(safeTitle);
}

function dominicanDateKey(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: DOMINICAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function subtractDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() - days);

  return [
    value.getUTCFullYear(),
    String(value.getUTCMonth() + 1).padStart(2, "0"),
    String(value.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function rankingResponse(
  body: Record<string, unknown>,
  maxAgeSeconds: number,
): Response {
  return Response.json(body, {
    headers: {
      "Cache-Control":
        `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds}`,
    },
  });
}

async function fetchStationNowPlaying(
  baseUrl: string,
  stationId: string,
): Promise<NowPlayingPayload> {
  const response = await fetch(
    `${baseUrl}/api/now-playing?station=${encodeURIComponent(stationId)}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Now Playing respondió ${response.status}`);
  }

  return (await response.json()) as NowPlayingPayload;
}

async function buildActualRanking(
  request: Request,
  stationFilter: string | null,
): Promise<Response> {
  const config = periodConfig.actual;
  const baseUrl = new URL(request.url).origin;
  const aggregate = new Map<string, ActualAggregate>();
  const stationErrors: Array<{ stationId: string; message: string }> = [];

  const rankingStations = stationFilter
    ? stations.filter((station) => station.id === stationFilter)
    : stations;

  const results = await Promise.allSettled(
    rankingStations.map(async (station) => {
      const payload = await fetchStationNowPlaying(baseUrl, station.id);

      return {
        station,
        payload,
      };
    }),
  );

  results.forEach((result, stationIndex) => {
    const station = rankingStations[stationIndex];

    if (result.status === "rejected") {
      stationErrors.push({
        stationId: station.id,
        message:
          result.reason instanceof Error
            ? result.reason.message
            : "Error desconocido",
      });
      return;
    }

    const { payload } = result.value;
    const listeners =
      typeof payload.listeners === "number"
        ? Math.max(payload.listeners, 0)
        : 0;

    const candidates: Array<{
      title: string;
      artist: string;
      artwork: string;
      position: number;
      live: boolean;
    }> = [];

    if (
      isPlayableTrack(
        clean(payload.title),
        clean(payload.artist),
      )
    ) {
      candidates.push({
        title: clean(payload.title),
        artist: clean(payload.artist),
        artwork: clean(payload.artwork) || station.logo,
        position: 0,
        live: true,
      });
    }

    (payload.recent ?? []).slice(0, 15).forEach((track, index) => {
      const title = clean(track.title);
      const artist = clean(track.artist);

      if (!isPlayableTrack(title, artist)) {
        return;
      }

      candidates.push({
        title,
        artist,
        artwork: clean(track.artwork) || station.logo,
        position: index + 1,
        live: false,
      });
    });

    const seenAtStation = new Set<string>();

    candidates.forEach((track) => {
      const key = trackKey(track.title, track.artist);

      if (seenAtStation.has(key)) {
        return;
      }

      seenAtStation.add(key);

      const recencyPoints = Math.max(4, 28 - track.position * 2);
      const livePoints = track.live ? 55 : 0;
      const audiencePoints = Math.min(listeners, 250);
      const contribution =
        livePoints + recencyPoints + audiencePoints;

      const existing = aggregate.get(key);

      if (existing) {
        existing.score += contribution;
        existing.rotations += 1;
        existing.stationIds.add(station.id);
        existing.stationNames.add(station.name);
        existing.listeners += listeners;

        if (track.live) {
          existing.liveStationIds.add(station.id);
        }

        if (!existing.artwork && track.artwork) {
          existing.artwork = track.artwork;
        }

        return;
      }

      aggregate.set(key, {
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
        score: contribution,
        rotations: 1,
        stationIds: new Set([station.id]),
        stationNames: new Set([station.name]),
        liveStationIds: new Set(track.live ? [station.id] : []),
        listeners,
      });
    });
  });

  const ranking = [...aggregate.values()]
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      if (second.stationIds.size !== first.stationIds.size) {
        return second.stationIds.size - first.stationIds.size;
      }

      return second.liveStationIds.size - first.liveStationIds.size;
    })
    .slice(0, getRankingLimit("actual", stationFilter))
    .map((track, index) => ({
      position: index + 1,
      title: track.title,
      artist: track.artist,
      artwork: track.artwork,
      score: track.score,
      rotations: track.rotations,
      stationCount: track.stationIds.size,
      stationIds: [...track.stationIds],
      stationNames: [...track.stationNames],
      liveStationCount: track.liveStationIds.size,
      liveStationIds: [...track.liveStationIds],
      listeners: track.listeners,
    }));

  return rankingResponse(
    {
      ok: true,
      period: config.id,
      label: config.label,
      limit: getRankingLimit("actual", stationFilter),
      station: stationFilter,
      stationName:
        stationFilter
          ? stations.find((station) => station.id === stationFilter)?.name ?? null
          : null,
      scope: stationFilter ? "station" : "network",
      generatedAt: new Date().toISOString(),
      source: "live-rotation",
      isOfficial: true,
      available: ranking.length > 0,
      stationsChecked: rankingStations.length,
      stationsFailed: stationErrors.length,
      errors: stationErrors,
      ranking,
    },
    30,
  );
}

async function readJson<T>(
  store: ReturnType<typeof getStore>,
  key: string,
): Promise<T | null> {
  const value = await store.get(key, {
    consistency: "strong",
    type: "json",
  });

  return (value ?? null) as T | null;
}

async function readDaysInBatches(
  store: ReturnType<typeof getStore>,
  keys: string[],
): Promise<DailyRankingHistory[]> {
  const days: DailyRankingHistory[] = [];
  const batchSize = 20;

  for (let index = 0; index < keys.length; index += batchSize) {
    const batch = keys.slice(index, index + batchSize);

    const values = await Promise.all(
      batch.map((key) =>
        readJson<DailyRankingHistory>(store, key),
      ),
    );

    values.forEach((value) => {
      if (
        value &&
        value.version === 1 &&
        value.events &&
        typeof value.events === "object"
      ) {
        days.push(value);
      }
    });
  }

  return days;
}

async function buildHistoricalRanking(
  period: Exclude<RankingPeriod, "actual">,
  stationFilter: string | null,
): Promise<Response> {
  const config = periodConfig[period];
  const windowDays = config.days ?? 0;
  const todayKey = dominicanDateKey();
  const startKey = subtractDays(todayKey, windowDays - 1);

  try {
    const store = getStore({
      name: STORE_NAME,
      consistency: "strong",
    });

    const [{ blobs }, collector] = await Promise.all([
      store.list({ prefix: "days/" }),
      readJson<CollectorStatus>(store, "meta/collector"),
    ]);

    const allDayKeys = blobs
      .map((blob) => blob.key)
      .filter((key) => /^days\/\d{4}-\d{2}-\d{2}$/.test(key))
      .sort();

    const selectedKeys = allDayKeys.filter((key) => {
      const dateKey = key.slice("days/".length);
      return dateKey >= startKey && dateKey <= todayKey;
    });

    const storedDays = await readDaysInBatches(
      store,
      selectedKeys,
    );

    const aggregate = new Map<string, HistoricalAggregate>();
    let totalPlays = 0;

    storedDays.forEach((day) => {
      Object.values(day.events).forEach((event) => {
        if (stationFilter && event.stationId !== stationFilter) {
          return;
        }

        const title = clean(event.title);
        const artist = clean(event.artist);

        if (!isPlayableTrack(title, artist)) {
          return;
        }

        totalPlays += 1;

        const key = trackKey(title, artist);
        const existing = aggregate.get(key);

        if (existing) {
          existing.plays += 1;
          existing.stationIds.add(event.stationId);
          existing.stationNames.add(event.stationName);

          if (
            event.playedAt &&
            event.playedAt > existing.lastPlayedAt
          ) {
            existing.lastPlayedAt = event.playedAt;

            if (event.artwork) {
              existing.artwork = event.artwork;
            }
          }

          return;
        }

        aggregate.set(key, {
          title,
          artist,
          artwork: clean(event.artwork),
          plays: 1,
          stationIds: new Set([event.stationId]),
          stationNames: new Set([event.stationName]),
          lastPlayedAt: event.playedAt,
        });
      });
    });

    const ranking = [...aggregate.values()]
      .sort((first, second) => {
        if (second.plays !== first.plays) {
          return second.plays - first.plays;
        }

        if (second.stationIds.size !== first.stationIds.size) {
          return second.stationIds.size - first.stationIds.size;
        }

        return second.lastPlayedAt.localeCompare(
          first.lastPlayedAt,
        );
      })
      .slice(0, getRankingLimit(period, stationFilter))
      .map((track, index) => ({
        position: index + 1,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
        plays: track.plays,
        stationCount: track.stationIds.size,
        stationIds: [...track.stationIds],
        stationNames: [...track.stationNames],
        lastPlayedAt: track.lastPlayedAt,
      }));

    const oldestStoredDate =
      allDayKeys.length > 0
        ? allDayKeys[0].slice("days/".length)
        : null;

    const newestStoredDate =
      allDayKeys.length > 0
        ? allDayKeys[allDayKeys.length - 1].slice(
            "days/".length,
          )
        : null;

    const isOfficial =
      oldestStoredDate !== null &&
      oldestStoredDate <= startKey;

    const historyDays = storedDays.length;
    const coveragePercent = Math.min(
      100,
      Math.round((historyDays / windowDays) * 100),
    );

    return rankingResponse(
      {
        ok: true,
        period: config.id,
        label: config.label,
        limit: getRankingLimit(period, stationFilter),
        station: stationFilter,
        stationName:
          stationFilter
            ? stations.find((station) => station.id === stationFilter)?.name ?? null
            : null,
        scope: stationFilter ? "station" : "network",
        windowDays,
        windowStart: startKey,
        windowEnd: todayKey,
        generatedAt: new Date().toISOString(),
        source: "persistent-history",
        available: ranking.length > 0,
        isOfficial,
        historyDays,
        coveragePercent,
        oldestStoredDate,
        newestStoredDate,
        totalPlays,
        uniqueSongs: aggregate.size,
        collectorLastRunAt: collector?.lastRunAt ?? null,
        collectorStatus: collector ?? null,
        ranking,
      },
      300,
    );
  } catch (error) {
    return rankingResponse(
      {
        ok: false,
        period: config.id,
        label: config.label,
        limit: getRankingLimit(period, stationFilter),
        station: stationFilter,
        stationName:
          stationFilter
            ? stations.find((station) => station.id === stationFilter)?.name ?? null
            : null,
        scope: stationFilter ? "station" : "network",
        windowDays,
        windowStart: startKey,
        windowEnd: todayKey,
        generatedAt: new Date().toISOString(),
        source: "persistent-history",
        available: false,
        isOfficial: false,
        historyDays: 0,
        coveragePercent: 0,
        ranking: [],
        error:
          error instanceof Error
            ? error.message
            : "No fue posible leer el historial persistente.",
        hint:
          "En desarrollo local, los Blobs del sitio se prueban con Netlify Dev. En producción se conectan automáticamente al proyecto desplegado.",
      },
      30,
    );
  }
}

function isRankingPeriod(value: string | null): value is RankingPeriod {
  return (
    value === "actual" ||
    value === "weekly" ||
    value === "monthly" ||
    value === "annual"
  );
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const requestedPeriod = url.searchParams.get("period");
  const requestedStation = clean(url.searchParams.get("station"));

  const period: RankingPeriod = isRankingPeriod(requestedPeriod)
    ? requestedPeriod
    : "actual";

  const stationFilter = requestedStation || null;

  if (
    stationFilter &&
    !stations.some((station) => station.id === stationFilter)
  ) {
    return Response.json(
      {
        ok: false,
        error: "Emisora no encontrada.",
        station: stationFilter,
        validStations: stations.map((station) => ({
          id: station.id,
          name: station.name,
        })),
      },
      { status: 404 },
    );
  }

  if (period === "actual") {
    return buildActualRanking(request, stationFilter);
  }

  return buildHistoricalRanking(period, stationFilter);
}
