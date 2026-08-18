"use client";

import { useEffect } from "react";

const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.fieramix.webapp";
const APP_STORE_URL =
  "https://apps.apple.com/es/app/fieramix/id6755240653";

function makeStoreLink(label: string, href: string) {
  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const span = document.createElement("span");
  span.textContent = label;
  link.appendChild(span);

  return link;
}

export default function AppHeroUpgrade() {
  useEffect(() => {
    const slide = document.querySelector<HTMLElement>(
      ".heroSliderContainer > .heroSlide:nth-child(8)",
    );

    if (!slide) return;

    const titleAccent = slide.querySelector<HTMLElement>(".heroTitle em");
    if (titleAccent) {
      titleAccent.textContent = "YA DISPONIBLE";
    }

    const description = slide.querySelector<HTMLElement>(".heroCopy > p");
    if (description) {
      description.textContent =
        "Descarga la app oficial de EL GRUPO FIERAMIX.COM y lleva nuestras emisoras contigo donde quiera que estés.";
    }

    const actions = slide.querySelector<HTMLElement>(".heroActions");
    if (actions) {
      actions.replaceChildren(
        makeStoreLink("DESCARGAR EN GOOGLE PLAY", GOOGLE_PLAY_URL),
        makeStoreLink("DESCARGAR EN APP STORE", APP_STORE_URL),
      );
    }

    const metrics = slide.querySelectorAll<HTMLElement>(".heroMetrics > div");

    const metricValues = [
      ["PLAY", "GOOGLE PLAY"],
      ["iOS", "APP STORE"],
      ["24/7", "FIERAMIX CONTIGO"],
    ];

    metrics.forEach((metric, index) => {
      const values = metricValues[index];
      if (!values) return;

      const strong = metric.querySelector<HTMLElement>("strong");
      const span = metric.querySelector<HTMLElement>("span");

      if (strong) strong.textContent = values[0];
      if (span) span.textContent = values[1];
    });
  }, []);

  return null;
}
