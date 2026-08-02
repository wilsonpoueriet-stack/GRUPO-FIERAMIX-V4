"use client";

import type { NowPlaying } from "@/types/radio";

type HeroProps = {
  current: NowPlaying;
  playing: boolean;
  onPlaybackToggle: () => void;
};

export default function Hero({
  current,
  playing,
  onPlaybackToggle,
}: HeroProps) {
  return (
    <div className="heroCopy">
      <span className="heroKicker">GRUPO FIERAMIX.COM</span>

      <h1>
        La mejor música latina
        <br />
        <em>de todos los tiempos</em>
      </h1>

      <p>
        Nueve emisoras especializadas transmitiendo en vivo las 24 horas,
        con la música, la información y la energía que mueve al mundo latino.
      </p>

      <div className="heroActions">
        <button onClick={onPlaybackToggle}>
          {playing ? "PAUSAR" : "▶ ESCUCHAR AHORA"}
        </button>
        <a href="#emisoras">EXPLORAR EMISORAS</a>
      </div>

      <div className="heroMetrics">
        <div>
          <strong>9</strong>
          <span>Emisoras</span>
        </div>
        <div>
          <strong>24/7</strong>
          <span>En vivo</span>
        </div>
        <div>
          <strong>{current.listeners ?? "—"}</strong>
          <span>Oyentes ahora</span>
        </div>
      </div>
    </div>
  );
}
