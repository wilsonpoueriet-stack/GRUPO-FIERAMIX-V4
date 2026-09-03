"use client";

import { useEffect, useState } from "react";

export default function NewsViewCounter({ newsId }: { newsId: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function registerView() {
      const storageKey = `fieramix-noticia-vista:${newsId}`;
      const alreadyCounted = sessionStorage.getItem(storageKey) === "1";
      const response = await fetch(`/api/news/${encodeURIComponent(newsId)}/views`, {
        method: alreadyCounted ? "GET" : "POST",
        cache: "no-store",
      });
      const data = await response.json() as { views?: unknown };

      if (!alreadyCounted && response.ok) sessionStorage.setItem(storageKey, "1");
      if (active && typeof data.views === "number") setViews(data.views);
    }

    void registerView().catch(() => {
      if (active) setViews(0);
    });

    return () => { active = false; };
  }, [newsId]);

  return (
    <span aria-label={`${views ?? 0} vistas`}>
      👁 {views === null ? "…" : views.toLocaleString("es-DO")} {views === 1 ? "vista" : "vistas"}
    </span>
  );
}
