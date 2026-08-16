import type { Station } from "@/types/station";

export const stations: Station[] = [
  {
    id: "fieramix",
    name: "FIERAMIX",
    shortName: "FIERAMIX",
    slogan: "FIERAMIX",
    description:
      "Hits latinos y programación variada en vivo las 24 horas.",
    streamUrl: "https://c11.radioboss.fm:18269/stream",
    logo: "/logos/fieramix.png",
    genre: "Hits latinos",
    accent: "#ff5a1f",
    theme: {
      accent: "#ff5a1f",
    },
    radioBoss: {
      apiBase: "https://c11.radioboss.fm",
    },
    features: {
      listeners: true,
      history: false,
      songRequest: false,
      top10: false,
      schedule: false,
    },
  },
  {
    id: "bachata",
    name: "SOLO BACHATA",
    shortName: "Bachata",
    slogan: "La Radio que Te Mueve",
    description:
      "Bachata en vivo las 24 horas con clásicos, éxitos y nuevas producciones.",
    streamUrl: "https://c15.radioboss.fm:18221/stream",
    logo: "/logos/solo-bachata.png",
    genre: "Bachata",
    accent: "#ff2d76",
    theme: {
      accent: "#ff2d76",
    },
    radioBoss: {
      apiBase: "https://c15.radioboss.fm",
      songRequestWidgetId: 7164,
    },
    features: {
      listeners: true,
      history: false,
      songRequest: true,
      top10: false,
      schedule: false,
    },
  },
  {
    id: "merengue",
    name: "SOLO MERENGUE",
    shortName: "Merengue",
    slogan: "La Radio que Te Mueve",
    description:
      "Merengue dominicano en vivo las 24 horas, desde los clásicos hasta los éxitos actuales.",
    streamUrl: "https://c15.radioboss.fm:18223/stream",
    logo: "/logos/solo-merengue.png",
    genre: "Merengue",
    accent: "#00a8ff",
    theme: {
      accent: "#00a8ff",
    },
    radioBoss: {
      apiBase: "https://c15.radioboss.fm",
    },
    features: {
      listeners: true,
      history: false,
      songRequest: false,
      top10: false,
      schedule: false,
    },
  },
  {
    id: "salsa",
    name: "SOLO SALSA",
    shortName: "Salsa",
    slogan: "La Radio que Te Mueve",
    description:
      "Salsa en vivo las 24 horas con grandes orquestas, soneros y éxitos de todos los tiempos.",
    streamUrl: "https://c15.radioboss.fm:18230/stream",
    logo: "/logos/solo-salsa.png",
    genre: "Salsa",
    accent: "#f4b000",
    theme: {
      accent: "#f4b000",
    },
    radioBoss: {
      apiBase: "https://c15.radioboss.fm",
    },
    features: {
      listeners: true,
      history: false,
      songRequest: false,
      top10: false,
      schedule: false,
    },
  },
  {
    id: "baladas",
    name: "SOLO BALADAS",
    shortName: "Baladas",
    slogan: "La Radio que Mueve Tus Sentidos",
    description:
      "Baladas románticas en español para acompañar tus recuerdos y emociones.",
    streamUrl: "https://c15.radioboss.fm:18222/stream",
    logo: "/logos/solo-baladas.png",
    genre: "Baladas",
    accent: "#8c52ff",
    theme: {
      accent: "#8c52ff",
    },
    radioBoss: {
      apiBase: "https://c15.radioboss.fm",
    },
    features: {
      listeners: true,
      history: false,
      songRequest: false,
      top10: false,
      schedule: false,
    },
  },
  {
    id: "reggaeton",
    name: "SOLO REGGAETÓN",
    shortName: "Reggaetón",
    slogan: "La Radio que Te Mueve",
    description:
      "Reggaetón y música urbana en vivo las 24 horas.",
    streamUrl: "https://c13.radioboss.fm:18182/stream",
    logo: "/logos/solo-reggaeton.png",
    genre: "Urbano",
    accent: "#00c2a8",
    theme: {
      accent: "#00c2a8",
    },
    radioBoss: {
      apiBase: "https://c13.radioboss.fm",
    },
    features: {
      listeners: true,
      history: false,
      songRequest: false,
      top10: false,
      schedule: false,
    },
  },
  {
    id: "rancheras",
    name: "SOLO RANCHERAS",
    shortName: "Rancheras",
    slogan: "La Mexicana de República Dominicana",
    description:
      "Rancheras, mariachi y música mexicana en vivo desde República Dominicana.",
    streamUrl: "https://c11.radioboss.fm:18212/stream",
    logo: "/logos/solo-rancheras.png",
    genre: "Rancheras",
    accent: "#de3c4b",
    theme: {
      accent: "#de3c4b",
    },
    radioBoss: {
      apiBase: "https://c11.radioboss.fm",
    },
    features: {
      listeners: true,
      history: false,
      songRequest: false,
      top10: false,
      schedule: false,
    },
  },
  {
    id: "internacional",
    name: "SOLO MÚSICA INTERNACIONAL",
    shortName: "Internacional",
    slogan: "La Americana de República Dominicana",
    description:
      "Música internacional en inglés y grandes éxitos globales de todos los tiempos.",
    streamUrl: "https://c13.radioboss.fm:18188/stream",
    logo: "/logos/solo-internacional.png",
    genre: "Internacional",
    accent: "#2563eb",
    theme: {
      accent: "#2563eb",
    },
    radioBoss: {
      apiBase: "https://c13.radioboss.fm",
    },
    features: {
      listeners: true,
      history: false,
      songRequest: false,
      top10: false,
      schedule: false,
    },
  },
  {
    id: "cristiana",
    name: "SOLO MÚSICA CRISTIANA",
    shortName: "Cristiana",
    slogan: "La Radio que Eleva y Purifica Tu Espíritu",
    description:
      "Música cristiana, reflexión y mensajes de fe durante las 24 horas.",
    streamUrl: "https://c11.radioboss.fm:18211/stream",
    logo: "/logos/solo-cristiana.png",
    genre: "Cristiana",
    accent: "#14b8a6",
    theme: {
      accent: "#14b8a6",
    },
    radioBoss: {
      apiBase: "https://c11.radioboss.fm",
    },
    features: {
      listeners: true,
      history: false,
      songRequest: false,
      top10: false,
      schedule: false,
    },
  },
];
