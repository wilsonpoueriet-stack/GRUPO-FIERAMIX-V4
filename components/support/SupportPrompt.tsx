"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./SupportPrompt.module.css";

const LAST_SHOWN_KEY = "fieramix:support:last-shown";
const SUPPORTER_KEY = "fieramix:support:supporter";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_FIVE_DAYS = 35 * 24 * 60 * 60 * 1000;

export default function SupportPrompt({ playing, stationName }: { playing: boolean; stationName: string }) {
  const [open, setOpen] = useState(false);
  const listenedSeconds = useRef(0);
  const shownThisSession = useRef(false);

  useEffect(() => {
    if (!playing || shownThisSession.current) return;
    const timer = window.setInterval(() => {
      listenedSeconds.current += 1;
      if (listenedSeconds.current < 75) return;

      let canShow = true;
      try {
        const lastShown = Number(window.localStorage.getItem(LAST_SHOWN_KEY) || 0);
        const supporter = window.localStorage.getItem(SUPPORTER_KEY) === "yes";
        const waitTime = supporter ? THIRTY_FIVE_DAYS : SEVEN_DAYS;
        canShow = !lastShown || Date.now() - lastShown >= waitTime;
      } catch {
        // Si el navegador bloquea el almacenamiento, se respeta la sesión actual.
      }

      shownThisSession.current = true;
      window.clearInterval(timer);
      if (!canShow) return;
      try { window.localStorage.setItem(LAST_SHOWN_KEY, String(Date.now())); } catch {}
      setOpen(true);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing]);

  function close() { setOpen(false); }
  function markSupporter() {
    try {
      window.localStorage.setItem(SUPPORTER_KEY, "yes");
      window.localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
    } catch {}
    close();
  }

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={close}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="support-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className={styles.close} type="button" onClick={close} aria-label="Cerrar">×</button>
        <span>FIERAMIX VIP PREMIUM</span>
        <h2 id="support-title">Ayúdanos a mantener la música encendida</h2>
        <p>Si disfrutas {stationName}, tu aporte voluntario nos ayuda a sostener la transmisión, mejorar el sonido y continuar creciendo.</p>
        <div className={styles.actions}>
          <Link href="/apoyar">QUIERO APOYAR</Link>
          <button type="button" onClick={markSupporter}>YA REALICÉ MI APORTE</button>
        </div>
        <button className={styles.later} type="button" onClick={close}>Ahora no, seguir escuchando</button>
      </section>
    </div>
  );
}
