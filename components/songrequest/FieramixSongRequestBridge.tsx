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

const SEARCH_EVENT = "fieramix-songrequest-search";
const RESULT_EVENT = "fieramix-songrequest-results";
const SELECT_STATION_EVENT = "fieramix-songrequest-select-station";

function getRequestFrame(): HTMLIFrameElement | null {
  return document.querySelector<HTMLIFrameElement>(".radioBossRequestFrame");
}

function readResults(frame: HTMLIFrameElement): SongRequestResult[] {
  const doc = frame.contentDocument;
  if (!doc) return [];

  const items = Array.from(
    doc.querySelectorAll<HTMLElement>(".rbc_result_item"),
  );

  return items
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
  status: "found" | "not_found" | "unavailable" | "error";
  message?: string;
}) {
  window.dispatchEvent(
    new CustomEvent(RESULT_EVENT, {
      detail,
    }),
  );
}

function waitForFrame(
  previousFrame: HTMLIFrameElement | null,
  timeoutMs = 3500,
): Promise<HTMLIFrameElement | null> {
  return new Promise((resolve) => {
    const startedAt = Date.now();

    const check = () => {
      const frame = getRequestFrame();
      const doc = frame?.contentDocument;
      const input = doc?.querySelector<HTMLInputElement>(".rbc_ed_query");
      const button = doc?.querySelector<HTMLButtonElement>(".rbc_bt_search");
      const resultBox = doc?.querySelector<HTMLElement>(".rbc_result");

      if (
        frame &&
        frame !== previousFrame &&
        input &&
        button &&
        resultBox
      ) {
        resolve(frame);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        resolve(frame && input && button && resultBox ? frame : null);
        return;
      }

      window.setTimeout(check, 80);
    };

    check();
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

      let frame = getRequestFrame();

      if (stationId) {
        const previousFrame = frame;

        window.dispatchEvent(
          new CustomEvent(SELECT_STATION_EVENT, {
            detail: {
              stationId,
              stationName,
            },
          }),
        );

        frame = await waitForFrame(previousFrame);
      }

      const doc = frame?.contentDocument;

      if (!frame || !doc) {
        emitResults({
          requestId,
          query,
          stationId,
          stationName,
          results: [],
          status: "unavailable",
          message: "El buscador de canciones todavía no está disponible.",
        });
        return;
      }

      const input = doc.querySelector<HTMLInputElement>(".rbc_ed_query");
      const button = doc.querySelector<HTMLButtonElement>(".rbc_bt_search");
      const resultBox = doc.querySelector<HTMLElement>(".rbc_result");

      if (!input || !button || !resultBox) {
        emitResults({
          requestId,
          query,
          stationId,
          stationName,
          results: [],
          status: "unavailable",
          message: "RadioBOSS todavía no terminó de cargar el buscador.",
        });
        return;
      }

      let settled = false;
      let timeoutId: number | undefined;

      const finish = () => {
        if (settled) return;

        const results = readResults(frame);
        const resultText = resultBox.textContent?.replace(/\s+/g, " ").trim() ?? "";
        const visible = getComputedStyle(resultBox).display !== "none";

        if (results.length > 0) {
          settled = true;
          observer.disconnect();
          if (timeoutId) window.clearTimeout(timeoutId);
          emitResults({
            requestId,
            query,
            stationId,
            stationName,
            results,
            status: "found",
          });
          return;
        }

        if (
          visible &&
          /no se encontraron|no tracks|canción no encontrada|cancion no encontrada/i.test(
            resultText,
          )
        ) {
          settled = true;
          observer.disconnect();
          if (timeoutId) window.clearTimeout(timeoutId);
          emitResults({
            requestId,
            query,
            stationId,
            stationName,
            results: [],
            status: "not_found",
            message: resultText || "No se encontraron canciones.",
          });
        }
      };

      const observer = new MutationObserver(() => {
        window.requestAnimationFrame(finish);
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
        if (settled) return;
        settled = true;
        observer.disconnect();

        const results = readResults(frame);
        emitResults({
          requestId,
          query,
          stationId,
          stationName,
          results,
          status: results.length > 0 ? "found" : "error",
          message:
            results.length > 0
              ? undefined
              : "La búsqueda de RadioBOSS no respondió a tiempo.",
        });
      }, 8000);
    };

    window.addEventListener(SEARCH_EVENT, handleSearch);

    return () => {
      window.removeEventListener(SEARCH_EVENT, handleSearch);
    };
  }, []);

  return null;
}
