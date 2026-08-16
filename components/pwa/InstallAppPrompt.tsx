"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const DISMISS_KEY = "fieramix-install-prompt-dismissed";
const DISMISS_TIME = 3 * 24 * 60 * 60 * 1000;

function isRunningStandalone() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function wasRecentlyDismissed() {
  try {
    const stored = window.localStorage.getItem(DISMISS_KEY);

    if (!stored) {
      return false;
    }

    return Date.now() - Number(stored) < DISMISS_TIME;
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // La instalación puede continuar aunque localStorage no esté disponible.
  }
}

export default function InstallAppPrompt() {
  const [visible, setVisible] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isRunningStandalone() || wasRecentlyDismissed()) {
      return;
    }

    const iosDevice = isIOSDevice();
    setIos(iosDevice);

    let timer: number | undefined;

    const showPrompt = () => {
      timer = window.setTimeout(() => {
        setVisible(true);
      }, 1400);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      setInstallPrompt(event as BeforeInstallPromptEvent);
      showPrompt();
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setInstallPrompt(null);

      try {
        window.localStorage.removeItem(DISMISS_KEY);
      } catch {
        // No requiere acción adicional.
      }
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    if (iosDevice) {
      showPrompt();
    }

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }

      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    rememberDismissal();
    setVisible(false);
  };

  const install = async () => {
    if (ios) {
      return;
    }

    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();

    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setVisible(false);
      setInstallPrompt(null);
      return;
    }

    rememberDismissal();
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          dismiss();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "rgba(2, 5, 18, .78)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="fieramix-install-title"
        style={{
          position: "relative",
          width: "min(460px, 100%)",
          padding: "34px 28px 28px",
          overflow: "hidden",
          textAlign: "center",
          color: "#f7f8ff",
          background:
            "linear-gradient(145deg, rgba(24,30,66,.98), rgba(7,10,26,.99))",
          border: "1px solid rgba(32,220,142,.34)",
          borderRadius: 28,
          boxShadow:
            "0 30px 90px rgba(0,0,0,.62), 0 0 70px rgba(32,220,142,.14)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            top: -130,
            right: -100,
            borderRadius: "50%",
            background: "#20dc8e",
            filter: "blur(100px)",
            opacity: 0.18,
          }}
        />

        <button
          type="button"
          aria-label="Cerrar aviso de instalación"
          onClick={dismiss}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 38,
            height: 38,
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: "50%",
            color: "#fff",
            background: "rgba(255,255,255,.05)",
            fontSize: 20,
          }}
        >
          ×
        </button>

        <img
          src="/icons/fieramix-192.png"
          alt=""
          width={88}
          height={88}
          style={{
            display: "block",
            margin: "0 auto 18px",
            borderRadius: 22,
            boxShadow: "0 14px 35px rgba(0,0,0,.35)",
          }}
        />

        <span
          style={{
            display: "inline-block",
            marginBottom: 12,
            color: "#7bf5be",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: ".18em",
          }}
        >
          FIERAMIX APP
        </span>

        <h2
          id="fieramix-install-title"
          style={{
            margin: "0 0 14px",
            fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
            lineHeight: 1,
            letterSpacing: "-.04em",
          }}
        >
          INSTALA NUESTRA APLICACIÓN
        </h2>

        <p
          style={{
            margin: "0 auto 24px",
            maxWidth: 360,
            color: "#cbd3ea",
            fontSize: 15,
            lineHeight: 1.65,
          }}
        >
          Lleva FIERAMIX contigo y disfruta toda nuestra red directamente
          desde tu dispositivo.
        </p>

        {ios ? (
          <div
            style={{
              padding: "15px 16px",
              color: "#e7ebff",
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.10)",
              borderRadius: 16,
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            En iPhone o iPad, toca <strong>Compartir</strong> y luego
            selecciona <strong>Añadir a pantalla de inicio</strong>.
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void install()}
            style={{
              width: "100%",
              minHeight: 54,
              border: 0,
              borderRadius: 999,
              color: "#04130d",
              background:
                "linear-gradient(135deg, #24e69a, #12bd79)",
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: ".06em",
              boxShadow: "0 14px 34px rgba(32,220,142,.24)",
            }}
          >
            INSTALAR FIERAMIX
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          style={{
            marginTop: 16,
            border: 0,
            color: "#aeb6d7",
            background: "transparent",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: ".08em",
          }}
        >
          AHORA NO
        </button>
      </section>
    </div>
  );
}
