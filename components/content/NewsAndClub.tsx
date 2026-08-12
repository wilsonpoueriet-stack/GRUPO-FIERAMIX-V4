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
              Conecta directamente con EL GRUPO FIERAMIX.COM desde WhatsApp.
            </span>
          </div>

          <a
            href="https://chat.whatsapp.com/JJfXFBwAG3O8DIKs9ufvJt"
            target="_blank"
            rel="noreferrer"
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
            UNIRME POR WHATSAPP
          </a>
        </div>
      </section>
    </>
  );
}
