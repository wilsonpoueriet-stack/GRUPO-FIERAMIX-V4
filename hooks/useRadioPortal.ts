"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { stations } from "@/data/stations";
import type { Station } from "@/types/station";
import type { HistoryItem, NowPlaying } from "@/types/radio";

export const emptyNowPlaying = (station: Station): NowPlaying => ({
  title: "Programación en vivo",
  artist: station.name,
  artwork: station.logo,
  listeners: null,
  configured: false,
});

export function useRadioPortal() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedId, setSelectedId] = useState(stations[0].id);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [menuOpen, setMenuOpen] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, NowPlaying>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const selected = useMemo(
    () => stations.find((station) => station.id === selectedId) ?? stations[0],
    [selectedId],
  );

  const current = metadata[selected.id] ?? emptyNowPlaying(selected);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    let cancelled = false;

    async function loadAllMetadata() {
      const entries = await Promise.all(
        stations.map(async (station) => {
          try {
            const response = await fetch(
              `/api/now-playing?station=${station.id}`,
              { cache: "no-store" },
            );

            if (!response.ok) throw new Error("No se pudieron cargar los metadatos.");

            const data = (await response.json()) as NowPlaying;
            return [station.id, data] as const;
          } catch {
            return [station.id, emptyNowPlaying(station)] as const;
          }
        }),
      );

      if (cancelled) return;

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
    const timer = window.setInterval(loadAllMetadata, 20_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedId]);

  async function playStation(station: Station) {
    setSelectedId(station.id);

    const audio = audioRef.current;
    if (!audio) return;

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
    if (!audio) return;

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
    const currentIndex = stations.findIndex(
      (station) => station.id === selected.id,
    );
    const next =
      stations[(currentIndex + direction + stations.length) % stations.length];

    void playStation(next);
  }

  return {
    stations,
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
