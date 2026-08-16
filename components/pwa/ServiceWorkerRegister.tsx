"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    async function registerServiceWorker() {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
      } catch (error) {
        console.error(
          "No se pudo registrar el service worker de FIERAMIX:",
          error
        );
      }
    }

    void registerServiceWorker();
  }, []);

  return null;
}
