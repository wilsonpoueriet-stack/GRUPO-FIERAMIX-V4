import sharp from "sharp";
import { radioBossStations } from "@/config/radiobossStations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TARGET_SIZE = 600;
const TARGET_BYTES = 200 * 1024;
const ALLOWED_HOSTS = new Set(
  Object.values(radioBossStations).map((station) => station.server),
);

function isAllowedArtworkUrl(value: string): URL | null {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") return null;
    if (!ALLOWED_HOSTS.has(url.hostname)) return null;
    if (!url.pathname.startsWith("/w/artwork")) return null;

    return url;
  } catch {
    return null;
  }
}

async function encodeArtwork(input: Buffer, quality: number): Promise<Buffer> {
  return sharp(input, { failOn: "warning" })
    .rotate()
    .resize(TARGET_SIZE, TARGET_SIZE, {
      fit: "cover",
      position: "centre",
      kernel: "lanczos3",
      withoutEnlargement: false,
    })
    .flatten({ background: "#ffffff" })
    .jpeg({
      quality,
      progressive: true,
      chromaSubsampling: "4:2:0",
      mozjpeg: true,
    })
    .toBuffer();
}

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const rawSource = requestUrl.searchParams.get("src")?.trim() || "";
  const cacheKey = requestUrl.searchParams.get("key")?.trim() || "";
  const sourceUrl = isAllowedArtworkUrl(rawSource);

  if (!sourceUrl) {
    return Response.json(
      { ok: false, error: "URL de portada no permitida." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(sourceUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: {
        Accept: "image/avif,image/webp,image/jpeg,image/png,image/*,*/*;q=0.8",
      },
    });

    if (!upstream.ok) {
      return Response.json(
        { ok: false, error: `RadioBOSS respondió ${upstream.status}.` },
        { status: 502 },
      );
    }

    const input = Buffer.from(await upstream.arrayBuffer());
    const metadata = await sharp(input).metadata();
    const originalWidth = metadata.width ?? 0;
    const originalHeight = metadata.height ?? 0;
    const qualities = [84, 80, 76, 72, 68, 64, 60];

    let output = await encodeArtwork(input, qualities[0]);
    let selectedQuality = qualities[0];

    for (const quality of qualities.slice(1)) {
      if (output.byteLength <= TARGET_BYTES) break;
      output = await encodeArtwork(input, quality);
      selectedQuality = quality;
    }

    const cacheControl = cacheKey
      ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
      : "public, max-age=30, s-maxage=60, stale-while-revalidate=300";

    return new Response(new Uint8Array(output), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": cacheControl,
        "X-Fieramix-Artwork": "optimized-600x600",
        "X-Fieramix-Original-Width": String(originalWidth),
        "X-Fieramix-Original-Height": String(originalHeight),
        "X-Fieramix-Original-Bytes": String(input.byteLength),
        "X-Fieramix-Processed-Bytes": String(output.byteLength),
        "X-Fieramix-Jpeg-Quality": String(selectedQuality),
      },
    });
  } catch (error) {
    console.error("No fue posible normalizar la portada de RadioBOSS.", error);
    return Response.json(
      { ok: false, error: "No fue posible procesar la portada." },
      { status: 502 },
    );
  }
}
