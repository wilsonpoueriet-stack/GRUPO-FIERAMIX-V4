"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Station } from "@/types/station";
import type { NowPlaying } from "@/types/radio";

type FieramixSoundStatus =
  | "idle"
  | "checking"
  | "active"
  | "bypass";

type Props = {
  selected: Station;
  current: NowPlaying;
  playing: boolean;
  loading: boolean;
  fieramixSoundStatus?: FieramixSoundStatus;
  fieramixSoundActive?: boolean;
  onPlaybackToggle: () => void;
  onMoveStation: (direction: number) => void;
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

function getStickySoundLabel(
  status: FieramixSoundStatus | undefined,
  active: boolean | undefined,
) {
  if (status === "checking") {
    return {
      text: "FIERAMIX SOUND · COMPROBANDO",
      color: "#ffe5a3",
      dot: "#f5b942",
      border: "rgba(245, 185, 66, .28)",
      background: "rgba(245, 185, 66, .08)",
    };
  }

  if (status === "bypass") {
    return {
      text: "FIERAMIX SOUND · BYPASS",
      color: "#d1d5db",
      dot: "#9ca3af",
      border: "rgba(156, 163, 175, .24)",
      background: "rgba(156, 163, 175, .07)",
    };
  }

  if (status === "active" && active) {
    return {
      text: "FIERAMIX SOUND · ACTIVO",
      color: "#bdfbdc",
      dot: "#7bf5be",
      border: "rgba(123, 245, 190, .28)",
      background: "rgba(123, 245, 190, .08)",
    };
  }

  return null;
}

export default function StickyPlayer({
  selected,
  current,
  playing,
  loading,
  fieramixSoundStatus,
  fieramixSoundActive,
  onPlaybackToggle,
  onMoveStation,
}: Props) {
  const soundLabel = getStickySoundLabel(
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

  const isFavorite = favoriteStations.includes(String(selected.id));

  const toggleFavorite = () => {
    const stationId = String(selected.id);
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
    <aside
      className="stickyPlayer"
      style={{ "--accent": selected.accent } as CSSProperties}
    >
      <div className="stickyInfo">
        <img src={current.artwork || selected.logo} alt="" />
        <div>
          <small>{selected.name}</small>
          <strong>{current.title}</strong>
          <span>{current.artist}</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <div className="stickyControls">
          <button
            onClick={() => onMoveStation(-1)}
            aria-label="Emisora anterior"
          >
            ⏮
          </button>

          <button
            className="stickyPlay"
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

        <button
          type="button"
          onClick={toggleFavorite}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `Quitar ${selected.name} de favoritas`
              : `Agregar ${selected.name} a favoritas`
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
            width: "32px",
            height: "32px",
            flex: "0 0 auto",
            borderRadius: "999px",
            border: isFavorite
              ? "1px solid rgba(255, 71, 133, .55)"
              : "1px solid rgba(255, 255, 255, .16)",
            background: isFavorite
              ? "rgba(255, 71, 133, .13)"
              : "rgba(255, 255, 255, .04)",
            color: isFavorite ? "#ff86ad" : "#d8deea",
            boxShadow: isFavorite
              ? "0 0 16px rgba(255, 71, 133, .14)"
              : "none",
            fontSize: "1rem",
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {soundLabel ? (
          <span
            title="Procesamiento FIERAMIX SOUND"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 7px",
              borderRadius: "999px",
              border: `1px solid ${soundLabel.border}`,
              background: soundLabel.background,
              color: soundLabel.color,
              fontSize: ".55rem",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: ".05em",
              whiteSpace: "nowrap",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "999px",
                background: soundLabel.dot,
                boxShadow: `0 0 8px ${soundLabel.dot}`,
                flex: "0 0 auto",
              }}
            />
            {soundLabel.text}
          </span>
        ) : null}

        <div className="stickyLive">
          <i /> {playing ? "EN VIVO" : "LISTO"}
        </div>
      </div>
    </aside>
  );
}
