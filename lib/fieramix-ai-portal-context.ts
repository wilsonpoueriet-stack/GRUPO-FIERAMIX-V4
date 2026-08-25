import { news } from "@/data/news";
import { stations } from "@/data/stations";
import { radioBossStations } from "@/config/radiobossStations";
import { getStationData } from "@/lib/radioboss";
import { getMostPlayedTracks, normalizeRadioText } from "@/lib/radio-intelligence";

export type FieramixClientContext = {
  path?: string;
  stationId?: string;
  stationName?: string;
  playing?: boolean;
  currentTitle?: string;
  currentArtist?: string;
};

const DOMINICAN_TIME_ZONE = "America/Santo_Domingo";

const PORTAL_SECTIONS = [
  "Inicio: /",
  "Emisoras: /#emisoras y /emisoras/[id]",
  "Solicitud de canciones: /#solicitud",
  "Rankings: /#rankings",
  "Programación: /#programacion",
  "Noticias: /#noticias y /noticias/[id]",
  "Club de Oyentes: /club-de-oyentes",
  "Galería de artistas: /galeria-artistas",
  "Política de privacidad: /politica-privacidad",
];

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function dominicanNowLabel(): string {
  return new Intl.DateTimeFormat("es-DO", {
    timeZone: DOMINICAN_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

function findStationId(message: string, client?: FieramixClientContext): string | undefined {
  const explicitClientId = clean(client?.stationId);
  const normalized = normalizeRadioText(message);

  const matched = stations.find((station) => {
    const aliases = [station.id, station.name, station.shortName, station.genre]
      .filter((value): value is string => Boolean(value))
      .map(normalizeRadioText)
      .filter(Boolean);

    return aliases.some((alias) => normalized.includes(alias));
  });

  return matched?.id || explicitClientId || undefined;
}

function wantsLiveData(message: string): boolean {
  const normalized = normalizeRadioText(message);
  return /\b(ahora|sonando|suena|escuchando|al aire|en vivo|oyentes|siguiente|proxima|proximo|emisora)\b/.test(
    normalized,
  );
}

function wantsRankingData(message: string): boolean {
  const normalized = normalizeRadioText(message);
  return /\b(top|ranking|mas tocad|mas sonad|mas popular|mas escuchad|numero 1|numero uno|lider)\w*/.test(
    normalized,
  );
}

function wantsNewsData(message: string): boolean {
  const normalized = normalizeRadioText(message);
  return /\b(noticia|noticias|actualidad|informacion|publicacion|articulo)\w*/.test(
    normalized,
  );
}

function requestedDays(message: string): number {
  const normalized = normalizeRadioText(message);
  if (/\b(ano|anual)\b/.test(normalized)) return 365;
  if (/\b(mes|mensual)\b/.test(normalized)) return 30;
  if (/\b(semana|semanal)\b/.test(normalized)) return 7;
  return 1;
}

async function liveStationContext(stationId?: string): Promise<string> {
  const ids = stationId
    ? [stationId]
    : Object.keys(radioBossStations);

  const rows = await Promise.all(
    ids.map(async (id) => {
      const config = radioBossStations[id as keyof typeof radioBossStations];
      if (!config) return null;

      const station = stations.find((item) => item.id === id);

      try {
        const data = await getStationData(config, 3);
        const title = clean(data.currenttrack_title || data.currenttrack) || "Programación en vivo";
        const artist = clean(data.currenttrack_artist) || "sin artista identificado";
        const nextTitle = clean(data.nexttrack_title || data.nexttrack);
        const nextArtist = clean(data.nexttrack_artist);

        return [
          `${station?.name || id}: ${title} — ${artist}`,
          typeof data.listeners === "number" ? `oyentes conectados: ${data.listeners}` : "",
          nextTitle ? `siguiente: ${nextTitle}${nextArtist ? ` — ${nextArtist}` : ""}` : "",
          data.live ? "modo: transmisión en vivo" : data.autodj ? "modo: AutoDJ" : "",
        ]
          .filter(Boolean)
          .join("; ");
      } catch {
        return `${station?.name || id}: datos en vivo temporalmente no disponibles`;
      }
    }),
  );

  return rows.filter((row): row is string => Boolean(row)).join("\n");
}

async function rankingContext(message: string, stationId?: string): Promise<string> {
  const days = requestedDays(message);

  try {
    const tracks = await getMostPlayedTracks({
      days,
      stationId,
      limit: 10,
    });

    if (tracks.length === 0) {
      return "No hay suficientes datos persistentes de tocadas para ese período.";
    }

    return tracks
      .map(
        (track, index) =>
          `${index + 1}. ${track.title} — ${track.artist}; ${track.plays} tocadas; emisoras: ${track.stationNames.join(", ") || "sin identificar"}`,
      )
      .join("\n");
  } catch {
    return "Los rankings dinámicos no están disponibles temporalmente.";
  }
}

function newsContext(): string {
  return news
    .slice()
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .map(
      (item) =>
        `${item.title} | categoría: ${item.category} | fecha: ${item.publishedAt || "sin fecha"} | resumen: ${item.excerpt} | ruta: /noticias/${item.id}`,
    )
    .join("\n");
}

function clientStateContext(client?: FieramixClientContext): string {
  if (!client) return "";

  const rows = [
    clean(client.path) ? `página/ruta actual del usuario: ${clean(client.path)}` : "",
    clean(client.stationName) ? `emisora seleccionada por el usuario: ${clean(client.stationName)}` : "",
    typeof client.playing === "boolean" ? `reproductor: ${client.playing ? "reproduciendo" : "pausado"}` : "",
    clean(client.currentTitle)
      ? `pista visible en el reproductor: ${clean(client.currentTitle)}${clean(client.currentArtist) ? ` — ${clean(client.currentArtist)}` : ""}`
      : "",
  ].filter(Boolean);

  return rows.join("\n");
}

export async function buildFieramixPortalContext(
  message: string,
  client?: FieramixClientContext,
): Promise<string> {
  const stationId = findStationId(message, client);
  const blocks: string[] = [
    `HORA OFICIAL DE REPÚBLICA DOMINICANA\n${dominicanNowLabel()}`,
    `MAPA REAL DEL PORTAL\n${PORTAL_SECTIONS.join("\n")}`,
    `EMISORAS CONFIGURADAS\n${stations
      .map(
        (station) =>
          `${station.name} (${station.id}) | género: ${station.genre} | ${station.description} | eslogan: ${station.slogan} | página: /emisoras/${station.id}`,
      )
      .join("\n")}`,
  ];

  const clientState = clientStateContext(client);
  if (clientState) {
    blocks.push(`CONTEXTO ACTUAL DEL USUARIO EN EL PORTAL\n${clientState}`);
  }

  if (wantsLiveData(message) || stationId) {
    blocks.push(`DATOS EN VIVO DE RADIOBOSS\n${await liveStationContext(stationId)}`);
  }

  if (wantsRankingData(message)) {
    blocks.push(`RANKING REAL SEGÚN HISTORIAL DE TOCADAS\n${await rankingContext(message, stationId)}`);
  }

  if (wantsNewsData(message)) {
    blocks.push(`NOTICIAS PUBLICADAS ACTUALMENTE EN EL PORTAL\n${newsContext()}`);
  }

  blocks.push(
    "CAPACIDADES REALES DEL PORTAL\nFIERAMIX IA puede orientar sobre emisoras, programación, noticias publicadas, rankings basados en tocadas, historial musical, canción actual, oyentes conectados, canción siguiente, Club de Oyentes, galería de artistas, solicitud de canciones y navegación del portal. No debe afirmar que realizó una acción si el frontend o el endpoint correspondiente no confirmó que se completó.",
  );

  return blocks.join("\n\n");
}
