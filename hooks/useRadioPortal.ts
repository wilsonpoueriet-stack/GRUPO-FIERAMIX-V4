"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { stationEngine } from "@/core/StationEngine";
import type { Station } from "@/types/station";
import type { HistoryItem, NowPlaying } from "@/types/radio";

const portalStations = [...stationEngine.getStations()];

export const emptyNowPlaying = (station: Station): NowPlaying => ({
  title: "Programación en vivo",
  artist: station.name,
  artwork: station.logo,
  listeners: null,
  configured: false,
});

export function useRadioPortal() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedId, setSelectedId] = useState(
    stationEngine.getDefaultStation().id,
  );
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [menuOpen, setMenuOpen] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, NowPlaying>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const selected = useMemo(
    () => stationEngine.getStationOrDefault(selectedId),
    [selectedId],
  );

  const current = metadata[selected.id] ?? emptyNowPlaying(selected);

  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    let cancelled = false;

    async function loadAllMetadata() {
      const entries = await Promise.all(
        portalStations.map(async (station) => {
          try {
            const response = await fetch(
              `/api/now-playing?station=${station.id}`,
              { cache: "no-store" },
            );

            if (!response.ok) {
              throw new Error("No se pudieron cargar los metadatos.");
            }

            const data = (await response.json()) as NowPlaying;
            return [station.id, data] as const;
          } catch {
            return [station.id, emptyNowPlaying(station)] as const;
          }
        }),
      );

      if (cancelled) {
        return;
      }

      setMetadata((previous) => {
        const next = Object.fromEntries(entries) as Record<string, NowPlaying>;
        const selectedTrack = next[selectedId];
        const previousTrack = previous[selectedId];

        if (
          selectedTrack &&
          previousTrack &&
          selectedTrack.title !== previousTrack.title &&
          previousTrack.title !== "Programación en vivo"
        ) {
          setHistory((items) =>
            [
              {
                ...previousTrack,
                stationId: selectedId,
                stamp: new Date().toLocaleTimeString("es-DO", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
              ...items,
            ].slice(0, 6),
          );
        }

        return next;
      });
    }

    void loadAllMetadata();

    const timer = window.setInterval(() => {
      void loadAllMetadata();
    }, 20_000);

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
