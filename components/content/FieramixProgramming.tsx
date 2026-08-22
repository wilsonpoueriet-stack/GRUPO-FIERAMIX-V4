"use client";

import { useEffect, useMemo, useState } from "react";

type StationId =
  | "fieramix"
  | "merengue"
  | "bachata"
  | "salsa"
  | "baladas"
  | "reggaeton"
  | "rancheras"
  | "internacional"
  | "cristiana";

type Slot = {
  title: string;
  detail: string;
  schedule: string;
  start: number;
  end: number;
};

type ProgramItem = {
  title: string;
  schedule: string;
  detail?: string;
};

type ProgramGroup = {
  title: string;
  description?: string;
  items: ProgramItem[];
};

type StationConfig = {
  id: StationId;
  name: string;
  intro: string;
  liveSchedule: (day: number) => Slot[];
  groups: ProgramGroup[];
  showNetworkCapsules?: boolean;
  showNationalAnthem?: boolean;
  newsTimes?: string[];
};

type LiveState = {
  current: Slot;
  next: Slot;
};

const dayIndex: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const universalDayparts: ProgramItem[] = [
  { title: "La Madrugada", schedule: "12:00 a. m. – 5:00 a. m." },
  { title: "El Amanecer", schedule: "5:00 a. m. – 7:00 a. m." },
  { title: "La Mañana", schedule: "7:00 a. m. – 12:00 p. m." },
  { title: "El Almuerzo", schedule: "12:00 p. m. – 2:00 p. m." },
  { title: "La Tarde", schedule: "2:00 p. m. – 5:00 p. m." },
  { title: "El Atardecer", schedule: "5:00 p. m. – 7:00 p. m." },
  { title: "La Noche", schedule: "7:00 p. m. – 12:00 a. m." },
];

const rotation = [
  "Éxitos actuales",
  "Recurrentes",
  "Clásicos",
  "TOP 05 — 5 canciones",
  "TOP 10 — 10 canciones",
  "TOP 25 — 15 canciones",
];

const networkCapsules = [
  "El Acertijo",
  "El Minuto de Finanzas",
  "Saludos VIP",
  "Conoce Tu País",
];

const mainNewsTimes = [
  "9:30 a. m.",
  "10:30 a. m.",
  "11:30 a. m.",
  "12:30 p. m.",
  "1:30 p. m.",
  "2:30 p. m.",
  "3:30 p. m.",
  "4:30 p. m.",
  "5:30 p. m.",
];

const twoHourNewsTimes = [
  "9:30 a. m.",
  "11:30 a. m.",
  "1:30 p. m.",
  "3:30 p. m.",
  "5:30 p. m.",
];

const commonDayparts: ProgramGroup = {
  title: "Franjas del día",
  description: "Las mismas franjas horarias se aplican en toda la red.",
  items: universalDayparts,
};

function minuteLabel(value: number): string {
  const normalized = value % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour24 < 12 ? "a. m." : "p. m.";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function rangeLabel(start: number, end: number): string {
  return `${minuteLabel(start)} – ${minuteLabel(end)}`;
}

function daypartName(start: number): string {
  if (start < 300) return "La Madrugada";
  if (start < 420) return "El Amanecer";
  if (start < 720) return "La Mañana";
  if (start < 840) return "El Almuerzo";
  if (start < 1020) return "La Tarde";
  if (start < 1140) return "El Atardecer";
  return "La Noche";
}

function genericSchedule(
  weekdayTitle: string,
  weekendTitle: string,
  detail: string,
): (day: number) => Slot[] {
  return (day: number) => {
    const weekend = day === 0 || day === 5 || day === 6;
    const title = weekend ? weekendTitle : weekdayTitle;
    const bounds = [0, 300, 420, 720, 840, 1020, 1140, 1440];

    return bounds.slice(0, -1).map((start, index) => {
      const end = bounds[index + 1];
      return {
        title,
        detail: `${daypartName(start)} · ${detail}`,
        schedule: rangeLabel(start, end),
        start,
        end,
      };
    });
  };
}

function fieramixBase(
  daypart: string,
  schedule: string,
  start: number,
  end: number,
  weekend: boolean,
): Slot {
  return {
    title: weekend ? "Fin de Semana Bravo" : "Programación regular",
    detail: `${daypart} · Merengue, bachata y salsa.`,
    schedule,
    start,
    end,
  };
}

function fieramixSchedule(day: number): Slot[] {
  if (day === 1) {
    return [
      fieramixBase("La Madrugada de FIERAMIX", "12:00 a. m. – 5:00 a. m.", 0, 300, false),
      fieramixBase("El Amanecer de FIERAMIX", "5:00 a. m. – 6:00 a. m.", 300, 360, false),
      { title: "Románticamente", detail: "Música romántica.", schedule: "6:00 a. m. – 8:00 a. m.", start: 360, end: 480 },
      fieramixBase("La Mañana de FIERAMIX", "8:00 a. m. – 12:00 p. m.", 480, 720, false),
      { title: "La Hora Cero", detail: "Música romántica.", schedule: "12:00 p. m. – 1:00 p. m.", start: 720, end: 780 },
      fieramixBase("El Almuerzo de FIERAMIX", "1:00 p. m. – 2:00 p. m.", 780, 840, false),
      fieramixBase("La Tarde de FIERAMIX", "2:00 p. m. – 5:00 p. m.", 840, 1020, false),
      fieramixBase("El Atardecer de FIERAMIX", "5:00 p. m. – 7:00 p. m.", 1020, 1140, false),
      fieramixBase("La Noche de FIERAMIX", "7:00 p. m. – 12:00 a. m.", 1140, 1440, false),
    ];
  }

  if (day >= 2 && day <= 4) {
    return [
      { title: "Íntimamente", detail: "Música romántica.", schedule: "12:00 a. m. – 2:00 a. m.", start: 0, end: 120 },
      fieramixBase("La Madrugada de FIERAMIX", "2:00 a. m. – 5:00 a. m.", 120, 300, false),
      fieramixBase("El Amanecer de FIERAMIX", "5:00 a. m. – 6:00 a. m.", 300, 360, false),
      { title: "Románticamente", detail: "Música romántica.", schedule: "6:00 a. m. – 8:00 a. m.", start: 360, end: 480 },
      fieramixBase("La Mañana de FIERAMIX", "8:00 a. m. – 12:00 p. m.", 480, 720, false),
      { title: "La Hora Cero", detail: "Música romántica.", schedule: "12:00 p. m. – 1:00 p. m.", start: 720, end: 780 },
      fieramixBase("El Almuerzo de FIERAMIX", "1:00 p. m. – 2:00 p. m.", 780, 840, false),
      fieramixBase("La Tarde de FIERAMIX", "2:00 p. m. – 5:00 p. m.", 840, 1020, false),
      fieramixBase("El Atardecer de FIERAMIX", "5:00 p. m. – 7:00 p. m.", 1020, 1140, false),
      fieramixBase("La Noche de FIERAMIX", "7:00 p. m. – 12:00 a. m.", 1140, 1440, false),
    ];
  }

  if (day === 5) {
    return [
      { title: "Íntimamente", detail: "Música romántica.", schedule: "12:00 a. m. – 2:00 a. m.", start: 0, end: 120 },
      fieramixBase("La Madrugada de FIERAMIX", "2:00 a. m. – 5:00 a. m.", 120, 300, true),
      fieramixBase("El Amanecer de FIERAMIX", "5:00 a. m. – 7:00 a. m.", 300, 420, true),
      fieramixBase("La Mañana de FIERAMIX", "7:00 a. m. – 12:00 p. m.", 420, 720, true),
      fieramixBase("El Almuerzo de FIERAMIX", "12:00 p. m. – 2:00 p. m.", 720, 840, true),
      fieramixBase("La Tarde de FIERAMIX", "2:00 p. m. – 5:00 p. m.", 840, 1020, true),
      fieramixBase("El Atardecer de FIERAMIX", "5:00 p. m. – 7:00 p. m.", 1020, 1140, true),
      fieramixBase("La Noche de FIERAMIX", "7:00 p. m. – 12:00 a. m.", 1140, 1440, true),
    ];
  }

  if (day === 6) {
    return [
      fieramixBase("La Madrugada de FIERAMIX", "12:00 a. m. – 5:00 a. m.", 0, 300, true),
      fieramixBase("El Amanecer de FIERAMIX", "5:00 a. m. – 7:00 a. m.", 300, 420, true),
      fieramixBase("La Mañana de FIERAMIX", "7:00 a. m. – 12:00 p. m.", 420, 720, true),
      fieramixBase("El Almuerzo de FIERAMIX", "12:00 p. m. – 2:00 p. m.", 720, 840, true),
      {
        title: "Rosariomanía",
        detail: "Con Wilson Poueriet · Retransmisión desde Estrella 92.3 FM · Homenaje en vida a la Dinastía Rosario.",
        schedule: "2:00 p. m. – 6:00 p. m.",
        start: 840,
        end: 1080,
      },
      fieramixBase("El Atardecer de FIERAMIX", "6:00 p. m. – 7:00 p. m.", 1080, 1140, true),
      fieramixBase("La Noche de FIERAMIX", "7:00 p. m. – 12:00 a. m.", 1140, 1440, true),
    ];
  }

  return [
    fieramixBase("La Madrugada de FIERAMIX", "12:00 a. m. – 5:00 a. m.", 0, 300, true),
    fieramixBase("El Amanecer de FIERAMIX", "5:00 a. m. – 7:00 a. m.", 300, 420, true),
    fieramixBase("La Mañana de FIERAMIX", "7:00 a. m. – 12:00 p. m.", 420, 720, true),
    fieramixBase("El Almuerzo de FIERAMIX", "12:00 p. m. – 2:00 p. m.", 720, 840, true),
    fieramixBase("La Tarde de FIERAMIX", "2:00 p. m. – 5:00 p. m.", 840, 1020, true),
    {
      title: "La Hora de los Mayimbes",
      detail: "Homenaje al Mayimbito, Alex Bueno · Merengue y bachata.",
      schedule: "5:00 p. m. – 6:00 p. m.",
      start: 1020,
      end: 1080,
    },
    fieramixBase("El Atardecer de FIERAMIX", "6:00 p. m. – 7:00 p. m.", 1080, 1140, true),
    fieramixBase("La Noche de FIERAMIX", "7:00 p. m. – 12:00 a. m.", 1140, 1440, true),
  ];
}

function merengueSchedule(day: number): Slot[] {
  const weekend = day === 0 || day === 5 || day === 6;
  const base = genericSchedule(
    "Programación regular",
    "Maratón de Merengues Clásicos",
    weekend
      ? "La Época Dorada del Merengue · puros clásicos · selección especial de Solo Merengue · parte del Fin de Semana Bravo."
      : "Merengue · éxitos actuales, recurrentes y clásicos.",
  )(day);

  if (day !== 0) return base;

  return [
    ...base.filter((slot) => slot.end <= 1020),
    {
      title: "La Hora de los Mayimbes",
      detail: "Homenaje a la música del Mayimbe, Fernando Villalona · programa especial dentro del Fin de Semana Bravo.",
      schedule: "5:00 p. m. – 6:00 p. m.",
      start: 1020,
      end: 1080,
    },
    {
      title: "Maratón de Merengues Clásicos",
      detail: "La Época Dorada del Merengue · puros clásicos · selección especial de Solo Merengue · parte del Fin de Semana Bravo.",
      schedule: "6:00 p. m. – 7:00 p. m.",
      start: 1080,
      end: 1140,
    },
    {
      title: "Maratón de Merengues Clásicos",
      detail: "La Época Dorada del Merengue · puros clásicos · selección especial de Solo Merengue · parte del Fin de Semana Bravo.",
      schedule: "7:00 p. m. – 12:00 a. m.",
      start: 1140,
      end: 1440,
    },
  ];
}

function bachataSchedule(day: number): Slot[] {
  const base = genericSchedule(
    "Programación regular",
    "Fin de Semana Bravo",
    "Bachata · éxitos actuales, recurrentes y clásicos.",
  )(day);

  if (day !== 0) return base;

  return [
    ...base.filter((slot) => slot.end <= 1020),
    {
      title: "La Hora de los Mayimbes",
      detail: "Homenaje a la música del Mayimbe, Anthony Santos · merengue y bachata.",
      schedule: "5:00 p. m. – 6:00 p. m.",
      start: 1020,
      end: 1080,
    },
    {
      title: "Fin de Semana Bravo",
      detail: "El Atardecer · Bachata · éxitos actuales, recurrentes y clásicos.",
      schedule: "6:00 p. m. – 7:00 p. m.",
      start: 1080,
      end: 1140,
    },
    {
      title: "Fin de Semana Bravo",
      detail: "La Noche · Bachata · éxitos actuales, recurrentes y clásicos.",
      schedule: "7:00 p. m. – 12:00 a. m.",
      start: 1140,
      end: 1440,
    },
  ];
}

const salsaSchedule = genericSchedule(
  "Programación regular",
  "Fin de Semana Bravo",
  "Salsa · grandes éxitos, recurrentes, clásicos y actualidad.",
);

function baladasSchedule(day: number): Slot[] {
  const sunday = day === 0;
  const weekend = day === 5 || day === 6;
  const baseTitle = sunday
    ? "El Domingo Inolvidable de Solo Baladas"
    : weekend
      ? "Fin de Semana Romántico"
      : "Programación regular";
  const baseDetail = sunday
    ? "Música romántica del ayer, contemporánea y de actualidad."
    : "Baladas románticas · clásicos, contemporáneos y actualidad.";

  return [
    { title: baseTitle, detail: `La Madrugada · ${baseDetail}`, schedule: "12:00 a. m. – 5:00 a. m.", start: 0, end: 300 },
    { title: baseTitle, detail: `El Amanecer · ${baseDetail}`, schedule: "5:00 a. m. – 7:00 a. m.", start: 300, end: 420 },
    { title: baseTitle, detail: `La Mañana · ${baseDetail}`, schedule: "7:00 a. m. – 12:00 p. m.", start: 420, end: 720 },
    {
      title: "El Momento Estelar de Solo Baladas",
      detail: "Un artista invitado o destacado · música romántica.",
      schedule: "12:00 p. m. – 1:00 p. m.",
      start: 720,
      end: 780,
    },
    { title: baseTitle, detail: `El Almuerzo · ${baseDetail}`, schedule: "1:00 p. m. – 2:00 p. m.", start: 780, end: 840 },
    { title: baseTitle, detail: `La Tarde · ${baseDetail}`, schedule: "2:00 p. m. – 5:00 p. m.", start: 840, end: 1020 },
    { title: baseTitle, detail: `El Atardecer · ${baseDetail}`, schedule: "5:00 p. m. – 7:00 p. m.", start: 1020, end: 1140 },
    { title: baseTitle, detail: `La Noche · ${baseDetail}`, schedule: "7:00 p. m. – 9:00 p. m.", start: 1140, end: 1260 },
    {
      title: "El Momento Estelar de Solo Baladas",
      detail: "Repetición del especial con un artista invitado o destacado.",
      schedule: "9:00 p. m. – 10:00 p. m.",
      start: 1260,
      end: 1320,
    },
    { title: baseTitle, detail: `La Noche · ${baseDetail}`, schedule: "10:00 p. m. – 12:00 a. m.", start: 1320, end: 1440 },
  ];
}

const christianSchedule = genericSchedule(
  "Programación 24/7",
  "Programación 24/7",
  "Música cristiana, reflexión, enseñanza y mensajes de fe.",
);

const stations: StationConfig[] = [
  {
    id: "fieramix",
    name: "FIERAMIX",
    intro: "Merengue, bachata, salsa, información y especiales durante las 24 horas.",
    liveSchedule: fieramixSchedule,
    showNetworkCapsules: true,
    showNationalAnthem: true,
    newsTimes: mainNewsTimes,
    groups: [
      {
        title: "Formato semanal",
        items: [
          { title: "Programación regular", schedule: "Lunes a jueves", detail: "Merengue, bachata y salsa." },
          { title: "Fin de Semana Bravo", schedule: "Viernes a domingo", detail: "Merengue, bachata y salsa." },
          { title: "Alexander Sadalab “El Eterno”", schedule: "24 horas", detail: "Animador virtual y voz institucional de EL GRUPO FIERAMIX.COM." },
        ],
      },
      {
        title: "Programas especiales",
        items: [
          { title: "Íntimamente", schedule: "Martes a viernes · 12:00 a. m. – 2:00 a. m.", detail: "Música romántica." },
          { title: "Románticamente", schedule: "Lunes a jueves · 6:00 a. m. – 8:00 a. m.", detail: "Música romántica." },
          { title: "La Hora Cero", schedule: "Lunes a jueves · 12:00 p. m. – 1:00 p. m.", detail: "Música romántica." },
          { title: "Rosariomanía", schedule: "Sábados · 2:00 p. m. – 6:00 p. m.", detail: "Producido y conducido por Wilson Poueriet. Retransmisión desde Estrella 92.3 FM. Homenaje en vida a la Dinastía Rosario." },
          { title: "La Hora de los Mayimbes", schedule: "Domingos · 5:00 p. m. – 6:00 p. m.", detail: "Homenaje al Mayimbito, Alex Bueno · merengue y bachata." },
        ],
      },
      {
        title: "Rotación musical de FIERAMIX",
        items: rotation.map((title) => ({ title, schedule: "Rotación activa" })),
      },
      commonDayparts,
    ],
  },
  {
    id: "merengue",
    name: "Solo Merengue",
    intro: "Merengue de todos los tiempos con programas especiales dentro de su Fin de Semana Bravo.",
    liveSchedule: merengueSchedule,
    showNetworkCapsules: true,
    showNationalAnthem: true,
    newsTimes: twoHourNewsTimes,
    groups: [
      {
        title: "Formato semanal",
        items: [
          { title: "Programación regular", schedule: "Lunes a jueves", detail: "Éxitos actuales, recurrentes y clásicos del merengue." },
          { title: "Fin de Semana Bravo", schedule: "Viernes a domingo", detail: "Programación especial de fin de semana de Solo Merengue." },
        ],
      },
      {
        title: "Programas del Fin de Semana Bravo",
        description: "Estos son programas que forman parte del Fin de Semana Bravo; no sustituyen el concepto completo del fin de semana.",
        items: [
          {
            title: "Maratón de Merengues Clásicos",
            schedule: "Viernes a domingo · dentro del Fin de Semana Bravo",
            detail: "La Época Dorada del Merengue · puros clásicos · selección especial de Solo Merengue.",
          },
          {
            title: "La Hora de los Mayimbes",
            schedule: "Domingos · 5:00 p. m. – 6:00 p. m.",
            detail: "Homenaje a la música del Mayimbe, Fernando Villalona.",
          },
        ],
      },
      commonDayparts,
    ],
  },
  {
    id: "bachata",
    name: "Solo Bachata",
    intro: "Bachata de todos los tiempos, con actualidad, recurrentes, clásicos y especiales.",
    liveSchedule: bachataSchedule,
    showNetworkCapsules: true,
    showNationalAnthem: true,
    newsTimes: twoHourNewsTimes,
    groups: [
      {
        title: "Formato semanal",
        items: [
          { title: "Programación regular", schedule: "Lunes a jueves", detail: "Bachata · éxitos actuales, recurrentes y clásicos." },
          { title: "Fin de Semana Bravo", schedule: "Viernes a domingo", detail: "Bachata durante todo el fin de semana." },
        ],
      },
      {
        title: "Especial",
        items: [
          { title: "La Hora de los Mayimbes", schedule: "Domingos · 5:00 p. m. – 6:00 p. m.", detail: "Homenaje a la música del Mayimbe, Anthony Santos · merengue y bachata." },
        ],
      },
      commonDayparts,
    ],
  },
  {
    id: "salsa",
    name: "Solo Salsa",
    intro: "Salsa de todos los tiempos con bloques especiales de cinco canciones según cada ambiente.",
    liveSchedule: salsaSchedule,
    showNetworkCapsules: true,
    showNationalAnthem: true,
    newsTimes: twoHourNewsTimes,
    groups: [
      {
        title: "Bloques especiales de 5 canciones",
        description: "Son bloques cortos de cinco canciones seleccionadas para cada ambiente; no son franjas continuas de varias horas.",
        items: [
          {
            title: "Los Internacionales de la Salsa",
            schedule: "2:00 a. m. · bloque de 5 canciones",
            detail: "Selección salsera internacional especializada.",
          },
          {
            title: "Los Emergentes de la Salsa",
            schedule: "7:00 a. m. · bloque de 5 canciones",
            detail: "Cinco canciones de artistas y propuestas salseras emergentes.",
          },
          {
            title: "Los Enamorados de la Salsa",
            schedule: "12:00 p. m. · bloque de 5 canciones",
            detail: "Cinco canciones salseras dedicadas al amor y al ambiente de pareja.",
          },
          {
            title: "Los Románticos de la Salsa",
            schedule: "1:00 p. m. · bloque de 5 canciones",
            detail: "Cinco canciones de salsa romántica.",
          },
          {
            title: "Los Sentimentales de la Salsa",
            schedule: "7:00 p. m. · bloque de 5 canciones",
            detail: "Cinco canciones de contenido emocional y sentimental.",
          },
          {
            title: "Los Internacionales de la Salsa",
            schedule: "8:00 p. m. · bloque de 5 canciones",
            detail: "Segunda salida diaria del bloque internacional de cinco canciones.",
          },
        ],
      },
      {
        title: "Formato semanal",
        items: [
          { title: "Programación regular", schedule: "Lunes a jueves", detail: "Salsa durante las 24 horas." },
          { title: "Fin de Semana Bravo", schedule: "Viernes a domingo", detail: "Salsa durante todo el fin de semana." },
        ],
      },
      commonDayparts,
    ],
  },
  {
    id: "baladas",
    name: "Solo Baladas",
    intro: "Románticas del ayer, contemporáneas y de actualidad, con bloques especiales todos los días.",
    liveSchedule: baladasSchedule,
    showNetworkCapsules: true,
    showNationalAnthem: true,
    newsTimes: twoHourNewsTimes,
    groups: [
      {
        title: "Formato semanal",
        items: [
          { title: "Programación regular", schedule: "Lunes a jueves", detail: "Baladas románticas de todos los tiempos." },
          { title: "Fin de Semana Romántico", schedule: "Viernes y sábado", detail: "Selección romántica especial." },
          { title: "El Domingo Inolvidable de Solo Baladas", schedule: "Domingo · 24 horas", detail: "Románticas del ayer, contemporáneas y de actualidad." },
        ],
      },
      {
        title: "Especiales diarios",
        items: [
          { title: "El Momento Estelar de Solo Baladas", schedule: "12:00 p. m. – 1:00 p. m. · repetición 9:00 p. m. – 10:00 p. m.", detail: "Un artista invitado o destacado · música romántica." },
          { title: "El 2X1 de Solo Baladas", schedule: "1:20, 3:20, 5:20, 7:20, 9:20, 11:20 a. m. · 1:20, 3:20, 5:20, 7:20, 11:20 p. m.", detail: "Dos canciones románticas de tu artista favorito." },
        ],
      },
      commonDayparts,
    ],
  },
  {
    id: "reggaeton",
    name: "Solo Reggaetón",
    intro: "Reggaetón con actualidad, recurrentes y clásicos del género.",
    liveSchedule: genericSchedule(
      "Programación regular",
      "Fin de Semana Bravo",
      "Reggaetón · éxitos actuales, recurrentes y clásicos.",
    ),
    showNetworkCapsules: true,
    showNationalAnthem: true,
    groups: [
      {
        title: "Formato semanal",
        items: [
          { title: "Programación regular", schedule: "Lunes a jueves", detail: "Reggaetón durante las 24 horas." },
          { title: "Fin de Semana Bravo", schedule: "Viernes a domingo", detail: "Reggaetón durante todo el fin de semana." },
        ],
      },
      commonDayparts,
    ],
  },
  {
    id: "rancheras",
    name: "Solo Rancheras",
    intro: "Música ranchera y mexicana de todos los tiempos.",
    liveSchedule: genericSchedule(
      "Programación regular",
      "Fin de Semana Bravo",
      "Rancheras · éxitos actuales, recurrentes y clásicos.",
    ),
    showNetworkCapsules: true,
    showNationalAnthem: true,
    groups: [
      {
        title: "Formato semanal",
        items: [
          { title: "Programación regular", schedule: "Lunes a jueves", detail: "Música ranchera y mexicana." },
          { title: "Fin de Semana Bravo", schedule: "Viernes a domingo", detail: "Música ranchera y mexicana durante todo el fin de semana." },
        ],
      },
      commonDayparts,
    ],
  },
  {
    id: "internacional",
    name: "Solo Música Internacional",
    intro: "Música internacional de todos los tiempos, con actualidad, recurrentes y clásicos.",
    liveSchedule: genericSchedule(
      "Programación regular",
      "Fin de Semana Bravo",
      "Música internacional · éxitos actuales, recurrentes y clásicos.",
    ),
    showNetworkCapsules: true,
    showNationalAnthem: true,
    groups: [
      {
        title: "Formato semanal",
        items: [
          { title: "Programación regular", schedule: "Lunes a jueves", detail: "Música internacional durante las 24 horas." },
          { title: "Fin de Semana Bravo", schedule: "Viernes a domingo", detail: "Música internacional durante todo el fin de semana." },
        ],
      },
      commonDayparts,
    ],
  },
  {
    id: "cristiana",
    name: "Solo Música Cristiana",
    intro: "Programación 24/7, los 7 días, con música, reflexión, enseñanza, oración y mensajes de fe.",
    liveSchedule: christianSchedule,
    showNetworkCapsules: false,
    showNationalAnthem: false,
    groups: [
      {
        title: "Programación 24/7",
        description: "Una programación cristiana continua y redonda los 7 días de la semana.",
        items: [
          { title: "La Prédica de Cada Día", schedule: "12:00 a. m. · 6:00 a. m. · 12:00 p. m. · 6:00 p. m.", detail: "Mensaje de prédica cristiana." },
          { title: "El Devocional de Cada Día", schedule: "7:00 a. m. · 9:00 a. m.", detail: "Mensaje motivacional para arrancar el día poniendo a Dios primero." },
          { title: "La Palabra de Dios", schedule: "8:00 a. m.", detail: "Mensaje de los Salmos." },
          { title: "La Oración de las 8", schedule: "8:00 a. m.", detail: "Nos presentamos ante Dios para pedir su protección durante todo el día." },
          { title: "El Santo Evangelio", schedule: "1:00 p. m.", detail: "Llamado a servir al Señor con obediencia y adoración." },
          { title: "El Apocalipsis", schedule: "4:00 p. m.", detail: "Mensaje sobre lo que viene al final de los tiempos." },
          { title: "El Diario de Matilda", schedule: "10:00 p. m.", detail: "Cómo puede transcurrir el día de una persona que pone a Dios antes que todas las cosas." },
        ],
      },
      {
        title: "El Camino de la Vida",
        items: [
          { title: "Reflexiones de la vida real", schedule: "5:00 a. m. · 11:00 a. m. · 5:00 p. m. · 11:00 p. m.", detail: "Reflexiones cristianas basadas en situaciones de la vida real." },
          { title: "Mensaje doctrinal", schedule: "9:00 p. m.", detail: "Enseñanza y formación cristiana." },
        ],
      },
      {
        title: "Cápsulas cristianas",
        items: [
          { title: "Palabra de Cristo Vive", schedule: "12:24 a. m. · 4:25 a. m. · 8:24 a. m. · 12:25 p. m. · 4:24 p. m. · 8:21 p. m." },
          { title: "Conoce la Cita Bíblica", schedule: "2:22 a. m. · 6:23 a. m. · 10:23 a. m. · 2:20 p. m. · 6:23 p. m. · 10:24 p. m." },
          { title: "La Frase del Momento", schedule: "Cada dos horas, en horas impares, aproximadamente entre los minutos :20 y :24." },
        ],
      },
      commonDayparts,
    ],
  },
];

function dominicanClock(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santo_Domingo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const rawHour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const hour = rawHour === 24 ? 0 : rawHour;

  return {
    day: dayIndex[weekday] ?? 0,
    minute: hour * 60 + minute,
  };
}

function liveState(date: Date, station: StationConfig): LiveState {
  const clock = dominicanClock(date);
  const schedule = station.liveSchedule(clock.day);
  const found = schedule.findIndex(
    (slot) => clock.minute >= slot.start && clock.minute < slot.end,
  );
  const index = found >= 0 ? found : 0;
  const current = schedule[index];
  const next = schedule[index + 1] ?? station.liveSchedule((clock.day + 1) % 7)[0];
  return { current, next };
}

const panelStyle = {
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: "18px",
  background: "rgba(255,255,255,.045)",
};

export default function FieramixProgramming() {
  const [selectedId, setSelectedId] = useState<StationId>("fieramix");
  const [now, setNow] = useState<Date | null>(null);

  const selected = useMemo(
    () => stations.find((station) => station.id === selectedId) ?? stations[0],
    [selectedId],
  );

  const live = useMemo(
    () => (now ? liveState(now, selected) : null),
    [now, selected],
  );

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      id="programacion"
      style={{
        width: "min(1180px, calc(100% - 32px))",
        margin: "clamp(42px, 7vw, 86px) auto",
        padding: "clamp(24px, 4vw, 38px)",
        borderRadius: "28px",
        background:
          "radial-gradient(circle at 0% 0%, rgba(124,58,237,.28), transparent 34%), radial-gradient(circle at 100% 100%, rgba(32,220,142,.18), transparent 34%), #090f20",
        border: "1px solid rgba(255,255,255,.10)",
        color: "#fff",
        boxShadow: "0 30px 90px rgba(0,0,0,.24)",
      }}
    >
      <span style={{ color: "#72f0bd", fontSize: ".74rem", fontWeight: 900, letterSpacing: ".12em" }}>
        PARRILLA SEMANAL OFICIAL
      </span>
      <h2 style={{ margin: "8px 0 0", fontSize: "clamp(1.8rem, 4.5vw, 3.2rem)", lineHeight: 1.02 }}>
        NUESTRA PROGRAMACIÓN EN FIERAMIX
      </h2>
      <p style={{ margin: "13px 0 0", color: "rgba(255,255,255,.68)" }}>
        Consulta la programación oficial de todas las emisoras de EL GRUPO FIERAMIX.COM.
      </p>

      <div
        aria-label="Seleccionar emisora"
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          padding: "18px 0 4px",
          scrollbarWidth: "thin",
        }}
      >
        {stations.map((station) => {
          const active = station.id === selected.id;
          return (
            <button
              key={station.id}
              type="button"
              onClick={() => setSelectedId(station.id)}
              style={{
                flex: "0 0 auto",
                cursor: "pointer",
                borderRadius: "999px",
                border: active ? "1px solid rgba(114,240,189,.55)" : "1px solid rgba(255,255,255,.10)",
                background: active ? "rgba(114,240,189,.14)" : "rgba(255,255,255,.035)",
                color: active ? "#d8fff0" : "rgba(255,255,255,.72)",
                padding: "10px 14px",
                fontSize: ".78rem",
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              {station.name}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "20px" }}>
        <span style={{ color: "rgba(255,255,255,.5)", fontSize: ".72rem", fontWeight: 900, letterSpacing: ".08em" }}>
          EMISORA SELECCIONADA
        </span>
        <h3 style={{ margin: "5px 0 0", fontSize: "clamp(1.35rem, 3vw, 2rem)" }}>{selected.name}</h3>
        <p style={{ margin: "7px 0 0", color: "rgba(255,255,255,.68)", lineHeight: 1.55 }}>{selected.intro}</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
          gap: "12px",
          marginTop: "22px",
        }}
      >
        <div style={{ ...panelStyle, padding: "18px 20px", borderColor: "rgba(114,240,189,.25)" }}>
          <span style={{ color: "#72f0bd", fontSize: ".7rem", fontWeight: 900 }}>● AHORA EN {selected.name.toUpperCase()}</span>
          <h3 style={{ margin: "8px 0 4px" }}>{live?.current.title ?? "Actualizando programación…"}</h3>
          {live ? (
            <>
              <p style={{ margin: 0, color: "rgba(255,255,255,.72)", lineHeight: 1.5 }}>{live.current.detail}</p>
              <strong style={{ display: "block", marginTop: "8px", color: "#d8fff0", fontSize: ".82rem" }}>
                {live.current.schedule}
              </strong>
            </>
          ) : null}
        </div>

        <div style={{ ...panelStyle, padding: "18px 20px" }}>
          <span style={{ color: "rgba(255,255,255,.58)", fontSize: ".7rem", fontWeight: 900 }}>A CONTINUACIÓN</span>
          <h3 style={{ margin: "8px 0 4px" }}>{live?.next.title ?? "Actualizando programación…"}</h3>
          {live ? (
            <>
              <p style={{ margin: 0, color: "rgba(255,255,255,.66)", lineHeight: 1.5 }}>{live.next.detail}</p>
              <strong style={{ display: "block", marginTop: "8px", fontSize: ".82rem" }}>{live.next.schedule}</strong>
            </>
          ) : null}
        </div>
      </div>

      <p style={{ margin: "9px 2px 0", color: "rgba(255,255,255,.42)", fontSize: ".72rem" }}>
        Horario de República Dominicana.
      </p>

      <details style={{ marginTop: "18px" }}>
        <summary
          style={{
            cursor: "pointer",
            display: "inline-flex",
            padding: "12px 18px",
            borderRadius: "999px",
            border: "1px solid rgba(114,240,189,.28)",
            background: "rgba(114,240,189,.10)",
            color: "#d8fff0",
            fontSize: ".78rem",
            fontWeight: 900,
            letterSpacing: ".08em",
          }}
        >
          VER PROGRAMACIÓN COMPLETA
        </summary>

        <div style={{ display: "grid", gap: "16px", marginTop: "22px" }}>
          {(selected.showNationalAnthem || selected.showNetworkCapsules || selected.newsTimes) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
              {selected.showNationalAnthem ? (
                <div style={{ ...panelStyle, padding: "18px" }}>
                  <strong>HIMNO NACIONAL DE LA REPÚBLICA DOMINICANA</strong>
                  <p style={{ margin: "7px 0 0", color: "#d8fff0" }}>Todos los días · 8:00 a. m.</p>
                </div>
              ) : null}

              {selected.newsTimes ? (
                <div style={{ ...panelStyle, padding: "18px" }}>
                  <strong>FIERAMIX NOTICIAS</strong>
                  <p style={{ margin: "7px 0 0", color: "rgba(255,255,255,.68)" }}>
                    Lunes a jueves · {selected.newsTimes.join(" · ")}
                  </p>
                </div>
              ) : null}

              {selected.showNetworkCapsules ? (
                <div style={{ ...panelStyle, padding: "18px" }}>
                  <strong>PODCASTS Y CÁPSULAS</strong>
                  <p style={{ margin: "7px 0 0", color: "rgba(255,255,255,.68)" }}>
                    Contenidos de EL GRUPO FIERAMIX.COM · {networkCapsules.join(" · ")}
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {selected.groups.map((group, groupIndex) => (
            <div key={`${selected.id}-${group.title}-${groupIndex}`} style={{ ...panelStyle, padding: "20px" }}>
              <h3 style={{ marginTop: 0, marginBottom: group.description ? "6px" : "12px" }}>{group.title}</h3>
              {group.description ? (
                <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,.62)", lineHeight: 1.5 }}>{group.description}</p>
              ) : null}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))", gap: "10px" }}>
                {group.items.map((item, index) => (
                  <div
                    key={`${group.title}-${item.title}-${index}`}
                    style={{
                      padding: "13px 14px",
                      borderRadius: "13px",
                      background: "rgba(255,255,255,.035)",
                      border: "1px solid rgba(255,255,255,.055)",
                    }}
                  >
                    <strong style={{ display: "block", fontSize: ".9rem" }}>{item.title}</strong>
                    <span style={{ display: "block", color: "#72f0bd", fontSize: ".78rem", marginTop: "4px", lineHeight: 1.45 }}>
                      {item.schedule}
                    </span>
                    {item.detail ? (
                      <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,.62)", fontSize: ".82rem", lineHeight: 1.5 }}>
                        {item.detail}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
