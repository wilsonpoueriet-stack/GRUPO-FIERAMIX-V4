export type RadioBossStationConfig = {
  server: string;
  stationId: number;
};

export type RadioBossRecentTrack = {
  title?: string;
  tracktitle?: string;
  trackartist?: string;
  playlisttitle?: string;
  started?: string;
  artworkid?: string;
  title_sent?: string;
};

export type RadioBossNowPlaying = {
  autodj_title?: string;
  autodj?: boolean;
  live?: boolean;
  nowplaying?: string;
  listeners?: number;
  nexttrack?: string;
  nexttrack_artist?: string;
  nexttrack_title?: string;
  currenttrack?: string;
  currenttrack_artist?: string;
  currenttrack_title?: string;
};

export type RadioBossStationData = RadioBossNowPlaying & {
  recent: RadioBossRecentTrack[];
};

function buildUrl(
  server: string,
  path: string,
  stationId: number,
): string {
  return (
    `https://${server}${path}` +
    `?u=${encodeURIComponent(String(stationId))}` +
    `&_=${Date.now()}`
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`RadioBOSS respondió ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getNowPlaying(
  config: RadioBossStationConfig,
): Promise<RadioBossNowPlaying> {
  const endpoint = buildUrl(
    config.server,
    "/w/nowplayinginfo",
    config.stationId,
  );

  return fetchJson<RadioBossNowPlaying>(endpoint);
}

export async function getRecentTracks(
  config: RadioBossStationConfig,
  limit = 10,
): Promise<RadioBossRecentTrack[]> {
  const endpoint = buildUrl(
    config.server,
    "/w/recenttrackslist",
    config.stationId,
  );

  const payload = await fetchJson<
    RadioBossRecentTrack[] | { error?: string }
  >(endpoint);

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.slice(1, limit + 1);
}

export async function getStationData(
  config: RadioBossStationConfig,
  recentLimit = 10,
): Promise<RadioBossStationData> {
  const [nowPlaying, recent] = await Promise.all([
    getNowPlaying(config),
    getRecentTracks(config, recentLimit),
  ]);

  return {
    ...nowPlaying,
    recent,
  };
}

export function getCurrentArtworkUrl(
  config: RadioBossStationConfig,
): string {
  return (
    `https://${config.server}/w/artwork/` +
    `${config.stationId}.jpg`
  );
}

export function getNextArtworkUrl(
  config: RadioBossStationConfig,
): string {
  return (
    `https://${config.server}/w/artwork_next/` +
    `${config.stationId}.jpg`
  );
}

export function getRecentArtworkUrl(
  config: RadioBossStationConfig,
  artworkId?: string,
): string {
  if (!artworkId) {
    return getCurrentArtworkUrl(config);
  }

  return (
    `https://${config.server}/w/` +
    `artwork_recent_${encodeURIComponent(artworkId)}/` +
    `${config.stationId}.jpg`
  );
}