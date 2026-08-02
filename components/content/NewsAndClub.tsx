export default function NewsAndClub() {
  return (
    <>
      <section id="noticias" className="newsSection">
        <div className="sectionTitle light">
          <span>FIERAMIX NOTICIAS</span>
          <h2>Actualidad que conecta</h2>
        </div>

        <div className="newsGrid">
          <article className="newsLead">
            <span>DESTACADA</span>
            <h3>GRUPO FIERAMIX.COM expande su plataforma de radio digital</h3>
            <p>
              Nueve señales, música en vivo y una experiencia diseñada para la
              comunidad latina.
            </p>
          </article>

          <article>
            <span>MÚSICA</span>
            <h3>Los ritmos latinos que siguen conquistando al mundo</h3>
            <p>
              Bachata, merengue y salsa viven un nuevo momento digital.
            </p>
          </article>

          <article>
            <span>COMUNIDAD</span>
            <h3>Únete al Club de Oyentes Fieramix</h3>
            <p>
              Promociones, saludos, concursos y conexión directa con nuestras
              emisoras.
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
