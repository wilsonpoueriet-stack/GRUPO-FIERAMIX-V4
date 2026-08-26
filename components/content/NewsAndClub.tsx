"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { news } from "@/data/news";
import type { NewsItem } from "@/data/news";

const fallbackNewsImage = "/noticias/fieramix-noticias-espacio-informativo.png";
type NewsApiResponse = { news: unknown[] };

function isNewsApiResponse(value: unknown): value is NewsApiResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "news" in value &&
    Array.isArray(value.news)
  );
}

function isPublishedNewsItem(value: unknown): value is NewsItem & { status: "published" } {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<NewsItem> & { status?: unknown };
  return (
    item.status === "published" &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.excerpt === "string" &&
    typeof item.category === "string" &&
    Array.isArray(item.content) &&
    item.content.every((paragraph) => typeof paragraph === "string")
  );
}

const newsLinkStyle = {
  position: "absolute" as const,
  inset: 0,
  zIndex: 4,
  borderRadius: "inherit",
};

const newsImageStyle = {
  position: "absolute" as const,
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
  zIndex: 0,
  filter: "brightness(.72) saturate(.92)",
};

const newsOverlayStyle = {
  position: "absolute" as const,
  inset: 0,
  zIndex: 1,
  background:
    "linear-gradient(180deg, rgba(5,8,22,.26) 0%, rgba(5,8,22,.80) 55%, rgba(5,8,22,.98) 100%)",
};

const newsContentStyle = {
  position: "relative" as const,
  zIndex: 2,
};

export default function NewsAndClub() {
  const [newsItems, setNewsItems] = useState(news);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    async function loadNews() {
      try {
        const response = await fetch("/api/news", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) return;

        const payload: unknown = await response.json();
        if (!isNewsApiResponse(payload)) return;

        const publishedNews = payload.news.filter(isPublishedNewsItem);
        if (publishedNews.length !== payload.news.length) return;

        publishedNews.sort((a, b) =>
          (b.publishedAt || "").localeCompare(a.publishedAt || ""),
        );
        if (publishedNews.length > 0) setNewsItems(publishedNews.slice(0, 3));
      } catch {
        // Keep the static news when the optional refresh is unavailable.
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void loadNews();
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const featuredNews = newsItems.find((item) => item.featured) ?? newsItems[0];
  const secondaryNews = newsItems
    .filter((item) => item.id !== featuredNews?.id)
    .slice(0, 2);

  return (
    <>
      <section
        id="noticias"
        className="newsSection"
        style={{ scrollMarginTop: "210px" }}
      >
        <div className="sectionTitle light">
          <span>FIERAMIX NOTICIAS</span>
          <h2>Informaciones que mueven al mundo</h2>
          <p>
            Actualidad, música, entretenimiento y los acontecimientos que
            conectan a la comunidad latina.
          </p>
        </div>

        <div className="newsGrid">
          {featuredNews ? (
            <article
              className="newsLead"
              style={{
                position: "relative",
                cursor: "pointer",
                overflow: "hidden",
              }}
            >
              <>
                <img
                  src={featuredNews.image || fallbackNewsImage}
                  alt=""
                  aria-hidden="true"
                  style={newsImageStyle}
                />
                <div style={newsOverlayStyle} />
              </>

              <Link
                href={`/noticias/${featuredNews.id}`}
                aria-label={`Leer noticia: ${featuredNews.title}`}
                style={newsLinkStyle}
              />

              <div style={newsContentStyle}>
                <span>{featuredNews.category}</span>
                <h3
                  style={{
                    fontSize: "clamp(1.8rem, 3.2vw, 2.9rem)",
                    lineHeight: 1.05,
                    maxWidth: "760px",
                    textShadow: "0 2px 18px rgba(0,0,0,.65)",
                  }}
                >
                  {featuredNews.title}
                </h3>
                <p style={{ textShadow: "0 2px 14px rgba(0,0,0,.72)" }}>
                  {featuredNews.excerpt}
                </p>
              </div>
            </article>
          ) : null}

          {secondaryNews.map((item) => (
            <article
              key={item.id}
              style={{
                position: "relative",
                cursor: "pointer",
                overflow: "hidden",
              }}
            >
              <>
                <img
                  src={item.image || fallbackNewsImage}
                  alt=""
                  aria-hidden="true"
                  style={newsImageStyle}
                />
                <div style={newsOverlayStyle} />
              </>

              <Link
                href={`/noticias/${item.id}`}
                aria-label={`Leer noticia: ${item.title}`}
                style={newsLinkStyle}
              />

              <div style={newsContentStyle}>
                <span>{item.category}</span>
                <h3 style={{ textShadow: "0 2px 16px rgba(0,0,0,.72)" }}>
                  {item.title}
                </h3>
                <p style={{ textShadow: "0 2px 14px rgba(0,0,0,.78)" }}>
                  {item.excerpt}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="club"
        className="clubSection"
        style={{
          position: "relative",
          overflow: "hidden",
          alignItems: "stretch",
          padding: "0",
          background:
            "radial-gradient(circle at 0% 0%, rgba(124,58,237,.62), transparent 42%), radial-gradient(circle at 100% 100%, rgba(32,220,142,.42), transparent 42%), #0b1022",
          border: "1px solid rgba(255,255,255,.10)",
          boxShadow: "0 28px 80px rgba(0,0,0,.22)",
          scrollMarginTop: "190px",
        }}
      >
        <div
          style={{
            flex: "1 1 62%",
            padding: "clamp(34px, 5vw, 58px)",
            position: "relative",
            zIndex: 2,
          }}
        >
          <span>CLUB DE OYENTES</span>

          <h2
            style={{
              maxWidth: "760px",
              marginBottom: "14px",
              lineHeight: 1.02,
            }}
          >
            La radio también se vive contigo
          </h2>

          <p
            style={{
              maxWidth: "680px",
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            Forma parte de la comunidad de EL GRUPO FIERAMIX.COM y mantente
            cerca de nuestras emisoras, novedades y contenidos especiales.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "26px",
            }}
          >
            {["NOVEDADES", "PROMOCIONES", "PREMIOS", "CONTENIDO ESPECIAL"].map(
              (benefit) => (
                <span
                  key={benefit}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: "34px",
                    padding: "0 14px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,.12)",
                    background: "rgba(255,255,255,.06)",
                    color: "#ffffff",
                    fontSize: ".72rem",
                    fontWeight: 900,
                    letterSpacing: ".08em",
                  }}
                >
                  {benefit}
                </span>
              ),
            )}
          </div>
        </div>

        <div
          style={{
            flex: "0 1 360px",
            minWidth: "280px",
            padding: "clamp(28px, 4vw, 48px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: "18px",
            position: "relative",
            zIndex: 2,
            background:
              "linear-gradient(145deg, rgba(255,255,255,.06), rgba(255,255,255,.015))",
            borderLeft: "1px solid rgba(255,255,255,.08)",
          }}
        >
          <img
            src="/logos/grupo-fieramix.png"
            alt="EL GRUPO FIERAMIX.COM"
            style={{
              width: "58px",
              height: "58px",
              objectFit: "contain",
              borderRadius: "14px",
            }}
          />

          <div>
            <strong
              style={{
                display: "block",
                color: "#ffffff",
                fontSize: "1.05rem",
                marginBottom: "5px",
              }}
            >
              ÚNETE A NUESTRA COMUNIDAD
            </strong>
            <span
              style={{
                color: "rgba(255,255,255,.68)",
                fontSize: ".86rem",
                lineHeight: 1.55,
              }}
            >
              Regístrate en el Club de Oyentes y autoriza las novedades que deseas recibir por WhatsApp.
            </span>
          </div>

          <Link
            href="/club-de-oyentes"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              textAlign: "center",
              whiteSpace: "nowrap",
              fontSize: ".72rem",
            }}
          >
            REGISTRARME EN EL CLUB
          </Link>
        </div>
      </section>
    </>
  );
}
