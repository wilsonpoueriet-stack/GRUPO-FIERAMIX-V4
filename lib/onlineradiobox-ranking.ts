import { stations } from "@/data/stations";
import type { StationTopTrack } from "@/lib/station-top10";

const ONLINE_RADIO_BOX_BASE = "https://onlineradiobox.com/do";
const HISTORY_DAYS = 7;

const stationSlugs: Record<string, string> = {
  fieramix: "fieramixlabrava",
  bachata: "fieramix",
  merengue: "fieramixlamerenguera",
  salsa: "fieramixlasalsera",
  baladas: "fieramixlaromantica",
  reggaeton: "fieramixlaurbana",
  rancheras: "fieramixlamexicana",
  internacional: "fieramixlaamericana",
  cristiana: "fieramixlacristiana",
};

type CountedTrack = {
  title: string;
  artist: string;
  artwork: string;
  plays: number;
  lastSeen: number;
};

function decodeHtml(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    apos: "'",
    quot: '"',
    lt: "<",
    gt: ">",
    nbsp: " ",
  };

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (entity, name: string) => entities[name.toLowerCase()] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function splitTrack(value: string): { artist: string; title: string } {
  const separator = value.indexOf(" - ");

  if (separator < 1) {
    return { artist: "Artista no identificado", title: value };
  }

  return {
    artist: value.slice(0, separator).trim(),
    title: value.slice(separator + 3).trim(),
  };
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; FIERAMIX-Ranking/1.0)",
    },
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Online Radio Box respondió ${response.status}.`);
  }

  return response.text();
}

function readArtwork(page: string): Map<string, string> {
  const artwork = new Map<string, string>();
  const chart = page.match(/<section class="station-chart">([\s\S]*?)<\/section>/i)?.[1] ?? "";
  const rowPattern = /<a[^>]+href="\/track\/(\d+)\/"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>/gi;

  for (const match of chart.matchAll(rowPattern)) {
    artwork.set(match[1], decodeHtml(match[2]));
  }

  return artwork;
}

function readHistory(page: string, dayIndex: number): Array<{
  key: string;
  title: string;
  artist: string;
  lastSeen: number;
}> {
  const table = page.match(/<table class="tablelist-schedule"[^>]*>([\s\S]*?)<\/table>/i)?.[1] ?? "";
  const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  return rows.flatMap((row, rowIndex) => {
    const cell = row[1].match(/<td class="track_history_item"[^>]*>([\s\S]*?)<\/td>/i)?.[1];
    if (!cell) return [];

    const label = decodeHtml(cell);
    if (!label) return [];

    const trackId = cell.match(/href="\/track\/(\d+)\//i)?.[1];
    const { artist, title } = splitTrack(label);
    const fallbackKey = `${normalize(artist)}::${normalize(title)}`;

    return [{
      key: trackId ? `track:${trackId}` : `text:${fallbackKey}`,
      title,
      artist,
      lastSeen: (HISTORY_DAYS - dayIndex) * 10000 - rowIndex,
    }];
  });
}

export function supportsOnlineRadioBoxRanking(stationId: string): boolean {
  return Boolean(stationSlugs[stationId]);
}

export async function readOnlineRadioBoxTop25(stationId: string): Promise<{
  ranking: StationTopTrack[];
  totalPlays: number;
}> {
  const slug = stationSlugs[stationId];
  const station = stations.find((item) => item.id === stationId);

  if (!slug || !station) return { ranking: [], totalPlays: 0 };

  const stationUrl = `${ONLINE_RADIO_BOX_BASE}/${slug}/`;
  const playlistUrl = `${stationUrl}playlist/`;
  const [stationPage, ...historyPages] = await Promise.all([
    fetchPage(stationUrl),
    ...Array.from({ length: HISTORY_DAYS }, (_, index) =>
      fetchPage(index === 0 ? playlistUrl : `${playlistUrl}${index}`),
    ),
  ]);

  const artworkByTrack = readArtwork(stationPage);
  const counts = new Map<string, CountedTrack>();
  let totalPlays = 0;

  historyPages.forEach((page, dayIndex) => {
    readHistory(page, dayIndex).forEach((track) => {
      totalPlays += 1;
      const current = counts.get(track.key);
      const trackId = track.key.startsWith("track:") ? track.key.slice(6) : "";
      const artwork = artworkByTrack.get(trackId) ?? "";

      if (current) {
        current.plays += 1;
        current.lastSeen = Math.max(current.lastSeen, track.lastSeen);
        if (!current.artwork && artwork) current.artwork = artwork;
        return;
      }

      counts.set(track.key, {
        title: track.title,
        artist: track.artist,
        artwork,
        plays: 1,
        lastSeen: track.lastSeen,
      });
    });
  });

  const ranking = [...counts.values()]
    .sort((first, second) => second.plays - first.plays || second.lastSeen - first.lastSeen)
    .slice(0, 25)
    .map(({ lastSeen: _lastSeen, ...track }, index) => ({
      position: index + 1,
      ...track,
      lastPlayedAt: "",
      stationCount: 1 as const,
      stationIds: [stationId],
      stationNames: [station.name],
    }));

  return { ranking, totalPlays };
}
