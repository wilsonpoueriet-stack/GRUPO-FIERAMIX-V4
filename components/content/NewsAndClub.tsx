export default function NewsAndClub() {
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
          <article className="newsLead">
            <span>DESTACADA</span>
            <h3
              style={{
                fontSize: "clamp(1.8rem, 3.2vw, 2.9rem)",
                lineHeight: 1.05,
                maxWidth: "760px",
              }}
            >
              EL GRUPO FIERAMIX.COM fortalece su plataforma de radio digital
            </h3>
            <p>
              Música en vivo, información y participación en una experiencia
              digital creada para conectar a la comunidad latina.
            </p>
          </article>

          <article>
            <span>MÚSICA</span>
            <h3>Los ritmos latinos continúan conquistando nuevas audiencias</h3>
            <p>
              Bachata, merengue, salsa y los sonidos urbanos amplían su alcance
              dentro y fuera de Latinoamérica.
            </p>
          </article>

          <article>
            <span>ACTUALIDAD</span>
            <h3>FIERAMIX NOTICIAS amplía su espacio informativo</h3>
            <p>
              Noticias nacionales, internacionales, deportes, tecnología,
              música y entretenimiento en un mismo punto de encuentro.
            </p>
          </article>
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
