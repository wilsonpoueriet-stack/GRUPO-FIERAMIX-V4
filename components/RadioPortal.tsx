"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { stations } from "@/data/stations";
import { news } from "@/data/news";
import { schedule } from "@/data/schedule";
import type { Station } from "@/types/station";

export default function RadioPortal() {
  const [current, setCurrent] = useState<Station>(stations[0]);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current || !playing) return;
    audioRef.current.load();
    audioRef.current.play().catch(() => setPlaying(false));
  }, [current, playing]);

  const selectStation = (station: Station) => {
    if (station.id === current.id) {
      setPlaying((value) => !value);
      return;
    }
    setCurrent(station);
    setPlaying(true);
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  return (
    <main>
      <audio ref={audioRef} src={current.streamUrl} preload="none" />
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Grupo Fieramix, inicio">
          <Image src="/logos/grupo-fieramix.png" alt="Grupo Fieramix" width={220} height={80} priority />
        </a>
        <nav aria-label="Navegación principal">
          <a href="#emisoras">Emisoras</a>
          <a href="#noticias">Noticias</a>
          <a href="#programacion">Programación</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <a className="header-live" href="#emisoras"><span /> En vivo</a>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="hero-content">
          <p className="eyebrow"><span /> TRANSMITIENDO PARA EL MUNDO</p>
          <h1>La red latina que<br /><strong>mueve el mundo</strong></h1>
          <p className="hero-copy">Nueve emisoras especializadas, música sin fronteras y una sola pasión: acompañarte cada día.</p>
          <div className="hero-actions">
            <button onClick={togglePlayback} className="primary-button">{playing ? "❚❚ Pausar" : "▶ Escuchar ahora"}</button>
            <a className="secondary-button" href="#emisoras">Ver emisoras</a>
          </div>
          <div className="hero-stats">
            <div><strong>9</strong><span>Emisoras</span></div>
            <div><strong>24/7</strong><span>En vivo</span></div>
            <div><strong>∞</strong><span>Pasión latina</span></div>
          </div>
        </div>
        <div className="hero-feature">
          <div className="live-pill"><span /> EN VIVO</div>
          <Image src={current.logo} alt={current.name} width={340} height={340} priority />
          <h2>{current.name}</h2>
          <p>{current.slogan}</p>
          <button onClick={togglePlayback} aria-label={playing ? "Pausar emisora" : "Reproducir emisora"}>{playing ? "❚❚" : "▶"}</button>
        </div>
      </section>

      <section className="section" id="emisoras">
        <div className="section-heading">
          <div><p className="eyebrow dark">NUESTRA RED</p><h2>Una emisora para cada momento</h2></div>
          <p>Elige tu ritmo y disfruta transmisión continua desde República Dominicana para el mundo.</p>
        </div>
        <div className="station-grid">
          {stations.map((station) => (
            <article className={`station-card ${current.id === station.id ? "active" : ""}`} key={station.id} style={{ "--accent": station.accent } as React.CSSProperties}>
              <div className="station-logo-wrap"><Image src={station.logo} alt={station.name} width={180} height={180} /></div>
              <span className="genre">{station.genre}</span>
              <h3>{station.name}</h3>
              <p>{station.slogan}</p>
              <button onClick={() => selectStation(station)}>{current.id === station.id && playing ? "❚❚ Pausar" : "▶ Escuchar"}</button>
            </article>
          ))}
        </div>
      </section>

      <section className="dark-section" id="noticias">
        <div className="section-heading light">
          <div><p className="eyebrow">FIERAMIX NOTICIAS</p><h2>Lo que está pasando</h2></div>
          <p>Noticias, música, cultura y comunidad desde una perspectiva cercana.</p>
        </div>
        <div className="news-grid">
          {news.map((item, index) => <article key={item.title}><span>0{index + 1}</span><small>{item.category}</small><h3>{item.title}</h3><p>{item.excerpt}</p></article>)}
        </div>
      </section>

      <section className="section schedule-section" id="programacion">
        <div className="section-heading">
          <div><p className="eyebrow dark">PROGRAMACIÓN</p><h2>Siempre hay algo para ti</h2></div>
          <p>Una selección inicial de nuestros espacios. La programación completa se incorporará en la siguiente fase.</p>
        </div>
        <div className="schedule-list">
          {schedule.map((item) => <article key={`${item.time}-${item.show}`}><time>{item.time}</time><div><h3>{item.show}</h3><p>{item.station}</p></div><span>EN VIVO</span></article>)}
        </div>
      </section>

      <section className="community" id="contacto">
        <div><p className="eyebrow">COMUNIDAD FIERAMIX</p><h2>La radio también se vive contigo</h2><p>Únete a nuestra comunidad, envía tus saludos y mantente conectado con toda la programación.</p></div>
        <div className="community-actions"><a href="https://wa.me/18098419586" target="_blank" rel="noreferrer">WhatsApp</a><a href="https://chat.whatsapp.com/JJfXFBwAG3O8DIKs9ufvJt" target="_blank" rel="noreferrer">Unirme a la comunidad</a></div>
      </section>

      <footer>
        <Image src="/logos/grupo-fieramix.png" alt="Grupo Fieramix" width={200} height={75} />
        <p>© 2026 GRUPO FIERAMIX.COM — La red latina que mueve el mundo.</p>
        <div><a href="https://www.facebook.com/FieraMIXRD" target="_blank" rel="noreferrer">Facebook</a><a href="https://www.instagram.com/fieramix" target="_blank" rel="noreferrer">Instagram</a><a href="https://www.youtube.com/@fieramixtv5937" target="_blank" rel="noreferrer">YouTube</a></div>
      </footer>

      <aside className="sticky-player">
        <div className="sticky-station"><Image src={current.logo} alt="" width={58} height={58} /><div><small>AHORA SUENA</small><strong>{current.name}</strong><span>{current.slogan}</span></div></div>
        <button onClick={togglePlayback} className="player-toggle" aria-label={playing ? "Pausar" : "Reproducir"}>{playing ? "❚❚" : "▶"}</button>
        <label className="volume">🔊<input aria-label="Volumen" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /></label>
      </aside>
    </main>
  );
}
