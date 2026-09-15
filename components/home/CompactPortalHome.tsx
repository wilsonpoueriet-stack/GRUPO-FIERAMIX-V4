"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getLiveProgramming } from "@/components/content/FieramixProgramming";
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

type CompactRankingTrack = {
  title: string;
  artist: string;
  artwork: string;
  change?: number;
};

const onlineRadioBoxSlugs: Record<string, string> = {
  fieramix: "fieramixlabrava",
  bachata: "fieramix",
  merengue: "fieramixlamerenguera",
  salsa: "fieramixlasalsera",
  baladas: "fieramixlaromantica",
  reggaeton: "fieramixlaurbana",
  rancheras: "fieramixlamexicana",
  internacional: "fieramixlaamericana",
  cristiana: "fieramixlacristiana",
  utopia: "utopia",
  ahora: "ahora",
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.fieramix.webapp";
const APP_STORE_URL = "https://apps.apple.com/es/app/fieramix/id6755240653";
const FAVORITE_STATIONS_STORAGE_KEY = "fieramix-favorite-stations";
const FAVORITES_UPDATED_EVENT = "fieramix-favorites-updated";
const compactPromos = [
  { title: "Íntimamente", href: "#inicio", image: "/banners/intimamente.webp" },
  { title: "Románticamente al amanecer", href: "#inicio", image: "/banners/romanticamente-al-amanecer.webp" },
  { title: "La hora cero", href: "#inicio", image: "/banners/la-hora-cero.webp" },
  { title: "Navidad dominicana con El Fierakán", href: "#inicio", image: "/banners/navidad-dominicana.webp" },
  { title: "La mejor música latina de todos los tiempos", href: "#inicio", image: "/banners/musica-latina-al-volante.webp" },
  { title: "El fin de semana bravo", href: "#inicio", image: "/banners/fin-de-semana-bravo.webp" },
] as const;

const socialLinks = [
  ["facebook", "https://www.facebook.com/FieraMIXRD", "Facebook"],
  ["instagram", "https://www.instagram.com/fieramix", "Instagram"],
  ["x", "https://x.com/FieraMIX", "X"],
  ["youtube", "https://www.youtube.com/@fieramixtv5937", "YouTube"],
  ["tiktok", "https://www.tiktok.com/@elgrupofieramix", "TikTok"],
  ["whatsapp", "https://wa.me/18098419586", "WhatsApp"],
] as const;

function SocialIcon({ name }: { name: (typeof socialLinks)[number][0] }) {
  if (name === "facebook") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 22v-9h3l.5-3.5h-3.5V7.2c0-1 .3-1.7 1.8-1.7h1.9V2.4c-.3 0-1.5-.1-2.8-.1-2.8 0-4.7 1.7-4.7 4.8v2.4H6.8V13h3.1v9h3.8Z" /></svg>;
  if (name === "instagram") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/><circle cx="12" cy="12" r="4.1"/><circle className="socialIconDot" cx="17.6" cy="6.7" r="1"/></svg>;
  if (name === "x") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 15.6 6.4 22H3.2l7.3-8.3L2.8 2h6.4l4.4 5.8L18.9 2Zm-1.1 17.8h1.7L8.2 4H6.4l11.4 15.8Z" /></svg>;
  if (name === "youtube") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23 7.1a3 3 0 0 0-2.1-2.2C19 4.4 12 4.4 12 4.4s-7 0-8.9.5A3 3 0 0 0 1 7.1 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.9a3 3 0 0 0 2.1 2.2c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.2 31 31 0 0 0 .5-4.9 31 31 0 0 0-.5-4.9ZM9.7 15.3V8.7L15.5 12l-5.8 3.3Z" /></svg>;
  if (name === "whatsapp") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.7 11.7 0 0 0 12.1 0 11.9 11.9 0 0 0 1.8 17.8L.1 24l6.4-1.7A11.9 11.9 0 0 0 24 11.9c0-3.2-1.2-6.2-3.5-8.4Zm-8.4 18.4a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.8 1 1-3.7-.2-.4a9.8 9.8 0 1 1 8.4 4.7Zm5.4-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1-2-.9-3.3-1.7-4.6-4-.3-.6.3-.6.9-1.4.1-.2.1-.4 0-.6l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.4-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.7 5.9 5.2 2.2 1 3.1 1 4.2.8 1.3-.2 1.8-1.2 2-1.7.2-.5.2-1 .1-1.1-.1-.2-.4-.3-.7-.4Z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.7 2c.4 2.5 1.8 4 4.3 4.2v3.1a8.6 8.6 0 0 1-4.3-1v6.4a7 7 0 1 1-6-6.9v3.3a3.7 3.7 0 1 0 2.7 3.6V2h3.3Z" /></svg>;
}

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

function splitOnlineRadioBoxTrack(name: string) {
  const separator = name.indexOf(" - ");
  if (separator < 1) return { artist: "Artista no identificado", title: name.trim() };
  return { artist: name.slice(0, separator).trim(), title: name.slice(separator + 3).trim() };
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
  const [newsItems, setNewsItems] = useState<NewsItem[]>(fallbackNews.slice(0, 5));
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [stationRanking, setStationRanking] = useState<{ stationId: string; tracks: CompactRankingTrack[] }>({ stationId: "", tracks: [] });
  const [programmingClock, setProgrammingClock] = useState<Date | null>(null);
  const [favoriteStations, setFavoriteStations] = useState<string[]>([]);
  const [promoIndex, setPromoIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setPromoIndex((index) => (index + 1) % compactPromos.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(FAVORITE_STATIONS_STORAGE_KEY) || "[]") as unknown;
        setFavoriteStations(Array.isArray(saved) ? saved.map(String) : []);
      } catch { setFavoriteStations([]); }
    };
    loadFavorites();
    window.addEventListener(FAVORITES_UPDATED_EVENT, loadFavorites);
    window.addEventListener("storage", loadFavorites);
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, loadFavorites);
      window.removeEventListener("storage", loadFavorites);
    };
  }, []);

  const toggleFavorite = () => {
    const stationId = String(selected.id);
    const next = favoriteStations.includes(stationId)
      ? favoriteStations.filter((id) => id !== stationId)
      : [...favoriteStations, stationId];
    setFavoriteStations(next);
    try { window.localStorage.setItem(FAVORITE_STATIONS_STORAGE_KEY, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
  };

  useEffect(() => {
    const update = () => setProgrammingClock(new Date());
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/news", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { news?: NewsItem[] } | null) => {
        if (!payload?.news?.length) return;
        setNewsItems(payload.news.slice(0, 5));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStationRanking({ stationId: "", tracks: [] });

    async function loadOfficialStationTop10() {
      const slug = onlineRadioBoxSlugs[selected.id];
      if (!slug) {
        setStationRanking({ stationId: selected.id, tracks: [] });
        return;
      }

      for (let attempt = 0; attempt < 3; attempt += 1) {
        if (attempt > 0) {
          await new Promise<void>((resolve) => window.setTimeout(resolve, attempt === 1 ? 700 : 1400));
        }
        if (cancelled) return;
        try {
          const query = new URLSearchParams({
            size: "10",
            tz: String(new Date().getTimezoneOffset()),
            rnd: String(Math.random()),
          });
          const response = await fetch(`https://onlineradiobox.com/json/do/${slug}/top?${query}`, { cache: "no-store" });
          const payload = (await response.json()) as { top?: Array<{ name?: string; img?: string; change?: number }> };
          if (cancelled) return;
          if (!response.ok || !Array.isArray(payload.top)) return;
          const tracks = payload.top.flatMap((track) => {
            if (!track.name?.trim()) return [];
            const parsed = splitOnlineRadioBoxTrack(track.name);
            return [{ ...parsed, artwork: track.img ?? "", change: track.change }];
          });
          setStationRanking({ stationId: selected.id, tracks });
          if (tracks.length > 0) return;
        } catch {
          if (attempt === 2) return;
        }
      }
    }

    void loadOfficialStationTop10();
    return () => { cancelled = true; };
  }, [selected.id]);

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

  const recent = fullRecent.slice(0, 10);
  const activePromo = compactPromos[promoIndex];

  const ranking = stationRanking.stationId === selected.id ? stationRanking.tracks : [];
  const liveProgramming = programmingClock ? getLiveProgramming(selected.id, programmingClock) : null;

  return (
    <div className="compactPortal" style={{ "--portal-accent": selected.accent } as CSSProperties}>
      <header className="compactHeader">
        <a className="compactBrand" href="/" aria-label="Ir al inicio de EL GRUPO FIERAMIX.COM">
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
          <Link href="/portal">＋<span>DESCUBRE +</span></Link>
        </nav>
        <div className="compactSocials">
          {socialLinks.map(([icon, href, label]) => <a key={label} className={`social-${icon}`} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}><SocialIcon name={icon} /></a>)}
        </div>
        <button className="compactLiveButton" onClick={onPlaybackToggle}>{playing ? "❚❚ EN VIVO" : "▶ ESCUCHA EN VIVO"}</button>
      </header>

      <main id="inicio" className="compactMain">
        <section className="compactPlayerBand" aria-label="Reproductor principal">
          <div className="stationIdentity" data-station={selected.id}>
            <span className="livePill"><i aria-hidden="true" /> EN VIVO</span>
            <img src={selected.logo} alt={selected.name} />
            <div className={`equalizerBars${playing ? " isPlaying" : ""}`} aria-hidden="true">{Array.from({ length: 38 }, (_, index) => {
              const waveHeight = 6 + Math.round((Math.sin(index * 0.72) + 1) * 7);
              return <i key={index} style={{ "--bar-index": index, "--wave-height": `${waveHeight}px` } as CSSProperties} />;
            })}</div>
          </div>

          <div className="nowPlayingCard">
            <img src={current.artwork || selected.logo} onError={(event) => { event.currentTarget.src = selected.logo; }} alt={`Portada de ${current.title}`} />
            <div className="nowPlayingCopy">
              <span>SONANDO AHORA</span>
              <h1>{current.title}</h1>
              <p>{current.artist}</p>
              <div className="playerBadges"><b>EN VIVO</b><i>128 Kbps</i><i>MP3</i></div>
              <div className="compactControls">
                <button onClick={() => onMoveStation(-1)} aria-label="Emisora anterior">◀◀</button>
                <button className="compactMainPlay" onClick={onPlaybackToggle} aria-label={playing ? "Pausar" : "Reproducir"}>{loading ? "•••" : playing ? "❚❚" : "▶"}</button>
                <button onClick={() => onMoveStation(1)} aria-label="Emisora siguiente">▶▶</button>
                <button className={`compactFavorite${favoriteStations.includes(String(selected.id)) ? " active" : ""}`} type="button" onClick={toggleFavorite} aria-pressed={favoriteStations.includes(String(selected.id))} aria-label={favoriteStations.includes(String(selected.id)) ? `Quitar ${selected.name} de favoritas` : `Agregar ${selected.name} a favoritas`}>{favoriteStations.includes(String(selected.id)) ? "♥" : "♡"}</button>
                <label><span>🔊</span><input aria-label="Volumen" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => onVolumeChange(Number(event.target.value))} /></label>
              </div>
            </div>
          </div>

          <aside className="recentCard compactBanners" aria-label="Promociones FIERAMIX">
            <Link className="compactBannerSlide" href={activePromo.href} key={promoIndex}>
              <img src={activePromo.image} alt={activePromo.title} />
            </Link>
            <div className="compactBannerDots" aria-label="Seleccionar promoción">
              {compactPromos.map((promo, index) => <button key={promo.title} type="button" className={index === promoIndex ? "active" : ""} onClick={() => setPromoIndex(index)} aria-label={`Ver promoción ${index + 1}`} />)}
            </div>
          </aside>
        </section>

        <section id="emisoras" className="compactStations" aria-labelledby="stations-heading">
          <h2 id="stations-heading"><span />NUESTRAS EMISORAS<span /></h2>
          <div className="compactStationGrid">
            {stations.map((station) => {
              const info = metadata[station.id] ?? emptyNowPlaying(station);
              const active = selected.id === station.id;
              return <button key={station.id} data-station={station.id} className={active ? "compactStation active" : "compactStation"} onClick={() => onPlayStation(station)} style={{ "--station-accent": station.accent } as CSSProperties}>
                <span className="compactStationLogo"><img src={station.logo} alt="" /></span><span className="compactStationInfo"><b>{station.name}</b><small className="compactStationArtist">{info.artist || station.genre}</small><small className="compactStationTitle">{info.title || "Programación en vivo"}</small></span><i>{info.listeners ?? "•"}</i>
              </button>;
            })}
          </div>
        </section>

        <section className="compactDashboard">
          <article id="en-vivo" className="compactPanel livePanel recentHistoryPanel">
            <h2>HISTORIAL RECIENTE<small>10 CANCIONES</small></h2>
            <ul>{recent.map((track, index) => <li key={`${track.title}-${index}`}><img src={track.artwork || selected.logo} onError={(event) => { event.currentTarget.src = selected.logo; }} alt={`Portada de ${track.title}`}/><b>{track.artist}</b><span>{track.title}</span><time>{"started" in track ? track.started : ""}</time></li>)}</ul>
          </article>

          <article id="ranking" className="compactPanel rankingCompact">
            <h2>TOP 10 · {selected.name}</h2>
            <ol>{ranking.slice(0, 10).map((track, index) => <li key={trackKey(track.title, track.artist)}><strong>{String(index + 1).padStart(2, "0")}</strong><img src={track.artwork || selected.logo} alt=""/><span><b>{track.title}</b><small>{track.artist}</small></span></li>)}</ol>
          </article>

          <article className="compactPanel compactProgramming">
            <h2>PROGRAMACIÓN <small>HORA DOMINICANA</small></h2>
            {liveProgramming ? <div className="compactProgrammingSlots">
              <section className="isCurrent"><span>● AHORA</span><h3>{liveProgramming.current.title}</h3><p>{liveProgramming.current.detail}</p><strong>{liveProgramming.current.schedule}</strong></section>
              <section><span>A CONTINUACIÓN</span><h3>{liveProgramming.next.title}</h3><p>{liveProgramming.next.detail}</p><strong>{liveProgramming.next.schedule}</strong></section>
            </div> : <div className="compactProgrammingEmpty"><b>{selected.name}</b><span>Programación detallada no disponible.</span></div>}
          </article>

          <div className="compactRequestPanel">
            <SongRequest key={selected.id} initialStationId={requestStationId(selected.id)} compact />
          </div>

          <div className="compactEngagementColumn">
            <article id="club" className="compactPanel compactClub">
              <span>CLUB DE OYENTES</span>
              <h2>DEL GRUPO FIERAMIX.COM</h2>
              <p>Recibe novedades, estrenos y promociones.</p>
              <Link href="/club-de-oyentes">◉ ¡UNIRME AL CLUB!</Link>
            </article>

            <article className="compactPanel compactDonation">
              <Link className="compactDonationFlag" href="/apoyar" aria-label="Ir a la página de donaciones" title="Tu donación aquí">
                <svg viewBox="0 0 82 58" aria-hidden="true">
                  <path className="donateRibbonShadow" d="M18 33h48v20L48 48v9L32 50v-9H18Z"/>
                  <path className="donateRibbonBottom" d="M7 27h70l-7 25H7Z"/>
                  <path className="donateRibbonTop" d="M4 7 78 2v29L4 36Z"/>
                  <text className="donateRibbonTopText" x="41" y="21">DONACIÓN</text>
                  <text className="donateRibbonBottomText" x="42" y="44">AQUÍ</text>
                </svg>
              </Link>
            </article>
          </div>
        </section>

        <section className="compactNews compactNewsRow">
          <h2>FIERAMIX NOTICIAS<Link href="/noticias">VER TODAS</Link></h2>
          <div>{newsItems.slice(0, 5).map((item) => <Link key={item.id} href={`/noticias/${item.id}`}><img src={item.image || "/noticias/fieramix-noticias-espacio-informativo.png"} alt=""/><span><b>{item.title}</b><small>{item.publishedAt?.slice(0, 10) ?? ""}</small></span></Link>)}</div>
        </section>
      </main>

      <footer className="compactFooter">
        <Link className="compactFooterBrand" href="/" aria-label="Ir al inicio de EL GRUPO FIERAMIX.COM"><img src="/logos/grupo-fieramix.png" alt=""/><span><strong>EL GRUPO FIERAMIX.COM</strong><small>LA RED LATINA QUE MUEVE AL MUNDO</small></span></Link>
        <span>© 2026 · TODOS LOS DERECHOS RESERVADOS</span>
        <nav>
          <a href="/terminos-condiciones">Términos y Condiciones</a>
          <a href="/politica-privacidad">Política de Privacidad</a>
          <a href="/politica-cookies">Política de Cookies</a>
        </nav>
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
