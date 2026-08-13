"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Station } from "@/types/station";
import type { NowPlaying } from "@/types/radio";

type FieramixSoundStatus =
  | "idle"
  | "checking"
  | "active"
  | "bypass";

type PremiumPlayerProps = {
  station: Station;
  current: NowPlaying;
  playing: boolean;
  loading: boolean;
  volume: number;
  fieramixSoundStatus?: FieramixSoundStatus;
  fieramixSoundActive?: boolean;
  onPlaybackToggle: () => void;
  onMoveStation: (direction: number) => void;
  onVolumeChange: (value: number) => void;
};

const FAVORITE_STATIONS_STORAGE_KEY = "fieramix-favorite-stations";
const FAVORITES_UPDATED_EVENT = "fieramix-favorites-updated";

function readFavoriteStations(): string[] {
  try {
    const saved = window.localStorage.getItem(FAVORITE_STATIONS_STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function getSoundBadge(
  status: FieramixSoundStatus | undefined,
  active: boolean | undefined,
) {
  if (status === "checking") {
    return {
      label: "FIERAMIX SOUND · COMPROBANDO",
      dot: "#f5b942",
      text: "#ffe5a3",
      border: "rgba(245, 185, 66, .32)",
      background: "rgba(245, 185, 66, .09)",
      glow: "rgba(245, 185, 66, .16)",
    };
  }

  if (status === "bypass") {
    return {
      label: "FIERAMIX SOUND · BYPASS",
      dot: "#9ca3af",
      text: "#d1d5db",
      border: "rgba(156, 163, 175, .25)",
      background: "rgba(156, 163, 175, .07)",
      glow: "rgba(156, 163, 175, .10)",
    };
  }

  if (status === "active" && active) {
    return {
      label: "FIERAMIX SOUND · ACTIVO",
      dot: "#7bf5be",
      text: "#bdfbdc",
      border: "rgba(123, 245, 190, .32)",
      background: "rgba(123, 245, 190, .08)",
      glow: "rgba(123, 245, 190, .18)",
    };
  }

  return null;
}

export default function PremiumPlayer({
  station,
  current,
  playing,
  loading,
  volume,
  fieramixSoundStatus,
  fieramixSoundActive,
  onPlaybackToggle,
  onMoveStation,
  onVolumeChange,
}: PremiumPlayerProps) {
  const soundBadge = getSoundBadge(
    fieramixSoundStatus,
    fieramixSoundActive,
  );

  const [favoriteStations, setFavoriteStations] = useState<string[]>([]);

  useEffect(() => {
    const syncFavorites = () => {
      setFavoriteStations(readFavoriteStations());
    };

    syncFavorites();

    window.addEventListener("storage", syncFavorites);
    window.addEventListener(FAVORITES_UPDATED_EVENT, syncFavorites);

    return () => {
      window.removeEventListener("storage", syncFavorites);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, syncFavorites);
    };
  }, []);

  const isFavorite = favoriteStations.includes(String(station.id));

  const toggleFavorite = () => {
    const stationId = String(station.id);
    const current = readFavoriteStations();
    const next = current.includes(stationId)
      ? current.filter((id) => id !== stationId)
      : [...current, stationId];

    setFavoriteStations(next);

    try {
      window.localStorage.setItem(
        FAVORITE_STATIONS_STORAGE_KEY,
        JSON.stringify(next),
      );

      window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
    } catch {
      // La interfaz conserva el cambio en esta sesión aunque
      // el navegador no permita guardar la preferencia.
    }
  };

  return (
    <article
      className="premiumPlayer"
      style={{ "--accent": station.accent } as CSSProperties}
    >
      <div className="playerGlow" />

      <div className="playerTopline">
        <span>
          <i /> TRANSMITIENDO
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {soundBadge ? (
            <span
              title="Procesamiento FIERAMIX SOUND en el reproductor web"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "5px 9px",
                borderRadius: "999px",
                border: `1px solid ${soundBadge.border}`,
                background: soundBadge.background,
                color: soundBadge.text,
                boxShadow: `0 0 18px ${soundBadge.glow}`,
                fontSize: ".62rem",
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: ".07em",
                whiteSpace: "nowrap",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "999px",
                  background: soundBadge.dot,
                  boxShadow: `0 0 10px ${soundBadge.dot}`,
                  flex: "0 0 auto",
                }}
              />
              {soundBadge.label}
            </span>
          ) : null}

          <b>{station.genre}</b>
        </div>
      </div>

      <div className="artworkFrame">
        <img
          src={current.artwork || station.logo}
          alt={`${current.title} — ${current.artist}`}
        />

        <div className={playing ? "equalizer active" : "equalizer"}>
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>

      <div className="nowLabel">SONANDO AHORA</div>
      <h2>{current.title}</h2>
      <h3>{current.artist}</h3>
      <p>
        {station.name} · {station.slogan}
      </p>

      <button
        type="button"
        onClick={toggleFavorite}
        aria-pressed={isFavorite}
        aria-label={
          isFavorite
            ? `Quitar ${station.name} de favoritas`
            : `Agregar ${station.name} a favoritas`
        }
        title={
          isFavorite
            ? "Quitar emisora de favoritas"
            : "Agregar emisora a favoritas"
        }
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          minHeight: "32px",
          margin: "2px auto 12px",
          padding: "6px 11px",
          borderRadius: "999px",
          border: isFavorite
            ? "1px solid rgba(255, 71, 133, .55)"
            : "1px solid rgba(255, 255, 255, .16)",
          background: isFavorite
            ? "rgba(255, 71, 133, .12)"
            : "rgba(255, 255, 255, .04)",
          color: isFavorite ? "#ff86ad" : "#d8deea",
          boxShadow: isFavorite
            ? "0 0 18px rgba(255, 71, 133, .12)"
            : "none",
          fontSize: ".62rem",
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: ".055em",
          cursor: "pointer",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: ".92rem",
            lineHeight: 1,
          }}
        >
          {isFavorite ? "♥" : "♡"}
        </span>
        {isFavorite ? "EN FAVORITAS" : "FAVORITA"}
      </button>

      <div className="mainControls">
        <button
          onClick={() => onMoveStation(-1)}
          aria-label="Emisora anterior"
        >
          ⏮
        </button>

        <button
          className="mainPlay"
          onClick={onPlaybackToggle}
          aria-label={playing ? "Pausar" : "Reproducir"}
        >
          {loading ? "•••" : playing ? "❚❚" : "▶"}
        </button>

        <button
          onClick={() => onMoveStation(1)}
          aria-label="Emisora siguiente"
        >
          ⏭
        </button>
      </div>

      <div className="volumeRow">
        <span>🔊</span>
        <input
          aria-label="Volumen"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) =>
            onVolumeChange(Number(event.target.value))
          }
        />
        <span>{current.listeners ?? 0} oyentes</span>
      </div>
    </article>
  );
}
