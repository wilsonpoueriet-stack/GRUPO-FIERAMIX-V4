"use client";

import { useEffect, useMemo, useState } from "react";

type ScheduleSlot = {
  title: string;
  detail: string;
  schedule: string;
  startMinute: number;
  endMinute: number;
};

const dayparts = [
  ["La Madrugada de FIERAMIX", "12:00 a. m. – 5:00 a. m.", 0, 300],
  ["El Amanecer de FIERAMIX", "5:00 a. m. – 7:00 a. m.", 300, 420],
  ["La Mañana de FIERAMIX", "7:00 a. m. – 12:00 p. m.", 420, 720],
  ["El Almuerzo de FIERAMIX", "12:00 p. m. – 2:00 p. m.", 720, 840],
  ["La Tarde de FIERAMIX", "2:00 p. m. – 5:00 p. m.", 840, 1020],
  ["El Atardecer de FIERAMIX", "5:00 p. m. – 7:00 p. m.", 1020, 1140],
  ["La Noche de FIERAMIX", "7:00 p. m. – 12:00 a. m.", 1140, 1440],
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

const weekdayMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function formatMinute(minute: number): string {
  const normalized = minute === 1440 ? 0 : minute;
  const hour24 = Math.floor(normalized / 60);
  const minuteValue = normalized % 60;
  const suffix = hour24 < 12 ? "a. m." : "p. m.";
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${String(minuteValue).padStart(2, "0")} ${suffix}`;
}

function getSpecialSlots(day: number): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];

  if (day >= 2 && day <= 5) {
    slots.push({
      title: "Íntimamente",
      detail: "Música romántica.",
      schedule: "12:00 a. m. – 2:00 a. m.",
      startMinute: 0,
      endMinute: 120,
    });
  }

  if (day >= 1 && day <= 4) {
    slots.push({
      title: "Románticamente",
      detail: "Música romántica.",
      schedule: "6:00 a. m. – 8:00 a. m.",
      startMinute: 360,
      endMinute: 480,
    });
    slots.push({
      title: "La Hora Cero",
      detail: "Música romántica.",
      schedule: "12:00 p. m. – 1:00 p. m.",
      startMinute: 720,
      endMinute: 780,
    });
  }

  if (day === 6) {
    slots.push({
      title: "Rosariomanía",
      detail:
        "Con Wilson Poueriet · Retransmisión desde Estrella 92.3 FM · Homenaje a la Dinastía Rosario.",
      schedule: "2:00 p. m. – 6:00 p. m.",
      startMinute: 840,
      endMinute: 1080,
    });
  }

  return slots.sort((a, b) => a.startMinute - b.startMinute);
}

function getProgrammingAt(day: number, minute: number): ScheduleSlot {
  const specials = getSpecialSlots(day);
  const activeSpecial = specials.find(
    (slot) => minute >= slot.startMinute && minute < slot.endMinute,
  );

  if (activeSpecial) {
    return activeSpecial;
  }

  const daypart =
    dayparts.find(([, , start, end]) => minute >= start && minute < end) ??
    dayparts[0];

  const [daypartName, , daypartStart, daypartEnd] = daypart;
  let effectiveStart = daypartStart;
  let effectiveEnd = daypartEnd;

  for (const special of specials) {
    if (
      special.endMinute <= minute &&
      special.endMinute > effectiveStart
    ) {
      effectiveStart = special.endMinute;
    }

    if (
      special.startMinute > minute &&
      special.startMinute < effectiveEnd
    ) {
      effectiveEnd = special.startMinute;
    }
  }

  const weekendMode = day === 0 || day === 5 || day === 6;

  return {
    title: weekendMode ? "Fin de Semana Bravo" : "Programación regular",
    detail: `${daypartName} · Merengue, bachata y salsa.`,
    schedule: `${formatMinute(effectiveStart)} – ${formatMinute(effectiveEnd)}`,
    startMinute: effectiveStart,
    endMinute: effectiveEnd,
  };
}

function getDominicanClock(date: Date): { day: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santo_Domingo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);

  return {
    day: weekdayMap[weekday] ?? 0,
    minute: hour * 60 + minute,
  };
}

function getLiveProgramming(date: Date) {
  const clock = getDominicanClock(date);
  const current = getProgrammingAt(clock.day, clock.minute);

  const nextDay = current.endMinute >= 1440 ? (clock.day + 1) % 7 : clock.day;
  const nextMinute = current.endMinute >= 1440 ? 0 : current.endMinute;
  const next = getProgrammingAt(nextDay, nextMinute);

  return { current, next };
}

export default function FieramixProgramming() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const updateClock = () => setCurrentTime(new Date());

    updateClock();
    const timer = window.setInterval(updateClock, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const liveProgramming = useMemo(
    () => (currentTime ? getLiveProgramming(currentTime) : null),
    [currentTime],
  );

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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
          gap: "12px",
          marginTop: "22px",
        }}
      >
        <div
          style={{
            ...cardStyle,
            padding: "18px 20px",
            background:
              "linear-gradient(145deg, rgba(32,220,142,.14), rgba(255,255,255,.025))",
            border: "1px solid rgba(114,240,189,.22)",
          }}
        >
          <span
            style={{
              color: "#72f0bd",
              fontSize: ".7rem",
              fontWeight: 900,
              letterSpacing: ".1em",
            }}
          >
            ● AHORA EN FIERAMIX
          </span>
          <h3 style={{ margin: "8px 0 4px", fontSize: "1.25rem" }}>
            {liveProgramming?.current.title ?? "Actualizando programación…"}
          </h3>
          {liveProgramming ? (
            <>
              <p
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,.72)",
                  fontSize: ".88rem",
                  lineHeight: 1.5,
                }}
              >
                {liveProgramming.current.detail}
              </p>
              <strong
                style={{
                  display: "block",
                  marginTop: "8px",
                  color: "#d8fff0",
                  fontSize: ".82rem",
                }}
              >
                {liveProgramming.current.schedule}
              </strong>
            </>
          ) : null}
        </div>

        <div style={{ ...cardStyle, padding: "18px 20px" }}>
          <span
            style={{
              color: "rgba(255,255,255,.58)",
              fontSize: ".7rem",
              fontWeight: 900,
              letterSpacing: ".1em",
            }}
          >
            A CONTINUACIÓN
          </span>
          <h3 style={{ margin: "8px 0 4px", fontSize: "1.18rem" }}>
            {liveProgramming?.next.title ?? "Actualizando programación…"}
          </h3>
          {liveProgramming ? (
            <>
              <p
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,.66)",
                  fontSize: ".86rem",
                  lineHeight: 1.5,
                }}
              >
                {liveProgramming.next.detail}
              </p>
              <strong
                style={{
                  display: "block",
                  marginTop: "8px",
                  color: "rgba(255,255,255,.82)",
                  fontSize: ".8rem",
                }}
              >
                {liveProgramming.next.schedule}
              </strong>
            </>
          ) : null}
        </div>
      </div>

      <p
        style={{
          margin: "10px 2px 0",
          color: "rgba(255,255,255,.42)",
          fontSize: ".72rem",
        }}
      >
        Horario de República Dominicana.
      </p>

      <details style={{ marginTop: "18px" }}>
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
