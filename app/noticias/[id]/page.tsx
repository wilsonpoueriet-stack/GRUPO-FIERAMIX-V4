import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedNews } from "@/lib/news-store";
import NewsShareButtons from "@/components/news/NewsShareButtons";

type NewsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatPublicationDate(value?: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const weekday = new Intl.DateTimeFormat("es-DO", {
    timeZone: "America/Santo_Domingo",
    weekday: "long",
  }).format(date);

  const dayMonth = new Intl.DateTimeFormat("es-DO", {
    timeZone: "America/Santo_Domingo",
    day: "numeric",
    month: "long",
  }).format(date);

  const time = new Intl.DateTimeFormat("es-DO", {
    timeZone: "America/Santo_Domingo",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return `${weekday} ${dayMonth} · ${time}`;
}

export async function generateMetadata({
  params,
}: NewsPageProps): Promise<Metadata> {
  const { id } = await params;
  const news = await getPublishedNews();
  const item = news.find((newsItem) => newsItem.id === id);

  if (!item) {
    return {
      title: {
        absolute: "Noticia no encontrada | EL GRUPO FIERAMIX.COM",
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonical = `/noticias/${item.id}`;
  const socialTitle = `${item.title} | FIERAMIX NOTICIAS`;
  const image = item.image || "/logos/grupo-fieramix.png";

  return {
    title: `${item.title} | FIERAMIX NOTICIAS`,
    description: item.excerpt,
    alternates: {
      canonical,
    },
    openGraph: {
      title: socialTitle,
      description: item.excerpt,
      url: canonical,
      siteName: "EL GRUPO FIERAMIX.COM",
      locale: "es_DO",
      type: "article",
      publishedTime: item.publishedAt,
      section: item.category,
      images: [
        {
          url: image,
          alt: item.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: item.excerpt,
      images: [image],
    },
  };
}

export default async function NewsDetailPage({ params }: NewsPageProps) {
  const { id } = await params;
  const news = await getPublishedNews();
  const item = news.find((newsItem) => newsItem.id === id);

  if (!item) {
    notFound();
  }

  const publicationDate = formatPublicationDate(item.publishedAt);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 0%, rgba(255,45,118,.10), transparent 28%), radial-gradient(circle at 85% 10%, rgba(32,220,142,.10), transparent 30%), #050816",
        color: "#ffffff",
        padding: "48px 20px 90px",
      }}
    >
      <article
        style={{
          width: "min(980px, 100%)",
          margin: "0 auto",
        }}
      >
        <Link
          href="/#noticias"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#7bf5be",
            textDecoration: "none",
            fontSize: "0.82rem",
            fontWeight: 900,
            letterSpacing: "0.08em",
            marginBottom: "34px",
          }}
        >
          ← VOLVER A FIERAMIX NOTICIAS
        </Link>

        <header
          style={{
            border: "1px solid rgba(255,255,255,.10)",
            borderRadius: "30px",
            padding: "clamp(28px, 6vw, 58px)",
            background:
              "linear-gradient(150deg, rgba(20,184,166,.13), rgba(124,58,237,.16) 46%, rgba(5,8,22,.96))",
            boxShadow: "0 28px 90px rgba(0,0,0,.24)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              color: "#7bf5be",
              fontSize: "0.72rem",
              fontWeight: 900,
              letterSpacing: "0.16em",
              marginBottom: "18px",
            }}
          >
            {item.category}
          </span>

          <h1
            style={{
              margin: 0,
              maxWidth: "900px",
              fontSize: "clamp(2.2rem, 6vw, 4.8rem)",
              lineHeight: 0.98,
              letterSpacing: "-0.045em",
            }}
          >
            {item.title}
          </h1>

          <p
            style={{
              margin: "26px 0 0",
              maxWidth: "780px",
              color: "rgba(255,255,255,.72)",
              fontSize: "clamp(1rem, 2vw, 1.18rem)",
              lineHeight: 1.75,
            }}
          >
            {item.excerpt}
          </p>

          {(publicationDate || item.source) && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px 22px",
                marginTop: "28px",
                color: "rgba(255,255,255,.52)",
                fontSize: "0.82rem",
              }}
            >
              {publicationDate ? (
                <span>Publicado: {publicationDate}</span>
              ) : null}
              {item.source ? <span>FUENTE: {item.source}</span> : null}
            </div>
          )}

          <NewsShareButtons
            title={item.title}
            url={`https://fieramix.com/noticias/${item.id}`}
          />
        </header>

        {item.image ? (
          <figure
            style={{
              margin: "28px 0 0",
              overflow: "hidden",
              borderRadius: "26px",
              border: "1px solid rgba(255,255,255,.10)",
              background: "#0b1024",
            }}
          >
            <img
              src={item.image}
              alt={item.title}
              style={{
                display: "block",
                width: "100%",
                maxHeight: "560px",
                objectFit: "contain",
              }}
            />
          </figure>
        ) : null}

        <section
          style={{
            marginTop: "28px",
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: "26px",
            padding: "clamp(26px, 5vw, 48px)",
            background: "rgba(10,13,31,.72)",
          }}
        >
          <span
            style={{
              color: "#ff5a8c",
              fontSize: "0.72rem",
              fontWeight: 900,
              letterSpacing: "0.15em",
            }}
          >
            FIERAMIX NOTICIAS
          </span>

          <h2
            style={{
              margin: "12px 0 24px",
              fontSize: "clamp(1.45rem, 3vw, 2.15rem)",
              letterSpacing: "-0.03em",
            }}
          >
            Desarrollo de la información
          </h2>

          <div
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            {item.content.map((paragraph, index) => (
              <p
                key={`${item.id}-paragraph-${index}`}
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,.78)",
                  fontSize: "1.04rem",
                  lineHeight: 1.9,
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <footer
          style={{
            marginTop: "28px",
            padding: "22px 4px 0",
            borderTop: "1px solid rgba(255,255,255,.08)",
            color: "rgba(255,255,255,.48)",
            fontSize: "0.8rem",
            lineHeight: 1.6,
          }}
        >
          <strong
            style={{
              display: "block",
              color: "#ffffff",
              marginBottom: "4px",
            }}
          >
            EL GRUPO FIERAMIX.COM
          </strong>
          LA RED LATINA QUE MUEVE AL MUNDO
        </footer>
      </article>
    </main>
  );
}
