"use client";

import { useEffect, useRef, useState } from "react";

const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.fieramix.webapp";
const APP_STORE_URL =
  "https://apps.apple.com/es/app/fieramix/id6755240653";

export default function AppDownloadFloat() {
  const [open, setOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        shellRef.current &&
        !shellRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={shellRef} className="appDownloadFloatShell">
      {open && (
        <section
          id="fieramix-app-download-menu"
          className="appDownloadMenu"
          aria-label="Descargar FieraMix App"
        >
          <div className="appDownloadHeader">
            <img
              src="/icons/fieramix-192.png"
              alt=""
              aria-hidden="true"
            />
            <div>
              <small>APP OFICIAL</small>
              <strong>FIERAMIX</strong>
              <span>SIEMPRE CONTIGO</span>
            </div>
          </div>

          <p>
            Descarga la app oficial de EL GRUPO FIERAMIX.COM en tu dispositivo.
          </p>

          <div className="appDownloadStores">
            <a
              href={GOOGLE_PLAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="storeButton"
              onClick={() => setOpen(false)}
            >
              <b aria-hidden="true">▶</b>
              <span>
                <small>ANDROID</small>
                <strong>GOOGLE PLAY</strong>
              </span>
            </a>

            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="storeButton"
              onClick={() => setOpen(false)}
            >
              <b aria-hidden="true"></b>
              <span>
                <small>iPHONE</small>
                <strong>APP STORE</strong>
              </span>
            </a>
          </div>
        </section>
      )}

      <button
        type="button"
        className={`appDownloadLauncher${open ? " isOpen" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="fieramix-app-download-menu"
        aria-label={open ? "Cerrar opciones de descarga" : "Descargar FieraMix App"}
        title="Descarga FieraMix App"
      >
        <span className="appDownloadLauncherText">
          <small>DESCARGA</small>
          <strong>FIERAMIX APP</strong>
        </span>
        <b aria-hidden="true">APP</b>
      </button>

      <style>{`
        .appDownloadFloatShell {
          position: fixed;
          z-index: 96;
          right: 25px;
          bottom: 252px;
          display: grid;
          justify-items: end;
          gap: 12px;
          pointer-events: none;
        }

        .appDownloadLauncher,
        .appDownloadMenu {
          pointer-events: auto;
        }

        .appDownloadLauncher {
          min-height: 58px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 8px 8px 15px;
          border: 1px solid rgba(101, 164, 255, .52);
          border-radius: 999px;
          color: #f7f8ff;
          background:
            linear-gradient(135deg, rgba(18, 30, 67, .98), rgba(8, 12, 29, .98));
          box-shadow:
            0 16px 42px rgba(0, 0, 0, .42),
            0 0 26px rgba(62, 139, 255, .16);
          cursor: pointer;
          transition:
            transform .2s ease,
            border-color .2s ease,
            box-shadow .2s ease;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .appDownloadLauncher:hover,
        .appDownloadLauncher.isOpen {
          transform: translateY(-3px);
          border-color: rgba(123, 245, 190, .58);
          box-shadow:
            0 18px 48px rgba(0, 0, 0, .48),
            0 0 30px rgba(32, 220, 142, .17);
        }

        .appDownloadLauncherText {
          display: grid;
          gap: 2px;
          text-align: right;
        }

        .appDownloadLauncherText small {
          color: #8ab8ff;
          font-size: .54rem;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .appDownloadLauncherText strong {
          font-size: .68rem;
          font-weight: 1000;
          letter-spacing: .04em;
        }

        .appDownloadLauncher > b {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          flex: 0 0 42px;
          border-radius: 50%;
          color: #07111f;
          background: linear-gradient(135deg, #75b6ff, #7bf5be);
          box-shadow: 0 0 22px rgba(101, 164, 255, .28);
          font-size: .62rem;
          font-weight: 1000;
        }

        .appDownloadMenu {
          width: min(325px, calc(100vw - 34px));
          padding: 18px;
          border: 1px solid rgba(101, 164, 255, .35);
          border-radius: 22px;
          color: #f7f8ff;
          background:
            radial-gradient(circle at 100% 0, rgba(32, 220, 142, .10), transparent 34%),
            linear-gradient(145deg, rgba(18, 26, 58, .99), rgba(6, 10, 26, .99));
          box-shadow:
            0 28px 70px rgba(0, 0, 0, .56),
            0 0 34px rgba(62, 139, 255, .10);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: appDownloadEnter .16s ease-out;
        }

        .appDownloadHeader {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .appDownloadHeader img {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          object-fit: contain;
          background: #fff;
          box-shadow: 0 10px 28px rgba(0, 0, 0, .28);
        }

        .appDownloadHeader div {
          display: grid;
          gap: 2px;
        }

        .appDownloadHeader small {
          color: #7bf5be;
          font-size: .58rem;
          font-weight: 1000;
          letter-spacing: .14em;
        }

        .appDownloadHeader strong {
          font-size: 1.08rem;
          font-weight: 1000;
          letter-spacing: .02em;
        }

        .appDownloadHeader span {
          color: #aeb6d7;
          font-size: .63rem;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .appDownloadMenu > p {
          margin: 14px 0;
          color: #cbd3ea;
          font-size: .78rem;
          line-height: 1.5;
        }

        .appDownloadStores {
          display: grid;
          gap: 9px;
        }

        .storeButton {
          min-height: 54px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 13px;
          border: 1px solid rgba(255, 255, 255, .12);
          border-radius: 14px;
          color: #fff;
          background: rgba(255, 255, 255, .045);
          text-decoration: none;
          transition:
            transform .16s ease,
            border-color .16s ease,
            background .16s ease;
        }

        .storeButton:hover {
          transform: translateY(-2px);
          border-color: rgba(123, 245, 190, .36);
          background: rgba(123, 245, 190, .07);
        }

        .storeButton > b {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          flex: 0 0 34px;
          border-radius: 10px;
          color: #07111f;
          background: #f7f8ff;
          font-size: 1rem;
        }

        .storeButton > span {
          display: grid;
          gap: 1px;
        }

        .storeButton small {
          color: #aeb6d7;
          font-size: .54rem;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .storeButton strong {
          font-size: .74rem;
          font-weight: 1000;
          letter-spacing: .04em;
        }

        @keyframes appDownloadEnter {
          from {
            opacity: 0;
            transform: translateY(8px) scale(.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 680px) {
          .appDownloadFloatShell {
            right: 14px;
            bottom: 248px;
          }

          .appDownloadLauncher {
            min-height: 52px;
            padding: 6px;
          }

          .appDownloadLauncherText {
            display: none;
          }

          .appDownloadLauncher > b {
            width: 40px;
            height: 40px;
            flex-basis: 40px;
          }

          .appDownloadMenu {
            width: min(310px, calc(100vw - 28px));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .appDownloadMenu,
          .appDownloadLauncher,
          .storeButton {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
