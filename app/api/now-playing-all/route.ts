import { NextResponse } from "next/server";
import { radioBossStations } from "@/config/radiobossStations";

export const dynamic = "force-dynamic";

export async function GET() {
  const stations = await Promise.all(
    Object.entries(radioBossStations).map(async ([id, config]) => {
      try {
        const response = await fetch(
          `https://${config.server}/w/nowplayinginfo?u=${config.stationId}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        return {
          id,
          success: true,
          ...data,
        };
      } catch {
        return {
          id,
          success: false,
        };
      }
    })
  );

  return NextResponse.json(stations);
}