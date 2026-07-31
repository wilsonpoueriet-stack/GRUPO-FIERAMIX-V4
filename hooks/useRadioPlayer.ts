"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { stations } from "@/data/stations";
import type { Station } from "@/types/station";
import type { NowPlaying } from "@/types/player";

const FAVORITES_KEY = "fieramix-favorites";
const VOLUME_KEY = "fieramix-volume";
const LAST_STATION_KEY = "fieramix-last-station";

export function useRadioPlayer() {
  const [current, setCurrent] = useState<Station>(stations[0]);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [volume, setVolume] = useState(0.85);
  const [lastVolume, setLastVolume] = useState(0.85);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [notice, setNotice] = useState("");
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({
    title: "Programación en vivo",
    artist: stations[0].name,
    artwork: stations[0].logo,
    listeners: null,
    configured: false,
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const savedFavorites = window.localStorage.getItem(FAVORITES_KEY);
    const savedVolume = window.localStorage.getItem(VOLUME_KEY);
    const savedStation = window.localStorage.getItem(LAST_STATION_KEY);

    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch {
        window.localStorage.removeItem(FAVORITES_KEY);
      }
    }

    if (savedVolume !== null) {
      const parsed = Number(savedVolume);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        setVolume(parsed);
        if (parsed > 0) setLastVolume(parsed);
      }
    }

    if (savedStation) {
      const station = stations.find((item) => item.id === savedStation);
      if (station) setCurrent(station);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    window.localStorage.setItem(VOLUME_KEY, String(volume));
  }, [volume]);

  useEffect(() => {
    window.localStorage.setItem(LAST_STATION_KEY, current.id);
  }, [current.id]);

  const fetchMetadata = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/now-playing?station=${encodeURIComponent(current.id)}`,
        { cache: "no-store" },
      );
      if (!response.ok) return;
      setNowPlaying((await response.json()) as NowPlaying);
    } catch {
      // La reproducción continúa aunque los metadatos no respondan.
    }
  }, [current.id]);

  useEffect(() => {
    setNowPlaying({
      title: "Programación en vivo",
      artist: current.name,
      artwork: current.logo,
      listeners: null,
      configured: false,
    });

    void fetchMetadata();
    const timer = window.setInterval(() => void fetchMetadata(), 20000);
    return () => window.clearInterval(timer);
  }, [current, fetchMetadata]);

  const startPlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setError("");
    setLoading(true);

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setError("No se pudo iniciar la transmisión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playing) return;
    audio.load();
    void startPlayback();
  }, [current, playing, startPlayback]);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      setLoading(false);
      return;
    }

    await startPlayback();
  }, [playing, startPlayback]);

  const selectStation = useCallback(
    (station: Station) => {
      if (station.id === current.id) {
        void togglePlayback();
        return;
      }

      setCurrent(station);
      setPlaying(true);
      setError("");
    },
    [current.id, togglePlayback],
  );

  const changeStation = useCallback(
    (direction: -1 | 1) => {
      const index = stations.findIndex((station) => station.id === current.id);
      setCurrent(stations[(index + direction + stations.length) % stations.length]);
      setPlaying(true);
      setError("");
    },
    [current.id],
  );

  const toggleMute = useCallback(() => {
    if (volume === 0) {
      setVolume(lastVolume || 0.85);
      return;
    }
    setLastVolume(volume);
    setVolume(0);
  }, [lastVolume, volume]);

  const toggleFavorite = useCallback((stationId: string) => {
    setFavorites((items) => {
      const updated = items.includes(stationId)
        ? items.filter((id) => id !== stationId)
        : [...items, stationId];

      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const shareStation = useCallback(async (station: Station) => {
    const shareData = {
      title: station.name,
      text: `${station.name} — ${station.slogan}`,
      url: `${window.location.origin}/#emisoras`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setNotice("Enlace copiado");
        window.setTimeout(() => setNotice(""), 2200);
      }
    } catch {
      // El usuario canceló compartir.
    }
  }, []);

  const visibleStations = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return stations.filter((station) => {
      const matches =
        !normalized ||
        `${station.name} ${station.slogan} ${station.genre}`
          .toLowerCase()
          .includes(normalized);

      return matches && (!onlyFavorites || favorites.includes(station.id));
    });
  }, [favorites, onlyFavorites, query]);

  return {
    audioRef,
    current,
    playing,
    loading,
    error,
    volume,
    favorites,
    query,
    onlyFavorites,
    notice,
    nowPlaying,
    visibleStations,
    setQuery,
    setOnlyFavorites,
    setVolume,
    setLastVolume,
    setPlaying,
    setLoading,
    setError,
    togglePlayback,
    selectStation,
    changeStation,
    toggleMute,
    toggleFavorite,
    shareStation,
  };
}
