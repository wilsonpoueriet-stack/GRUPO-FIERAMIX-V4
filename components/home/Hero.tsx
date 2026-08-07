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
  const listenerCount =
    current.listeners !== null && current.listeners !== undefined
      ? current.listeners.toLocaleString("es-DO")
      : "EN VIVO";

  return (
    <div className="heroCopy">
      <span className="heroKicker">
        LA RED LATINA QUE MUEVE AL MUNDO
      </span>

      <h1>
        EL GRUPO
        <br />
        <em>FIERAMIX.COM</em>
      </h1>

      <p>
        Una plataforma digital creada para conectar radio, música,
        información, entretenimiento y comunidad latina en un solo lugar.
      </p>

      <div className="heroContentTags">
        <span>RADIO EN VIVO</span>
        <i>•</i>
        <span>MÚSICA</span>
        <i>•</i>
        <span>NOTICIAS</span>
        <i>•</i>
        <span>ENTRETENIMIENTO</span>
      </div>

      <div className="heroActions">
        <button
          type="button"
          onClick={onPlaybackToggle}
          aria-pressed={playing}
          aria-label={playing ? "Pausar transmisión" : "Escuchar en vivo"}
        >
          <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
          <span>{playing ? "PAUSAR EN VIVO" : "ESCUCHAR EN VIVO"}</span>
        </button>

        <a href="#emisoras">
          <span>EXPLORAR EMISORAS</span>
        </a>
      </div>

      <div className="heroMetrics">
        <div>
          <strong>24/7</strong>
          <span>TRANSMISIÓN EN VIVO</span>
        </div>

        <div>
          <strong>HD</strong>
          <span>AUDIO DIGITAL</span>
        </div>

        <div>
          <strong>{listenerCount}</strong>
          <span>OYENTES EN VIVO</span>
        </div>
      </div>
    </div>
  );
}
