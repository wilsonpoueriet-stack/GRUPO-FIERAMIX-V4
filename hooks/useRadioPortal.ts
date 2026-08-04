"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { stationEngine } from "@/core/StationEngine";
import type { Station, StationId } from "@/types/station";
import type {
  HistoryItem,
  NowPlaying,
  NowPlayingResult,
  RecentTrack,
} from "@/types/radio";

const portalStations = [...stationEngine.getStations()];

type RadioBossAllItem = {
  id: string;
  success: boolean;
  title?: string;
  artist?: string;
  artwork?: string;
  listeners?: number | null;
  live?: boolean;
  autodj?: boolean;
  nexttrack?: string;
  nexttrack_artist?: string;
  recent?: RecentTrack[];
  error?: string;
};

export const emptyNowPlaying = (station: Station): NowPlaying => ({
  title: "Programación en vivo",
  artist: station.name,
  artwork: station.logo,
  listeners: null,
  configured: false,
  recent: [],
});

function createInitialMetadata(): Partial<
  Record<StationId, NowPlayingResult>
> {
  return Object.fromEntries(
    portalStations.map((station) => [
      station.id,
      {
        ...emptyNowPlaying(station),
        source: "fallback",
        status: "not-configured",
        recent: [],
      },
    ]),
  ) as Partial<Record<StationId, NowPlayingResult>>;
}

export function useRadioPortal() {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [selectedId, setSelectedId] = useState<StationId>(
    stationEngine.getDefaultStation().id,
  );

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [menuOpen, setMenuOpen] = useState(false);

  const [metadata, setMetadata] = useState<
    Partial<Record<StationId, NowPlayingResult>>
  >(createInitialMetadata);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const selected = useMemo(
    () => stationEngine.getStationOrDefault(selectedId),
    [selectedId],
  );

  const current =
    metadata[selected.id] ?? emptyNowPlaying(selected);

  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    let cancelled = false;

    async function loadAllMetadata() {
      try {
        const response = await fetch("/api/now-playing-all", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`La API respondió ${response.status}`);
        }

        const items = (await response.json()) as RadioBossAllItem[];

        if (cancelled || !Array.isArray(items)) {
          return;
        }

        const nextMetadata = createInitialMetadata();

        for (const item of items) {
          const station = portalStations.find(
            (candidate) => candidate.id === item.id,
          );

          if (!station || item.success === false) {
            continue;
          }

          nextMetadata[station.id] = {
            title: item.title || "Programación en vivo",
            artist: item.artist || station.name,
            artwork: item.artwork || station.logo,
            listeners: item.listeners ?? null,
            configured: true,
            source: "radioboss",
            status: "ok",
            recent: item.recent ?? [],
          };
        }

        setMetadata(nextMetadata);

        const selectedItem = items.find(
          (item) => item.id === selectedId && item.success,
        );

        const selectedStation =
          stationEngine.getStationOrDefault(selectedId);

        const selectedHistory: HistoryItem[] = (
          selectedItem?.recent ?? []
        ).map((track) => ({
          title: track.title,
          artist: track.artist,
          artwork: track.artwork,
          listeners: null,
          configured: true,
          source: "radioboss",
          status: "ok",
          recent: [],
          stationId: selectedId,
          stamp: track.started
            ? new Date(track.started).toLocaleTimeString("es-DO", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        }));

        setHistory(
          selectedHistory.length > 0
            ? selectedHistory
            : [
                {
                  title: "Programación en vivo",
                  artist: selectedStation.name,
                  artwork: selectedStation.logo,
                  listeners: null,
                  configured: false,
                  source: "fallback",
                  status: "not-configured",
                  recent: [],
                  stationId: selectedId,
                  stamp: "",
                },
              ],
        );
      } catch (error) {
        console.error(
          "No se pudieron cargar las emisoras:",
          error,
        );
      }
    }

    void loadAllMetadata();

    const timer = window.setInterval(() => {
      void loadAllMetadata();
    }, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedId]);

  async function playStation(station: Station) {
    setSelectedId(station.id);

    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setLoading(true);

    if (audio.src !== station.streamUrl) {
      audio.src = station.streamUrl;
      audio.load();
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }

  async function togglePlayback() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (!audio.src) {
      await playStation(selected);
      return;
    }

    if (audio.paused) {
      setLoading(true);

      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      } finally {
        setLoading(false);
      }

      return;
    }

    audio.pause();
    setPlaying(false);
  }

  function moveStation(direction: number) {
    const next =
      direction >= 0
        ? stationEngine.getNextStation(selected.id)
        : stationEngine.getPreviousStation(selected.id);

    void playStation(next);
  }

  return {
    stations: portalStations,
    selected,
    current,
    metadata,
    history,
    playing,
    loading,
    volume,
    menuOpen,
    audioRef,
    setMenuOpen,
    setVolume,
    togglePlayback,
    playStation,
    moveStation,
  };
}