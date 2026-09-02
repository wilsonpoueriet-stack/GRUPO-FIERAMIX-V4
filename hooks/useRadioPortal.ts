"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { stationEngine } from "@/core/StationEngine";
import type { Station, StationId } from "@/types/station";
import type {
  HistoryItem,
  NowPlaying,
  NowPlayingResult,
  RecentTrack,
} from "@/types/radio";

const portalStations = [...stationEngine.getStations()];

type RadioBossAllItem = {
  id: string;
  success: boolean;
  title?: string;
  artist?: string;
  artwork?: string;
  listeners?: number | null;
  live?: boolean;
  autodj?: boolean;
  nexttrack?: string;
  nexttrack_artist?: string;
  recent?: RecentTrack[];
  error?: string;
};

export type FieramixSoundStatus =
  | "idle"
  | "checking"
  | "active"
  | "bypass";

export type FieramixSoundGraph = {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  lowShelf: BiquadFilterNode;
  lowMidClean: BiquadFilterNode;
  presence: BiquadFilterNode;
  air: BiquadFilterNode;
  splitter: ChannelSplitterNode;
  leftToLeft: GainNode;
  rightToLeft: GainNode;
  leftToRight: GainNode;
  rightToRight: GainNode;
  merger: ChannelMergerNode;
  limiter: DynamicsCompressorNode;
  master: GainNode;
};

const FIERAMIX_SOUND_CORS_TIMEOUT = 2_500;

const FIERAMIX_PLAYER_MEMORY_KEY =
  "fieramix:player-memory:v1";

type FieramixPlayerMemory = {
  stationId: string;
  volume: number;
  resumeOnReturn: boolean;
};

function clampPlayerVolume(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export const emptyNowPlaying = (station: Station): NowPlaying => ({
  title: "Programación en vivo",
  artist: station.name,
  artwork: station.logo,
  listeners: null,
  configured: false,
  recent: [],
});

function createInitialMetadata(): Partial<
  Record<StationId, NowPlayingResult>
> {
  return Object.fromEntries(
    portalStations.map((station) => [
      station.id,
      {
        ...emptyNowPlaying(station),
        source: "fallback",
        status: "not-configured",
        recent: [],
      },
    ]),
  ) as Partial<Record<StationId, NowPlayingResult>>;
}

function normalizeStationText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isBachataStation(station: Station): boolean {
  const fingerprint = normalizeStationText(
    `${station.id} ${station.name}`,
  );

  return fingerprint.includes("bachata");
}

function isMerengueStation(station: Station): boolean {
  const fingerprint = normalizeStationText(
    `${station.id} ${station.name}`,
  );

  return fingerprint.includes("merengue");
}

function isSalsaStation(station: Station): boolean {
  const fingerprint = normalizeStationText(
    `${station.id} ${station.name}`,
  );

  return fingerprint.includes("salsa");
}

function isBaladasStation(station: Station): boolean {
  const fingerprint = normalizeStationText(
    `${station.id} ${station.name}`,
  );

  return (
    fingerprint.includes("balada") ||
    fingerprint.includes("romantica")
  );
}

function isUrbanaStation(station: Station): boolean {
  const fingerprint = normalizeStationText(
    `${station.id} ${station.name}`,
  );

  return (
    fingerprint.includes("urbana") ||
    fingerprint.includes("reggaeton")
  );
}

function isRancherasStation(station: Station): boolean {
  const fingerprint = normalizeStationText(
    `${station.id} ${station.name}`,
  );

  return (
    fingerprint.includes("ranchera") ||
    fingerprint.includes("mexicana")
  );
}

function isInternacionalStation(station: Station): boolean {
  const fingerprint = normalizeStationText(
    `${station.id} ${station.name}`,
  );

  return (
    fingerprint.includes("internacional") ||
    fingerprint.includes("americana")
  );
}

function isCristianaStation(station: Station): boolean {
  const fingerprint = normalizeStationText(
    `${station.id} ${station.name}`,
  );

  return (
    fingerprint.includes("cristiana") ||
    fingerprint.includes("cristiano")
  );
}

function isFieramixStation(station: Station): boolean {
  const stationId = normalizeStationText(String(station.id)).trim();
  const stationName = normalizeStationText(station.name).trim();

  return stationId === "fieramix" || stationName === "fieramix";
}

function isRadioAhoraStation(station: Station): boolean {
  const fingerprint = normalizeStationText(
    `${station.id} ${station.name}`,
  );

  return (
    fingerprint.includes("radio ahora") ||
    fingerprint === "ahora" ||
    fingerprint.includes(" ahora ")
  );
}

function isExternalGuestStation(station: Station): boolean {
  return station.rankingEligible === false && !isRadioAhoraStation(station);
}

export function hasFieramixSoundProfile(
  station: Station,
): boolean {
  return (
    isBachataStation(station) ||
    isMerengueStation(station) ||
    isSalsaStation(station) ||
    isBaladasStation(station) ||
    isUrbanaStation(station) ||
    isRancherasStation(station) ||
    isInternacionalStation(station) ||
    isCristianaStation(station) ||
    isFieramixStation(station) ||
    isRadioAhoraStation(station) ||
    isExternalGuestStation(station)
  );
}

function setParam(
  context: AudioContext,
  param: AudioParam,
  value: number,
  timeConstant = 0.035,
) {
  const now = context.currentTime;

  param.cancelScheduledValues(now);
  param.setTargetAtTime(value, now, timeConstant);
}

function setStereoWidth(
  graph: FieramixSoundGraph,
  width: number,
) {
  const safeWidth = Math.min(Math.max(width, 0), 1.18);

  // Matriz Mid/Side simplificada:
  // L' = A·L + B·R
  // R' = B·L + A·R
  // Con A + B = 1, el contenido central permanece estable.
  const directGain = (1 + safeWidth) / 2;
  const crossGain = (1 - safeWidth) / 2;

  setParam(
    graph.context,
    graph.leftToLeft.gain,
    directGain,
  );
  setParam(
    graph.context,
    graph.rightToRight.gain,
    directGain,
  );
  setParam(
    graph.context,
    graph.rightToLeft.gain,
    crossGain,
  );
  setParam(
    graph.context,
    graph.leftToRight.gain,
    crossGain,
  );
}

export function applyFieramixSoundProfile(
  graph: FieramixSoundGraph,
  station: Station,
) {
  const bachata = isBachataStation(station);
  const merengue = isMerengueStation(station);

  if (bachata) {
    // FIERAMIX SOUND WEB — SOLO BACHATA V2 / PROFUNDIDAD
    // Perfil aprobado: limpio, agradable y con profundidad moderada.

    setParam(
      graph.context,
      graph.lowShelf.frequency,
      90,
    );
    setParam(
      graph.context,
      graph.lowShelf.gain,
      0.75,
    );

    setParam(
      graph.context,
      graph.lowMidClean.frequency,
      285,
    );
    setParam(
      graph.context,
      graph.lowMidClean.Q,
      0.78,
    );
    setParam(
      graph.context,
      graph.lowMidClean.gain,
      -0.45,
    );

    setParam(
      graph.context,
      graph.presence.frequency,
      3_200,
    );
    setParam(
      graph.context,
      graph.presence.Q,
      0.7,
    );
    setParam(
      graph.context,
      graph.presence.gain,
      0.5,
    );

    setParam(
      graph.context,
      graph.air.frequency,
      9_500,
    );
    setParam(
      graph.context,
      graph.air.gain,
      0.35,
    );

    setStereoWidth(graph, 1.10);

    setParam(
      graph.context,
      graph.limiter.threshold,
      -2.2,
    );
    setParam(
      graph.context,
      graph.limiter.knee,
      0,
    );
    setParam(
      graph.context,
      graph.limiter.ratio,
      12,
    );
    setParam(
      graph.context,
      graph.limiter.attack,
      0.003,
    );
    setParam(
      graph.context,
      graph.limiter.release,
      0.12,
    );

    setParam(
      graph.context,
      graph.master.gain,
      0.96,
    );

    return;
  }

  if (merengue) {
    // FIERAMIX SOUND WEB — SOLO MERENGUE V1 / ENERGÍA
    // Más ataque y definición, sin añadir compresión pesada.
    // La tambora y el bajo ganan firmeza; metales, güira y voz
    // conservan presencia sin volverse agresivos.

    setParam(
      graph.context,
      graph.lowShelf.frequency,
      82,
    );
    setParam(
      graph.context,
      graph.lowShelf.gain,
      0.6,
    );

    setParam(
      graph.context,
      graph.lowMidClean.frequency,
      310,
    );
    setParam(
      graph.context,
      graph.lowMidClean.Q,
      0.82,
    );
    setParam(
      graph.context,
      graph.lowMidClean.gain,
      -0.6,
    );

    setParam(
      graph.context,
      graph.presence.frequency,
      3_450,
    );
    setParam(
      graph.context,
      graph.presence.Q,
      0.72,
    );
    setParam(
      graph.context,
      graph.presence.gain,
      0.65,
    );

    setParam(
      graph.context,
      graph.air.frequency,
      9_800,
    );
    setParam(
      graph.context,
      graph.air.gain,
      0.4,
    );

    // Merengue necesita amplitud, pero el centro rítmico
    // debe permanecer firme.
    setStereoWidth(graph, 1.09);

    // Protección de picos: ligeramente más rápida que bachata
    // para metales, tambora y transitorios de percusión.
    setParam(
      graph.context,
      graph.limiter.threshold,
      -2.4,
    );
    setParam(
      graph.context,
      graph.limiter.knee,
      0,
    );
    setParam(
      graph.context,
      graph.limiter.ratio,
      12,
    );
    setParam(
      graph.context,
      graph.limiter.attack,
      0.0025,
    );
    setParam(
      graph.context,
      graph.limiter.release,
      0.1,
    );

    setParam(
      graph.context,
      graph.master.gain,
      0.955,
    );

    return;
  }

  if (isSalsaStation(station)) {
    // FIERAMIX SOUND WEB — SOLO SALSA V1 / PRESENCIA
    // Objetivo: conga y timbal definidos, piano con cuerpo,
    // metales abiertos y voz clara, sin fatiga.

    setParam(
      graph.context,
      graph.lowShelf.frequency,
      88,
    );
    setParam(
      graph.context,
      graph.lowShelf.gain,
      0.5,
    );

    setParam(
      graph.context,
      graph.lowMidClean.frequency,
      300,
    );
    setParam(
      graph.context,
      graph.lowMidClean.Q,
      0.8,
    );
    setParam(
      graph.context,
      graph.lowMidClean.gain,
      -0.5,
    );

    setParam(
      graph.context,
      graph.presence.frequency,
      3_050,
    );
    setParam(
      graph.context,
      graph.presence.Q,
      0.7,
    );
    setParam(
      graph.context,
      graph.presence.gain,
      0.55,
    );

    setParam(
      graph.context,
      graph.air.frequency,
      9_300,
    );
    setParam(
      graph.context,
      graph.air.gain,
      0.35,
    );

    // Un poco más de apertura que merengue para piano,
    // metales y percusión lateral, manteniendo el centro firme.
    setStereoWidth(graph, 1.10);

    // Protección rápida para timbal, campana y metales.
    setParam(
      graph.context,
      graph.limiter.threshold,
      -2.3,
    );
    setParam(
      graph.context,
      graph.limiter.knee,
      0,
    );
    setParam(
      graph.context,
      graph.limiter.ratio,
      12,
    );
    setParam(
      graph.context,
      graph.limiter.attack,
      0.0028,
    );
    setParam(
      graph.context,
      graph.limiter.release,
      0.11,
    );

    setParam(
      graph.context,
      graph.master.gain,
      0.96,
    );

    return;
  }

  if (isBaladasStation(station)) {
    // FIERAMIX SOUND WEB — SOLO BALADAS V1 / CALIDEZ
    // Objetivo: voz íntima y centrada, graves suaves,
    // medios limpios y una escena amplia sin sonar artificial.

    setParam(
      graph.context,
      graph.lowShelf.frequency,
      95,
    );
    setParam(
      graph.context,
      graph.lowShelf.gain,
      0.35,
    );

    setParam(
      graph.context,
      graph.lowMidClean.frequency,
      270,
    );
    setParam(
      graph.context,
      graph.lowMidClean.Q,
      0.72,
    );
    setParam(
      graph.context,
      graph.lowMidClean.gain,
      -0.25,
    );

    setParam(
      graph.context,
      graph.presence.frequency,
      2_750,
    );
    setParam(
      graph.context,
      graph.presence.Q,
      0.66,
    );
    setParam(
      graph.context,
      graph.presence.gain,
      0.3,
    );

    setParam(
      graph.context,
      graph.air.frequency,
      10_000,
    );
    setParam(
      graph.context,
      graph.air.gain,
      0.45,
    );

    // Apertura algo mayor para cuerdas, teclados y ambientes,
    // manteniendo la voz firme en el centro.
    setStereoWidth(graph, 1.11);

    // Limitación relajada: protege picos sin quitar respiración
    // ni aplastar las dinámicas de las baladas.
    setParam(
      graph.context,
      graph.limiter.threshold,
      -1.9,
    );
    setParam(
      graph.context,
      graph.limiter.knee,
      0,
    );
    setParam(
      graph.context,
      graph.limiter.ratio,
      10,
    );
    setParam(
      graph.context,
      graph.limiter.attack,
      0.006,
    );
    setParam(
      graph.context,
      graph.limiter.release,
      0.16,
    );

    setParam(
      graph.context,
      graph.master.gain,
      0.97,
    );

    return;
  }

  if (isUrbanaStation(station)) {
    // FIERAMIX SOUND WEB — SOLO REGGAETON / LA URBANA V1
    // Objetivo: subgrave sólido, kick definido, voz al frente,
    // medios despejados y amplitud moderna sin fatiga.

    setParam(
      graph.context,
      graph.lowShelf.frequency,
      72,
    );
    setParam(
      graph.context,
      graph.lowShelf.gain,
      0.85,
    );

    setParam(
      graph.context,
      graph.lowMidClean.frequency,
      260,
    );
    setParam(
      graph.context,
      graph.lowMidClean.Q,
      0.85,
    );
    setParam(
      graph.context,
      graph.lowMidClean.gain,
      -0.7,
    );

    setParam(
      graph.context,
      graph.presence.frequency,
      2_900,
    );
    setParam(
      graph.context,
      graph.presence.Q,
      0.72,
    );
    setParam(
      graph.context,
      graph.presence.gain,
      0.5,
    );

    setParam(
      graph.context,
      graph.air.frequency,
      9_800,
    );
    setParam(
      graph.context,
      graph.air.gain,
      0.3,
    );

    // Un poco de amplitud, pero sin descentrar kick,
    // bajo ni voz principal.
    setStereoWidth(graph, 1.09);

    // Limitador rápido para kick, 808 y transitorios urbanos.
    setParam(
      graph.context,
      graph.limiter.threshold,
      -2.6,
    );
    setParam(
      graph.context,
      graph.limiter.knee,
      0,
    );
    setParam(
      graph.context,
      graph.limiter.ratio,
      14,
    );
    setParam(
      graph.context,
      graph.limiter.attack,
      0.002,
    );
    setParam(
      graph.context,
      graph.limiter.release,
      0.09,
    );

    setParam(
      graph.context,
      graph.master.gain,
      0.95,
    );

    return;
  }

  if (isRancherasStation(station)) {
    // FIERAMIX SOUND WEB — SOLO RANCHERAS / LA MEXICANA V1
    // Objetivo: voz grande y natural, cuerdas definidas,
    // trompetas abiertas y graves firmes sin dureza.

    setParam(
      graph.context,
      graph.lowShelf.frequency,
      92,
    );
    setParam(
      graph.context,
      graph.lowShelf.gain,
      0.45,
    );

    setParam(
      graph.context,
      graph.lowMidClean.frequency,
      295,
    );
    setParam(
      graph.context,
      graph.lowMidClean.Q,
      0.76,
    );
    setParam(
      graph.context,
      graph.lowMidClean.gain,
      -0.35,
    );

    setParam(
      graph.context,
      graph.presence.frequency,
      3_100,
    );
    setParam(
      graph.context,
      graph.presence.Q,
      0.68,
    );
    setParam(
      graph.context,
      graph.presence.gain,
      0.45,
    );

    setParam(
      graph.context,
      graph.air.frequency,
      9_600,
    );
    setParam(
      graph.context,
      graph.air.gain,
      0.3,
    );

    // Apertura moderada para guitarras, vihuela y trompetas,
    // conservando la voz principal firmemente centrada.
    setStereoWidth(graph, 1.09);

    // Protección suave de picos para trompetas y ataques de cuerda.
    setParam(
      graph.context,
      graph.limiter.threshold,
      -2.1,
    );
    setParam(
      graph.context,
      graph.limiter.knee,
      0,
    );
    setParam(
      graph.context,
      graph.limiter.ratio,
      11,
    );
    setParam(
      graph.context,
      graph.limiter.attack,
      0.0035,
    );
    setParam(
      graph.context,
      graph.limiter.release,
      0.13,
    );

    setParam(
      graph.context,
      graph.master.gain,
      0.965,
    );

    return;
  }

  if (isInternacionalStation(station)) {
    // FIERAMIX SOUND WEB — SOLO INTERNACIONAL / LA AMERICANA V1
    // Objetivo: sonido amplio, refinado y versátil para pop,
    // rock suave, baladas internacionales y clásicos.

    setParam(
      graph.context,
      graph.lowShelf.frequency,
      88,
    );
    setParam(
      graph.context,
      graph.lowShelf.gain,
      0.4,
    );

    setParam(
      graph.context,
      graph.lowMidClean.frequency,
      285,
    );
    setParam(
      graph.context,
      graph.lowMidClean.Q,
      0.74,
    );
    setParam(
      graph.context,
      graph.lowMidClean.gain,
      -0.4,
    );

    setParam(
      graph.context,
      graph.presence.frequency,
      3_000,
    );
    setParam(
      graph.context,
      graph.presence.Q,
      0.68,
    );
    setParam(
      graph.context,
      graph.presence.gain,
      0.4,
    );

    setParam(
      graph.context,
      graph.air.frequency,
      10_200,
    );
    setParam(
      graph.context,
      graph.air.gain,
      0.45,
    );

    // Escena algo más abierta para producciones internacionales,
    // pero manteniendo voz y bajo firmes en el centro.
    setStereoWidth(graph, 1.12);

    // Protección transparente de picos para material muy variado.
    setParam(
      graph.context,
      graph.limiter.threshold,
      -2.0,
    );
    setParam(
      graph.context,
      graph.limiter.knee,
      0,
    );
    setParam(
      graph.context,
      graph.limiter.ratio,
      10,
    );
    setParam(
      graph.context,
      graph.limiter.attack,
      0.004,
    );
    setParam(
      graph.context,
      graph.limiter.release,
      0.14,
    );

    setParam(
      graph.context,
      graph.master.gain,
      0.965,
    );

    return;
  }

  if (isCristianaStation(station)) {
    // FIERAMIX SOUND WEB — SOLO CRISTIANA V1 / PROFUNDIDAD
    // Objetivo: voz emotiva y clara, piano y guitarras con aire,
    // coros amplios y graves suaves sin comprimir en exceso.

    setParam(
      graph.context,
      graph.lowShelf.frequency,
      90,
    );
    setParam(
      graph.context,
      graph.lowShelf.gain,
      0.35,
    );

    setParam(
      graph.context,
      graph.lowMidClean.frequency,
      280,
    );
    setParam(
      graph.context,
      graph.lowMidClean.Q,
      0.72,
    );
    setParam(
      graph.context,
      graph.lowMidClean.gain,
      -0.3,
    );

    setParam(
      graph.context,
      graph.presence.frequency,
      2_850,
    );
    setParam(
      graph.context,
      graph.presence.Q,
      0.66,
    );
    setParam(
      graph.context,
      graph.presence.gain,
      0.35,
    );

    setParam(
      graph.context,
      graph.air.frequency,
      10_000,
    );
    setParam(
      graph.context,
      graph.air.gain,
      0.4,
    );

    // Coros y ambientes ligeramente más abiertos,
    // mientras voz y graves permanecen firmes en el centro.
    setStereoWidth(graph, 1.10);

    // Limitación relajada para conservar respiración y dinámica.
    setParam(
      graph.context,
      graph.limiter.threshold,
      -1.8,
    );
    setParam(
      graph.context,
      graph.limiter.knee,
      0,
    );
    setParam(
      graph.context,
      graph.limiter.ratio,
      9,
    );
    setParam(
      graph.context,
      graph.limiter.attack,
      0.006,
    );
    setParam(
      graph.context,
      graph.limiter.release,
      0.16,
    );

    setParam(
      graph.context,
      graph.master.gain,
      0.97,
    );

    return;
  }

  if (isFieramixStation(station)) {
    // FIERAMIX SOUND WEB — FIERAMIX V1 / IMPACTO
    // Perfil generalista y dinámico para mezcla de ritmos latinos.
    // Busca pegada, presencia y amplitud sin favorecer un solo género.

    setParam(
      graph.context,
      graph.lowShelf.frequency,
      84,
    );
    setParam(
      graph.context,
      graph.lowShelf.gain,
      0.65,
    );

    setParam(
      graph.context,
      graph.lowMidClean.frequency,
      290,
    );
    setParam(
      graph.context,
      graph.lowMidClean.Q,
      0.8,
    );
    setParam(
      graph.context,
      graph.lowMidClean.gain,
      -0.5,
    );

    setParam(
      graph.context,
      graph.presence.frequency,
      3_150,
    );
    setParam(
      graph.context,
      graph.presence.Q,
      0.7,
    );
    setParam(
      graph.context,
      graph.presence.gain,
      0.55,
    );

    setParam(
      graph.context,
      graph.air.frequency,
      9_900,
    );
    setParam(
      graph.context,
      graph.air.gain,
      0.38,
    );

    // Apertura moderada para una sensación de red grande,
    // manteniendo voz, bajo y pegada firmes en el centro.
    setStereoWidth(graph, 1.10);

    // Protección versátil para percusión, metales, voces y graves
    // de material musical muy variado.
    setParam(
      graph.context,
      graph.limiter.threshold,
      -2.3,
    );
    setParam(
      graph.context,
      graph.limiter.knee,
      0,
    );
    setParam(
      graph.context,
      graph.limiter.ratio,
      12,
    );
    setParam(
      graph.context,
      graph.limiter.attack,
      0.0028,
    );
    setParam(
      graph.context,
      graph.limiter.release,
      0.11,
    );

    setParam(
      graph.context,
      graph.master.gain,
      0.96,
    );

    return;
  }

  if (isRadioAhoraStation(station)) {
    // FIERAMIX SOUND WEB — RADIO AHORA V1 / CLARIDAD
    // Objetivo: máxima inteligibilidad de voz, cuerpo natural,
    // graves controlados y presencia informativa sin dureza.

    setParam(
      graph.context,
      graph.lowShelf.frequency,
      105,
    );
    setParam(
      graph.context,
      graph.lowShelf.gain,
      0.15,
    );

    setParam(
      graph.context,
      graph.lowMidClean.frequency,
      300,
    );
    setParam(
      graph.context,
      graph.lowMidClean.Q,
      0.82,
    );
    setParam(
      graph.context,
      graph.lowMidClean.gain,
      -0.65,
    );

    setParam(
      graph.context,
      graph.presence.frequency,
      2_650,
    );
    setParam(
      graph.context,
      graph.presence.Q,
      0.72,
    );
    setParam(
      graph.context,
      graph.presence.gain,
      0.7,
    );

    setParam(
      graph.context,
      graph.air.frequency,
      9_200,
    );
    setParam(
      graph.context,
      graph.air.gain,
      0.2,
    );

    // Para locución y noticias mantenemos el centro muy firme.
    // Solo una apertura mínima para camas, jingles y música.
    setStereoWidth(graph, 1.04);

    // Protección rápida de picos de voz y elementos de producción,
    // sin comprimir de forma audible el contenido hablado.
    setParam(
      graph.context,
      graph.limiter.threshold,
      -2.0,
    );
    setParam(
      graph.context,
      graph.limiter.knee,
      0,
    );
    setParam(
      graph.context,
      graph.limiter.ratio,
      10,
    );
    setParam(
      graph.context,
      graph.limiter.attack,
      0.003,
    );
    setParam(
      graph.context,
      graph.limiter.release,
      0.12,
    );

    setParam(
      graph.context,
      graph.master.gain,
      0.97,
    );

    return;
  }

  if (isExternalGuestStation(station)) {
    // FIERAMIX SOUND WEB — EMISORAS INVITADAS V1 / POTENCIA
    // Perfil equilibrado para señales externas: más cuerpo y presencia,
    // con control de picos para conservar claridad sin saturación.
    setParam(graph.context, graph.lowShelf.frequency, 95);
    setParam(graph.context, graph.lowShelf.gain, 0.9);

    setParam(graph.context, graph.lowMidClean.frequency, 315);
    setParam(graph.context, graph.lowMidClean.Q, 0.8);
    setParam(graph.context, graph.lowMidClean.gain, -0.45);

    setParam(graph.context, graph.presence.frequency, 2_750);
    setParam(graph.context, graph.presence.Q, 0.72);
    setParam(graph.context, graph.presence.gain, 0.55);

    setParam(graph.context, graph.air.frequency, 9_500);
    setParam(graph.context, graph.air.gain, 0.35);

    setStereoWidth(graph, 1.08);

    setParam(graph.context, graph.limiter.threshold, -1.5);
    setParam(graph.context, graph.limiter.knee, 0);
    setParam(graph.context, graph.limiter.ratio, 10);
    setParam(graph.context, graph.limiter.attack, 0.0028);
    setParam(graph.context, graph.limiter.release, 0.115);

    setParam(graph.context, graph.master.gain, 0.98);

    return;
  }

  // Las demás emisoras permanecen planas hasta recibir
  // su perfil FIERAMIX SOUND específico.
  setParam(graph.context, graph.lowShelf.gain, 0);
  setParam(graph.context, graph.lowMidClean.gain, 0);
  setParam(graph.context, graph.presence.gain, 0);
  setParam(graph.context, graph.air.gain, 0);

  setStereoWidth(graph, 1);

  setParam(
    graph.context,
    graph.limiter.threshold,
    0,
  );
  setParam(
    graph.context,
    graph.limiter.knee,
    0,
  );
  setParam(
    graph.context,
    graph.limiter.ratio,
    1,
  );

  setParam(
    graph.context,
    graph.master.gain,
    1,
  );
}

export async function streamAllowsWebAudio(
  streamUrl: string,
): Promise<boolean> {
  const controller = new AbortController();

  const timeout = window.setTimeout(() => {
    controller.abort();
  }, FIERAMIX_SOUND_CORS_TIMEOUT);

  try {
    // HEAD evita descargar el audio. Si el servidor no permite
    // una petición CORS desde el portal, fetch rechazará la
    // promesa y FIERAMIX SOUND permanecerá en bypass.
    const response = await fetch(streamUrl, {
      method: "HEAD",
      mode: "cors",
      cache: "no-store",
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function allStreamsAllowWebAudio(): Promise<boolean> {
  const uniqueUrls = [
    ...new Set(
      portalStations
        .map((station) => station.streamUrl)
        .filter(Boolean),
    ),
  ];

  if (uniqueUrls.length === 0) {
    return false;
  }

  const results = await Promise.all(
    uniqueUrls.map(streamAllowsWebAudio),
  );

  return results.every(Boolean);
}

export function createFieramixSoundGraph(
  audio: HTMLAudioElement,
): FieramixSoundGraph | null {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextConstructor =
    window.AudioContext ??
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  try {
    const context = new AudioContextConstructor();

    const source =
      context.createMediaElementSource(audio);

    const lowShelf = context.createBiquadFilter();
    lowShelf.type = "lowshelf";
    lowShelf.frequency.value = 90;
    lowShelf.gain.value = 0;

    const lowMidClean = context.createBiquadFilter();
    lowMidClean.type = "peaking";
    lowMidClean.frequency.value = 285;
    lowMidClean.Q.value = 0.78;
    lowMidClean.gain.value = 0;

    const presence = context.createBiquadFilter();
    presence.type = "peaking";
    presence.frequency.value = 3_200;
    presence.Q.value = 0.7;
    presence.gain.value = 0;

    const air = context.createBiquadFilter();
    air.type = "highshelf";
    air.frequency.value = 9_500;
    air.gain.value = 0;

    const splitter = context.createChannelSplitter(2);

    const leftToLeft = context.createGain();
    const rightToLeft = context.createGain();
    const leftToRight = context.createGain();
    const rightToRight = context.createGain();

    const merger = context.createChannelMerger(2);

    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = 0;
    limiter.knee.value = 0;
    limiter.ratio.value = 1;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.12;

    const master = context.createGain();
    master.gain.value = 1;

    source.connect(lowShelf);
    lowShelf.connect(lowMidClean);
    lowMidClean.connect(presence);
    presence.connect(air);
    air.connect(splitter);

    splitter.connect(leftToLeft, 0);
    leftToLeft.connect(merger, 0, 0);

    splitter.connect(rightToLeft, 1);
    rightToLeft.connect(merger, 0, 0);

    splitter.connect(leftToRight, 0);
    leftToRight.connect(merger, 0, 1);

    splitter.connect(rightToRight, 1);
    rightToRight.connect(merger, 0, 1);

    merger.connect(limiter);
    limiter.connect(master);
    master.connect(context.destination);

    return {
      context,
      source,
      lowShelf,
      lowMidClean,
      presence,
      air,
      splitter,
      leftToLeft,
      rightToLeft,
      leftToRight,
      rightToRight,
      merger,
      limiter,
      master,
    };
  } catch (error) {
    console.warn(
      "FIERAMIX SOUND no pudo inicializar Web Audio. Se mantiene el audio directo.",
      error,
    );

    return null;
  }
}

export function useRadioPortal() {
  const audioRef = useRef<HTMLAudioElement>(null);

  const fieramixSoundGraphRef =
    useRef<FieramixSoundGraph | null>(null);

  const fieramixSoundInitPromiseRef =
    useRef<Promise<boolean> | null>(null);

  const fieramixSoundCheckedRef = useRef(false);
  const playbackMemoryRestoredRef = useRef(false);
  const autoplayAttemptedRef = useRef(false);

  const [fieramixSoundStatus, setFieramixSoundStatus] =
    useState<FieramixSoundStatus>("idle");

  const [selectedId, setSelectedId] = useState<StationId>(
    stationEngine.getDefaultStation().id,
  );

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [resumeOnReturn, setResumeOnReturn] = useState(false);
  const [playbackMemoryReady, setPlaybackMemoryReady] =
    useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [metadata, setMetadata] = useState<
    Partial<Record<StationId, NowPlayingResult>>
  >(createInitialMetadata);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const selected = useMemo(
    () => stationEngine.getStationOrDefault(selectedId),
    [selectedId],
  );

  const current =
    metadata[selected.id] ?? emptyNowPlaying(selected);

  const fieramixSoundActive =
    fieramixSoundStatus === "active" &&
    hasFieramixSoundProfile(selected);

  async function ensureFieramixSound(
    station: Station,
  ): Promise<boolean> {
    const audio = audioRef.current;

    if (!audio) {
      return false;
    }

    const existingGraph =
      fieramixSoundGraphRef.current;

    if (existingGraph) {
      applyFieramixSoundProfile(
        existingGraph,
        station,
      );

      if (existingGraph.context.state === "suspended") {
        try {
          await existingGraph.context.resume();
        } catch {
          // La reproducción normal continúa aunque el contexto
          // permanezca suspendido.
        }
      }

      setFieramixSoundStatus(
        hasFieramixSoundProfile(station)
          ? "active"
          : "idle",
      );

      return true;
    }

    if (fieramixSoundCheckedRef.current) {
      return false;
    }

    if (fieramixSoundInitPromiseRef.current) {
      return fieramixSoundInitPromiseRef.current;
    }

    fieramixSoundInitPromiseRef.current =
      (async () => {
        setFieramixSoundStatus("checking");

        const corsReady =
          await allStreamsAllowWebAudio();

        fieramixSoundCheckedRef.current = true;

        if (!corsReady) {
          console.info(
            "FIERAMIX SOUND: bypass automático. El servidor de streaming no confirmó compatibilidad CORS para Web Audio.",
          );
          setFieramixSoundStatus("bypass");
          return false;
        }

        // Debe establecerse antes de cargar el siguiente stream
        // que va a entrar en Web Audio.
        audio.crossOrigin = "anonymous";

        const graph =
          createFieramixSoundGraph(audio);

        if (!graph) {
          setFieramixSoundStatus("bypass");
          return false;
        }

        fieramixSoundGraphRef.current = graph;

        applyFieramixSoundProfile(graph, station);

        try {
          await graph.context.resume();
        } catch {
          // El navegador puede reanudar el contexto cuando el
          // usuario pulse reproducir.
        }

        const profileActive =
          hasFieramixSoundProfile(station);

        setFieramixSoundStatus(
          profileActive
            ? "active"
            : "idle",
        );

        if (profileActive) {
          console.info(
            `FIERAMIX SOUND: ${station.name} activo.`,
          );
        }

        return true;
      })();

    try {
      return await fieramixSoundInitPromiseRef.current;
    } finally {
      fieramixSoundInitPromiseRef.current = null;
    }
  }

  useEffect(() => {
    if (playbackMemoryRestoredRef.current) {
      return;
    }

    playbackMemoryRestoredRef.current = true;

    try {
      const rawMemory = window.localStorage.getItem(
        FIERAMIX_PLAYER_MEMORY_KEY,
      );

      if (rawMemory) {
        const memory = JSON.parse(
          rawMemory,
        ) as Partial<FieramixPlayerMemory>;

        const rememberedStation = portalStations.find(
          (station) =>
            String(station.id) === String(memory.stationId ?? ""),
        );

        if (rememberedStation) {
          setSelectedId(rememberedStation.id);
        }

        if (
          typeof memory.volume === "number" &&
          Number.isFinite(memory.volume)
        ) {
          setVolume(clampPlayerVolume(memory.volume));
        }

        setResumeOnReturn(memory.resumeOnReturn === true);
      }
    } catch (error) {
      console.warn(
        "No se pudo restaurar la memoria del reproductor FIERAMIX:",
        error,
      );
    } finally {
      setPlaybackMemoryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!playbackMemoryReady) {
      return;
    }

    try {
      const memory: FieramixPlayerMemory = {
        stationId: String(selected.id),
        volume: clampPlayerVolume(volume),
        resumeOnReturn,
      };

      window.localStorage.setItem(
        FIERAMIX_PLAYER_MEMORY_KEY,
        JSON.stringify(memory),
      );
    } catch (error) {
      console.warn(
        "No se pudo guardar la memoria del reproductor FIERAMIX:",
        error,
      );
    }
  }, [playbackMemoryReady, resumeOnReturn, selected.id, volume]);

  useEffect(() => {
    if (
      !playbackMemoryReady ||
      !resumeOnReturn ||
      autoplayAttemptedRef.current
    ) {
      return;
    }

    autoplayAttemptedRef.current = true;

    // Intentamos reanudar la última emisora escuchada.
    // Si el navegador bloquea autoplay con sonido, playStation
    // mantiene la emisora y el volumen restaurados, lista para PLAY.
    void playStation(selected);
  }, [playbackMemoryReady, resumeOnReturn, selected]);

  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const graph = fieramixSoundGraphRef.current;

    if (!graph) {
      return;
    }

    applyFieramixSoundProfile(graph, selected);

    setFieramixSoundStatus(
      hasFieramixSoundProfile(selected)
        ? "active"
        : "idle",
    );
  }, [selected]);

  useEffect(() => {
    return () => {
      const graph =
        fieramixSoundGraphRef.current;

      if (graph) {
        void graph.context.close();
        fieramixSoundGraphRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAllMetadata() {
      try {
        const response = await fetch("/api/now-playing-all", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`La API respondió ${response.status}`);
        }

        const items = (await response.json()) as RadioBossAllItem[];

        if (cancelled || !Array.isArray(items)) {
          return;
        }

        const nextMetadata = createInitialMetadata();

        for (const item of items) {
          const station = portalStations.find(
            (candidate) => candidate.id === item.id,
          );

          if (!station || item.success === false) {
            continue;
          }

          nextMetadata[station.id] = {
            title: item.title || "Programación en vivo",
            artist: item.artist || station.name,
            artwork: item.artwork || station.logo,
            listeners: item.listeners ?? null,
            configured: true,
            source: "radioboss",
            status: "ok",
            recent: item.recent ?? [],
          };
        }

        setMetadata(nextMetadata);

        const selectedItem = items.find(
          (item) => item.id === selectedId && item.success,
        );

        const selectedStation =
          stationEngine.getStationOrDefault(selectedId);

        const selectedHistory: HistoryItem[] = (
          selectedItem?.recent ?? []
        ).map((track) => ({
          title: track.title,
          artist: track.artist,
          artwork: track.artwork,
          listeners: null,
          configured: true,
          source: "radioboss",
          status: "ok",
          recent: [],
          stationId: selectedId,
          stamp: track.started
            ? new Date(track.started).toLocaleTimeString("es-DO", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        }));

        setHistory(
          selectedHistory.length > 0
            ? selectedHistory
            : [
                {
                  title: "Programación en vivo",
                  artist: selectedStation.name,
                  artwork: selectedStation.logo,
                  listeners: null,
                  configured: false,
                  source: "fallback",
                  status: "not-configured",
                  recent: [],
                  stationId: selectedId,
                  stamp: "",
                },
              ],
        );
      } catch (error) {
        console.error(
          "No se pudieron cargar las emisoras:",
          error,
        );
      }
    }

    void loadAllMetadata();

    const timer = window.setInterval(() => {
      void loadAllMetadata();
    }, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedId]);

  async function playStation(station: Station) {
    setSelectedId(station.id);

    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setLoading(true);

    try {
      if (
        hasFieramixSoundProfile(station) ||
        fieramixSoundGraphRef.current
      ) {
        await ensureFieramixSound(station);
      }

      const graph =
        fieramixSoundGraphRef.current;

      if (graph) {
        audio.crossOrigin = "anonymous";
        applyFieramixSoundProfile(graph, station);

        if (graph.context.state === "suspended") {
          try {
            await graph.context.resume();
          } catch {
            // La llamada audio.play() sigue siendo la autoridad
            // sobre el estado de reproducción.
          }
        }
      }

      if (audio.src !== station.streamUrl) {
        audio.src = station.streamUrl;
        audio.load();
      }

      await audio.play();
      setPlaying(true);
      setResumeOnReturn(true);
    } catch (error) {
      console.error(
        "No se pudo iniciar la reproducción:",
        error,
      );
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }

  async function togglePlayback() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (!audio.src) {
      await playStation(selected);
      return;
    }

    if (audio.paused) {
      setLoading(true);

      try {
        const graph =
          fieramixSoundGraphRef.current;

        if (graph) {
          applyFieramixSoundProfile(
            graph,
            selected,
          );

          if (graph.context.state === "suspended") {
            await graph.context.resume();
          }
        }

        await audio.play();
        setPlaying(true);
        setResumeOnReturn(true);
      } catch (error) {
        console.error(
          "No se pudo reanudar la reproducción:",
          error,
        );
        setPlaying(false);
      } finally {
        setLoading(false);
      }

      return;
    }

    audio.pause();
    setPlaying(false);
    setResumeOnReturn(false);
  }

  function moveStation(direction: number) {
    const next =
      direction >= 0
        ? stationEngine.getNextStation(selected.id)
        : stationEngine.getPreviousStation(selected.id);

    void playStation(next);
  }

  return {
    stations: portalStations,
    selected,
    current,
    metadata,
    history,
    playing,
    loading,
    volume,
    menuOpen,
    audioRef,
    setMenuOpen,
    setVolume,
    togglePlayback,
    playStation,
    moveStation,

    // Preparado para mostrar en una próxima etapa un indicador
    // visual "FIERAMIX SOUND" dentro del reproductor.
    fieramixSoundStatus,
    fieramixSoundActive,
  };
}
