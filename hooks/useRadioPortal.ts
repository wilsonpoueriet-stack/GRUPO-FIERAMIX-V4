"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { stationEngine } from "@/core/StationEngine";
import type { Station, StationId } from "@/types/station";
import type {
  HistoryItem,
  NowPlaying,
  NowPlayingResult,
} from "@/types/radio";

const portalStations = [...stationEngine.getStations()];

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

  const [metadata] = useState<
    Partial<Record<StationId, NowPlayingResult>>
  >(createInitialMetadata);

  const [history] = useState<HistoryItem[]>([]);

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