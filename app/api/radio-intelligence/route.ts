import { NextResponse } from "next/server";
import {
  findPlayedTrack,
  getMostPlayedTracks,
} from "@/lib/radio-intelligence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function noStoreJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function positiveInteger(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const action = url.searchParams.get("action")?.trim().toLowerCase() || "top";
  const stationId = url.searchParams.get("station")?.trim() || undefined;

  try {
    if (action === "search") {
      const query = url.searchParams.get("q")?.trim() || "";

      if (!query) {
        return noStoreJson(
          {
            ok: false,
            error: "Debes indicar la canción o artista que deseas buscar.",
          },
          400,
        );
      }

      const result = await findPlayedTrack(query, {
        days: positiveInteger(url.searchParams.get("days"), 365, 365),
        stationId,
        limit: positiveInteger(url.searchParams.get("limit"), 5, 20),
      });

      return noStoreJson({
        ok: true,
        source: "fieramix-play-history",
        scope: stationId ? "station" : "network",
        stationId: stationId ?? null,
        ...result,
        notice:
          "Esta búsqueda confirma historial de reproducción, no disponibilidad actual en SongRequest.",
      });
    }

    if (action === "top") {
      const days = positiveInteger(url.searchParams.get("days"), 1, 365);
      const tracks = await getMostPlayedTracks({
        days,
        stationId,
        limit: positiveInteger(url.searchParams.get("limit"), 5, 100),
      });

      return noStoreJson({
        ok: true,
        source: "fieramix-play-history",
        scope: stationId ? "station" : "network",
        stationId: stationId ?? null,
        days,
        available: tracks.length > 0,
        tracks,
      });
    }

    return noStoreJson(
      {
        ok: false,
        error: "Acción no válida. Usa action=top o action=search.",
      },
      400,
    );
  } catch (error) {
    console.error("Error en Radio Intelligence:", error);

    return noStoreJson(
      {
        ok: false,
        error: "No fue posible consultar el historial musical de FIERAMIX.",
      },
      502,
    );
  }
}
