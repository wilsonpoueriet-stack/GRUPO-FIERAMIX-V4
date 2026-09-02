import type { StationId } from "@/types/station";

export const stationRouteById: Record<StationId, string> = {
  fieramix: "labrava",
  merengue: "lamerenguera",
  bachata: "labachatera",
  salsa: "lasalsera",
  reggaeton: "laurbana",
  rancheras: "lamexicana",
  internacional: "laamericana",
  cristiana: "lacristiana",
  baladas: "laromantica",
  ahora: "ahora",
  utopia: "utopia",
  latinamix: "latinamix",
  "radio-bavaro": "radiobavaro",
  estrella: "estrella",
  magia: "magia",
  makao: "makao",
};

export const stationIdByRoute = Object.fromEntries(
  Object.entries(stationRouteById).map(([id, slug]) => [slug, id]),
) as Record<string, StationId>;

export function getStationPath(id: StationId): string {
  return `/${stationRouteById[id]}`;
}
