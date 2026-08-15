"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { stations } from "@/data/stations";
import type {
  HistoryItem,
  NowPlaying,
  NowPlayingResult,
  RecentTrack,
} from "@/types/radio";
import type { Station, StationId } from "@/types/station";
import { emptyNowPlaying } from "@/hooks/useRadioPortal";

type Props = {
  history: HistoryItem[];
  current: NowPlaying;
  selected: Station;
  metadata: Partial<Record<StationId, NowPlayingResult>>;
};

type StationRotationTrack = RecentTrack & {
  plays: number;
};

type ChartTrack = {
  title: string;
  artist: string;
  artwork: string;
  stationId: StationId;
  stationName: string;
  stationLogo: string;
  stationAccent: string;
  listeners: number;
  live: boolean;
  score: number;
  plays: number;
  stationCount?: number;
};

type RankingPeriod = "actual" | "weekly" | "monthly" | "annual";

type RankingPeriodConfig = {
  id: RankingPeriod;
  label: string;
  shortLabel: string;
  limit: number;
  windowLabel: string;
  description: string;
};

type HistoricalRankingTrack = {
  position: number;
  title: string;
  artist: string;
  artwork: string;
  plays: number;
  stationCount: number;
  stationIds: string[];
  stationNames: string[];
  lastPlayedAt: string;
};

type RankingExportFormat = "pdf" | "png" | "jpg";
type RankingExportScope = "station" | "network";

type RankingExportRow = {
  position: number;
  title: string;
  artist: string;
  artwork: string;
  plays: number;
  detail: string;
};

type ArtistGalleryItem = {
  artist: string;
  imageUrl: string;
  uploadedAt?: string | null;
};

type ArtistGalleryResponse = {
  ok: boolean;
  artists?: ArtistGalleryItem[];
};

type HistoricalRankingResponse = {
  ok: boolean;
  period: RankingPeriod;
  label: string;
  limit: number;
  station?: string | null;
  stationName?: string | null;
  scope?: "station" | "network";
  windowDays?: number;
  windowStart?: string;
  windowEnd?: string;
  generatedAt: string;
  source: string;
  available: boolean;
  isOfficial: boolean;
  historyDays?: number;
  coveragePercent?: number;
  oldestStoredDate?: string | null;
  newestStoredDate?: string | null;
  totalPlays?: number;
  uniqueSongs?: number;
  collectorLastRunAt?: string | null;
  ranking: HistoricalRankingTrack[];
  error?: string;
  hint?: string;
};

const stationRankingPeriods: RankingPeriodConfig[] = [
  {
    id: "actual",
    label: "TOP 10 ACTUAL",
    shortLabel: "ACTUAL",
    limit: 10,
    windowLabel: "HOY",
    description: "Las canciones más tocadas hoy en esta emisora.",
  },
  {
    id: "weekly",
    label: "TOP 25 SEMANAL",
    shortLabel: "SEMANAL",
    limit: 25,
    windowLabel: "7 DÍAS",
    description: "Las más reproducidas de esta emisora durante los últimos siete días.",
  },
  {
    id: "monthly",
    label: "TOP 50 MENSUAL",
    shortLabel: "MENSUAL",
    limit: 50,
    windowLabel: "30 DÍAS",
    description: "Las más reproducidas de esta emisora durante los últimos treinta días.",
  },
  {
    id: "annual",
    label: "TOP 100 ANUAL",
    shortLabel: "ANUAL",
    limit: 100,
    windowLabel: "12 MESES",
    description: "Las más reproducidas de esta emisora durante los últimos doce meses.",
  },
];

const rankingPeriods: RankingPeriodConfig[] = [
  {
    id: "actual",
    label: "TOP 25 ACTUAL",
    shortLabel: "ACTUAL",
    limit: 25,
    windowLabel: "HOY",
    description: "Las canciones más tocadas hoy en toda la red.",
  },
  {
    id: "weekly",
    label: "TOP 25 SEMANAL",
    shortLabel: "SEMANAL",
    limit: 25,
    windowLabel: "7 DÍAS",
    description: "Ranking acumulado con la actividad musical de los últimos siete días.",
  },
  {
    id: "monthly",
    label: "TOP 50 MENSUAL",
    shortLabel: "MENSUAL",
    limit: 50,
    windowLabel: "30 DÍAS",
    description: "Ranking acumulado con la actividad musical de los últimos treinta días.",
  },
  {
    id: "annual",
    label: "TOP 100 ANUAL",
    shortLabel: "ANUAL",
    limit: 100,
    windowLabel: "12 MESES",
    description: "Ranking acumulado con la actividad musical de los últimos doce meses.",
  },
];

function clean(value: string | undefined | null): string {
  return (value ?? "").trim();
}

function trackKey(title: string, artist: string): string {
  return `${clean(title).toLowerCase()}::${clean(artist).toLowerCase()}`;
}

function isPlayableTrack(title: string, artist: string): boolean {
  const safeTitle = clean(title).toLowerCase();
  const safeArtist = clean(artist).toLowerCase();

  if (!safeTitle || safeTitle === "programación en vivo") {
    return false;
  }

  return Boolean(safeArtist);
}

function formatPlayCount(count: number): string {
  const safeCount = Math.max(0, Math.trunc(count));

  return `${safeCount} ${
    safeCount === 1 ? "TOCADA" : "TOCADAS"
  }`;
}

function chunkRankingRows(
  rows: RankingExportRow[],
  size = 10,
): RankingExportRow[][] {
  const chunks: RankingExportRow[][] = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
}

function formatExportPageNumber(value: number): string {
  return String(value).padStart(2, "0");
}

function safeExportFilename(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

const OFFICIAL_FIERAMIX_LOGO = "/logos/grupo-fieramix.png";

function normalizeArtistLookup(value: string): string {
  const normalized = clean(value)
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  const primaryArtist = normalized
    .split(
      /\s+(?:feat(?:uring)?\.?|ft\.?|con|featuring)\s+/i,
    )[0]
    ?.trim();

  return (primaryArtist || normalized)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeArtworkSource(value: string): string {
  const source = clean(value);

  if (!source) {
    return "";
  }

  try {
    const url = new URL(source, "https://fieramix.local");

    return decodeURIComponent(url.pathname)
      .replace(/\\/g, "/")
      .replace(/\/+$/g, "")
      .toLowerCase();
  } catch {
    return source
      .split(/[?#]/)[0]
      .replace(/\\/g, "/")
      .replace(/\/+$/g, "")
      .toLowerCase();
  }
}

function sameArtworkSource(
  left: string,
  right: string,
): boolean {
  const normalizedLeft = normalizeArtworkSource(left);
  const normalizedRight = normalizeArtworkSource(right);

  return Boolean(
    normalizedLeft &&
      normalizedRight &&
      normalizedLeft === normalizedRight,
  );
}

type RankingSocialIconType =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "x"
  | "youtube"
  | "whatsapp";

function RankingSocialIcon({
  type,
}: {
  type: RankingSocialIconType;
}) {
  if (type === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#1877F2" />
        <path
          d="M13.5 19v-6h2l.3-2.4h-2.3V9c0-.7.2-1.2 1.3-1.2H16V5.7c-.2 0-1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v1.5H8.4V13h2.2v6h2.9Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="6"
          fill="#E4405F"
        />
        <rect
          x="6.3"
          y="6.3"
          width="11.4"
          height="11.4"
          rx="3.4"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
        />
        <circle
          cx="12"
          cy="12"
          r="2.8"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
        />
        <circle
          cx="16.4"
          cy="7.7"
          r="1"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (type === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#111111" />
        <path
          d="M14.2 5.2v8.1a4.1 4.1 0 1 1-3.5-4v2.7a1.5 1.5 0 1 0 1 1.4V5.2h2.5Zm0 0c.4 2.2 1.7 3.5 3.8 3.9v2.6a6.8 6.8 0 0 1-3.8-1.5v-5Z"
          fill="#FFFFFF"
        />
        <path
          d="M14.2 5.2c.4 2.2 1.7 3.5 3.8 3.9"
          fill="none"
          stroke="#25F4EE"
          strokeWidth="1"
        />
        <path
          d="M10.7 9.3a4.1 4.1 0 0 0-3.5 4"
          fill="none"
          stroke="#FE2C55"
          strokeWidth="1"
        />
      </svg>
    );
  }

  if (type === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#000000" />
        <path
          d="M7 6.5h3.2l2.7 3.7 3.2-3.7h1.9l-4.2 4.9 4.7 6.1h-3.2l-3.1-4.1-3.5 4.1H6.8l4.5-5.3L7 6.5Zm2.2 1.4 6.8 8.2h1L10.2 7.9h-1Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (type === "youtube") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="2"
          y="5"
          width="20"
          height="14"
          rx="4"
          fill="#FF0000"
        />
        <path d="M10 9v6l5-3-5-3Z" fill="#FFFFFF" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#25D366" />
      <path
        d="M7.2 18.6 8 15.8a6.9 6.9 0 1 1 2.5 2l-3.3.8Zm3.5-2.4.5.3c.7.4 1.5.6 2.3.6a5.1 5.1 0 1 0-4.4-2.5l.3.5-.5 1.7 1.8-.6Zm6-2.8c-.2-.1-1.1-.5-1.3-.6-.2-.1-.4-.1-.5.1l-.6.7c-.1.2-.3.2-.5.1a4.2 4.2 0 0 1-1.2-.8 4.8 4.8 0 0 1-.8-1c-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.3.1-.4l-.6-1.4c-.1-.3-.3-.3-.5-.3h-.4c-.2 0-.4.1-.6.3-.2.2-.7.7-.7 1.7 0 1 .7 2 1 2.4.1.1 1.4 2.2 3.5 3 .5.2.9.3 1.2.4.5.2 1 .1 1.4.1.4-.1 1.1-.5 1.3-.9.2-.5.2-.9.1-1-.1-.2-.2-.2-.4-.3Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function formatRankingDateTime(value: string): string {
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  const date = parsed
    .toLocaleDateString("es-DO", {
      timeZone: "America/Santo_Domingo",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(".", "")
    .toUpperCase();

  const time = parsed.toLocaleTimeString("es-DO", {
    timeZone: "America/Santo_Domingo",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${date} · ${time}`;
}

function formatRankingClock(value: string): string {
  if (!value) {
    return "--:--";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "--:--";
  }

  return parsed.toLocaleTimeString("es-DO", {
    timeZone: "America/Santo_Domingo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRankingDateKey(value?: string): string {
  if (!value) {
    return "--";
  }

  const parsed = new Date(`${value}T12:00:00-04:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed
    .toLocaleDateString("es-DO", {
      timeZone: "America/Santo_Domingo",
      day: "2-digit",
      month: "short",
    })
    .replace(".", "")
    .toUpperCase();
}

function formatRankingRange(
  start?: string,
  end?: string,
): string {
  if (!start || !end) {
    return "PERÍODO EN ACUMULACIÓN";
  }

  return `${formatRankingDateKey(start)} — ${formatRankingDateKey(end)}`;
}

function formatHistoricalDate(value: string): string {
  if (!value) {
    return "RECIENTE";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "RECIENTE";
  }

  return parsed.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
  });
}

function buildStationRotation(
  station: Station,
  now: NowPlaying,
): StationRotationTrack[] {
  const orderedKeys: string[] = [];
  const bySong = new Map<string, StationRotationTrack>();

  const registerTrack = (track: RecentTrack) => {
    if (!isPlayableTrack(track.title, track.artist)) {
      return;
    }

    const title = clean(track.title);
    const artist = clean(track.artist) || station.name;
    const key = trackKey(title, artist);
    const previous = bySong.get(key);

    if (previous) {
      previous.plays += 1;

      if (!previous.artwork && track.artwork) {
        previous.artwork = clean(track.artwork);
      }

      return;
    }

    orderedKeys.push(key);
    bySong.set(key, {
      title,
      artist,
      artwork: clean(track.artwork) || station.logo,
      started: clean(track.started),
      plays: 1,
    });
  };

  if (isPlayableTrack(now.title, now.artist)) {
    registerTrack({
      title: now.title,
      artist: now.artist,
      artwork: now.artwork || station.logo,
      started: "",
    });
  }

  for (const track of now.recent ?? []) {
    registerTrack(track);
  }

  return orderedKeys
    .map((key) => bySong.get(key))
    .filter((track): track is StationRotationTrack => Boolean(track))
    .slice(0, 10);
}

function buildNetworkChart(
  metadata: Partial<Record<StationId, NowPlayingResult>>,
): ChartTrack[] {
  const bySong = new Map<string, ChartTrack>();

  stations.forEach((station, stationIndex) => {
    const now = metadata[station.id] ?? emptyNowPlaying(station);
    const listeners =
      typeof now.listeners === "number"
        ? Math.max(now.listeners, 0)
        : 0;

    const candidates: Array<{
      track: RecentTrack;
      live: boolean;
      position: number;
    }> = [];

    if (isPlayableTrack(now.title, now.artist)) {
      candidates.push({
        track: {
          title: now.title,
          artist: now.artist,
          artwork: now.artwork || station.logo,
          started: "",
        },
        live: true,
        position: 0,
      });
    }

    (now.recent ?? []).forEach((track, index) => {
      candidates.push({
        track,
        live: false,
        position: index + 1,
      });
    });

    candidates.forEach(({ track, live, position }) => {
      if (!isPlayableTrack(track.title, track.artist)) {
        return;
      }

      const key = trackKey(track.title, track.artist);
      const recencyPoints = Math.max(0, 30 - position * 2);
      const livePoints = live ? 45 : 0;
      const audiencePoints = Math.min(listeners, 250);
      const networkSpread = Math.max(0, 12 - stationIndex);
      const score =
        livePoints +
        audiencePoints +
        recencyPoints +
        networkSpread;

      const previous = bySong.get(key);

      if (!previous) {
        bySong.set(key, {
          title: clean(track.title),
          artist: clean(track.artist),
          artwork: clean(track.artwork) || station.logo,
          stationId: station.id,
          stationName: station.shortName ?? station.name,
          stationLogo: station.logo,
          stationAccent: station.accent,
          listeners,
          live,
          score,
          plays: 1,
        });

        return;
      }

      previous.plays += 1;
      previous.score += score;
      previous.live = previous.live || live;

      if (listeners > previous.listeners) {
        previous.listeners = listeners;
      }

      if (
        live ||
        (!previous.artwork && clean(track.artwork))
      ) {
        previous.artwork =
          clean(track.artwork) || previous.artwork;
        previous.stationId = station.id;
        previous.stationName =
          station.shortName ?? station.name;
        previous.stationLogo = station.logo;
        previous.stationAccent = station.accent;
      }
    });
  });

  return [...bySong.values()]
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (b.plays !== a.plays) {
        return b.plays - a.plays;
      }

      return a.title.localeCompare(b.title, "es");
    })
    .slice(0, 25);
}

export default function RecentAndRanking({
  history: _history,
  current: _current,
  selected,
  metadata,
}: Props) {
  const [chartStationId, setChartStationId] =
    useState<StationId>(selected.id);
  const [showAllNetwork, setShowAllNetwork] = useState(false);
  const [rankingPeriod, setRankingPeriod] =
    useState<RankingPeriod>("actual");
  const [historicalRanking, setHistoricalRanking] =
    useState<HistoricalRankingResponse | null>(null);
  const [historicalRankingLoading, setHistoricalRankingLoading] =
    useState(false);
  const [historicalRankingError, setHistoricalRankingError] =
    useState("");
  const [stationRankingPeriod, setStationRankingPeriod] =
    useState<RankingPeriod>("actual");
  const [stationHistoricalRanking, setStationHistoricalRanking] =
    useState<HistoricalRankingResponse | null>(null);
  const [stationHistoricalLoading, setStationHistoricalLoading] =
    useState(false);
  const [stationHistoricalError, setStationHistoricalError] =
    useState("");
  const [showAllStationRanking, setShowAllStationRanking] =
    useState(false);
  const [liveRankingUpdatedAt, setLiveRankingUpdatedAt] =
    useState("");
  const stationExportRef = useRef<HTMLDivElement>(null);
  const networkExportRef = useRef<HTMLDivElement>(null);
  const stationTopFiveExportRef = useRef<HTMLDivElement>(null);
  const networkTopFiveExportRef = useRef<HTMLDivElement>(null);
  const [rankingExporting, setRankingExporting] =
    useState<string | null>(null);
  const [rankingExportMessage, setRankingExportMessage] =
    useState("");
  const [artistGalleryArtwork, setArtistGalleryArtwork] =
    useState<Record<string, string>>({});

  useEffect(() => {
    setChartStationId(selected.id);
  }, [selected.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadArtistGallery() {
      try {
        const response = await fetch(
          "/api/artist-gallery?list=1",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          return;
        }

        const data =
          (await response.json()) as ArtistGalleryResponse;

        if (cancelled || !data.ok || !data.artists) {
          return;
        }

        const nextArtwork: Record<string, string> = {};

        data.artists.forEach((item) => {
          const slug = normalizeArtistLookup(item.artist);

          if (!slug || !item.imageUrl) {
            return;
          }

          const separator = item.imageUrl.includes("?")
            ? "&"
            : "?";

          nextArtwork[slug] = item.uploadedAt
            ? `${item.imageUrl}${separator}v=${encodeURIComponent(
                item.uploadedAt,
              )}`
            : item.imageUrl;
        });

        setArtistGalleryArtwork(nextArtwork);
      } catch (error) {
        console.warn(
          "Galería de artistas no disponible; se mantienen las portadas normales.",
          error,
        );
      }
    }

    void loadArtistGallery();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setLiveRankingUpdatedAt(new Date().toISOString());
  }, [metadata]);

  useEffect(() => {
    setShowAllStationRanking(false);
  }, [chartStationId, stationRankingPeriod]);

  function getArtistGalleryArtwork(
    artistName: string,
  ): string {
    const slug = normalizeArtistLookup(artistName);

    return slug
      ? artistGalleryArtwork[slug] || ""
      : "";
  }

  function buildDirectArtistGalleryArtwork(
    artistName: string,
    fallbackArtwork: string,
  ): string {
    const cleanArtist = clean(artistName);

    if (!cleanArtist) {
      return "";
    }

    const fallback =
      clean(fallbackArtwork) ||
      OFFICIAL_FIERAMIX_LOGO;

    return `/api/artist-gallery?artist=${encodeURIComponent(
      cleanArtist,
    )}&fallback=${encodeURIComponent(
      fallback,
    )}`;
  }

  function resolveRankingArtwork(
    artistName: string,
    artwork: string | null | undefined,
    fallback: string,
  ): string {
    const cleanArtwork = clean(artwork);
    const finalFallback =
      cleanArtwork ||
      fallback ||
      OFFICIAL_FIERAMIX_LOGO;

    const galleryArtwork =
      getArtistGalleryArtwork(artistName);

    // La galería es siempre la primera fuente visual.
    // Si el listado todavía no terminó de cargar, consultamos directamente
    // el endpoint por nombre de artista. Si el artista no está registrado,
    // el onError recupera la portada normal de RadioBOSS o el logo.
    if (galleryArtwork) {
      return galleryArtwork;
    }

    const directGalleryArtwork =
      buildDirectArtistGalleryArtwork(
        artistName,
        finalFallback,
      );

    if (directGalleryArtwork) {
      return directGalleryArtwork;
    }

    return finalFallback;
  }

  function handleRankingArtworkError(
    image: HTMLImageElement,
    artistName: string,
    fallback: string,
  ): void {
    const galleryArtwork =
      getArtistGalleryArtwork(artistName);

    const currentSource =
      image.currentSrc || image.src || "";

    if (
      galleryArtwork &&
      !sameArtworkSource(
        currentSource,
        galleryArtwork,
      )
    ) {
      image.src = galleryArtwork;
      return;
    }

    // Cuando la consulta directa a la galería devuelve 404 porque el
    // artista no está registrado, recuperamos la portada original que
    // quedó codificada en la propia URL.
    try {
      const currentUrl =
        new URL(
          currentSource,
          window.location.origin,
        );

      const encodedFallback =
        currentUrl.searchParams.get(
          "fallback",
        );

      const decodedFallback =
        clean(encodedFallback);

      if (
        decodedFallback &&
        !sameArtworkSource(
          currentSource,
          decodedFallback,
        )
      ) {
        image.src = decodedFallback;
        return;
      }
    } catch {
      // Continuamos con el fallback general.
    }

    image.onerror = null;
    image.src =
      fallback || OFFICIAL_FIERAMIX_LOGO;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadHistoricalRanking() {
      setHistoricalRankingLoading(true);
      setHistoricalRankingError("");

      try {
        const response = await fetch(
          `/api/rankings?period=${encodeURIComponent(rankingPeriod)}`,
          {
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as HistoricalRankingResponse;

        if (cancelled) {
          return;
        }

        setHistoricalRanking(data);

        if (!response.ok || !data.ok) {
          setHistoricalRankingError(
            data.error ||
              "No fue posible cargar este período del ranking.",
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setHistoricalRanking(null);
        setHistoricalRankingError(
          error instanceof Error
            ? error.message
            : "No fue posible consultar el historial musical.",
        );
      } finally {
        if (!cancelled) {
          setHistoricalRankingLoading(false);
        }
      }
    }

    void loadHistoricalRanking();

    return () => {
      cancelled = true;
    };
  }, [rankingPeriod]);

  useEffect(() => {
    let cancelled = false;

    async function waitForRetry(delayMs: number) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, delayMs);
      });
    }

    async function loadStationHistoricalRanking() {
      setStationHistoricalLoading(true);
      setStationHistoricalError("");

      const maxAttempts =
        stationRankingPeriod === "actual" ? 3 : 1;

      try {
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          if (attempt > 0) {
            await waitForRetry(attempt === 1 ? 700 : 1400);
          }

          if (cancelled) {
            return;
          }

          const response = await fetch(
            `/api/rankings?period=${encodeURIComponent(
              stationRankingPeriod,
            )}&station=${encodeURIComponent(chartStationId)}&t=${Date.now()}`,
            {
              cache: "no-store",
            },
          );

          const data =
            (await response.json()) as HistoricalRankingResponse;

          if (cancelled) {
            return;
          }

          setStationHistoricalRanking(data);

          if (!response.ok || !data.ok) {
            setStationHistoricalError(
              data.error ||
                "No fue posible cargar el ranking de esta emisora.",
            );
            return;
          }

          setStationHistoricalError("");

          if (
            data.ranking.length > 0 ||
            attempt === maxAttempts - 1
          ) {
            return;
          }
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStationHistoricalRanking(null);
        setStationHistoricalError(
          error instanceof Error
            ? error.message
            : "No fue posible consultar el historial de esta emisora.",
        );
      } finally {
        if (!cancelled) {
          setStationHistoricalLoading(false);
        }
      }
    }

    void loadStationHistoricalRanking();

    return () => {
      cancelled = true;
    };
  }, [chartStationId, stationRankingPeriod]);

  const chartStation =
    stations.find((station) => station.id === chartStationId) ??
    selected;

  const chartStationNow =
    metadata[chartStation.id] ?? emptyNowPlaying(chartStation);

  const networkListeners = useMemo(
    () =>
      stations.reduce((total, station) => {
        const info =
          metadata[station.id] ?? emptyNowPlaying(station);

        return (
          total +
          (typeof info.listeners === "number"
            ? Math.max(info.listeners, 0)
            : 0)
        );
      }, 0),
    [metadata],
  );

  const chartStationListeners =
    typeof chartStationNow.listeners === "number"
      ? Math.max(chartStationNow.listeners, 0)
      : 0;

  const chartStationAudienceShare =
    networkListeners > 0
      ? Math.round(
          (chartStationListeners / networkListeners) * 100,
        )
      : 0;

  const liveStationTop10 = useMemo(
    () => buildStationRotation(chartStation, chartStationNow),
    [chartStation, chartStationNow],
  );

  const stationRankingPeriodConfig =
    stationRankingPeriods.find(
      (period) => period.id === stationRankingPeriod,
    ) ?? stationRankingPeriods[0];

  const isCurrentStationRanking =
    stationRankingPeriod === "actual";

  const stationHistoricalTracks =
    stationHistoricalRanking?.period === stationRankingPeriod &&
    stationHistoricalRanking?.station === chartStation.id
      ? stationHistoricalRanking.ranking
      : [];

  const stationTop10: StationRotationTrack[] =
    isCurrentStationRanking
      ? stationHistoricalTracks.slice(0, 10).map((track) => ({
          title: track.title,
          artist: track.artist,
          artwork: track.artwork,
          started: track.lastPlayedAt,
          plays: track.plays,
        }))
      : liveStationTop10;

  const visibleStationHistoricalTracks =
    showAllStationRanking
      ? stationHistoricalTracks
      : stationHistoricalTracks.slice(0, 10);

  const stationLeaderTrack =
    isCurrentStationRanking
      ? stationTop10[0] ?? null
      : stationHistoricalTracks[0] ?? null;

  const stationHistoricalCoverage =
    stationHistoricalRanking?.coveragePercent ?? 0;

  const stationHistoricalDays =
    stationHistoricalRanking?.historyDays ?? 0;

  const stationHistoricalPlays =
    stationHistoricalRanking?.totalPlays ?? 0;

  const stationRankingRange =
    isCurrentStationRanking
      ? "HOY"
      : formatRankingRange(
          stationHistoricalRanking?.windowStart,
          stationHistoricalRanking?.windowEnd,
        );

  const stationRankingUpdatedAtValue =
    stationHistoricalRanking?.collectorLastRunAt ||
    stationHistoricalRanking?.generatedAt ||
    liveRankingUpdatedAt;

  const stationRankingUpdateClock =
    formatRankingClock(stationRankingUpdatedAtValue);

  const stationRankingUpdateDateTime =
    formatRankingDateTime(stationRankingUpdatedAtValue);

  const liveNetworkTop25 = useMemo(
    () => buildNetworkChart(metadata),
    [metadata],
  );

  const rankingPeriodConfig =
    rankingPeriods.find((period) => period.id === rankingPeriod) ??
    rankingPeriods[0];

  const isCurrentRanking = rankingPeriod === "actual";

  const historicalTracks =
    historicalRanking?.period === rankingPeriod
      ? historicalRanking.ranking
      : [];

  const networkTop25: ChartTrack[] =
    isCurrentRanking
      ? historicalTracks.map((track) => {
          const validStationId = track.stationIds.find((stationId) =>
            stations.some((station) => station.id === stationId),
          ) as StationId | undefined;

          const station =
            stations.find((item) => item.id === validStationId) ??
            selected;

          const info =
            metadata[station.id] ?? emptyNowPlaying(station);

          const listeners =
            typeof info.listeners === "number"
              ? Math.max(info.listeners, 0)
              : 0;

          return {
            title: track.title,
            artist: track.artist,
            artwork: track.artwork,
            stationId: station.id,
            stationName:
              track.stationNames[0] ||
              station.shortName ||
              station.name,
            stationLogo: station.logo,
            stationAccent: station.accent,
            listeners,
            live: false,
            score: track.plays,
            plays: track.plays,
            stationCount: track.stationCount,
          };
        })
      : liveNetworkTop25;

  const visibleHistoricalTracks = showAllNetwork
    ? historicalTracks
    : historicalTracks.slice(0, 10);

  const historicalLeaderTrack =
    historicalTracks[0] ?? null;

  const historicalCoverage =
    historicalRanking?.coveragePercent ?? 0;

  const historicalHistoryDays =
    historicalRanking?.historyDays ?? 0;

  const historicalTotalPlays =
    historicalRanking?.totalPlays ?? 0;

  const networkRankingRange =
    isCurrentRanking
      ? "HOY"
      : formatRankingRange(
          historicalRanking?.windowStart,
          historicalRanking?.windowEnd,
        );

  const networkRankingUpdatedAtValue =
    historicalRanking?.collectorLastRunAt ||
    historicalRanking?.generatedAt ||
    liveRankingUpdatedAt;

  const networkRankingUpdateClock =
    formatRankingClock(networkRankingUpdatedAtValue);

  const networkRankingUpdateDateTime =
    formatRankingDateTime(networkRankingUpdatedAtValue);

  const visibleNetworkTracks = isCurrentRanking
    ? showAllNetwork
      ? networkTop25
      : networkTop25.slice(0, 10)
    : [];

  const networkLeaderTrack = networkTop25[0] ?? null;

  const networkRepresentedStationIds = new Set(
    historicalTracks.flatMap((track) => track.stationIds),
  );

  const networkRepresentedStationCount =
    networkRepresentedStationIds.size;
  const stationExportRows: RankingExportRow[] =
    isCurrentStationRanking
      ? stationTop10.map((track, index) => ({
          position: index + 1,
          title: track.title,
          artist: track.artist,
          artwork: resolveRankingArtwork(
            track.artist,
            track.artwork,
            chartStation.logo,
          ),
          plays: track.plays,
          detail: "TOCADAS DE HOY",
        }))
      : stationHistoricalTracks.map((track) => ({
          position: track.position,
          title: track.title,
          artist: track.artist,
          artwork: resolveRankingArtwork(
            track.artist,
            track.artwork,
            chartStation.logo,
          ),
          plays: track.plays,
          detail: `${track.stationCount} ${
            track.stationCount === 1 ? "EMISORA" : "EMISORAS"
          }`,
        }));

  const networkExportRows: RankingExportRow[] =
    isCurrentRanking
      ? networkTop25.map((track, index) => ({
          position: index + 1,
          title: track.title,
          artist: track.artist,
          artwork: resolveRankingArtwork(
            track.artist,
            track.artwork,
            track.stationLogo || OFFICIAL_FIERAMIX_LOGO,
          ),
          plays: track.plays,
          detail: `${track.stationCount ?? 1} ${
            (track.stationCount ?? 1) === 1 ? "EMISORA" : "EMISORAS"
          } · HOY`,
        }))
      : historicalTracks.map((track) => ({
          position: track.position,
          title: track.title,
          artist: track.artist,
          artwork: resolveRankingArtwork(
            track.artist,
            track.artwork,
            OFFICIAL_FIERAMIX_LOGO,
          ),
          plays: track.plays,
          detail: `${track.stationCount} ${
            track.stationCount === 1 ? "EMISORA" : "EMISORAS"
          }`,
        }));

  const stationExportPages =
    chunkRankingRows(stationExportRows, 10);

  const networkExportPages =
    chunkRankingRows(networkExportRows, 10);

  const stationTopFiveExportRows =
    stationExportRows.slice(0, 5);

  const networkTopFiveExportRows =
    networkExportRows.slice(0, 5);

  const stationExportTitle =
    stationRankingPeriodConfig.label;

  const networkExportTitle =
    rankingPeriodConfig.label;

  const stationExportFilename = safeExportFilename(
    `FIERAMIX ${stationRankingPeriodConfig.label} ${chartStation.name}`,
  );

  const networkExportFilename = safeExportFilename(
    `FIERAMIX ${rankingPeriodConfig.label}`,
  );

  async function exportRankingPackage(
    scope: RankingExportScope,
  ): Promise<void> {
    const rankingContainer =
      scope === "station"
        ? stationExportRef.current
        : networkExportRef.current;

    const topFiveContainer =
      scope === "station"
        ? stationTopFiveExportRef.current
        : networkTopFiveExportRef.current;

    const rankingRows =
      scope === "station"
        ? stationExportRows
        : networkExportRows;

    if (
      !rankingContainer ||
      !topFiveContainer ||
      rankingRows.length === 0
    ) {
      setRankingExportMessage(
        "Este ranking todavía no tiene datos suficientes para preparar el paquete.",
      );
      return;
    }

    const rankingPages = Array.from(
      rankingContainer.querySelectorAll<HTMLElement>(
        ".rankingExportSheet",
      ),
    );

    const topFiveCards = Array.from(
      topFiveContainer.querySelectorAll<HTMLElement>(
        ".rankingTopFiveCard",
      ),
    );

    if (rankingPages.length === 0) {
      setRankingExportMessage(
        "No fue posible preparar las hojas del ranking.",
      );
      return;
    }

    const exportKey = `${scope}-package`;
    setRankingExporting(exportKey);
    setRankingExportMessage("");

    try {
      const [
        { default: html2canvas },
        { default: JSZip },
      ] = await Promise.all([
        import("html2canvas-pro"),
        import("jszip"),
      ]);

      const zip = new JSZip();

      const filename =
        scope === "station"
          ? stationExportFilename
          : networkExportFilename;

      const rankingFolder =
        zip.folder(`${filename}/RANKING`);

      const topFiveFolder =
        zip.folder(`${filename}/TOP-5`);

      if (!rankingFolder || !topFiveFolder) {
        throw new Error(
          "No fue posible crear la estructura del paquete.",
        );
      }

      for (
        let pageIndex = 0;
        pageIndex < rankingPages.length;
        pageIndex += 1
      ) {
        setRankingExportMessage(
          `Preparando ranking ${pageIndex + 1} de ${rankingPages.length}...`,
        );

        const canvas = await html2canvas(
          rankingPages[pageIndex],
          {
            backgroundColor: "#07101f",
            scale: 1,
            useCORS: true,
            logging: false,
            width: 1080,
            height: 1920,
            windowWidth: 1080,
            windowHeight: 1920,
          },
        );

        const dataUrl = canvas.toDataURL(
          "image/jpeg",
          0.95,
        );

        const base64 = dataUrl.split(",")[1];

        rankingFolder.file(
          `PAG-${formatExportPageNumber(
            pageIndex + 1,
          )}-DE-${formatExportPageNumber(
            rankingPages.length,
          )}.jpg`,
          base64,
          { base64: true },
        );
      }

      for (
        let cardIndex = 0;
        cardIndex < topFiveCards.length;
        cardIndex += 1
      ) {
        setRankingExportMessage(
          `Preparando TOP 5 · imagen ${cardIndex + 1} de ${topFiveCards.length}...`,
        );

        const canvas = await html2canvas(
          topFiveCards[cardIndex],
          {
            backgroundColor: "#07101f",
            scale: 1,
            useCORS: true,
            logging: false,
            width: 1080,
            height: 1920,
            windowWidth: 1080,
            windowHeight: 1920,
          },
        );

        const dataUrl = canvas.toDataURL(
          "image/jpeg",
          0.96,
        );

        const base64 = dataUrl.split(",")[1];

        const track =
          scope === "station"
            ? stationTopFiveExportRows[cardIndex]
            : networkTopFiveExportRows[cardIndex];

        const trackName = safeExportFilename(
          track?.title || `POSICION-${cardIndex + 1}`,
        );

        topFiveFolder.file(
          `${formatExportPageNumber(
            cardIndex + 1,
          )}-${trackName}.jpg`,
          base64,
          { base64: true },
        );
      }

      setRankingExportMessage(
        "Comprimiendo paquete completo...",
      );

      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6,
        },
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${filename}-PAQUETE-COMPLETO.zip`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1200);

      setRankingExportMessage(
        `Paquete ZIP descargado: ${rankingPages.length} ${
          rankingPages.length === 1 ? "hoja" : "hojas"
        } del ranking + ${topFiveCards.length} imágenes individuales del TOP 5.`,
      );
    } catch (error) {
      console.error(
        "No fue posible crear el paquete ZIP.",
        error,
      );

      setRankingExportMessage(
        "No fue posible generar el paquete completo. Inténtalo nuevamente.",
      );
    } finally {
      setRankingExporting(null);
    }
  }

  async function exportRanking(
    scope: RankingExportScope,
    format: RankingExportFormat,
  ): Promise<void> {
    const container =
      scope === "station"
        ? stationExportRef.current
        : networkExportRef.current;

    const rows =
      scope === "station"
        ? stationExportRows
        : networkExportRows;

    if (!container || rows.length === 0) {
      setRankingExportMessage(
        "Este ranking todavía no tiene posiciones disponibles para descargar.",
      );
      return;
    }

    const pageElements = Array.from(
      container.querySelectorAll<HTMLElement>(
        ".rankingExportSheet",
      ),
    );

    if (pageElements.length === 0) {
      setRankingExportMessage(
        "No fue posible preparar las hojas del ranking.",
      );
      return;
    }

    const exportKey = `${scope}-${format}`;
    setRankingExporting(exportKey);
    setRankingExportMessage("");

    try {
      const [{ default: html2canvas }, { jsPDF }] =
        await Promise.all([
          import("html2canvas-pro"),
          import("jspdf"),
        ]);

      const filename =
        scope === "station"
          ? stationExportFilename
          : networkExportFilename;

      const canvases = [];

      for (
        let pageIndex = 0;
        pageIndex < pageElements.length;
        pageIndex += 1
      ) {
        setRankingExportMessage(
          `Preparando hoja ${pageIndex + 1} de ${pageElements.length}...`,
        );

        const page = pageElements[pageIndex];

        const canvas = await html2canvas(page, {
          backgroundColor: "#07101f",
          scale: 1,
          useCORS: true,
          logging: false,
          width: 1080,
          height: 1920,
          windowWidth: 1080,
          windowHeight: 1920,
        });

        canvases.push(canvas);
      }

      if (format === "png" || format === "jpg") {
        const mimeType =
          format === "png" ? "image/png" : "image/jpeg";
        const quality = format === "jpg" ? 0.95 : 1;

        for (
          let pageIndex = 0;
          pageIndex < canvases.length;
          pageIndex += 1
        ) {
          const pageNumber = formatExportPageNumber(
            pageIndex + 1,
          );
          const totalPages = formatExportPageNumber(
            canvases.length,
          );

          const dataUrl = canvases[
            pageIndex
          ].toDataURL(mimeType, quality);

          const link = document.createElement("a");
          link.href = dataUrl;
          link.download =
            `${filename}-HOJA-${pageNumber}-DE-${totalPages}.${format}`;

          document.body.appendChild(link);
          link.click();
          link.remove();

          if (canvases.length > 1) {
            await new Promise<void>((resolve) => {
              window.setTimeout(resolve, 180);
            });
          }
        }

        setRankingExportMessage(
          `${canvases.length} ${
            canvases.length === 1 ? "imagen" : "imágenes"
          } ${format.toUpperCase()} descargadas en formato social 1080 × 1920.`,
        );
        return;
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [1080, 1920],
        compress: true,
      });

      canvases.forEach((canvas, pageIndex) => {
        if (pageIndex > 0) {
          pdf.addPage([1080, 1920], "portrait");
        }

        const imageData = canvas.toDataURL(
          "image/jpeg",
          0.95,
        );

        pdf.addImage(
          imageData,
          "JPEG",
          0,
          0,
          1080,
          1920,
          undefined,
          "FAST",
        );
      });

      pdf.save(`${filename}-SOCIAL-9X16.pdf`);

      setRankingExportMessage(
        `PDF descargado con ${canvases.length} ${
          canvases.length === 1 ? "hoja" : "hojas"
        }, 10 canciones por hoja.`,
      );
    } catch (error) {
      console.error(
        "No fue posible exportar el ranking.",
        error,
      );

      setRankingExportMessage(
        "No fue posible generar la descarga. Inténtalo nuevamente.",
      );
    } finally {
      setRankingExporting(null);
    }
  }

  return (
    <section className="chartsSection" id="ranking">
      <div className="chartsHeading">
        <div>
          <span>FIERAMIX CHARTS</span>
          <h2>LA MÚSICA QUE MUEVE LA RED</h2>
        </div>

        <p>
          Tocadas reales por emisora y ranking general de
          <br />
          EL GRUPO FIERAMIX.COM.
        </p>
      </div>

      <div className="chartsGrid">
        <article
          className="chartPanel stationChart"
          style={
            {
              "--station-accent": chartStation.accent,
            } as CSSProperties
          }
        >
          <div
            className="stationPeriodTabs"
            role="tablist"
            aria-label={`Período del ranking de ${chartStation.name}`}
          >
            {stationRankingPeriods.map((period) => (
              <button
                key={period.id}
                type="button"
                role="tab"
                aria-selected={
                  stationRankingPeriod === period.id
                }
                className={
                  stationRankingPeriod === period.id
                    ? "isActive"
                    : ""
                }
                onClick={() => {
                  setStationRankingPeriod(period.id);
                  setShowAllStationRanking(false);
                }}
              >
                <strong>{period.label}</strong>
                <span>{period.windowLabel}</span>
              </button>
            ))}
          </div>

          <header className="chartPanelHeader">
            <div>
              <span>{stationRankingPeriodConfig.label}</span>
              <h3>{chartStation.name}</h3>
              <p className="rankingPeriodDescription">
                {stationRankingPeriodConfig.description}
              </p>
            </div>

            <label className="chartStationSelector">
              <span>EMISORA</span>

              <select
                value={chartStationId}
                onChange={(event) =>
                  setChartStationId(
                    event.target.value as StationId,
                  )
                }
                aria-label="Elegir emisora para sus rankings"
              >
                {stations.map((station) => (
                  <option
                    key={station.id}
                    value={station.id}
                  >
                    {station.name}
                  </option>
                ))}
              </select>
            </label>
          </header>

          <div className="chartStationIdentity">
            <img
              src={chartStation.logo}
              alt=""
              aria-hidden="true"
            />

            <div>
              <strong>{chartStation.name}</strong>
              <span>{chartStation.slogan}</span>
            </div>

            <div
              className="chartStationAudience"
              title={`${chartStationListeners} oyentes en vivo · ${chartStationAudienceShare}% de la audiencia total de la red`}
              aria-label={`${chartStationListeners} oyentes en vivo, ${chartStationAudienceShare} por ciento de la red`}
            >
              <strong>{chartStationListeners} OY</strong>
              <span>{chartStationAudienceShare}% DE LA RED</span>
            </div>

            <i
              style={{
                backgroundColor: chartStation.accent,
              }}
              aria-hidden="true"
            />
          </div>

          <div
            className="rankingDataStamp stationRankingDataStamp"
            aria-label={`Período ${stationRankingRange}. Última actualización ${stationRankingUpdateClock}`}
          >
            <span>
              <i aria-hidden="true" />
              {stationRankingRange}
            </span>
            <strong>
              ACTUALIZADO {stationRankingUpdateClock}
            </strong>
          </div>

          <div
            className="rankingExportBar stationRankingExportBar"
            aria-label={`Descargar ${stationRankingPeriodConfig.label} de ${chartStation.name} en formato social 9 por 16`}
          >
            <span>
              <i aria-hidden="true">↓</i>
              DESCARGAR · SOCIAL 9:16
            </span>

            <div>
              {(["pdf", "png", "jpg"] as const).map(
                (format) => {
                  const key = `station-${format}`;
                  const busy = rankingExporting === key;

                  return (
                    <button
                      key={format}
                      type="button"
                      onClick={() =>
                        void exportRanking(
                          "station",
                          format,
                        )
                      }
                      disabled={
                        stationExportRows.length === 0 ||
                        rankingExporting !== null
                      }
                    >
                      {busy
                        ? "GENERANDO..."
                        : format.toUpperCase()}
                    </button>
                  );
                },
              )}

              <button
                type="button"
                className="rankingPackageButton"
                onClick={() =>
                  void exportRankingPackage("station")
                }
                disabled={
                  stationExportRows.length === 0 ||
                  rankingExporting !== null
                }
              >
                {rankingExporting === "station-package"
                  ? "GENERANDO..."
                  : "PAQUETE ZIP"}
              </button>
            </div>
          </div>

          {!isCurrentStationRanking ? (
            <div
              className={`stationHistoricalStatus ${
                stationHistoricalRanking?.isOfficial
                  ? "isOfficial"
                  : ""
              }`}
            >
              <span aria-hidden="true">
                {stationHistoricalRanking?.isOfficial
                  ? "★"
                  : "◷"}
              </span>

              <div>
                <strong>
                  {stationHistoricalLoading
                    ? "CONSULTANDO HISTORIAL"
                    : stationHistoricalRanking?.isOfficial
                      ? "RANKING OFICIAL"
                      : "EN ACUMULACIÓN"}
                </strong>

                <small>
                  {stationHistoricalLoading
                    ? `Leyendo ${stationRankingPeriodConfig.windowLabel.toLowerCase()} de ${chartStation.name}.`
                    : stationHistoricalError
                      ? stationHistoricalError
                      : `${stationRankingRange} · ${stationHistoricalDays} días · ${stationHistoricalCoverage}% de cobertura · ${stationHistoricalPlays} tocadas`}
                </small>
              </div>

              <b>
                {stationHistoricalLoading
                  ? "..."
                  : `${stationHistoricalCoverage}%`}
              </b>
            </div>
          ) : null}

          {stationLeaderTrack ? (
            <div className="stationLeaderSpotlight">
              <span className="stationLeaderRank">
                <i aria-hidden="true">★</i>
                <strong>#1</strong>
                <small>
                  {isCurrentStationRanking
                    ? "TOP 10"
                    : stationHistoricalRanking?.isOfficial
                      ? "OFICIAL"
                      : "ACUM."}
                </small>
              </span>

              <img
                src={resolveRankingArtwork(
                  stationLeaderTrack.artist,
                  stationLeaderTrack.artwork,
                  chartStation.logo,
                )}
                alt=""
                aria-hidden="true"
                onError={(event) => {
                  handleRankingArtworkError(
                    event.currentTarget,
                    stationLeaderTrack.artist,
                    chartStation.logo,
                  );
                }}
              />

              <div className="stationLeaderSong">
                <strong>{stationLeaderTrack.title}</strong>
                <span>{stationLeaderTrack.artist}</span>
              </div>

              <div className="stationLeaderStatus">
                <strong>
                  {formatPlayCount(stationLeaderTrack.plays)}
                </strong>
                <span>
                  {isCurrentStationRanking
                    ? "TOCADAS HOY"
                    : `${stationHistoricalTracks.length} POSICIONES`}
                </span>
              </div>
            </div>
          ) : null}

          {isCurrentStationRanking ? (
            stationTop10.length > 0 ? (
              <ol className="chartList">
                {stationTop10.map((track, index) => (
                  <li
                    key={`${chartStation.id}-${track.artist}-${track.title}-${index}`}
                    className={index === 0 ? "isLive" : ""}
                  >
                    <b>
                      {String(index + 1).padStart(2, "0")}
                    </b>

                    <img
                      src={resolveRankingArtwork(
                        track.artist,
                        track.artwork,
                        chartStation.logo,
                      )}
                      alt=""
                      aria-hidden="true"
                      onError={(event) => {
                        handleRankingArtworkError(
                          event.currentTarget,
                          track.artist,
                          chartStation.logo,
                        );
                      }}
                    />

                    <span>
                      <strong>{track.title}</strong>
                      <small>{track.artist}</small>
                    </span>

                    <em className="stationTrackPlayCount">
                      <strong>
                        {formatPlayCount(track.plays)}
                      </strong>
                      <span>
                        HOY
                      </span>
                    </em>
                  </li>
                ))}
              </ol>
            ) : stationHistoricalLoading ? (
              <div className="stationRankingLoading">
                <strong>CARGANDO TOCADAS DE HOY</strong>
                <span>
                  Consultando las tocadas acumuladas de{" "}
                  {chartStation.name}.
                </span>
              </div>
            ) : stationHistoricalError ? (
              <div className="chartEmpty">
                <strong>RANKING NO DISPONIBLE</strong>
                <span>
                  {stationHistoricalRanking?.hint ||
                    stationHistoricalError}
                </span>
              </div>
            ) : (
              <div className="chartEmpty">
                <strong>TODAVÍA NO HAY TOCADAS DISPONIBLES</strong>
                <span>
                  Aún no hay suficientes tocadas acumuladas de{" "}
                  {chartStation.name} para mostrar el TOP ACTUAL.
                </span>
              </div>
            )
          ) : stationHistoricalLoading ? (
            <div className="stationRankingLoading">
              <strong>
                CARGANDO {stationRankingPeriodConfig.label}
              </strong>
              <span>
                Consultando tocadas reales de{" "}
                {chartStation.name}.
              </span>
            </div>
          ) : stationHistoricalError ? (
            <div className="chartEmpty">
              <strong>HISTORIAL NO DISPONIBLE</strong>
              <span>
                {stationHistoricalRanking?.hint ||
                  stationHistoricalError}
              </span>
            </div>
          ) : visibleStationHistoricalTracks.length > 0 ? (
            <ol className="chartList stationHistoricalList">
              {visibleStationHistoricalTracks.map((track) => (
                <li
                  key={`${chartStation.id}-${stationRankingPeriod}-${track.position}-${track.artist}-${track.title}`}
                  className={
                    track.position <= 3
                      ? "historicalPodium"
                      : ""
                  }
                >
                  <b>
                    {String(track.position).padStart(2, "0")}
                  </b>

                  <img
                    src={resolveRankingArtwork(
                      track.artist,
                      track.artwork,
                      chartStation.logo,
                    )}
                    alt=""
                    aria-hidden="true"
                    onError={(event) => {
                      handleRankingArtworkError(
                        event.currentTarget,
                        track.artist,
                        chartStation.logo,
                      );
                    }}
                  />

                  <span>
                    <strong>{track.title}</strong>
                    <small>{track.artist}</small>
                  </span>

                  <em className="stationTrackPlayCount historicalStationPlayCount">
                    <strong>
                      {formatPlayCount(track.plays)}
                    </strong>
                    <span>
                      {track.stationCount}{" "}
                      {track.stationCount === 1
                        ? "EMISORA"
                        : "EMISORAS"}
                    </span>
                  </em>
                </li>
              ))}
            </ol>
          ) : (
            <div className="chartEmpty">
              <strong>
                {stationRankingPeriodConfig.label} EN CONSTRUCCIÓN
              </strong>
              <span>
                El recolector está acumulando tocadas reales
                de {chartStation.name}.
              </span>
            </div>
          )}

          <footer className="chartPanelFooter stationRankingFooter">
            {!isCurrentStationRanking &&
            stationHistoricalTracks.length > 10 ? (
              <button
                type="button"
                onClick={() =>
                  setShowAllStationRanking((value) => !value)
                }
              >
                {showAllStationRanking
                  ? "MOSTRAR TOP 10"
                  : `VER ${stationRankingPeriodConfig.label} COMPLETO`}
                <span aria-hidden="true">
                  {showAllStationRanking ? "↑" : "↓"}
                </span>
              </button>
            ) : (
              <span>
                {isCurrentStationRanking
                  ? `${stationTop10.length} canciones disponibles`
                  : `${stationHistoricalTracks.length} posiciones disponibles`}
              </span>
            )}

            <strong>
              {isCurrentStationRanking
                ? "DATOS EN VIVO"
                : stationHistoricalRanking?.isOfficial
                  ? "DATOS OFICIALES"
                  : "HISTORIAL REAL"}
              <i aria-hidden="true" />
            </strong>
          </footer>
        </article>

        <article className="chartPanel networkChart">
          <div
            className="networkPeriodTabs"
            role="tablist"
            aria-label="Período del ranking general"
          >
            {rankingPeriods.map((period) => (
              <button
                key={period.id}
                type="button"
                role="tab"
                aria-selected={rankingPeriod === period.id}
                className={
                  rankingPeriod === period.id ? "isActive" : ""
                }
                onClick={() => {
                  setRankingPeriod(period.id);
                  setShowAllNetwork(false);
                }}
              >
                <strong>{period.label}</strong>
                <span>{period.windowLabel}</span>
              </button>
            ))}
          </div>

          <header className="chartPanelHeader">
            <div>
              <span>{rankingPeriodConfig.label}</span>
              <h3>
                {isCurrentRanking
                  ? "PULSO MUSICAL DE LA RED"
                  : "HISTORIAL MUSICAL DE LA RED"}
              </h3>
              <p className="rankingPeriodDescription">
                {rankingPeriodConfig.description}
              </p>
            </div>

            <div className="networkChartBadge">
              <i aria-hidden="true">★</i>
              <span>
                {isCurrentRanking
                  ? networkTop25.length
                  : rankingPeriodConfig.limit}
                <small>
                  {isCurrentRanking ? "CANCIONES" : "POSICIONES"}
                </small>
              </span>
            </div>
          </header>

          <div
            className="rankingDataStamp networkRankingDataStamp"
            aria-label={`Período ${networkRankingRange}. Última actualización ${networkRankingUpdateClock}`}
          >
            <span>
              <i aria-hidden="true" />
              {networkRankingRange}
            </span>
            <strong>
              ACTUALIZADO {networkRankingUpdateClock}
            </strong>
          </div>

          <div
            className="rankingExportBar networkRankingExportBar"
            aria-label={`Descargar ${rankingPeriodConfig.label} general en formato social 9 por 16`}
          >
            <span>
              <i aria-hidden="true">↓</i>
              DESCARGAR · SOCIAL 9:16
            </span>

            <div>
              {(["pdf", "png", "jpg"] as const).map(
                (format) => {
                  const key = `network-${format}`;
                  const busy = rankingExporting === key;

                  return (
                    <button
                      key={format}
                      type="button"
                      onClick={() =>
                        void exportRanking(
                          "network",
                          format,
                        )
                      }
                      disabled={
                        networkExportRows.length === 0 ||
                        rankingExporting !== null
                      }
                    >
                      {busy
                        ? "GENERANDO..."
                        : format.toUpperCase()}
                    </button>
                  );
                },
              )}

              <button
                type="button"
                className="rankingPackageButton"
                onClick={() =>
                  void exportRankingPackage("network")
                }
                disabled={
                  networkExportRows.length === 0 ||
                  rankingExporting !== null
                }
              >
                {rankingExporting === "network-package"
                  ? "GENERANDO..."
                  : "PAQUETE ZIP"}
              </button>
            </div>
          </div>

          {isCurrentRanking ? (
            <div
              className="networkChartSummary"
              aria-label="Pulso actual del Top 25"
            >
              <span className="networkChartLiveStatus">
                <i aria-hidden="true" />
                ACTUALIZACIÓN AUTOMÁTICA
              </span>

              <div className="networkChartPulseMetrics">
                <span>
                  <strong>{historicalTotalPlays}</strong>
                  <small>TOCADAS HOY</small>
                </span>

                <span>
                  <strong>
                    {networkRepresentedStationCount}
                  </strong>
                  <small>EMISORAS</small>
                </span>

                <span>
                  <strong>{networkTop25.length}</strong>
                  <small>CANCIONES</small>
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`historicalRankingStatus ${
                historicalRanking?.isOfficial
                  ? "isOfficial"
                  : ""
              }`}
            >
              <span className="historicalRankingIcon" aria-hidden="true">
                {historicalRanking?.isOfficial ? "★" : "◷"}
              </span>

              <div>
                <strong>
                  {historicalRankingLoading
                    ? "CONSULTANDO HISTORIAL REAL"
                    : historicalRanking?.isOfficial
                      ? `${rankingPeriodConfig.label} · OFICIAL`
                      : "ACUMULANDO HISTORIAL REAL"}
                </strong>

                <span>
                  {historicalRankingLoading
                    ? `Leyendo la base histórica de ${rankingPeriodConfig.windowLabel.toLowerCase()}.`
                    : historicalRankingError
                      ? historicalRankingError
                      : historicalRanking
                        ? `${networkRankingRange} · ${historicalHistoryDays} días registrados · ${historicalCoverage}% de cobertura · ${historicalTotalPlays} tocadas contabilizadas.`
                        : "Esperando información del historial persistente."}
                </span>
              </div>

              <b>
                {historicalRankingLoading
                  ? "..."
                  : `${historicalCoverage}%`}
              </b>
            </div>
          )}

          {isCurrentRanking && networkLeaderTrack ? (
            <div
              className="networkLeaderSpotlight"
              style={
                {
                  "--leader-accent":
                    networkLeaderTrack.stationAccent,
                } as CSSProperties
              }
            >
              <span className="networkLeaderRank">
                <i aria-hidden="true">★</i>
                <strong>#1</strong>
                <small>DE LA RED</small>
              </span>

              <img
                src={resolveRankingArtwork(
                  networkLeaderTrack.artist,
                  networkLeaderTrack.artwork,
                  networkLeaderTrack.stationLogo,
                )}
                alt=""
                aria-hidden="true"
                onError={(event) => {
                  handleRankingArtworkError(
                    event.currentTarget,
                    networkLeaderTrack.artist,
                    networkLeaderTrack.stationLogo,
                  );
                }}
              />

              <div className="networkLeaderSong">
                <strong>{networkLeaderTrack.title}</strong>
                <span>{networkLeaderTrack.artist}</span>
              </div>

              <div className="networkLeaderStation">
                <strong>
                  {networkLeaderTrack.stationName}
                </strong>
                <span>
                  {formatPlayCount(networkLeaderTrack.plays)} ·{" "}
                  {networkLeaderTrack.stationCount ?? 1}{" "}
                  {(networkLeaderTrack.stationCount ?? 1) === 1
                    ? "EMISORA"
                    : "EMISORAS"}{" "}
                  · HOY
                </span>

                <a
                  href={`/emisoras/${networkLeaderTrack.stationId}`}
                  aria-label={`Ver emisora ${networkLeaderTrack.stationName}`}
                >
                  VER EMISORA
                  <i aria-hidden="true">→</i>
                </a>
              </div>
            </div>
          ) : null}

          {isCurrentRanking ? (
            visibleNetworkTracks.length > 0 ? (
              <ol className="chartList networkList">
                {visibleNetworkTracks.map(
                  (track, index) => (
                    <li
                      key={`${track.stationId}-${track.artist}-${track.title}`}
                      className={track.live ? "isLive" : ""}
                      style={
                        {
                          "--track-accent": track.stationAccent,
                        } as CSSProperties
                      }
                    >
                      <b>
                        {String(index + 1).padStart(2, "0")}
                      </b>

                      <img
                        src={resolveRankingArtwork(
                          track.artist,
                          track.artwork,
                          track.stationLogo,
                        )}
                        alt=""
                        aria-hidden="true"
                        onError={(event) => {
                          handleRankingArtworkError(
                            event.currentTarget,
                            track.artist,
                            track.stationLogo,
                          );
                        }}
                      />

                      <span>
                        <strong>{track.title}</strong>
                        <small>{track.artist}</small>
                      </span>

                      <em
                        className={
                          track.live
                            ? "networkTrackStation live"
                            : "networkTrackStation"
                        }
                        title={`${formatPlayCount(track.plays)} hoy · ${
                          track.stationCount ?? 1
                        } ${
                          (track.stationCount ?? 1) === 1
                            ? "emisora"
                            : "emisoras"
                        }`}
                      >
                        <strong className="networkPlayCount">
                          {formatPlayCount(track.plays)}
                        </strong>
                        <span className="networkTrackDetail">
                          {track.stationCount ?? 1}{" "}
                          {(track.stationCount ?? 1) === 1
                            ? "EMISORA"
                            : "EMISORAS"}
                          <span className="networkTrackListeners">
                            · HOY
                          </span>
                        </span>
                      </em>
                    </li>
                  ),
                )}
              </ol>
            ) : historicalRankingLoading ? (
              <div className="chartEmpty">
                <strong>CARGANDO TOP ACTUAL</strong>
                <span>
                  Esperando información musical de la red.
                </span>
              </div>
            ) : historicalRankingError ? (
              <div className="chartEmpty">
                <strong>RANKING NO DISPONIBLE</strong>
                <span>
                  {historicalRanking?.hint ||
                    historicalRankingError}
                </span>
              </div>
            ) : (
              <div className="chartEmpty">
                <strong>TODAVÍA NO HAY TOCADAS DISPONIBLES</strong>
                <span>
                  Aún no hay suficientes tocadas acumuladas en la red
                  para mostrar el TOP ACTUAL.
                </span>
              </div>
            )
          ) : historicalRankingLoading ? (
            <div className="historicalRankingPreview">
              <div className="historicalRankingScale">
                {Array.from({ length: 10 }).map((_, index) => (
                  <span key={index}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <i />
                    <em>CARGANDO HISTORIAL</em>
                  </span>
                ))}
              </div>

              <div className="historicalRankingNotice">
                <strong>CONSULTANDO {rankingPeriodConfig.label}</strong>
                <span>
                  Estamos leyendo las tocadas acumuladas en la
                  base histórica de EL GRUPO FIERAMIX.COM.
                </span>
              </div>
            </div>
          ) : historicalRankingError ? (
            <div className="historicalRankingPreview">
              <div className="historicalRankingScale">
                {Array.from({ length: 10 }).map((_, index) => (
                  <span key={index}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <i />
                    <em>HISTORIAL PENDIENTE</em>
                  </span>
                ))}
              </div>

              <div className="historicalRankingNotice isWarning">
                <strong>HISTORIAL TODAVÍA NO DISPONIBLE</strong>
                <span>
                  {historicalRanking?.hint ||
                    historicalRankingError}
                </span>
              </div>
            </div>
          ) : visibleHistoricalTracks.length > 0 ? (
            <>
              {historicalLeaderTrack ? (
                <div className="historicalLeaderSpotlight">
                  <span className="networkLeaderRank">
                    <i aria-hidden="true">★</i>
                    <strong>#1</strong>
                    <small>
                      {historicalRanking?.isOfficial
                        ? "OFICIAL"
                        : "EN ACUMULACIÓN"}
                    </small>
                  </span>

                  <img
                    src={resolveRankingArtwork(
                      historicalLeaderTrack.artist,
                      historicalLeaderTrack.artwork,
                      OFFICIAL_FIERAMIX_LOGO,
                    )}
                    alt=""
                    aria-hidden="true"
                    onError={(event) => {
                      handleRankingArtworkError(
                        event.currentTarget,
                        historicalLeaderTrack.artist,
                        OFFICIAL_FIERAMIX_LOGO,
                      );
                    }}
                  />

                  <div className="networkLeaderSong">
                    <strong>{historicalLeaderTrack.title}</strong>
                    <span>{historicalLeaderTrack.artist}</span>
                  </div>

                  <div className="historicalLeaderMetrics">
                    <strong>
                      {formatPlayCount(historicalLeaderTrack.plays)}
                    </strong>
                    <span>
                      {historicalLeaderTrack.stationCount}{" "}
                      {historicalLeaderTrack.stationCount === 1
                        ? "EMISORA"
                        : "EMISORAS"}
                    </span>
                  </div>
                </div>
              ) : null}

              <ol className="chartList networkList historicalList">
                {visibleHistoricalTracks.map((track) => (
                  <li
                    key={`${track.artist}-${track.title}-${track.position}`}
                    className={
                      track.position <= 3 ? "historicalPodium" : ""
                    }
                  >
                    <b>
                      {String(track.position).padStart(2, "0")}
                    </b>

                    <img
                      src={resolveRankingArtwork(
                        track.artist,
                        track.artwork,
                        OFFICIAL_FIERAMIX_LOGO,
                      )}
                      alt=""
                      aria-hidden="true"
                      onError={(event) => {
                        handleRankingArtworkError(
                          event.currentTarget,
                          track.artist,
                          OFFICIAL_FIERAMIX_LOGO,
                        );
                      }}
                    />

                    <span>
                      <strong>{track.title}</strong>
                      <small>{track.artist}</small>
                    </span>

                    <em
                      className="networkTrackStation historicalTrackMetrics"
                      title={`${formatPlayCount(track.plays)} · ${track.stationCount} emisoras`}
                    >
                      <strong className="networkPlayCount historicalPlayCount">
                        {formatPlayCount(track.plays)}
                      </strong>
                      <span className="networkTrackListeners">
                        · {track.stationCount}{" "}
                        {track.stationCount === 1
                          ? "EMISORA"
                          : "EMISORAS"}
                        · {formatHistoricalDate(track.lastPlayedAt)}
                      </span>
                    </em>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <div className="historicalRankingPreview">
              <div className="historicalRankingScale">
                {Array.from({ length: 10 }).map((_, index) => (
                  <span key={index}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <i />
                    <em>POSICIÓN EN ACUMULACIÓN</em>
                  </span>
                ))}
              </div>

              <div className="historicalRankingNotice">
                <strong>
                  {rankingPeriodConfig.label} EN CONSTRUCCIÓN
                </strong>
                <span>
                  El recolector está formando este ranking con
                  tocadas reales. Las posiciones aparecerán
                  automáticamente cuando existan datos almacenados.
                </span>
              </div>
            </div>
          )}

          <footer className="chartPanelFooter networkFooter">
            {isCurrentRanking ? (
              <button
                type="button"
                onClick={() =>
                  setShowAllNetwork((value) => !value)
                }
                disabled={networkTop25.length <= 10}
              >
                {showAllNetwork
                  ? "MOSTRAR TOP 10"
                  : "VER TOP 25 ACTUAL COMPLETO"}
                <span aria-hidden="true">
                  {showAllNetwork ? "↑" : "↓"}
                </span>
              </button>
            ) : historicalTracks.length > 10 ? (
              <button
                type="button"
                onClick={() =>
                  setShowAllNetwork((value) => !value)
                }
              >
                {showAllNetwork
                  ? "MOSTRAR TOP 10"
                  : `VER ${rankingPeriodConfig.label} COMPLETO`}
                <span aria-hidden="true">
                  {showAllNetwork ? "↑" : "↓"}
                </span>
              </button>
            ) : (
              <span className="historicalFooterState">
                {historicalRanking?.isOfficial ? "★" : "◷"}{" "}
                {historicalRanking?.isOfficial
                  ? "RANKING OFICIAL"
                  : "HISTORIAL EN CONSTRUCCIÓN"}{" "}
                · {rankingPeriodConfig.windowLabel}
              </span>
            )}

            <strong>
              {isCurrentRanking
                ? "TOCADAS DE HOY"
                : historicalRanking?.isOfficial
                  ? "DATOS OFICIALES"
                  : "RANKING HISTÓRICO"}
              <i aria-hidden="true" />
            </strong>
          </footer>
        </article>
      </div>

      {rankingExportMessage ? (
        <div
          className="rankingExportMessage"
          role="status"
          aria-live="polite"
        >
          {rankingExportMessage}
        </div>
      ) : null}

      <div className="rankingExportStage" aria-hidden="true">
        <div
          ref={stationExportRef}
          className="rankingExportPages"
        >
          {stationExportPages.map((pageRows, pageIndex) => {
            const firstPosition =
              pageRows[0]?.position ?? 0;
            const lastPosition =
              pageRows[pageRows.length - 1]?.position ?? 0;

            return (
              <div
                key={`station-export-page-${stationRankingPeriod}-${chartStation.id}-${pageIndex}`}
                className="rankingExportSheet"
              >
                <div className="rankingExportSafeArea">
                  <div className="rankingExportIdentity">
                    <div className="rankingExportIdentityMark station">
                      <img
                        src={chartStation.logo}
                        alt={chartStation.name}
                        onError={(event) => {
                          event.currentTarget.src =
                            OFFICIAL_FIERAMIX_LOGO;
                        }}
                      />
                    </div>

                    <div className="rankingExportIdentityText">
                      <span>RANKING OFICIAL DE EMISORA</span>
                      <strong>{chartStation.name}</strong>
                      <small>{chartStation.slogan}</small>
                    </div>
                  </div>

                  <div className="rankingExportHero">
                    <span>FIERAMIX CHARTS</span>
                    <h2>{stationExportTitle}</h2>
                    <p>
                      {stationRankingRange} · ACTUALIZADO{" "}
                      {stationRankingUpdateDateTime}
                    </p>
                  </div>

                  <div className="rankingExportPageInfo">
                    <strong>
                      POSICIONES{" "}
                      {formatExportPageNumber(firstPosition)}
                      {" — "}
                      {formatExportPageNumber(lastPosition)}
                    </strong>
                    <span>
                      PAG {formatExportPageNumber(pageIndex + 1)}
                      {" DE "}
                      {formatExportPageNumber(
                        stationExportPages.length,
                      )}
                    </span>
                  </div>

                  <div className="rankingExportTableHead">
                    <b>#</b>
                    <i aria-hidden="true">PORTADA</i>
                    <span>CANCIÓN / ARTISTA</span>
                    <strong>TOCADAS</strong>
                  </div>

                  <ol className="rankingExportRows">
                    {pageRows.map((track) => (
                      <li
                        key={`export-station-${stationRankingPeriod}-${chartStation.id}-${pageIndex}-${track.position}-${track.artist}-${track.title}`}
                      >
                        <b>
                          {String(track.position).padStart(
                            2,
                            "0",
                          )}
                        </b>

                        <figure className="rankingExportCover">
                          <img
                            src={resolveRankingArtwork(
                              track.artist,
                              track.artwork,
                              chartStation.logo,
                            )}
                            alt=""
                            aria-hidden="true"
                            onError={(event) => {
                              handleRankingArtworkError(
                                event.currentTarget,
                                track.artist,
                                chartStation.logo,
                              );
                            }}
                          />
                        </figure>

                        <span>
                          <strong>{track.title}</strong>
                          <small>
                            {track.artist} · {track.detail}
                          </small>
                        </span>

                        <em>
                          {`${track.plays} ${
                            track.plays === 1 ? "TOCADA" : "TOCADAS"
                          }`}
                        </em>
                      </li>
                    ))}
                  </ol>

                  <div className="rankingExportSummary">
                    <span>
                      <strong>{chartStation.name}</strong>
                      EMISORA
                    </span>
                    <span>
                      <strong>
                        {pageRows.reduce(
                          (total, track) =>
                            total + track.plays,
                          0,
                        )}
                      </strong>
                      TOCADAS EN ESTA HOJA
                    </span>
                  </div>

                  <footer className="rankingExportFooter">
                    <div className="rankingExportFooterBrand">
                      <div className="rankingExportFooterBrandText">
                        <strong>
                          EL GRUPO FIERAMIX.COM
                        </strong>
                        <small>
                          LA RED LATINA QUE MUEVE AL MUNDO
                        </small>
                      </div>

                      <div className="rankingExportSocials" aria-label="Redes sociales">
                        <span className="facebook" aria-label="Facebook">
                          <RankingSocialIcon type="facebook" />
                        </span>
                        <span className="instagram" aria-label="Instagram">
                          <RankingSocialIcon type="instagram" />
                        </span>
                        <span className="tiktok" aria-label="TikTok">
                          <RankingSocialIcon type="tiktok" />
                        </span>
                        <span className="x" aria-label="X">
                          <RankingSocialIcon type="x" />
                        </span>
                        <span className="youtube" aria-label="YouTube">
                          <RankingSocialIcon type="youtube" />
                        </span>
                      </div>

                      <div className="rankingExportContact">
                        <RankingSocialIcon type="whatsapp" />
                        <span>809 841 9586</span>
                      </div>
                    </div>

                    <b>
                      PAG {formatExportPageNumber(pageIndex + 1)}
                      {" DE "}
                      {formatExportPageNumber(
                        stationExportPages.length,
                      )}
                    </b>
                  </footer>
                </div>
              </div>
            );
          })}
        </div>

        <div
          ref={networkExportRef}
          className="rankingExportPages"
        >
          {networkExportPages.map((pageRows, pageIndex) => {
            const firstPosition =
              pageRows[0]?.position ?? 0;
            const lastPosition =
              pageRows[pageRows.length - 1]?.position ?? 0;

            return (
              <div
                key={`network-export-page-${rankingPeriod}-${pageIndex}`}
                className="rankingExportSheet"
              >
                <div className="rankingExportSafeArea">
                  <div className="rankingExportIdentity">
                    <div className="rankingExportIdentityMark network">
                      <img
                        src={OFFICIAL_FIERAMIX_LOGO}
                        alt="EL GRUPO FIERAMIX.COM"
                        onError={(event) => {
                          event.currentTarget.src =
                            OFFICIAL_FIERAMIX_LOGO;
                        }}
                      />
                    </div>

                    <div className="rankingExportIdentityText">
                      <span>RANKING GENERAL DE LA RED</span>
                      <strong>EL GRUPO FIERAMIX.COM</strong>
                      <small>LA RED LATINA QUE MUEVE AL MUNDO</small>
                    </div>
                  </div>

                  <div className="rankingExportHero">
                    <span>FIERAMIX CHARTS</span>
                    <h2>{networkExportTitle}</h2>
                    <p>
                      {networkRankingRange} · ACTUALIZADO{" "}
                      {networkRankingUpdateDateTime}
                    </p>
                  </div>

                  <div className="rankingExportPageInfo">
                    <strong>
                      POSICIONES{" "}
                      {formatExportPageNumber(firstPosition)}
                      {" — "}
                      {formatExportPageNumber(lastPosition)}
                    </strong>
                    <span>
                      PAG {formatExportPageNumber(pageIndex + 1)}
                      {" DE "}
                      {formatExportPageNumber(
                        networkExportPages.length,
                      )}
                    </span>
                  </div>

                  <div className="rankingExportTableHead">
                    <b>#</b>
                    <i aria-hidden="true">PORTADA</i>
                    <span>CANCIÓN / ARTISTA</span>
                    <strong>TOCADAS</strong>
                  </div>

                  <ol className="rankingExportRows">
                    {pageRows.map((track) => (
                      <li
                        key={`export-network-${rankingPeriod}-${pageIndex}-${track.position}-${track.artist}-${track.title}`}
                      >
                        <b>
                          {String(track.position).padStart(
                            2,
                            "0",
                          )}
                        </b>

                        <figure className="rankingExportCover">
                          <img
                            src={resolveRankingArtwork(
                              track.artist,
                              track.artwork,
                              OFFICIAL_FIERAMIX_LOGO,
                            )}
                            alt=""
                            aria-hidden="true"
                            onError={(event) => {
                              handleRankingArtworkError(
                                event.currentTarget,
                                track.artist,
                                OFFICIAL_FIERAMIX_LOGO,
                              );
                            }}
                          />
                        </figure>

                        <span>
                          <strong>{track.title}</strong>
                          <small>
                            {track.artist} · {track.detail}
                          </small>
                        </span>

                        <em>
                          {`${track.plays} ${
                            track.plays === 1 ? "TOCADA" : "TOCADAS"
                          }`}
                        </em>
                      </li>
                    ))}
                  </ol>

                  <div className="rankingExportSummary">
                    <span>
                      <strong>GENERAL</strong>
                      TODA LA RED
                    </span>
                    <span>
                      <strong>
                        {pageRows.reduce(
                          (total, track) =>
                            total + track.plays,
                          0,
                        )}
                      </strong>
                      TOCADAS EN ESTA HOJA
                    </span>
                  </div>

                  <footer className="rankingExportFooter">
                    <div className="rankingExportFooterBrand">
                      <div className="rankingExportFooterBrandText">
                        <strong>
                          EL GRUPO FIERAMIX.COM
                        </strong>
                        <small>
                          LA RED LATINA QUE MUEVE AL MUNDO
                        </small>
                      </div>

                      <div className="rankingExportSocials" aria-label="Redes sociales">
                        <span className="facebook" aria-label="Facebook">
                          <RankingSocialIcon type="facebook" />
                        </span>
                        <span className="instagram" aria-label="Instagram">
                          <RankingSocialIcon type="instagram" />
                        </span>
                        <span className="tiktok" aria-label="TikTok">
                          <RankingSocialIcon type="tiktok" />
                        </span>
                        <span className="x" aria-label="X">
                          <RankingSocialIcon type="x" />
                        </span>
                        <span className="youtube" aria-label="YouTube">
                          <RankingSocialIcon type="youtube" />
                        </span>
                      </div>

                      <div className="rankingExportContact">
                        <RankingSocialIcon type="whatsapp" />
                        <span>809 841 9586</span>
                      </div>
                    </div>

                    <b>
                      PAG {formatExportPageNumber(pageIndex + 1)}
                      {" DE "}
                      {formatExportPageNumber(
                        networkExportPages.length,
                      )}
                    </b>
                  </footer>
                </div>
              </div>
            );
          })}
        </div>

        <div
          ref={stationTopFiveExportRef}
          className="rankingTopFiveStage"
        >
          {stationTopFiveExportRows.map((track) => (
            <div
              key={`station-top-five-card-${stationRankingPeriod}-${chartStation.id}-${track.position}`}
              className="rankingTopFiveCard"
            >
              <div className="rankingTopFiveSafeArea">
                <div className="rankingTopFiveBrand">
                  <img
                    src={chartStation.logo}
                    alt=""
                    aria-hidden="true"
                    onError={(event) => {
                      event.currentTarget.src =
                        OFFICIAL_FIERAMIX_LOGO;
                    }}
                  />

                  <div>
                    <span>FIERAMIX CHARTS</span>
                    <strong>{chartStation.name}</strong>
                    <small>
                      {stationRankingPeriodConfig.label}
                    </small>
                  </div>
                </div>

                <div className="rankingTopFivePosition">
                  <span>POSICIÓN</span>
                  <strong>
                    #{formatExportPageNumber(track.position)}
                  </strong>
                </div>

                <figure className="rankingTopFiveArtwork">
                  <img
                    src={resolveRankingArtwork(
                      track.artist,
                      track.artwork,
                      chartStation.logo,
                    )}
                    alt=""
                    aria-hidden="true"
                    onError={(event) => {
                      handleRankingArtworkError(
                        event.currentTarget,
                        track.artist,
                        chartStation.logo,
                      );
                    }}
                  />
                </figure>

                <div className="rankingTopFiveSong">
                  <span>TOP 5 DESTACADO</span>

                  <div className="rankingTopFiveOrigin">
                    RANKING: {stationRankingPeriodConfig.label} · {chartStation.name}
                  </div>

                  <h2>{track.title}</h2>
                  <p>{track.artist}</p>
                </div>

                <div className="rankingTopFiveMetric">
                  <strong>
                    {track.plays}{" "}
                    {track.plays === 1
                      ? "TOCADA"
                      : "TOCADAS"}
                  </strong>
                  <span>
                    {stationRankingRange} · ACTUALIZADO{" "}
                    {stationRankingUpdateDateTime}
                  </span>
                </div>

                <footer className="rankingTopFiveFooter">
                  <div className="rankingTopFiveFooterBrand">
                    <strong>
                      EL GRUPO FIERAMIX.COM
                    </strong>
                    <small>
                      LA RED LATINA QUE MUEVE AL MUNDO
                    </small>

                    <div
                      className="rankingTopFiveSocials"
                      aria-label="Redes sociales"
                    >
                      <span aria-label="Facebook">
                        <RankingSocialIcon type="facebook" />
                      </span>
                      <span aria-label="Instagram">
                        <RankingSocialIcon type="instagram" />
                      </span>
                      <span aria-label="TikTok">
                        <RankingSocialIcon type="tiktok" />
                      </span>
                      <span aria-label="X">
                        <RankingSocialIcon type="x" />
                      </span>
                      <span aria-label="YouTube">
                        <RankingSocialIcon type="youtube" />
                      </span>
                    </div>

                    <div className="rankingTopFiveWhatsapp">
                      <span>809 841 9586</span>
                    </div>
                  </div>
                </footer>
              </div>
            </div>
          ))}
        </div>

        <div
          ref={networkTopFiveExportRef}
          className="rankingTopFiveStage"
        >
          {networkTopFiveExportRows.map((track) => (
            <div
              key={`network-top-five-card-${rankingPeriod}-${track.position}`}
              className="rankingTopFiveCard"
            >
              <div className="rankingTopFiveSafeArea">
                <div className="rankingTopFiveBrand">
                  <img
                    src={OFFICIAL_FIERAMIX_LOGO}
                    alt=""
                    aria-hidden="true"
                  />

                  <div>
                    <span>FIERAMIX CHARTS</span>
                    <strong>
                      EL GRUPO FIERAMIX.COM
                    </strong>
                    <small>
                      {rankingPeriodConfig.label}
                    </small>
                  </div>
                </div>

                <div className="rankingTopFivePosition">
                  <span>POSICIÓN</span>
                  <strong>
                    #{formatExportPageNumber(track.position)}
                  </strong>
                </div>

                <figure className="rankingTopFiveArtwork">
                  <img
                    src={resolveRankingArtwork(
                      track.artist,
                      track.artwork,
                      OFFICIAL_FIERAMIX_LOGO,
                    )}
                    alt=""
                    aria-hidden="true"
                    onError={(event) => {
                      handleRankingArtworkError(
                        event.currentTarget,
                        track.artist,
                        OFFICIAL_FIERAMIX_LOGO,
                      );
                    }}
                  />
                </figure>

                <div className="rankingTopFiveSong">
                  <span>TOP 5 DESTACADO</span>

                  <div className="rankingTopFiveOrigin">
                    RANKING: {rankingPeriodConfig.label} · GENERAL DE LA RED
                  </div>

                  <h2>{track.title}</h2>
                  <p>{track.artist}</p>
                </div>

                <div className="rankingTopFiveMetric">
                  <strong>
                    {track.plays}{" "}
                    {track.plays === 1
                      ? "TOCADA"
                      : "TOCADAS"}
                  </strong>
                  <span>
                    {networkRankingRange} · ACTUALIZADO{" "}
                    {networkRankingUpdateDateTime}
                  </span>
                </div>

                <footer className="rankingTopFiveFooter">
                  <div className="rankingTopFiveFooterBrand">
                    <strong>
                      EL GRUPO FIERAMIX.COM
                    </strong>
                    <small>
                      LA RED LATINA QUE MUEVE AL MUNDO
                    </small>

                    <div
                      className="rankingTopFiveSocials"
                      aria-label="Redes sociales"
                    >
                      <span aria-label="Facebook">
                        <RankingSocialIcon type="facebook" />
                      </span>
                      <span aria-label="Instagram">
                        <RankingSocialIcon type="instagram" />
                      </span>
                      <span aria-label="TikTok">
                        <RankingSocialIcon type="tiktok" />
                      </span>
                      <span aria-label="X">
                        <RankingSocialIcon type="x" />
                      </span>
                      <span aria-label="YouTube">
                        <RankingSocialIcon type="youtube" />
                      </span>
                    </div>

                    <div className="rankingTopFiveWhatsapp">
                      <span>809 841 9586</span>
                    </div>
                  </div>
                </footer>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .chartsSection {
          position: relative;
          width: min(1180px, calc(100% - 34px));
          margin: 34px auto 0;
          padding: 24px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 24px;
          background:
            radial-gradient(
              circle at 14% 0%,
              rgba(255, 78, 115, 0.08),
              transparent 34%
            ),
            radial-gradient(
              circle at 88% 12%,
              rgba(147, 91, 255, 0.11),
              transparent 30%
            ),
            rgba(8, 9, 21, 0.88);
          box-shadow:
            0 26px 70px rgba(0, 0, 0, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.025);
        }

        .chartsHeading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 18px;
        }

        .chartsHeading > div {
          min-width: 0;
        }

        .chartsHeading span {
          color: #ff6b91;
          font-size: 0.64rem;
          font-weight: 1000;
          letter-spacing: 0.18em;
        }

        .chartsHeading h2 {
          margin: 5px 0 0;
          color: #fff;
          font-size: clamp(1.35rem, 2.7vw, 2.15rem);
          line-height: 0.98;
          letter-spacing: -0.045em;
        }

        .chartsHeading p {
          max-width: 390px;
          margin: 0;
          color: rgba(255, 255, 255, 0.48);
          font-size: 0.75rem;
          line-height: 1.55;
          text-align: right;
        }

        .chartsGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .chartPanel {
          min-width: 0;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.065);
          border-radius: 18px;
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.027),
              rgba(255, 255, 255, 0.01)
            ),
            rgba(5, 7, 17, 0.72);
        }

        .stationChart {
          transition:
            border-color 0.24s ease,
            box-shadow 0.24s ease;
          border-color: color-mix(
            in srgb,
            var(--station-accent) 20%,
            rgba(255, 255, 255, 0.055)
          );
          box-shadow:
            inset 0 1px 0 color-mix(
              in srgb,
              var(--station-accent) 12%,
              transparent
            ),
            0 0 28px color-mix(
              in srgb,
              var(--station-accent) 5%,
              transparent
            );
        }

        .rankingDataStamp {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 0 12px 10px;
          padding: 7px 9px;
          border: 1px solid rgba(255, 255, 255, 0.045);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.014);
          color: rgba(255, 255, 255, 0.35);
          font-size: 0.39rem;
          font-weight: 950;
          letter-spacing: 0.055em;
        }

        .rankingDataStamp > span {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .rankingDataStamp > span i {
          width: 5px;
          height: 5px;
          flex: 0 0 5px;
          border-radius: 50%;
          background: #45f5aa;
          box-shadow: 0 0 9px rgba(69, 245, 170, 0.65);
        }

        .rankingDataStamp > strong {
          flex: 0 0 auto;
          color: rgba(255, 255, 255, 0.52);
          font-size: 0.39rem;
          font-weight: 1000;
          letter-spacing: 0.055em;
          white-space: nowrap;
        }

        .stationRankingDataStamp > span i {
          background: var(--station-accent);
          box-shadow:
            0 0 9px
            color-mix(
              in srgb,
              var(--station-accent) 62%,
              transparent
            );
        }

        .networkRankingDataStamp {
          margin-top: -2px;
        }

        .rankingExportBar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin: 0 12px 10px;
          padding: 8px 9px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.016);
        }

        .rankingExportBar > span {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.42);
          font-size: 0.39rem;
          font-weight: 1000;
          letter-spacing: 0.07em;
          white-space: nowrap;
        }

        .rankingExportBar > span i {
          display: grid;
          place-items: center;
          width: 20px;
          height: 20px;
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.045);
          color: #fff;
          font-size: 0.58rem;
          font-style: normal;
        }

        .rankingExportBar > div {
          display: flex;
          gap: 5px;
        }

        .rankingExportBar button {
          min-width: 42px;
          padding: 6px 7px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.68);
          cursor: pointer;
          font-size: 0.38rem;
          font-weight: 1000;
          letter-spacing: 0.05em;
          transition:
            transform 0.16s ease,
            border-color 0.16s ease,
            color 0.16s ease,
            background 0.16s ease;
        }

        .rankingExportBar button:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
        }

        .stationRankingExportBar button:hover:not(:disabled) {
          border-color:
            color-mix(
              in srgb,
              var(--station-accent) 42%,
              transparent
            );
          color:
            color-mix(
              in srgb,
              var(--station-accent) 72%,
              white
            );
        }

        .networkRankingExportBar button:hover:not(:disabled) {
          border-color: rgba(255, 104, 149, 0.34);
          color: #ff9ab8;
        }

        .rankingExportBar button:disabled {
          cursor: not-allowed;
          opacity: 0.38;
        }

        .rankingExportBar button.rankingPackageButton {
          min-width: 86px;
          border-color: rgba(255, 200, 93, 0.18);
          background: rgba(255, 200, 93, 0.06);
          color: #ffc85d;
        }

        .rankingExportBar button.rankingPackageButton:hover:not(:disabled) {
          border-color: rgba(255, 200, 93, 0.35);
          background: rgba(255, 200, 93, 0.1);
          color: #ffe09b;
        }

        .rankingExportMessage {
          margin: 10px 2px 0;
          color: rgba(255, 255, 255, 0.52);
          font-size: 0.68rem;
          line-height: 1.45;
          text-align: right;
        }

        .rankingExportStage {
          position: fixed;
          top: 0;
          left: -100000px;
          z-index: -1;
          width: 1080px;
          pointer-events: none;
        }

        .rankingExportPages {
          width: 1080px;
        }

        .rankingExportSheet {
          position: relative;
          width: 1080px;
          height: 1920px;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 12% 0%,
              rgba(255, 71, 117, 0.22),
              transparent 34%
            ),
            radial-gradient(
              circle at 94% 6%,
              rgba(91, 112, 255, 0.24),
              transparent 31%
            ),
            linear-gradient(
              180deg,
              #091529 0%,
              #07101f 52%,
              #050b16 100%
            );
          color: #ffffff;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        .rankingExportSafeArea {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          padding: 82px 82px 86px;
        }

        .rankingExportIdentity {
          display: flex;
          align-items: center;
          gap: 22px;
          margin-top: 0;
          padding: 22px 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.03);
        }

        .rankingExportIdentityMark {
          display: grid;
          place-items: center;
          width: 96px;
          height: 96px;
          overflow: hidden;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.07);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.07);
          flex-shrink: 0;
        }

        .rankingExportIdentityMark.station {
          padding: 14px;
        }

        .rankingExportIdentityMark.network {
          padding: 10px;
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.09),
              rgba(255, 255, 255, 0.03)
            );
        }

        .rankingExportIdentityMark img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .rankingExportIdentityText {
          display: grid;
          min-width: 0;
          align-content: center;
          justify-items: start;
          gap: 4px;
          text-align: left;
        }

        .rankingExportIdentityText span {
          color: #7bf5be;
          font-size: 12px;
          font-weight: 1000;
          letter-spacing: 0.12em;
          line-height: 1;
        }

        .rankingExportIdentityText strong {
          display: block;
          overflow: visible;
          color: #ffffff;
          font-size: 24px;
          font-weight: 1000;
          line-height: 1.05;
          letter-spacing: -0.03em;
          text-align: left;
          text-overflow: clip;
          white-space: nowrap;
        }

        .rankingExportIdentityText small {
          display: block;
          overflow: visible;
          margin-top: 1px;
          color: rgba(255, 255, 255, 0.56);
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: 0.035em;
          text-align: left;
          text-overflow: clip;
          white-space: nowrap;
        }

        .rankingExportHero {
          padding: 26px 0 22px;
        }

        .rankingExportHero > span {
          color: #ff7197;
          font-size: 15px;
          font-weight: 1000;
          letter-spacing: 0.16em;
        }

        .rankingExportHero h2 {
          max-width: 850px;
          margin: 10px 0 14px;
          color: #ffffff;
          font-size: 46px;
          line-height: 0.98;
          letter-spacing: -0.045em;
        }

        .rankingExportHero p {
          margin: 0;
          color: rgba(255, 255, 255, 0.6);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.025em;
        }

        .rankingExportPageInfo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
          padding: 17px 20px;
          border: 1px solid rgba(255, 255, 255, 0.085);
          border-radius: 14px;
          background:
            linear-gradient(
              90deg,
              rgba(255, 193, 71, 0.09),
              rgba(255, 255, 255, 0.025)
            );
        }

        .rankingExportPageInfo strong {
          color: #ffc85d;
          font-size: 15px;
          font-weight: 1000;
          letter-spacing: 0.07em;
        }

        .rankingExportPageInfo span {
          color: rgba(255, 255, 255, 0.58);
          font-size: 13px;
          font-weight: 1000;
          letter-spacing: 0.08em;
        }

        .rankingExportTableHead {
          display: grid;
          grid-template-columns: 70px 96px minmax(0, 1fr) 220px;
          align-items: center;
          gap: 18px;
          min-height: 58px;
          padding: 14px 20px;
          border-radius: 12px 12px 0 0;
          background: rgba(255, 255, 255, 0.07);
          color: rgba(255, 255, 255, 0.52);
          font-size: 11px;
          font-weight: 1000;
          letter-spacing: 0.08em;
        }

        .rankingExportTableHead > i {
          color: rgba(255, 255, 255, 0.46);
          font-size: 11px;
          font-style: normal;
          font-weight: 1000;
          letter-spacing: 0.08em;
          text-align: center;
        }

        .rankingExportTableHead > strong {
          text-align: right;
        }

        .rankingExportRows {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .rankingExportRows li {
          display: grid;
          grid-template-columns: 70px 96px minmax(0, 1fr) 220px;
          align-items: center;
          gap: 18px;
          height: 104px;
          padding: 12px 20px;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          border-left: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.018);
        }

        .rankingExportRows li:nth-child(-n + 3) {
          background:
            linear-gradient(
              90deg,
              rgba(255, 193, 71, 0.09),
              rgba(255, 255, 255, 0.02)
            );
        }

        .rankingExportRows li > b {
          color: #ffc85d;
          font-size: 24px;
          font-weight: 1000;
        }

        .rankingExportCover {
          display: grid;
          place-items: center;
          width: 96px;
          height: 96px;
          margin: 0;
          overflow: hidden;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.07);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
        }

        .rankingExportCover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .rankingExportRows li > span {
          display: grid;
          min-width: 0;
          gap: 7px;
        }

        .rankingExportRows li > span strong {
          overflow: hidden;
          color: #ffffff;
          font-size: 18px;
          font-weight: 1000;
          letter-spacing: -0.018em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rankingExportRows li > span small {
          overflow: hidden;
          color: rgba(255, 255, 255, 0.48);
          font-size: 11px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rankingExportRows li > em {
          color: #75ffd0;
          font-size: 14px;
          font-style: normal;
          font-weight: 1000;
          letter-spacing: 0.02em;
          text-align: right;
        }

        .rankingExportSummary {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 20px;
        }

        .rankingExportSummary > span {
          display: grid;
          gap: 5px;
          padding: 16px 18px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.42);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .rankingExportSummary > span strong {
          overflow: hidden;
          color: #ffffff;
          font-size: 18px;
          font-weight: 1000;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rankingExportFooter {
          display: flex;
          align-items: end;
          justify-content: space-between;
          text-align: left;
          gap: 24px;
          margin-top: auto;
          padding-top: 22px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .rankingExportFooterBrand {
          display: grid;
          min-width: 0;
          justify-items: start;
          gap: 9px;
          text-align: left;
        }

        .rankingExportFooterBrandText {
          display: grid;
          justify-items: start;
          align-items: start;
          gap: 4px;
          margin: 0;
          padding: 0;
          text-align: left;
        }

        .rankingExportFooterBrandText > strong {
          display: block;
          margin: 0;
          padding: 0;
          color: #ffffff;
          font-size: 16px;
          font-weight: 1000;
          line-height: 1.1;
          text-align: left;
        }

        .rankingExportFooterBrandText > small {
          display: block;
          justify-self: start;
          margin: 0;
          padding: 0;
          color: #7fe7ff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.04em;
          line-height: 1.1;
          text-align: left;
          text-indent: 0;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .rankingExportSocials {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px 11px;
          max-width: 720px;
        }

        .rankingExportSocials > span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.045);
          color: rgba(255, 255, 255, 0.82);
        }

        .rankingExportSocials > span.facebook {
          color: #78a8ff;
        }

        .rankingExportSocials > span.instagram {
          color: #ff84bf;
        }

        .rankingExportSocials > span.tiktok {
          color: #ffffff;
        }

        .rankingExportSocials > span.x {
          color: #ffffff;
        }

        .rankingExportSocials > span.youtube {
          color: #ff6d6d;
        }

        .rankingExportContact {
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          justify-self: start;
          gap: 7px;
          width: fit-content;
          padding: 0;
          border: 0;
          background: transparent;
          color: #ffc85d;
          font-size: 12px;
          font-weight: 1000;
          letter-spacing: 0.055em;
          line-height: 1;
          white-space: nowrap;
        }

        .rankingExportContact svg {
          width: 20px;
          height: 20px;
          flex: 0 0 20px;
        }

        .rankingExportSocials svg {
          width: 18px;
          height: 18px;
          flex: 0 0 18px;
          overflow: visible;
        }

        .rankingExportFooter > b {
          flex: 0 0 auto;
          color: #ffc85d;
          font-size: 12px;
          font-weight: 1000;
          letter-spacing: 0.08em;
          white-space: nowrap;
        }

        .rankingTopFiveStage {
          width: 1080px;
        }

        .rankingTopFiveCard {
          position: relative;
          width: 1080px;
          height: 1920px;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 16% 3%,
              rgba(255, 78, 125, 0.24),
              transparent 34%
            ),
            radial-gradient(
              circle at 88% 10%,
              rgba(87, 121, 255, 0.28),
              transparent 34%
            ),
            linear-gradient(
              180deg,
              #09162a 0%,
              #07101f 54%,
              #040915 100%
            );
          color: #fff;
          font-family: Arial, Helvetica, sans-serif;
        }

        .rankingTopFiveSafeArea {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          padding: 86px 82px 92px;
        }

        .rankingTopFiveBrand {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 18px 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.03);
        }

        .rankingTopFiveBrand > img {
          width: 86px;
          height: 86px;
          flex: 0 0 86px;
          object-fit: contain;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.08);
          padding: 10px;
        }

        .rankingTopFiveBrand > div {
          display: grid;
          gap: 4px;
          min-width: 0;
        }

        .rankingTopFiveBrand span {
          color: #7bf5be;
          font-size: 12px;
          font-weight: 1000;
          letter-spacing: 0.12em;
        }

        .rankingTopFiveBrand strong {
          color: #fff;
          font-size: 25px;
          font-weight: 1000;
          line-height: 1;
        }

        .rankingTopFiveBrand small {
          color: rgba(255, 255, 255, 0.54);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .rankingTopFivePosition {
          display: flex;
          align-items: end;
          justify-content: space-between;
          margin-top: 54px;
        }

        .rankingTopFivePosition span {
          color: #ff7da3;
          font-size: 17px;
          font-weight: 1000;
          letter-spacing: 0.15em;
        }

        .rankingTopFivePosition strong {
          color: #ffc85d;
          font-size: 94px;
          font-weight: 1000;
          line-height: 0.78;
          letter-spacing: -0.07em;
        }

        .rankingTopFiveArtwork {
          width: 760px;
          height: 760px;
          margin: 42px auto 0;
          overflow: hidden;
          border-radius: 44px;
          background: rgba(255, 255, 255, 0.06);
          box-shadow:
            0 38px 90px rgba(0, 0, 0, 0.42),
            0 0 0 1px rgba(255, 255, 255, 0.08);
        }

        .rankingTopFiveArtwork img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .rankingTopFiveSong {
          margin-top: 44px;
          text-align: center;
        }

        .rankingTopFiveSong > span {
          color: #7bf5be;
          font-size: 14px;
          font-weight: 1000;
          letter-spacing: 0.15em;
        }

        .rankingTopFiveOrigin {
          width: fit-content;
          max-width: 880px;
          margin: 10px auto 0;
          padding: 8px 14px;
          border: 1px solid rgba(255, 200, 93, 0.16);
          border-radius: 999px;
          background: rgba(255, 200, 93, 0.055);
          color: #ffc85d;
          font-size: 12px;
          font-weight: 1000;
          line-height: 1;
          letter-spacing: 0.055em;
          text-align: center;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .rankingTopFiveSong h2 {
          max-width: 880px;
          margin: 16px auto 0;
          color: #fff;
          font-size: 54px;
          font-weight: 1000;
          line-height: 0.98;
          letter-spacing: -0.045em;
        }

        .rankingTopFiveSong p {
          margin: 14px 0 0;
          color: rgba(255, 255, 255, 0.62);
          font-size: 25px;
          font-weight: 800;
        }

        .rankingTopFiveMetric {
          display: grid;
          justify-items: center;
          gap: 9px;
          margin-top: 34px;
        }

        .rankingTopFiveMetric strong {
          color: #70ffd0;
          font-size: 27px;
          font-weight: 1000;
          letter-spacing: 0.04em;
        }

        .rankingTopFiveMetric span {
          color: rgba(255, 255, 255, 0.48);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.035em;
        }

        .rankingTopFiveFooter {
          display: block;
          margin-top: auto;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .rankingTopFiveFooterBrand {
          display: grid;
          justify-items: center;
          align-items: center;
          gap: 7px;
          margin: 0 auto;
          padding: 0;
          text-align: center;
        }

        .rankingTopFiveFooter strong {
          display: block;
          margin: 0;
          padding: 0;
          color: #fff;
          font-size: 17px;
          font-weight: 1000;
          line-height: 1.05;
          text-align: center;
        }

        .rankingTopFiveFooter small {
          display: block;
          justify-self: center;
          margin: 0;
          padding: 0;
          color: #7fe7ff;
          font-size: 10px;
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: 0.035em;
          text-align: center;
          text-indent: 0;
          white-space: nowrap;
        }

        .rankingTopFiveSocials {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 3px;
        }

        .rankingTopFiveSocials > span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border: 1px solid rgba(255, 255, 255, 0.11);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.045);
        }

        .rankingTopFiveSocials svg {
          width: 19px;
          height: 19px;
          flex: 0 0 19px;
          overflow: visible;
        }

        .rankingTopFiveWhatsapp {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-top: 4px;
          color: #ffc85d;
          font-size: 17px;
          font-weight: 1000;
          line-height: 1;
          letter-spacing: 0.045em;
          text-align: center;
        }

        .stationPeriodTabs {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
          padding: 12px 12px 2px;
        }

        .stationPeriodTabs button {
          display: grid;
          gap: 3px;
          min-width: 0;
          padding: 9px 7px;
          border: 1px solid rgba(255, 255, 255, 0.055);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.018);
          color: #7f758a;
          cursor: pointer;
          text-align: left;
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            background 0.18s ease,
            color 0.18s ease;
        }

        .stationPeriodTabs button:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        .stationPeriodTabs button.isActive {
          border-color:
            color-mix(
              in srgb,
              var(--station-accent) 42%,
              transparent
            );
          background:
            color-mix(
              in srgb,
              var(--station-accent) 10%,
              transparent
            );
          color: #fff;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .stationPeriodTabs strong {
          overflow: hidden;
          font-size: 0.43rem;
          font-weight: 1000;
          letter-spacing: 0.035em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationPeriodTabs span {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.36rem;
          font-weight: 1000;
          letter-spacing: 0.08em;
        }

        .stationPeriodTabs button.isActive span {
          color:
            color-mix(
              in srgb,
              var(--station-accent) 78%,
              white
            );
        }

        .stationHistoricalStatus {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          margin: 0 12px 10px;
          padding: 10px 11px;
          border: 1px solid rgba(255, 191, 71, 0.11);
          border-radius: 13px;
          background:
            linear-gradient(
              90deg,
              rgba(255, 191, 71, 0.055),
              rgba(255, 255, 255, 0.014)
            );
        }

        .stationHistoricalStatus > span {
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border-radius: 10px;
          background: rgba(255, 191, 71, 0.075);
          color: #ffc65e;
          font-size: 0.8rem;
        }

        .stationHistoricalStatus > div {
          min-width: 0;
        }

        .stationHistoricalStatus > div strong {
          display: block;
          color: #ead5aa;
          font-size: 0.46rem;
          font-weight: 1000;
          letter-spacing: 0.07em;
        }

        .stationHistoricalStatus > div small {
          display: block;
          margin-top: 3px;
          overflow: hidden;
          color: #746a79;
          font-size: 0.4rem;
          line-height: 1.4;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationHistoricalStatus > b {
          color: #ffc65e;
          font-size: 0.8rem;
          font-weight: 1000;
        }

        .stationHistoricalStatus.isOfficial {
          border-color: rgba(54, 246, 163, 0.15);
          background:
            linear-gradient(
              90deg,
              rgba(54, 246, 163, 0.06),
              rgba(255, 255, 255, 0.014)
            );
        }

        .stationHistoricalStatus.isOfficial > span {
          background: rgba(54, 246, 163, 0.08);
          color: #5affc1;
        }

        .stationHistoricalStatus.isOfficial > div strong,
        .stationHistoricalStatus.isOfficial > b {
          color: #76ffd0;
        }

        .stationRankingLoading {
          display: grid;
          place-items: center;
          gap: 6px;
          min-height: 310px;
          padding: 30px;
          text-align: center;
        }

        .stationRankingLoading strong {
          color: #e9e0ef;
          font-size: 0.55rem;
          font-weight: 1000;
          letter-spacing: 0.08em;
        }

        .stationRankingLoading span {
          color: #756b80;
          font-size: 0.47rem;
        }

        .stationHistoricalList li.historicalPodium {
          background:
            linear-gradient(
              90deg,
              color-mix(
                in srgb,
                var(--station-accent) 8%,
                transparent
              ),
              rgba(255, 255, 255, 0.012)
            );
        }

        .historicalStationPlayCount strong {
          color:
            color-mix(
              in srgb,
              var(--station-accent) 68%,
              #fff
            );
        }

        .stationRankingFooter button {
          border: 0;
          background: transparent;
          color:
            color-mix(
              in srgb,
              var(--station-accent) 75%,
              white
            );
          cursor: pointer;
          font-size: 0.43rem;
          font-weight: 1000;
          letter-spacing: 0.04em;
        }

        .stationRankingFooter button span {
          margin-left: 5px;
        }

        .networkPeriodTabs {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          padding: 14px 14px 4px;
        }

        .networkPeriodTabs button {
          display: grid;
          gap: 4px;
          min-width: 0;
          padding: 10px 9px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.022);
          color: #8c8298;
          cursor: pointer;
          text-align: left;
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            background 0.18s ease,
            color 0.18s ease;
        }

        .networkPeriodTabs button:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        .networkPeriodTabs button.isActive {
          border-color: rgba(255, 82, 142, 0.34);
          background:
            linear-gradient(
              135deg,
              rgba(255, 73, 135, 0.12),
              rgba(139, 92, 246, 0.08)
            );
          color: #fff;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.045),
            0 8px 24px rgba(255, 40, 114, 0.06);
        }

        .networkPeriodTabs strong {
          overflow: hidden;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.04em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .networkPeriodTabs span {
          color: #6f647a;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .networkPeriodTabs button.isActive span {
          color: #ff7cab;
        }

        .rankingPeriodDescription {
          max-width: 420px;
          margin: 5px 0 0;
          color: #756b80;
          font-size: 9px;
          line-height: 1.45;
        }

        .historicalRankingStatus {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          margin: 0 14px 12px;
          padding: 13px 14px;
          border: 1px solid rgba(255, 192, 76, 0.12);
          border-radius: 14px;
          background:
            linear-gradient(
              90deg,
              rgba(255, 191, 71, 0.06),
              rgba(255, 255, 255, 0.018)
            );
        }

        .historicalRankingIcon {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 11px;
          background: rgba(255, 191, 71, 0.08);
          color: #ffc45c;
          font-size: 18px;
        }

        .historicalRankingStatus > div {
          min-width: 0;
        }

        .historicalRankingStatus > div strong {
          display: block;
          color: #f5e2b8;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.08em;
        }

        .historicalRankingStatus > div span {
          display: block;
          margin-top: 4px;
          color: #817461;
          font-size: 8px;
          line-height: 1.45;
        }

        .historicalRankingStatus > b {
          color: rgba(255, 201, 95, 0.9);
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .historicalRankingStatus.isOfficial {
          border-color: rgba(54, 246, 163, 0.18);
          background:
            linear-gradient(
              90deg,
              rgba(54, 246, 163, 0.07),
              rgba(255, 255, 255, 0.018)
            );
        }

        .historicalRankingStatus.isOfficial
          .historicalRankingIcon {
          background: rgba(54, 246, 163, 0.09);
          color: #52ffc0;
        }

        .historicalRankingStatus.isOfficial > div strong {
          color: #baffdf;
        }

        .historicalRankingStatus.isOfficial > b {
          color: #52ffc0;
        }

        .historicalLeaderSpotlight {
          display: grid;
          grid-template-columns: 64px 64px minmax(0, 1fr) auto;
          align-items: center;
          gap: 13px;
          margin: 0 14px 12px;
          padding: 11px 14px 11px 10px;
          border: 1px solid rgba(255, 194, 78, 0.16);
          border-radius: 16px;
          background:
            linear-gradient(
              90deg,
              rgba(255, 193, 71, 0.09),
              rgba(255, 255, 255, 0.022) 58%
            );
          box-shadow:
            inset 3px 0 0 #ffc147,
            inset 0 1px 0 rgba(255, 255, 255, 0.035);
        }

        .historicalLeaderSpotlight > img {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.24);
        }

        .historicalLeaderMetrics {
          display: grid;
          justify-items: end;
          gap: 4px;
        }

        .historicalLeaderMetrics strong {
          color: #ffc85d;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.05em;
        }

        .historicalLeaderMetrics span {
          color: #807382;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.06em;
        }

        .historicalList li.historicalPodium {
          background:
            linear-gradient(
              90deg,
              rgba(255, 193, 71, 0.055),
              rgba(255, 255, 255, 0.012)
            );
        }

        .historicalTrackMetrics {
          color: #d8b36a !important;
        }

        .historicalRankingNotice.isWarning {
          border-color: rgba(255, 128, 88, 0.16);
          background: rgba(24, 12, 16, 0.94);
        }

        .historicalRankingNotice.isWarning strong {
          color: #ffb092;
        }

        .historicalRankingPreview {
          position: relative;
          min-height: 380px;
          padding: 0 14px 14px;
        }

        .historicalRankingScale {
          display: grid;
          gap: 6px;
          opacity: 0.52;
        }

        .historicalRankingScale > span {
          display: grid;
          grid-template-columns: 32px minmax(40px, 1fr) auto;
          align-items: center;
          gap: 9px;
          min-height: 35px;
          padding: 5px 9px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.015);
        }

        .historicalRankingScale b {
          color: #70677a;
          font-size: 9px;
        }

        .historicalRankingScale i {
          height: 6px;
          border-radius: 999px;
          background:
            linear-gradient(
              90deg,
              rgba(255, 75, 137, 0.28),
              rgba(130, 91, 255, 0.06)
            );
        }

        .historicalRankingScale em {
          color: #51495a;
          font-size: 6px;
          font-style: normal;
          font-weight: 900;
          letter-spacing: 0.07em;
        }

        .historicalRankingNotice {
          position: absolute;
          left: 50%;
          top: 50%;
          display: grid;
          gap: 7px;
          width: min(360px, calc(100% - 42px));
          padding: 18px;
          transform: translate(-50%, -50%);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 16px;
          background: rgba(10, 10, 22, 0.92);
          box-shadow:
            0 20px 55px rgba(0, 0, 0, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          text-align: center;
          backdrop-filter: blur(14px);
        }

        .historicalRankingNotice strong {
          color: #fff;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.08em;
        }

        .historicalRankingNotice span {
          color: #8b8097;
          font-size: 9px;
          line-height: 1.55;
        }

        .historicalFooterState {
          color: #8b7d68;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .networkChart {
          box-shadow:
            inset 0 1px 0 rgba(157, 113, 255, 0.08);
        }

        .chartPanelHeader {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.055);
        }

        .chartPanelHeader > div:first-child {
          min-width: 0;
        }

        .chartPanelHeader > div:first-child > span {
          color: var(--station-accent, #ff6b91);
          font-size: 0.54rem;
          font-weight: 1000;
          letter-spacing: 0.14em;
        }

        .networkChart
          .chartPanelHeader
          > div:first-child
          > span {
          color: #ae8cff;
        }

        .chartPanelHeader h3 {
          max-width: 330px;
          margin: 4px 0 0;
          overflow: hidden;
          color: #fff;
          font-size: 0.94rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chartStationSelector {
          display: grid;
          justify-items: end;
          gap: 4px;
        }

        .chartStationSelector > span {
          color: rgba(255, 255, 255, 0.34);
          font-size: 0.46rem;
          font-weight: 950;
          letter-spacing: 0.13em;
        }

        .chartStationSelector select {
          max-width: 190px;
          min-height: 32px;
          padding: 0 28px 0 10px;
          border: 1px solid color-mix(
            in srgb,
            var(--station-accent) 28%,
            rgba(255, 255, 255, 0.07)
          );
          border-radius: 9px;
          outline: none;
          color: rgba(255, 255, 255, 0.78);
          background: #111320;
          font-size: 0.62rem;
          font-weight: 850;
          cursor: pointer;
        }

        .chartStationIdentity {
          min-height: 52px;
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 9px;
          padding: 8px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          background: rgba(255, 255, 255, 0.012);
        }

        .chartStationIdentity img {
          width: 34px;
          height: 34px;
          object-fit: contain;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
        }

        .chartStationIdentity div {
          min-width: 0;
        }

        .chartStationIdentity strong,
        .chartStationIdentity span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chartStationIdentity strong {
          color: rgba(255, 255, 255, 0.78);
          font-size: 0.62rem;
        }

        .chartStationIdentity span {
          margin-top: 2px;
          color: rgba(255, 255, 255, 0.35);
          font-size: 0.5rem;
        }

        .chartStationAudience {
          display: grid;
          justify-items: end;
          gap: 2px;
          padding: 4px 7px;
          border: 1px solid color-mix(
            in srgb,
            var(--station-accent) 20%,
            rgba(255, 255, 255, 0.05)
          );
          border-radius: 8px;
          background: color-mix(
            in srgb,
            var(--station-accent) 4%,
            transparent
          );
          white-space: nowrap;
        }

        .chartStationAudience strong {
          color: color-mix(
            in srgb,
            var(--station-accent) 78%,
            #ffffff
          );
          font-size: 0.54rem;
          font-weight: 1000;
          line-height: 1;
        }

        .chartStationAudience span {
          color: rgba(255, 255, 255, 0.32);
          font-size: 0.38rem;
          font-weight: 950;
          letter-spacing: 0.04em;
          line-height: 1;
        }

        .chartStationIdentity > i {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          box-shadow: 0 0 12px currentColor;
        }

        .networkChartBadge {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 9px;
          border: 1px solid rgba(174, 140, 255, 0.16);
          border-radius: 10px;
          background: rgba(174, 140, 255, 0.045);
        }

        .networkChartBadge > i {
          color: #ae8cff;
          font-size: 0.8rem;
          font-style: normal;
        }

        .networkChartBadge > span {
          display: grid;
          color: #fff;
          font-size: 0.8rem;
          font-weight: 1000;
          line-height: 0.8;
        }

        .networkChartBadge small {
          margin-top: 4px;
          color: rgba(255, 255, 255, 0.28);
          font-size: 0.38rem;
          letter-spacing: 0.09em;
        }

        .networkChartSummary {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          background: rgba(174, 140, 255, 0.018);
        }

        .networkChartLiveStatus {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: rgba(180, 154, 255, 0.7);
          font-size: 0.46rem;
          font-weight: 1000;
          letter-spacing: 0.08em;
          white-space: nowrap;
        }

        .networkChartLiveStatus i,
        .chartPanelFooter strong i {
          width: 5px;
          height: 5px;
          flex: 0 0 auto;
          border-radius: 999px;
          background: #5cf0a8;
          box-shadow: 0 0 9px rgba(92, 240, 168, 0.58);
        }

        .networkChartPulseMetrics {
          display: flex;
          align-items: stretch;
          justify-content: flex-end;
          gap: 5px;
          min-width: 0;
        }

        .networkChartPulseMetrics > span {
          min-width: 58px;
          display: grid;
          justify-items: center;
          gap: 2px;
          padding: 5px 7px;
          border: 1px solid rgba(174, 140, 255, 0.11);
          border-radius: 8px;
          background: rgba(174, 140, 255, 0.028);
        }

        .networkChartPulseMetrics strong {
          color: #fff;
          font-size: 0.58rem;
          font-weight: 1000;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .networkChartPulseMetrics > span:first-child strong {
          color: #71f3b4;
        }

        .networkChartPulseMetrics > span:nth-child(2) strong {
          color: #b99bff;
        }

        .networkChartPulseMetrics > span:last-child strong {
          color: #8fb7ff;
        }

        .networkChartPulseMetrics small {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.36rem;
          font-weight: 1000;
          letter-spacing: 0.06em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationLeaderSpotlight {
          min-width: 0;
          display: grid;
          grid-template-columns:
            auto 42px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          margin: 8px 10px;
          padding: 8px 10px;
          overflow: hidden;
          border: 1px solid color-mix(
            in srgb,
            var(--station-accent) 22%,
            rgba(255, 255, 255, 0.055)
          );
          border-radius: 12px;
          background:
            linear-gradient(
              100deg,
              color-mix(
                in srgb,
                var(--station-accent) 8%,
                transparent
              ),
              rgba(255, 255, 255, 0.012) 54%,
              transparent
            );
          box-shadow:
            inset 2px 0 0 color-mix(
              in srgb,
              var(--station-accent) 72%,
              transparent
            ),
            0 0 18px color-mix(
              in srgb,
              var(--station-accent) 6%,
              transparent
            );
        }

        .stationLeaderRank {
          display: grid;
          justify-items: center;
          gap: 1px;
          min-width: 34px;
        }

        .stationLeaderRank i {
          color: color-mix(
            in srgb,
            var(--station-accent) 78%,
            #ffffff
          );
          font-size: 0.55rem;
          font-style: normal;
          line-height: 1;
          text-shadow: 0 0 9px color-mix(
            in srgb,
            var(--station-accent) 28%,
            transparent
          );
        }

        .stationLeaderRank strong {
          color: color-mix(
            in srgb,
            var(--station-accent) 84%,
            #ffffff
          );
          font-size: 0.72rem;
          font-weight: 1000;
          line-height: 1;
        }

        .stationLeaderRank small {
          color: rgba(255, 255, 255, 0.28);
          font-size: 0.29rem;
          font-weight: 1000;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .stationLeaderSpotlight > img {
          width: 42px;
          height: 42px;
          object-fit: cover;
          border: 1px solid color-mix(
            in srgb,
            var(--station-accent) 22%,
            transparent
          );
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.035);
        }

        .stationLeaderSong,
        .stationLeaderStatus {
          min-width: 0;
        }

        .stationLeaderSong strong,
        .stationLeaderSong span,
        .stationLeaderStatus strong,
        .stationLeaderStatus span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationLeaderSong strong {
          color: #fff;
          font-size: 0.66rem;
          font-weight: 1000;
        }

        .stationLeaderSong span {
          margin-top: 2px;
          color: rgba(255, 255, 255, 0.42);
          font-size: 0.5rem;
        }

        .stationLeaderStatus {
          max-width: 145px;
          display: grid;
          justify-items: end;
          gap: 2px;
          padding-left: 8px;
        }

        .stationLeaderStatus strong {
          color: color-mix(
            in srgb,
            var(--station-accent) 78%,
            #ffffff
          );
          font-size: 0.46rem;
          font-weight: 1000;
        }

        .stationLeaderStatus span {
          color: #71f3b4;
          font-size: 0.39rem;
          font-weight: 1000;
          letter-spacing: 0.04em;
        }

        .networkLeaderSpotlight {
          min-width: 0;
          display: grid;
          grid-template-columns:
            auto 42px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          margin: 8px 10px;
          padding: 8px 10px;
          overflow: hidden;
          border: 1px solid color-mix(
            in srgb,
            var(--leader-accent) 22%,
            rgba(255, 255, 255, 0.055)
          );
          border-radius: 12px;
          background:
            linear-gradient(
              100deg,
              color-mix(
                in srgb,
                var(--leader-accent) 8%,
                transparent
              ),
              rgba(255, 255, 255, 0.012) 54%,
              transparent
            );
          box-shadow:
            inset 2px 0 0 color-mix(
              in srgb,
              var(--leader-accent) 72%,
              transparent
            ),
            0 0 18px color-mix(
              in srgb,
              var(--leader-accent) 6%,
              transparent
            );
        }

        .networkLeaderRank {
          display: grid;
          justify-items: center;
          gap: 1px;
          min-width: 34px;
        }

        .networkLeaderRank i {
          color: #ffd76a;
          font-size: 0.55rem;
          font-style: normal;
          line-height: 1;
          text-shadow: 0 0 9px rgba(255, 215, 106, 0.25);
        }

        .networkLeaderRank strong {
          color: #ffd76a;
          font-size: 0.72rem;
          font-weight: 1000;
          line-height: 1;
        }

        .networkLeaderRank small {
          color: rgba(255, 255, 255, 0.28);
          font-size: 0.29rem;
          font-weight: 1000;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .networkLeaderSpotlight > img {
          width: 42px;
          height: 42px;
          object-fit: cover;
          border: 1px solid color-mix(
            in srgb,
            var(--leader-accent) 22%,
            transparent
          );
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.035);
        }

        .networkLeaderSong,
        .networkLeaderStation {
          min-width: 0;
        }

        .networkLeaderSong strong,
        .networkLeaderSong span,
        .networkLeaderStation strong,
        .networkLeaderStation span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .networkLeaderSong strong {
          color: #fff;
          font-size: 0.66rem;
          font-weight: 1000;
        }

        .networkLeaderSong span {
          margin-top: 2px;
          color: rgba(255, 255, 255, 0.42);
          font-size: 0.5rem;
        }

        .networkLeaderStation {
          max-width: 150px;
          display: grid;
          justify-items: end;
          gap: 2px;
          padding-left: 8px;
        }

        .networkLeaderStation strong {
          color: color-mix(
            in srgb,
            var(--leader-accent) 80%,
            #ffffff
          );
          font-size: 0.48rem;
          font-weight: 1000;
        }

        .networkLeaderStation span {
          color: #71f3b4;
          font-size: 0.4rem;
          font-weight: 1000;
          letter-spacing: 0.03em;
        }

        .networkLeaderStation a {
          min-height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin-top: 3px;
          padding: 0 7px;
          border: 1px solid color-mix(
            in srgb,
            var(--leader-accent) 24%,
            rgba(255, 255, 255, 0.05)
          );
          border-radius: 7px;
          color: color-mix(
            in srgb,
            var(--leader-accent) 82%,
            #ffffff
          );
          background: color-mix(
            in srgb,
            var(--leader-accent) 5%,
            transparent
          );
          font-size: 0.37rem;
          font-weight: 1000;
          letter-spacing: 0.05em;
          text-decoration: none;
          white-space: nowrap;
          transition:
            transform 0.18s ease,
            border-color 0.18s ease,
            background 0.18s ease;
        }

        .networkLeaderStation a:hover {
          transform: translateY(-1px);
          border-color: color-mix(
            in srgb,
            var(--leader-accent) 48%,
            rgba(255, 255, 255, 0.08)
          );
          background: color-mix(
            in srgb,
            var(--leader-accent) 10%,
            transparent
          );
        }

        .networkLeaderStation a i {
          font-size: 0.5rem;
          font-style: normal;
          line-height: 1;
        }

        .chartList {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .chartList li {
          min-height: 48px;
          display: grid;
          grid-template-columns: 26px 34px minmax(0, 1fr) auto;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.035);
          transition:
            background 0.18s ease,
            transform 0.18s ease;
        }

        .chartList li:last-child {
          border-bottom: 0;
        }

        .chartList li:hover {
          background: rgba(255, 255, 255, 0.024);
        }

        .stationChart .chartList li.isLive {
          background:
            linear-gradient(
              90deg,
              color-mix(
                in srgb,
                var(--station-accent) 10%,
                transparent
              ),
              transparent 58%
            );
          box-shadow:
            inset 2px 0 0 color-mix(
              in srgb,
              var(--station-accent) 68%,
              transparent
            );
        }

        .networkList li {
          position: relative;
        }

        .networkList li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 9px;
          bottom: 9px;
          width: 2px;
          border-radius: 999px;
          background: color-mix(
            in srgb,
            var(--track-accent) 76%,
            transparent
          );
          box-shadow: 0 0 8px color-mix(
            in srgb,
            var(--track-accent) 24%,
            transparent
          );
          opacity: 0.66;
        }

        .networkList li.isLive {
          background:
            linear-gradient(
              90deg,
              color-mix(
                in srgb,
                var(--track-accent) 8%,
                transparent
              ),
              transparent 62%
            );
        }

        .networkList li.isLive::before {
          width: 3px;
          opacity: 1;
          box-shadow: 0 0 12px color-mix(
            in srgb,
            var(--track-accent) 42%,
            transparent
          );
        }

        .chartList li > b {
          color: rgba(255, 255, 255, 0.2);
          font-size: 0.56rem;
          font-weight: 1000;
          font-variant-numeric: tabular-nums;
        }

        .chartList li:nth-child(1) > b {
          color: #ffd76a;
        }

        .chartList li:nth-child(2) > b {
          color: #dce4ef;
        }

        .chartList li:nth-child(3) > b {
          color: #d99a70;
        }

        .chartList li > img {
          width: 34px;
          height: 34px;
          object-fit: cover;
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.035);
        }

        .chartList li > span {
          min-width: 0;
        }

        .chartList li > span strong,
        .chartList li > span small {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chartList li > span strong {
          color: rgba(255, 255, 255, 0.82);
          font-size: 0.62rem;
          font-weight: 900;
        }

        .chartList li > span small {
          margin-top: 2px;
          color: rgba(255, 255, 255, 0.35);
          font-size: 0.5rem;
        }

        .chartList li > em {
          max-width: 115px;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.24);
          font-size: 0.42rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: 0.06em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationChart .chartList li.isLive > em {
          color: var(--station-accent, #ff6b91);
        }

        .stationChart .chartList li:nth-child(1) > b {
          color: var(--station-accent, #ffd76a);
          text-shadow: 0 0 10px color-mix(
            in srgb,
            var(--station-accent) 34%,
            transparent
          );
        }

        .stationChart .chartPanelFooter strong {
          color: color-mix(
            in srgb,
            var(--station-accent) 72%,
            #ffffff
          );
        }

        .stationChart .chartPanelFooter strong i {
          background: var(--station-accent);
          box-shadow: 0 0 9px color-mix(
            in srgb,
            var(--station-accent) 58%,
            transparent
          );
        }

        .networkTrackStation {
          color: color-mix(
            in srgb,
            var(--track-accent) 74%,
            #ffffff
          ) !important;
        }

        .networkTrackStation.live {
          color: color-mix(
            in srgb,
            var(--track-accent) 88%,
            #ffffff
          ) !important;
          text-shadow: 0 0 9px color-mix(
            in srgb,
            var(--track-accent) 20%,
            transparent
          );
        }

        .stationTrackPlayCount {
          display: grid;
          justify-items: end;
          gap: 2px;
          font-style: normal;
          white-space: nowrap;
        }

        .stationTrackPlayCount strong {
          color: #f7cf68;
          font-size: 0.43rem;
          font-weight: 1000;
          letter-spacing: 0.025em;
        }

        .stationTrackPlayCount span {
          color: rgba(255, 255, 255, 0.28);
          font-size: 0.36rem;
          font-weight: 1000;
          letter-spacing: 0.06em;
        }

        .networkPlayCount {
          display: block;
          color: #f7cf68;
          font-size: 0.43rem;
          font-style: normal;
          font-weight: 1000;
          letter-spacing: 0.025em;
          white-space: nowrap;
        }

        .networkTrackDetail {
          display: block;
          margin-top: 2px;
          color: rgba(255, 255, 255, 0.42);
          font-size: 0.39rem;
          font-weight: 900;
          white-space: nowrap;
        }

        .historicalPlayCount {
          color: #ffc85d;
        }

        .networkTrackStation {
          line-height: 1.15;
        }

        .networkTrackListeners {
          color: rgba(92, 240, 168, 0.66);
          font-size: 0.39rem;
          font-weight: 1000;
          letter-spacing: 0.03em;
        }

        .networkTrackStation.live
          .networkTrackListeners {
          color: #71f3b4;
          text-shadow: 0 0 9px rgba(92, 240, 168, 0.16);
        }

        .networkTrackStation::before {
          content: "";
          width: 4px;
          height: 4px;
          display: inline-block;
          margin-right: 4px;
          border-radius: 999px;
          background: var(--track-accent);
          box-shadow: 0 0 7px color-mix(
            in srgb,
            var(--track-accent) 34%,
            transparent
          );
          vertical-align: 1px;
        }

        .chartEmpty {
          min-height: 280px;
          display: grid;
          place-content: center;
          justify-items: center;
          gap: 6px;
          padding: 24px;
          text-align: center;
        }

        .chartEmpty strong {
          color: rgba(255, 255, 255, 0.62);
          font-size: 0.68rem;
        }

        .chartEmpty span {
          color: rgba(255, 255, 255, 0.28);
          font-size: 0.56rem;
        }

        .chartPanelFooter {
          min-height: 46px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.1);
        }

        .chartPanelFooter > span {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.48rem;
          font-weight: 850;
        }

        .chartPanelFooter strong {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: rgba(92, 240, 168, 0.68);
          font-size: 0.44rem;
          font-weight: 1000;
          letter-spacing: 0.08em;
        }

        .networkFooter button {
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 9px;
          border: 1px solid rgba(174, 140, 255, 0.18);
          border-radius: 8px;
          color: #b99bff;
          background: rgba(174, 140, 255, 0.045);
          font: inherit;
          font-size: 0.48rem;
          font-weight: 1000;
          cursor: pointer;
        }

        .networkFooter button:disabled {
          opacity: 0.38;
          cursor: default;
        }

        @media (max-width: 860px) {
          .chartsSection {
            width: min(100% - 22px, 720px);
            padding: 17px;
          }

          .chartsHeading {
            align-items: start;
            flex-direction: column;
            gap: 8px;
          }

          .chartsHeading p {
            max-width: 580px;
            text-align: left;
          }

          .chartsGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .rankingExportBar {
            align-items: flex-start;
            flex-direction: column;
          }

          .rankingExportBar > div {
            width: 100%;
          }

          .rankingExportBar button {
            flex: 1 1 0;
          }

          .rankingDataStamp {
            align-items: flex-start;
            flex-direction: column;
            gap: 4px;
          }

          .stationPeriodTabs {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .stationHistoricalStatus {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationHistoricalStatus > b {
            display: none;
          }

          .historicalLeaderSpotlight {
            grid-template-columns: 52px 52px minmax(0, 1fr);
          }

          .historicalLeaderSpotlight > img {
            width: 52px;
            height: 52px;
          }

          .historicalLeaderMetrics {
            display: none;
          }

          .networkPeriodTabs {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .historicalRankingStatus {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .historicalRankingStatus > b {
            display: none;
          }

          .historicalRankingScale > span {
            grid-template-columns: 27px minmax(40px, 1fr);
          }

          .historicalRankingScale em {
            display: none;
          }
        }

        @media (max-width: 520px) {
          .chartsSection {
            width: calc(100% - 14px);
            margin-top: 22px;
            padding: 10px;
            border-radius: 17px;
          }

          .chartsHeading {
            margin: 5px 3px 13px;
          }

          .chartPanelHeader {
            align-items: start;
            flex-direction: column;
          }

          .chartStationSelector {
            width: 100%;
            justify-items: stretch;
          }

          .chartStationSelector select {
            width: 100%;
            max-width: none;
          }

          .chartStationIdentity {
            grid-template-columns: 32px minmax(0, 1fr) auto;
          }

          .chartStationAudience {
            grid-column: 2 / 4;
            justify-self: stretch;
            grid-template-columns: auto 1fr;
            align-items: center;
            justify-items: start;
            gap: 6px;
            margin-top: -2px;
          }

          .chartStationIdentity > i {
            grid-column: 3;
            grid-row: 1;
          }

          .networkChartBadge {
            align-self: stretch;
            justify-content: center;
          }

          .networkChartSummary {
            align-items: stretch;
            flex-direction: column;
          }

          .networkChartPulseMetrics {
            width: 100%;
            justify-content: stretch;
          }

          .networkChartPulseMetrics > span {
            min-width: 0;
            flex: 1 1 0;
          }

          .stationLeaderSpotlight {
            grid-template-columns:
              auto 38px minmax(0, 1fr);
            gap: 8px;
            margin: 7px 8px;
            padding: 7px 8px;
          }

          .stationLeaderSpotlight > img {
            width: 38px;
            height: 38px;
          }

          .stationLeaderStatus {
            grid-column: 3;
            max-width: 100%;
            justify-items: start;
            margin-top: -5px;
            padding-left: 0;
          }

          .networkLeaderSpotlight {
            grid-template-columns:
              auto 38px minmax(0, 1fr);
            gap: 8px;
            margin: 7px 8px;
            padding: 7px 8px;
          }

          .networkLeaderSpotlight > img {
            width: 38px;
            height: 38px;
          }

          .networkLeaderStation {
            grid-column: 3;
            max-width: 100%;
            justify-items: start;
            margin-top: -5px;
            padding-left: 0;
          }

          .networkLeaderStation a {
            min-height: 19px;
            padding: 0 6px;
            font-size: 0.35rem;
          }

          .chartList li {
            grid-template-columns: 23px 32px minmax(0, 1fr);
            gap: 7px;
            padding: 6px 9px;
          }

          .chartList li > img {
            width: 32px;
            height: 32px;
          }

          .chartList li > em {
            grid-column: 3;
            justify-self: start;
            max-width: 100%;
            margin-top: -5px;
          }

          .networkTrackListeners {
            font-size: 0.37rem;
          }

          .chartPanelFooter {
            align-items: start;
            flex-direction: column;
          }

          .networkFooter button {
            width: 100%;
            justify-content: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .chartList li,
          .stationChart,
          .networkLeaderStation a {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
