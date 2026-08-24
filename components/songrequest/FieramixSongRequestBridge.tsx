"use client";

import { useEffect } from "react";

type SongRequestSearchDetail = {
  query?: string;
  requestId?: string;
  stationId?: string;
  stationName?: string;
};

type SongRequestResult = {
  text: string;
  canRequest: boolean;
  index: number;
};

type SearchStatus = "found" | "not_found" | "unavailable" | "error";

type StationMatch = {
  stationId: string;
  stationName: string;
  results: SongRequestResult[];
};

const SEARCH_EVENT = "fieramix-songrequest-search";
const RESULT_EVENT = "fieramix-songrequest-results";

const STATIONS = [
  { id: "bachata", label: "BACHATA", name: "SOLO BACHATA" },
  { id: "merengue", label: "MERENGUE", name: "SOLO MERENGUE" },
  { id: "salsa", label: "SALSA", name: "SOLO SALSA" },
  { id: "baladas", label: "BALADAS", name: "SOLO BALADAS" },
  { id: "reggaeton", label: "REGGAETÓN", name: "SOLO REGGAETÓN" },
  { id: "rancheras", label: "RANCHERAS", name: "SOLO RANCHERAS" },
  { id: "internacional", label: "INTERNACIONAL", name: "SOLO MÚSICA INTERNACIONAL" },
  { id: "cristiana", label: "CRISTIANA", name: "SOLO MÚSICA CRISTIANA" },
  { id: "fieramix", label: "FIERAMIX", name: "FIERAMIX" },
] as const;

function getRequestFrame(): HTMLIFrameElement | null {
  return document.querySelector<HTMLIFrameElement>(".radioBossRequestFrame");
}

function getStationButton(stationId: string): HTMLButtonElement | null {
  const station = STATIONS.find((item) => item.id === stationId);
  if (!station) return null;

  return (
    Array.from(
      document.querySelectorAll<HTMLButtonElement>(".requestStationOption"),
    ).find(
      (button) =>
        button.textContent?.replace(/\s+/g, " ").trim() === station.label,
    ) ?? null
  );
}

function readResults(frame: HTMLIFrameElement): SongRequestResult[] {
  const doc = frame.contentDocument;
  if (!doc) return [];

  return Array.from(doc.querySelectorAll<HTMLElement>(".rbc_result_item"))
    .map((item, index) => {
      const button = item.querySelector<HTMLButtonElement>("button");
      const text = item.textContent
        ?.replace(button?.textContent ?? "", "")
        .replace(/\s+/g, " ")
        .trim();

      return {
        text: text ?? "",
        canRequest: Boolean(button && !button.disabled),
        index,
      };
    })
    .filter((item) => item.text.length > 0);
}

function emitResults(detail: {
  requestId?: string;
  query: string;
  stationId?: string;
  stationName?: string;
  results: SongRequestResult[];
  status: SearchStatus;
  message?: string;
  searchedOtherStations?: boolean;
  otherStationMatches?: StationMatch[];
}) {
  window.dispatchEvent(new CustomEvent(RESULT_EVENT, { detail }));
}

function waitForFrame(
  previousFrame: HTMLIFrameElement | null,
  expectReplacement: boolean,
  timeoutMs = 3500,
): Promise<HTMLIFrameElement | null> {
  return new Promise((resolve) => {
    const startedAt = Date.now();

    const check = () => {
      const frame = getRequestFrame();
      const doc = frame?.contentDocument;
      const ready = Boolean(
        frame &&
          doc?.querySelector(".rbc_ed_query") &&
          doc?.querySelector(".rbc_bt_search") &&
          doc?.querySelector(".rbc_result"),
      );

      if (ready && (!expectReplacement || frame !== previousFrame)) {
        resolve(frame);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        resolve(ready ? frame : null);
        return;
      }

      window.setTimeout(check, 80);
    };

    check();
  });
}

async function selectStation(stationId: string): Promise<HTMLIFrameElement | null> {
  const target = getStationButton(stationId);
  if (!target) return null;

  const previousFrame = getRequestFrame();
  const alreadySelected = target.getAttribute("aria-pressed") === "true";

  if (!alreadySelected) {
    target.click();
  }

  return waitForFrame(previousFrame, !alreadySelected);
}

function searchCurrentFrame(
  frame: HTMLIFrameElement,
  query: string,
  timeoutMs = 8000,
): Promise<{ status: SearchStatus; results: SongRequestResult[]; message?: string }> {
  return new Promise((resolve) => {
    const doc = frame.contentDocument;
    const input = doc?.querySelector<HTMLInputElement>(".rbc_ed_query");
    const button = doc?.querySelector<HTMLButtonElement>(".rbc_bt_search");
    const resultBox = doc?.querySelector<HTMLElement>(".rbc_result");

    if (!doc || !input || !button || !resultBox) {
      resolve({
        status: "unavailable",
        results: [],
        message: "RadioBOSS todavía no terminó de cargar el buscador.",
      });
      return;
    }

    let settled = false;
    let timeoutId: number | undefined;

    const settle = (
      status: SearchStatus,
      results: SongRequestResult[],
      message?: string,
    ) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
      resolve({ status, results, message });
    };

    const inspect = () => {
      if (settled) return;

      const results = readResults(frame);
      const resultText = resultBox.textContent?.replace(/\s+/g, " ").trim() ?? "";
      const visible = getComputedStyle(resultBox).display !== "none";

      if (results.length > 0) {
        settle("found", results);
        return;
      }

      if (
        visible &&
        /no se encontraron|no tracks|canción no encontrada|cancion no encontrada/i.test(
          resultText,
        )
      ) {
        settle("not_found", [], resultText || "No se encontraron canciones.");
      }
    };

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(inspect);
    });

    observer.observe(resultBox, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    input.value = query;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    button.click();

    timeoutId = window.setTimeout(() => {
      const results = readResults(frame);
      settle(
        results.length > 0 ? "found" : "error",
        results,
        results.length > 0
          ? undefined
          : "La búsqueda de RadioBOSS no respondió a tiempo.",
      );
    }, timeoutMs);
  });
}

export default function FieramixSongRequestBridge() {
  useEffect(() => {
    const handleSearch = async (event: Event) => {
      const customEvent = event as CustomEvent<SongRequestSearchDetail>;
      const query = customEvent.detail?.query?.trim() ?? "";
      const requestId = customEvent.detail?.requestId;
      const stationId = customEvent.detail?.stationId?.trim() || undefined;
      const stationName = customEvent.detail?.stationName?.trim() || undefined;

      if (!query) {
        emitResults({
          requestId,
          query,
          stationId,
          stationName,
          results: [],
          status: "error",
          message: "La búsqueda está vacía.",
        });
        return;
      }

      if (!stationId || !STATIONS.some((station) => station.id === stationId)) {
        emitResults({
          requestId,
          query,
          stationId,
          stationName,
          results: [],
          status: "unavailable",
          message: "No pude identificar la emisora que estás escuchando.",
        });
        return;
      }

      const listenerFrame = await selectStation(stationId);

      if (!listenerFrame) {
        emitResults({
          requestId,
          query,
          stationId,
          stationName,
          results: [],
          status: "unavailable",
          message: `No pude abrir el catálogo de ${stationName || "la emisora actual"}.`,
        });
        return;
      }

      const listenerResult = await searchCurrentFrame(listenerFrame, query);

      if (listenerResult.status === "found") {
        emitResults({
          requestId,
          query,
          stationId,
          stationName,
          results: listenerResult.results,
          status: "found",
          searchedOtherStations: false,
        });
        return;
      }

      if (listenerResult.status !== "not_found") {
        emitResults({
          requestId,
          query,
          stationId,
          stationName,
          results: [],
          status: listenerResult.status,
          message: listenerResult.message,
        });
        return;
      }

      const matches: StationMatch[] = [];

      for (const station of STATIONS) {
        if (station.id === stationId) continue;

        const frame = await selectStation(station.id);
        if (!frame) continue;

        const result = await searchCurrentFrame(frame, query);

        if (result.status === "found") {
          matches.push({
            stationId: station.id,
            stationName: station.name,
            results: result.results,
          });
        }
      }

      await selectStation(stationId);

      emitResults({
        requestId,
        query,
        stationId,
        stationName,
        results: [],
        status: "not_found",
        searchedOtherStations: true,
        otherStationMatches: matches,
        message:
          matches.length > 0
            ? undefined
            : "No se encontraron canciones en ninguna de las emisoras consultadas.",
      });
    };

    window.addEventListener(SEARCH_EVENT, handleSearch);

    return () => {
      window.removeEventListener(SEARCH_EVENT, handleSearch);
    };
  }, []);

  return null;
}
