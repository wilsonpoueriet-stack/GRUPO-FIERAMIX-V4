"use client";

import type { CSSProperties } from "react";
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
