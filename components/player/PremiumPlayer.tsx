"use client";

import type { CSSProperties } from "react";
import type { Station } from "@/types/station";
import type { NowPlaying } from "@/types/radio";

type PremiumPlayerProps = {
  station: Station;
  current: NowPlaying;
  playing: boolean;
  loading: boolean;
  volume: number;
  onPlaybackToggle: () => void;
  onMoveStation: (direction: number) => void;
  onVolumeChange: (value: number) => void;
};

export default function PremiumPlayer({
  station,
  current,
  playing,
  loading,
  volume,
  onPlaybackToggle,
  onMoveStation,
  onVolumeChange,
}: PremiumPlayerProps) {
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
        <b>{station.genre}</b>
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
        <button onClick={() => onMoveStation(-1)} aria-label="Emisora anterior">
          ⏮
        </button>

        <button
          className="mainPlay"
          onClick={onPlaybackToggle}
          aria-label={playing ? "Pausar" : "Reproducir"}
        >
          {loading ? "•••" : playing ? "❚❚" : "▶"}
        </button>

        <button onClick={() => onMoveStation(1)} aria-label="Emisora siguiente">
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
          onChange={(event) => onVolumeChange(Number(event.target.value))}
        />
        <span>{current.listeners ?? 0} oyentes</span>
      </div>
    </article>
  );
}
