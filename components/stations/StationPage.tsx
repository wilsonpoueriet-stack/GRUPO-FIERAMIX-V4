"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { stations } from "@/data/stations";
import type { NowPlaying } from "@/types/radio";
import styles from "./StationPage.module.css";

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

export default function StationPage() {
  const params = useParams<{ id: string }>();
  const stationId = Array.isArray(params.id) ? params.id[0] : params.id;

  const station = useMemo(
  () => stations.find((item) => item.id === stationId),
  [stationId],
);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [metadata, setMetadata] = useState<NowPlaying>(() =>
    fallback(stationId),
  );
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [copied, setCopied] = useState(false);

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

  if (!station) {
    return (
      <main className={styles.notFound}>
        <span>404</span>
        <h1>Emisora no encontrada</h1>
        <p>La señal solicitada no forma parte de GRUPO FIERAMIX.COM.</p>
        <Link href="/">Volver al portal</Link>
      </main>
    );
  }

  async function togglePlayback() {
    if (!station) {
      return;
    }

    const currentStation = station;
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (!audio.src) {
      audio.src = currentStation.streamUrl;
      audio.load();
    }

    if (audio.paused) {
      setLoading(true);

      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      } finally {
        setLoading(false);
      }

      return;
    }

    audio.pause();
    setPlaying(false);
  }

  async function shareStation() {
    if (!station) {
  return;
}

const currentStation = station;
    const shareData = {
      title: currentStation.name,
      text: `Escucha ${station.name} en GRUPO FIERAMIX.COM`,
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
      style={{ "--station-accent": station.accent } as React.CSSProperties}
    >
      <div className={styles.background} />

      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <img src="/logos/grupo-fieramix.png" alt="" />
          <span>
            <strong>GRUPO FIERAMIX.COM</strong>
            <small>La red latina que mueve el mundo</small>
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
            src={station.logo}
            alt={station.name}
          />

          <span className={styles.genre}>{station.genre}</span>
          <h1>{station.name}</h1>
          <p>{station.slogan}</p>

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
            <b>{metadata.listeners ?? "—"} oyentes</b>
          </div>

          <div className={styles.artworkShell}>
            <img
              src={metadata.artwork || station.logo}
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
            Disfruta de {station.name} las 24 horas desde cualquier dispositivo.
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
            .filter((item) => item.id !== station.id)
            .map((item) => (
              <Link href={`/emisoras/${item.id}`} key={item.id}>
                <img src={item.logo} alt="" />
                <span>
                  <b>{item.name}</b>
                  <small>{item.genre}</small>
                </span>
              </Link>
            ))}
        </div>
      </section>

      {station.id === "bachata" ? (
        <section className={styles.requestCallout}>
          <div>
            <span>SOLO BACHATA</span>
            <h2>¿Quieres elegir la próxima canción?</h2>
            <p>
              Usa nuestro buscador conectado a RadioBOSS y envía tu solicitud a
              la programación.
            </p>
          </div>
          <Link href="/#solicita">SOLICITAR CANCIÓN</Link>
        </section>
      ) : null}

      <footer className={styles.footer}>
        <span>© 2026 GRUPO FIERAMIX.COM</span>
        <Link href="/">Volver al portal principal</Link>
      </footer>

      <audio
        ref={audioRef}
        preload="none"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
    </main>
  );
}
