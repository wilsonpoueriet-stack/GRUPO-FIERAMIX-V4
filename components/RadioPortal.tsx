"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { stations } from "@/data/stations";
import { news } from "@/data/news";
import { schedule } from "@/data/schedule";
import type { Station } from "@/types/station";

const FAVORITES_KEY = "fieramix-favorites";
const VOLUME_KEY = "fieramix-volume";
const LAST_STATION_KEY = "fieramix-last-station";

type NowPlaying = { title: string; artist: string; artwork: string; listeners: number | null; configured: boolean };

export default function RadioPortal() {
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
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({ title: "Programación en vivo", artist: stations[0].name, artwork: stations[0].logo, listeners: null, configured: false });
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const savedFavorites = window.localStorage.getItem(FAVORITES_KEY);
    const savedVolume = window.localStorage.getItem(VOLUME_KEY);
    const savedStation = window.localStorage.getItem(LAST_STATION_KEY);
    if (savedFavorites) try { setFavorites(JSON.parse(savedFavorites)); } catch { window.localStorage.removeItem(FAVORITES_KEY); }
    if (savedVolume !== null) {
      const parsed = Number(savedVolume);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1) { setVolume(parsed); if (parsed > 0) setLastVolume(parsed); }
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

  useEffect(() => { window.localStorage.setItem(LAST_STATION_KEY, current.id); }, [current.id]);

  const fetchMetadata = useCallback(async () => {
    try {
      const response = await fetch(`/api/now-playing?station=${encodeURIComponent(current.id)}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as NowPlaying;
      setNowPlaying(data);
    } catch { /* La radio continúa aunque los metadatos no respondan. */ }
  }, [current.id]);

  useEffect(() => {
    setNowPlaying({ title: "Programación en vivo", artist: current.name, artwork: current.logo, listeners: null, configured: false });
    void fetchMetadata();
    const timer = window.setInterval(() => void fetchMetadata(), 20000);
    return () => window.clearInterval(timer);
  }, [current, fetchMetadata]);

  const startPlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(""); setLoading(true);
    try { await audio.play(); setPlaying(true); }
    catch { setPlaying(false); setError("No se pudo iniciar la transmisión. Intenta nuevamente."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playing) return;
    audio.load(); void startPlayback();
  }, [current, playing, startPlayback]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); setLoading(false); return; }
    await startPlayback();
  };

  const selectStation = (station: Station) => {
    if (station.id === current.id) { void togglePlayback(); return; }
    setCurrent(station); setPlaying(true); setError("");
  };

  const changeStation = (direction: -1 | 1) => {
    const index = stations.findIndex((station) => station.id === current.id);
    setCurrent(stations[(index + direction + stations.length) % stations.length]);
    setPlaying(true); setError("");
  };

  const toggleMute = () => {
    if (volume === 0) { setVolume(lastVolume || 0.85); return; }
    setLastVolume(volume); setVolume(0);
  };

  const toggleFavorite = (stationId: string) => {
    setFavorites((items) => {
      const updated = items.includes(stationId) ? items.filter((id) => id !== stationId) : [...items, stationId];
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const shareStation = async (station: Station) => {
    const shareData = { title: station.name, text: `${station.name} — ${station.slogan}`, url: `${window.location.origin}/#emisoras` };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`); setNotice("Enlace copiado"); window.setTimeout(() => setNotice(""), 2200); }
    } catch { /* El usuario canceló compartir. */ }
  };

  const visibleStations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return stations.filter((station) => {
      const matches = !normalized || `${station.name} ${station.slogan} ${station.genre}`.toLowerCase().includes(normalized);
      return matches && (!onlyFavorites || favorites.includes(station.id));
    });
  }, [favorites, onlyFavorites, query]);

  return (
    <main>
      <audio ref={audioRef} src={current.streamUrl} preload="none" onPlaying={() => { setPlaying(true); setLoading(false); setError(""); }} onWaiting={() => setLoading(true)} onCanPlay={() => setLoading(false)} onPause={() => setPlaying(false)} onError={() => { setPlaying(false); setLoading(false); setError("La señal no está disponible en este momento."); }} />

      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Grupo Fieramix, inicio"><Image src="/logos/grupo-fieramix.png" alt="Grupo Fieramix" width={220} height={80} priority /></a>
        <nav aria-label="Navegación principal"><a href="#emisoras">Emisoras</a><a href="#noticias">Noticias</a><a href="#programacion">Programación</a><a href="#contacto">Club de oyentes</a></nav>
        <button className="header-live" onClick={() => void togglePlayback()}><span /> {playing ? "En vivo" : "Escuchar"}</button>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-content">
          <p className="eyebrow"><span /> TRANSMITIENDO PARA EL MUNDO</p>
          <h1>La mejor música latina<br /><strong>de todos los tiempos</strong></h1>
          <p className="hero-copy">Nueve emisoras especializadas, música sin fronteras y una sola pasión: acompañarte cada día.</p>
          <div className="hero-actions"><button onClick={() => void togglePlayback()} className="primary-button">{loading ? "Conectando…" : playing ? "❚❚ Pausar transmisión" : "▶ Escuchar ahora"}</button><a className="secondary-button" href="#emisoras">Ver todas las emisoras</a></div>
          <div className="hero-stats"><div><strong>9</strong><span>Emisoras</span></div><div><strong>24/7</strong><span>En vivo</span></div><div><strong>{nowPlaying.listeners ?? "∞"}</strong><span>{nowPlaying.listeners !== null ? "Oyentes" : "Gran comunidad"}</span></div></div>
        </div>
        <div className="hero-feature" style={{ "--current-accent": current.accent } as React.CSSProperties}>
          <div className="live-pill"><span /> {loading ? "CONECTANDO" : playing ? "TRANSMITIENDO" : "LISTA"}</div>
          <Image src={nowPlaying.artwork || current.logo} alt={current.name} width={340} height={340} priority />
          <small className="now-label">{nowPlaying.artist}</small><h2>{nowPlaying.title}</h2><p>{current.name}<br />{current.slogan}</p>
          <div className="hero-player-controls"><button onClick={() => changeStation(-1)} aria-label="Emisora anterior">‹</button><button className="hero-main-play" onClick={() => void togglePlayback()} aria-label={playing ? "Pausar emisora" : "Reproducir emisora"}>{loading ? "•••" : playing ? "❚❚" : "▶"}</button><button onClick={() => changeStation(1)} aria-label="Emisora siguiente">›</button></div>
        </div>
      </section>

      <section className="section" id="emisoras">
        <div className="section-heading"><div><p className="eyebrow dark">NUESTRA RED</p><h2>Una emisora para cada momento</h2></div><p>Busca tu género favorito, guarda emisoras y comparte la señal con tus amigos.</p></div>
        <div className="station-toolbar">
          <label className="station-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar emisora o género…" aria-label="Buscar emisora" /></label>
          <button className={onlyFavorites ? "filter-active" : ""} onClick={() => setOnlyFavorites((value) => !value)}>♥ Favoritas {favorites.length > 0 && `(${favorites.length})`}</button>
        </div>
        {visibleStations.length === 0 ? <div className="empty-state"><strong>No encontramos emisoras</strong><p>Prueba otro término o desactiva el filtro de favoritas.</p></div> : <div className="station-grid">
          {visibleStations.map((station) => {
            const isCurrent = current.id === station.id; const isFavorite = favorites.includes(station.id);
            return <article className={`station-card ${isCurrent ? "active" : ""}`} key={station.id} style={{ "--accent": station.accent } as React.CSSProperties}>
              <button className={`favorite-button ${isFavorite ? "selected" : ""}`} onClick={() => toggleFavorite(station.id)} aria-label={isFavorite ? `Quitar ${station.name} de favoritos` : `Agregar ${station.name} a favoritos`}>{isFavorite ? "♥" : "♡"}</button>
              <button className="share-button" onClick={() => void shareStation(station)} aria-label={`Compartir ${station.name}`}>↗</button>
              <div className="station-logo-wrap"><Image src={station.logo} alt={station.name} width={180} height={180} /></div><span className="genre">{station.genre}</span><h3>{station.name}</h3><p>{station.slogan}</p><button className="station-play-button" onClick={() => selectStation(station)}>{isCurrent && loading ? "Conectando…" : isCurrent && playing ? "❚❚ Pausar" : "▶ Escuchar"}</button>
            </article>;
          })}
        </div>}
      </section>

      <section className="dark-section" id="noticias"><div className="section-heading light"><div><p className="eyebrow">FIERAMIX NOTICIAS</p><h2>Lo que está pasando</h2></div><p>Noticias, música, cultura y comunidad desde una perspectiva cercana.</p></div><div className="news-grid">{news.map((item, index) => <article key={item.title}><span>0{index + 1}</span><small>{item.category}</small><h3>{item.title}</h3><p>{item.excerpt}</p></article>)}</div></section>
      <section className="section schedule-section" id="programacion"><div className="section-heading"><div><p className="eyebrow dark">PROGRAMACIÓN</p><h2>Siempre hay algo para ti</h2></div><p>Espacios para informar, entretener, inspirar y conectar con nuestra audiencia.</p></div><div className="schedule-list">{schedule.map((item) => <article key={`${item.time}-${item.show}`}><time>{item.time}</time><div><h3>{item.show}</h3><p>{item.station}</p></div><span>EN VIVO</span></article>)}</div></section>
      <section className="community" id="contacto"><div><p className="eyebrow">COMUNIDAD FIERAMIX</p><h2>La radio también se vive contigo</h2><p>Únete, envía tus saludos y mantente conectado con toda la programación.</p></div><div className="community-actions"><a href="https://wa.me/18098419586" target="_blank" rel="noreferrer">WhatsApp</a><a href="https://chat.whatsapp.com/JJfXFBwAG3O8DIKs9ufvJt" target="_blank" rel="noreferrer">Unirme a la comunidad</a></div></section>
      <footer><Image src="/logos/grupo-fieramix.png" alt="Grupo Fieramix" width={200} height={75} /><p>© 2026 GRUPO FIERAMIX.COM — La red latina que mueve el mundo.</p><div><a href="https://www.facebook.com/FieraMIXRD" target="_blank" rel="noreferrer">Facebook</a><a href="https://www.instagram.com/fieramix" target="_blank" rel="noreferrer">Instagram</a><a href="https://www.youtube.com/@fieramixtv5937" target="_blank" rel="noreferrer">YouTube</a></div></footer>

      <aside className="sticky-player" style={{ "--current-accent": current.accent } as React.CSSProperties}>
        <div className="sticky-station"><Image src={nowPlaying.artwork || current.logo} alt={current.name} width={58} height={58} /><div><small>{loading ? "CONECTANDO" : playing ? "AHORA SUENA" : "SELECCIONADA"}</small><strong>{nowPlaying.title}</strong><span>{nowPlaying.artist} · {current.name}</span></div></div>
        <div className="player-controls"><button onClick={() => changeStation(-1)} aria-label="Emisora anterior">‹</button><button onClick={() => void togglePlayback()} className="player-toggle" aria-label={playing ? "Pausar" : "Reproducir"}>{loading ? "•••" : playing ? "❚❚" : "▶"}</button><button onClick={() => changeStation(1)} aria-label="Emisora siguiente">›</button></div>
        <div className="player-actions"><button className={`mini-favorite ${favorites.includes(current.id) ? "selected" : ""}`} onClick={() => toggleFavorite(current.id)} aria-label="Favorito">{favorites.includes(current.id) ? "♥" : "♡"}</button><button className="mini-share" onClick={() => void shareStation(current)} aria-label="Compartir">↗</button><label className="volume"><button type="button" onClick={toggleMute} aria-label={volume === 0 ? "Activar sonido" : "Silenciar"}>{volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}</button><input aria-label="Volumen" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => { const value = Number(event.target.value); setVolume(value); if (value > 0) setLastVolume(value); }} /></label></div>
        {error && <div className="player-error" role="status">{error}</div>}
      </aside>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}
