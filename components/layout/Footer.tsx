type RankingSocialIconType =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "x"
  | "youtube";

function RankingSocialIcon({
  type,
}: {
  type: RankingSocialIconType;
}) {
  if (type === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#1877F2" />
        <path
          d="M13.5 19v-6h2l.3-2.4h-2.3V9c0-.7.2-1.2 1.3-1.2H16V5.7c-.2 0-1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v1.5H8.4V13h2.2v6h2.9Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="6" fill="#E4405F" />
        <rect
          x="6.3"
          y="6.3"
          width="11.4"
          height="11.4"
          rx="3.4"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
        />
        <circle
          cx="12"
          cy="12"
          r="2.8"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
        />
        <circle cx="16.4" cy="7.7" r="1" fill="#FFFFFF" />
      </svg>
    );
  }

  if (type === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#111111" />
        <path
          d="M14.2 5.2v8.1a4.1 4.1 0 1 1-3.5-4v2.7a1.5 1.5 0 1 0 1 1.4V5.2h2.5Zm0 0c.4 2.2 1.7 3.5 3.8 3.9v2.6a6.8 6.8 0 0 1-3.8-1.5v-5Z"
          fill="#FFFFFF"
        />
        <path
          d="M14.2 5.2c.4 2.2 1.7 3.5 3.8 3.9"
          fill="none"
          stroke="#25F4EE"
          strokeWidth="1"
        />
        <path
          d="M10.7 9.3a4.1 4.1 0 0 0-3.5 4"
          fill="none"
          stroke="#FE2C55"
          strokeWidth="1"
        />
      </svg>
    );
  }

  if (type === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#000000" />
        <path
          d="M7 6.5h3.2l2.7 3.7 3.2-3.7h1.9l-4.2 4.9 4.7 6.1h-3.2l-3.1-4.1-3.5 4.1H6.8l4.5-5.3L7 6.5Zm2.2 1.4 6.8 8.2h1L10.2 7.9h-1Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="4" fill="#FF0000" />
      <path d="M10 9v6l5-3-5-3Z" fill="#FFFFFF" />
    </svg>
  );
}

const socialLinks: {
  label: string;
  href: string;
  type: RankingSocialIconType;
}[] = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/FieraMIXRD",
    type: "facebook",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/fieramix",
    type: "instagram",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@elgrupofieramix",
    type: "tiktok",
  },
  {
    label: "X",
    href: "https://x.com/FieraMIX",
    type: "x",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@fieramixtv5937",
    type: "youtube",
  },
];

export default function Footer() {
  return (
    <footer className="portalFooter">
      <div className="portalFooterShell">
        <div className="portalFooterAccent" />

        <div className="portalFooterTop">
          <div className="portalFooterIdentity">
            <strong>EL GRUPO FIERAMIX.COM</strong>
            <span>LA RED LATINA QUE MUEVE AL MUNDO</span>

            <div className="portalFooterSocial" aria-label="Redes sociales">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="socialIcon"
                  aria-label={social.label}
                  title={social.label}
                >
                  <RankingSocialIcon type={social.type} />
                </a>
              ))}
            </div>

            <a
              className="portalFooterPhone"
              href="tel:+18098419586"
              aria-label="Llamar al 809 841 9586"
            >
              809 841 9586
            </a>
          </div>

          <nav
            className="portalFooterNav"
            aria-label="Navegación del pie de página"
          >
            <a href="#">INICIO</a>
            <a href="#emisoras">EMISORAS</a>
            <a href="#top-musical">TOP MUSICAL</a>
            <a href="#noticias">NOTICIAS</a>
            <a href="#club">CLUB DE OYENTES</a>
          </nav>
        </div>

        <div className="portalFooterDivider" />

        <div className="portalFooterBottom">
          <span>RADIO · MÚSICA · INFORMACIÓN</span>
          <small>
            &copy; 2026 EL GRUPO FIERAMIX.COM · TODOS LOS DERECHOS RESERVADOS
          </small>
        </div>
      </div>

      <style jsx>{`
        .portalFooter {
          position: relative;
          display: block;
          width: 100%;
          padding: 30px 5vw 108px;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          background:
            radial-gradient(
              circle at 12% 0%,
              rgba(106, 70, 255, 0.1),
              transparent 28%
            ),
            radial-gradient(
              circle at 88% 100%,
              rgba(25, 224, 173, 0.04),
              transparent 28%
            ),
            #02040d;
          color: rgba(255, 255, 255, 0.68);
        }

        .portalFooterShell {
          position: relative;
          max-width: 1450px;
          margin: 0 auto;
          overflow: hidden;
          padding: 30px 34px 22px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          background:
            linear-gradient(
              135deg,
              rgba(12, 17, 39, 0.96),
              rgba(4, 8, 22, 0.96) 55%,
              rgba(3, 15, 20, 0.96)
            );
          box-shadow:
            0 24px 65px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.035);
        }

        .portalFooterAccent {
          position: absolute;
          top: 0;
          left: 34px;
          right: 34px;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            #21e6c1,
            #52b9ff 42%,
            rgba(111, 72, 255, 0.6) 72%,
            transparent
          );
          opacity: 0.75;
        }

        .portalFooterTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 48px;
        }

        .portalFooterIdentity {
          display: grid;
          justify-items: start;
          min-width: 250px;
          gap: 6px;
        }

        .portalFooterIdentity strong {
          margin-top: 3px;
          color: #ffffff;
          font-size: 1.08rem;
          font-weight: 1000;
          line-height: 1;
          letter-spacing: 0.012em;
          text-shadow: 0 2px 18px rgba(255, 255, 255, 0.06);
        }

        .portalFooterIdentity > span {
          color: #7fe7ff;
          font-size: 0.68rem;
          font-weight: 900;
          line-height: 1.35;
          letter-spacing: 0.065em;
        }

        .portalFooterSocial {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 9px;
        }

        .socialIcon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.11);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.09),
            0 6px 15px rgba(0, 0, 0, 0.2);
          text-decoration: none;
          transition:
            transform 0.16s ease,
            border-color 0.16s ease,
            background 0.16s ease;
        }

        .socialIcon:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.32);
          background: rgba(255, 255, 255, 0.16);
        }

        .socialIcon :global(svg) {
          display: block;
          width: 25px;
          height: 25px;
          flex: 0 0 25px;
          overflow: visible;
        }

        .portalFooterPhone {
          display: inline-flex;
          align-items: center;
          min-height: 24px;
          margin-top: 3px;
          color: #ffd66e;
          font-size: 0.8rem;
          font-weight: 1000;
          letter-spacing: 0.075em;
          text-decoration: none;
          transition:
            color 0.18s ease,
            transform 0.18s ease;
        }

        .portalFooterPhone:hover {
          color: #ffffff;
          transform: translateX(2px);
        }

        .portalFooterNav {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 7px;
        }

        .portalFooterNav a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 30px;
          padding: 0 12px;
          border: 1px solid transparent;
          border-radius: 999px;
          color: rgba(255, 255, 255, 0.64);
          background: rgba(255, 255, 255, 0.015);
          font-size: 0.66rem;
          font-weight: 1000;
          letter-spacing: 0.075em;
          text-decoration: none;
          white-space: nowrap;
          transition:
            color 0.18s ease,
            background 0.18s ease,
            border-color 0.18s ease,
            transform 0.18s ease;
        }

        .portalFooterNav a:hover {
          color: #8affd1;
          border-color: rgba(123, 245, 190, 0.18);
          background: rgba(123, 245, 190, 0.06);
          transform: translateY(-1px);
        }

        .portalFooterDivider {
          height: 1px;
          margin: 25px 0 18px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.09),
            rgba(255, 255, 255, 0.04) 65%,
            transparent
          );
        }

        .portalFooterBottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
        }

        .portalFooterBottom > span {
          color: #7bf5be;
          font-size: 0.61rem;
          font-weight: 1000;
          letter-spacing: 0.17em;
          white-space: nowrap;
        }

        .portalFooterBottom small {
          margin: 0;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.64rem;
          font-weight: 800;
          line-height: 1.5;
          letter-spacing: 0.045em;
          text-align: right;
        }

        @media (max-width: 1000px) {
          .portalFooterTop {
            gap: 30px;
          }

          .portalFooterNav {
            max-width: 440px;
          }
        }

        @media (max-width: 820px) {
          .portalFooterTop {
            flex-direction: column;
            gap: 25px;
          }

          .portalFooterNav {
            justify-content: flex-start;
            max-width: none;
            padding-top: 0;
          }
        }

        @media (max-width: 680px) {
          .portalFooter {
            padding: 24px 16px 96px;
          }

          .portalFooterShell {
            padding: 27px 20px 20px;
            border-radius: 17px;
          }

          .portalFooterAccent {
            left: 20px;
            right: 20px;
          }

          .portalFooterIdentity {
            min-width: 0;
          }

          .portalFooterIdentity strong {
            font-size: 0.98rem;
          }

          .portalFooterIdentity > span {
            font-size: 0.61rem;
          }

          .portalFooterNav {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            width: 100%;
            gap: 8px;
          }

          .portalFooterNav a {
            justify-content: flex-start;
            padding: 0 10px;
          }

          .portalFooterBottom {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }

          .portalFooterBottom > span {
            white-space: normal;
          }

          .portalFooterBottom small {
            text-align: left;
          }
        }

        @media (max-width: 420px) {
          .portalFooterNav {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
}
