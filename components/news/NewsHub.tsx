"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { news as fallbackNews, type NewsItem } from "@/data/news";
import styles from "./NewsHub.module.css";

function isNewsItem(value: unknown): value is NewsItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<NewsItem>;
  return typeof item.id === "string" && typeof item.title === "string" && typeof item.excerpt === "string" && typeof item.category === "string";
}

export default function NewsHub() {
  const [items, setItems] = useState<NewsItem[]>(fallbackNews);

  useEffect(() => {
    const controller = new AbortController();
    async function loadNews() {
      try {
        const response = await fetch("/api/news", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const payload = (await response.json()) as { news?: unknown[] };
        const published = Array.isArray(payload.news) ? payload.news.filter(isNewsItem) : [];
        if (published.length) setItems(published);
      } catch {
        // La portada conserva las noticias de respaldo si la actualización no responde.
      }
    }
    void loadNews();
    return () => controller.abort();
  }, []);

  const ordered = useMemo(
    () => [...items].sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || "")),
    [items],
  );
  const lead = ordered.find((item) => item.featured) ?? ordered[0];
  const remaining = ordered.filter((item) => item.id !== lead?.id);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <img src="/logos/grupo-fieramix.png" alt="" />
          <span><strong>EL GRUPO FIERAMIX.COM</strong><small>LA RED LATINA QUE MUEVE AL MUNDO</small></span>
        </Link>
        <nav><Link href="/">Inicio</Link><Link href="/#emisoras">Emisoras</Link></nav>
      </header>

      <section className={styles.hero}>
        <span>DESDE REPÚBLICA DOMINICANA PARA EL MUNDO</span>
        <h1>FIERAMIX<br />NOTICIAS</h1>
        <p>INFORMACIONES QUE MUEVEN AL MUNDO</p>
      </section>

      {lead ? (
        <section className={styles.lead}>
          <img src={lead.image || "/noticias/fieramix-noticias-espacio-informativo.png"} alt="" />
          <article>
            <span>{lead.category}</span>
            <h2>{lead.title}</h2>
            <p>{lead.excerpt}</p>
            <Link href={`/noticias/${lead.id}`}>LEER NOTICIA</Link>
          </article>
        </section>
      ) : null}

      <section className={styles.latest}>
        <div className={styles.sectionTitle}><span>ACTUALIDAD</span><h2>Últimas noticias</h2></div>
        <div className={styles.grid}>
          {remaining.map((item) => (
            <article key={item.id}>
              <img src={item.image || "/noticias/fieramix-noticias-espacio-informativo.png"} alt="" />
              <div><span>{item.category}</span><h3>{item.title}</h3><p>{item.excerpt}</p><Link href={`/noticias/${item.id}`}>LEER MÁS</Link></div>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <strong>FIERAMIX NOTICIAS</strong>
        <span>© 2026 EL GRUPO FIERAMIX.COM</span>
        <Link href="/">Volver al portal principal</Link>
      </footer>
    </main>
  );
}
