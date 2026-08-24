"use client";

import { useEffect } from "react";
import type { Station } from "@/types/station";

type FieramixAIControllerProps = {
  stations: readonly Station[];
  selected: Station;
  playing: boolean;
  onPlayStation: (station: Station) => void | Promise<void>;
  onTogglePlayback: () => void | Promise<void>;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stationFingerprint(station: Station): string {
  return normalizeText(
    [
      station.id,
      station.name,
      station.shortName,
      station.genre,
      station.slogan,
      station.description,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function findRequestedStation(
  message: string,
  stations: readonly Station[],
): Station | null {
  const normalized = normalizeText(message);

  const scored = stations
    .map((station) => {
      const candidates = [
        station.name,
        station.shortName,
        station.genre,
        station.id,
      ]
        .filter((value): value is string => Boolean(value))
        .map(normalizeText)
        .filter(Boolean);

      let score = 0;

      for (const candidate of candidates) {
        if (normalized.includes(candidate)) {
          score = Math.max(score, candidate.length + 20);
        }
      }

      const fingerprint = stationFingerprint(station);
      const words = normalized.split(" ").filter((word) => word.length >= 4);
      const overlap = words.filter((word) => fingerprint.includes(word)).length;
      score += overlap;

      return { station, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.station ?? null;
}

function isTuneIntent(message: string): boolean {
  const normalized = normalizeText(message);

  return /\b(sintoniz\w*|pon\w*|poner|cambi\w*|quiero|escuch\w*|oir|oye|reproduc\w*|activ\w*|enciend\w*|dame)\b/.test(
    normalized,
  );
}

function isPauseIntent(message: string): boolean {
  const normalized = normalizeText(message);

  return (
    /\b(paus\w*|deten\w*|silenci\w*)\b/.test(normalized) ||
    /\bpara\b.*\b(radio|musica|audio|reproduccion|sonido|emisora)\b/.test(
      normalized,
    )
  );
}

function isResumeIntent(message: string): boolean {
  const normalized = normalizeText(message);

  return (
    /\b(reanud\w*|continu\w*|sigue|seguir|reproduc\w*|play|enciend\w*)\b/.test(
      normalized,
    ) &&
    /\b(radio|musica|audio|reproduccion|sonido|emisora|sigue|continua|play)\b/.test(
      normalized,
    )
  );
}

function isSongAvailabilityIntent(message: string): boolean {
  const normalized = normalizeText(message);

  return (
    /\b(esta|tienen|tienes|existe|disponible|sistema|catalogo|buscar|busca|encuentra)\b/.test(
      normalized,
    ) &&
    /\b(cancion|tema|sistema|catalogo|disponible)\b/.test(normalized)
  );
}

function extractSongQuery(message: string): string {
  return message
    .replace(/^[¿?\s]*/g, "")
    .replace(/\b(esta|tienen|tienes|existe|disponible|buscar|busca|encuentra)\b/gi, " ")
    .replace(/\b(la|el|una|un|cancion|canción|tema|en|del|dentro|catalogo|catálogo|sistema|fieramix|radio)\b/gi, " ")
    .replace(/[¿?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function FieramixAIController({
  stations,
  selected,
  playing,
  onPlayStation,
  onTogglePlayback,
}: FieramixAIControllerProps) {
  useEffect(() => {
    const executeCommand = (rawMessage: string) => {
      const message = rawMessage.trim();
      if (!message) return;

      if (isSongAvailabilityIntent(message)) {
        const query = extractSongQuery(message);

        if (query) {
          window.dispatchEvent(
            new CustomEvent("fieramix-songrequest-search", {
              detail: {
                query,
                requestId: `ai-${Date.now()}`,
                stationId: selected.id,
                stationName: selected.name,
              },
            }),
          );
        }
        return;
      }

      const requestedStation = findRequestedStation(message, stations);

      if (requestedStation && isTuneIntent(message)) {
        void onPlayStation(requestedStation);
        return;
      }

      if (isPauseIntent(message)) {
        if (playing) {
          void onTogglePlayback();
        }
        return;
      }

      if (isResumeIntent(message)) {
        if (!playing) {
          void onTogglePlayback();
        }
        return;
      }

      const normalized = normalizeText(message);
      const selectedName = normalizeText(selected.name);

      if (
        requestedStation &&
        requestedStation.id === selected.id &&
        normalized.includes(selectedName) &&
        /\b(escuch\w*|oir|suena|sonar)\b/.test(normalized) &&
        !playing
      ) {
        void onTogglePlayback();
      }
    };

    const handleSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null;

      if (!form?.classList.contains("fieramixAIComposer")) {
        return;
      }

      const textarea = form.querySelector<HTMLTextAreaElement>("textarea");
      executeCommand(textarea?.value ?? "");
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey) {
        return;
      }

      const textarea = event.target as HTMLTextAreaElement | null;

      if (!textarea?.closest(".fieramixAIComposer")) {
        return;
      }

      executeCommand(textarea.value);
    };

    document.addEventListener("submit", handleSubmit, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("submit", handleSubmit, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [stations, selected, playing, onPlayStation, onTogglePlayback]);

  return null;
}
