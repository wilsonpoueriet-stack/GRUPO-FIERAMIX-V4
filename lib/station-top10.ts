import { getStore } from "@netlify/blobs";
import { radioBossStations } from "@/config/radiobossStations";
import { stations } from "@/data/stations";
import { getOptimizedArtworkUrl, getRecentArtworkUrl, getStationData } from "@/lib/radioboss";

const STORE_NAME = "fieramix-station-counter-v2";

type SongCount = {
  title: string;
  artist: string;
  artwork: string;
  plays: number;
  lastPlayedAt: string;
};

type StationCounter = {
  version: 2;
  stationId: string;
  updatedAt: string;
  seen: Record<string, true>;
  songs: Record<string, SongCount>;
};

export type StationTopTrack = SongCount & {
  position: number;
  stationCount: 1;
  stationIds: string[];
  stationNames: string[];
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function counterKey(stationId: string): string {
  return `stations/${stationId}`;
}

async function readCounter(stationId: string): Promise<StationCounter> {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const stored = (await store.get(counterKey(stationId), { type: "json" })) as StationCounter | null;

  if (stored?.version === 2 && stored.stationId === stationId && stored.seen && stored.songs) {
    return stored;
  }

  return {
    version: 2,
    stationId,
    updatedAt: new Date(0).toISOString(),
    seen: {},
    songs: {},
  };
}

export async function captureStationPlays(stationId: string): Promise<number> {
  const config = radioBossStations[stationId as keyof typeof radioBossStations];
  if (!config || !stations.some((station) => station.id === stationId)) return 0;

  const data = await getStationData(config, 50);
  const counter = await readCounter(stationId);
  let added = 0;

  data.recent.forEach((track, index) => {
    const title = clean(track.tracktitle || track.title) || "Sin título";
    const artist = clean(track.trackartist) || "Artista no identificado";
    const started = clean(track.started) || `posición-${index}`;
    const eventId = [stationId, started, normalize(artist), normalize(title)].join("::");

    if (counter.seen[eventId]) return;

    const songId = `${normalize(artist)}::${normalize(title)}`;
    const artwork = getOptimizedArtworkUrl(
      getRecentArtworkUrl(config, track.artworkid),
      `${stationId}:${track.artworkid || index}:${artist}:${title}`,
    );
    const current = counter.songs[songId];

    counter.seen[eventId] = true;
    counter.songs[songId] = current
      ? { ...current, artwork, plays: current.plays + 1, lastPlayedAt: started }
      : { title, artist, artwork, plays: 1, lastPlayedAt: started };
    added += 1;
  });

  if (added > 0) {
    counter.updatedAt = new Date().toISOString();
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    await store.setJSON(counterKey(stationId), counter, {
      metadata: {
        stationId,
        songCount: Object.keys(counter.songs).length,
        playCount: Object.keys(counter.seen).length,
      },
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

  const counter = await readCounter(stationId);
  const ranking = Object.values(counter.songs)
    .sort((a, b) => b.plays - a.plays || b.lastPlayedAt.localeCompare(a.lastPlayedAt))
    .slice(0, 10)
    .map((song, index) => ({
      position: index + 1,
      ...song,
      stationCount: 1 as const,
      stationIds: [stationId],
      stationNames: [station.name],
    }));

  return { ranking, totalPlays: Object.keys(counter.seen).length };
}
