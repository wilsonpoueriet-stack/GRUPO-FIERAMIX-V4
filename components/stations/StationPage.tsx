"use client";

// FIERAMIX SOUND PAGINAS INTERNAS V2 — TYPE SAFE

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { stations } from "@/data/stations";
import {
  applyFieramixSoundProfile,
  createFieramixSoundGraph,
  hasFieramixSoundProfile,
  streamAllowsWebAudio,
  type FieramixSoundGraph,
  type FieramixSoundStatus,
} from "@/hooks/useRadioPortal";
import type { NowPlaying } from "@/types/radio";
import type { StationId } from "@/types/station";
import SongRequest, { type RequestStationId } from "@/components/songrequest/SongRequest";
import SupportPrompt from "@/components/support/SupportPrompt";
import { getStationPath } from "@/data/station-routes";
import styles from "./StationPage.module.css";

type StationPageProps = { stationId?: StationId };

function fallback(stationId: string): NowPlaying {
  const station = stations.find((item) => item.id === stationId) ?? stations[0];

  return {
    title: "Programación en vivo",
    artist: station.name,
    artwork: station.logo,
    listeners: null,
    configured: false,
  };
}

function getSoundBadge(
  status: FieramixSoundStatus,
  active: boolean,
) {
  if (status === "checking") {
    return {
      label: "FIERAMIX SOUND · COMPROBANDO",
      dot: "#f5b942",
      text: "#ffe5a3",
      border: "rgba(245, 185, 66, .32)",
      background: "rgba(245, 185, 66, .09)",
      glow: "rgba(245, 185, 66, .16)",
    };
  }

  if (status === "bypass") {
    return {
      label: "FIERAMIX SOUND · BYPASS",
      dot: "#9ca3af",
      text: "#d1d5db",
      border: "rgba(156, 163, 175, .25)",
      background: "rgba(156, 163, 175, .07)",
      glow: "rgba(156, 163, 175, .10)",
    };
  }

  if (status === "active" && active) {
    return {
      label: "FIERAMIX SOUND · ACTIVO",
      dot: "#7bf5be",
      text: "#bdfbdc",
      border: "rgba(123, 245, 190, .32)",
      background: "rgba(123, 245, 190, .08)",
      glow: "rgba(123, 245, 190, .18)",
    };
  }

  return null;
}

export default function StationPage({ stationId: requestedStationId }: StationPageProps) {
  const params = useParams<{ id?: string }>();
  const routeStationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const stationId = requestedStationId ?? routeStationId ?? "";

  const station = useMemo(
    () => stations.find((item) => item.id === stationId),
    [stationId],
  );

  const audioRef = useRef<HTMLAudioElement>(null);
  const fieramixSoundGraphRef = useRef<FieramixSoundGraph | null>(null);
  const fieramixSoundInitPromiseRef = useRef<Promise<boolean> | null>(null);
  const fieramixSoundCheckedRef = useRef(false);

  const [metadata, setMetadata] = useState<NowPlaying>(() =>
    fallback(stationId),
  );
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [copied, setCopied] = useState(false);
  const [fieramixSoundStatus, setFieramixSoundStatus] =
    useState<FieramixSoundStatus>("idle");

  const fieramixSoundActive =
    fieramixSoundStatus === "active" &&
    Boolean(station && hasFieramixSoundProfile(station));
  const soundBadge = getSoundBadge(
    fieramixSoundStatus,
    fieramixSoundActive,
  );

  useEffect(() => {
    if (!station) {
      return;
    }

    const currentStation = station;
    let cancelled = false;

    async function loadMetadata(): Promise<void> {
      try {
      const response = await fetch(
        `/api/now-playing?station=${encodeURIComponent(currentStation.id)}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo cargar la emisora.");
      }

      const data = (await response.json()) as NowPlaying;

      if (!cancelled) {
        setMetadata(data);
      }
    } catch {
      if (!cancelled) {
        setMetadata(fallback(currentStation.id));
      }
    }
  }

  void loadMetadata();

  const timer = window.setInterval(() => {
    void loadMetadata();
  }, 20_000);

  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}, [station]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    return () => {
      const graph = fieramixSoundGraphRef.current;

      if (graph) {
        void graph.context.close();
        fieramixSoundGraphRef.current = null;
      }
    };
  }, []);

  if (!station) {
    return (
      <main className={styles.notFound}>
        <span>404</span>
        <h1>Emisora no encontrada</h1>
        <p>La señal solicitada no forma parte de EL GRUPO FIERAMIX.COM.</p>
        <Link href="/">Volver al portal</Link>
      </main>
    );
  }

  // Capturamos la emisora ya validada para que TypeScript mantenga
  // el tipo Station dentro de las funciones asíncronas anidadas.
  const currentStation = station;

  async function ensureFieramixSound(): Promise<boolean> {
    const audio = audioRef.current;

    if (!audio) {
      return false;
    }

    const existingGraph = fieramixSoundGraphRef.current;

    if (existingGraph) {
      applyFieramixSoundProfile(existingGraph, currentStation);

      if (existingGraph.context.state === "suspended") {
        try {
          await existingGraph.context.resume();
        } catch {
          // La reproducción normal puede continuar aunque el contexto
          // permanezca suspendido hasta la interacción del usuario.
        }
      }

      setFieramixSoundStatus(
        hasFieramixSoundProfile(currentStation) ? "active" : "idle",
      );
      return true;
    }

    if (fieramixSoundCheckedRef.current) {
      return false;
    }

    if (fieramixSoundInitPromiseRef.current) {
      return fieramixSoundInitPromiseRef.current;
    }

    fieramixSoundInitPromiseRef.current = (async () => {
      setFieramixSoundStatus("checking");

      const corsReady = await streamAllowsWebAudio(currentStation.streamUrl);
      fieramixSoundCheckedRef.current = true;

      if (!corsReady) {
        console.info(
          `FIERAMIX SOUND: bypass en ${currentStation.name}. El stream no confirmó compatibilidad CORS para Web Audio.`,
        );
        setFieramixSoundStatus("bypass");
        return false;
      }

      // Debe establecerse antes de cargar el stream en el elemento de audio.
      audio.crossOrigin = "anonymous";

      const graph = createFieramixSoundGraph(audio);

      if (!graph) {
        setFieramixSoundStatus("bypass");
        return false;
      }

      fieramixSoundGraphRef.current = graph;
      applyFieramixSoundProfile(graph, currentStation);

      try {
        await graph.context.resume();
      } catch {
        // El navegador puede completar la activación al ejecutar audio.play().
      }

      const profileActive = hasFieramixSoundProfile(currentStation);
      setFieramixSoundStatus(profileActive ? "active" : "idle");

      if (profileActive) {
        console.info(`FIERAMIX SOUND: ${currentStation.name} activo.`);
      }

      return true;
    })();

    try {
      return await fieramixSoundInitPromiseRef.current;
    } finally {
      fieramixSoundInitPromiseRef.current = null;
    }
  }

  async function togglePlayback() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (!audio.paused) {
      audio.pause();
      setPlaying(false);
      return;
    }

    setLoading(true);

    try {
      if (
        hasFieramixSoundProfile(currentStation) ||
        fieramixSoundGraphRef.current
      ) {
        await ensureFieramixSound();
      }

      const graph = fieramixSoundGraphRef.current;

      if (graph) {
        audio.crossOrigin = "anonymous";
        applyFieramixSoundProfile(graph, currentStation);

        if (graph.context.state === "suspended") {
          try {
            await graph.context.resume();
          } catch {
            // audio.play() mantiene la autoridad sobre la reproducción.
          }
        }
      }

      if (audio.src !== currentStation.streamUrl) {
        audio.src = currentStation.streamUrl;
        audio.load();
      }

      await audio.play();
      setPlaying(true);
    } catch (error) {
      console.error(
        `No se pudo iniciar la reproducción de ${currentStation.name}:`,
        error,
      );
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }

  async function shareStation() {
    const shareData = {
      title: currentStation.name,
      text: `Escucha ${currentStation.name} en EL GRUPO FIERAMIX.COM`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main
      className={styles.page}
      style={{ "--station-accent": currentStation.accent } as React.CSSProperties}
    >
      <div className={styles.background} />

      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <img src="/logos/grupo-fieramix.png" alt="" />
          <span>
            <strong>EL GRUPO FIERAMIX.COM</strong>
            <small>LA RED LATINA QUE MUEVE AL MUNDO</small>
          </span>
        </Link>

        <nav>
          <Link href="/">Inicio</Link>
          <Link href="/#emisoras">Emisoras</Link>
          <Link href="/#solicita">Solicita tu canción</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.identity}>
          <div className={styles.liveBadge}>
            <i /> TRANSMISIÓN EN VIVO
          </div>

          <img
            className={styles.stationLogo}
            src={currentStation.logo}
            alt={currentStation.name}
          />

          <span className={styles.genre}>{currentStation.genre}</span>
          <h1>
            {currentStation.name.startsWith("SOLO MÚSICA ") ? (
              <>
                SOLO
                <br />
                MÚSICA
                <br />
                {currentStation.name.replace("SOLO MÚSICA ", "")}
              </>
            ) : (
              currentStation.name
            )}
          </h1>
          <p className={styles.slogan}>{currentStation.slogan}</p>
          <p className={styles.description}>{currentStation.description}</p>

          <div className={styles.actions}>
            <button className={styles.primaryButton} onClick={togglePlayback}>
              {loading ? "CONECTANDO…" : playing ? "❚❚ PAUSAR" : "▶ ESCUCHAR"}
            </button>

            <button className={styles.secondaryButton} onClick={shareStation}>
              {copied ? "ENLACE COPIADO" : "COMPARTIR"}
            </button>
          </div>
        </div>

        <article className={styles.player}>
          <div className={styles.playerTop}>
            <span>SONANDO AHORA</span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {soundBadge ? (
                <span
                  title="Procesamiento FIERAMIX SOUND en el reproductor web"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "5px 9px",
                    borderRadius: "999px",
                    border: `1px solid ${soundBadge.border}`,
                    background: soundBadge.background,
                    color: soundBadge.text,
                    boxShadow: `0 0 18px ${soundBadge.glow}`,
                    fontSize: ".56rem",
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: ".06em",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "999px",
                      background: soundBadge.dot,
                      boxShadow: `0 0 10px ${soundBadge.dot}`,
                      flex: "0 0 auto",
                    }}
                  />
                  {soundBadge.label}
                </span>
              ) : null}

              <b>{metadata.listeners ?? "—"} oyentes</b>
            </div>
          </div>

          <div className={styles.artworkShell}>
            <img
              src={metadata.artwork || currentStation.logo}
              alt={`${metadata.title} — ${metadata.artist}`}
            />

            <div className={playing ? styles.equalizerActive : styles.equalizer}>
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>

          <h2>{metadata.title}</h2>
          <h3>{metadata.artist}</h3>

          <div className={styles.controls}>
            <button onClick={togglePlayback}>
              {loading ? "•••" : playing ? "❚❚" : "▶"}
            </button>
          </div>

          <div className={styles.volume}>
            <span>🔊</span>
            <input
              aria-label="Volumen"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
            />
          </div>
        </article>
      </section>

      <section className={styles.details}>
        <article>
          <span>SEÑAL DIGITAL</span>
          <h2>Radio latina sin fronteras</h2>
          <p>
            Disfruta de {currentStation.name} las 24 horas desde cualquier dispositivo.
            La canción, el artista y la audiencia se actualizan directamente
            desde RadioBOSS Cloud.
          </p>
        </article>

        <div className={styles.features}>
          <div>
            <b>24/7</b>
            <span>Transmisión continua</span>
          </div>
          <div>
            <b>HD</b>
            <span>Audio de alta calidad</span>
          </div>
          <div>
            <b>{metadata.listeners ?? "—"}</b>
            <span>Oyentes en vivo</span>
          </div>
        </div>
      </section>

      <section className={styles.otherStations}>
        <div>
          <span>EXPLORA LA RED</span>
          <h2>También puedes escuchar</h2>
        </div>

        <div className={styles.stationRail}>
          {stations
            .filter((item) => item.id !== currentStation.id)
            .map((item) => (
              <Link href={getStationPath(item.id)} key={item.id}>
                <img src={item.logo} alt="" />
                <span>
                  <b>{item.name}</b>
                  <small>{item.genre}</small>
                </span>
              </Link>
            ))}
        </div>
      </section>

      {currentStation.rankingEligible !== false ? (
        <SongRequest
          initialStationId={currentStation.id as RequestStationId}
          locked
        />
      ) : null}

      <footer className={styles.footer}>
        <span>© 2026 EL GRUPO FIERAMIX.COM</span>
        <Link href="/">Volver al portal principal</Link>
      </footer>

      <audio
        ref={audioRef}
        preload="none"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      <SupportPrompt playing={playing} stationName={currentStation.name} />
    </main>
  );
}
