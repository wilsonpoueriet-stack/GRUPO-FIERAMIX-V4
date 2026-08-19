import { NextResponse } from "next/server";
import { radioBossStations } from "@/config/radiobossStations";
import {
  getCurrentArtworkUrl,
  getOptimizedArtworkUrl,
  getRecentArtworkUrl,
  getStationData,
} from "@/lib/radioboss";

export const dynamic = "force-dynamic";

export async function GET() {
  const stations = await Promise.all(
    Object.entries(radioBossStations).map(
      async ([id, config]) => {
        try {
          const data = await getStationData(config, 10);
          const currentSource = getCurrentArtworkUrl(config);
          const currentKey = `${id}:${data.currenttrack_artist || ""}:${data.currenttrack_title || data.currenttrack || ""}`;

          return {
            id,
            success: true,

            title:
              data.currenttrack_title ||
              data.currenttrack ||
              "Programación en vivo",

            artist:
              data.currenttrack_artist ||
              id,

            artwork: getOptimizedArtworkUrl(currentSource, currentKey),

            listeners: data.listeners ?? null,
            live: data.live ?? false,
            autodj: data.autodj ?? false,

            nexttrack:
              data.nexttrack_title ||
              data.nexttrack ||
              "",

            nexttrack_artist:
              data.nexttrack_artist ||
              "",

            recent: data.recent.map((track) => {
              const source = getRecentArtworkUrl(
                config,
                track.artworkid,
              );
              const key = `${id}:${track.artworkid || "current"}:${track.trackartist || ""}:${track.tracktitle || track.title || ""}`;

              return {
                title:
                  track.tracktitle ||
                  track.title ||
                  "Canción sin título",

                artist:
                  track.trackartist ||
                  id,

                artwork: getOptimizedArtworkUrl(source, key),
                started: track.started ?? "",
              };
            }),
          };
        } catch (error) {
          return {
            id,
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Error desconocido",
            recent: [],
          };
        }
      },
    ),
  );

  return NextResponse.json(stations, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}