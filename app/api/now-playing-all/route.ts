import { NextResponse } from "next/server";
import { radioBossStations } from "@/config/radiobossStations";
import {
  getCurrentArtworkUrl,
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

            artwork:
              `${getCurrentArtworkUrl(config)}` +
              `?_=${Date.now()}`,

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

            recent: data.recent.map((track) => ({
              title:
                track.tracktitle ||
                track.title ||
                "Canción sin título",

              artist:
                track.trackartist ||
                id,

              artwork: getRecentArtworkUrl(
                config,
                track.artworkid,
              ),

              started: track.started ?? "",
            })),
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