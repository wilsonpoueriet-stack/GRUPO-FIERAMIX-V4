import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_SERVERS = new Set([
  "c11.radioboss.fm",
  "c13.radioboss.fm",
  "c15.radioboss.fm",
]);

type RecentTrack = {
  title?: string;
  trackartist?: string;
  tracktitle?: string;
  artworkid?: string;
  started?: string;
};

export async function GET(request: NextRequest) {
  const server =
    request.nextUrl.searchParams.get("server") ?? "c15.radioboss.fm";

  const stationId =
    request.nextUrl.searchParams.get("station") ?? "221";

  if (!ALLOWED_SERVERS.has(server)) {
    return NextResponse.json(
      { error: "Servidor RadioBOSS no permitido" },
      { status: 400 },
    );
  }

  if (!/^\d+$/.test(stationId)) {
    return NextResponse.json(
      { error: "Station ID inválido" },
      { status: 400 },
    );
  }

  const timestamp = Date.now();

  const nowPlayingEndpoint =
    `https://${server}/w/nowplayinginfo` +
    `?u=${encodeURIComponent(stationId)}` +
    `&_=${timestamp}`;

  const recentEndpoint =
    `https://${server}/w/recenttrackslist` +
    `?u=${encodeURIComponent(stationId)}` +
    `&_=${timestamp}`;

  try {
    const [nowPlayingResponse, recentResponse] = await Promise.all([
      fetch(nowPlayingEndpoint, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }),

      fetch(recentEndpoint, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }),
    ]);

    if (!nowPlayingResponse.ok) {
      return NextResponse.json(
        {
          error: `RadioBOSS nowplaying respondió ${nowPlayingResponse.status}`,
        },
        { status: 502 },
      );
    }

    const nowPlaying = await nowPlayingResponse.json();

    let recent: RecentTrack[] = [];

    if (recentResponse.ok) {
      const recentPayload = (await recentResponse.json()) as
        | RecentTrack[]
        | { error?: string };

      if (Array.isArray(recentPayload)) {
        recent = recentPayload.slice(1, 11);
      }
    }

    return NextResponse.json(
      {
        ...nowPlaying,
        recent,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo conectar con RadioBOSS",
      },
      { status: 502 },
    );
  }
}