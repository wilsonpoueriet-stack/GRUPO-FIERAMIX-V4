import Link from "next/link";
import { news } from "@/data/news";

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
  const featuredNews = news.find((item) => item.featured) ?? news[0];
  const secondaryNews = news
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
              {featuredNews.image ? (
                <>
                  <img
                    src={featuredNews.image}
                    alt=""
                    aria-hidden="true"
                    style={newsImageStyle}
                  />
                  <div style={newsOverlayStyle} />
                </>
              ) : null}

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
              {item.image ? (
                <>
                  <img
                    src={item.image}
                    alt=""
                    aria-hidden="true"
                    style={newsImageStyle}
                  />
                  <div style={newsOverlayStyle} />
                </>
              ) : null}

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

      <section id="club" className="clubSection">
        <div>
          <span>CLUB DE OYENTES</span>
          <h2>La radio también se vive contigo</h2>
          <p>
            Forma parte de nuestra comunidad y recibe novedades, promociones y
            contenido exclusivo.
          </p>
        </div>

        <a
          href="https://chat.whatsapp.com/JJfXFBwAG3O8DIKs9ufvJt"
          target="_blank"
          rel="noreferrer"
        >
          UNIRME POR WHATSAPP
        </a>
      </section>
    </>
  );
}
