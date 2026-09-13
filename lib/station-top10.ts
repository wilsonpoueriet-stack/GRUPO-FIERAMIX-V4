import { getStore } from "@netlify/blobs";
import { radioBossStations } from "@/config/radiobossStations";
import { stations } from "@/data/stations";
import {
  getOptimizedArtworkUrl,
  getRecentArtworkUrl,
  getStationData,
} from "@/lib/radioboss";

const STORE_NAME = "fieramix-station-top10-v1";
const TIME_ZONE = "America/Santo_Domingo";

type StoredStationPlay = {
  id: string;
  stationId: string;
  title: string;
  artist: string;
  artwork: string;
  playedAt: string;
};

type StationDay = {
  version: 1;
  stationId: string;
  date: string;
  updatedAt: string;
  plays: Record<string, StoredStationPlay>;
};

export type StationTopTrack = {
  position: number;
  title: string;
  artist: string;
  artwork: string;
  plays: number;
  stationCount: 1;
  stationIds: string[];
  stationNames: string[];
  lastPlayedAt: string;
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

function dateKey(date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function playedAt(started: string, capturedAt: Date): string | null {
  const full = started.match(
    /(\d{4})-(\d{2})-(\d{2})[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );
  if (full) {
    const [, year, month, day, hour, minute, second = "00"] = full;
    return `${year}-${month}-${day}T${hour.padStart(2, "0")}:${minute}:${second}-04:00`;
  }

  const time = started.match(/(?:^|\s)(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s|$)/);
  if (!time) return null;

  const [, hour, minute, second = "00"] = time;
  return `${dateKey(capturedAt)}T${hour.padStart(2, "0")}:${minute}:${second}-04:00`;
}

function isSong(title: string, artist: string): boolean {
  if (!title || !artist) return false;
  return !["programacion en vivo", "en vivo", "sin informacion"].includes(
    normalize(title),
  );
}

function stationKey(stationId: string, day: string): string {
  return `stations/${stationId}/days/${day}`;
}

async function readDay(stationId: string, day: string): Promise<StationDay> {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const stored = (await store.get(stationKey(stationId, day), {
    type: "json",
  })) as StationDay | null;

  if (stored?.version === 1 && stored.stationId === stationId && stored.plays) {
    return stored;
  }

  return {
    version: 1,
    stationId,
    date: day,
    updatedAt: new Date(0).toISOString(),
    plays: {},
  };
}

export async function captureStationPlays(stationId: string): Promise<number> {
  const config = radioBossStations[
    stationId as keyof typeof radioBossStations
  ];
  if (!config || !stations.some((station) => station.id === stationId)) return 0;

  const capturedAt = new Date();
  const data = await getStationData(config, 50);
  const days = new Map<string, StoredStationPlay[]>();

  data.recent.forEach((track, index) => {
    const title = clean(track.tracktitle || track.title);
    const artist = clean(track.trackartist);
    const time = playedAt(clean(track.started), capturedAt);
    if (!time || !isSong(title, artist)) return;

    const artwork = getOptimizedArtworkUrl(
      getRecentArtworkUrl(config, track.artworkid),
      `${stationId}:${track.artworkid || index}:${artist}:${title}`,
    );
    const id = [stationId, time, normalize(artist), normalize(title)].join("::");
    const play: StoredStationPlay = { id, stationId, title, artist, artwork, playedAt: time };
    const day = time.slice(0, 10);
    days.set(day, [...(days.get(day) ?? []), play]);
  });

  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  let added = 0;

  for (const [day, plays] of days) {
    const document = await readDay(stationId, day);
    for (const play of plays) {
      if (document.plays[play.id]) continue;
      document.plays[play.id] = play;
      added += 1;
    }
    document.updatedAt = new Date().toISOString();
    await store.setJSON(stationKey(stationId, day), document, {
      metadata: { stationId, day, playCount: Object.keys(document.plays).length },
    });
  }

  return added;
}

export async function readStationTop10(stationId: string): Promise<{
  ranking: StationTopTrack[];
  totalPlays: number;
}> {
  const station = stations.find((item) => item.id === stationId);
  if (!station) return { ranking: [], totalPlays: 0 };

  const document = await readDay(stationId, dateKey());
  const aggregate = new Map<
    string,
    { title: string; artist: string; artwork: string; plays: number; lastPlayedAt: string }
  >();

  for (const play of Object.values(document.plays)) {
    if (play.stationId !== stationId) continue;
    const key = `${normalize(play.artist)}::${normalize(play.title)}`;
    const current = aggregate.get(key);
    if (current) {
      current.plays += 1;
      if (play.playedAt > current.lastPlayedAt) {
        current.lastPlayedAt = play.playedAt;
        current.artwork = play.artwork;
      }
    } else {
      aggregate.set(key, {
        title: play.title,
        artist: play.artist,
        artwork: play.artwork,
        plays: 1,
        lastPlayedAt: play.playedAt,
      });
    }
  }

  const ranking = [...aggregate.values()]
    .sort((a, b) => b.plays - a.plays || b.lastPlayedAt.localeCompare(a.lastPlayedAt))
    .slice(0, 10)
    .map((track, index) => ({
      position: index + 1,
      ...track,
      stationCount: 1 as const,
      stationIds: [stationId],
      stationNames: [station.name],
    }));

  return {
    ranking,
    totalPlays: Object.keys(document.plays).length,
  };
}
