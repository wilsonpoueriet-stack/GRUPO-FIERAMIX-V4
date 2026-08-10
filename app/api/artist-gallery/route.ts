import { getStore } from "@netlify/blobs";
import {
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORE_NAME = "fieramix-artist-gallery";
const MAX_FILE_SIZE = 8 * 1024 * 1024;

const LOCAL_GALLERY_DIRECTORY = path.join(
  process.cwd(),
  ".fieramix-data",
  "artist-gallery",
);

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type ArtistImageMetadata = {
  artist: string;
  slug: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  originalWidth: number | null;
  originalHeight: number | null;
  processedWidth: number | null;
  processedHeight: number | null;
  enhanced: boolean;
};

function clean(
  value: string | null | undefined,
): string {
  return (value ?? "").trim();
}

function getPrimaryArtist(value: string): string {
  const normalized = clean(value)
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  const splitPatterns = [
    /\s+feat(?:uring)?\.?\s+/i,
    /\s+ft\.?\s+/i,
    /\s+con\s+/i,
    /\s+featuring\s+/i,
  ];

  for (const pattern of splitPatterns) {
    const parts = normalized.split(pattern);

    if (
      parts.length > 1 &&
      clean(parts[0])
    ) {
      return clean(parts[0]);
    }
  }

  return normalized;
}

function normalizeArtist(value: string): string {
  return getPrimaryArtist(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function artistKey(artist: string): string {
  return `artists/${normalizeArtist(artist)}`;
}

function localImagePath(slug: string): string {
  return path.join(
    LOCAL_GALLERY_DIRECTORY,
    `${slug}.webp`,
  );
}

function localMetadataPath(slug: string): string {
  return path.join(
    LOCAL_GALLERY_DIRECTORY,
    `${slug}.json`,
  );
}

function arrayBufferFromBuffer(
  buffer: Buffer,
): ArrayBuffer {
  const arrayBuffer =
    new ArrayBuffer(buffer.byteLength);

  new Uint8Array(arrayBuffer).set(buffer);

  return arrayBuffer;
}

async function ensureLocalDirectory(): Promise<void> {
  await mkdir(
    LOCAL_GALLERY_DIRECTORY,
    {
      recursive: true,
    },
  );
}

async function enhanceArtistImage(
  input: ArrayBuffer,
): Promise<{
  arrayBuffer: ArrayBuffer;
  contentType: string;
  originalWidth: number | null;
  originalHeight: number | null;
  processedWidth: number | null;
  processedHeight: number | null;
}> {
  const source = Buffer.from(input);

  const inputMetadata =
    await sharp(source).metadata();

  const {
    data,
    info,
  } = await sharp(source, {
    failOn: "warning",
  })
    .rotate()
    .resize({
      width: 1800,
      height: 1800,
      fit: "inside",
      withoutEnlargement: false,
      kernel: "lanczos3",
    })
    .normalise({
      lower: 1,
      upper: 99,
    })
    .sharpen({
      sigma: 1,
      m1: 0.8,
      m2: 1.8,
      x1: 2,
      y2: 10,
      y3: 20,
    })
    .webp({
      quality: 94,
      effort: 5,
      smartSubsample: true,
    })
    .toBuffer({
      resolveWithObject: true,
    });

  return {
    arrayBuffer:
      arrayBufferFromBuffer(data),
    contentType: "image/webp",
    originalWidth:
      typeof inputMetadata.width === "number"
        ? inputMetadata.width
        : null,
    originalHeight:
      typeof inputMetadata.height === "number"
        ? inputMetadata.height
        : null,
    processedWidth:
      typeof info.width === "number"
        ? info.width
        : null,
    processedHeight:
      typeof info.height === "number"
        ? info.height
        : null,
  };
}

function isLocalRequest(
  request: Request,
): boolean {
  const host =
    new URL(request.url).hostname;

  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1"
  );
}

function isAuthorized(
  request: Request,
  suppliedKey?: string,
): boolean {
  const configuredKey = clean(
    process.env.ARTIST_GALLERY_ADMIN_KEY,
  );

  if (
    !configuredKey &&
    isLocalRequest(request)
  ) {
    return true;
  }

  if (!configuredKey) {
    return false;
  }

  const headerKey = clean(
    request.headers.get(
      "x-fieramix-admin-key",
    ),
  );

  return (
    suppliedKey === configuredKey ||
    headerKey === configuredKey
  );
}

function json(
  data: unknown,
  init?: ResponseInit,
): Response {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

function getStoreInstance() {
  return getStore({
    name: STORE_NAME,
    consistency: "strong",
  });
}

function publicArtistItem(
  metadata: ArtistImageMetadata,
) {
  return {
    artist: metadata.artist,
    slug: metadata.slug,
    contentType: metadata.contentType,
    size: metadata.size,
    uploadedAt: metadata.uploadedAt,
    enhanced: metadata.enhanced,
    originalWidth:
      metadata.originalWidth,
    originalHeight:
      metadata.originalHeight,
    processedWidth:
      metadata.processedWidth,
    processedHeight:
      metadata.processedHeight,
    imageUrl:
      `/api/artist-gallery?artist=${encodeURIComponent(
        metadata.artist,
      )}`,
  };
}

async function listLocalArtists() {
  await ensureLocalDirectory();

  const names = await readdir(
    LOCAL_GALLERY_DIRECTORY,
  );

  const metadataFiles = names.filter(
    (name) =>
      name.toLowerCase().endsWith(".json"),
  );

  const artists = await Promise.all(
    metadataFiles.map(async (name) => {
      try {
        const raw = await readFile(
          path.join(
            LOCAL_GALLERY_DIRECTORY,
            name,
          ),
          "utf8",
        );

        const metadata =
          JSON.parse(
            raw,
          ) as ArtistImageMetadata;

        return publicArtistItem(
          metadata,
        );
      } catch {
        return null;
      }
    }),
  );

  return artists
    .filter(
      (
        item,
      ): item is NonNullable<typeof item> =>
        Boolean(item),
    )
    .sort((a, b) =>
      a.artist.localeCompare(
        b.artist,
        "es",
      ),
    );
}

async function getLocalArtist(
  artist: string,
): Promise<{
  metadata: ArtistImageMetadata;
  data: ArrayBuffer;
} | null> {
  const slug =
    normalizeArtist(artist);

  if (!slug) {
    return null;
  }

  try {
    const [
      metadataRaw,
      imageBuffer,
    ] = await Promise.all([
      readFile(
        localMetadataPath(slug),
        "utf8",
      ),
      readFile(
        localImagePath(slug),
      ),
    ]);

    const metadata =
      JSON.parse(
        metadataRaw,
      ) as ArtistImageMetadata;

    return {
      metadata,
      data:
        arrayBufferFromBuffer(
          imageBuffer,
        ),
    };
  } catch {
    return null;
  }
}

async function saveLocalArtist(
  metadata: ArtistImageMetadata,
  data: ArrayBuffer,
): Promise<void> {
  await ensureLocalDirectory();

  await Promise.all([
    writeFile(
      localImagePath(
        metadata.slug,
      ),
      new Uint8Array(data),
    ),
    writeFile(
      localMetadataPath(
        metadata.slug,
      ),
      JSON.stringify(
        metadata,
        null,
        2,
      ),
      "utf8",
    ),
  ]);
}

async function deleteLocalArtist(
  artist: string,
): Promise<void> {
  const slug =
    normalizeArtist(artist);

  if (!slug) {
    return;
  }

  await Promise.all([
    rm(
      localImagePath(slug),
      {
        force: true,
      },
    ),
    rm(
      localMetadataPath(slug),
      {
        force: true,
      },
    ),
  ]);
}

async function listBlobArtists() {
  const store =
    getStoreInstance();

  const { blobs } =
    await store.list({
      prefix: "artists/",
    });

  const artists =
    await Promise.all(
      blobs.map(async (blob) => {
        const entry =
          await store.getMetadata(
            blob.key,
          );

        if (!entry) {
          return null;
        }

        const metadata =
          entry.metadata as
            Partial<ArtistImageMetadata>;

        const artistName =
          clean(metadata.artist) ||
          blob.key.replace(
            /^artists\//,
            "",
          );

        const fullMetadata:
          ArtistImageMetadata = {
          artist: artistName,
          slug:
            clean(metadata.slug) ||
            normalizeArtist(
              artistName,
            ),
          contentType:
            clean(
              metadata.contentType,
            ) || "image/webp",
          size:
            typeof metadata.size ===
            "number"
              ? metadata.size
              : 0,
          uploadedAt:
            clean(
              metadata.uploadedAt,
            ) || "",
          originalWidth:
            typeof metadata.originalWidth ===
            "number"
              ? metadata.originalWidth
              : null,
          originalHeight:
            typeof metadata.originalHeight ===
            "number"
              ? metadata.originalHeight
              : null,
          processedWidth:
            typeof metadata.processedWidth ===
            "number"
              ? metadata.processedWidth
              : null,
          processedHeight:
            typeof metadata.processedHeight ===
            "number"
              ? metadata.processedHeight
              : null,
          enhanced:
            metadata.enhanced === true,
        };

        return publicArtistItem(
          fullMetadata,
        );
      }),
    );

  return artists
    .filter(
      (
        item,
      ): item is NonNullable<typeof item> =>
        Boolean(item),
    )
    .sort((a, b) =>
      a.artist.localeCompare(
        b.artist,
        "es",
      ),
    );
}

export async function GET(
  request: Request,
): Promise<Response> {
  const url =
    new URL(request.url);

  const artist = clean(
    url.searchParams.get(
      "artist",
    ),
  );

  const shouldList =
    url.searchParams.get(
      "list",
    ) === "1";

  const local =
    isLocalRequest(request);

  try {
    if (shouldList) {
      const artists = local
        ? await listLocalArtists()
        : await listBlobArtists();

      return json({
        ok: true,
        storage: local
          ? "local"
          : "netlify-blobs",
        total:
          artists.length,
        artists,
      });
    }

    if (!artist) {
      return json(
        {
          ok: false,
          error:
            "Debes indicar el artista con ?artist=Nombre del artista.",
        },
        {
          status: 400,
        },
      );
    }

    const slug =
      normalizeArtist(artist);

    if (!slug) {
      return json(
        {
          ok: false,
          error:
            "El nombre del artista no es válido.",
        },
        {
          status: 400,
        },
      );
    }

    if (local) {
      const entry =
        await getLocalArtist(
          artist,
        );

      if (!entry) {
        return json(
          {
            ok: false,
            found: false,
            artist:
              getPrimaryArtist(
                artist,
              ),
            slug,
          },
          {
            status: 404,
          },
        );
      }

      return new Response(
        entry.data,
        {
          status: 200,
          headers: {
            "Content-Type":
              entry.metadata
                .contentType ||
              "image/webp",
            "Cache-Control":
              "no-store",
            "X-Fieramix-Artist":
              entry.metadata.artist,
            "X-Fieramix-Artist-Slug":
              slug,
            "X-Fieramix-Storage":
              "local",
          },
        },
      );
    }

    const store =
      getStoreInstance();

    const entry =
      await store.getWithMetadata(
        artistKey(artist),
        {
          type: "stream",
        },
      );

    if (
      !entry ||
      !entry.data
    ) {
      return json(
        {
          ok: false,
          found: false,
          artist:
            getPrimaryArtist(
              artist,
            ),
          slug,
        },
        {
          status: 404,
        },
      );
    }

    const metadata =
      entry.metadata as
        Partial<ArtistImageMetadata>;

    return new Response(
      entry.data,
      {
        status: 200,
        headers: {
          "Content-Type":
            clean(
              metadata.contentType,
            ) ||
            "image/webp",
          "Cache-Control":
            "public, max-age=3600, stale-while-revalidate=86400",
          "X-Fieramix-Artist":
            clean(
              metadata.artist,
            ) ||
            getPrimaryArtist(
              artist,
            ),
          "X-Fieramix-Artist-Slug":
            slug,
          "X-Fieramix-Storage":
            "netlify-blobs",
        },
      },
    );
  } catch (error) {
    console.error(
      "No fue posible leer la galería de artistas.",
      error,
    );

    return json(
      {
        ok: false,
        error:
          "No fue posible leer la galería de artistas.",
      },
      {
        status: 503,
      },
    );
  }
}

export async function POST(
  request: Request,
): Promise<Response> {
  try {
    const formData =
      await request.formData();

    const artist = clean(
      String(
        formData.get(
          "artist",
        ) ?? "",
      ),
    );

    const adminKey = clean(
      String(
        formData.get(
          "adminKey",
        ) ?? "",
      ),
    );

    const fileValue =
      formData.get("file");

    if (
      !isAuthorized(
        request,
        adminKey,
      )
    ) {
      return json(
        {
          ok: false,
          error:
            "No autorizado.",
          hint:
            "Configura ARTIST_GALLERY_ADMIN_KEY en Netlify para proteger las cargas.",
        },
        {
          status: 401,
        },
      );
    }

    if (!artist) {
      return json(
        {
          ok: false,
          error:
            "Debes indicar el nombre del artista.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !(
        fileValue instanceof
        File
      )
    ) {
      return json(
        {
          ok: false,
          error:
            "Debes seleccionar una imagen.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !ALLOWED_TYPES.has(
        fileValue.type,
      )
    ) {
      return json(
        {
          ok: false,
          error:
            "Formato no permitido. Usa JPG, PNG o WEBP.",
        },
        {
          status: 415,
        },
      );
    }

    if (
      fileValue.size <= 0
    ) {
      return json(
        {
          ok: false,
          error:
            "La imagen está vacía.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      fileValue.size >
      MAX_FILE_SIZE
    ) {
      return json(
        {
          ok: false,
          error:
            "La imagen supera el límite de 8 MB.",
        },
        {
          status: 413,
        },
      );
    }

    const primaryArtist =
      getPrimaryArtist(
        artist,
      );

    const slug =
      normalizeArtist(
        primaryArtist,
      );

    if (!slug) {
      return json(
        {
          ok: false,
          error:
            "El nombre del artista no es válido.",
        },
        {
          status: 400,
        },
      );
    }

    const originalBytes =
      await fileValue.arrayBuffer();

    const enhanced =
      await enhanceArtistImage(
        originalBytes,
      );

    const uploadedAt =
      new Date().toISOString();

    const metadata:
      ArtistImageMetadata = {
      artist:
        primaryArtist,
      slug,
      contentType:
        enhanced.contentType,
      size:
        enhanced.arrayBuffer
          .byteLength,
      uploadedAt,
      originalWidth:
        enhanced.originalWidth,
      originalHeight:
        enhanced.originalHeight,
      processedWidth:
        enhanced.processedWidth,
      processedHeight:
        enhanced.processedHeight,
      enhanced: true,
    };

    const local =
      isLocalRequest(
        request,
      );

    if (local) {
      await saveLocalArtist(
        metadata,
        enhanced.arrayBuffer,
      );
    } else {
      const store =
        getStoreInstance();

      await store.set(
        artistKey(
          primaryArtist,
        ),
        enhanced.arrayBuffer,
        {
          metadata,
        },
      );
    }

    return json({
      ok: true,
      storage: local
        ? "local"
        : "netlify-blobs",
      artist:
        primaryArtist,
      slug,
      uploadedAt,
      enhanced: true,
      original: {
        width:
          enhanced.originalWidth,
        height:
          enhanced.originalHeight,
        size:
          fileValue.size,
        contentType:
          fileValue.type,
      },
      processed: {
        width:
          enhanced.processedWidth,
        height:
          enhanced.processedHeight,
        size:
          enhanced.arrayBuffer
            .byteLength,
        contentType:
          enhanced.contentType,
      },
      imageUrl:
        `/api/artist-gallery?artist=${encodeURIComponent(
          primaryArtist,
        )}&v=${encodeURIComponent(
          uploadedAt,
        )}`,
      message: local
        ? "Imagen optimizada y guardada en la galería local."
        : "Imagen optimizada y guardada en la galería oficial.",
    });
  } catch (error) {
    console.error(
      "No fue posible procesar o guardar la imagen del artista.",
      error,
    );

    return json(
      {
        ok: false,
        error:
          "No fue posible procesar o guardar la imagen del artista.",
      },
      {
        status: 503,
      },
    );
  }
}

export async function DELETE(
  request: Request,
): Promise<Response> {
  try {
    const body =
      (await request.json()) as {
        artist?: string;
        adminKey?: string;
      };

    const artist =
      clean(body.artist);

    const adminKey =
      clean(body.adminKey);

    if (
      !isAuthorized(
        request,
        adminKey,
      )
    ) {
      return json(
        {
          ok: false,
          error:
            "No autorizado.",
        },
        {
          status: 401,
        },
      );
    }

    if (!artist) {
      return json(
        {
          ok: false,
          error:
            "Debes indicar el artista.",
        },
        {
          status: 400,
        },
      );
    }

    const local =
      isLocalRequest(
        request,
      );

    if (local) {
      await deleteLocalArtist(
        artist,
      );
    } else {
      const store =
        getStoreInstance();

      await store.delete(
        artistKey(
          artist,
        ),
      );
    }

    return json({
      ok: true,
      storage: local
        ? "local"
        : "netlify-blobs",
      artist:
        getPrimaryArtist(
          artist,
        ),
      message:
        "Imagen del artista eliminada correctamente.",
    });
  } catch (error) {
    console.error(
      "No fue posible eliminar la imagen del artista.",
      error,
    );

    return json(
      {
        ok: false,
        error:
          "No fue posible eliminar la imagen del artista.",
      },
      {
        status: 503,
      },
    );
  }
}
