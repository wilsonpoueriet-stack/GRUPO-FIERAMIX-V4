import type { StationId } from "@/types/station";

export type RecentTrack = {
  title: string;
  artist: string;
  artwork: string;
  started: string;
};

export type NowPlaying = {
  title: string;
  artist: string;
  artwork: string;
  listeners: number | null;
  configured: boolean;
  source?: "radioboss" | "fallback";
  status?: "ok" | "not-configured" | "upstream-error";
  recent?: RecentTrack[];
};

export type HistoryItem = NowPlaying & {
  stationId: StationId;
  stamp: string;
};

export type NowPlayingResult = NowPlaying & {
  source: "radioboss" | "fallback";
  status: "ok" | "not-configured" | "upstream-error";
  recent: RecentTrack[];
};

export type AllNowPlayingResult = Record<StationId, NowPlayingResult>;

export type RadioPortalController = {
  stations: import("@/types/station").Station[];
  selected: import("@/types/station").Station;
  current: NowPlaying;
  metadata: Partial<Record<StationId, NowPlayingResult>>;
  history: HistoryItem[];
  playing: boolean;
  loading: boolean;
  volume: number;
  menuOpen: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  togglePlayback: () => Promise<void>;
  playStation: (station: import("@/types/station").Station) => Promise<void>;
  moveStation: (direction: number) => void;
};
