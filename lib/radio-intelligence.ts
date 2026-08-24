import { getStore } from "@netlify/blobs";
import { stations } from "@/data/stations";

const STORE_NAME = "fieramix-ranking-history";
const DOMINICAN_TIME_ZONE = "America/Santo_Domingo";

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

export type RadioIntelligenceTrack = {
  title: string;
  artist: string;
  plays: number;
  stationIds: string[];
  stationNames: string[];
  lastPlayedAt: string;
};

export type RadioIntelligenceSearchResult = {
  found: boolean;
  query: string;
  matches: RadioIntelligenceTrack[];
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeRadioText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

async function readHistory(days: number): Promise<DailyRankingHistory[]> {
  const store = getStore({
    name: STORE_NAME,
    consistency: "strong",
  });

  const today = dominicanDateKey();
  const start = subtractDays(today, Math.max(0, days - 1));
  const { blobs } = await store.list({ prefix: "days/" });

  const keys = blobs
    .map((blob) => blob.key)
    .filter((key) => /^days\/\d{4}-\d{2}-\d{2}$/.test(key))
    .filter((key) => {
      const date = key.slice("days/".length);
      return date >= start && date <= today;
    })
    .sort();

  const history = await Promise.all(
    keys.map(async (key) => {
      const value = await store.get(key, {
        consistency: "strong",
        type: "json",
      });

      return value as DailyRankingHistory | null;
    }),
  );

  return history.filter(
    (day): day is DailyRankingHistory =>
      Boolean(day?.version === 1 && day.events),
  );
}

function aggregateHistory(
  history: DailyRankingHistory[],
  stationId?: string,
): RadioIntelligenceTrack[] {
  const aggregate = new Map<
    string,
    RadioIntelligenceTrack & {
      stationIdSet: Set<string>;
      stationNameSet: Set<string>;
    }
  >();

  for (const day of history) {
    for (const event of Object.values(day.events)) {
      if (stationId && event.stationId !== stationId) continue;

      const title = clean(event.title);
      const artist = clean(event.artist);
      if (!title || !artist) continue;

      const key = `${normalizeRadioText(title)}::${normalizeRadioText(artist)}`;
      const existing = aggregate.get(key);

      if (existing) {
        existing.plays += 1;
        existing.stationIdSet.add(event.stationId);
        existing.stationNameSet.add(event.stationName);
        if (event.playedAt > existing.lastPlayedAt) {
          existing.lastPlayedAt = event.playedAt;
        }
        continue;
      }

      aggregate.set(key, {
        title,
        artist,
        plays: 1,
        stationIds: [],
        stationNames: [],
        stationIdSet: new Set([event.stationId]),
        stationNameSet: new Set([event.stationName]),
        lastPlayedAt: event.playedAt,
      });
    }
  }

  return [...aggregate.values()]
    .map((track) => ({
      title: track.title,
      artist: track.artist,
      plays: track.plays,
      stationIds: [...track.stationIdSet],
      stationNames: [...track.stationNameSet],
      lastPlayedAt: track.lastPlayedAt,
    }))
    .sort((a, b) => {
      if (b.plays !== a.plays) return b.plays - a.plays;
      return b.lastPlayedAt.localeCompare(a.lastPlayedAt);
    });
}

export async function getMostPlayedTracks(options?: {
  days?: number;
  stationId?: string;
  limit?: number;
}): Promise<RadioIntelligenceTrack[]> {
  const days = Math.min(Math.max(options?.days ?? 1, 1), 365);
  const limit = Math.min(Math.max(options?.limit ?? 5, 1), 100);
  const stationId = options?.stationId?.trim();

  if (stationId && !stations.some((station) => station.id === stationId)) {
    return [];
  }

  const history = await readHistory(days);
  return aggregateHistory(history, stationId).slice(0, limit);
}

export async function findPlayedTrack(
  query: string,
  options?: {
    days?: number;
    stationId?: string;
    limit?: number;
  },
): Promise<RadioIntelligenceSearchResult> {
  const normalizedQuery = normalizeRadioText(query);

  if (!normalizedQuery) {
    return { found: false, query, matches: [] };
  }

  const history = await readHistory(
    Math.min(Math.max(options?.days ?? 365, 1), 365),
  );
  const tracks = aggregateHistory(history, options?.stationId?.trim());
  const queryWords = normalizedQuery.split(" ").filter(Boolean);

  const scored = tracks
    .map((track) => {
      const haystack = normalizeRadioText(`${track.artist} ${track.title}`);
      let score = 0;

      if (haystack === normalizedQuery) score += 1000;
      if (haystack.includes(normalizedQuery)) score += 500;

      for (const word of queryWords) {
        if (word.length >= 2 && haystack.includes(word)) {
          score += word.length;
        }
      }

      return { track, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.track.plays - a.track.plays;
    })
    .slice(0, Math.min(Math.max(options?.limit ?? 5, 1), 20))
    .map((item) => item.track);

  return {
    found: scored.length > 0,
    query,
    matches: scored,
  };
}
