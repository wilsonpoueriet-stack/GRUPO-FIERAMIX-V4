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
    const rankingsSlide = document.querySelector<HTMLElement>(
      ".heroSliderContainer > .heroSlide:nth-child(6)",
    );

    if (rankingsSlide) {
      const rankingsTitle = rankingsSlide.querySelector<HTMLElement>(".heroTitle");
      if (rankingsTitle) {
        rankingsTitle.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent?.includes("TOP MUSICALES")) {
            node.textContent = node.textContent.replace("TOP MUSICALES", "RANKINGS");
          }
        });
      }

      rankingsSlide
        .querySelectorAll<HTMLElement>(".heroContentTags span")
        .forEach((tag) => {
          if (tag.textContent?.trim() === "TOP MUSICALES") {
            tag.textContent = "RANKINGS";
          }
        });

      rankingsSlide
        .querySelectorAll<HTMLElement>(".heroActions span")
        .forEach((label) => {
          if (label.textContent?.trim() === "VER TOP MUSICAL") {
            label.textContent = "VER RANKINGS";
          }
        });
    }

    const appSlide = document.querySelector<HTMLElement>(
      ".heroSliderContainer > .heroSlide:nth-child(8)",
    );

    if (!appSlide) return;

    const titleAccent = appSlide.querySelector<HTMLElement>(".heroTitle em");
    if (titleAccent) {
      titleAccent.textContent = "YA DISPONIBLE";
    }

    const description = appSlide.querySelector<HTMLElement>(".heroCopy > p");
    if (description) {
      description.textContent =
        "Descarga la app oficial de EL GRUPO FIERAMIX.COM y lleva nuestras emisoras contigo donde quiera que estés.";
    }

    const actions = appSlide.querySelector<HTMLElement>(".heroActions");
    if (actions) {
      actions.replaceChildren(
        makeStoreLink("DESCARGAR EN GOOGLE PLAY", GOOGLE_PLAY_URL),
        makeStoreLink("DESCARGAR EN APP STORE", APP_STORE_URL),
      );
    }

    const metrics = appSlide.querySelectorAll<HTMLElement>(".heroMetrics > div");

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
