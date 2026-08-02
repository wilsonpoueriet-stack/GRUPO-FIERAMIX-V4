import type { Station } from "@/types/station";

export type NowPlaying = {
  title: string;
  artist: string;
  artwork: string;
  listeners: number | null;
  configured: boolean;
};

export type HistoryItem = NowPlaying & {
  stationId: string;
  stamp: string;
};

export type RadioPortalController = {
  stations: Station[];
  selected: Station;
  current: NowPlaying;
  metadata: Record<string, NowPlaying>;
  history: HistoryItem[];
  playing: boolean;
  loading: boolean;
  volume: number;
  menuOpen: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  togglePlayback: () => Promise<void>;
  playStation: (station: Station) => Promise<void>;
  moveStation: (direction: number) => void;
};
