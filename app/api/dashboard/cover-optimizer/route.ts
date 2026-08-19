import sharp from "sharp";
import { getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TARGET_SIZE = 600;
const TARGET_MAX_BYTES = 200 * 1024;
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function safeBaseName(value: string): string {
  const withoutExtension = value.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  return normalized || "portada-fieramix";
}

async function encodeJpeg(source: Buffer, quality: number): Promise<Buffer> {
  return sharp(source, { failOn: "warning" })
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

export async function POST(request: Request): Promise<Response> {
  const session = await getAdminSession();

  if (!session) {
    return json({ ok: false, error: "Sesión administrativa requerida." }, 401);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return json({ ok: false, error: "No fue posible leer la imagen." }, 400);
  }

  const fileValue = formData.get("file");

  if (!(fileValue instanceof File)) {
    return json({ ok: false, error: "Selecciona una portada para optimizar." }, 400);
  }

  if (!ALLOWED_TYPES.has(fileValue.type)) {
    return json({ ok: false, error: "Usa una imagen JPG, PNG o WebP." }, 415);
  }

  if (fileValue.size <= 0 || fileValue.size > MAX_UPLOAD_BYTES) {
    return json({ ok: false, error: "La portada debe pesar menos de 12 MB." }, 413);
  }

  try {
    const input = Buffer.from(await fileValue.arrayBuffer());
    const metadata = await sharp(input).metadata();
    const originalWidth = typeof metadata.width === "number" ? metadata.width : 0;
    const originalHeight = typeof metadata.height === "number" ? metadata.height : 0;

    if (!originalWidth || !originalHeight) {
      return json({ ok: false, error: "No fue posible identificar las dimensiones de la imagen." }, 400);
    }

    const qualities = [84, 80, 76, 72, 68, 64];
    let output = await encodeJpeg(input, qualities[0]);
    let selectedQuality = qualities[0];

    for (const quality of qualities.slice(1)) {
      if (output.byteLength <= TARGET_MAX_BYTES) break;
      output = await encodeJpeg(input, quality);
      selectedQuality = quality;
    }

    const fileName = `${safeBaseName(fileValue.name)}-600x600.jpg`;
    const sourceSmall = originalWidth < TARGET_SIZE || originalHeight < TARGET_SIZE;

    return new Response(new Uint8Array(output), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, max-age=0",
        "X-Fieramix-File-Name": fileName,
        "X-Fieramix-Original-Width": String(originalWidth),
        "X-Fieramix-Original-Height": String(originalHeight),
        "X-Fieramix-Original-Bytes": String(fileValue.size),
        "X-Fieramix-Processed-Width": String(TARGET_SIZE),
        "X-Fieramix-Processed-Height": String(TARGET_SIZE),
        "X-Fieramix-Processed-Bytes": String(output.byteLength),
        "X-Fieramix-Jpeg-Quality": String(selectedQuality),
        "X-Fieramix-Source-Small": sourceSmall ? "1" : "0",
      },
    });
  } catch (error) {
    console.error("No fue posible optimizar la portada.", error);
    return json({ ok: false, error: "No fue posible procesar esta imagen." }, 500);
  }
}
