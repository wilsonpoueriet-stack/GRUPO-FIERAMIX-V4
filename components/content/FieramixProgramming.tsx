"use client";

import { useEffect, useState } from "react";

type Slot = {
  title: string;
  detail: string;
  schedule: string;
  start: number;
  end: number;
};

type LiveState = {
  current: Slot;
  next: Slot;
};

const dayIndex: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const rotation = [
  "Éxitos actuales",
  "Recurrentes",
  "Clásicos",
  "TOP 05 — 5 canciones",
  "TOP 10 — 10 canciones",
  "TOP 25 — 15 canciones",
];

const dayparts = [
  ["La Madrugada de FIERAMIX", "12:00 a. m. – 5:00 a. m."],
  ["El Amanecer de FIERAMIX", "5:00 a. m. – 7:00 a. m."],
  ["La Mañana de FIERAMIX", "7:00 a. m. – 12:00 p. m."],
  ["El Almuerzo de FIERAMIX", "12:00 p. m. – 2:00 p. m."],
  ["La Tarde de FIERAMIX", "2:00 p. m. – 5:00 p. m."],
  ["El Atardecer de FIERAMIX", "5:00 p. m. – 7:00 p. m."],
  ["La Noche de FIERAMIX", "7:00 p. m. – 12:00 a. m."],
];

const specials = [
  ["Íntimamente", "Martes a viernes · 12:00 a. m. – 2:00 a. m.", "Música romántica."],
  ["Románticamente", "Lunes a jueves · 6:00 a. m. – 8:00 a. m.", "Música romántica."],
  ["La Hora Cero", "Lunes a jueves · 12:00 p. m. – 1:00 p. m.", "Música romántica."],
  [
    "Rosariomanía",
    "Sábados · 2:00 p. m. – 6:00 p. m.",
    "Producido y conducido por Wilson Poueriet. Retransmisión desde Estrella 92.3 FM. Homenaje en vida a la música de la Dinastía Rosario.",
  ],
  [
    "La Hora de los Mayimbes",
    "Domingos · 5:00 p. m. – 6:00 p. m.",
    "Homenaje al Mayimbito, Alex Bueno. Merengue y bachata.",
  ],
];

const hourlyContent = [
  "El Acertijo",
  "El Minuto de Finanzas",
  "Saludos VIP",
  "Conoce Tu País",
];

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
];

function regular(
  daypart: string,
  schedule: string,
  start: number,
  end: number,
  weekend: boolean,
): Slot {
  return {
    title: weekend ? "Fin de Semana Bravo" : "Programación regular",
    detail: `${daypart} · Merengue, bachata y salsa.`,
    schedule,
    start,
    end,
  };
}

function getSchedule(day: number): Slot[] {
  if (day === 1) {
    return [
      regular("La Madrugada de FIERAMIX", "12:00 a. m. – 5:00 a. m.", 0, 300, false),
      regular("El Amanecer de FIERAMIX", "5:00 a. m. – 6:00 a. m.", 300, 360, false),
      { title: "Románticamente", detail: "Música romántica.", schedule: "6:00 a. m. – 8:00 a. m.", start: 360, end: 480 },
      regular("La Mañana de FIERAMIX", "8:00 a. m. – 12:00 p. m.", 480, 720, false),
      { title: "La Hora Cero", detail: "Música romántica.", schedule: "12:00 p. m. – 1:00 p. m.", start: 720, end: 780 },
      regular("El Almuerzo de FIERAMIX", "1:00 p. m. – 2:00 p. m.", 780, 840, false),
      regular("La Tarde de FIERAMIX", "2:00 p. m. – 5:00 p. m.", 840, 1020, false),
      regular("El Atardecer de FIERAMIX", "5:00 p. m. – 7:00 p. m.", 1020, 1140, false),
      regular("La Noche de FIERAMIX", "7:00 p. m. – 12:00 a. m.", 1140, 1440, false),
    ];
  }

  if (day >= 2 && day <= 4) {
    return [
      { title: "Íntimamente", detail: "Música romántica.", schedule: "12:00 a. m. – 2:00 a. m.", start: 0, end: 120 },
      regular("La Madrugada de FIERAMIX", "2:00 a. m. – 5:00 a. m.", 120, 300, false),
      regular("El Amanecer de FIERAMIX", "5:00 a. m. – 6:00 a. m.", 300, 360, false),
      { title: "Románticamente", detail: "Música romántica.", schedule: "6:00 a. m. – 8:00 a. m.", start: 360, end: 480 },
      regular("La Mañana de FIERAMIX", "8:00 a. m. – 12:00 p. m.", 480, 720, false),
      { title: "La Hora Cero", detail: "Música romántica.", schedule: "12:00 p. m. – 1:00 p. m.", start: 720, end: 780 },
      regular("El Almuerzo de FIERAMIX", "1:00 p. m. – 2:00 p. m.", 780, 840, false),
      regular("La Tarde de FIERAMIX", "2:00 p. m. – 5:00 p. m.", 840, 1020, false),
      regular("El Atardecer de FIERAMIX", "5:00 p. m. – 7:00 p. m.", 1020, 1140, false),
      regular("La Noche de FIERAMIX", "7:00 p. m. – 12:00 a. m.", 1140, 1440, false),
    ];
  }

  if (day === 5) {
    return [
      { title: "Íntimamente", detail: "Música romántica.", schedule: "12:00 a. m. – 2:00 a. m.", start: 0, end: 120 },
      regular("La Madrugada de FIERAMIX", "2:00 a. m. – 5:00 a. m.", 120, 300, true),
      regular("El Amanecer de FIERAMIX", "5:00 a. m. – 7:00 a. m.", 300, 420, true),
      regular("La Mañana de FIERAMIX", "7:00 a. m. – 12:00 p. m.", 420, 720, true),
      regular("El Almuerzo de FIERAMIX", "12:00 p. m. – 2:00 p. m.", 720, 840, true),
      regular("La Tarde de FIERAMIX", "2:00 p. m. – 5:00 p. m.", 840, 1020, true),
      regular("El Atardecer de FIERAMIX", "5:00 p. m. – 7:00 p. m.", 1020, 1140, true),
      regular("La Noche de FIERAMIX", "7:00 p. m. – 12:00 a. m.", 1140, 1440, true),
    ];
  }

  if (day === 6) {
    return [
      regular("La Madrugada de FIERAMIX", "12:00 a. m. – 5:00 a. m.", 0, 300, true),
      regular("El Amanecer de FIERAMIX", "5:00 a. m. – 7:00 a. m.", 300, 420, true),
      regular("La Mañana de FIERAMIX", "7:00 a. m. – 12:00 p. m.", 420, 720, true),
      regular("El Almuerzo de FIERAMIX", "12:00 p. m. – 2:00 p. m.", 720, 840, true),
      {
        title: "Rosariomanía",
        detail: "Con Wilson Poueriet · Retransmisión desde Estrella 92.3 FM · Homenaje a la Dinastía Rosario.",
        schedule: "2:00 p. m. – 6:00 p. m.",
        start: 840,
        end: 1080,
      },
      regular("El Atardecer de FIERAMIX", "6:00 p. m. – 7:00 p. m.", 1080, 1140, true),
      regular("La Noche de FIERAMIX", "7:00 p. m. – 12:00 a. m.", 1140, 1440, true),
    ];
  }

  return [
    regular("La Madrugada de FIERAMIX", "12:00 a. m. – 5:00 a. m.", 0, 300, true),
    regular("El Amanecer de FIERAMIX", "5:00 a. m. – 7:00 a. m.", 300, 420, true),
    regular("La Mañana de FIERAMIX", "7:00 a. m. – 12:00 p. m.", 420, 720, true),
    regular("El Almuerzo de FIERAMIX", "12:00 p. m. – 2:00 p. m.", 720, 840, true),
    regular("La Tarde de FIERAMIX", "2:00 p. m. – 5:00 p. m.", 840, 1020, true),
    {
      title: "La Hora de los Mayimbes",
      detail: "Homenaje al Mayimbito, Alex Bueno · Merengue y bachata.",
      schedule: "5:00 p. m. – 6:00 p. m.",
      start: 1020,
      end: 1080,
    },
    regular("El Atardecer de FIERAMIX", "6:00 p. m. – 7:00 p. m.", 1080, 1140, true),
    regular("La Noche de FIERAMIX", "7:00 p. m. – 12:00 a. m.", 1140, 1440, true),
  ];
}

function getDominicanClock(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santo_Domingo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const rawHour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const hour = rawHour === 24 ? 0 : rawHour;

  return {
    day: dayIndex[weekday] ?? 0,
    minute: hour * 60 + minute,
  };
}

function getLiveState(date: Date): LiveState {
  const clock = getDominicanClock(date);
  const schedule = getSchedule(clock.day);
  const foundIndex = schedule.findIndex(
    (slot) => clock.minute >= slot.start && clock.minute < slot.end,
  );
  const index = foundIndex >= 0 ? foundIndex : 0;
  const current = schedule[index];
  const next = schedule[index + 1] ?? getSchedule((clock.day + 1) % 7)[0];

  return { current, next };
}

const panelStyle = {
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: "18px",
  background: "rgba(255,255,255,.045)",
};

export default function FieramixProgramming() {
  const [live, setLive] = useState<LiveState | null>(null);

  useEffect(() => {
    const update = () => setLive(getLiveState(new Date()));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      id="programacion"
      style={{
        width: "min(1180px, calc(100% - 32px))",
        margin: "clamp(42px, 7vw, 86px) auto",
        padding: "clamp(24px, 4vw, 38px)",
        borderRadius: "28px",
        background:
          "radial-gradient(circle at 0% 0%, rgba(124,58,237,.28), transparent 34%), radial-gradient(circle at 100% 100%, rgba(32,220,142,.18), transparent 34%), #090f20",
        border: "1px solid rgba(255,255,255,.10)",
        color: "#fff",
        boxShadow: "0 30px 90px rgba(0,0,0,.24)",
      }}
    >
      <span style={{ color: "#72f0bd", fontSize: ".74rem", fontWeight: 900, letterSpacing: ".12em" }}>
        PARRILLA SEMANAL OFICIAL
      </span>
      <h2 style={{ margin: "8px 0 0", fontSize: "clamp(1.8rem, 4.5vw, 3.2rem)", lineHeight: 1.02 }}>
        NUESTRA PROGRAMACIÓN EN FIERAMIX
      </h2>
      <p style={{ margin: "13px 0 0", color: "rgba(255,255,255,.68)" }}>
        Música, información, especiales y animación durante las 24 horas.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
          gap: "12px",
          marginTop: "22px",
        }}
      >
        <div style={{ ...panelStyle, padding: "18px 20px", borderColor: "rgba(114,240,189,.25)" }}>
          <span style={{ color: "#72f0bd", fontSize: ".7rem", fontWeight: 900 }}>● AHORA EN FIERAMIX</span>
          <h3 style={{ margin: "8px 0 4px" }}>{live?.current.title ?? "Actualizando programación…"}</h3>
          {live ? (
            <>
              <p style={{ margin: 0, color: "rgba(255,255,255,.72)", lineHeight: 1.5 }}>{live.current.detail}</p>
              <strong style={{ display: "block", marginTop: "8px", color: "#d8fff0", fontSize: ".82rem" }}>
                {live.current.schedule}
              </strong>
            </>
          ) : null}
        </div>

        <div style={{ ...panelStyle, padding: "18px 20px" }}>
          <span style={{ color: "rgba(255,255,255,.58)", fontSize: ".7rem", fontWeight: 900 }}>A CONTINUACIÓN</span>
          <h3 style={{ margin: "8px 0 4px" }}>{live?.next.title ?? "Actualizando programación…"}</h3>
          {live ? (
            <>
              <p style={{ margin: 0, color: "rgba(255,255,255,.66)", lineHeight: 1.5 }}>{live.next.detail}</p>
              <strong style={{ display: "block", marginTop: "8px", fontSize: ".82rem" }}>{live.next.schedule}</strong>
            </>
          ) : null}
        </div>
      </div>

      <p style={{ margin: "9px 2px 0", color: "rgba(255,255,255,.42)", fontSize: ".72rem" }}>
        Horario de República Dominicana.
      </p>

      <details style={{ marginTop: "18px" }}>
        <summary
          style={{
            cursor: "pointer",
            display: "inline-flex",
            padding: "12px 18px",
            borderRadius: "999px",
            border: "1px solid rgba(114,240,189,.28)",
            background: "rgba(114,240,189,.10)",
            color: "#d8fff0",
            fontSize: ".78rem",
            fontWeight: 900,
            letterSpacing: ".08em",
          }}
        >
          VER PROGRAMACIÓN COMPLETA
        </summary>

        <div style={{ display: "grid", gap: "16px", marginTop: "22px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
            <div style={{ ...panelStyle, padding: "18px" }}>
              <strong>LUNES A JUEVES</strong>
              <p style={{ margin: "7px 0 0", color: "rgba(255,255,255,.68)" }}>Programación regular · Merengue, bachata y salsa.</p>
            </div>
            <div style={{ ...panelStyle, padding: "18px" }}>
              <strong>VIERNES A DOMINGO</strong>
              <p style={{ margin: "7px 0 0", color: "rgba(255,255,255,.68)" }}>Fin de Semana Bravo · Merengue, bachata y salsa.</p>
            </div>
            <div style={{ ...panelStyle, padding: "18px" }}>
              <strong>24 HORAS</strong>
              <p style={{ margin: "7px 0 0", color: "rgba(255,255,255,.68)" }}>Alexander Sadalab “El Eterno” · Animador virtual y voz institucional.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            <div style={{ ...panelStyle, padding: "20px" }}>
              <h3 style={{ marginTop: 0 }}>Rotación musical de FIERAMIX</h3>
              {rotation.map((item, index) => (
                <div key={item} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  <strong style={{ color: "#72f0bd", marginRight: "10px" }}>{index + 1}.</strong>{item}
                </div>
              ))}
            </div>

            <div style={{ ...panelStyle, padding: "20px" }}>
              <h3 style={{ marginTop: 0 }}>Programas especiales</h3>
              {specials.map(([title, schedule, description]) => (
                <div key={title} style={{ padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  <strong>{title}</strong>
                  <span style={{ display: "block", color: "#72f0bd", fontSize: ".8rem", marginTop: "3px" }}>{schedule}</span>
                  <p style={{ margin: "5px 0 0", color: "rgba(255,255,255,.64)", fontSize: ".86rem" }}>{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            <div style={{ ...panelStyle, padding: "20px" }}>
              <h3 style={{ marginTop: 0 }}>FIERAMIX NOTICIAS</h3>
              <p style={{ color: "rgba(255,255,255,.68)" }}>Lunes a jueves, cada hora desde las 9:30 a. m. hasta las 5:30 p. m.</p>
              <p style={{ marginBottom: 0, color: "#d8fff0", lineHeight: 1.7 }}>{newsTimes.join(" · ")}</p>
            </div>
            <div style={{ ...panelStyle, padding: "20px" }}>
              <h3 style={{ marginTop: 0 }}>Cada hora en punto</h3>
              <p style={{ color: "rgba(255,255,255,.68)" }}>Podcasts y cápsulas de EL GRUPO FIERAMIX.COM.</p>
              <p style={{ marginBottom: 0, lineHeight: 1.7 }}>{hourlyContent.join(" · ")}</p>
            </div>
          </div>

          <div style={{ ...panelStyle, padding: "20px" }}>
            <h3 style={{ marginTop: 0 }}>Franjas de FIERAMIX</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "8px" }}>
              {dayparts.map(([name, schedule]) => (
                <div key={name} style={{ padding: "9px 10px", background: "rgba(255,255,255,.035)", borderRadius: "10px" }}>
                  <strong style={{ display: "block", fontSize: ".85rem" }}>{name}</strong>
                  <span style={{ color: "rgba(255,255,255,.56)", fontSize: ".78rem" }}>{schedule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
