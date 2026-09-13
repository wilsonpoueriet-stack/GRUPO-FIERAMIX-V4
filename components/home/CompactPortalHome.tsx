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

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.fieramix.webapp";
const APP_STORE_URL = "https://apps.apple.com/es/app/fieramix/id6755240653";

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
  const [openPanel, setOpenPanel] = useState<"history" | "ranking" | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

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

  useEffect(() => {
    const rememberPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const clearPrompt = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", rememberPrompt);
    window.addEventListener("appinstalled", clearPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", rememberPrompt);
      window.removeEventListener("appinstalled", clearPrompt);
    };
  }, []);

  const installOnWindows = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstallPrompt(null);
      return;
    }
    window.alert("Para instalar FIERAMIX en Windows, abre el menú del navegador y selecciona ‘Instalar aplicación’. ");
  };

  const fullRecent = useMemo(() => {
    const selectedRecent = metadata[selected.id]?.recent ?? [];
    const sessionHistory = history
      .filter((item) => item.stationId === selected.id)
      .map((item) => ({ title: item.title, artist: item.artist, artwork: item.artwork, started: item.stamp }));
    const combined = [...selectedRecent, ...sessionHistory];
    return combined.filter((track, index) =>
      combined.findIndex((candidate) => trackKey(candidate.title, candidate.artist) === trackKey(track.title, track.artist)) === index,
    );
  }, [history, metadata, selected.id]);

  const recent = fullRecent.slice(0, 5);

  const ranking = useMemo(() => {
    const counts = new Map<string, { title: string; artist: string; artwork: string; plays: number }>();
    for (const station of stations.filter((item) => item.rankingEligible !== false)) {
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
      .slice(0, 25);
  }, [metadata, stations]);

  return (
    <div className="compactPortal" style={{ "--portal-accent": selected.accent } as CSSProperties}>
      <header className="compactHeader">
        <a className="compactBrand" href="#inicio" aria-label="Inicio de EL GRUPO FIERAMIX.COM">
          <img src="/logos/grupo-fieramix.png" alt="EL GRUPO FIERAMIX.COM" />
          <span><strong>EL GRUPO FIERAMIX.COM</strong><b>LA RED LATINA QUE MUEVE AL MUNDO</b></span>
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
            <button className="compactPanelButton" type="button" onClick={() => setOpenPanel("history")}>VER HISTORIAL COMPLETO</button>
          </aside>
        </section>

        <section id="emisoras" className="compactStations" aria-labelledby="stations-heading">
          <h2 id="stations-heading"><span />NUESTRAS EMISORAS<span /></h2>
          <div className="compactStationGrid">
            {stations.map((station) => {
              const info = metadata[station.id] ?? emptyNowPlaying(station);
              const active = selected.id === station.id;
              return <button key={station.id} className={active ? "compactStation active" : "compactStation"} onClick={() => onPlayStation(station)} style={{ "--station-accent": station.accent } as CSSProperties}>
                <img src={station.logo} alt="" /><span><b>{station.name}</b><small className="compactStationArtist">{info.artist || station.genre}</small><small className="compactStationTitle">{info.title || "Programación en vivo"}</small></span><i>{info.listeners ?? "•"}</i>
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
            <ol>{ranking.slice(0, 10).map((track, index) => <li key={trackKey(track.title, track.artist)}><strong>{String(index + 1).padStart(2, "0")}</strong><img src={track.artwork || selected.logo} alt=""/><span><b>{track.title}</b><small>{track.artist}</small></span></li>)}</ol>
            <button className="compactPanelButton" type="button" onClick={() => setOpenPanel("ranking")}>VER TOP COMPLETO</button>
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

      {openPanel ? (
        <div className="compactModalBackdrop" role="presentation" onMouseDown={() => setOpenPanel(null)}>
          <section className="compactModal" role="dialog" aria-modal="true" aria-labelledby="compact-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div><span>{openPanel === "ranking" ? "RANKING FIERAMIX" : selected.name}</span><h2 id="compact-modal-title">{openPanel === "ranking" ? "TOP 25 COMPLETO" : "HISTORIAL COMPLETO"}</h2></div>
              <button type="button" onClick={() => setOpenPanel(null)} aria-label="Cerrar">×</button>
            </header>
            {openPanel === "ranking" ? (
              <ol className="compactModalList">{ranking.map((track, index) => <li key={trackKey(track.title, track.artist)}><strong>{String(index + 1).padStart(2, "0")}</strong><img src={track.artwork || selected.logo} alt=""/><span><b>{track.title}</b><small>{track.artist}</small></span><em>{track.plays} {track.plays === 1 ? "tocada" : "tocadas"}</em></li>)}</ol>
            ) : (
              <ol className="compactModalList">{fullRecent.map((track, index) => <li key={`${trackKey(track.title, track.artist)}-${index}`}><strong>{String(index + 1).padStart(2, "0")}</strong><img src={track.artwork || selected.logo} alt=""/><span><b>{track.title}</b><small>{track.artist}</small></span><em>{track.started}</em></li>)}</ol>
            )}
          </section>
        </div>
      ) : null}

      <footer className="compactFooter">
        <strong>EL GRUPO FIERAMIX.COM</strong>
        <span>© 2026 · TODOS LOS DERECHOS RESERVADOS</span>
        <nav><a href="/politica-privacidad">Política de privacidad</a><a href="#inicio">Volver arriba</a></nav>
        <section className="compactDownloads" aria-label="Descargar FIERAMIX">
          <small>DISPONIBLE EN:</small>
          <div>
            <button type="button" onClick={() => void installOnWindows()} aria-label="Instalar FIERAMIX en Windows" title="Windows">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4.2 10.2 3v8H2V4.2Zm9.2-1.35L22 1.3V11H11.2V2.85ZM2 12h8.2v8L2 18.8V12Zm9.2 0H22v9.7l-10.8-1.55V12Z" /></svg><span>Windows</span>
            </button>
            <a href={GOOGLE_PLAY_URL} target="_blank" rel="noreferrer" aria-label="Descargar FIERAMIX para Android" title="Android">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.1 7.2h9.8c1 0 1.8.8 1.8 1.8v8.1c0 1-.8 1.8-1.8 1.8h-.8V22h-2v-3.1H9.9V22h-2v-3.1h-.8c-1 0-1.8-.8-1.8-1.8V9c0-1 .8-1.8 1.8-1.8Zm-3.4.6c.7 0 1.2.5 1.2 1.2v7.2a1.2 1.2 0 1 1-2.4 0V9c0-.7.5-1.2 1.2-1.2Zm16.6 0c.7 0 1.2.5 1.2 1.2v7.2a1.2 1.2 0 1 1-2.4 0V9c0-.7.5-1.2 1.2-1.2ZM7 6.4c.2-1.7 1.2-3.1 2.6-3.9L8.5.8l.7-.4 1.2 1.8c.5-.2 1-.3 1.6-.3s1.1.1 1.6.3L14.8.4l.7.4-1.1 1.7c1.4.8 2.4 2.2 2.6 3.9H7Z" /></svg><span>Android</span>
            </a>
            <a href={APP_STORE_URL} target="_blank" rel="noreferrer" aria-label="Descargar FIERAMIX para iPhone" title="iPhone">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.7 12.8c0-2.7 2.2-4 2.3-4.1-1.3-1.9-3.3-2.1-4-2.1-1.7-.2-3.3 1-4.1 1-.8 0-2.1-1-3.5-.9-1.8 0-3.5 1.1-4.4 2.7-1.9 3.3-.5 8.1 1.3 10.7.9 1.3 2 2.8 3.4 2.7 1.3-.1 1.9-.9 3.5-.9 1.6 0 2.1.9 3.5.8 1.5 0 2.4-1.3 3.3-2.6 1-1.5 1.5-3 1.5-3.1-.1 0-2.8-1.1-2.8-4.2ZM13.9 4.8c.7-.9 1.2-2.2 1.1-3.5-1.1 0-2.5.8-3.3 1.7-.7.8-1.3 2.1-1.1 3.4 1.2.1 2.5-.6 3.3-1.6Z" /></svg><span>iPhone</span>
            </a>
          </div>
        </section>
      </footer>
    </div>
  );
}
