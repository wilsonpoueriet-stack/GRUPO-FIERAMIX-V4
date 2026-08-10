"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ArtistGalleryItem = {
  artist: string;
  slug: string;
  contentType: string;
  size: number;
  uploadedAt: string | null;
  enhanced?: boolean;
  originalWidth?: number | null;
  originalHeight?: number | null;
  processedWidth?: number | null;
  processedHeight?: number | null;
  imageUrl: string;
};

type ArtistGalleryListResponse = {
  ok: boolean;
  total?: number;
  artists?: ArtistGalleryItem[];
  error?: string;
  hint?: string;
};

type ArtistGalleryUploadResponse = {
  ok: boolean;
  artist?: string;
  slug?: string;
  uploadedAt?: string;
  enhanced?: boolean;
  imageUrl?: string;
  message?: string;
  error?: string;
  hint?: string;
  original?: {
    width: number | null;
    height: number | null;
    size: number;
    contentType: string;
  };
  processed?: {
    width: number | null;
    height: number | null;
    size: number;
    contentType: string;
  };
};

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 8 * 1024 * 1024;

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "—";
  }

  if (value < 1024) {
    return `${Math.round(value)} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "SIN FECHA";
  }

  try {
    return new Intl.DateTimeFormat("es-DO", {
      timeZone: "America/Santo_Domingo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
      .format(new Date(value))
      .toUpperCase();
  } catch {
    return "SIN FECHA";
  }
}

function resolution(
  width?: number | null,
  height?: number | null,
): string {
  if (!width || !height) {
    return "—";
  }

  return `${width} × ${height}`;
}

export default function ArtistGalleryPage() {
  const [artist, setArtist] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [artists, setArtists] = useState<
    ArtistGalleryItem[]
  >([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingSlug, setDeletingSlug] =
    useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [environmentHint, setEnvironmentHint] =
    useState("");
  const [lastUpload, setLastUpload] =
    useState<ArtistGalleryUploadResponse | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const loadArtists = useCallback(async () => {
    setLoading(true);
    setError("");
    setEnvironmentHint("");

    try {
      const response = await fetch(
        "/api/artist-gallery?list=1",
        {
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as ArtistGalleryListResponse;

      if (!response.ok || !data.ok) {
        setArtists([]);
        setError(
          data.error ||
            "No fue posible cargar la galería.",
        );
        setEnvironmentHint(data.hint || "");
        return;
      }

      setArtists(data.artists ?? []);
    } catch (loadError) {
      console.error(
        "No fue posible cargar la galería de artistas.",
        loadError,
      );

      setArtists([]);
      setError(
        "No fue posible conectar con la galería de artistas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadArtists();
  }, [loadArtists]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const filteredArtists = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("es");

    if (!query) {
      return artists;
    }

    return artists.filter((item) =>
      item.artist
        .toLocaleLowerCase("es")
        .includes(query),
    );
  }, [artists, search]);

  const selectFile = useCallback((file: File) => {
    setError("");
    setMessage("");
    setLastUpload(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setSelectedFile(null);
      setError(
        "Formato no permitido. Usa JPG, PNG o WEBP.",
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setError(
        "La imagen supera el límite de 8 MB.",
      );
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl]);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (file) {
      selectFile(file);
    }
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      selectFile(file);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanArtist = artist.trim();

    setError("");
    setMessage("");
    setEnvironmentHint("");
    setLastUpload(null);

    if (!cleanArtist) {
      setError("Escribe el nombre del artista.");
      return;
    }

    if (!selectedFile) {
      setError("Selecciona una imagen.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("artist", cleanArtist);
      formData.append("file", selectedFile);

      if (adminKey.trim()) {
        formData.append("adminKey", adminKey.trim());
      }

      const response = await fetch(
        "/api/artist-gallery",
        {
          method: "POST",
          body: formData,
        },
      );

      const data =
        (await response.json()) as ArtistGalleryUploadResponse;

      if (!response.ok || !data.ok) {
        setError(
          data.error ||
            "No fue posible guardar la imagen.",
        );
        setEnvironmentHint(data.hint || "");
        return;
      }

      setLastUpload(data);
      setMessage(
        data.message ||
          "Imagen guardada correctamente.",
      );

      setArtist("");
      setSelectedFile(null);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl("");

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      await loadArtists();
    } catch (uploadError) {
      console.error(
        "No fue posible subir la imagen.",
        uploadError,
      );

      setError(
        "No fue posible conectar con la galería.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(
    item: ArtistGalleryItem,
  ) {
    const confirmed = window.confirm(
      `¿Eliminar la imagen de ${item.artist}?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingSlug(item.slug);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/artist-gallery",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            artist: item.artist,
            adminKey: adminKey.trim() || undefined,
          }),
        },
      );

      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setError(
          data.error ||
            "No fue posible eliminar la imagen.",
        );
        return;
      }

      setMessage(
        data.message ||
          "Imagen eliminada correctamente.",
      );

      await loadArtists();
    } catch (deleteError) {
      console.error(
        "No fue posible eliminar la imagen.",
        deleteError,
      );

      setError(
        "No fue posible conectar con la galería.",
      );
    } finally {
      setDeletingSlug(null);
    }
  }

  function prepareReplacement(
    item: ArtistGalleryItem,
  ) {
    setArtist(item.artist);
    setMessage(
      `Listo para reemplazar la imagen de ${item.artist}.`,
    );
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="artistGalleryPage">
      <div className="artistGalleryGlow artistGalleryGlowOne" />
      <div className="artistGalleryGlow artistGalleryGlowTwo" />

      <section className="artistGalleryShell">
        <header className="artistGalleryHeader">
          <a
            className="artistGalleryBack"
            href="/"
          >
            ← VOLVER AL PORTAL
          </a>

          <div className="artistGalleryBrand">
            <span>EL GRUPO FIERAMIX.COM</span>
            <small>
              LA RED LATINA QUE MUEVE AL MUNDO
            </small>
          </div>
        </header>

        <section className="artistGalleryHero">
          <div>
            <span className="artistGalleryEyebrow">
              BIBLIOTECA VISUAL DE LA RED
            </span>

            <h1>GALERÍA DE ARTISTAS</h1>

            <p>
              Carga una sola imagen exclusiva por artista.
              Cuando una canción llegue sin portada, el
              sistema podrá usar automáticamente la foto
              registrada aquí.
            </p>
          </div>

          <div className="artistGalleryStats">
            <strong>{artists.length}</strong>
            <span>
              {artists.length === 1
                ? "ARTISTA REGISTRADO"
                : "ARTISTAS REGISTRADOS"}
            </span>
          </div>
        </section>

        <section className="artistGalleryWorkspace">
          <form
            className="artistGalleryUploader"
            onSubmit={handleSubmit}
          >
            <div className="artistGallerySectionTitle">
              <span>01</span>
              <div>
                <h2>AGREGAR O REEMPLAZAR</h2>
                <p>
                  El nombre del artista será la llave para
                  encontrar esta imagen.
                </p>
              </div>
            </div>

            <label className="artistGalleryField">
              <span>NOMBRE DEL ARTISTA</span>
              <input
                type="text"
                value={artist}
                onChange={(event) =>
                  setArtist(event.target.value)
                }
                placeholder="Ej.: Frank Reyes"
                autoComplete="off"
              />
            </label>

            <div
              className={`artistGalleryDropzone ${
                dragging
                  ? "artistGalleryDropzoneActive"
                  : ""
              }`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragging(false);
              }}
              onDrop={handleDrop}
              onClick={() =>
                inputRef.current?.click()
              }
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  inputRef.current?.click();
                }
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                hidden
              />

              {previewUrl ? (
                <div className="artistGalleryPreview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                  />

                  <div>
                    <strong>
                      {selectedFile?.name}
                    </strong>
                    <span>
                      {selectedFile
                        ? formatBytes(
                            selectedFile.size,
                          )
                        : ""}
                    </span>
                    <small>
                      TOCA PARA CAMBIAR LA IMAGEN
                    </small>
                  </div>
                </div>
              ) : (
                <div className="artistGalleryDropzoneEmpty">
                  <div className="artistGalleryUploadIcon">
                    ↑
                  </div>
                  <strong>
                    SELECCIONA O ARRASTRA UNA FOTO
                  </strong>
                  <span>
                    JPG, PNG O WEBP · MÁXIMO 8 MB
                  </span>
                  <small>
                    La imagen será optimizada
                    automáticamente antes de guardarse.
                  </small>
                </div>
              )}
            </div>

            <label className="artistGalleryField artistGalleryAdminField">
              <span>
                CLAVE DE ADMINISTRACIÓN
                <small> OPCIONAL EN LOCAL</small>
              </span>
              <input
                type="password"
                value={adminKey}
                onChange={(event) =>
                  setAdminKey(event.target.value)
                }
                placeholder="Clave de la galería"
                autoComplete="current-password"
              />
            </label>

            <button
              className="artistGallerySubmit"
              type="submit"
              disabled={uploading}
            >
              {uploading
                ? "PROCESANDO IMAGEN..."
                : "GUARDAR IMAGEN DEL ARTISTA"}
            </button>

            <div className="artistGalleryQuality">
              <span>MEJORA AUTOMÁTICA</span>
              <p>
                Orientación, resolución, contraste,
                enfoque y optimización WebP de alta
                calidad.
              </p>
            </div>

            {error ? (
              <div className="artistGalleryAlert artistGalleryAlertError">
                <strong>NO SE PUDO COMPLETAR</strong>
                <span>{error}</span>
                {environmentHint ? (
                  <small>{environmentHint}</small>
                ) : null}
              </div>
            ) : null}

            {message ? (
              <div className="artistGalleryAlert artistGalleryAlertSuccess">
                <strong>LISTO</strong>
                <span>{message}</span>
              </div>
            ) : null}

            {lastUpload?.processed ? (
              <div className="artistGalleryResult">
                <span>IMAGEN OPTIMIZADA</span>

                <div>
                  <strong>
                    {
                      lastUpload.processed.width
                    }{" "}
                    ×{" "}
                    {
                      lastUpload.processed.height
                    }
                  </strong>
                  <small>
                    {formatBytes(
                      lastUpload.processed.size,
                    )}
                  </small>
                </div>
              </div>
            ) : null}
          </form>

          <section className="artistGalleryLibrary">
            <div className="artistGallerySectionTitle">
              <span>02</span>
              <div>
                <h2>ARTISTAS REGISTRADOS</h2>
                <p>
                  Una imagen puede respaldar todas las
                  canciones de ese artista.
                </p>
              </div>
            </div>

            <label className="artistGallerySearch">
              <span>⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Buscar artista..."
              />
            </label>

            {loading ? (
              <div className="artistGalleryEmpty">
                <strong>
                  CARGANDO GALERÍA...
                </strong>
              </div>
            ) : filteredArtists.length === 0 ? (
              <div className="artistGalleryEmpty">
                <div>♪</div>
                <strong>
                  {search
                    ? "NO HAY COINCIDENCIAS"
                    : "AÚN NO HAY ARTISTAS"}
                </strong>
                <p>
                  {search
                    ? "Prueba con otro nombre."
                    : "La primera imagen que subas aparecerá aquí."}
                </p>
              </div>
            ) : (
              <div className="artistGalleryGrid">
                {filteredArtists.map((item) => (
                  <article
                    key={item.slug}
                    className="artistGalleryCard"
                  >
                    <div className="artistGalleryCardImage">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${item.imageUrl}${
                          item.imageUrl.includes("?")
                            ? "&"
                            : "?"
                        }v=${encodeURIComponent(
                          item.uploadedAt ?? "",
                        )}`}
                        alt={item.artist}
                      />

                      {item.enhanced ? (
                        <span>
                          OPTIMIZADA
                        </span>
                      ) : null}
                    </div>

                    <div className="artistGalleryCardBody">
                      <h3>{item.artist}</h3>

                      <div className="artistGalleryCardMeta">
                        <span>
                          RESOLUCIÓN
                          <strong>
                            {resolution(
                              item.processedWidth,
                              item.processedHeight,
                            )}
                          </strong>
                        </span>

                        <span>
                          ARCHIVO
                          <strong>
                            {formatBytes(item.size)}
                          </strong>
                        </span>
                      </div>

                      <small>
                        ACTUALIZADA{" "}
                        {formatDate(item.uploadedAt)}
                      </small>

                      <div className="artistGalleryCardActions">
                        <button
                          type="button"
                          onClick={() =>
                            prepareReplacement(item)
                          }
                        >
                          REEMPLAZAR
                        </button>

                        <button
                          type="button"
                          className="artistGalleryDelete"
                          onClick={() =>
                            void handleDelete(item)
                          }
                          disabled={
                            deletingSlug === item.slug
                          }
                        >
                          {deletingSlug ===
                          item.slug
                            ? "ELIMINANDO..."
                            : "ELIMINAR"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </section>

      <style jsx>{`
        :global(body) {
          margin: 0;
          background:
            radial-gradient(
              circle at top left,
              rgba(27, 90, 255, 0.12),
              transparent 34%
            ),
            #030711;
        }

        :global(*) {
          box-sizing: border-box;
        }

        .artistGalleryPage {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            linear-gradient(
              180deg,
              rgba(3, 7, 17, 0.86),
              rgba(2, 5, 12, 0.98)
            );
          color: #ffffff;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .artistGalleryGlow {
          position: fixed;
          pointer-events: none;
          border-radius: 999px;
          filter: blur(90px);
          opacity: 0.18;
        }

        .artistGalleryGlowOne {
          top: -180px;
          left: -120px;
          width: 520px;
          height: 520px;
          background: #146cff;
        }

        .artistGalleryGlowTwo {
          right: -180px;
          bottom: 8%;
          width: 460px;
          height: 460px;
          background: #12d9c5;
        }

        .artistGalleryShell {
          position: relative;
          z-index: 1;
          width: min(1500px, calc(100% - 40px));
          margin: 0 auto;
          padding: 30px 0 80px;
        }

        .artistGalleryHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 12px 0 34px;
        }

        .artistGalleryBack {
          color: #87eaff;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-decoration: none;
        }

        .artistGalleryBrand {
          display: grid;
          justify-items: end;
          gap: 3px;
          text-align: right;
        }

        .artistGalleryBrand span {
          color: #ffffff;
          font-size: 15px;
          font-weight: 1000;
          letter-spacing: 0.015em;
        }

        .artistGalleryBrand small {
          color: #63def7;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.045em;
        }

        .artistGalleryHero {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr) auto;
          align-items: end;
          gap: 36px;
          padding: 40px;
          border: 1px solid
            rgba(106, 211, 255, 0.16);
          border-radius: 28px;
          background:
            linear-gradient(
              135deg,
              rgba(15, 38, 81, 0.8),
              rgba(5, 13, 31, 0.92)
            );
          box-shadow:
            0 30px 90px rgba(0, 0, 0, 0.36),
            inset 0 1px 0
              rgba(255, 255, 255, 0.05);
        }

        .artistGalleryEyebrow {
          display: inline-block;
          margin-bottom: 10px;
          color: #ffca68;
          font-size: 11px;
          font-weight: 1000;
          letter-spacing: 0.15em;
        }

        .artistGalleryHero h1 {
          margin: 0;
          font-size: clamp(38px, 5vw, 72px);
          line-height: 0.98;
          letter-spacing: -0.045em;
        }

        .artistGalleryHero p {
          max-width: 760px;
          margin: 18px 0 0;
          color: rgba(255, 255, 255, 0.68);
          font-size: 15px;
          font-weight: 650;
          line-height: 1.6;
        }

        .artistGalleryStats {
          display: grid;
          min-width: 190px;
          justify-items: center;
          gap: 4px;
          padding: 22px 26px;
          border: 1px solid
            rgba(83, 226, 255, 0.15);
          border-radius: 22px;
          background: rgba(0, 0, 0, 0.2);
          text-align: center;
        }

        .artistGalleryStats strong {
          color: #63e6ff;
          font-size: 44px;
          line-height: 1;
        }

        .artistGalleryStats span {
          color: rgba(255, 255, 255, 0.52);
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 0.1em;
        }

        .artistGalleryWorkspace {
          display: grid;
          grid-template-columns:
            minmax(340px, 0.82fr)
            minmax(0, 1.7fr);
          gap: 24px;
          margin-top: 24px;
        }

        .artistGalleryUploader,
        .artistGalleryLibrary {
          border: 1px solid
            rgba(255, 255, 255, 0.08);
          border-radius: 26px;
          background:
            linear-gradient(
              180deg,
              rgba(8, 18, 40, 0.92),
              rgba(4, 10, 24, 0.96)
            );
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.26);
        }

        .artistGalleryUploader {
          align-self: start;
          padding: 24px;
        }

        .artistGalleryLibrary {
          padding: 24px;
        }

        .artistGallerySectionTitle {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 22px;
        }

        .artistGallerySectionTitle > span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border: 1px solid
            rgba(92, 224, 255, 0.16);
          border-radius: 10px;
          background: rgba(69, 209, 255, 0.08);
          color: #66e7ff;
          font-size: 10px;
          font-weight: 1000;
        }

        .artistGallerySectionTitle h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 1000;
          letter-spacing: 0.04em;
        }

        .artistGallerySectionTitle p {
          margin: 5px 0 0;
          color: rgba(255, 255, 255, 0.48);
          font-size: 11px;
          font-weight: 650;
          line-height: 1.4;
        }

        .artistGalleryField {
          display: grid;
          gap: 8px;
          margin-top: 16px;
        }

        .artistGalleryField > span {
          color: rgba(255, 255, 255, 0.62);
          font-size: 9px;
          font-weight: 1000;
          letter-spacing: 0.1em;
        }

        .artistGalleryField > span small {
          color: rgba(255, 255, 255, 0.3);
          font-size: 8px;
        }

        .artistGalleryField input,
        .artistGallerySearch input {
          width: 100%;
          border: 1px solid
            rgba(255, 255, 255, 0.09);
          outline: none;
          background: rgba(0, 0, 0, 0.22);
          color: #ffffff;
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease;
        }

        .artistGalleryField input {
          height: 48px;
          padding: 0 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 750;
        }

        .artistGalleryField input:focus,
        .artistGallerySearch input:focus {
          border-color: rgba(79, 222, 255, 0.48);
          box-shadow:
            0 0 0 3px
              rgba(34, 190, 255, 0.08);
        }

        .artistGalleryDropzone {
          min-height: 300px;
          margin-top: 16px;
          padding: 14px;
          border: 1px dashed
            rgba(102, 222, 255, 0.24);
          border-radius: 18px;
          background:
            linear-gradient(
              145deg,
              rgba(14, 43, 85, 0.32),
              rgba(0, 0, 0, 0.18)
            );
          cursor: pointer;
          transition:
            transform 150ms ease,
            border-color 150ms ease,
            background 150ms ease;
        }

        .artistGalleryDropzone:hover,
        .artistGalleryDropzoneActive {
          transform: translateY(-1px);
          border-color: rgba(102, 232, 255, 0.65);
          background:
            linear-gradient(
              145deg,
              rgba(14, 71, 125, 0.4),
              rgba(0, 0, 0, 0.18)
            );
        }

        .artistGalleryDropzoneEmpty {
          display: grid;
          min-height: 270px;
          place-items: center;
          align-content: center;
          gap: 8px;
          text-align: center;
        }

        .artistGalleryUploadIcon {
          display: grid;
          width: 54px;
          height: 54px;
          place-items: center;
          margin-bottom: 6px;
          border: 1px solid
            rgba(86, 226, 255, 0.2);
          border-radius: 16px;
          background: rgba(74, 218, 255, 0.08);
          color: #69e8ff;
          font-size: 26px;
          font-weight: 400;
        }

        .artistGalleryDropzoneEmpty strong {
          font-size: 12px;
          font-weight: 1000;
          letter-spacing: 0.04em;
        }

        .artistGalleryDropzoneEmpty span {
          color: rgba(255, 255, 255, 0.46);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .artistGalleryDropzoneEmpty small {
          max-width: 280px;
          color: rgba(255, 255, 255, 0.34);
          font-size: 10px;
          line-height: 1.45;
        }

        .artistGalleryPreview {
          display: grid;
          min-height: 270px;
          grid-template-rows:
            minmax(0, 1fr) auto;
          gap: 12px;
        }

        .artistGalleryPreview img {
          width: 100%;
          height: 220px;
          border-radius: 14px;
          object-fit: cover;
          object-position: center;
        }

        .artistGalleryPreview > div {
          display: grid;
          gap: 3px;
        }

        .artistGalleryPreview strong {
          overflow: hidden;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .artistGalleryPreview span {
          color: #69e8ff;
          font-size: 10px;
          font-weight: 850;
        }

        .artistGalleryPreview small {
          color: rgba(255, 255, 255, 0.32);
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.07em;
        }

        .artistGalleryAdminField {
          margin-top: 18px;
        }

        .artistGallerySubmit {
          width: 100%;
          min-height: 52px;
          margin-top: 18px;
          border: 0;
          border-radius: 14px;
          background:
            linear-gradient(
              135deg,
              #0c8eff,
              #24d8e6
            );
          color: #03101c;
          cursor: pointer;
          font-size: 11px;
          font-weight: 1000;
          letter-spacing: 0.06em;
          box-shadow:
            0 14px 34px
              rgba(16, 166, 255, 0.18);
        }

        .artistGallerySubmit:disabled {
          cursor: wait;
          opacity: 0.56;
        }

        .artistGalleryQuality {
          margin-top: 14px;
          padding: 13px 14px;
          border: 1px solid
            rgba(67, 231, 175, 0.12);
          border-radius: 12px;
          background: rgba(33, 201, 149, 0.05);
        }

        .artistGalleryQuality span {
          color: #77f3c0;
          font-size: 8px;
          font-weight: 1000;
          letter-spacing: 0.1em;
        }

        .artistGalleryQuality p {
          margin: 5px 0 0;
          color: rgba(255, 255, 255, 0.4);
          font-size: 10px;
          line-height: 1.45;
        }

        .artistGalleryAlert,
        .artistGalleryResult {
          display: grid;
          gap: 5px;
          margin-top: 14px;
          padding: 13px 14px;
          border-radius: 12px;
        }

        .artistGalleryAlert strong,
        .artistGalleryResult > span {
          font-size: 8px;
          font-weight: 1000;
          letter-spacing: 0.1em;
        }

        .artistGalleryAlert span {
          font-size: 10px;
          font-weight: 750;
          line-height: 1.4;
        }

        .artistGalleryAlert small {
          color: rgba(255, 255, 255, 0.44);
          font-size: 9px;
          line-height: 1.4;
        }

        .artistGalleryAlertError {
          border: 1px solid
            rgba(255, 93, 119, 0.18);
          background: rgba(255, 70, 105, 0.06);
          color: #ff9caf;
        }

        .artistGalleryAlertSuccess {
          border: 1px solid
            rgba(69, 237, 173, 0.18);
          background: rgba(45, 213, 150, 0.06);
          color: #83f2c4;
        }

        .artistGalleryResult {
          border: 1px solid
            rgba(255, 201, 99, 0.12);
          background: rgba(255, 193, 73, 0.04);
        }

        .artistGalleryResult > span {
          color: #ffc96b;
        }

        .artistGalleryResult > div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .artistGalleryResult strong {
          font-size: 13px;
        }

        .artistGalleryResult small {
          color: rgba(255, 255, 255, 0.42);
          font-size: 10px;
        }

        .artistGallerySearch {
          position: relative;
          display: block;
          margin-bottom: 18px;
        }

        .artistGallerySearch > span {
          position: absolute;
          top: 50%;
          left: 14px;
          z-index: 2;
          transform: translateY(-50%);
          color: #63e5ff;
          font-size: 20px;
          pointer-events: none;
        }

        .artistGallerySearch input {
          height: 48px;
          padding: 0 14px 0 45px;
          border-radius: 14px;
          font-size: 12px;
          font-weight: 750;
        }

        .artistGalleryGrid {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 14px;
        }

        .artistGalleryCard {
          overflow: hidden;
          border: 1px solid
            rgba(255, 255, 255, 0.08);
          border-radius: 17px;
          background:
            linear-gradient(
              180deg,
              rgba(13, 30, 61, 0.8),
              rgba(5, 12, 28, 0.92)
            );
        }

        .artistGalleryCardImage {
          position: relative;
          height: 180px;
          background: #071021;
        }

        .artistGalleryCardImage img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .artistGalleryCardImage > span {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 6px 8px;
          border: 1px solid
            rgba(75, 246, 182, 0.16);
          border-radius: 999px;
          background: rgba(3, 24, 17, 0.74);
          color: #7bf6c1;
          font-size: 7px;
          font-weight: 1000;
          letter-spacing: 0.08em;
          backdrop-filter: blur(8px);
        }

        .artistGalleryCardBody {
          padding: 15px;
        }

        .artistGalleryCardBody h3 {
          overflow: hidden;
          margin: 0;
          font-size: 15px;
          font-weight: 1000;
          line-height: 1.15;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .artistGalleryCardMeta {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .artistGalleryCardMeta > span {
          display: grid;
          gap: 4px;
          color: rgba(255, 255, 255, 0.34);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: 0.07em;
        }

        .artistGalleryCardMeta strong {
          color: rgba(255, 255, 255, 0.8);
          font-size: 9px;
          letter-spacing: 0;
        }

        .artistGalleryCardBody > small {
          display: block;
          margin-top: 13px;
          color: rgba(255, 255, 255, 0.28);
          font-size: 7px;
          font-weight: 850;
          letter-spacing: 0.04em;
        }

        .artistGalleryCardActions {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .artistGalleryCardActions button {
          min-height: 34px;
          border: 1px solid
            rgba(83, 218, 255, 0.15);
          border-radius: 9px;
          background: rgba(67, 211, 255, 0.06);
          color: #78eaff;
          cursor: pointer;
          font-size: 8px;
          font-weight: 1000;
          letter-spacing: 0.05em;
        }

        .artistGalleryCardActions button:hover {
          background: rgba(67, 211, 255, 0.1);
        }

        .artistGalleryCardActions
          .artistGalleryDelete {
          border-color: rgba(255, 89, 114, 0.13);
          background: rgba(255, 74, 103, 0.04);
          color: #ff9caf;
        }

        .artistGalleryCardActions button:disabled {
          cursor: wait;
          opacity: 0.5;
        }

        .artistGalleryEmpty {
          display: grid;
          min-height: 360px;
          place-items: center;
          align-content: center;
          gap: 8px;
          border: 1px dashed
            rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          color: rgba(255, 255, 255, 0.42);
          text-align: center;
        }

        .artistGalleryEmpty > div {
          color: #5be6ff;
          font-size: 34px;
        }

        .artistGalleryEmpty strong {
          color: rgba(255, 255, 255, 0.62);
          font-size: 11px;
          font-weight: 1000;
          letter-spacing: 0.07em;
        }

        .artistGalleryEmpty p {
          margin: 0;
          font-size: 10px;
        }

        @media (max-width: 1100px) {
          .artistGalleryWorkspace {
            grid-template-columns: 1fr;
          }

          .artistGalleryGrid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .artistGalleryShell {
            width: min(
              100% - 24px,
              1500px
            );
            padding-top: 16px;
          }

          .artistGalleryHeader {
            align-items: flex-start;
          }

          .artistGalleryBrand {
            max-width: 220px;
          }

          .artistGalleryHero {
            grid-template-columns: 1fr;
            padding: 26px;
          }

          .artistGalleryStats {
            min-width: 0;
            justify-items: start;
            text-align: left;
          }

          .artistGalleryGrid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {
          .artistGalleryHeader {
            display: grid;
            gap: 18px;
          }

          .artistGalleryBrand {
            justify-items: start;
            text-align: left;
          }

          .artistGalleryHero {
            padding: 22px;
          }

          .artistGalleryUploader,
          .artistGalleryLibrary {
            padding: 16px;
          }

          .artistGalleryGrid {
            grid-template-columns: 1fr;
          }

          .artistGalleryCardImage {
            height: 220px;
          }
        }
      `}</style>
    </main>
  );
}
