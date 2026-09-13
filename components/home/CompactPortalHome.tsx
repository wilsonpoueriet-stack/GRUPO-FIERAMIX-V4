"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import SongRequest, { type RequestStationId } from "@/components/songrequest/SongRequest";
import { news as fallbackNews, type NewsItem } from "@/data/news";
import { emptyNowPlaying } from "@/hooks/useRadioPortal";
import type { HistoryItem, NowPlaying } from "@/types/radio";
import type { Station } from "@/types/station";

type Props = {
  stations: Station[];
  selected: Station;
  current: NowPlaying;
  metadata: Record<string, NowPlaying>;
  history: HistoryItem[];
  playing: boolean;
  loading: boolean;
  volume: number;
  onPlaybackToggle: () => void;
  onMoveStation: (direction: number) => void;
  onVolumeChange: (value: number) => void;
  onPlayStation: (station: Station) => void;
};

const socialLinks = [
  ["f", "https://www.facebook.com/FieraMIXRD", "Facebook"],
  ["◎", "https://www.instagram.com/fieramix", "Instagram"],
  ["𝕏", "https://x.com/FieraMIX", "X"],
  ["▶", "https://www.youtube.com/@fieramixtv5937", "YouTube"],
  ["♪", "https://www.tiktok.com/@elgrupofieramix", "TikTok"],
] as const;

function requestStationId(id: string): RequestStationId {
  const allowed: RequestStationId[] = [
    "bachata", "merengue", "salsa", "baladas", "reggaeton",
    "rancheras", "internacional", "cristiana", "fieramix",
  ];
  return allowed.includes(id as RequestStationId)
    ? (id as RequestStationId)
    : "fieramix";
}

function trackKey(title: string, artist: string) {
  return `${title.trim().toLowerCase()}::${artist.trim().toLowerCase()}`;
}

export default function CompactPortalHome({
  stations,
  selected,
  current,
  metadata,
  history,
  playing,
  loading,
  volume,
  onPlaybackToggle,
  onMoveStation,
  onVolumeChange,
  onPlayStation,
}: Props) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>(fallbackNews.slice(0, 3));

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/news", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { news?: NewsItem[] } | null) => {
        if (!payload?.news?.length) return;
        setNewsItems(payload.news.slice(0, 3));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const recent = useMemo(() => {
    const selectedRecent = metadata[selected.id]?.recent ?? [];
    if (selectedRecent.length) return selectedRecent.slice(0, 5);
    return history
      .filter((item) => item.stationId === selected.id)
      .slice(0, 5);
  }, [history, metadata, selected.id]);

  const ranking = useMemo(() => {
    const counts = new Map<string, { title: string; artist: string; artwork: string; plays: number }>();
    for (const station of stations) {
      const info = metadata[station.id] ?? emptyNowPlaying(station);
      const tracks = [{ title: info.title, artist: info.artist, artwork: info.artwork }, ...(info.recent ?? [])];
      for (const track of tracks) {
        if (!track.title || !track.artist || track.title === "Programación en vivo") continue;
        const key = trackKey(track.title, track.artist);
        const existing = counts.get(key);
        if (existing) existing.plays += 1;
        else counts.set(key, { ...track, plays: 1 });
      }
    }
    return [...counts.values()]
      .sort((a, b) => b.plays - a.plays || a.title.localeCompare(b.title))
      .slice(0, 10);
  }, [metadata, stations]);

  return (
    <div className="compactPortal" style={{ "--portal-accent": selected.accent } as CSSProperties}>
      <header className="compactHeader">
        <a className="compactBrand" href="#inicio" aria-label="Inicio de EL GRUPO FIERAMIX.COM">
          <img src="/logos/grupo-fieramix.png" alt="" />
          <span><strong>GRUPO <em>FIERAMIX</em><small>.COM</small></strong><b>LA RED LATINA QUE MUEVE AL MUNDO</b></span>
        </a>
        <nav aria-label="Menú principal">
          <a className="active" href="#inicio">⌂<span>INICIO</span></a>
          <a href="#emisoras">▣<span>EMISORAS</span></a>
          <a href="#en-vivo">◉<span>¿QUÉ SUENA?</span></a>
          <a href="#ranking">♛<span>RANKING</span></a>
          <Link href="/noticias">▤<span>NOTICIAS</span></Link>
          <a href="#solicita">✉<span>SOLICITUD</span></a>
          <a href="#club">♧<span>CLUB</span></a>
        </nav>
        <div className="compactSocials">
          {socialLinks.map(([icon, href, label]) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>{icon}</a>)}
        </div>
        <button className="compactLiveButton" onClick={onPlaybackToggle}>{playing ? "❚❚ EN VIVO" : "▶ ESCUCHA EN VIVO"}</button>
      </header>

      <main id="inicio" className="compactMain">
        <section className="compactPlayerBand" aria-label="Reproductor principal">
          <div className="stationIdentity">
            <span className="livePill">◉ EN VIVO</span>
            <img src={selected.logo} alt={selected.name} />
            <div className="equalizerBars" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} />)}</div>
          </div>

          <div className="nowPlayingCard">
            <img src={current.artwork || selected.logo} alt={`Portada de ${current.title}`} />
            <div className="nowPlayingCopy">
              <span>SONANDO AHORA</span>
              <h1>{current.title}</h1>
              <p>{current.artist}</p>
              <div className="playerBadges"><b>EN VIVO</b><i>128 Kbps</i><i>MP3</i></div>
              <div className="compactControls">
                <button onClick={() => onMoveStation(-1)} aria-label="Emisora anterior">◀◀</button>
                <button className="compactMainPlay" onClick={onPlaybackToggle} aria-label={playing ? "Pausar" : "Reproducir"}>{loading ? "•••" : playing ? "❚❚" : "▶"}</button>
                <button onClick={() => onMoveStation(1)} aria-label="Emisora siguiente">▶▶</button>
                <label><span>🔊</span><input aria-label="Volumen" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => onVolumeChange(Number(event.target.value))} /></label>
              </div>
            </div>
          </div>

          <aside className="recentCard">
            <h2>HISTORIAL RECIENTE</h2>
            <ol>{recent.map((track, index) => <li key={`${track.title}-${index}`}><span>♫</span><b>{track.artist} · {track.title}</b><time>{"started" in track ? track.started : ""}</time></li>)}</ol>
            <a href="#en-vivo">VER HISTORIAL COMPLETO</a>
          </aside>
        </section>

        <section id="emisoras" className="compactStations" aria-labelledby="stations-heading">
          <h2 id="stations-heading"><span />NUESTRAS EMISORAS<span /></h2>
          <div className="compactStationGrid">
            {stations.map((station) => {
              const info = metadata[station.id] ?? emptyNowPlaying(station);
              const active = selected.id === station.id;
              return <button key={station.id} className={active ? "compactStation active" : "compactStation"} onClick={() => onPlayStation(station)} style={{ "--station-accent": station.accent } as CSSProperties}>
                <img src={station.logo} alt="" /><span><b>{station.name}</b><small>{info.title || station.genre}</small></span><i>{info.listeners ?? "•"}</i>
              </button>;
            })}
          </div>
        </section>

        <section className="compactDashboard">
          <article id="en-vivo" className="compactPanel livePanel">
            <h2>¿QUÉ SUENA EN FIERAMIX?<small>EN TIEMPO REAL</small></h2>
            <ul>{stations.slice(0, 9).map((station) => { const info = metadata[station.id] ?? emptyNowPlaying(station); return <li key={station.id}><img src={station.logo} alt=""/><b>{station.name}</b><span>{info.artist} · {info.title}</span><i>EN VIVO</i></li>; })}</ul>
          </article>

          <article id="ranking" className="compactPanel rankingCompact">
            <h2>TOP 10 GENERAL</h2>
            <ol>{ranking.map((track, index) => <li key={trackKey(track.title, track.artist)}><strong>{String(index + 1).padStart(2, "0")}</strong><img src={track.artwork || selected.logo} alt=""/><span><b>{track.title}</b><small>{track.artist}</small></span></li>)}</ol>
            <a href="#top-musical">VER TOP COMPLETO</a>
          </article>

          <article className="compactPanel compactNews">
            <h2>FIERAMIX NOTICIAS<Link href="/noticias">VER TODAS</Link></h2>
            <div>{newsItems.map((item) => <Link key={item.id} href={`/noticias/${item.id}`}><img src={item.image || "/noticias/fieramix-noticias-espacio-informativo.png"} alt=""/><span><b>{item.title}</b><small>{item.publishedAt?.slice(0, 10) ?? ""}</small></span></Link>)}</div>
          </article>

          <div className="compactRequestPanel">
            <SongRequest key={selected.id} initialStationId={requestStationId(selected.id)} compact />
          </div>

          <article id="club" className="compactPanel compactClub">
            <span>CLUB DE OYENTES</span>
            <h2>DEL GRUPO FIERAMIX.COM</h2>
            <p>Únete a nuestra comunidad oficial y recibe novedades, estrenos, noticias y promociones.</p>
            <a href="https://chat.whatsapp.com/JJfXFBwAG3O8DlKs9ufvJt" target="_blank" rel="noreferrer">◉ ¡UNIRME AL CLUB!</a>
          </article>
        </section>
      </main>

      <footer className="compactFooter"><strong>EL GRUPO FIERAMIX.COM</strong><span>© 2026 · TODOS LOS DERECHOS RESERVADOS</span><nav><a href="/politica-privacidad">Política de privacidad</a><a href="#inicio">Volver arriba</a></nav></footer>
    </div>
  );
}
