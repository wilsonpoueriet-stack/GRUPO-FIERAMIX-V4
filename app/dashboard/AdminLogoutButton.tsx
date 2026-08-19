"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    if (loading) return;

    setLoading(true);

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/dashboard/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={loading}
      style={{
        position: "fixed",
        zIndex: 120,
        top: 18,
        right: 18,
        minHeight: 42,
        padding: "0 15px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,.14)",
        color: "#f7f8ff",
        background: "rgba(7,12,27,.9)",
        boxShadow: "0 12px 30px rgba(0,0,0,.3)",
        cursor: loading ? "wait" : "pointer",
        fontWeight: 900,
        letterSpacing: ".03em",
      }}
    >
      {loading ? "CERRANDO..." : "CERRAR SESIÓN"}
    </button>
  );
}
