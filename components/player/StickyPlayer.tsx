"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { Station } from "@/types/station";
import type { NowPlaying } from "@/types/player";

type Props = {
  current: Station;
  nowPlaying: NowPlaying;
  playing: boolean;
  loading: boolean;
  error: string;
  volume: number;
  favorite: boolean;
  onTogglePlayback: () => void;
  onChangeStation: (direction: -1 | 1) => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
};

export default function StickyPlayer({
  current,
  nowPlaying,
  playing,
  loading,
  error,
  volume,
  favorite,
  onTogglePlayback,
  onChangeStation,
  onToggleFavorite,
  onShare,
  onToggleMute,
  onVolumeChange,
}: Props) {
  return (
    <aside
      className="sticky-player"
      style={{ "--current-accent": current.accent } as CSSProperties}
    >
      <div className="sticky-station">
        <Image
          src={nowPlaying.artwork || current.logo}
          alt={current.name}
          width={58}
          height={58}
        />
        <div>
          <small>{loading ? "CONECTANDO" : playing ? "AHORA SUENA" : "SELECCIONADA"}</small>
          <strong>{nowPlaying.title}</strong>
          <span>{nowPlaying.artist} · {current.name}</span>
        </div>
      </div>

      <div className="player-controls">
        <button onClick={() => onChangeStation(-1)} aria-label="Emisora anterior">‹</button>
        <button
          onClick={onTogglePlayback}
          className="player-toggle"
          aria-label={playing ? "Pausar" : "Reproducir"}
        >
          {loading ? "•••" : playing ? "❚❚" : "▶"}
        </button>
        <button onClick={() => onChangeStation(1)} aria-label="Emisora siguiente">›</button>
      </div>

      <div className="player-actions">
        <button
          className={`mini-favorite ${favorite ? "selected" : ""}`}
          onClick={onToggleFavorite}
          aria-label="Favorito"
        >
          {favorite ? "♥" : "♡"}
        </button>
        <button className="mini-share" onClick={onShare} aria-label="Compartir">↗</button>
        <label className="volume">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={volume === 0 ? "Activar sonido" : "Silenciar"}
          >
            {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
          </button>
          <input
            aria-label="Volumen"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
          />
        </label>
      </div>

      {error && <div className="player-error" role="status">{error}</div>}
    </aside>
  );
}
