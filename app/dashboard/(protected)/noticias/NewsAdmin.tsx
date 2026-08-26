"use client";

import { useCallback, useEffect, useState } from "react";
import type { ManagedNewsItem } from "@/lib/news-store";

const categories = ["FIERAMIX NOTICIAS", "NACIONALES", "INTERNACIONALES", "MÚSICA", "ESPECTÁCULOS", "DEPORTES", "TECNOLOGÍA", "ACTUALIDAD"];
const emptyForm = { originalId: "", title: "", excerpt: "", content: "", category: "ACTUALIDAD", source: "FIERAMIX NOTICIAS", status: "published", featured: false, existingImage: "" };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.06)", color: "white", padding: "12px 14px", font: "inherit" };

export default function NewsAdmin() {
  const [items, setItems] = useState<ManagedNewsItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/dashboard/news", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setItems(data.news || []);
    else setMessage(data.error || "No fue posible cargar las noticias.");
  }, []);

  useEffect(() => { void load(); }, [load]);

  function edit(item: ManagedNewsItem) {
    setForm({ originalId: item.id, title: item.title, excerpt: item.excerpt, content: item.content.join("\n\n"), category: item.category, source: item.source || "FIERAMIX NOTICIAS", status: item.status, featured: item.featured === true, existingImage: item.image || "" });
    setImage(null); setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.set(key, String(value)));
    if (image) payload.set("image", image);
    const response = await fetch("/api/dashboard/news", { method: "POST", body: payload });
    const data = await response.json();
    setMessage(data.message || data.error || "Operación terminada.");
    if (response.ok) { setForm(emptyForm); setImage(null); await load(); }
    setBusy(false);
  }

  async function remove(item: ManagedNewsItem) {
    if (!window.confirm(`¿Eliminar definitivamente “${item.title}”?`)) return;
    const response = await fetch("/api/dashboard/news", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) });
    const data = await response.json(); setMessage(data.message || data.error || "Operación terminada.");
    if (response.ok) await load();
  }

  return <main style={{ minHeight: "100vh", background: "radial-gradient(circle at top left,#243b6b,#08111f 48%,#050a13)", color: "white", padding: "32px clamp(18px,4vw,48px) 120px", fontFamily: "Arial,sans-serif" }}>
    <header style={{ maxWidth: 1200, margin: "0 auto 24px" }}><span style={{ color: "#43f5b1", fontWeight: 900, letterSpacing: 2, fontSize: ".72rem" }}>FIERAMIX NOTICIAS</span><h1 style={{ margin: "8px 0", fontSize: "clamp(2rem,5vw,3.4rem)" }}>Edición de noticias</h1><p style={{ opacity: .7 }}>Crea, corrige, guarda borradores y publica sin tocar el código del portal.</p></header>
    <div style={{ maxWidth: 1200, margin: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,430px),1fr))", gap: 24, alignItems: "start" }}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14, padding: 22, borderRadius: 22, border: "1px solid rgba(255,255,255,.12)", background: "rgba(6,12,27,.82)" }}>
        <h2 style={{ margin: 0 }}>{form.originalId ? "Editar noticia" : "Nueva noticia"}</h2>
        <label>Titular<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ ...inputStyle, marginTop: 7 }} /></label>
        <label>Resumen<textarea required rows={3} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} style={{ ...inputStyle, marginTop: 7, resize: "vertical" }} /></label>
        <label>Contenido <small style={{ opacity: .6 }}>(separa los párrafos con una línea en blanco)</small><textarea required rows={12} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} style={{ ...inputStyle, marginTop: 7, resize: "vertical", lineHeight: 1.6 }} /></label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}><label>Categoría<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ ...inputStyle, marginTop: 7 }}>{categories.map((c) => <option key={c} style={{ color: "black" }}>{c}</option>)}</select></label><label>Estado<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle, marginTop: 7 }}><option value="published" style={{ color: "black" }}>PUBLICADA</option><option value="draft" style={{ color: "black" }}>BORRADOR</option></select></label></div>
        <label>Fuente<input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} style={{ ...inputStyle, marginTop: 7 }} /></label>
        <label>Imagen JPG, PNG o WEBP<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImage(e.target.files?.[0] || null)} style={{ ...inputStyle, marginTop: 7 }} /></label>
        <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Destacar en la portada</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button disabled={busy} style={{ border: 0, borderRadius: 999, padding: "13px 22px", fontWeight: 900, background: "linear-gradient(135deg,#43f5b1,#7ecfff)", cursor: "pointer" }}>{busy ? "GUARDANDO..." : form.originalId ? "GUARDAR CAMBIOS" : "CREAR NOTICIA"}</button>{form.originalId && <button type="button" onClick={() => { setForm(emptyForm); setImage(null); }} style={{ borderRadius: 999, padding: "12px 18px", color: "white", border: "1px solid rgba(255,255,255,.2)", background: "transparent" }}>CANCELAR</button>}</div>
        {message && <p role="status" style={{ margin: 0, color: "#7bf5be", fontWeight: 700 }}>{message}</p>}
      </form>
      <section style={{ display: "grid", gap: 12 }}><h2 style={{ marginTop: 0 }}>Noticias ({items.length})</h2>{items.map((item) => <article key={item.id} style={{ padding: 18, borderRadius: 18, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.05)", display: "grid", gridTemplateColumns: item.image ? "110px 1fr" : "1fr", gap: 15 }}>
        {item.image && <img src={item.image} alt="" style={{ width: 110, height: 90, objectFit: "cover", borderRadius: 12 }} />}<div><div style={{ display: "flex", gap: 7, flexWrap: "wrap", fontSize: ".67rem", fontWeight: 900 }}><span style={{ color: "#43f5b1" }}>{item.category}</span><span style={{ color: item.status === "published" ? "#7ecfff" : "#ffc857" }}>{item.status === "published" ? "PUBLICADA" : "BORRADOR"}</span>{item.featured && <span style={{ color: "#ff6e9f" }}>DESTACADA</span>}</div><h3 style={{ margin: "7px 0 12px", fontSize: "1rem" }}>{item.title}</h3><div style={{ display: "flex", gap: 8 }}><button onClick={() => edit(item)} style={{ border: 0, borderRadius: 999, padding: "8px 13px", fontWeight: 800, cursor: "pointer" }}>EDITAR</button><button onClick={() => void remove(item)} style={{ border: "1px solid rgba(255,90,110,.5)", borderRadius: 999, padding: "7px 12px", color: "#ff9cad", background: "transparent", cursor: "pointer" }}>ELIMINAR</button></div></div>
      </article>)}</section>
    </div>
  </main>;
}