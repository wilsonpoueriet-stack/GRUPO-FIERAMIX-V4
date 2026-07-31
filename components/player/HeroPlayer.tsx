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
  onTogglePlayback: () => void;
  onChangeStation: (direction: -1 | 1) => void;
};

export default function HeroPlayer({
  current,
  nowPlaying,
  playing,
  loading,
  onTogglePlayback,
  onChangeStation,
}: Props) {
  return (
    <section className="hero" id="inicio">
      <div className="hero-content">
        <p className="eyebrow"><span /> TRANSMITIENDO PARA EL MUNDO</p>
        <h1>La mejor música latina<br /><strong>de todos los tiempos</strong></h1>
        <p className="hero-copy">
          Nueve emisoras especializadas, música sin fronteras y una sola pasión:
          acompañarte cada día.
        </p>
        <div className="hero-actions">
          <button onClick={onTogglePlayback} className="primary-button">
            {loading ? "Conectando…" : playing ? "❚❚ Pausar transmisión" : "▶ Escuchar ahora"}
          </button>
          <a className="secondary-button" href="#emisoras">Ver todas las emisoras</a>
        </div>
        <div className="hero-stats">
          <div><strong>9</strong><span>Emisoras</span></div>
          <div><strong>24/7</strong><span>En vivo</span></div>
          <div>
            <strong>{nowPlaying.listeners ?? "∞"}</strong>
            <span>{nowPlaying.listeners !== null ? "Oyentes" : "Gran comunidad"}</span>
          </div>
        </div>
      </div>

      <div
        className="hero-feature"
        style={{ "--current-accent": current.accent } as CSSProperties}
      >
        <div className="live-pill">
          <span /> {loading ? "CONECTANDO" : playing ? "TRANSMITIENDO" : "LISTA"}
        </div>
        <Image
          src={nowPlaying.artwork || current.logo}
          alt={current.name}
          width={340}
          height={340}
          priority
        />
        <small className="now-label">{nowPlaying.artist}</small>
        <h2>{nowPlaying.title}</h2>
        <p>{current.name}<br />{current.slogan}</p>
        <div className="hero-player-controls">
          <button onClick={() => onChangeStation(-1)} aria-label="Emisora anterior">‹</button>
          <button
            className="hero-main-play"
            onClick={onTogglePlayback}
            aria-label={playing ? "Pausar emisora" : "Reproducir emisora"}
          >
            {loading ? "•••" : playing ? "❚❚" : "▶"}
          </button>
          <button onClick={() => onChangeStation(1)} aria-label="Emisora siguiente">›</button>
        </div>
      </div>
    </section>
  );
}
