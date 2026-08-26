"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "PANEL" },
  { href: "/dashboard/galeria-artistas", label: "GALERÍA DE ARTISTAS" },
  { href: "/dashboard/club-de-oyentes", label: "CLUB DE OYENTES" },
  { href: "/dashboard/portadas-radioboss", label: "PORTADAS RADIOBOSS" },
];

export default function AdminDashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación administrativa FIERAMIX"
      style={{
        position: "fixed",
        zIndex: 119,
        left: 18,
        bottom: 18,
        display: "flex",
        gap: 8,
        padding: 7,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,.12)",
        background: "rgba(7,12,27,.92)",
        boxShadow: "0 14px 38px rgba(0,0,0,.36)",
        backdropFilter: "blur(16px)",
        maxWidth: "calc(100vw - 36px)",
        overflowX: "auto",
      }}
    >
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              minHeight: 36,
              display: "inline-flex",
              alignItems: "center",
              padding: "0 12px",
              borderRadius: 999,
              textDecoration: "none",
              color: active ? "#07111f" : "#f7f8ff",
              background: active
                ? "linear-gradient(135deg,#43f5b1,#7ecfff)"
                : "transparent",
              fontSize: ".67rem",
              fontWeight: 1000,
              letterSpacing: ".04em",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
