"use client";

import { useEffect } from "react";

type Props = {
  stationId: string;
  stationName: string;
  playing: boolean;
  currentTitle?: string | null;
  currentArtist?: string | null;
};

type AIRequestBody = {
  message?: unknown;
  previousResponseId?: unknown;
  clientContext?: unknown;
  [key: string]: unknown;
};

export default function FieramixAIPortalContextBridge({
  stationId,
  stationName,
  playing,
  currentTitle,
  currentArtist,
}: Props) {
  useEffect(() => {
    const nativeFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (!url.endsWith("/api/fieramix-ai") || !init?.body) {
        return nativeFetch(input, init);
      }

      try {
        const originalBody = JSON.parse(String(init.body)) as AIRequestBody;
        const enhancedBody: AIRequestBody = {
          ...originalBody,
          clientContext: {
            path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
            stationId,
            stationName,
            playing,
            currentTitle: currentTitle?.trim() || "",
            currentArtist: currentArtist?.trim() || "",
          },
        };

        return nativeFetch("/api/fieramix-ai-v2", {
          ...init,
          body: JSON.stringify(enhancedBody),
        });
      } catch {
        return nativeFetch(input, init);
      }
    };

    return () => {
      window.fetch = nativeFetch;
    };
  }, [stationId, stationName, playing, currentTitle, currentArtist]);

  return null;
}
