const dayparts = [
  ["La Madrugada de FIERAMIX", "12:00 a. m. – 5:00 a. m."],
  ["El Amanecer de FIERAMIX", "5:00 a. m. – 7:00 a. m."],
  ["La Mañana de FIERAMIX", "7:00 a. m. – 12:00 p. m."],
  ["El Almuerzo de FIERAMIX", "12:00 p. m. – 2:00 p. m."],
  ["La Tarde de FIERAMIX", "2:00 p. m. – 5:00 p. m."],
  ["El Atardecer de FIERAMIX", "5:00 p. m. – 7:00 p. m."],
  ["La Noche de FIERAMIX", "7:00 p. m. – 12:00 a. m."],
] as const;

const specialPrograms = [
  ["Íntimamente", "Martes a viernes · 12:00 a. m. – 2:00 a. m.", "Música romántica."],
  ["Románticamente", "Lunes a jueves · 6:00 a. m. – 8:00 a. m.", "Música romántica."],
  ["La Hora Cero", "Lunes a jueves · 12:00 p. m. – 1:00 p. m.", "Música romántica."],
  [
    "Rosariomanía",
    "Sábados · 2:00 p. m. – 6:00 p. m.",
    "Producido y conducido por Wilson Poueriet. Retransmisión desde Estrella 92.3 FM y homenaje en vida a la música de la Dinastía Rosario: Los Hermanos Rosario y Toño Rosario.",
  ],
] as const;

const rotation = [
  "Éxitos actuales",
  "Recurrentes",
  "Clásicos",
  "TOP 05 — 5 canciones",
  "TOP 10 — 10 canciones",
  "TOP 25 — 15 canciones",
] as const;

const hourlyContent = [
  "El Acertijo",
  "El Minuto de Finanzas",
  "Saludos VIP",
  "Conoce Tu País",
] as const;

const newsTimes = [
  "9:30 a. m.",
  "10:30 a. m.",
  "11:30 a. m.",
  "12:30 p. m.",
  "1:30 p. m.",
  "2:30 p. m.",
  "3:30 p. m.",
  "4:30 p. m.",
  "5:30 p. m.",
] as const;

const cardStyle = {
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: "20px",
  background:
    "linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.025))",
};

export default function FieramixProgramming() {
  return (
    <section
      id="programacion"
      aria-labelledby="fieramix-programming-title"
      style={{
        width: "min(1180px, calc(100% - 32px))",
        margin: "clamp(42px, 7vw, 86px) auto",
        padding: "clamp(24px, 4vw, 38px)",
        borderRadius: "28px",
        background:
          "radial-gradient(circle at 0% 0%, rgba(124,58,237,.28), transparent 34%), radial-gradient(circle at 100% 100%, rgba(32,220,142,.18), transparent 34%), #090f20",
        border: "1px solid rgba(255,255,255,.10)",
        boxShadow: "0 30px 90px rgba(0,0,0,.24)",
        color: "#ffffff",
        scrollMarginTop: "190px",
      }}
    >
      <header style={{ maxWidth: "820px" }}>
        <span
          style={{
            display: "inline-block",
            marginBottom: "9px",
            color: "#72f0bd",
            fontSize: ".74rem",
            fontWeight: 900,
            letterSpacing: ".12em",
            textTransform: "uppercase",
          }}
        >
          Parrilla semanal oficial
        </span>
        <h2
          id="fieramix-programming-title"
          style={{
            margin: 0,
            fontSize: "clamp(1.8rem, 4.5vw, 3.2rem)",
            lineHeight: 1.02,
            letterSpacing: "-.035em",
          }}
        >
          NUESTRA PROGRAMACIÓN EN FIERAMIX
        </h2>
        <p
          style={{
            margin: "13px 0 0",
            color: "rgba(255,255,255,.68)",
            fontSize: ".94rem",
            lineHeight: 1.65,
          }}
        >
          Música, información, especiales y animación durante las 24 horas.
        </p>
      </header>

      <details style={{ marginTop: "22px" }}>
        <summary
          style={{
            listStyle: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "44px",
            padding: "0 18px",
            borderRadius: "999px",
            border: "1px solid rgba(114,240,189,.28)",
            background: "rgba(114,240,189,.10)",
            color: "#d8fff0",
            fontSize: ".78rem",
            fontWeight: 900,
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          Ver programación completa
        </summary>

        <div style={{ marginTop: "24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))",
              gap: "14px",
              marginBottom: "18px",
            }}
          >
            <div style={{ ...cardStyle, padding: "20px" }}>
              <span style={{ color: "#72f0bd", fontSize: ".7rem", fontWeight: 900 }}>
                LUNES A JUEVES
              </span>
              <h3 style={{ margin: "7px 0 6px", fontSize: "1.2rem" }}>
                Programación regular
              </h3>
              <p style={{ margin: 0, color: "rgba(255,255,255,.66)" }}>
                Merengue, bachata y salsa.
              </p>
            </div>

            <div style={{ ...cardStyle, padding: "20px" }}>
              <span style={{ color: "#72f0bd", fontSize: ".7rem", fontWeight: 900 }}>
                VIERNES A DOMINGO
              </span>
              <h3 style={{ margin: "7px 0 6px", fontSize: "1.2rem" }}>
                Fin de Semana Bravo
              </h3>
              <p style={{ margin: 0, color: "rgba(255,255,255,.66)" }}>
                Merengue, bachata y salsa.
              </p>
            </div>

            <div style={{ ...cardStyle, padding: "20px" }}>
              <span style={{ color: "#72f0bd", fontSize: ".7rem", fontWeight: 900 }}>
                24 HORAS
              </span>
              <h3 style={{ margin: "7px 0 6px", fontSize: "1.2rem" }}>
                Alexander Sadalab “El Eterno”
              </h3>
              <p style={{ margin: 0, color: "rgba(255,255,255,.66)", lineHeight: 1.5 }}>
                Animador virtual y voz institucional de EL GRUPO FIERAMIX.COM.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "18px",
            }}
          >
            <div style={{ ...cardStyle, padding: "22px" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "1.25rem" }}>
                Rotación musical de FIERAMIX
              </h3>
              <div style={{ display: "grid", gap: "9px" }}>
                {rotation.map((item, index) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      padding: "9px 11px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,.045)",
                    }}
                  >
                    <strong style={{ minWidth: "24px", color: "#72f0bd" }}>
                      {index + 1}.
                    </strong>
                    <span style={{ fontWeight: 800 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...cardStyle, padding: "22px" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "1.25rem" }}>
                Programas especiales
              </h3>
              <div style={{ display: "grid", gap: "14px" }}>
                {specialPrograms.map(([title, schedule, description]) => (
                  <article
                    key={title}
                    style={{
                      paddingBottom: "13px",
                      borderBottom: "1px solid rgba(255,255,255,.08)",
                    }}
                  >
                    <strong style={{ display: "block" }}>{title}</strong>
                    <span
                      style={{
                        display: "block",
                        marginTop: "4px",
                        color: "#72f0bd",
                        fontSize: ".8rem",
                        fontWeight: 800,
                      }}
                    >
                      {schedule}
                    </span>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "rgba(255,255,255,.64)",
                        fontSize: ".86rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "18px",
              marginTop: "18px",
            }}
          >
            <div style={{ ...cardStyle, padding: "22px" }}>
              <h3 style={{ margin: "0 0 11px", fontSize: "1.2rem" }}>FIERAMIX NOTICIAS</h3>
              <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,.68)", lineHeight: 1.55 }}>
                Lunes a jueves, cada hora desde las 9:30 a. m. hasta las 5:30 p. m.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {newsTimes.map((time) => (
                  <span
                    key={time}
                    style={{
                      padding: "7px 10px",
                      borderRadius: "999px",
                      background: "rgba(114,240,189,.10)",
                      border: "1px solid rgba(114,240,189,.18)",
                      color: "#d8fff0",
                      fontSize: ".76rem",
                      fontWeight: 800,
                    }}
                  >
                    {time}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ ...cardStyle, padding: "22px" }}>
              <h3 style={{ margin: "0 0 11px", fontSize: "1.2rem" }}>Cada hora en punto</h3>
              <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,.68)", lineHeight: 1.55 }}>
                Podcasts y cápsulas de EL GRUPO FIERAMIX.COM.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {hourlyContent.map((item) => (
                  <span
                    key={item}
                    style={{
                      padding: "7px 10px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,.05)",
                      border: "1px solid rgba(255,255,255,.08)",
                      color: "rgba(255,255,255,.82)",
                      fontSize: ".76rem",
                      fontWeight: 800,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "18px",
              padding: "20px 22px",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,.09)",
              background: "rgba(0,0,0,.16)",
            }}
          >
            <h3 style={{ margin: "0 0 13px", fontSize: "1.2rem" }}>Franjas de FIERAMIX</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "9px",
              }}
            >
              {dayparts.map(([name, schedule]) => (
                <div
                  key={name}
                  style={{
                    padding: "10px 11px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,.035)",
                  }}
                >
                  <strong style={{ display: "block", fontSize: ".85rem" }}>{name}</strong>
                  <span
                    style={{
                      display: "block",
                      marginTop: "3px",
                      color: "rgba(255,255,255,.56)",
                      fontSize: ".78rem",
                    }}
                  >
                    {schedule}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
