import { getStore } from "@netlify/blobs";
import { radioBossStations } from "@/config/radiobossStations";
import { news } from "@/data/news";
import { schedule } from "@/data/schedule";
import { stations } from "@/data/stations";
import { getStationData } from "@/lib/radioboss";

const STORE_NAME = "fieramix-ranking-history";

type StoredPlay = {
  stationId: string;
  stationName: string;
  title: string;
  artist: string;
  playedAt: string;
};

type DailyRankingHistory = {
  version: number;
  date: string;
  events: Record<string, StoredPlay>;
};

type AudienceSample = {
  stationId: string;
  stationName: string;
  listeners: number;
  capturedAt: string;
};

type DailyAudienceHistory = {
  version: number;
  date: string;
  samples: Record<string, AudienceSample>;
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function requestedStationId(message: string): string | null {
  const normalized = normalize(message);

  return (
    stations.find((station) =>
      [station.id, station.name, station.shortName]
        .map((name) => normalize(name ?? ""))
        .some((name) => normalized.includes(name)),
    )?.id ?? null
  );
}

function requestedDays(message: string): number {
  const normalized = normalize(message);

  if (/histor|anual|ano|365/.test(normalized)) return 365;
  if (/mensual|mes|30 dias/.test(normalized)) return 30;
  if (/semanal|semana|7 dias/.test(normalized)) return 7;
  return 1;
}

function dateKey(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santo_Domingo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function startDateKey(days: number): string {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() - Math.max(0, days - 1));
  return dateKey(value);
}

async function liveContext(): Promise<string> {
  const values = await Promise.all(
    stations.map(async (station) => {
      const config = radioBossStations[
        station.id as keyof typeof radioBossStations
      ];

      if (!config) return `${station.name}: sin conexión RadioBOSS.`;

      try {
        const data = await getStationData(config, 5);
        const title = data.currenttrack_title || data.currenttrack || "Programación en vivo";
        const artist = data.currenttrack_artist || station.name;
        const listeners =
          typeof data.listeners === "number" ? String(data.listeners) : "no disponible";
        const recent = data.recent
          .map((track) => `${track.tracktitle || track.title || "Sin título"} — ${track.trackartist || station.name}`)
          .join("; ");

        return `${station.name}: ${listeners} oyentes ahora; sonando ${title} — ${artist}; recientes: ${recent || "sin datos"}.`;
      } catch {
        return `${station.name}: datos en vivo temporalmente no disponibles.`;
      }
    }),
  );

  return values.join("\n");
}

async function rankingContext(message: string): Promise<string> {
  const normalized = normalize(message);
  if (!/ranking|top|tocad|cancion|historial|historico/.test(normalized)) return "";

  const days = requestedDays(message);
  const stationId = requestedStationId(message);
  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const { blobs } = await store.list({ prefix: "days/" });
  const start = startDateKey(days);
  const end = dateKey(new Date());
  const keys = blobs
    .map((blob) => blob.key)
    .filter((key) => /^days\/\d{4}-\d{2}-\d{2}$/.test(key))
    .filter((key) => key.slice(5) >= start && key.slice(5) <= end);
  const values = await Promise.all(
    keys.map((key) => store.get(key, { type: "json", consistency: "strong" })),
  );
  const aggregate = new Map<string, { title: string; artist: string; plays: number }>();

  for (const value of values) {
    const day = value as DailyRankingHistory | null;
    if (!day?.events) continue;
    for (const play of Object.values(day.events)) {
      if (stationId && play.stationId !== stationId) continue;
      const key = `${normalize(play.title)}::${normalize(play.artist)}`;
      const current = aggregate.get(key);
      if (current) current.plays += 1;
      else aggregate.set(key, { title: play.title, artist: play.artist, plays: 1 });
    }
  }

  const ranking = [...aggregate.values()]
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 25)
    .map((track, index) => `${index + 1}. ${track.title} — ${track.artist}: ${track.plays} tocadas`)
    .join("\n");

  return `RANKING REAL (${keys.length} días almacenados consultados, alcance: ${stationId ?? "toda la red"}):\n${ranking || "Aún no hay tocadas almacenadas para ese alcance."}`;
}

async function audienceHistoryContext(message: string): Promise<string> {
  const normalized = normalize(message);
  if (!/audiencia|oyente|escuchad|emisora|estacion|toda la red/.test(normalized) || !/histor|ranking|top|semana|mes|anual/.test(normalized)) return "";

  const days = requestedDays(message);
  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const { blobs } = await store.list({ prefix: "audience/days/" });
  const start = startDateKey(days);
  const end = dateKey(new Date());
  const keys = blobs
    .map((blob) => blob.key)
    .filter((key) => /^audience\/days\/\d{4}-\d{2}-\d{2}$/.test(key))
    .filter((key) => key.slice("audience/days/".length) >= start && key.slice("audience/days/".length) <= end);
  const values = await Promise.all(
    keys.map((key) => store.get(key, { type: "json", consistency: "strong" })),
  );
  const totals = new Map<string, { name: string; total: number; peak: number; samples: number }>();

  for (const value of values) {
    const day = value as DailyAudienceHistory | null;
    if (!day?.samples) continue;
    for (const sample of Object.values(day.samples)) {
      const current = totals.get(sample.stationId) ?? {
        name: sample.stationName,
        total: 0,
        peak: 0,
        samples: 0,
      };
      current.total += sample.listeners;
      current.peak = Math.max(current.peak, sample.listeners);
      current.samples += 1;
      totals.set(sample.stationId, current);
    }
  }

  const ranking = [...totals.values()]
    .sort((a, b) => b.total / b.samples - a.total / a.samples)
    .map((item, index) => `${index + 1}. ${item.name}: promedio ${(item.total / item.samples).toFixed(1)}, pico ${item.peak}, ${item.samples} mediciones`)
    .join("\n");

  return `AUDIENCIA HISTÓRICA REAL (${keys.length} días almacenados):\n${ranking || "La recopilación histórica de audiencia comienza con esta actualización; no existen mediciones anteriores guardadas."}`;
}

export async function buildFieramixAIContext(message: string): Promise<string> {
  const stationDirectory = stations
    .map((station) => `${station.name}: ${station.genre}. ${station.description} Eslogan: ${station.slogan}.`)
    .join("\n");
  const programming = schedule
    .map((item) => `${item.time}: ${item.show} — ${item.station}`)
    .join("\n");
  const portalNews = news
    .map((item) => `${item.title} (${item.category}, ${item.publishedAt ?? "sin fecha"}): ${item.excerpt}`)
    .join("\n");

  const [live, ranking, audience] = await Promise.all([
    liveContext(),
    rankingContext(message).catch(() => "El historial musical no pudo consultarse temporalmente."),
    audienceHistoryContext(message).catch(() => "El historial de audiencia no pudo consultarse temporalmente."),
  ]);

  return [
    `DATOS OFICIALES DEL PORTAL. Consulta generada: ${new Date().toISOString()}.`,
    "EMISORAS:\n" + stationDirectory,
    "DATOS EN VIVO:\n" + live,
    "PROGRAMACIÓN:\n" + programming,
    "NOTICIAS PUBLICADAS:\n" + portalNews,
    ranking,
    audience,
  ].filter(Boolean).join("\n\n");
}
