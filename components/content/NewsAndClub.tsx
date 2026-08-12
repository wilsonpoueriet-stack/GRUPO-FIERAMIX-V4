import { news } from "@/data/news";

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
            <article className="newsLead">
              <span>{featuredNews.category}</span>
              <h3
                style={{
                  fontSize: "clamp(1.8rem, 3.2vw, 2.9rem)",
                  lineHeight: 1.05,
                  maxWidth: "760px",
                }}
              >
                {featuredNews.title}
              </h3>
              <p>{featuredNews.excerpt}</p>
            </article>
          ) : null}

          {secondaryNews.map((item) => (
            <article key={item.id}>
              <span>{item.category}</span>
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>
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
