"use client";

import { useState } from "react";

type NewsShareButtonsProps = {
  title: string;
  url: string;
};

const iconStyle = {
  width: "20px",
  height: "20px",
  flex: "0 0 auto",
} as const;

export default function NewsShareButtons({ title, url }: NewsShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const text = `${title} | FIERAMIX NOTICIAS`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
      color: "#25d366",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={iconStyle}>
          <path fill="currentColor" d="M12 2a9.8 9.8 0 0 0-8.5 14.7L2.2 22l5.4-1.4A10 10 0 1 0 12 2Zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-3.2.9.9-3.1-.2-.3A7.8 7.8 0 1 1 12 19.8Zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1-1.4-.7-2.4-1.3-3.3-2.9-.2-.3.2-.5.7-1.1.1-.2.1-.3 0-.5l-.7-1.7c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 1.8.8 2.5.8 3.4.7.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1 0-.2-.1-.5-.2Z" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "#1877f2",
      icon: <strong aria-hidden="true" style={{ fontSize: "20px" }}>f</strong>,
    },
    {
      label: "X",
      href: `https://x.com/intent/post?text=${encodedText}&url=${encodedUrl}`,
      color: "#111827",
      icon: <strong aria-hidden="true" style={{ fontSize: "17px" }}>𝕏</strong>,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      color: "#229ed9",
      icon: <strong aria-hidden="true" style={{ fontSize: "17px" }}>➤</strong>,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "#0a66c2",
      icon: <strong aria-hidden="true" style={{ fontSize: "15px" }}>in</strong>,
    },
    {
      label: "Correo",
      href: `mailto:?subject=${encodedText}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
      color: "#a855f7",
      icon: <strong aria-hidden="true" style={{ fontSize: "17px" }}>✉</strong>,
    },
  ];

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  async function shareMore() {
    if (navigator.share) {
      await navigator.share({ title: text, text, url });
      return;
    }
    await copyLink();
  }

  const buttonBase = {
    minHeight: "44px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px 14px",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: "999px",
    color: "#ffffff",
    fontSize: ".8rem",
    fontWeight: 800,
    textDecoration: "none",
    cursor: "pointer",
  } as const;

  return (
    <aside
      aria-label="Compartir esta noticia"
      style={{
        marginTop: "28px",
        paddingTop: "24px",
        borderTop: "1px solid rgba(255,255,255,.1)",
      }}
    >
      <strong style={{ display: "block", marginBottom: "14px", fontSize: ".9rem" }}>
        COMPARTE ESTA NOTICIA
      </strong>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.label === "Correo" ? undefined : "_blank"}
            rel="noopener noreferrer"
            style={{ ...buttonBase, background: link.color }}
            aria-label={`Compartir en ${link.label}`}
          >
            {link.icon}
            {link.label}
          </a>
        ))}
        <button
          type="button"
          onClick={() => void copyLink()}
          style={{ ...buttonBase, background: "#273149" }}
        >
          <span aria-hidden="true">🔗</span>
          {copied ? "ENLACE COPIADO" : "COPIAR ENLACE"}
        </button>
        <button
          type="button"
          onClick={() => void shareMore()}
          style={{ ...buttonBase, background: "#ff4f7b" }}
        >
          <span aria-hidden="true">↗</span>
          MÁS OPCIONES
        </button>
      </div>
    </aside>
  );
}
