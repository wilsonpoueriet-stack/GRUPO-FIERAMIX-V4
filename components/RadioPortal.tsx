"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { stations } from "@/data/stations";
import type { Station } from "@/types/station";

type NowPlaying = {
  title: string;
  artist: string;
  artwork: string;
  listeners: number | null;
  configured: boolean;
};

type HistoryItem = NowPlaying & { stationId: string; stamp: string };

const emptyNowPlaying = (station: Station): NowPlaying => ({
  title: "Programación en vivo",
  artist: station.name,
  artwork: station.logo,
  listeners: null,
  configured: false,
});

const topSongs = [
  "Aún Me Deseas",
  "La Bachata",
  "Propuesta Indecente",
  "Frío Frío",
  "Tu Amor Me Hace Bien",
  "Obsesión",
  "Vivir Mi Vida",
  "Burbujas de Amor",
  "Eres Mía",
  "Que Vuelva",
];

export default function RadioPortal() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedId, setSelectedId] = useState(stations[0].id);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [menuOpen, setMenuOpen] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, NowPlaying>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const selected = useMemo(
    () => stations.find((station) => station.id === selectedId) ?? stations[0],
    [selectedId],
  );

  const current = metadata[selected.id] ?? emptyNowPlaying(selected);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      const entries = await Promise.all(
        stations.map(async (station) => {
          try {
            const response = await fetch(`/api/now-playing?station=${station.id}`, {
              cache: "no-store",
            });
            if (!response.ok) throw new Error("metadata");
            const data = (await response.json()) as NowPlaying;
            return [station.id, data] as const;
          } catch {
            return [station.id, emptyNowPlaying(station)] as const;
          }
        }),
      );

      if (cancelled) return;
      setMetadata((previous) => {
        const next = Object.fromEntries(entries) as Record<string, NowPlaying>;
        const selectedTrack = next[selectedId];
        const oldTrack = previous[selectedId];
        if (
          selectedTrack &&
          oldTrack &&
          selectedTrack.title !== oldTrack.title &&
          oldTrack.title !== "Programación en vivo"
        ) {
          setHistory((items) => [
            {
              ...oldTrack,
              stationId: selectedId,
              stamp: new Date().toLocaleTimeString("es-DO", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
            ...items,
          ].slice(0, 6));
        }
        return next;
      });
    }

    void loadAll();
    const timer = window.setInterval(loadAll, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedId]);

  async function playStation(station: Station) {
    setSelectedId(station.id);
    const audio = audioRef.current;
    if (!audio) return;

    setLoading(true);
    if (audio.src !== station.streamUrl) {
      audio.src = station.streamUrl;
      audio.load();
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src) return playStation(selected);

    if (audio.paused) {
      setLoading(true);
      try {
        await audio.play();
        setPlaying(true);
      } finally {
        setLoading(false);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function moveStation(direction: number) {
    const index = stations.findIndex((station) => station.id === selected.id);
    const next = stations[(index + direction + stations.length) % stations.length];
    void playStation(next);
  }

  return (
    <>
      <header className="siteHeader">
        <a href="#inicio" className="brand">
          <img src="/logos/grupo-fieramix.png" alt="GRUPO FIERAMIX.COM" />
          <div>
            <strong>GRUPO FIERAMIX.COM</strong>
            <span>La red latina que mueve el mundo</span>
          </div>
        </a>

        <button className="menuButton" onClick={() => setMenuOpen((value) => !value)}>
          ☰
        </button>

        <nav className={menuOpen ? "open" : ""}>
          <a href="#inicio">Inicio</a>
          <a href="#emisoras">Emisoras</a>
          <a href="#ranking">Top musical</a>
          <a href="#noticias">Noticias</a>
          <a href="#club">Club de oyentes</a>
        </nav>

        <button className="liveButton" onClick={togglePlayback}>
          <i /> {playing ? "EN VIVO" : "ESCUCHA EN VIVO"}
        </button>
      </header>

      <main id="inicio">
        <section className="heroShell">
          <div className="heroCopy">
            <span className="heroKicker">GRUPO FIERAMIX.COM</span>
            <h1>La mejor música latina<br /><em>de todos los tiempos</em></h1>
            <p>
              Nueve emisoras especializadas transmitiendo en vivo las 24 horas,
              con la música, la información y la energía que mueve al mundo latino.
            </p>
            <div className="heroActions">
              <button onClick={togglePlayback}>{playing ? "PAUSAR" : "▶ ESCUCHAR AHORA"}</button>
              <a href="#emisoras">EXPLORAR EMISORAS</a>
            </div>
            <div className="heroMetrics">
              <div><strong>9</strong><span>Emisoras</span></div>
              <div><strong>24/7</strong><span>En vivo</span></div>
              <div><strong>{current.listeners ?? "—"}</strong><span>Oyentes ahora</span></div>
            </div>
          </div>

          <article className="premiumPlayer" style={{ "--accent": selected.accent } as React.CSSProperties}>
            <div className="playerGlow" />
            <div className="playerTopline"><span><i /> TRANSMITIENDO</span><b>{selected.genre}</b></div>
            <div className="artworkFrame">
              <img src={current.artwork || selected.logo} alt={current.title} />
              <div className={playing ? "equalizer active" : "equalizer"}>
                <i /><i /><i /><i /><i />
              </div>
            </div>
            <div className="nowLabel">SONANDO AHORA</div>
            <h2>{current.title}</h2>
            <h3>{current.artist}</h3>
            <p>{selected.name} · {selected.slogan}</p>
            <div className="mainControls">
              <button onClick={() => moveStation(-1)}>⏮</button>
              <button className="mainPlay" onClick={togglePlayback}>{loading ? "•••" : playing ? "❚❚" : "▶"}</button>
              <button onClick={() => moveStation(1)}>⏭</button>
            </div>
            <div className="volumeRow">
              <span>🔊</span>
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
              <span>{current.listeners ?? 0} oyentes</span>
            </div>
          </article>
        </section>

        <section id="emisoras" className="section stationsSection">
          <div className="sectionTitle">
            <span>NUESTRA RED</span>
            <h2>Nueve emisoras. Una sola pasión.</h2>
            <p>Elige tu género y entra de inmediato a la transmisión en vivo.</p>
          </div>

          <div className="stationGrid">
            {stations.map((station) => {
              const info = metadata[station.id] ?? emptyNowPlaying(station);
              const active = station.id === selected.id;
              return (
                <article key={station.id} className={active ? "stationCard active" : "stationCard"} style={{ "--accent": station.accent } as React.CSSProperties}>
                  <div className="stationBadge"><i /> EN VIVO</div>
                  <img src={station.logo} alt={station.name} />
                  <span>{station.genre}</span>
                  <h3>{station.name}</h3>
                  <p className="stationSlogan">{station.slogan}</p>
                  <div className="stationNow">
                    <b>{info.title}</b>
                    <small>{info.artist}</small>
                  </div>
                  <div className="stationFooter">
                    <span>👥 {info.listeners ?? "—"}</span>
                    <button onClick={() => playStation(station)}>
                      {active && playing ? "❚❚ PAUSAR" : "▶ ESCUCHAR"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="contentBand">
          <div className="historyPanel">
            <div className="panelHeading"><span>RECIENTEMENTE</span><h2>Últimas canciones</h2></div>
            <div className="historyList">
              {(history.length ? history : [
                { ...current, stationId: selected.id, stamp: "Ahora" },
                ...stations.slice(1, 5).map((station) => ({
                  ...(metadata[station.id] ?? emptyNowPlaying(station)),
                  stationId: station.id,
                  stamp: "En vivo",
                })),
              ]).map((item, index) => (
                <div className="historyItem" key={`${item.stationId}-${item.title}-${index}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <img src={item.artwork || stations.find((station) => station.id === item.stationId)?.logo} alt="" />
                  <div><b>{item.title}</b><small>{item.artist}</small></div>
                  <time>{item.stamp}</time>
                </div>
              ))}
            </div>
          </div>

          <div id="ranking" className="rankingPanel">
            <div className="panelHeading"><span>FIERAMIX CHART</span><h2>Top 10 latino</h2></div>
            <ol>
              {topSongs.map((song, index) => <li key={song}><b>{index + 1}</b><span>{song}</span><em>{index < 3 ? "🔥" : "↗"}</em></li>)}
            </ol>
          </div>
        </section>

        <section id="noticias" className="newsSection">
          <div className="sectionTitle light"><span>FIERAMIX NOTICIAS</span><h2>Actualidad que conecta</h2></div>
          <div className="newsGrid">
            <article className="newsLead"><span>DESTACADA</span><h3>GRUPO FIERAMIX.COM expande su plataforma de radio digital</h3><p>Nueve señales, música en vivo y una experiencia diseñada para la comunidad latina.</p></article>
            <article><span>MÚSICA</span><h3>Los ritmos latinos que siguen conquistando al mundo</h3><p>Bachata, merengue y salsa viven un nuevo momento digital.</p></article>
            <article><span>COMUNIDAD</span><h3>Únete al Club de Oyentes Fieramix</h3><p>Promociones, saludos, concursos y conexión directa con nuestras emisoras.</p></article>
          </div>
        </section>

        <section id="club" className="clubSection">
          <div><span>CLUB DE OYENTES</span><h2>La radio también se vive contigo</h2><p>Forma parte de nuestra comunidad y recibe novedades, promociones y contenido exclusivo.</p></div>
          <a href="https://chat.whatsapp.com/JJfXFBwAG3O8DIKs9ufvJt" target="_blank" rel="noreferrer">UNIRME POR WHATSAPP</a>
        </section>
      </main>

      <footer>
        <div className="footerBrand"><img src="/logos/grupo-fieramix.png" alt="" /><div><strong>GRUPO FIERAMIX.COM</strong><span>La red latina que mueve el mundo</span></div></div>
        <div className="footerLinks"><a href="https://www.facebook.com/FieraMIXRD">Facebook</a><a href="https://www.instagram.com/fieramix">Instagram</a><a href="https://www.youtube.com/@fieramixtv5937">YouTube</a></div>
        <small>© 2026 GRUPO FIERAMIX.COM</small>
      </footer>

      <aside className="stickyPlayer" style={{ "--accent": selected.accent } as React.CSSProperties}>
        <div className="stickyInfo"><img src={current.artwork || selected.logo} alt="" /><div><small>{selected.name}</small><strong>{current.title}</strong><span>{current.artist}</span></div></div>
        <div className="stickyControls"><button onClick={() => moveStation(-1)}>⏮</button><button className="stickyPlay" onClick={togglePlayback}>{loading ? "•••" : playing ? "❚❚" : "▶"}</button><button onClick={() => moveStation(1)}>⏭</button></div>
        <div className="stickyLive"><i /> {playing ? "EN VIVO" : "LISTO"}</div>
      </aside>

      <audio ref={audioRef} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
    </>
  );
}
