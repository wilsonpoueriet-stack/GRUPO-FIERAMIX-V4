"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ArtistItem = {
  artist: string;
  slug: string;
  uploadedAt: string;
  imageUrl: string;
  enhanced: boolean;
  processedWidth?: number | null;
  processedHeight?: number | null;
};

type GalleryResponse = {
  ok?: boolean;
  error?: string;
  total?: number;
  artists?: ArtistItem[];
};

export default function GalleryAdmin() {
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [artistName, setArtistName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadArtists = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/dashboard/artist-gallery", {
        cache: "no-store",
      });
      const data = (await response.json()) as GalleryResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No fue posible cargar la galería.");
      }

      setArtists(Array.isArray(data.artists) ? data.artists : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar la galería.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadArtists();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    if (!normalized) return artists;
    return artists.filter((item) =>
      item.artist.toLocaleLowerCase("es").includes(normalized),
    );
  }, [artists, query]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setError("");
    setMessage("");

    if (!artistName.trim()) {
      setError("Escribe el nombre del artista.");
      return;
    }

    if (!file) {
      setError("Selecciona una imagen JPG, PNG o WEBP.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.set("artist", artistName.trim());
      formData.set("file", file);

      const response = await fetch("/api/dashboard/artist-gallery", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; message?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No fue posible guardar la imagen.");
      }

      setMessage(data.message || "Imagen guardada correctamente.");
      setArtistName("");
      setFile(null);

      const input = document.getElementById("artist-image-file") as HTMLInputElement | null;
      if (input) input.value = "";

      await loadArtists();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar la imagen.");
    } finally {
      setSaving(false);
    }
  };

  const removeArtist = async (item: ArtistItem) => {
    const confirmed = window.confirm(`¿Eliminar la imagen de ${item.artist}?`);
    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/dashboard/artist-gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist: item.artist, slug: item.slug }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; message?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No fue posible eliminar la imagen.");
      }

      setMessage(data.message || "Imagen eliminada correctamente.");
      await loadArtists();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No fue posible eliminar la imagen.");
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };

  return (
    <main className="galleryAdminPage">
      <header className="galleryAdminHeader">
        <div>
          <span>GESTIÓN DE CONTENIDOS</span>
          <h1>Galería de Artistas</h1>
          <p>Administra las imágenes oficiales que utiliza EL GRUPO FIERAMIX.COM.</p>
        </div>
        <Link href="/dashboard" className="backButton">← VOLVER AL PANEL</Link>
      </header>

      <section className="galleryAdminSummary">
        <div><strong>{artists.length}</strong><span>artistas registrados</span></div>
        <div><strong>WEBP</strong><span>optimización automática</span></div>
        <div><strong>8 MB</strong><span>máximo por imagen</span></div>
      </section>

      <section className="galleryAdminWorkspace">
        <form onSubmit={submit} className="uploadCard">
          <span className="sectionLabel">AGREGAR O REEMPLAZAR</span>
          <h2>Imagen de artista</h2>
          <p>Si el artista ya existe, la nueva imagen reemplazará la anterior.</p>

          <label>
            Nombre del artista
            <input
              value={artistName}
              onChange={(event) => setArtistName(event.target.value)}
              placeholder="Ej.: Alex Bueno"
              autoComplete="off"
            />
          </label>

          <label>
            Imagen
            <input
              id="artist-image-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChange}
            />
          </label>

          {file && <small className="fileName">Seleccionada: {file.name}</small>}

          <button type="submit" disabled={saving}>
            {saving ? "PROCESANDO..." : "GUARDAR IMAGEN"}
          </button>

          {message && <div className="successMessage">✅ {message}</div>}
          {error && <div className="errorMessage">⚠️ {error}</div>}
        </form>

        <section className="galleryListCard">
          <div className="galleryListHeader">
            <div>
              <span className="sectionLabel">ARCHIVO VISUAL</span>
              <h2>Artistas</h2>
            </div>
            <input
              className="searchInput"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar artista..."
            />
          </div>

          {loading ? (
            <div className="galleryState">Cargando galería...</div>
          ) : filtered.length === 0 ? (
            <div className="galleryState">No hay artistas que coincidan con la búsqueda.</div>
          ) : (
            <div className="artistGrid">
              {filtered.map((item) => (
                <article key={item.slug} className="artistCard">
                  <img
                    src={`${item.imageUrl}${item.imageUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(item.uploadedAt || item.slug)}`}
                    alt={item.artist}
                    loading="lazy"
                  />
                  <div className="artistCardBody">
                    <strong>{item.artist}</strong>
                    <small>
                      {item.processedWidth && item.processedHeight
                        ? `${item.processedWidth} × ${item.processedHeight}`
                        : item.enhanced
                          ? "Optimizada"
                          : "Imagen registrada"}
                    </small>
                    <button type="button" onClick={() => void removeArtist(item)}>
                      ELIMINAR
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <style jsx>{`
        .galleryAdminPage{min-height:100vh;background:radial-gradient(circle at 10% 0,#17305a 0,#08111f 38%,#050a13 100%);color:#fff;padding:42px;font-family:Arial,sans-serif}
        .galleryAdminHeader{display:flex;justify-content:space-between;gap:22px;align-items:flex-start;flex-wrap:wrap;margin-bottom:28px}.galleryAdminHeader span,.sectionLabel{color:#43f5b1;font-size:.72rem;font-weight:900;letter-spacing:1.6px}.galleryAdminHeader h1{font-size:2.45rem;margin:8px 0}.galleryAdminHeader p{margin:0;opacity:.7;max-width:650px}.backButton{text-decoration:none;color:#fff;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);padding:12px 16px;border-radius:999px;font-weight:900;font-size:.76rem}
        .galleryAdminSummary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:24px}.galleryAdminSummary>div{background:rgba(16,35,65,.88);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:18px}.galleryAdminSummary strong{display:block;font-size:1.55rem;margin-bottom:5px}.galleryAdminSummary span{font-size:.72rem;opacity:.65}
        .galleryAdminWorkspace{display:grid;grid-template-columns:minmax(280px,360px) minmax(0,1fr);gap:24px;align-items:start}.uploadCard,.galleryListCard{background:rgba(12,26,49,.94);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:24px}.uploadCard h2,.galleryListCard h2{margin:7px 0 9px}.uploadCard p{margin:0 0 22px;opacity:.67;line-height:1.5}.uploadCard label{display:grid;gap:8px;margin:16px 0;font-size:.76rem;font-weight:800}.uploadCard input,.searchInput{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.12);background:#0b162a;color:#fff;border-radius:12px;padding:12px 13px;outline:none}.uploadCard input:focus,.searchInput:focus{border-color:#43f5b1}.fileName{display:block;opacity:.65;margin:4px 0 14px}.uploadCard>button{width:100%;min-height:46px;border:0;border-radius:12px;background:linear-gradient(135deg,#22d892,#57c7a4);color:#06120e;font-weight:1000;cursor:pointer}.uploadCard>button:disabled{opacity:.55;cursor:wait}.successMessage,.errorMessage{margin-top:14px;padding:12px;border-radius:11px;font-size:.78rem;line-height:1.4}.successMessage{background:rgba(67,245,177,.1);border:1px solid rgba(67,245,177,.28)}.errorMessage{background:rgba(255,90,110,.1);border:1px solid rgba(255,90,110,.3)}
        .galleryListHeader{display:flex;justify-content:space-between;gap:16px;align-items:end;flex-wrap:wrap;margin-bottom:20px}.searchInput{max-width:270px}.artistGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:16px}.artistCard{overflow:hidden;border-radius:16px;border:1px solid rgba(255,255,255,.08);background:#0a1426}.artistCard img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:#111d32}.artistCardBody{padding:13px}.artistCardBody strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.artistCardBody small{display:block;margin:5px 0 12px;opacity:.55}.artistCardBody button{border:1px solid rgba(255,95,115,.3);background:rgba(255,95,115,.08);color:#ff9baa;border-radius:9px;padding:8px 10px;font-size:.66rem;font-weight:900;cursor:pointer}.galleryState{padding:40px 10px;text-align:center;opacity:.65}
        @media(max-width:900px){.galleryAdminPage{padding:24px 16px 90px}.galleryAdminWorkspace{grid-template-columns:1fr}.galleryAdminSummary{grid-template-columns:1fr}.galleryAdminHeader h1{font-size:2rem}.searchInput{max-width:none}.artistGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      `}</style>
    </main>
  );
}