"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Station } from "@/types/station";
import type { NowPlaying } from "@/types/radio";
import { emptyNowPlaying } from "@/hooks/useRadioPortal";

type StationsGridProps = {
  stations: Station[];
  selected: Station;
  metadata: Record<string, NowPlaying>;
  playing: boolean;
  onPlayStation: (station: Station) => void;
};

function highlightSearchText(text: string, query: string) {
  const cleanQuery = query.trim();
  if (!cleanQuery || !text) return text;

  const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "ig"));

  return parts.map((part, index) =>
    part.toLowerCase() === cleanQuery.toLowerCase() ? (
      <mark key={`${part}-${index}`}>{part}</mark>
    ) : (
      part
    ),
  );
}

export default function StationsGrid({
  stations,
  selected,
  metadata,
  playing,
  onPlayStation,
}: StationsGridProps) {
  const selectedInfo =
    metadata[selected.id] ?? emptyNowPlaying(selected);

  const selectedArtwork =
    selectedInfo.artwork && selectedInfo.artwork !== selected.logo
      ? selectedInfo.artwork
      : selected.logo;

  const [activeGenre, setActiveGenre] = useState("TODAS");
  const [stationQuery, setStationQuery] = useState("");
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [recentStationSearches, setRecentStationSearches] = useState<string[]>(
    [],
  );
  const [stationSortMode, setStationSortMode] = useState<
    "network" | "audience" | "alphabetical"
  >("network");
  const [onlyOnAir, setOnlyOnAir] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [top3Collapsed, setTop3Collapsed] = useState(false);
  const [leadershipDuelCollapsed, setLeadershipDuelCollapsed] = useState(false);
  const [leadershipRaceCollapsed, setLeadershipRaceCollapsed] = useState(false);
  const [leadershipPulseCollapsed, setLeadershipPulseCollapsed] = useState(false);
  const [leadershipQuickActionsCollapsed, setLeadershipQuickActionsCollapsed] =
    useState(false);
  const [selectedRankDetailsCollapsed, setSelectedRankDetailsCollapsed] =
    useState(false);
  const [rankingTrendCollapsed, setRankingTrendCollapsed] = useState(false);
  const [networkNowSummaryCollapsed, setNetworkNowSummaryCollapsed] =
    useState(true);
  const [networkDetailsExpanded, setNetworkDetailsExpanded] = useState(false);
  const [stationMetricsCollapsed, setStationMetricsCollapsed] =
    useState(false);
  const [rankingMovements, setRankingMovements] = useState<
    Record<string, number>
  >({});
  const [rankingListenerChanges, setRankingListenerChanges] = useState<
    Record<string, number>
  >({});
  const [rankingMovementReady, setRankingMovementReady] = useState(false);
  const [rankingUpdatedAt, setRankingUpdatedAt] = useState<string | null>(null);
  const previousRankingPositionsRef = useRef<Record<string, number>>({});
  const previousRankingListenersRef = useRef<Record<string, number>>({});
  const rankingMovementContextRef = useRef("");
  const [favoriteStations, setFavoriteStations] = useState<string[]>([]);
  const [recentStations, setRecentStations] = useState<string[]>([]);
  const [sharedStationId, setSharedStationId] = useState<string | null>(null);
  const [sharedNowPlaying, setSharedNowPlaying] = useState(false);
  const [sharedRanking, setSharedRanking] = useState(false);
  const [sharedSearchMatchId, setSharedSearchMatchId] = useState<string | null>(
    null,
  );
  const [selectedCardVisible, setSelectedCardVisible] = useState(true);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("fieramix-favorite-stations");
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setFavoriteStations(
          parsed.filter((value): value is string => typeof value === "string"),
        );
      }
    } catch {
      // Si el navegador bloquea localStorage, el módulo sigue funcionando.
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("fieramix-recent-stations");
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setRecentStations(
          parsed.filter((value): value is string => typeof value === "string"),
        );
      }
    } catch {
      // Si el navegador bloquea localStorage, el historial sigue siendo opcional.
    }
  }, []);

  const toggleFavorite = (stationId: string) => {
    setFavoriteStations((current) => {
      const next = current.includes(stationId)
        ? current.filter((id) => id !== stationId)
        : [...current, stationId];

      try {
        window.localStorage.setItem(
          "fieramix-favorite-stations",
          JSON.stringify(next),
        );
      } catch {
        // La preferencia simplemente no se persiste.
      }

      return next;
    });
  };

  const clearFavoriteStations = () => {
    setFavoriteStations([]);

    try {
      window.localStorage.removeItem("fieramix-favorite-stations");
    } catch {
      // Si localStorage no está disponible, limpiamos al menos el estado actual.
    }
  };

  const playStation = (station: Station) => {
    setRecentStations((current) => {
      const next = [
        station.id,
        ...current.filter((id) => id !== station.id),
      ].slice(0, 6);

      try {
        window.localStorage.setItem(
          "fieramix-recent-stations",
          JSON.stringify(next),
        );
      } catch {
        // La reproducción continúa aunque no se pueda guardar el historial.
      }

      return next;
    });

    onPlayStation(station);
  };

  const clearRecentStations = () => {
    setRecentStations([]);

    try {
      window.localStorage.removeItem("fieramix-recent-stations");
    } catch {
      // Si localStorage no está disponible, limpiamos al menos el estado actual.
    }
  };

  const shareStation = async (station: Station) => {
    const stationUrl = `${window.location.origin}/emisoras/${station.id}`;
    const shareData = {
      title: station.name,
      text: `${station.name} — ${station.slogan}`,
      url: stationUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(stationUrl);
      } else {
        window.prompt("Copia el enlace de la emisora:", stationUrl);
      }

      setSharedStationId(station.id);
      window.setTimeout(() => {
        setSharedStationId((current) =>
          current === station.id ? null : current,
        );
      }, 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("No fue posible compartir la emisora.", error);
    }
  };

  const shareSearchMatch = async (
    station: Station,
    info: NowPlaying,
  ) => {
    const stationUrl = `${window.location.origin}/emisoras/${station.id}`;
    const songText = [info.artist, info.title]
      .filter(Boolean)
      .join(" — ");

    const shareText = songText
      ? `Ahora suena ${songText} en ${station.name}.`
      : `Escucha ${station.name} en EL GRUPO FIERAMIX.COM.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Ahora en ${station.name}`,
          text: shareText,
          url: stationUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          `${shareText} ${stationUrl}`,
        );
      } else {
        window.prompt(
          "Copia este resultado:",
          `${shareText} ${stationUrl}`,
        );
      }

      setSharedSearchMatchId(station.id);
      window.setTimeout(() => {
        setSharedSearchMatchId((current) =>
          current === station.id ? null : current,
        );
      }, 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("No fue posible compartir este resultado.", error);
    }
  };

  const shareNowPlaying = async () => {
    const stationUrl = `${window.location.origin}/emisoras/${selected.id}`;
    const songText = [selectedInfo.artist, selectedInfo.title]
      .filter(Boolean)
      .join(" — ");

    const shareText = songText
      ? `Ahora suena ${songText} en ${selected.name}.`
      : `Escucha ${selected.name} en EL GRUPO FIERAMIX.COM.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Ahora en ${selected.name}`,
          text: shareText,
          url: stationUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          `${shareText} ${stationUrl}`,
        );
      } else {
        window.prompt(
          "Copia lo que está sonando:",
          `${shareText} ${stationUrl}`,
        );
      }

      setSharedNowPlaying(true);
      window.setTimeout(() => {
        setSharedNowPlaying(false);
      }, 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("No fue posible compartir lo que está sonando.", error);
    }
  };


  const shareCurrentRanking = async () => {
    const rankingUrl = window.location.href;
    const rankingLines = topVisibleStations.map((station, index) => {
      const info = metadata[station.id] ?? emptyNowPlaying(station);
      const listeners =
        typeof info.listeners === "number"
          ? `${info.listeners} oyentes`
          : "audiencia en vivo";

      return `#${index + 1} ${station.shortName || station.name} — ${listeners}`;
    });

    const rankingText = [
      `RANKING EN VIVO · ${top3SelectionContext}`,
      ...rankingLines,
      `${visibleStationsListeners} oyentes en esta selección.`,
      "EL GRUPO FIERAMIX.COM, LA RED LATINA QUE MUEVE AL MUNDO.",
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Ranking en vivo · ${top3SelectionContext}`,
          text: rankingText,
          url: rankingUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          `${rankingText}\n${rankingUrl}`,
        );
      } else {
        window.prompt(
          "Copia el ranking en vivo:",
          `${rankingText}\n${rankingUrl}`,
        );
      }

      setSharedRanking(true);
      window.setTimeout(() => {
        setSharedRanking(false);
      }, 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("No fue posible compartir el ranking.", error);
    }
  };

  useEffect(() => {
    setSearchMatchIndex(0);
  }, [
    stationQuery,
    activeGenre,
    onlyOnAir,
    stationSortMode,
  ]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(
        "fieramix-station-search-history",
      );

      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return;

      setRecentStationSearches(
        parsed.filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        ).slice(0, 6),
      );
    } catch {
      // Si el navegador bloquea localStorage, continuamos sin historial.
    }
  }, []);

  useEffect(() => {
    const activeTickerItem = document.getElementById(
      `network-now-${selected.id}`,
    );

    if (!activeTickerItem) return;

    window.requestAnimationFrame(() => {
      activeTickerItem.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    });
  }, [selected.id]);

  useEffect(() => {
    const selectedCard = document.getElementById(
      `station-card-${selected.id}`,
    );

    if (!selectedCard) {
      setSelectedCardVisible(false);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setSelectedCardVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setSelectedCardVisible(
          entry.isIntersecting && entry.intersectionRatio >= 0.18,
        );
      },
      {
        threshold: [0, 0.18, 0.5],
      },
    );

    observer.observe(selectedCard);

    return () => {
      observer.disconnect();
    };
  }, [
    selected.id,
    activeGenre,
    stationQuery,
    stationSortMode,
    onlyOnAir,
    favoriteStations,
    recentStations,
  ]);

  const genres = [
    "TODAS",
    ...Array.from(
      new Set(
        stations
          .map((station) => station.genre?.trim())
          .filter((genre): genre is string => Boolean(genre)),
      ),
    ),
  ];

  const normalizedQuery = stationQuery.trim().toLowerCase();

  const filteredStations = stations.filter((station) => {
    const info = metadata[station.id] ?? emptyNowPlaying(station);

    const matchesGenre =
      activeGenre === "TODAS"
        ? true
        : activeGenre === "FAVORITAS"
          ? favoriteStations.includes(station.id)
          : activeGenre === "RECIENTES"
            ? recentStations.includes(station.id)
            : station.genre === activeGenre;

    if (!matchesGenre) return false;
    if (onlyOnAir && !info.configured) return false;
    if (!normalizedQuery) return true;

    const searchableText = [
      station.name,
      station.shortName,
      station.genre,
      station.slogan,
      info.title,
      info.artist,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });

  const visibleStations = (() => {
    if (stationSortMode === "audience") {
      return [...filteredStations].sort((a, b) => {
        const aInfo = metadata[a.id] ?? emptyNowPlaying(a);
        const bInfo = metadata[b.id] ?? emptyNowPlaying(b);

        const aListeners =
          typeof aInfo.listeners === "number" ? aInfo.listeners : -1;
        const bListeners =
          typeof bInfo.listeners === "number" ? bInfo.listeners : -1;

        return bListeners - aListeners;
      });
    }

    if (stationSortMode === "alphabetical") {
      return [...filteredStations].sort((a, b) =>
        a.name.localeCompare(b.name, "es", {
          sensitivity: "base",
        }),
      );
    }

    return filteredStations;
  })();

  const rankingMovementContextKey = [
    activeGenre,
    normalizedQuery,
    onlyOnAir ? "SOLO_AL_AIRE" : "TODAS_AL_AIRE",
    filteredStations.map((station) => station.id).join(","),
  ].join("|");

  const rankingMovementSnapshotKey = filteredStations
    .map((station) => {
      const info = metadata[station.id] ?? emptyNowPlaying(station);
      const listeners =
        typeof info.listeners === "number" ? info.listeners : -1;

      return `${station.id}:${listeners}`;
    })
    .join("|");

  useEffect(() => {
    if (stationSortMode !== "audience") {
      previousRankingPositionsRef.current = {};
      previousRankingListenersRef.current = {};
      rankingMovementContextRef.current = rankingMovementContextKey;
      setRankingMovements({});
      setRankingListenerChanges({});
      setRankingMovementReady(false);
      setRankingUpdatedAt(null);
      return;
    }

    const currentPositions = Object.fromEntries(
      visibleStations.map((station, index) => [
        station.id,
        index + 1,
      ]),
    ) as Record<string, number>;

    const currentListeners = Object.fromEntries(
      visibleStations.map((station) => {
        const info =
          metadata[station.id] ?? emptyNowPlaying(station);
        const listeners =
          typeof info.listeners === "number"
            ? info.listeners
            : 0;

        return [station.id, listeners];
      }),
    ) as Record<string, number>;

    const contextChanged =
      rankingMovementContextRef.current !== rankingMovementContextKey;
    const hasPreviousPositions =
      Object.keys(previousRankingPositionsRef.current).length > 0;
    const hasPreviousListeners =
      Object.keys(previousRankingListenersRef.current).length > 0;

    if (
      contextChanged ||
      !hasPreviousPositions ||
      !hasPreviousListeners
    ) {
      rankingMovementContextRef.current = rankingMovementContextKey;
      previousRankingPositionsRef.current = currentPositions;
      previousRankingListenersRef.current = currentListeners;
      setRankingMovements({});
      setRankingListenerChanges({});
      setRankingMovementReady(false);
      setRankingUpdatedAt(null);
      return;
    }

    const nextMovements: Record<string, number> = {};
    const nextListenerChanges: Record<string, number> = {};

    visibleStations.forEach((station) => {
      const previousPosition =
        previousRankingPositionsRef.current[station.id];
      const currentPosition = currentPositions[station.id];
      const previousListeners =
        previousRankingListenersRef.current[station.id];
      const currentStationListeners =
        currentListeners[station.id];

      if (
        typeof previousPosition !== "number" ||
        typeof currentPosition !== "number"
      ) {
        return;
      }

      nextMovements[station.id] =
        previousPosition - currentPosition;

      if (
        typeof previousListeners === "number" &&
        typeof currentStationListeners === "number"
      ) {
        nextListenerChanges[station.id] =
          currentStationListeners - previousListeners;
      }
    });

    previousRankingPositionsRef.current = currentPositions;
    previousRankingListenersRef.current = currentListeners;
    setRankingMovements(nextMovements);
    setRankingListenerChanges(nextListenerChanges);
    setRankingMovementReady(true);
    setRankingUpdatedAt(
      new Date().toLocaleTimeString("es-DO", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  }, [
    stationSortMode,
    rankingMovementContextKey,
    rankingMovementSnapshotKey,
  ]);

  const selectedVisibleIndex = visibleStations.findIndex(
    (station) => station.id === selected.id,
  );

  const selectedVisiblePosition =
    selectedVisibleIndex >= 0 ? selectedVisibleIndex + 1 : null;

  const biggestRisingStation = rankingMovementReady
    ? visibleStations.reduce<Station | null>((best, station) => {
        const movement = rankingMovements[station.id] ?? 0;

        if (movement <= 0) return best;
        if (!best) return station;

        const bestMovement = rankingMovements[best.id] ?? 0;
        return movement > bestMovement ? station : best;
      }, null)
    : null;

  const biggestFallingStation = rankingMovementReady
    ? visibleStations.reduce<Station | null>((best, station) => {
        const movement = rankingMovements[station.id] ?? 0;

        if (movement >= 0) return best;
        if (!best) return station;

        const bestMovement = rankingMovements[best.id] ?? 0;
        return movement < bestMovement ? station : best;
      }, null)
    : null;

  const biggestRisingMovement = biggestRisingStation
    ? rankingMovements[biggestRisingStation.id] ?? 0
    : 0;

  const biggestFallingMovement = biggestFallingStation
    ? Math.abs(rankingMovements[biggestFallingStation.id] ?? 0)
    : 0;

  const selectedRankingMovement =
    selectedVisiblePosition !== null && rankingMovementReady
      ? rankingMovements[selected.id] ?? 0
      : null;

  const selectedRankingListenerChange =
    selectedVisiblePosition !== null && rankingMovementReady
      ? rankingListenerChanges[selected.id] ?? 0
      : null;

  const biggestListenerGainStation = rankingMovementReady
    ? visibleStations.reduce<Station | null>((best, station) => {
        const listenerChange =
          rankingListenerChanges[station.id] ?? 0;

        if (listenerChange <= 0) return best;
        if (!best) return station;

        const bestListenerChange =
          rankingListenerChanges[best.id] ?? 0;

        return listenerChange > bestListenerChange
          ? station
          : best;
      }, null)
    : null;

  const biggestListenerLossStation = rankingMovementReady
    ? visibleStations.reduce<Station | null>((best, station) => {
        const listenerChange =
          rankingListenerChanges[station.id] ?? 0;

        if (listenerChange >= 0) return best;
        if (!best) return station;

        const bestListenerChange =
          rankingListenerChanges[best.id] ?? 0;

        return listenerChange < bestListenerChange
          ? station
          : best;
      }, null)
    : null;

  const biggestListenerGain = biggestListenerGainStation
    ? rankingListenerChanges[biggestListenerGainStation.id] ?? 0
    : 0;

  const biggestListenerLoss = biggestListenerLossStation
    ? Math.abs(
        rankingListenerChanges[biggestListenerLossStation.id] ?? 0,
      )
    : 0;

  const rankingListenerFlow = rankingMovementReady
    ? visibleStations.reduce(
        (flow, station) => {
          const listenerChange =
            rankingListenerChanges[station.id] ?? 0;

          if (listenerChange > 0) {
            flow.gained += listenerChange;
          } else if (listenerChange < 0) {
            flow.lost += Math.abs(listenerChange);
          }

          flow.net += listenerChange;
          return flow;
        },
        {
          gained: 0,
          lost: 0,
          net: 0,
        },
      )
    : {
        gained: 0,
        lost: 0,
        net: 0,
      };

  const podiumChanges = rankingMovementReady
    ? visibleStations.reduce(
        (changes, station, index) => {
          const currentPosition = index + 1;
          const movement = rankingMovements[station.id] ?? 0;
          const previousPosition = currentPosition + movement;

          if (
            currentPosition <= 3 &&
            previousPosition > 3
          ) {
            changes.entered.push({
              station,
              from: previousPosition,
              to: currentPosition,
            });
          }

          if (
            currentPosition > 3 &&
            previousPosition <= 3 &&
            previousPosition > 0
          ) {
            changes.exited.push({
              station,
              from: previousPosition,
              to: currentPosition,
            });
          }

          return changes;
        },
        {
          entered: [] as Array<{
            station: Station;
            from: number;
            to: number;
          }>,
          exited: [] as Array<{
            station: Station;
            from: number;
            to: number;
          }>,
        },
      )
    : {
        entered: [] as Array<{
          station: Station;
          from: number;
          to: number;
        }>,
        exited: [] as Array<{
          station: Station;
          from: number;
          to: number;
        }>,
      };

  const podiumChanged =
    podiumChanges.entered.length > 0 ||
    podiumChanges.exited.length > 0;

  const currentLeaderStation =
    rankingMovementReady && visibleStations.length > 0
      ? visibleStations[0]
      : null;

  const currentLeaderPreviousPosition = currentLeaderStation
    ? 1 + (rankingMovements[currentLeaderStation.id] ?? 0)
    : null;

  const previousLeaderStation = rankingMovementReady
    ? visibleStations.find((station, index) => {
        const currentPosition = index + 1;
        const movement = rankingMovements[station.id] ?? 0;
        const previousPosition = currentPosition + movement;

        return previousPosition === 1;
      }) ?? null
    : null;

  const leadershipChanged =
    Boolean(currentLeaderStation) &&
    Boolean(previousLeaderStation) &&
    currentLeaderStation?.id !== previousLeaderStation?.id &&
    typeof currentLeaderPreviousPosition === "number" &&
    currentLeaderPreviousPosition > 1;

  const currentLeaderInfo = currentLeaderStation
    ? metadata[currentLeaderStation.id] ??
      emptyNowPlaying(currentLeaderStation)
    : null;

  const previousLeaderInfo = previousLeaderStation
    ? metadata[previousLeaderStation.id] ??
      emptyNowPlaying(previousLeaderStation)
    : null;

  const rankingMovementSummary = rankingMovementReady
    ? visibleStations.reduce(
        (summary, station) => {
          const movement = rankingMovements[station.id] ?? 0;

          if (movement > 0) {
            summary.up += 1;
          } else if (movement < 0) {
            summary.down += 1;
          } else {
            summary.steady += 1;
          }

          return summary;
        },
        {
          up: 0,
          down: 0,
          steady: 0,
        },
      )
    : {
        up: 0,
        down: 0,
        steady: 0,
      };

  const rankingMovementTotal =
    rankingMovementSummary.up +
    rankingMovementSummary.down +
    rankingMovementSummary.steady;

  const rankingMovementUpShare =
    rankingMovementTotal > 0
      ? Math.round(
          (rankingMovementSummary.up / rankingMovementTotal) * 100,
        )
      : 0;

  const rankingMovementDownShare =
    rankingMovementTotal > 0
      ? Math.round(
          (rankingMovementSummary.down / rankingMovementTotal) * 100,
        )
      : 0;

  const rankingMovementSteadyShare =
    Math.max(
      100 -
        rankingMovementUpShare -
        rankingMovementDownShare,
      0,
    );

  const revealRankingTrendStation = (stationId: string) => {
    document
      .getElementById(`station-card-${stationId}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  };

  const normalizedSearchMatchIndex =
    visibleStations.length > 0
      ? Math.min(searchMatchIndex, visibleStations.length - 1)
      : 0;

  const firstSearchMatch =
    stationQuery.trim() && visibleStations.length > 0
      ? visibleStations[normalizedSearchMatchIndex]
      : null;

  const firstSearchMatchInfo = firstSearchMatch
    ? metadata[firstSearchMatch.id] ?? emptyNowPlaying(firstSearchMatch)
    : null;

  const firstSearchMatchArtwork =
    firstSearchMatch && firstSearchMatchInfo
      ? firstSearchMatchInfo.artwork &&
        firstSearchMatchInfo.artwork !== firstSearchMatch.logo
        ? firstSearchMatchInfo.artwork
        : firstSearchMatch.logo
      : null;

  const firstSearchMatchPlaying =
    Boolean(firstSearchMatch) &&
    firstSearchMatch?.id === selected.id &&
    playing;

  const firstSearchMatchReason = (() => {
    if (!firstSearchMatch || !firstSearchMatchInfo) return null;

    const query = stationQuery.trim().toLowerCase();
    if (!query) return null;

    const title = (firstSearchMatchInfo.title ?? "").toLowerCase();
    const artist = (firstSearchMatchInfo.artist ?? "").toLowerCase();
    const name = firstSearchMatch.name.toLowerCase();
    const shortName = (firstSearchMatch.shortName ?? "").toLowerCase();
    const genre = (firstSearchMatch.genre ?? "").toLowerCase();
    const slogan = (firstSearchMatch.slogan ?? "").toLowerCase();

    if (title.includes(query)) return "CANCIÓN";
    if (artist.includes(query)) return "ARTISTA";
    if (name.includes(query) || shortName.includes(query)) {
      return "EMISORA";
    }
    if (genre.includes(query)) return "GÉNERO";
    if (slogan.includes(query)) return "ESLOGAN";

    return "RED";
  })();

  const stationsOnline = stations.reduce((total, station) => {
    const info = metadata[station.id] ?? emptyNowPlaying(station);
    return total + (info.configured ? 1 : 0);
  }, 0);

  const networkListeners = stations.reduce((total, station) => {
    const info = metadata[station.id] ?? emptyNowPlaying(station);
    return total + (typeof info.listeners === "number" ? info.listeners : 0);
  }, 0);

  const networkOperationalCoverage =
    stations.length > 0
      ? Math.round((stationsOnline / stations.length) * 100)
      : 0;

  const networkOperationalStatus =
    networkOperationalCoverage >= 90
      ? "ÓPTIMA"
      : networkOperationalCoverage >= 60
        ? "PARCIAL"
        : "CRÍTICA";

  const networkAudienceLeader = stations.reduce<Station | null>(
    (leader, station) => {
      const stationInfo =
        metadata[station.id] ?? emptyNowPlaying(station);

      const stationListeners =
        typeof stationInfo.listeners === "number"
          ? stationInfo.listeners
          : -1;

      if (stationListeners < 0) return leader;
      if (!leader) return station;

      const leaderInfo =
        metadata[leader.id] ?? emptyNowPlaying(leader);

      const leaderListeners =
        typeof leaderInfo.listeners === "number"
          ? leaderInfo.listeners
          : -1;

      return stationListeners > leaderListeners ? station : leader;
    },
    null,
  );

  const networkAudienceRanking = [...stations].sort((a, b) => {
    const aInfo = metadata[a.id] ?? emptyNowPlaying(a);
    const bInfo = metadata[b.id] ?? emptyNowPlaying(b);

    const aListeners =
      typeof aInfo.listeners === "number" ? aInfo.listeners : -1;

    const bListeners =
      typeof bInfo.listeners === "number" ? bInfo.listeners : -1;

    return bListeners - aListeners;
  });

  const networkAudienceLeaderListeners =
    networkAudienceLeader
      ? (() => {
          const leaderInfo =
            metadata[networkAudienceLeader.id] ??
            emptyNowPlaying(networkAudienceLeader);

          return typeof leaderInfo.listeners === "number"
            ? leaderInfo.listeners
            : 0;
        })()
      : 0;

  const networkAudienceLeaderShare =
    networkListeners > 0
      ? Math.round(
          (networkAudienceLeaderListeners / networkListeners) * 100,
        )
      : 0;

  const networkAudienceChallenger =
    networkAudienceRanking.length > 1
      ? networkAudienceRanking[1]
      : null;

  const networkAudienceChallengerListeners =
    networkAudienceChallenger
      ? (() => {
          const challengerInfo =
            metadata[networkAudienceChallenger.id] ??
            emptyNowPlaying(networkAudienceChallenger);

          return typeof challengerInfo.listeners === "number"
            ? challengerInfo.listeners
            : 0;
        })()
      : 0;

  const networkAudienceChallengerGap =
    networkAudienceChallenger
      ? Math.max(
          0,
          networkAudienceLeaderListeners -
            networkAudienceChallengerListeners,
        )
      : 0;

  const networkAudienceLeaderChange =
    rankingMovementReady && networkAudienceLeader
      ? rankingListenerChanges[networkAudienceLeader.id] ?? 0
      : null;

  const networkAudienceChallengerChange =
    rankingMovementReady && networkAudienceChallenger
      ? rankingListenerChanges[networkAudienceChallenger.id] ?? 0
      : null;

  const selectedNetworkAudiencePosition =
    networkAudienceRanking.findIndex(
      (station) => station.id === selected.id,
    ) + 1;

  const selectedNetworkAudienceShare =
    networkListeners > 0 &&
    typeof selectedInfo.listeners === "number"
      ? Math.round(
          (selectedInfo.listeners / networkListeners) * 100,
        )
      : 0;

  const networkAudienceBalance = rankingMovementReady
    ? stations.reduce(
        (balance, station) => {
          const change = rankingListenerChanges[station.id] ?? 0;

          if (change > 0) {
            balance.rising += 1;
          } else if (change < 0) {
            balance.falling += 1;
          } else {
            balance.stable += 1;
          }

          return balance;
        },
        {
          rising: 0,
          falling: 0,
          stable: 0,
        },
      )
    : null;

  const networkAudienceNetChange = rankingMovementReady
    ? stations.reduce(
        (total, station) =>
          total + (rankingListenerChanges[station.id] ?? 0),
        0,
      )
    : null;

  const filtersAreActive =
    activeGenre !== "TODAS" ||
    Boolean(stationQuery.trim()) ||
    stationSortMode !== "network" ||
    onlyOnAir;

  const activeFilterCount = [
    activeGenre !== "TODAS",
    Boolean(stationQuery.trim()),
    stationSortMode !== "network",
    onlyOnAir,
  ].filter(Boolean).length;

  const visibleStationsOnline = visibleStations.reduce((total, station) => {
    const info = metadata[station.id] ?? emptyNowPlaying(station);
    return total + (info.configured ? 1 : 0);
  }, 0);

  const visibleStationsListeners = visibleStations.reduce(
    (total, station) => {
      const info = metadata[station.id] ?? emptyNowPlaying(station);

      return (
        total +
        (typeof info.listeners === "number" ? info.listeners : 0)
      );
    },
    0,
  );

  const visibleAudienceShare =
    networkListeners > 0
      ? Math.round(
          (visibleStationsListeners / networkListeners) * 100,
        )
      : 0;

  const averageStationAudienceShare =
    stations.length > 0
      ? 100 / stations.length
      : 0;

  const averageStationListeners =
    stations.length > 0
      ? networkListeners / stations.length
      : 0;

  const averageVisibleStationListeners =
    visibleStations.length > 0
      ? visibleStationsListeners / visibleStations.length
      : 0;

  const contextualAverageStationListeners =
    filtersAreActive
      ? averageVisibleStationListeners
      : averageStationListeners;

  const contextualAverageAudienceShare =
    filtersAreActive && visibleStations.length > 0
      ? 100 / visibleStations.length
      : averageStationAudienceShare;

  const topVisibleStations = [...visibleStations]
    .sort((a, b) => {
      const aInfo = metadata[a.id] ?? emptyNowPlaying(a);
      const bInfo = metadata[b.id] ?? emptyNowPlaying(b);

      const aListeners =
        typeof aInfo.listeners === "number"
          ? aInfo.listeners
          : -1;
      const bListeners =
        typeof bInfo.listeners === "number"
          ? bInfo.listeners
          : -1;

      return bListeners - aListeners;
    })
    .slice(0, 3);

  const topVisibleStation = topVisibleStations[0] ?? null;

  const topVisibleStationInfo = topVisibleStation
    ? metadata[topVisibleStation.id] ?? emptyNowPlaying(topVisibleStation)
    : null;

  const topVisibleLeaderListeners =
    topVisibleStationInfo &&
    typeof topVisibleStationInfo.listeners === "number"
      ? topVisibleStationInfo.listeners
      : 0;

  const secondVisibleStation = topVisibleStations[1] ?? null;
  const secondVisibleStationInfo = secondVisibleStation
    ? metadata[secondVisibleStation.id] ??
      emptyNowPlaying(secondVisibleStation)
    : null;

  const secondVisibleArtwork =
    secondVisibleStation && secondVisibleStationInfo
      ? secondVisibleStationInfo.artwork &&
        secondVisibleStationInfo.artwork !== secondVisibleStation.logo
        ? secondVisibleStationInfo.artwork
        : secondVisibleStation.logo
      : "";
  const secondVisibleListeners =
    secondVisibleStationInfo &&
    typeof secondVisibleStationInfo.listeners === "number"
      ? secondVisibleStationInfo.listeners
      : 0;

  const leaderAudienceAdvantage =
    secondVisibleStation && topVisibleLeaderListeners > 0
      ? Math.max(
          topVisibleLeaderListeners - secondVisibleListeners,
          0,
        )
      : null;

  const leaderRelativeAdvantage =
    leaderAudienceAdvantage !== null &&
    (leaderAudienceAdvantage ?? 0) > 0
      ? secondVisibleListeners > 0
        ? Math.round(
            (leaderAudienceAdvantage / secondVisibleListeners) * 100,
          )
        : 100
      : 0;

  const leaderRelativeAdvantagePrecise =
    leaderAudienceAdvantage !== null &&
    (leaderAudienceAdvantage ?? 0) > 0
      ? secondVisibleListeners > 0
        ? Math.round(
            (leaderAudienceAdvantage / secondVisibleListeners) * 1000,
          ) / 10
        : 100
      : 0;

  const leaderAdvantageStatus =
    leaderAudienceAdvantage === null
      ? null
      : leaderAudienceAdvantage === 0
        ? "EMPATE"
        : leaderRelativeAdvantagePrecise >= 10
          ? "SÓLIDO"
          : leaderRelativeAdvantagePrecise >= 3
            ? "FIRME"
            : "AJUSTADO";

  const pursuerPressureLevel =
    leaderAudienceAdvantage === null
      ? null
      : leaderAudienceAdvantage === 0 ||
          leaderRelativeAdvantagePrecise < 3
        ? "high"
        : leaderRelativeAdvantagePrecise < 10
          ? "medium"
          : "low";

  const secondVisibleRankingListenerChange =
    secondVisibleStation && rankingMovementReady
      ? rankingListenerChanges[secondVisibleStation.id] ?? 0
      : null;

  const secondVisibleRankingMovement =
    secondVisibleStation && rankingMovementReady
      ? rankingMovements[secondVisibleStation.id] ?? 0
      : null;

  const topVisibleLeaderListenerChange =
    topVisibleStation && rankingMovementReady
      ? rankingListenerChanges[topVisibleStation.id] ?? 0
      : null;

  const leaderAdvantageMomentum =
    topVisibleLeaderListenerChange !== null &&
    secondVisibleRankingListenerChange !== null
      ? topVisibleLeaderListenerChange -
        secondVisibleRankingListenerChange
      : null;

  const pursuerPressureMomentum =
    leaderAdvantageMomentum === null
      ? null
      : leaderAdvantageMomentum < 0
        ? "increasing"
        : leaderAdvantageMomentum > 0
          ? "decreasing"
          : "stable";

  const leadershipAdvantageTrend =
    selectedVisiblePosition === 1 &&
    selectedRankingListenerChange !== null &&
    secondVisibleRankingListenerChange !== null
      ? selectedRankingListenerChange -
        secondVisibleRankingListenerChange
      : null;

  const rivalLeaderReach =
    secondVisibleStation && topVisibleLeaderListeners > 0
      ? Math.min(
          Math.round(
            (secondVisibleListeners / topVisibleLeaderListeners) * 100,
          ),
          100,
        )
      : 0;

  const rivalListenersToTie =
    leaderAudienceAdvantage !== null
      ? Math.max(leaderAudienceAdvantage, 0)
      : 0;

  const rivalListenersToLead =
    leaderAudienceAdvantage !== null
      ? Math.max(leaderAudienceAdvantage + 1, 1)
      : 1;

  const rivalPressureLevel =
    leaderAudienceAdvantage === 0
      ? "critical"
      : rivalLeaderReach >= 95 && leadershipAdvantageTrend !== null &&
          leadershipAdvantageTrend < 0
        ? "critical"
        : rivalLeaderReach >= 95 ||
            (leadershipAdvantageTrend !== null &&
              leadershipAdvantageTrend < 0)
          ? "high"
          : rivalLeaderReach >= 85
            ? "medium"
            : "controlled";

  const rivalPressureLabel =
    rivalPressureLevel === "critical"
      ? "CRÍTICA"
      : rivalPressureLevel === "high"
        ? "ALTA"
        : rivalPressureLevel === "medium"
          ? "MEDIA"
          : "CONTROLADA";

  const rivalNextThresholdPercent =
    rivalLeaderReach >= 95
      ? null
      : rivalLeaderReach >= 85
        ? 95
        : 85;

  const rivalListenersToNextThreshold =
    rivalNextThresholdPercent !== null &&
    topVisibleLeaderListeners > 0
      ? Math.max(
          Math.ceil(
            topVisibleLeaderListeners *
              (rivalNextThresholdPercent / 100),
          ) - secondVisibleListeners,
          0,
        )
      : 0;


  const leadershipDuelListeners =
    secondVisibleStation
      ? topVisibleLeaderListeners + secondVisibleListeners
      : 0;

  const leaderHeadToHeadShare =
    leadershipDuelListeners > 0
      ? Math.round(
          (topVisibleLeaderListeners / leadershipDuelListeners) * 100,
        )
      : 0;

  const challengerHeadToHeadShare =
    leadershipDuelListeners > 0
      ? 100 - leaderHeadToHeadShare
      : 0;

  const headToHeadShareGap =
    leadershipDuelListeners > 0
      ? Math.abs(
          leaderHeadToHeadShare - challengerHeadToHeadShare,
        )
      : 0;

  const headToHeadPulseTrend =
    selectedRankingListenerChange !== null &&
    secondVisibleRankingListenerChange !== null
      ? selectedRankingListenerChange -
        secondVisibleRankingListenerChange
      : null;

  const headToHeadMomentWinner =
    headToHeadPulseTrend === null
      ? "pending"
      : headToHeadPulseTrend > 0
        ? "leader"
        : headToHeadPulseTrend < 0
          ? "rival"
          : "tied";

  const selectedRankingInfo =
    selectedVisiblePosition !== null
      ? metadata[selected.id] ?? emptyNowPlaying(selected)
      : null;

  const selectedRankingListeners =
    selectedRankingInfo &&
    typeof selectedRankingInfo.listeners === "number"
      ? selectedRankingInfo.listeners
      : null;

  const selectedRankingAudienceShare =
    selectedRankingListeners !== null && visibleStationsListeners > 0
      ? Math.round(
          (selectedRankingListeners / visibleStationsListeners) * 100,
        )
      : null;

  const selectedRankingGap =
    selectedRankingListeners !== null &&
    topVisibleStationInfo &&
    typeof topVisibleStationInfo.listeners === "number"
      ? Math.max(
          topVisibleStationInfo.listeners - selectedRankingListeners,
          0,
        )
      : null;

  const selectedVsLeaderProgress =
    selectedRankingListeners !== null &&
    topVisibleLeaderListeners > 0
      ? Math.min(
          Math.round(
            (selectedRankingListeners / topVisibleLeaderListeners) *
              100,
          ),
          100,
        )
      : null;

  const selectedListenersToLead =
    selectedRankingListeners !== null &&
    topVisibleLeaderListeners > 0
      ? selectedVisiblePosition === 1
        ? 0
        : Math.max(
            topVisibleLeaderListeners - selectedRankingListeners + 1,
            1,
          )
      : null;

  const selectedNextTargetStation =
    selectedVisibleIndex > 0
      ? visibleStations[selectedVisibleIndex - 1]
      : null;

  const selectedNextTargetInfo = selectedNextTargetStation
    ? metadata[selectedNextTargetStation.id] ??
      emptyNowPlaying(selectedNextTargetStation)
    : null;

  const selectedNextTargetListeners =
    selectedNextTargetInfo &&
    typeof selectedNextTargetInfo.listeners === "number"
      ? selectedNextTargetInfo.listeners
      : null;

  const selectedListenersToNextPosition =
    selectedRankingListeners !== null &&
    selectedNextTargetListeners !== null
      ? Math.max(
          selectedNextTargetListeners - selectedRankingListeners + 1,
          1,
        )
      : null;

  const thirdVisibleStation = topVisibleStations[2] ?? null;

  const thirdVisibleStationInfo = thirdVisibleStation
    ? metadata[thirdVisibleStation.id] ??
      emptyNowPlaying(thirdVisibleStation)
    : null;

  const thirdVisibleListeners =
    thirdVisibleStationInfo &&
    typeof thirdVisibleStationInfo.listeners === "number"
      ? thirdVisibleStationInfo.listeners
      : null;

  const selectedListenersToTop3 =
    selectedVisiblePosition !== null &&
    selectedVisiblePosition > 3 &&
    selectedRankingListeners !== null &&
    thirdVisibleListeners !== null
      ? Math.max(
          thirdVisibleListeners - selectedRankingListeners + 1,
          1,
        )
      : null;

  const selectedTop3Progress =
    selectedVisiblePosition !== null &&
    selectedRankingListeners !== null &&
    thirdVisibleListeners !== null &&
    thirdVisibleListeners > 0
      ? selectedVisiblePosition <= 3
        ? 100
        : Math.min(
            Math.round(
              (selectedRankingListeners / thirdVisibleListeners) * 100,
            ),
            100,
          )
      : null;

  const top3VisibleListeners = topVisibleStations.reduce(
    (total, station) => {
      const info = metadata[station.id] ?? emptyNowPlaying(station);

      return (
        total +
        (typeof info.listeners === "number" ? info.listeners : 0)
      );
    },
    0,
  );

  const top3AudienceShare =
    visibleStationsListeners > 0
      ? Math.round(
          (top3VisibleListeners / visibleStationsListeners) * 100,
        )
      : 0;

  const top3SelectionContext = (() => {
    const parts: string[] = [];

    if (activeGenre === "FAVORITAS") {
      parts.push("MIS FAVORITAS");
    } else if (activeGenre === "RECIENTES") {
      parts.push("RECIENTES");
    } else if (activeGenre !== "TODAS") {
      parts.push(activeGenre);
    }

    if (onlyOnAir) {
      parts.push("SOLO AL AIRE");
    }

    if (stationQuery.trim()) {
      parts.push(`BÚSQUEDA: ${stationQuery.trim()}`);
    }

    return parts.length > 0 ? parts.join(" · ") : "TODA LA RED";
  })();

  const getGenreCount = (genre: string) => {
    if (genre === "TODAS") return stations.length;

    return stations.filter((station) => station.genre === genre).length;
  };

  const resetStationFilters = () => {
    setActiveGenre("TODAS");
    setStationQuery("");
    setStationSortMode("network");
    setOnlyOnAir(false);
  };

  const cycleStationSort = () => {
    setStationSortMode((current) => {
      if (current === "network") return "audience";
      if (current === "audience") return "alphabetical";
      return "network";
    });
  };

  const revealFullAudienceRanking = () => {
    setStationSortMode("audience");

    window.setTimeout(() => {
      document.getElementById("station-ranking-grid")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  const revealStationInAudienceRanking = (station: Station) => {
    setStationSortMode("audience");

    window.setTimeout(() => {
      document
        .getElementById(`station-card-${station.id}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 90);
  };

  const rememberStationSearch = (query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setRecentStationSearches((current) => {
      const next = [
        cleanQuery,
        ...current.filter(
          (item) => item.toLowerCase() !== cleanQuery.toLowerCase(),
        ),
      ].slice(0, 6);

      try {
        window.localStorage.setItem(
          "fieramix-station-search-history",
          JSON.stringify(next),
        );
      } catch {
        // El historial seguirá funcionando durante esta sesión.
      }

      return next;
    });
  };

  const applyRecentStationSearch = (query: string) => {
    setActiveGenre("TODAS");
    setOnlyOnAir(false);
    setStationSortMode("network");
    setStationQuery(query);
    setSearchMatchIndex(0);
    setControlsCollapsed(false);

    window.setTimeout(() => {
      const searchInput = document.getElementById(
        "station-network-search",
      ) as HTMLInputElement | null;

      searchInput?.focus();
      searchInput?.select();
    }, 80);
  };

  const removeRecentStationSearch = (query: string) => {
    setRecentStationSearches((current) => {
      const next = current.filter(
        (item) => item.toLowerCase() !== query.toLowerCase(),
      );

      try {
        if (next.length > 0) {
          window.localStorage.setItem(
            "fieramix-station-search-history",
            JSON.stringify(next),
          );
        } else {
          window.localStorage.removeItem(
            "fieramix-station-search-history",
          );
        }
      } catch {
        // El cambio se mantiene al menos durante esta sesión.
      }

      return next;
    });
  };

  const clearRecentStationSearches = () => {
    setRecentStationSearches([]);

    try {
      window.localStorage.removeItem(
        "fieramix-station-search-history",
      );
    } catch {
      // Limpiamos al menos el estado actual.
    }
  };

  const expandSearchAcrossNetwork = () => {
    setActiveGenre("TODAS");
    setOnlyOnAir(false);
    setStationSortMode("network");
    setSearchMatchIndex(0);
    setControlsCollapsed(false);

    window.setTimeout(() => {
      const searchInput = document.getElementById(
        "station-network-search",
      ) as HTMLInputElement | null;

      searchInput?.focus();
      searchInput?.select();
    }, 80);
  };

  const searchArtistAcrossNetwork = (artist: string) => {
    const cleanArtist = artist.trim();
    if (!cleanArtist) return;

    setActiveGenre("TODAS");
    setOnlyOnAir(false);
    setStationSortMode("network");
    setStationQuery(cleanArtist);
    rememberStationSearch(cleanArtist);
    setSearchMatchIndex(0);
    setControlsCollapsed(false);

    window.setTimeout(() => {
      const searchInput = document.getElementById(
        "station-network-search",
      ) as HTMLInputElement | null;

      searchInput?.focus();
      searchInput?.select();
    }, 80);
  };

  const searchSongAcrossNetwork = (title: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setActiveGenre("TODAS");
    setOnlyOnAir(false);
    setStationSortMode("network");
    setStationQuery(cleanTitle);
    rememberStationSearch(cleanTitle);
    setSearchMatchIndex(0);
    setControlsCollapsed(false);

    window.setTimeout(() => {
      const searchInput = document.getElementById(
        "station-network-search",
      ) as HTMLInputElement | null;

      searchInput?.focus();
      searchInput?.select();
    }, 80);
  };

  const showGenreAcrossNetwork = (genre: string) => {
    const cleanGenre = genre.trim();
    if (!cleanGenre) return;

    setStationQuery("");
    setOnlyOnAir(false);
    setStationSortMode("network");
    setActiveGenre(cleanGenre);
    setSearchMatchIndex(0);
    setControlsCollapsed(false);

    window.setTimeout(() => {
      document
        .getElementById("station-control-dock")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 80);
  };

  const moveSearchMatch = (direction: "previous" | "next") => {
    if (visibleStations.length <= 1) return;

    setSearchMatchIndex((current) => {
      const safeCurrent = Math.min(
        current,
        Math.max(visibleStations.length - 1, 0),
      );

      return direction === "next"
        ? (safeCurrent + 1) % visibleStations.length
        : (safeCurrent - 1 + visibleStations.length) %
            visibleStations.length;
    });
  };

  const scrollNetworkNow = (direction: "left" | "right") => {
    const scroller = document.getElementById("network-now-scroller");
    if (!scroller) return;

    const distance = Math.max(260, Math.round(scroller.clientWidth * 0.72));

    scroller.scrollBy({
      left: direction === "right" ? distance : -distance,
      behavior: "smooth",
    });
  };

  const moveStation = (direction: "previous" | "next") => {
    const pool = visibleStations.length > 0 ? visibleStations : stations;
    if (pool.length === 0) return;

    const currentIndex = pool.findIndex(
      (station) => station.id === selected.id,
    );

    let nextIndex = 0;

    if (currentIndex >= 0) {
      nextIndex =
        direction === "next"
          ? (currentIndex + 1) % pool.length
          : (currentIndex - 1 + pool.length) % pool.length;
    } else if (direction === "previous") {
      nextIndex = pool.length - 1;
    }

    const nextStation = pool[nextIndex];
    if (!nextStation) return;

    playStation(nextStation);
  };

  const playFirstVisibleStation = () => {
    const firstStation =
      visibleStations[normalizedSearchMatchIndex] ?? visibleStations[0];

    if (!firstStation) return;

    playStation(firstStation);

    window.setTimeout(() => {
      document
        .getElementById(`station-card-${firstStation.id}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 120);
  };

  const playRandomStation = () => {
    if (visibleStations.length === 0) return;

    const candidates =
      visibleStations.length > 1
        ? visibleStations.filter((station) => station.id !== selected.id)
        : visibleStations;

    const pool = candidates.length > 0 ? candidates : visibleStations;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const randomStation = pool[randomIndex];

    if (!randomStation) return;

    playStation(randomStation);

    window.setTimeout(() => {
      document
        .getElementById(`station-card-${randomStation.id}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 120);
  };

  const revealSelectedStation = () => {
    resetStationFilters();

    window.setTimeout(() => {
      document
        .getElementById(`station-card-${selected.id}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 120);
  };

  const revealSelectedStationInRanking = () => {
    if (selectedVisiblePosition === null) return;

    document
      .getElementById(`station-card-${selected.id}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  };

  const revealSelectedNextTargetInRanking = () => {
    if (!selectedNextTargetStation) return;

    document
      .getElementById(
        `station-card-${selectedNextTargetStation.id}`,
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  };

  const revealTop3TargetInRanking = () => {
    if (!thirdVisibleStation) return;

    document
      .getElementById(`station-card-${thirdVisibleStation.id}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  };

  useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTyping =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        Boolean(target?.isContentEditable);

      if (event.key === "Escape") {
        if (stationQuery) {
          event.preventDefault();
          setStationQuery("");
        }

        if (target instanceof HTMLElement) {
          target.blur();
        }

        return;
      }

      if (
        isTyping ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "f") {
        event.preventDefault();

        if (controlsCollapsed) {
          setControlsCollapsed(false);
        }

        window.setTimeout(() => {
          const searchInput = document.getElementById(
            "station-network-search",
          ) as HTMLInputElement | null;

          searchInput?.focus();
          searchInput?.select();
        }, controlsCollapsed ? 80 : 0);

        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        playStation(selected);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveStation("previous");
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveStation("next");
        return;
      }

      if (key === "g") {
        event.preventDefault();
        toggleFavorite(selected.id);
        return;
      }

      if (key === "c") {
        event.preventDefault();
        void shareNowPlaying();
        return;
      }

      if (key === "r") {
        event.preventDefault();
        playRandomStation();
        return;
      }

      if (key === "v") {
        event.preventDefault();
        setCompactView((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcuts);

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcuts);
    };
  }, [
    controlsCollapsed,
    stationQuery,
    visibleStations,
    selected.id,
  ]);

  return (
    <section id="emisoras" className="section stationsSection">
      <div className="sectionTitle stationsSectionTitle">
        <span>LA RED LATINA QUE MUEVE AL MUNDO</span>
        <h2>EXPLORA NUESTRAS EMISORAS</h2>
        <p>
          Elige tu estilo y entra en vivo a la programación de
          EL GRUPO FIERAMIX.COM.
        </p>
      </div>

      <div className="stationVisibleIntro">
        <span>
          <i aria-hidden="true" />
          EMISORAS AL AIRE
        </span>
        <small>ELIGE UNA EMISORA Y ESCUCHA EN VIVO</small>
      </div>

      <div
        id="station-ranking-grid"
        className={
          compactView
            ? "stationGrid stationGridCompact"
            : "stationGrid"
        }
      >
        {visibleStations.length === 0 ? (
          <div className="stationEmptyState">
            <span aria-hidden="true">⌕</span>
            <strong>NO ENCONTRAMOS ESA EMISORA</strong>
            <small>
              {activeGenre === "FAVORITAS"
                ? "Aún no has guardado emisoras favoritas."
                : activeGenre === "RECIENTES"
                  ? "Aún no has escuchado emisoras en este navegador."
                  : "Prueba otro nombre, género o selecciona TODAS."}
            </small>
            <button
              type="button"
              onClick={resetStationFilters}
            >
              VER TODA LA RED
            </button>
          </div>
        ) : null}

        {visibleStations.map((station, index) => {
          const info =
            metadata[station.id] ?? emptyNowPlaying(station);

          const active = station.id === selected.id;
          const stationListenerCount =
            typeof info.listeners === "number" ? info.listeners : 0;

          const stationNetworkAudienceShare =
            networkListeners > 0
              ? Math.round(
                  (stationListenerCount / networkListeners) * 100,
                )
              : 0;

          const stationAudienceShare =
            visibleStationsListeners > 0
              ? Math.round(
                  (stationListenerCount / visibleStationsListeners) *
                    100,
                )
              : 0;

          const stationAudienceVsAverage =
            Math.round(
              (
                (
                  filtersAreActive
                    ? stationAudienceShare
                    : stationNetworkAudienceShare
                ) - contextualAverageAudienceShare
              ) * 10,
            ) / 10;

          const stationListenersVsAverage =
            Math.round(
              stationListenerCount -
                contextualAverageStationListeners,
            );

          const stationAudienceGap =
            index === 0
              ? 0
              : Math.max(
                  topVisibleLeaderListeners - stationListenerCount,
                  0,
                );

          const stationGapToSecond =
            index === 2
              ? Math.max(
                  secondVisibleListeners - stationListenerCount,
                  0,
                )
              : null;

          const stationGapToSecondRate =
            stationGapToSecond !== null &&
            secondVisibleListeners > 0
              ? Math.round(
                  (stationGapToSecond /
                    secondVisibleListeners) *
                    1000,
                ) / 10
              : stationGapToSecond === 0
                ? 0
                : null;

          const stationGapToTop3 =
            stationSortMode === "audience" &&
            index === 3 &&
            thirdVisibleStation &&
            thirdVisibleListeners !== null
              ? Math.max(
                  thirdVisibleListeners - stationListenerCount,
                  0,
                )
              : null;

          const stationGapToTop3Rate =
            stationGapToTop3 !== null &&
            thirdVisibleListeners !== null &&
            thirdVisibleListeners > 0
              ? Math.round(
                  (stationGapToTop3 /
                    thirdVisibleListeners) *
                    1000,
                ) / 10
              : stationGapToTop3 === 0
                ? 0
                : null;

          const stationThirdPressureLevel =
            stationGapToSecond === null
              ? null
              : stationGapToSecond === 0 ||
                  (stationGapToSecondRate !== null &&
                    stationGapToSecondRate < 3)
                ? "high"
                : stationGapToSecondRate !== null &&
                    stationGapToSecondRate < 10
                  ? "medium"
                  : "low";

          const stationRankingMovement =
            rankingMovements[station.id] ?? 0;
          const stationRankingListenerChange =
            rankingListenerChanges[station.id] ?? 0;

          const stationThirdPressureDelta =
            index === 2 &&
            rankingMovementReady &&
            secondVisibleRankingListenerChange !== null
              ? stationRankingListenerChange -
                secondVisibleRankingListenerChange
              : null;

          const stationThirdPressureMomentum =
            stationThirdPressureDelta === null
              ? null
              : stationThirdPressureDelta > 0
                ? "increasing"
                : stationThirdPressureDelta < 0
                  ? "decreasing"
                  : "stable";

          const stationCurrentRankingPosition = index + 1;
          const stationPreviousRankingPosition = Math.min(
            Math.max(
              stationCurrentRankingPosition +
                stationRankingMovement,
              1,
            ),
            Math.max(visibleStations.length, 1),
          );

          const stationBecameLeader =
            rankingMovementReady &&
            stationCurrentRankingPosition === 1 &&
            stationPreviousRankingPosition > 1;

          const stationLostLeadership =
            rankingMovementReady &&
            stationCurrentRankingPosition > 1 &&
            stationPreviousRankingPosition === 1;

          const stationEnteredTop3 =
            rankingMovementReady &&
            stationCurrentRankingPosition <= 3 &&
            stationPreviousRankingPosition > 3;

          const stationExitedTop3 =
            rankingMovementReady &&
            stationCurrentRankingPosition > 3 &&
            stationPreviousRankingPosition <= 3;

          const stationPreviousListeners = Math.max(
            0,
            stationListenerCount - stationRankingListenerChange,
          );

          const stationListenerChangeRate =
            stationPreviousListeners > 0
              ? Math.round(
                  (stationRankingListenerChange /
                    stationPreviousListeners) *
                    1000,
                ) / 10
              : stationRankingListenerChange === 0
                ? 0
                : null;

          const stationListenerMovementStrength =
            stationListenerChangeRate === null
              ? "softMove"
              : Math.abs(stationListenerChangeRate) >= 5
                ? "strongMove"
                : Math.abs(stationListenerChangeRate) >= 2
                  ? "mediumMove"
                  : "softMove";

          const artwork =
            info.artwork && info.artwork !== station.logo
              ? info.artwork
              : station.logo;

          return (
            <article
              key={station.id}
              id={`station-card-${station.id}`}
              className={[
                "stationCard",
                active ? "active" : "",
                rankingMovementReady &&
                stationListenerMovementStrength === "mediumMove" &&
                stationRankingListenerChange > 0
                  ? "mediumAudienceUp"
                  : "",
                rankingMovementReady &&
                stationListenerMovementStrength === "mediumMove" &&
                stationRankingListenerChange < 0
                  ? "mediumAudienceDown"
                  : "",
                rankingMovementReady &&
                stationListenerMovementStrength === "strongMove" &&
                stationRankingListenerChange > 0
                  ? "strongAudienceUp"
                  : "",
                rankingMovementReady &&
                stationListenerMovementStrength === "strongMove" &&
                stationRankingListenerChange < 0
                  ? "strongAudienceDown"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                {
                  "--accent": station.accent,
                } as CSSProperties
              }
              aria-current={active ? "true" : undefined}
            >
              <div className="stationBadge">
                <i aria-hidden="true" />
                {info.configured ? " AL AIRE" : " DISPONIBLE"}
              </div>

              {stationSortMode === "audience" ? (
                <div
                  className={
                    index < 3
                      ? `stationAudienceRank top${index + 1}${
                          active ? " selectedRank" : ""
                        }${
                          active && selectedRankDetailsCollapsed
                            ? " compactSelectedRank"
                            : ""
                        }`
                      : `stationAudienceRank${
                          active ? " selectedRank" : ""
                        }${
                          active && selectedRankDetailsCollapsed
                            ? " compactSelectedRank"
                            : ""
                        }`
                  }
                  aria-label={
                    active
                      ? `Tu emisora está en la posición ${index + 1} por audiencia`
                      : `Posición ${index + 1} por audiencia`
                  }
                >
                  <small>
                    {active ? "TU EMISORA" : "RANKING EN VIVO"}
                  </small>
                  <strong>#{index + 1}</strong>

                  {rankingMovementReady ? (
                    <span
                      className={
                        stationRankingMovement > 0
                          ? `stationAudienceMovement up${
                              active ? " selected" : ""
                            }`
                          : stationRankingMovement < 0
                            ? `stationAudienceMovement down${
                                active ? " selected" : ""
                              }`
                            : `stationAudienceMovement steady${
                                active ? " selected" : ""
                              }`
                      }
                      title={
                        stationBecameLeader
                          ? `Tomó el liderato: pasó de #${stationPreviousRankingPosition} a #1`
                          : stationLostLeadership
                            ? `Cedió el liderato: pasó de #1 a #${stationCurrentRankingPosition}`
                            : stationEnteredTop3
                              ? `Entró al TOP 3: pasó de #${stationPreviousRankingPosition} a #${stationCurrentRankingPosition}`
                              : stationExitedTop3
                                ? `Salió del TOP 3: pasó de #${stationPreviousRankingPosition} a #${stationCurrentRankingPosition}`
                                : stationRankingMovement > 0
                                  ? `Subió ${stationRankingMovement} ${
                                      stationRankingMovement === 1
                                        ? "posición"
                                        : "posiciones"
                                    }: de #${stationPreviousRankingPosition} a #${stationCurrentRankingPosition}`
                                  : stationRankingMovement < 0
                                    ? `Bajó ${Math.abs(
                                        stationRankingMovement,
                                      )} ${
                                        Math.abs(
                                          stationRankingMovement,
                                        ) === 1
                                          ? "posición"
                                          : "posiciones"
                                      }: de #${stationPreviousRankingPosition} a #${stationCurrentRankingPosition}`
                                    : `Mantiene la posición #${stationCurrentRankingPosition}`
                      }
                    >
                      <span aria-hidden="true">
                        {stationRankingMovement > 0
                          ? "↑"
                          : stationRankingMovement < 0
                            ? "↓"
                            : "—"}
                      </span>

                      <span
                        className={[
                          "stationAudienceMovementPosition",
                          stationBecameLeader
                            ? "becameLeader"
                            : stationLostLeadership
                              ? "lostLeadership"
                              : stationEnteredTop3
                                ? "enteredTop3"
                                : stationExitedTop3
                                  ? "exitedTop3"
                                  : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {stationBecameLeader
                          ? "TOMA EL #1"
                          : stationLostLeadership
                            ? "CEDE EL #1"
                            : stationEnteredTop3
                              ? "ENTRA TOP 3"
                              : stationExitedTop3
                                ? "SALE TOP 3"
                                : stationRankingMovement > 0
                                  ? `SUBE ${stationRankingMovement} · ANTES #${stationPreviousRankingPosition}`
                                  : stationRankingMovement < 0
                                    ? `BAJA ${Math.abs(
                                        stationRankingMovement,
                                      )} · ANTES #${stationPreviousRankingPosition}`
                                    : `MANTIENE #${stationCurrentRankingPosition}`}
                      </span>

                      <em
                        className={
                          stationRankingListenerChange > 0
                            ? "listenerUp"
                            : stationRankingListenerChange < 0
                              ? "listenerDown"
                              : "listenerSteady"
                        }
                      >
                        {stationRankingListenerChange > 0
                          ? `+${stationRankingListenerChange} OY`
                          : stationRankingListenerChange < 0
                            ? `${stationRankingListenerChange} OY`
                            : "0 OY"}
                      </em>
                    </span>
                  ) : null}

                  {active ? (
                    <button
                      type="button"
                      className="stationAudienceRankDetailsToggle"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedRankDetailsCollapsed(
                          (current) => !current,
                        );
                      }}
                      aria-expanded={!selectedRankDetailsCollapsed}
                      title={
                        selectedRankDetailsCollapsed
                          ? "Mostrar metas de tu emisora"
                          : "Minimizar metas de tu emisora"
                      }
                    >
                      <span aria-hidden="true">
                        {selectedRankDetailsCollapsed ? "＋" : "−"}
                      </span>

                      {selectedRankDetailsCollapsed
                        ? "MOSTRAR METAS"
                        : "MINIMIZAR METAS"}
                    </button>
                  ) : null}

                  {active && !selectedRankDetailsCollapsed ? (
                    <>
                      <span
                        className={
                          index === 0
                            ? "stationAudienceNextMove leading"
                            : "stationAudienceNextMove"
                        }
                      >
                        {index === 0 ? (
                          <>
                            <span aria-hidden="true">★</span>
                            LÍDER ACTUAL
                          </>
                        ) : selectedListenersToNextPosition !== null ? (
                          <>
                            <span aria-hidden="true">↑</span>
                            SUBIR AL #{index} · +
                            {selectedListenersToNextPosition}{" "}
                            {selectedListenersToNextPosition === 1
                              ? "OYENTE"
                              : "OYENTES"}
                          </>
                        ) : null}
                      </span>

                      <span
                        className={
                          index < 3
                            ? "stationAudiencePodiumGoal achieved"
                            : "stationAudiencePodiumGoal"
                        }
                      >
                        <span aria-hidden="true">
                          {index < 3 ? "◆" : "△"}
                        </span>

                        {index < 3 ? (
                          "YA ESTÁS EN EL TOP 3"
                        ) : selectedListenersToTop3 !== null ? (
                          <>
                            ENTRAR AL TOP 3 · +
                            {selectedListenersToTop3}{" "}
                            {selectedListenersToTop3 === 1
                              ? "OYENTE"
                              : "OYENTES"}
                          </>
                        ) : (
                          "META TOP 3"
                        )}
                      </span>

                      {selectedTop3Progress !== null ? (
                        <span
                          className={
                            index < 3
                              ? "stationAudienceTop3Progress achieved"
                              : "stationAudienceTop3Progress"
                          }
                        >
                          <span className="stationAudienceTop3ProgressLabel">
                            <small>
                              {index < 3
                                ? "PODIO ACTIVO"
                                : "PROGRESO AL TOP 3"}
                            </small>

                            <b>{selectedTop3Progress}%</b>
                          </span>

                          <span
                            className="stationAudienceTop3ProgressTrack"
                            aria-hidden="true"
                          >
                            <i
                              style={{
                                width: `${Math.max(
                                  selectedTop3Progress,
                                  selectedTop3Progress > 0 ? 5 : 0,
                                )}%`,
                              }}
                            />
                          </span>
                        </span>
                      ) : null}

                      {index >= 3 && thirdVisibleStation ? (
                        <span className="stationAudiencePodiumTargetGroup">
                          <span className="stationAudiencePodiumTargetNow">
                            <span aria-hidden="true">♪</span>

                            <span>
                              <small>SONANDO EN #3</small>

                              <strong
                                title={
                                  thirdVisibleStationInfo?.artist
                                    ? `${thirdVisibleStationInfo.title} — ${thirdVisibleStationInfo.artist}`
                                    : thirdVisibleStationInfo?.title
                                }
                              >
                                {thirdVisibleStationInfo?.title ||
                                  "Programación en vivo"}
                              </strong>

                              {thirdVisibleStationInfo?.artist ? (
                                <em>
                                  {thirdVisibleStationInfo.artist}
                                </em>
                              ) : null}
                            </span>
                          </span>

                          <button
                            type="button"
                            className="stationAudiencePodiumTarget"
                            onClick={(event) => {
                              event.stopPropagation();
                              playStation(thirdVisibleStation);
                            }}
                            aria-label={`Escuchar la emisora número tres ${thirdVisibleStation.name}`}
                            title={`Escuchar ${thirdVisibleStation.name}, actual número tres`}
                          >
                            <span aria-hidden="true">▶</span>

                            <span>
                              <small>OBJETIVO #3</small>
                              <strong>
                                {thirdVisibleStation.shortName ||
                                  thirdVisibleStation.name}
                              </strong>
                            </span>

                            <b>ESCUCHAR #3</b>
                          </button>

                          <button
                            type="button"
                            className="stationAudiencePodiumTargetView"
                            onClick={(event) => {
                              event.stopPropagation();
                              revealTop3TargetInRanking();
                            }}
                            aria-label={`Ver la emisora número tres ${thirdVisibleStation.name} dentro del ranking`}
                            title={`Ir a ${thirdVisibleStation.name}, actual número tres`}
                          >
                            <span aria-hidden="true">↓</span>
                            VER #3
                          </button>
                        </span>
                      ) : null}
                    </>
                  ) : null}

                  <span
                    className="stationAudienceShare"
                    title={`${stationAudienceShare}% de la audiencia de esta selección`}
                  >
                    <b>{stationAudienceShare}%</b>

                    <i aria-hidden="true">
                      <em
                        style={{
                          width: `${Math.max(
                            stationAudienceShare,
                            stationAudienceShare > 0 ? 5 : 0,
                          )}%`,
                        }}
                      />
                    </i>

                    <small
                      className={
                        index > 0 && stationAudienceGap === 0
                          ? "stationAudienceGap tied"
                          : "stationAudienceGap"
                      }
                    >
                      {index === 0
                        ? "LÍDER"
                        : stationAudienceGap === 0
                          ? "EMPATE CON #1"
                          : stationAudienceGap === 1
                            ? "A 1 OYENTE DEL #1"
                            : `A ${stationAudienceGap} OYENTES DEL #1`}
                    </small>
                  </span>
                </div>
              ) : null}

              {active ? (
                <div className="stationSelectedState" aria-live="polite">
                  <span aria-hidden="true">{playing ? "◉" : "✓"}</span>
                  <strong>
                    {playing ? "EN REPRODUCCIÓN" : "EMISORA SELECCIONADA"}
                  </strong>
                </div>
              ) : null}

              <div className="stationArtwork">
                <img
                  className="stationArtworkMain"
                  src={artwork}
                  alt={`Portada actual de ${station.name}`}
                  width={148}
                  height={148}
                  onError={(event) => {
                    event.currentTarget.src = station.logo;
                  }}
                />

                {rankingMovementReady &&
                typeof info.listeners === "number" &&
                stationRankingListenerChange !== 0 &&
                stationListenerMovementStrength !== "softMove" ? (
                  <span
                    className={[
                      "stationArtworkMomentum",
                      stationRankingListenerChange > 0 ? "up" : "down",
                      stationListenerMovementStrength,
                    ].join(" ")}
                    title={
                      stationRankingListenerChange > 0
                        ? `${
                            stationListenerMovementStrength === "strongMove"
                              ? "Subida fuerte"
                              : "Subida moderada"
                          } de audiencia`
                        : `${
                            stationListenerMovementStrength === "strongMove"
                              ? "Caída fuerte"
                              : "Caída moderada"
                          } de audiencia`
                    }
                    aria-label={
                      stationRankingListenerChange > 0
                        ? `${
                            stationListenerMovementStrength === "strongMove"
                              ? "Subida fuerte"
                              : "Subida moderada"
                          } de audiencia`
                        : `${
                            stationListenerMovementStrength === "strongMove"
                              ? "Caída fuerte"
                              : "Caída moderada"
                          } de audiencia`
                    }
                  >
                    <span aria-hidden="true">
                      {stationRankingListenerChange > 0 ? "▲" : "▼"}
                    </span>

                    {stationListenerChangeRate !== null ? (
                      <strong className="stationArtworkMomentumRate">
                        {stationListenerChangeRate > 0
                          ? `+${stationListenerChangeRate.toFixed(1)}%`
                          : `−${Math.abs(
                              stationListenerChangeRate,
                            ).toFixed(1)}%`}
                      </strong>
                    ) : null}
                  </span>
                ) : null}

                <button
                  type="button"
                  className="stationArtworkPlay"
                  onClick={() => playStation(station)}
                  aria-label={
                    active && playing
                      ? `Pausar ${station.name}`
                      : `Escuchar ${station.name}`
                  }
                  aria-pressed={active && playing}
                >
                  <span aria-hidden="true">
                    {active && playing ? "❚❚" : "▶"}
                  </span>
                  <strong>
                    {active && playing ? "PAUSAR" : "ESCUCHAR"}
                  </strong>
                </button>

                <img
                  className="stationLogoBadge"
                  src={station.logo}
                  alt=""
                  width={44}
                  height={44}
                />

                {active && playing ? (
                  <span className="stationPlayingIndicator" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                ) : null}
              </div>

              <span>{station.genre}</span>

              <div className="stationNameRow">
                <h3>
                    {highlightSearchText(station.name, stationQuery)}
                  </h3>

                <div className="stationQuickActions">
                  <button
                    type="button"
                    className={
                      favoriteStations.includes(station.id)
                        ? "stationFavorite active"
                        : "stationFavorite"
                    }
                    onClick={() => toggleFavorite(station.id)}
                    aria-label={
                      favoriteStations.includes(station.id)
                        ? `Quitar ${station.name} de favoritas`
                        : `Agregar ${station.name} a favoritas`
                    }
                    aria-pressed={favoriteStations.includes(station.id)}
                    title={
                      favoriteStations.includes(station.id)
                        ? "Quitar de favoritas"
                        : "Agregar a favoritas"
                    }
                  >
                    <span aria-hidden="true">
                      {favoriteStations.includes(station.id) ? "♥" : "♡"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={
                      sharedStationId === station.id
                        ? "stationShare active"
                        : "stationShare"
                    }
                    onClick={() => shareStation(station)}
                    aria-label={`Compartir ${station.name}`}
                    title="Compartir emisora"
                  >
                    <span aria-hidden="true">
                      {sharedStationId === station.id ? "✓" : "↗"}
                    </span>
                  </button>
                </div>
              </div>

              <p className="stationSlogan">
                {highlightSearchText(station.slogan, stationQuery)}
              </p>

              <div
                className={
                  active && playing
                    ? "stationNow stationNowPlaying"
                    : "stationNow"
                }
                aria-live="polite"
              >
                <div className="stationNowHeader">
                  <span className="stationNowLabel">SONANDO AHORA</span>

                  <div className="stationNowHeaderActions">
                    {info.artist ? (
                      <button
                        type="button"
                        className="stationNowArtistSearch"
                        onClick={() =>
                          searchArtistAcrossNetwork(info.artist)
                        }
                        aria-label={`Buscar ${info.artist} en toda la red`}
                        title={`Buscar ${info.artist} en la red`}
                      >
                        <span aria-hidden="true">⌕</span>
                        BUSCAR ARTISTA
                      </button>
                    ) : null}

                    {info.title ? (
                      <button
                        type="button"
                        className="stationNowSongSearch"
                        onClick={() =>
                          searchSongAcrossNetwork(info.title)
                        }
                        aria-label={`Buscar ${info.title} en toda la red`}
                        title={`Buscar ${info.title} en la red`}
                      >
                        <span aria-hidden="true">♪</span>
                        BUSCAR CANCIÓN
                      </button>
                    ) : null}

                    {active && playing ? (
                      <span className="stationNowPulse" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                    ) : null}
                  </div>
                </div>

                <b title={info.title}>
                  {highlightSearchText(info.title, stationQuery)}
                </b>
                <small title={info.artist}>
                  {highlightSearchText(info.artist, stationQuery)}
                </small>
              </div>

              <div className="stationFooter">
                <span
                  className="stationFooterAudience"
                  title={
                    typeof info.listeners === "number"
                      ? `${stationNetworkAudienceShare}% de la audiencia total de la red`
                      : "Audiencia no disponible"
                  }
                >
                  <span className="stationFooterAudienceCount">
                    <span>
                      👥 {info.listeners ?? "—"} oyentes
                    </span>

                    {rankingMovementReady &&
                    typeof info.listeners === "number" ? (
                      <em
                        className={[
                          "stationFooterAudienceDelta",
                          stationRankingListenerChange > 0
                            ? "up"
                            : stationRankingListenerChange < 0
                              ? "down"
                              : "steady",
                          stationListenerMovementStrength,
                        ].join(" ")}
                        title={
                          stationRankingListenerChange > 0
                            ? `Ganó ${stationRankingListenerChange} ${
                                stationRankingListenerChange === 1
                                  ? "oyente"
                                  : "oyentes"
                              } desde la actualización anterior${
                                stationListenerChangeRate !== null
                                  ? ` · +${stationListenerChangeRate.toFixed(
                                      1,
                                    )}% · ${
                                      stationListenerMovementStrength ===
                                      "strongMove"
                                        ? "movimiento fuerte"
                                        : stationListenerMovementStrength ===
                                            "mediumMove"
                                          ? "movimiento moderado"
                                          : "movimiento suave"
                                    }`
                                  : ""
                              }`
                            : stationRankingListenerChange < 0
                              ? `Perdió ${Math.abs(
                                  stationRankingListenerChange,
                                )} ${
                                  Math.abs(
                                    stationRankingListenerChange,
                                  ) === 1
                                    ? "oyente"
                                    : "oyentes"
                                } desde la actualización anterior${
                                  stationListenerChangeRate !== null
                                    ? ` · −${Math.abs(
                                        stationListenerChangeRate,
                                      ).toFixed(
                                        1,
                                      )}% · ${
                                        stationListenerMovementStrength ===
                                        "strongMove"
                                          ? "movimiento fuerte"
                                          : stationListenerMovementStrength ===
                                              "mediumMove"
                                            ? "movimiento moderado"
                                            : "movimiento suave"
                                      }`
                                    : ""
                                }`
                              : "Sin cambio de oyentes desde la actualización anterior · 0.0%"
                        }
                      >
                        <span aria-hidden="true">
                          {stationRankingListenerChange > 0
                            ? "▲"
                            : stationRankingListenerChange < 0
                              ? "▼"
                              : "—"}
                        </span>

                        {stationRankingListenerChange > 0
                          ? `+${stationRankingListenerChange}`
                          : stationRankingListenerChange < 0
                            ? `−${Math.abs(
                                stationRankingListenerChange,
                              )}`
                            : "0"}

                        {stationListenerChangeRate !== null ? (
                          <small
                            className="stationFooterAudienceDeltaRate"
                            aria-label={`Variación ${stationListenerChangeRate.toFixed(
                              1,
                            )} por ciento`}
                          >
                            <span aria-hidden="true">·</span>
                            {stationListenerChangeRate > 0
                              ? `+${stationListenerChangeRate.toFixed(
                                  1,
                                )}%`
                              : stationListenerChangeRate < 0
                                ? `−${Math.abs(
                                    stationListenerChangeRate,
                                  ).toFixed(
                                    1,
                                  )}%`
                                : "0.0%"}
                          </small>
                        ) : null}

                        {stationRankingListenerChange !== 0 ? (
                          <span
                            className={[
                              "stationFooterAudienceStrength",
                              stationListenerMovementStrength,
                            ].join(" ")}
                            aria-label={
                              stationListenerMovementStrength ===
                              "strongMove"
                                ? "Movimiento fuerte"
                                : stationListenerMovementStrength ===
                                    "mediumMove"
                                  ? "Movimiento moderado"
                                  : "Movimiento suave"
                            }
                            title={
                              stationListenerMovementStrength ===
                              "strongMove"
                                ? "Movimiento fuerte"
                                : stationListenerMovementStrength ===
                                    "mediumMove"
                                  ? "Movimiento moderado"
                                  : "Movimiento suave"
                            }
                          >
                            <i />
                            <i />
                            <i />
                          </span>
                        ) : null}
                      </em>
                    ) : null}
                  </span>

                  {typeof info.listeners === "number" ? (
                    <button
                      type="button"
                      className={[
                        "stationFooterAudienceShare",
                        stationSortMode === "audience"
                          ? "rankingActive"
                          : "",
                        stationSortMode === "audience" &&
                        index === 0
                          ? "podiumGold"
                          : "",
                        stationSortMode === "audience" &&
                        index === 1
                          ? "podiumSilver"
                          : "",
                        stationSortMode === "audience" &&
                        index === 2
                          ? "podiumBronze"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() =>
                        revealStationInAudienceRanking(station)
                      }
                      aria-label={
                        stationSortMode === "audience"
                          ? filtersAreActive
                            ? `${station.shortName || station.name}, posición ${index + 1} de ${visibleStations.length} en el ranking visible por audiencia`
                            : `${station.shortName || station.name}, posición ${index + 1} de ${stations.length} en el ranking por audiencia`
                          : `Ver ${station.shortName || station.name} en el ranking por audiencia`
                      }
                      title={
                        stationSortMode === "audience"
                          ? filtersAreActive
                            ? `#${index + 1} de ${visibleStations.length} en el ranking visible · ${stationAudienceShare}% entre las emisoras visibles · ${stationNetworkAudienceShare}% de la audiencia total de la red`
                            : `#${index + 1} de ${stations.length} en el ranking · ${stationNetworkAudienceShare}% de la audiencia total de la red`
                          : filtersAreActive
                            ? `${stationAudienceShare}% entre las emisoras visibles · ${stationNetworkAudienceShare}% de la audiencia total de la red · Ver en ranking`
                            : `${stationNetworkAudienceShare}% de la audiencia total de la red · Ver en ranking`
                      }
                    >
                      <em className="stationFooterAudienceMain">
                        {stationSortMode === "audience" ? (
                          <>
                            <strong
                              className={[
                                "stationFooterRankPosition",
                                index === 0
                                  ? "rankGold"
                                  : index === 1
                                    ? "rankSilver"
                                    : index === 2
                                      ? "rankBronze"
                                      : "rankStandard",
                              ].join(" ")}
                            >
                              {index === 0 ? (
                                <span
                                  className={[
                                    "stationFooterLeaderCrown",
                                    stationBecameLeader
                                      ? "newLeader"
                                      : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                  aria-label={
                                    stationBecameLeader
                                      ? "Nuevo líder"
                                      : "Líder actual"
                                  }
                                  title={
                                    stationBecameLeader
                                      ? "Nuevo líder de audiencia"
                                      : "Líder actual de audiencia"
                                  }
                                >
                                  ♛

                                  {leaderAudienceAdvantage !== null ? (
                                    <small
                                      className={[
                                        "stationFooterLeaderGap",
                                        leaderAudienceAdvantage === 0
                                          ? "tied"
                                          : "ahead",
                                      ].join(" ")}
                                      title={
                                        leaderAudienceAdvantage === 0
                                          ? "Empate en el liderato"
                                          : `Ventaja de ${leaderAudienceAdvantage} ${
                                              leaderAudienceAdvantage === 1
                                                ? "oyente"
                                                : "oyentes"
                                            } sobre la emisora #2 · +${leaderRelativeAdvantagePrecise.toFixed(
                                              1,
                                            )}%`
                                      }
                                    >
                                      {leaderAudienceAdvantage === 0 ? (
                                        <>
                                          EMPATE
                                          <span
                                            className="stationFooterLeaderStatus tight"
                                            title={
                                              leaderAdvantageMomentum === null
                                                ? "Estado del liderato: EMPATE"
                                                : leaderAdvantageMomentum > 0
                                                  ? "Estado del liderato: EMPATE · La ventaja tiende a crecer"
                                                  : leaderAdvantageMomentum < 0
                                                    ? "Estado del liderato: EMPATE · La ventaja tiende a reducirse"
                                                    : "Estado del liderato: EMPATE · Tendencia estable"
                                            }
                                          >
                                            AJUSTADO

                                            <span
                                              className="stationFooterLeaderStrength tight"
                                              aria-label="Fuerza del liderato: ajustado"
                                              title="Fuerza del liderato: ajustado"
                                            >
                                              <i />
                                              <i />
                                              <i />
                                            </span>

                                            {leaderAdvantageMomentum !== null ? (
                                              <i
                                                className={[
                                                  "stationFooterLeaderTrend",
                                                  leaderAdvantageMomentum > 0
                                                    ? "growing"
                                                    : leaderAdvantageMomentum < 0
                                                      ? "shrinking"
                                                      : "stable",
                                                ].join(" ")}
                                                aria-label={
                                                  leaderAdvantageMomentum > 0
                                                    ? "Ventaja creciendo"
                                                    : leaderAdvantageMomentum < 0
                                                      ? "Ventaja reduciéndose"
                                                      : "Ventaja estable"
                                                }
                                              >
                                                {leaderAdvantageMomentum > 0
                                                  ? "↑"
                                                  : leaderAdvantageMomentum < 0
                                                    ? "↓"
                                                    : "—"}
                                              </i>
                                            ) : null}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          +{leaderAudienceAdvantage} OY
                                          <span
                                            className="stationFooterLeaderGapRate"
                                            aria-label={`Ventaja relativa ${leaderRelativeAdvantagePrecise.toFixed(
                                              1,
                                            )} por ciento`}
                                          >
                                            · +
                                            {leaderRelativeAdvantagePrecise.toFixed(
                                              1,
                                            )}
                                            %
                                          </span>

                                          {leaderAdvantageStatus ? (
                                            <span
                                              className={[
                                                "stationFooterLeaderStatus",
                                                leaderAdvantageStatus ===
                                                "SÓLIDO"
                                                  ? "solid"
                                                  : leaderAdvantageStatus ===
                                                      "FIRME"
                                                    ? "firm"
                                                    : "tight",
                                              ].join(" ")}
                                              title={
                                                leaderAdvantageMomentum === null
                                                  ? `Estado del liderato: ${leaderAdvantageStatus}`
                                                  : leaderAdvantageMomentum > 0
                                                    ? `Estado del liderato: ${leaderAdvantageStatus} · Ventaja creciendo`
                                                    : leaderAdvantageMomentum < 0
                                                      ? `Estado del liderato: ${leaderAdvantageStatus} · Ventaja reduciéndose`
                                                      : `Estado del liderato: ${leaderAdvantageStatus} · Ventaja estable`
                                              }
                                            >
                                              {leaderAdvantageStatus}

                                              <span
                                                className={[
                                                  "stationFooterLeaderStrength",
                                                  leaderAdvantageStatus ===
                                                  "SÓLIDO"
                                                    ? "solid"
                                                    : leaderAdvantageStatus ===
                                                        "FIRME"
                                                      ? "firm"
                                                      : "tight",
                                                ].join(" ")}
                                                aria-label={`Fuerza del liderato: ${leaderAdvantageStatus.toLowerCase()}`}
                                                title={`Fuerza del liderato: ${leaderAdvantageStatus.toLowerCase()}`}
                                              >
                                                <i />
                                                <i />
                                                <i />
                                              </span>

                                              {leaderAdvantageMomentum !==
                                              null ? (
                                                <i
                                                  className={[
                                                    "stationFooterLeaderTrend",
                                                    leaderAdvantageMomentum > 0
                                                      ? "growing"
                                                      : leaderAdvantageMomentum < 0
                                                        ? "shrinking"
                                                        : "stable",
                                                  ].join(" ")}
                                                  aria-label={
                                                    leaderAdvantageMomentum > 0
                                                      ? "Ventaja creciendo"
                                                      : leaderAdvantageMomentum < 0
                                                        ? "Ventaja reduciéndose"
                                                        : "Ventaja estable"
                                                  }
                                                  title={
                                                    leaderAdvantageMomentum > 0
                                                      ? `La ventaja creció ${leaderAdvantageMomentum} ${
                                                          leaderAdvantageMomentum ===
                                                          1
                                                            ? "oyente"
                                                            : "oyentes"
                                                        } respecto a la actualización anterior`
                                                      : leaderAdvantageMomentum < 0
                                                        ? `La ventaja se redujo ${Math.abs(
                                                            leaderAdvantageMomentum,
                                                          )} ${
                                                            Math.abs(
                                                              leaderAdvantageMomentum,
                                                            ) === 1
                                                              ? "oyente"
                                                              : "oyentes"
                                                          } respecto a la actualización anterior`
                                                        : "La ventaja se mantiene estable"
                                                  }
                                                >
                                                  {leaderAdvantageMomentum > 0
                                                    ? "↑"
                                                    : leaderAdvantageMomentum < 0
                                                      ? "↓"
                                                      : "—"}
                                                </i>
                                              ) : null}
                                            </span>
                                          ) : null}
                                        </>
                                      )}
                                    </small>
                                  ) : null}
                                </span>
                              ) : null}

                              #{index + 1} DE{" "}
                              {filtersAreActive
                                ? visibleStations.length
                                : stations.length}

                              {index === 1 &&
                              leaderAudienceAdvantage !== null ? (
                                <span
                                  className={[
                                    "stationFooterPursuerGap",
                                    leaderAudienceAdvantage === 0
                                      ? "tied"
                                      : "chasing",
                                    (leaderAudienceAdvantage ?? 0) > 0 &&
                                    pursuerPressureLevel === "high" &&
                                    pursuerPressureMomentum === "increasing"
                                      ? "pressureAlert"
                                      : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                  title={
                                    leaderAudienceAdvantage === 0
                                      ? "La emisora #2 está empatada con el #1"
                                      : `A ${leaderAudienceAdvantage} ${
                                          leaderAudienceAdvantage === 1
                                            ? "oyente"
                                            : "oyentes"
                                        } del líder · ${leaderRelativeAdvantagePrecise.toFixed(
                                          1,
                                        )}% de distancia relativa`
                                  }
                                  aria-label={
                                    leaderAudienceAdvantage === 0
                                      ? "Alcanzó al líder"
                                      : `${leaderAudienceAdvantage} ${
                                          leaderAudienceAdvantage === 1
                                            ? "oyente"
                                            : "oyentes"
                                        } para alcanzar al líder, equivalente a ${leaderRelativeAdvantagePrecise.toFixed(
                                          1,
                                        )} por ciento`
                                  }
                                >
                                  <i aria-hidden="true">◎</i>

                                  {leaderAudienceAdvantage === 0 ? (
                                    "ALCANZÓ AL #1"
                                  ) : (
                                    <>
                                      {leaderAudienceAdvantage} OY
                                      <span
                                        className="stationFooterPursuerGapRate"
                                        aria-label={`Distancia relativa ${leaderRelativeAdvantagePrecise.toFixed(
                                          1,
                                        )} por ciento`}
                                      >
                                        ·{" "}
                                        {leaderRelativeAdvantagePrecise.toFixed(
                                          1,
                                        )}
                                        %
                                      </span>{" "}
                                      AL #1
                                    </>
                                  )}

                                  {pursuerPressureLevel ? (
                                    <span
                                      className={[
                                        "stationFooterPursuerPressure",
                                        pursuerPressureLevel,
                                      ].join(" ")}
                                      aria-label={
                                        pursuerPressureLevel === "high"
                                          ? "Presión alta sobre el líder"
                                          : pursuerPressureLevel === "medium"
                                            ? "Presión media sobre el líder"
                                            : "Presión baja sobre el líder"
                                      }
                                      title={
                                        pursuerPressureLevel === "high"
                                          ? "Presión alta sobre el líder"
                                          : pursuerPressureLevel === "medium"
                                            ? "Presión media sobre el líder"
                                            : "Presión baja sobre el líder"
                                      }
                                    >
                                      <i />
                                      <i />
                                      <i />
                                    </span>
                                  ) : null}

                                  {pursuerPressureMomentum ? (
                                    <span
                                      className={[
                                        "stationFooterPursuerPressureTrend",
                                        pursuerPressureMomentum,
                                      ].join(" ")}
                                      aria-label={
                                        pursuerPressureMomentum === "increasing"
                                          ? `La presión del perseguidor aumenta en ${Math.abs(
                                              leaderAdvantageMomentum ?? 0,
                                            )} ${
                                              Math.abs(
                                                leaderAdvantageMomentum ?? 0,
                                              ) === 1
                                                ? "oyente"
                                                : "oyentes"
                                            }`
                                          : pursuerPressureMomentum ===
                                              "decreasing"
                                            ? `La presión del perseguidor disminuye en ${Math.abs(
                                                leaderAdvantageMomentum ?? 0,
                                              )} ${
                                                Math.abs(
                                                  leaderAdvantageMomentum ?? 0,
                                                ) === 1
                                                  ? "oyente"
                                                  : "oyentes"
                                              }`
                                            : "La presión del perseguidor se mantiene"
                                      }
                                      title={
                                        pursuerPressureMomentum === "increasing"
                                          ? `El #2 cerró ${Math.abs(
                                              leaderAdvantageMomentum ?? 0,
                                            )} ${
                                              Math.abs(
                                                leaderAdvantageMomentum ?? 0,
                                              ) === 1
                                                ? "oyente"
                                                : "oyentes"
                                            } de diferencia con el líder`
                                          : pursuerPressureMomentum ===
                                              "decreasing"
                                            ? `El líder amplió ${Math.abs(
                                                leaderAdvantageMomentum ?? 0,
                                              )} ${
                                                Math.abs(
                                                  leaderAdvantageMomentum ?? 0,
                                                ) === 1
                                                  ? "oyente"
                                                  : "oyentes"
                                              } sobre el #2`
                                            : "La distancia entre #1 y #2 se mantiene estable"
                                      }
                                    >
                                      {pursuerPressureMomentum === "increasing"
                                        ? `↑ ${Math.abs(
                                            leaderAdvantageMomentum ?? 0,
                                          )} OY`
                                        : pursuerPressureMomentum ===
                                            "decreasing"
                                          ? `↓ ${Math.abs(
                                              leaderAdvantageMomentum ?? 0,
                                            )} OY`
                                          : "— 0"}
                                    </span>
                                  ) : null}
                                </span>
                              ) : null}

                              {index === 2 &&
                              stationGapToSecond !== null ? (
                                <span
                                  className={[
                                    "stationFooterThirdGap",
                                    stationGapToSecond === 0
                                      ? "tied"
                                      : "chasing",
                                    stationGapToSecond > 0 &&
                                    stationThirdPressureLevel === "high" &&
                                    stationThirdPressureMomentum === "increasing"
                                      ? "pressureAlert"
                                      : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                  title={
                                    stationGapToSecond === 0
                                      ? "La emisora #3 está empatada con la #2"
                                      : `A ${stationGapToSecond} ${
                                          stationGapToSecond === 1
                                            ? "oyente"
                                            : "oyentes"
                                        } de la emisora #2${
                                          stationGapToSecondRate !== null
                                            ? ` · ${stationGapToSecondRate.toFixed(
                                                1,
                                              )}% de distancia relativa`
                                            : ""
                                        }`
                                  }
                                  aria-label={
                                    stationGapToSecond === 0
                                      ? "Empate con la emisora número 2"
                                      : `${stationGapToSecond} ${
                                          stationGapToSecond === 1
                                            ? "oyente"
                                            : "oyentes"
                                        } para alcanzar la posición número 2${
                                          stationGapToSecondRate !== null
                                            ? `, equivalente a ${stationGapToSecondRate.toFixed(
                                                1,
                                              )} por ciento`
                                            : ""
                                        }`
                                  }
                                >
                                  <i aria-hidden="true">△</i>
                                  {stationGapToSecond === 0 ? (
                                    "EMPATE CON #2"
                                  ) : (
                                    <>
                                      {stationGapToSecond} OY

                                      {stationGapToSecondRate !== null ? (
                                        <span
                                          className="stationFooterThirdGapRate"
                                          aria-label={`Distancia relativa ${stationGapToSecondRate.toFixed(
                                            1,
                                          )} por ciento`}
                                        >
                                          ·{" "}
                                          {stationGapToSecondRate.toFixed(
                                            1,
                                          )}
                                          %
                                        </span>
                                      ) : null}

                                      {" "}AL #2
                                    </>
                                  )}

                                  {stationThirdPressureLevel ? (
                                    <span
                                      className={[
                                        "stationFooterThirdPressure",
                                        stationThirdPressureLevel,
                                      ].join(" ")}
                                      aria-label={
                                        stationThirdPressureLevel === "high"
                                          ? "Presión alta sobre la posición número 2"
                                          : stationThirdPressureLevel ===
                                              "medium"
                                            ? "Presión media sobre la posición número 2"
                                            : "Presión baja sobre la posición número 2"
                                      }
                                      title={
                                        stationThirdPressureLevel === "high"
                                          ? "El #3 está muy cerca de alcanzar al #2"
                                          : stationThirdPressureLevel ===
                                              "medium"
                                            ? "El #3 mantiene presión sobre el #2"
                                            : "El #3 todavía tiene distancia con el #2"
                                      }
                                    >
                                      <i />
                                      <i />
                                      <i />
                                    </span>
                                  ) : null}

                                  {stationThirdPressureMomentum ? (
                                    <span
                                      className={[
                                        "stationFooterThirdPressureTrend",
                                        stationThirdPressureMomentum,
                                      ].join(" ")}
                                      aria-label={
                                        stationThirdPressureMomentum ===
                                        "increasing"
                                          ? `La presión del tercer lugar aumenta en ${Math.abs(
                                              stationThirdPressureDelta ?? 0,
                                            )} ${
                                              Math.abs(
                                                stationThirdPressureDelta ?? 0,
                                              ) === 1
                                                ? "oyente"
                                                : "oyentes"
                                            }`
                                          : stationThirdPressureMomentum ===
                                              "decreasing"
                                            ? `La presión del tercer lugar disminuye en ${Math.abs(
                                                stationThirdPressureDelta ?? 0,
                                              )} ${
                                                Math.abs(
                                                  stationThirdPressureDelta ?? 0,
                                                ) === 1
                                                  ? "oyente"
                                                  : "oyentes"
                                              }`
                                            : "La diferencia entre el tercer y segundo lugar se mantiene"
                                      }
                                      title={
                                        stationThirdPressureMomentum ===
                                        "increasing"
                                          ? `El #3 recortó ${Math.abs(
                                              stationThirdPressureDelta ?? 0,
                                            )} ${
                                              Math.abs(
                                                stationThirdPressureDelta ?? 0,
                                              ) === 1
                                                ? "oyente"
                                                : "oyentes"
                                            } al #2`
                                          : stationThirdPressureMomentum ===
                                              "decreasing"
                                            ? `El #2 amplió ${Math.abs(
                                                stationThirdPressureDelta ?? 0,
                                              )} ${
                                                Math.abs(
                                                  stationThirdPressureDelta ?? 0,
                                                ) === 1
                                                  ? "oyente"
                                                  : "oyentes"
                                              } sobre el #3`
                                            : "La distancia entre #2 y #3 no cambió"
                                      }
                                    >
                                      {stationThirdPressureMomentum ===
                                      "increasing"
                                        ? `↑ ${Math.abs(
                                            stationThirdPressureDelta ?? 0,
                                          )} OY`
                                        : stationThirdPressureMomentum ===
                                            "decreasing"
                                          ? `↓ ${Math.abs(
                                              stationThirdPressureDelta ?? 0,
                                            )} OY`
                                          : "— 0"}
                                    </span>
                                  ) : null}
                                </span>
                              ) : null}

                              {index === 3 &&
                              stationGapToTop3 !== null ? (
                                <span
                                  className={[
                                    "stationFooterTop3ChaserGap",
                                    stationGapToTop3 === 0
                                      ? "atDoor"
                                      : "chasing",
                                  ].join(" ")}
                                  title={
                                    stationGapToTop3 === 0
                                      ? "La emisora #4 está igualada con la #3 y toca la puerta del TOP 3"
                                      : `A ${stationGapToTop3} ${
                                          stationGapToTop3 === 1
                                            ? "oyente"
                                            : "oyentes"
                                        } de entrar al TOP 3${
                                          stationGapToTop3Rate !== null
                                            ? ` · ${stationGapToTop3Rate.toFixed(
                                                1,
                                              )}% de distancia`
                                            : ""
                                        }`
                                  }
                                  aria-label={
                                    stationGapToTop3 === 0
                                      ? "A las puertas del top 3"
                                      : `${stationGapToTop3} ${
                                          stationGapToTop3 === 1
                                            ? "oyente"
                                            : "oyentes"
                                        } para entrar al top 3`
                                  }
                                >
                                  <i aria-hidden="true">◇</i>

                                  {stationGapToTop3 === 0 ? (
                                    "A LAS PUERTAS"
                                  ) : (
                                    <>
                                      {stationGapToTop3} OY

                                      {stationGapToTop3Rate !== null ? (
                                        <span className="stationFooterTop3ChaserGapRate">
                                          ·{" "}
                                          {stationGapToTop3Rate.toFixed(
                                            1,
                                          )}
                                          %
                                        </span>
                                      ) : null}

                                      {" "}AL TOP 3
                                    </>
                                  )}
                                </span>
                              ) : null}
                            </strong>

                            {rankingMovementReady ? (
                              <span
                                className={[
                                  "stationFooterRankMovement",
                                  stationRankingMovement > 0
                                    ? "up"
                                    : stationRankingMovement < 0
                                      ? "down"
                                      : "steady",
                                  stationBecameLeader
                                    ? "leaderTakeover"
                                    : stationLostLeadership
                                      ? "leaderLost"
                                      : stationEnteredTop3
                                        ? "top3Entry"
                                        : stationExitedTop3
                                          ? "top3Exit"
                                          : "",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                                title={
                                  stationRankingMovement > 0
                                    ? `Subió de #${stationPreviousRankingPosition} a #${stationCurrentRankingPosition}`
                                    : stationRankingMovement < 0
                                      ? `Bajó de #${stationPreviousRankingPosition} a #${stationCurrentRankingPosition}`
                                      : `Mantiene la posición #${stationCurrentRankingPosition}`
                                }
                              >
                                <span aria-hidden="true">
                                  {stationRankingMovement > 0
                                    ? "↑"
                                    : stationRankingMovement < 0
                                      ? "↓"
                                      : "—"}
                                </span>

                                <span className="stationFooterRankTransition">
                                  {stationRankingMovement !== 0
                                    ? `#${stationPreviousRankingPosition}→#${stationCurrentRankingPosition}`
                                    : `#${stationCurrentRankingPosition}`}
                                </span>
                              </span>
                            ) : null}

                            <span aria-hidden="true"> · </span>

                            <span>
                              {filtersAreActive
                                ? `${stationAudienceShare}% ENTRE VISIBLES`
                                : `${stationNetworkAudienceShare}% DE LA RED`}
                            </span>
                          </>
                        ) : filtersAreActive ? (
                          `${stationAudienceShare}% ENTRE VISIBLES ↗`
                        ) : (
                          `${stationNetworkAudienceShare}% DE LA RED ↗`
                        )}
                      </em>

                      {filtersAreActive ? (
                        <b className="stationFooterAverageContext">
                          {stationNetworkAudienceShare}% DE LA RED
                        </b>
                      ) : null}

                      <small
                        className={
                          stationAudienceVsAverage > 0
                            ? "aboveAverage"
                            : stationAudienceVsAverage < 0
                              ? "belowAverage"
                              : "atAverage"
                        }
                        title={
                          stationAudienceVsAverage > 0
                            ? `${stationAudienceVsAverage.toFixed(
                                1,
                              )} puntos porcentuales sobre el promedio ${
                                filtersAreActive
                                  ? "de las emisoras visibles"
                                  : "de la red"
                              }`
                            : stationAudienceVsAverage < 0
                              ? `${Math.abs(
                                  stationAudienceVsAverage,
                                ).toFixed(
                                  1,
                                )} puntos porcentuales bajo el promedio ${
                                  filtersAreActive
                                    ? "de las emisoras visibles"
                                    : "de la red"
                                }`
                              : filtersAreActive
                                ? "En el promedio de audiencia de las emisoras visibles"
                                : "En el promedio de audiencia de la red"
                        }
                      >
                        {stationAudienceVsAverage > 0
                          ? `+${stationAudienceVsAverage.toFixed(
                              1,
                            )} PP VS PROM.`
                          : stationAudienceVsAverage < 0
                            ? `−${Math.abs(
                                stationAudienceVsAverage,
                              ).toFixed(
                                1,
                              )} PP VS PROM.`
                            : "0.0 PP VS PROM."}
                      </small>

                      <small
                        className={[
                          "listenersVsAverage",
                          stationListenersVsAverage > 0
                            ? "aboveAverage"
                            : stationListenersVsAverage < 0
                              ? "belowAverage"
                              : "atAverage",
                        ].join(" ")}
                        title={
                          stationListenersVsAverage > 0
                            ? `${stationListenersVsAverage} oyentes sobre el promedio ${
                                filtersAreActive
                                  ? "de las emisoras visibles"
                                  : "de la red"
                              }`
                            : stationListenersVsAverage < 0
                              ? `${Math.abs(
                                  stationListenersVsAverage,
                                )} oyentes bajo el promedio ${
                                  filtersAreActive
                                    ? "de las emisoras visibles"
                                    : "de la red"
                                }`
                              : filtersAreActive
                                ? "En el promedio exacto de oyentes de las emisoras visibles"
                                : "En el promedio exacto de oyentes de la red"
                        }
                      >
                        {stationListenersVsAverage > 0
                          ? `+${stationListenersVsAverage} OYENTES VS PROM.`
                          : stationListenersVsAverage < 0
                            ? `−${Math.abs(
                                stationListenersVsAverage,
                              )} OYENTES VS PROM.`
                            : "0 OYENTES VS PROM."}
                      </small>

                      <span
                        className="stationFooterAudienceTrack"
                        aria-hidden="true"
                      >
                        <i
                          className={[
                            "stationFooterAudienceFill",
                            (filtersAreActive
                              ? stationAudienceShare
                              : stationNetworkAudienceShare) >
                            contextualAverageAudienceShare
                              ? "aboveAverage"
                              : (filtersAreActive
                                ? stationAudienceShare
                                : stationNetworkAudienceShare) <
                                  contextualAverageAudienceShare
                                ? "belowAverage"
                                : "atAverage",
                          ].join(" ")}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                filtersAreActive
                                  ? stationAudienceShare
                                  : stationNetworkAudienceShare,
                              ),
                            )}%`,
                          }}
                        />

                        <b
                          className="stationFooterAudienceAverage"
                          style={{
                            left: `${Math.min(
                              100,
                              Math.max(
                                0,
                                contextualAverageAudienceShare,
                              ),
                            )}%`,
                          }}
                        />
                      </span>
                    </button>
                  ) : null}
                </span>

                <button
                  type="button"
                  className="stationCardPlay"
                  onClick={() => playStation(station)}
                  aria-label={
                    active && playing
                      ? `Pausar ${station.name}`
                      : `Escuchar ${station.name}`
                  }
                  aria-pressed={active && playing}
                >
                  {active && playing ? "❚❚ PAUSAR" : "▶ ESCUCHAR"}
                </button>
              </div>

              <div className="stationLiveStrip">
                <button
                  type="button"
                  className="stationGenreQuickFilter"
                  onClick={() => showGenreAcrossNetwork(station.genre)}
                  aria-label={`Ver emisoras de ${station.genre}`}
                  title={`Ver toda la red de ${station.genre}`}
                >
                  <span aria-hidden="true">#</span>
                  {highlightSearchText(station.genre, stationQuery)}
                </button>

                <span className="stationLiveListeners">
                  <span aria-hidden="true">●</span>
                  {info.listeners ?? "—"} OYENTES
                </span>

                {active && playing ? (
                  <span
                    className="stationLiveSignal"
                    aria-label="Emisora reproduciéndose"
                  >
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <span className="stationLiveStatus">
                    {info.configured ? "EN LÍNEA" : "DISPONIBLE"}
                  </span>
                )}
              </div>

              <Link
                className="stationPageLink"
                href={`/emisoras/${station.id}`}
                aria-label={`Abrir página de ${station.name}`}
              >
                <span>ENTRAR A LA EMISORA</span>
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          );
        })}
      </div>



      <button
        type="button"
        className={
          networkDetailsExpanded
            ? "stationNetworkDetailsToggle expanded"
            : "stationNetworkDetailsToggle"
        }
        onClick={() => setNetworkDetailsExpanded((current) => !current)}
        aria-expanded={networkDetailsExpanded}
        aria-controls="station-network-details"
      >
        <span aria-hidden="true">{networkDetailsExpanded ? "−" : "+"}</span>
        <strong>
          {networkDetailsExpanded
            ? "OCULTAR DETALLES DE LA RED"
            : "VER MÁS DE LA RED"}
        </strong>
      </button>

      {networkDetailsExpanded ? (
        <>
      <div className="networkNowStrip">
        <div className="networkNowStripHeader">
          <span>
            <i aria-hidden="true" />
            AHORA EN LA RED
          </span>

          <div className="networkNowStripMeta">
            <small>TOCA UNA EMISORA PARA ESCUCHAR</small>
            <b>
              <span aria-hidden="true">◎</span>
              SIGUIENDO EMISORA ACTIVA
            </b>

            <span
              className="networkNowActiveStationBadge"
              title={`${selected.shortName || selected.name}: posición #${selectedNetworkAudiencePosition}, ${selectedNetworkAudienceShare}% de la audiencia total`}
              aria-label={`${selected.shortName || selected.name}, posición ${selectedNetworkAudiencePosition}, ${selectedNetworkAudienceShare}% de la audiencia total`}
            >
              <i aria-hidden="true">▶</i>
              <strong>{selected.shortName || selected.name}</strong>
              <em>#{selectedNetworkAudiencePosition}</em>
              <small>{selectedNetworkAudienceShare}% DE LA RED</small>
            </span>

            <span
              className="networkNowTotalAudience"
              title={`${networkListeners} ${
                networkListeners === 1 ? "oyente" : "oyentes"
              } conectados en toda la red`}
              aria-label={`${networkListeners} ${
                networkListeners === 1 ? "oyente" : "oyentes"
              } conectados en toda la red`}
            >
              <i aria-hidden="true">●</i>

              <span>
                <small>TOTAL DE LA RED</small>
                <b>{networkListeners}</b>
                <em>{networkListeners === 1 ? "OYENTE" : "OYENTES"}</em>
              </span>
            </span>

            <button
              type="button"
              className={
                networkNowSummaryCollapsed
                  ? "networkNowSummaryToggle collapsed"
                  : "networkNowSummaryToggle"
              }
              onClick={() =>
                setNetworkNowSummaryCollapsed((current) => !current)
              }
              aria-expanded={!networkNowSummaryCollapsed}
              title={
                networkNowSummaryCollapsed
                  ? "Mostrar resumen completo de la red"
                  : "Minimizar resumen de la red"
              }
            >
              <span aria-hidden="true">
                {networkNowSummaryCollapsed ? "+" : "−"}
              </span>
              {networkNowSummaryCollapsed
                ? "MOSTRAR RESUMEN"
                : "MINIMIZAR RESUMEN"}
            </button>

            {networkNowSummaryCollapsed &&
            networkAudienceLeader &&
            networkAudienceChallenger ? (
              <button
                type="button"
                className="networkNowCollapsedDuel"
                onClick={() => setNetworkNowSummaryCollapsed(false)}
                title={`${networkAudienceLeader.shortName || networkAudienceLeader.name} lidera sobre ${networkAudienceChallenger.shortName || networkAudienceChallenger.name} por ${networkAudienceChallengerGap} ${
                  networkAudienceChallengerGap === 1
                    ? "oyente"
                    : "oyentes"
                }. Abrir resumen completo.`}
                aria-label={`Abrir resumen completo. ${networkAudienceLeader.shortName || networkAudienceLeader.name} va número uno y ${networkAudienceChallenger.shortName || networkAudienceChallenger.name} va número dos.`}
              >
                <span className="networkNowCollapsedDuelStation leader">
                  <i aria-hidden="true">★</i>
                  <b>#1</b>
                  <strong>
                    {networkAudienceLeader.shortName ||
                      networkAudienceLeader.name}
                  </strong>

                  {networkAudienceLeaderChange !== null ? (
                    <em
                      className={
                        networkAudienceLeaderChange > 0
                          ? "networkNowCollapsedDuelChange positive"
                          : networkAudienceLeaderChange < 0
                            ? "networkNowCollapsedDuelChange negative"
                            : "networkNowCollapsedDuelChange neutral"
                      }
                    >
                      {networkAudienceLeaderChange > 0
                        ? `↑ +${networkAudienceLeaderChange}`
                        : networkAudienceLeaderChange < 0
                          ? `↓ ${Math.abs(networkAudienceLeaderChange)}`
                          : "— 0"}
                    </em>
                  ) : null}
                </span>

                <span className="networkNowCollapsedDuelVs">VS</span>

                <span className="networkNowCollapsedDuelStation challenger">
                  <b>#2</b>
                  <strong>
                    {networkAudienceChallenger.shortName ||
                      networkAudienceChallenger.name}
                  </strong>

                  {networkAudienceChallengerChange !== null ? (
                    <em
                      className={
                        networkAudienceChallengerChange > 0
                          ? "networkNowCollapsedDuelChange positive"
                          : networkAudienceChallengerChange < 0
                            ? "networkNowCollapsedDuelChange negative"
                            : "networkNowCollapsedDuelChange neutral"
                      }
                    >
                      {networkAudienceChallengerChange > 0
                        ? `↑ +${networkAudienceChallengerChange}`
                        : networkAudienceChallengerChange < 0
                          ? `↓ ${Math.abs(networkAudienceChallengerChange)}`
                          : "— 0"}
                    </em>
                  ) : null}
                </span>

                <span
                  className={
                    networkAudienceChallengerGap === 0
                      ? "networkNowCollapsedDuelGap tied"
                      : "networkNowCollapsedDuelGap"
                  }
                >
                  {networkAudienceChallengerGap === 0
                    ? "EMPATE"
                    : `+${networkAudienceChallengerGap} ${
                        networkAudienceChallengerGap === 1
                          ? "OYENTE"
                          : "OYENTES"
                      }`}
                </span>
                <span
                  className="networkNowCollapsedDuelOpen"
                  aria-hidden="true"
                >
                  ABRIR ↗
                </span>
              </button>
            ) : null}

            <div
              className={
                networkNowSummaryCollapsed
                  ? "networkNowSummaryGroup collapsed"
                  : "networkNowSummaryGroup"
              }
            >
              {networkAudienceLeader ? (
              <span
                className="networkNowCurrentLeader"
                title={`${networkAudienceLeader.shortName || networkAudienceLeader.name} lidera la red con ${networkAudienceLeaderListeners} ${
                  networkAudienceLeaderListeners === 1
                    ? "oyente"
                    : "oyentes"
                } y ${networkAudienceLeaderShare}% de la audiencia total`}
                aria-label={`${networkAudienceLeader.shortName || networkAudienceLeader.name}, líder actual, ${networkAudienceLeaderListeners} ${
                  networkAudienceLeaderListeners === 1
                    ? "oyente"
                    : "oyentes"
                }, ${networkAudienceLeaderShare}% de la red`}
              >
                <i aria-hidden="true">★</i>

                <span>
                  <small>LÍDER ACTUAL</small>
                  <strong>
                    {networkAudienceLeader.shortName ||
                      networkAudienceLeader.name}
                  </strong>
                </span>

                <b>{networkAudienceLeaderListeners}</b>
                <em>
                  {networkAudienceLeaderListeners === 1
                    ? "OYENTE"
                    : "OYENTES"}
                </em>

                <span className="networkNowCurrentLeaderShare">
                  {networkAudienceLeaderShare}% DE LA RED
                </span>
              </span>
            ) : null}

            {networkAudienceChallenger ? (
              <span
                className="networkNowCurrentChallenger"
                title={`${networkAudienceChallenger.shortName || networkAudienceChallenger.name} ocupa el #2 con ${networkAudienceChallengerListeners} ${
                  networkAudienceChallengerListeners === 1
                    ? "oyente"
                    : "oyentes"
                }, a ${networkAudienceChallengerGap} ${
                  networkAudienceChallengerGap === 1
                    ? "oyente"
                    : "oyentes"
                } del líder`}
                aria-label={`${networkAudienceChallenger.shortName || networkAudienceChallenger.name}, perseguidor número 2, ${networkAudienceChallengerListeners} ${
                  networkAudienceChallengerListeners === 1
                    ? "oyente"
                    : "oyentes"
                }, a ${networkAudienceChallengerGap} ${
                  networkAudienceChallengerGap === 1
                    ? "oyente"
                    : "oyentes"
                } del líder`}
              >
                <i aria-hidden="true">#2</i>

                <span>
                  <small>PERSEGUIDOR</small>
                  <strong>
                    {networkAudienceChallenger.shortName ||
                      networkAudienceChallenger.name}
                  </strong>
                </span>

                <b>{networkAudienceChallengerListeners}</b>
                <em>
                  {networkAudienceChallengerListeners === 1
                    ? "OYENTE"
                    : "OYENTES"}
                </em>

                <span className="networkNowCurrentChallengerGap">
                  {networkAudienceChallengerGap === 0
                    ? "EMPATADO"
                    : `A ${networkAudienceChallengerGap} DEL #1`}
                </span>
              </span>
            ) : null}

            {networkAudienceBalance ? (
              <span
                className="networkNowAudienceBalance"
                title={`${networkAudienceBalance.rising} subiendo, ${networkAudienceBalance.falling} bajando y ${networkAudienceBalance.stable} estables`}
                aria-label={`${networkAudienceBalance.rising} emisoras subiendo, ${networkAudienceBalance.falling} bajando y ${networkAudienceBalance.stable} estables`}
              >
                <small>BALANCE DE AUDIENCIA</small>

                <span className="networkNowAudienceBalanceItem rising">
                  <i aria-hidden="true">↑</i>
                  <b>{networkAudienceBalance.rising}</b>
                  <em>SUBEN</em>
                </span>

                <span className="networkNowAudienceBalanceItem falling">
                  <i aria-hidden="true">↓</i>
                  <b>{networkAudienceBalance.falling}</b>
                  <em>BAJAN</em>
                </span>

                <span className="networkNowAudienceBalanceItem stable">
                  <i aria-hidden="true">—</i>
                  <b>{networkAudienceBalance.stable}</b>
                  <em>ESTABLES</em>
                </span>
              </span>
            ) : null}

            {networkAudienceNetChange !== null ? (
              <span
                className={[
                  "networkNowNetAudience",
                  networkAudienceNetChange > 0
                    ? "positive"
                    : networkAudienceNetChange < 0
                      ? "negative"
                      : "neutral",
                ].join(" ")}
                title={
                  networkAudienceNetChange > 0
                    ? `La red ganó ${networkAudienceNetChange} ${
                        networkAudienceNetChange === 1
                          ? "oyente"
                          : "oyentes"
                      } en total`
                    : networkAudienceNetChange < 0
                      ? `La red perdió ${Math.abs(
                          networkAudienceNetChange,
                        )} ${
                          Math.abs(networkAudienceNetChange) === 1
                            ? "oyente"
                            : "oyentes"
                        } en total`
                      : "La audiencia total de la red no tuvo cambio neto"
                }
              >
                <small>IMPULSO NETO</small>

                <i aria-hidden="true">
                  {networkAudienceNetChange > 0
                    ? "↑"
                    : networkAudienceNetChange < 0
                      ? "↓"
                      : "—"}
                </i>

                <b>
                  {networkAudienceNetChange > 0
                    ? `+${networkAudienceNetChange}`
                    : networkAudienceNetChange < 0
                      ? `-${Math.abs(networkAudienceNetChange)}`
                      : "0"}
                </b>

                <em>
                  {Math.abs(networkAudienceNetChange) === 1
                    ? "OYENTE"
                    : "OYENTES"}
                </em>
              </span>
            ) : null}

            <span
              className={
                rankingUpdatedAt
                  ? "networkNowUpdatedBadge ready"
                  : "networkNowUpdatedBadge waiting"
              }
              title={
                rankingUpdatedAt
                  ? `Datos actualizados a las ${rankingUpdatedAt}`
                  : "Esperando la primera actualización de audiencia"
              }
            >
              <i aria-hidden="true">◷</i>
              {rankingUpdatedAt
                ? `ACTUALIZADO ${rankingUpdatedAt}`
                : "ESPERANDO DATOS"}
            </span>

            </div>

            <div
              className="networkNowNavigation"
              aria-label="Mover la franja Ahora en la Red"
            >
              <button
                type="button"
                onClick={() => scrollNetworkNow("left")}
                aria-label="Mover emisoras a la izquierda"
                title="Mover a la izquierda"
              >
                <span aria-hidden="true">‹</span>
              </button>

              <button
                type="button"
                onClick={() => scrollNetworkNow("right")}
                aria-label="Mover emisoras a la derecha"
                title="Mover a la derecha"
              >
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
        </div>

        <div
          id="network-now-scroller"
          className="networkNowScroller"
        >
          {stations.map((station) => {
            const info =
              metadata[station.id] ?? emptyNowPlaying(station);

            const active = station.id === selected.id;
            const audienceLeader =
              networkAudienceLeader?.id === station.id &&
              typeof info.listeners === "number";

            const networkAudienceShare =
              networkListeners > 0 &&
              typeof info.listeners === "number"
                ? Math.round(
                    (info.listeners / networkListeners) * 100,
                  )
                : 0;

            const networkAudiencePosition =
              networkAudienceRanking.findIndex(
                (rankedStation) => rankedStation.id === station.id,
              ) + 1;

            const networkAudienceMovement =
              rankingMovements[station.id] ?? null;

            const networkAudienceListenerChange =
              rankingMovementReady
                ? rankingListenerChanges[station.id] ?? 0
                : null;

            const networkAudienceGapToLeader =
              typeof info.listeners === "number"
                ? Math.max(
                    0,
                    networkAudienceLeaderListeners - info.listeners,
                  )
                : null;

            return (
              <button
                key={station.id}
                id={`network-now-${station.id}`}
                type="button"
                className={[
                  "networkNowItem",
                  active ? "active" : "",
                  audienceLeader ? "audienceLeader" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={
                  {
                    "--ticker-accent": station.accent,
                  } as CSSProperties
                }
                onClick={() => playStation(station)}
                aria-label={
                  active && playing
                    ? `Pausar ${station.name}`
                    : `Escuchar ${station.name}`
                }
                aria-pressed={active && playing}
              >
                <span className="networkNowLogoWrap">
                  <img
                    src={station.logo}
                    alt=""
                    width={34}
                    height={34}
                  />

                  {active && playing ? (
                    <span
                      className="networkNowLogoEqualizer"
                      aria-hidden="true"
                    >
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : null}
                </span>

                <span className="networkNowItemCopy">
                  <span className="networkNowItemTitleRow">
                    <span
                      className={[
                        "networkNowRankBadge",
                        networkAudiencePosition <= 3
                          ? `top${networkAudiencePosition}`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      title={`Posición #${networkAudiencePosition} por audiencia`}
                      aria-label={`Posición ${networkAudiencePosition} por audiencia`}
                    >
                      #{networkAudiencePosition}
                    </span>

                    {networkAudienceMovement !== null ? (
                      <span
                        className={[
                          "networkNowMovementBadge",
                          networkAudienceMovement > 0
                            ? "up"
                            : networkAudienceMovement < 0
                              ? "down"
                              : "steady",
                        ].join(" ")}
                        title={
                          networkAudienceMovement > 0
                            ? `Sube ${networkAudienceMovement} ${
                                networkAudienceMovement === 1
                                  ? "posición"
                                  : "posiciones"
                              }`
                            : networkAudienceMovement < 0
                              ? `Baja ${Math.abs(networkAudienceMovement)} ${
                                  Math.abs(networkAudienceMovement) === 1
                                    ? "posición"
                                    : "posiciones"
                                }`
                              : `Mantiene la posición #${networkAudiencePosition}`
                        }
                      >
                        <i aria-hidden="true">
                          {networkAudienceMovement > 0
                            ? "↑"
                            : networkAudienceMovement < 0
                              ? "↓"
                              : "—"}
                        </i>

                        {networkAudienceMovement > 0
                          ? `SUBE ${networkAudienceMovement}`
                          : networkAudienceMovement < 0
                            ? `BAJA ${Math.abs(networkAudienceMovement)}`
                            : "MANTIENE"}
                      </span>
                    ) : null}

                    <strong>
                      {highlightSearchText(
                        station.shortName || station.name,
                        stationQuery,
                      )}
                    </strong>
                  </span>

                  <span className="networkNowStatusRow">
                    <span
                      className="networkNowGenreBadge"
                      title={`Género: ${station.genre}`}
                    >
                      {highlightSearchText(
                        station.genre || "Música",
                        stationQuery,
                      )}
                    </span>

                    <span
                      className={
                        info.configured
                          ? "networkNowSignalBadge online"
                          : "networkNowSignalBadge offline"
                      }
                      title={
                        info.configured
                          ? `${station.shortName || station.name} está al aire`
                          : `${station.shortName || station.name} no tiene señal disponible`
                      }
                      aria-label={
                        info.configured
                          ? `${station.shortName || station.name} está al aire`
                          : `${station.shortName || station.name} no tiene señal disponible`
                      }
                    >
                      <i aria-hidden="true">
                        {info.configured ? "●" : "○"}
                      </i>
                      {info.configured ? "AL AIRE" : "SIN SEÑAL"}
                    </span>

                    {active ? (
                      <span
                        className={
                          playing
                            ? "networkNowPlaybackBadge playing"
                            : "networkNowPlaybackBadge paused"
                        }
                        title={
                          playing
                            ? `${station.shortName || station.name} está en reproducción`
                            : `${station.shortName || station.name} está seleccionada con la reproducción pausada`
                        }
                        aria-label={
                          playing
                            ? `${station.shortName || station.name} está en reproducción`
                            : `${station.shortName || station.name} está pausada`
                        }
                      >
                        <i aria-hidden="true">
                          {playing ? "▶" : "Ⅱ"}
                        </i>
                        {playing ? "EN REPRODUCCIÓN" : "PAUSADA"}
                      </span>
                    ) : null}

                    {favoriteStations.includes(station.id) ? (
                      <span
                        className="networkNowFavoriteBadge"
                        title={`${station.shortName || station.name} está en tus favoritas`}
                        aria-label={`${station.shortName || station.name} está en tus favoritas`}
                      >
                        <i aria-hidden="true">♥</i>
                        FAVORITA
                      </span>
                    ) : null}

                    {recentStations.includes(station.id) ? (
                      <span
                        className="networkNowRecentBadge"
                        title={`${station.shortName || station.name} fue escuchada recientemente`}
                        aria-label={`${station.shortName || station.name} fue escuchada recientemente`}
                      >
                        <i aria-hidden="true">◷</i>
                        RECIENTE
                      </span>
                    ) : null}

                    {audienceLeader ? (
                      <span
                        className="networkNowLeaderBadge"
                        title="Emisora más escuchada de la red en este momento"
                      >
                        <i aria-hidden="true">★</i>
                        MÁS ESCUCHADA
                      </span>
                    ) : null}
                  </span>

                  <span className="networkNowItemMeta">
                    <span className="networkNowTrack">
                      <small
                        title={
                          info.artist
                            ? `${info.title} — ${info.artist}`
                            : info.title
                        }
                      >
                        {highlightSearchText(
                          info.title || "Programación en vivo",
                          stationQuery,
                        )}
                      </small>

                      <em
                        title={
                          info.artist || "GRUPO FIERAMIX.COM"
                        }
                      >
                        {highlightSearchText(
                          info.artist || "GRUPO FIERAMIX.COM",
                          stationQuery,
                        )}
                      </em>
                    </span>

                    <span className="networkNowAudienceMeta">
                      <span
                        className="networkNowItemListeners"
                        aria-label={`${info.listeners ?? "—"} oyentes en vivo`}
                        title={`${info.listeners ?? "—"} oyentes en vivo`}
                      >
                        <i aria-hidden="true">●</i>
                        <b>{info.listeners ?? "—"}</b>
                        <em>OY</em>
                      </span>

                      {networkAudienceListenerChange !== null ? (
                        <span
                          className={[
                            "networkNowListenerChange",
                            networkAudienceListenerChange > 0
                              ? "positive"
                              : networkAudienceListenerChange < 0
                                ? "negative"
                                : "neutral",
                          ].join(" ")}
                          title={
                            networkAudienceListenerChange > 0
                              ? `Ganó ${networkAudienceListenerChange} ${
                                  networkAudienceListenerChange === 1
                                    ? "oyente"
                                    : "oyentes"
                                }`
                              : networkAudienceListenerChange < 0
                                ? `Perdió ${Math.abs(
                                    networkAudienceListenerChange,
                                  )} ${
                                    Math.abs(
                                      networkAudienceListenerChange,
                                    ) === 1
                                      ? "oyente"
                                      : "oyentes"
                                  }`
                                : "Sin cambio de oyentes"
                          }
                          aria-label={
                            networkAudienceListenerChange > 0
                              ? `Ganó ${networkAudienceListenerChange} oyentes`
                              : networkAudienceListenerChange < 0
                                ? `Perdió ${Math.abs(
                                    networkAudienceListenerChange,
                                  )} oyentes`
                                : "Sin cambio de oyentes"
                          }
                        >
                          <i aria-hidden="true">
                            {networkAudienceListenerChange > 0
                              ? "↑"
                              : networkAudienceListenerChange < 0
                                ? "↓"
                                : "—"}
                          </i>

                          <b>
                            {networkAudienceListenerChange > 0
                              ? `+${networkAudienceListenerChange}`
                              : networkAudienceListenerChange < 0
                                ? Math.abs(
                                    networkAudienceListenerChange,
                                  )
                                : "0"}
                          </b>

                          <em>OY</em>
                        </span>
                      ) : null}
                    </span>
                  </span>

                  <span
                    className="networkNowAudienceShare"
                    aria-label={`${networkAudienceShare}% de la audiencia total de la red`}
                    title={`${networkAudienceShare}% de la audiencia total de la red`}
                  >
                    <span className="networkNowAudienceShareTrack">
                      <span
                        className="networkNowAudienceShareFill"
                        style={{
                          width: `${networkAudienceShare}%`,
                        }}
                      />
                    </span>

                    <span className="networkNowAudienceShareLabel">
                      <b>{networkAudienceShare}%</b>
                      <em>DE LA RED</em>
                    </span>
                  </span>

                  <span className="networkNowInsightRow">
                    {networkAudienceGapToLeader !== null ? (
                      <span
                        className={
                          audienceLeader
                            ? "networkNowGapToLeader leader"
                            : "networkNowGapToLeader chasing"
                        }
                        title={
                          audienceLeader
                            ? "Esta emisora lidera la audiencia de la red"
                            : `${networkAudienceGapToLeader} ${
                                networkAudienceGapToLeader === 1
                                  ? "oyente"
                                  : "oyentes"
                              } detrás del #1`
                        }
                      >
                        <i aria-hidden="true">
                          {audienceLeader ? "★" : "↗"}
                        </i>

                        {audienceLeader
                          ? "LÍDER DE LA RED"
                          : `A ${networkAudienceGapToLeader} ${
                              networkAudienceGapToLeader === 1
                                ? "OYENTE"
                                : "OYENTES"
                            } DEL #1`}
                      </span>
                    ) : null}

                    {networkAudienceListenerChange !== null ? (
                      <span
                        className={[
                          "networkNowTrendBadge",
                          networkAudienceListenerChange > 0
                            ? "rising"
                            : networkAudienceListenerChange < 0
                              ? "falling"
                              : "stable",
                        ].join(" ")}
                        title={
                          networkAudienceListenerChange > 0
                            ? "La audiencia de esta emisora está subiendo"
                            : networkAudienceListenerChange < 0
                              ? "La audiencia de esta emisora está bajando"
                              : "La audiencia de esta emisora se mantiene estable"
                        }
                      >
                        <span className="networkNowTrendBars" aria-hidden="true">
                          <i />
                          <i />
                          <i />
                        </span>

                        <small>TENDENCIA</small>
                        <b>
                          {networkAudienceListenerChange > 0
                            ? "SUBIENDO"
                            : networkAudienceListenerChange < 0
                              ? "BAJANDO"
                              : "ESTABLE"}
                        </b>
                      </span>
                    ) : null}
                  </span>
                </span>

                <span
                  className={
                    active && playing
                      ? "networkNowItemAction playing"
                      : "networkNowItemAction"
                  }
                  aria-hidden="true"
                >
                  {active && playing ? "❚❚" : "▶"}
                </span>
              </button>
            );
          })}
        </div>
      </div>


      <div id="station-network-details" className="stationMetricsHeader">
        <span>
          <i aria-hidden="true">◉</i>
          <b>PULSO GENERAL DE LA RED</b>

          <em
            className={[
              "stationMetricsNetworkStatus",
              networkOperationalCoverage >= 90
                ? "optimal"
                : networkOperationalCoverage >= 60
                  ? "partial"
                  : "critical",
            ].join(" ")}
            title={`Cobertura operativa: ${networkOperationalCoverage}% · ${stationsOnline} de ${stations.length} emisoras al aire`}
          >
            <i aria-hidden="true">●</i>
            RED {networkOperationalStatus}
            <b aria-hidden="true">·</b>
            <strong>{networkOperationalCoverage}%</strong>
          </em>

          <em
            className="stationMetricsUpdatedAt"
            title="Datos dinámicos de la red y hora de la última actualización"
          >
            <span
              className="stationMetricsLivePulse"
              aria-hidden="true"
            >
              <i />
            </span>

            <b>DATOS EN VIVO</b>

            <span aria-hidden="true">·</span>

            <strong>
              {rankingUpdatedAt ?? "--:--:--"}
            </strong>
          </em>

          <button
            type="button"
            className={
              filtersAreActive
                ? "stationMetricsFilterStatus active"
                : "stationMetricsFilterStatus"
            }
            onClick={resetStationFilters}
            aria-label={
              filtersAreActive
                ? `${activeFilterCount} ${
                    activeFilterCount === 1
                      ? "filtro activo"
                      : "filtros activos"
                  }, ${visibleStations.length} ${
                    visibleStations.length === 1
                      ? "emisora visible"
                      : "emisoras visibles"
                  }, ${visibleStationsListeners} ${
                    visibleStationsListeners === 1
                      ? "oyente"
                      : "oyentes"
                  }, ${visibleAudienceShare}% de la audiencia total de la red. Limpiar filtros`
                : "No hay filtros activos"
            }
            title={
              filtersAreActive
                ? "Limpiar todos los filtros"
                : "La red se está mostrando sin filtros"
            }
          >
            <i aria-hidden="true">
              {filtersAreActive ? "◆" : "◇"}
            </i>

            <b>
              {filtersAreActive
                ? `${activeFilterCount} ${
                    activeFilterCount === 1
                      ? "FILTRO"
                      : "FILTROS"
                  }`
                : "SIN FILTROS"}
            </b>

            {filtersAreActive ? (
              <>
                <span aria-hidden="true">·</span>

                <strong>
                  {visibleStations.length}{" "}
                  {visibleStations.length === 1
                    ? "EMISORA"
                    : "EMISORAS"}
                </strong>

                <span aria-hidden="true">·</span>

                <strong className="listenersResult">
                  <i aria-hidden="true">👥</i>
                  {visibleStationsListeners}{" "}
                  {visibleStationsListeners === 1
                    ? "OYENTE"
                    : "OYENTES"}
                </strong>

                <span aria-hidden="true">·</span>

                <span
                  className="audienceShareResult"
                  title={`${visibleAudienceShare}% de la audiencia total de la red`}
                >
                  <strong>
                    {visibleAudienceShare}% DE LA RED
                  </strong>

                  <span
                    className="audienceShareMiniTrack"
                    aria-hidden="true"
                  >
                    <i
                      className="audienceShareMiniFill"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, visibleAudienceShare),
                        )}%`,
                      }}
                    />
                  </span>
                </span>

                <em>LIMPIAR ↗</em>
              </>
            ) : null}
          </button>
        </span>

        <button
          type="button"
          className={
            stationMetricsCollapsed
              ? "stationMetricsToggle collapsed"
              : "stationMetricsToggle"
          }
          onClick={() =>
            setStationMetricsCollapsed((current) => !current)
          }
          aria-expanded={!stationMetricsCollapsed}
          title={
            stationMetricsCollapsed
              ? "Mostrar datos de la red"
              : "Ocultar datos de la red"
          }
        >
          <i aria-hidden="true">
            {stationMetricsCollapsed ? "+" : "−"}
          </i>
          {stationMetricsCollapsed
            ? "VER DATOS DE LA RED"
            : "OCULTAR DATOS DE LA RED"}
        </button>
      </div>

      {stationMetricsCollapsed ? (
        <button
          type="button"
          className="stationMetricsCollapsedSummary"
          onClick={() => setStationMetricsCollapsed(false)}
          aria-label={
            filtersAreActive
              ? `Abrir datos de la red. ${visibleStations.length} de ${stations.length} emisoras visibles con ${visibleStationsListeners} oyentes, equivalentes al ${visibleAudienceShare}% de la audiencia total`
              : "Abrir datos de la red"
          }
          title={
            filtersAreActive
              ? `${visibleStations.length} de ${stations.length} emisoras visibles · ${visibleStationsListeners} oyentes · ${visibleAudienceShare}% de la red. Abrir datos de la red`
              : "Abrir métricas generales de la red"
          }
        >
          <span
            className={
              filtersAreActive
                ? "collapsedStationsCount filtered"
                : "collapsedStationsCount"
            }
            title={
              filtersAreActive
                ? `${visibleStations.length} de ${stations.length} emisoras visibles`
                : `${stations.length} emisoras en la red`
            }
          >
            <i aria-hidden="true">◉</i>

            <b>
              {filtersAreActive ? (
                <>
                  {visibleStations.length}
                  <small aria-hidden="true">/</small>
                  <strong>{stations.length}</strong>
                </>
              ) : (
                stations.length
              )}
            </b>

            <em>
              {filtersAreActive ? "VISIBLES / TOTAL" : "EMISORAS"}
            </em>

            {filtersAreActive ? (
              <span
                className="collapsedVisibleTrack"
                aria-hidden="true"
              >
                <i
                  className="collapsedVisibleFill"
                  style={{
                    width: `${
                      stations.length > 0
                        ? Math.round(
                            (visibleStations.length / stations.length) * 100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </span>
            ) : null}
          </span>

          <span>
            <i className="live" aria-hidden="true">●</i>
            <b>{stationsOnline}</b>
            <em>AL AIRE</em>
          </span>

          <span
            className={
              filtersAreActive
                ? "collapsedListenersCount filtered"
                : "collapsedListenersCount"
            }
            title={
              filtersAreActive
                ? `${visibleStationsListeners} oyentes en las emisoras visibles`
                : `${networkListeners} oyentes en toda la red`
            }
          >
            <i className="listeners" aria-hidden="true">👥</i>

            <b>
              {filtersAreActive
                ? visibleStationsListeners
                : networkListeners}
            </b>

            <em>
              {filtersAreActive
                ? "OYENTES VISIBLES"
                : "OYENTES"}
            </em>
          </span>

          {filtersAreActive ? (
            <span
              className="collapsedAudienceShare"
              title={`${visibleAudienceShare}% de la audiencia total de la red`}
            >
              <i aria-hidden="true">◔</i>

              <b>{visibleAudienceShare}%</b>

              <em>DE LA RED</em>

              <span
                className="collapsedAudienceShareTrack"
                aria-hidden="true"
              >
                <i
                  className="collapsedAudienceShareFill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, visibleAudienceShare),
                    )}%`,
                  }}
                />
              </span>
            </span>
          ) : null}

          <span
            className={[
              "coverage",
              networkOperationalCoverage >= 90
                ? "optimal"
                : networkOperationalCoverage >= 60
                  ? "partial"
                  : "critical",
            ].join(" ")}
            title={`${stationsOnline} de ${stations.length} emisoras al aire`}
          >
            <i aria-hidden="true">◒</i>
            <b>{networkOperationalCoverage}%</b>
            <em>RED {networkOperationalStatus}</em>
          </span>

          <small>VER DATOS DE LA RED +</small>
        </button>
      ) : null}

      <div
        className={
          stationMetricsCollapsed
            ? "stationNetworkMetrics collapsed"
            : "stationNetworkMetrics"
        }
        aria-label="Estado general de la red"
      >
        <button
          type="button"
          className={
            !filtersAreActive && stationSortMode === "network"
              ? "stationMetric stationMetricAction active allStationsAction"
              : "stationMetric stationMetricAction allStationsAction"
          }
          onClick={resetStationFilters}
          aria-pressed={!filtersAreActive && stationSortMode === "network"}
          title="Mostrar toda la red y limpiar filtros"
        >
          <span
            className="stationMetricIcon"
            aria-hidden="true"
          >
            ◉
          </span>

          <div>
            <strong
              className={
                filtersAreActive
                  ? "stationMetricPrimaryCount filtered"
                  : "stationMetricPrimaryCount"
              }
              title={
                filtersAreActive
                  ? `${visibleStations.length} de ${stations.length} emisoras visibles`
                  : `${stations.length} emisoras en la red`
              }
            >
              {filtersAreActive ? (
                <>
                  {visibleStations.length}
                  <span aria-hidden="true">/</span>
                  <small>{stations.length}</small>
                </>
              ) : (
                stations.length
              )}
            </strong>

            <small>EMISORAS EN LA RED</small>

            {filtersAreActive ? (
              <span
                className="stationMetricVisibleTrack"
                aria-label={`${visibleStations.length} de ${stations.length} emisoras visibles`}
                title={`${visibleStations.length} de ${stations.length} emisoras visibles`}
              >
                <i
                  className="stationMetricVisibleFill"
                  style={{
                    width: `${
                      stations.length > 0
                        ? Math.round(
                            (visibleStations.length / stations.length) * 100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </span>
            ) : null}

            <em>
              {!filtersAreActive && stationSortMode === "network"
                ? "MOSTRANDO TODA LA RED"
                : `${visibleStations.length} ${
                    visibleStations.length === 1
                      ? "VISIBLE"
                      : "VISIBLES"
                  } · VER TODAS ↗`}
            </em>
          </div>
        </button>

        <button
          type="button"
          className={
            onlyOnAir
              ? "stationMetric stationMetricAction active liveAction"
              : "stationMetric stationMetricAction liveAction"
          }
          onClick={() => {
            setOnlyOnAir((current) => !current);
            setStationQuery("");
          }}
          aria-pressed={onlyOnAir}
          title={
            onlyOnAir
              ? "Mostrar también emisoras fuera del filtro SOLO AL AIRE"
              : "Ver solo emisoras al aire"
          }
        >
          <span
            className="stationMetricIcon live"
            aria-hidden="true"
          >
            ●
          </span>

          <div>
            <strong>{stationsOnline}</strong>
            <small>AL AIRE</small>
            <em>
              {onlyOnAir
                ? `MOSTRANDO AL AIRE · ${visibleStations.length} ${
                    visibleStations.length === 1
                      ? "EMISORA"
                      : "EMISORAS"
                  }`
                : "VER SOLO AL AIRE ↗"}
            </em>
          </div>
        </button>

        <button
          type="button"
          className={
            stationSortMode === "audience"
              ? "stationMetric stationMetricAction active audienceAction"
              : "stationMetric stationMetricAction audienceAction"
          }
          onClick={revealFullAudienceRanking}
          aria-pressed={stationSortMode === "audience"}
          title={
            filtersAreActive
              ? `Ver ranking completo por audiencia · Promedio ${Math.round(
                  averageVisibleStationListeners,
                )} oyentes entre ${visibleStations.length} ${
                  visibleStations.length === 1
                    ? "emisora visible"
                    : "emisoras visibles"
                }`
              : `Ver ranking completo por audiencia · Promedio ${Math.round(
                  averageStationListeners,
                )} oyentes por emisora`
          }
        >
          <span
            className="stationMetricIcon listeners"
            aria-hidden="true"
          >
            👥
          </span>

          <div>
            <strong>{networkListeners}</strong>
            <small>OYENTES EN VIVO</small>
            <em>
              {stationSortMode === "audience"
                ? `RANKING ACTIVO · ${visibleStations.length} ${
                    visibleStations.length === 1
                      ? "EMISORA"
                      : "EMISORAS"
                  } · PROM. ${Math.round(
                    filtersAreActive
                      ? averageVisibleStationListeners
                      : averageStationListeners,
                  )}`
                : filtersAreActive
                  ? `PROM. ${Math.round(
                      averageVisibleStationListeners,
                    )} ENTRE VISIBLES · VER RANKING ↗`
                  : `PROM. ${Math.round(
                      averageStationListeners,
                    )} POR EMISORA · VER RANKING ↗`}
            </em>
          </div>
        </button>

        <button
          type="button"
          className={[
            "stationMetric",
            "stationMetricAction",
            "genresAction",
            !["TODAS", "FAVORITAS", "RECIENTES"].includes(activeGenre)
              ? "active"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => {
            setControlsCollapsed(false);

            window.requestAnimationFrame(() => {
              document
                .getElementById("station-genre-filters")
                ?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
            });
          }}
          aria-pressed={
            !["TODAS", "FAVORITAS", "RECIENTES"].includes(activeGenre)
          }
          title={
            !["TODAS", "FAVORITAS", "RECIENTES"].includes(activeGenre)
              ? `Género activo: ${activeGenre}. Abrir filtros por género`
              : "Abrir filtros por género"
          }
        >
          <span
            className="stationMetricIcon genres"
            aria-hidden="true"
          >
            ♫
          </span>

          <div>
            <strong>{Math.max(0, genres.length - 1)}</strong>
            <small>GÉNEROS EN LA RED</small>
            <em>
              {!["TODAS", "FAVORITAS", "RECIENTES"].includes(activeGenre)
                ? `${activeGenre} ACTIVA · ${visibleStations.length} ${
                    visibleStations.length === 1
                      ? "EMISORA"
                      : "EMISORAS"
                  }`
                : "VER GÉNEROS ↗"}
            </em>
          </div>
        </button>

        <button
          type="button"
          className={
            activeGenre === "FAVORITAS"
              ? "stationMetric stationMetricAction active favoritesAction"
              : "stationMetric stationMetricAction favoritesAction"
          }
          onClick={() => {
            setActiveGenre("FAVORITAS");
            setStationQuery("");
          }}
          aria-pressed={activeGenre === "FAVORITAS"}
          title="Ver solo tus emisoras favoritas"
        >
          <span
            className="stationMetricIcon favorites"
            aria-hidden="true"
          >
            ♥
          </span>

          <div>
            <strong>{favoriteStations.length}</strong>
            <small>FAVORITAS GUARDADAS</small>
            <em>
              {activeGenre === "FAVORITAS"
                ? `MOSTRANDO FAVORITAS · ${visibleStations.length} ${
                    visibleStations.length === 1
                      ? "EMISORA"
                      : "EMISORAS"
                  }`
                : "VER FAVORITAS ↗"}
            </em>
          </div>
        </button>

        <div className="stationMetric operationalCoverageMetric">
          <span
            className="stationMetricIcon online"
            aria-hidden="true"
          >
            ●
          </span>

          <div>
            <span className="stationMetricCoverageHeading">
              <strong>{networkOperationalCoverage}%</strong>

              <em
                className={[
                  "stationMetricCoverageStatus",
                  networkOperationalCoverage >= 90
                    ? "optimal"
                    : networkOperationalCoverage >= 60
                      ? "partial"
                      : "critical",
                ].join(" ")}
              >
                {networkOperationalStatus}
              </em>
            </span>

            <small>COBERTURA OPERATIVA</small>

            <span
              className="stationMetricCoverageTrack"
              aria-label={`${networkOperationalCoverage}% de la red está al aire`}
              title={`${stationsOnline} de ${stations.length} emisoras al aire`}
            >
              <span
                className={[
                  "stationMetricCoverageFill",
                  networkOperationalCoverage >= 90
                    ? "optimal"
                    : networkOperationalCoverage >= 60
                      ? "partial"
                      : "critical",
                ].join(" ")}
                style={{
                  width: `${networkOperationalCoverage}%`,
                }}
              />
            </span>

            <span className="stationMetricCoverageDetail">
              <b>
                {stationsOnline} DE {stations.length} AL AIRE
              </b>

              {stations.length - stationsOnline > 0 ? (
                <em>
                  {stations.length - stationsOnline} FUERA DE LÍNEA
                </em>
              ) : (
                <em className="allOnline">TODO OPERATIVO</em>
              )}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={
            activeGenre === "RECIENTES"
              ? "stationMetric stationMetricAction active recentAction"
              : "stationMetric stationMetricAction recentAction"
          }
          onClick={() => {
            setActiveGenre("RECIENTES");
            setStationQuery("");
          }}
          aria-pressed={activeGenre === "RECIENTES"}
          title="Ver emisoras escuchadas recientemente"
        >
          <span
            className="stationMetricIcon recent"
            aria-hidden="true"
          >
            ◷
          </span>

          <div>
            <strong>{recentStations.length}</strong>
            <small>ESCUCHADAS RECIENTEMENTE</small>
            <em>
              {activeGenre === "RECIENTES"
                ? `MOSTRANDO RECIENTES · ${visibleStations.length} ${
                    visibleStations.length === 1
                      ? "EMISORA"
                      : "EMISORAS"
                  }`
                : "VER RECIENTES ↗"}
            </em>
          </div>
        </button>
      </div>

      <div
        className="stationNetworkBar"
        style={
          {
            "--network-accent": selected.accent,
            "--network-artwork": `url("${selectedArtwork}")`,
          } as CSSProperties
        }
      >
        <div className="stationNetworkIdentity">
          <div className="stationNetworkLogoWrap">
            <img
              src={selected.logo}
              alt={`Logo de ${selected.name}`}
              width={66}
              height={66}
            />

            {playing ? (
              <span className="stationNetworkEqualizer" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            ) : null}
          </div>

          <div>
            <span className="stationNetworkKicker">
              <i aria-hidden="true" /> RED EN VIVO
            </span>
            <strong>{selected.name}</strong>
            <small>{selected.slogan}</small>
          </div>
        </div>

        <div className="stationNetworkNow" aria-live="polite">
          <span>SONANDO AHORA</span>
          <strong title={selectedInfo.title}>{selectedInfo.title}</strong>
          <small title={selectedInfo.artist}>{selectedInfo.artist}</small>
        </div>

        <div className="stationNetworkActions">
          <span className="stationNetworkListeners">
            <b>{selectedInfo.listeners ?? "—"}</b>
            <small>OYENTES EN VIVO</small>
          </span>

          <div className="stationNetworkSkip" aria-label="Cambiar emisora">
            <button
              type="button"
              onClick={() => moveStation("previous")}
              aria-label="Escuchar emisora anterior"
              title="Emisora anterior"
            >
              <span aria-hidden="true">←</span>
              <strong>ANTERIOR</strong>
            </button>

            <div
              className="stationNetworkPosition"
              aria-label={
                selectedVisiblePosition
                  ? `Emisora ${selectedVisiblePosition} de ${visibleStations.length}`
                  : `${visibleStations.length} emisoras visibles`
              }
            >
              <strong>
                {selectedVisiblePosition ?? "—"}
              </strong>
              <span>DE</span>
              <strong>{visibleStations.length}</strong>
            </div>

            <button
              type="button"
              onClick={() => moveStation("next")}
              aria-label="Escuchar emisora siguiente"
              title="Emisora siguiente"
            >
              <strong>SIGUIENTE</strong>
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <button
            type="button"
            className={
              favoriteStations.includes(selected.id)
                ? "stationNetworkFavorite active"
                : "stationNetworkFavorite"
            }
            onClick={() => toggleFavorite(selected.id)}
            aria-pressed={favoriteStations.includes(selected.id)}
            aria-label={
              favoriteStations.includes(selected.id)
                ? `Quitar ${selected.name} de favoritas`
                : `Agregar ${selected.name} a favoritas`
            }
            title={
              favoriteStations.includes(selected.id)
                ? "Quitar de favoritas"
                : "Agregar a favoritas"
            }
          >
            <span aria-hidden="true">
              {favoriteStations.includes(selected.id) ? "♥" : "♡"}
            </span>
            <strong>
              {favoriteStations.includes(selected.id)
                ? "EN FAVORITAS"
                : "FAVORITA"}
            </strong>
            <kbd className="stationNetworkFavoriteKey" aria-hidden="true">
              G
            </kbd>
          </button>

          <button
            type="button"
            className={
              sharedNowPlaying
                ? "stationNetworkShare active"
                : "stationNetworkShare"
            }
            onClick={shareNowPlaying}
            aria-label={`Compartir lo que suena en ${selected.name}`}
            title="Compartir lo que suena"
          >
            <span aria-hidden="true">
              {sharedNowPlaying ? "✓" : "↗"}
            </span>
            <strong>
              {sharedNowPlaying ? "COMPARTIDO" : "COMPARTIR"}
            </strong>
            <kbd className="stationNetworkShareKey" aria-hidden="true">
              C
            </kbd>
          </button>

          <Link
            className="stationNetworkOpen"
            href={`/emisoras/${selected.id}`}
            aria-label={`Abrir página de ${selected.name}`}
          >
            <span aria-hidden="true">↗</span>
            <strong>VER EMISORA</strong>
          </Link>

          <button
            type="button"
            className="stationNetworkPlay"
            onClick={() => playStation(selected)}
            aria-label={playing ? `Pausar ${selected.name}` : `Escuchar ${selected.name}`}
            aria-pressed={playing}
          >
            <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
            <strong>{playing ? "PAUSAR" : "ESCUCHAR"}</strong>
          </button>
        </div>
      </div>

      <div
        id="station-control-dock"
        className={
          controlsCollapsed
            ? "stationControlDock collapsed"
            : "stationControlDock"
        }
      >
        <div className="stationControlHeader">
          <span>
            <i aria-hidden="true" />
            CONTROLES DE LA RED
          </span>

          <button
            type="button"
            className="stationControlCollapse"
            onClick={() => setControlsCollapsed((current) => !current)}
            aria-expanded={!controlsCollapsed}
          >
            <span aria-hidden="true">
              {controlsCollapsed ? "⌄" : "⌃"}
            </span>
            <strong>
              {controlsCollapsed ? "MOSTRAR CONTROLES" : "MINIMIZAR"}
            </strong>
          </button>
        </div>

        {controlsCollapsed ? (
          <div className="stationControlCollapsedSummary">
            <span>
              <b>{visibleStations.length}</b>{" "}
              {visibleStations.length === 1 ? "EMISORA" : "EMISORAS"}
            </span>

            {activeGenre !== "TODAS" ? (
              <small>{activeGenre}</small>
            ) : null}

            {onlyOnAir ? <small>SOLO AL AIRE</small> : null}
            {stationSortMode === "audience" ? (
              <small>MÁS ESCUCHADAS</small>
            ) : null}

            {stationSortMode === "alphabetical" ? (
              <small>ORDEN A–Z</small>
            ) : null}
            {stationQuery.trim() ? <small>BÚSQUEDA ACTIVA</small> : null}
          </div>
        ) : (
          <div className="stationControlBody">
            <div className="stationTools">
              <label className="stationSearch">
                <span aria-hidden="true">⌕</span>
                <input
                  id="station-network-search"
                  type="search"
                  value={stationQuery}
                  onChange={(event) => setStationQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "ArrowDown" &&
                      visibleStations.length > 1
                    ) {
                      event.preventDefault();
                      moveSearchMatch("next");
                      return;
                    }

                    if (
                      event.key === "ArrowUp" &&
                      visibleStations.length > 1
                    ) {
                      event.preventDefault();
                      moveSearchMatch("previous");
                      return;
                    }

                    if (
                      event.key === "Enter" &&
                      visibleStations.length > 0
                    ) {
                      event.preventDefault();
                      rememberStationSearch(stationQuery);
                      playFirstVisibleStation();
                    }
                  }}
                  placeholder="BUSCAR EMISORA, ARTISTA O CANCIÓN..."
                  aria-label="Buscar emisora, artista o canción"
                />
                {stationQuery ? (
                  <button
                    type="button"
                    className="stationSearchClear"
                    onClick={() => setStationQuery("")}
                    aria-label="Limpiar búsqueda"
                  >
                    ×
                  </button>
                ) : null}
              </label>

              <div className="stationSearchMeta">
                <small className="stationSearchHint">
                  BUSCA POR EMISORA, GÉNERO, ARTISTA O CANCIÓN EN VIVO
                  <span className="stationSearchEnterHint">
                    · ↑ ↓ CAMBIAN RESULTADO · ENTER ESCUCHA
                  </span>
                </small>

                <small className="stationKeyboardHints">
                  <kbd>F</kbd> BUSCAR
                  <span>·</span>
                  <kbd>↑</kbd><kbd>↓</kbd> RESULTADOS
                  <span>·</span>
                  <kbd className="stationEnterKey">ENTER</kbd> ESCUCHAR
                  <span>·</span>
                  <kbd className="stationSpaceKey">ESPACIO</kbd> PLAY/PAUSA
                  <span>·</span>
                  <kbd>G</kbd> FAVORITA
                  <span>·</span>
                  <kbd>C</kbd> COMPARTIR
                  <span>·</span>
                  <kbd>←</kbd> ANTERIOR
                  <span>·</span>
                  <kbd>→</kbd> SIGUIENTE
                  <span>·</span>
                  <kbd>R</kbd> SORPRÉNDEME
                  <span>·</span>
                  <kbd>V</kbd> VISTA
                  <span>·</span>
                  <kbd>ESC</kbd> LIMPIAR
                </small>
              </div>

              {recentStationSearches.length > 0 ? (
                <div className="stationRecentSearches" aria-label="Búsquedas recientes">
                  <span className="stationRecentSearchesLabel">
                    BÚSQUEDAS RECIENTES
                  </span>

                  <div className="stationRecentSearchesChips">
                    {recentStationSearches.map((query) => (
                      <span
                        key={query}
                        className="stationRecentSearchChip"
                      >
                        <button
                          type="button"
                          className="stationRecentSearchRepeat"
                          onClick={() => applyRecentStationSearch(query)}
                          title={`Buscar nuevamente: ${query}`}
                        >
                          <span aria-hidden="true">↺</span>
                          {query}
                        </button>

                        <button
                          type="button"
                          className="stationRecentSearchRemove"
                          onClick={() => removeRecentStationSearch(query)}
                          aria-label={`Eliminar ${query} de búsquedas recientes`}
                          title="Eliminar esta búsqueda"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="stationRecentSearchesClear"
                    onClick={clearRecentStationSearches}
                  >
                    BORRAR BÚSQUEDAS
                  </button>
                </div>
              ) : null}

              <div className="stationToolsRight">
                <button
                  type="button"
                  className="stationRandomPlay"
                  onClick={playRandomStation}
                  disabled={visibleStations.length === 0}
                  aria-label="Escuchar una emisora al azar"
                >
                  <span aria-hidden="true">🎲</span>
                  <strong>SORPRÉNDEME</strong>
                </button>

                <button
                  type="button"
                  className={
                    compactView
                      ? "stationViewToggle active"
                      : "stationViewToggle"
                  }
                  onClick={() => setCompactView((current) => !current)}
                  aria-pressed={compactView}
                >
                  <span aria-hidden="true">{compactView ? "▦" : "▥"}</span>
                  <strong>
                    {compactView ? "VISTA LISTA" : "VISTA TARJETAS"}
                  </strong>
                </button>

                <button
                  type="button"
                  className={
                    onlyOnAir
                      ? "stationOnAirFilter active"
                      : "stationOnAirFilter"
                  }
                  onClick={() => setOnlyOnAir((current) => !current)}
                  aria-pressed={onlyOnAir}
                >
                  <span aria-hidden="true">●</span>
                  <strong>SOLO AL AIRE</strong>
                </button>

                <button
                  type="button"
                  className={
                    stationSortMode !== "network"
                      ? "stationAudienceSort active"
                      : "stationAudienceSort"
                  }
                  onClick={cycleStationSort}
                  aria-label="Cambiar el orden de las emisoras"
                  title="Orden de la red, más escuchadas o alfabético"
                >
                  <span aria-hidden="true">
                    {stationSortMode === "audience"
                      ? "↕"
                      : stationSortMode === "alphabetical"
                        ? "A–Z"
                        : "≡"}
                  </span>
                  <strong>
                    {stationSortMode === "audience"
                      ? "MÁS ESCUCHADAS"
                      : stationSortMode === "alphabetical"
                        ? "ORDEN A–Z"
                        : "ORDEN DE LA RED"}
                  </strong>
                </button>

                <span className="stationResultCount" aria-live="polite">
                  <b>{visibleStations.length}</b>
                  <small>
                    {visibleStations.length === 1 ? " EMISORA" : " EMISORAS"}
                  </small>
                </span>
              </div>
            </div>

            <div
              id="station-genre-filters"
              className="stationGenreFilters"
              aria-label="Filtrar emisoras por género"
            >
              <button
                type="button"
                className={
                  activeGenre === "FAVORITAS"
                    ? "active favoriteFilter"
                    : "favoriteFilter"
                }
                onClick={() => setActiveGenre("FAVORITAS")}
                aria-pressed={activeGenre === "FAVORITAS"}
              >
                ♥ MIS FAVORITAS
                <span className="favoriteFilterCount">
                  {favoriteStations.length}
                </span>
              </button>

              <button
                type="button"
                className={
                  activeGenre === "RECIENTES"
                    ? "active recentFilter"
                    : "recentFilter"
                }
                onClick={() => setActiveGenre("RECIENTES")}
                aria-pressed={activeGenre === "RECIENTES"}
              >
                ◷ RECIENTES
                <span className="recentFilterCount">
                  {recentStations.length}
                </span>
              </button>

              {genres.map((genre) => {
                const filterActive = genre === activeGenre;

                return (
                  <button
                    key={genre}
                    type="button"
                    className={filterActive ? "active" : undefined}
                    onClick={() => setActiveGenre(genre)}
                    aria-pressed={filterActive}
                  >
                    <span>{genre}</span>
                    <b className="genreFilterCount">
                      {getGenreCount(genre)}
                    </b>
                  </button>
                );
              })}
            </div>

            {filtersAreActive ? (
              <div className="stationFilterSummary" aria-live="polite">
                <div className="stationFilterSummaryCount">
                  <span>
                    MOSTRANDO <b>{visibleStations.length}</b>{" "}
                    {visibleStations.length === 1 ? "EMISORA" : "EMISORAS"}
                  </span>

                  <small>
                    <strong>{activeFilterCount}</strong>{" "}
                    {activeFilterCount === 1
                      ? "FILTRO ACTIVO"
                      : "FILTROS ACTIVOS"}
                  </small>
                </div>

                <div className="stationFilteredMetrics">
                  <button
                    type="button"
                    className={onlyOnAir ? "active" : undefined}
                    onClick={() =>
                      setOnlyOnAir((current) => !current)
                    }
                    aria-pressed={onlyOnAir}
                    title={
                      onlyOnAir
                        ? "Mostrar todas las emisoras"
                        : "Mostrar solo emisoras al aire"
                    }
                  >
                    <i aria-hidden="true" />
                    <b>{visibleStationsOnline}</b>
                    AL AIRE
                    <span aria-hidden="true">
                      {onlyOnAir ? "×" : "→"}
                    </span>
                  </button>

                  {topVisibleStation && topVisibleStationInfo ? (
                    <button
                      type="button"
                      className={
                        topVisibleStation.id === selected.id && playing
                          ? "stationFilteredTop active"
                          : "stationFilteredTop"
                      }
                      onClick={() => playStation(topVisibleStation)}
                      aria-label={`Escuchar ${topVisibleStation.name}, la más escuchada de esta selección`}
                      title={`Escuchar ${topVisibleStation.name}`}
                    >
                      <i aria-hidden="true">★</i>
                      <b>
                        {typeof topVisibleStationInfo.listeners === "number"
                          ? topVisibleStationInfo.listeners
                          : "—"}
                      </b>
                      TOP EN VIVO
                      <span aria-hidden="true">
                        {topVisibleStation.id === selected.id && playing
                          ? "❚❚"
                          : "▶"}
                      </span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className={
                      stationSortMode === "audience"
                        ? "active"
                        : undefined
                    }
                    onClick={() =>
                      setStationSortMode((current) =>
                        current === "audience"
                          ? "network"
                          : "audience",
                      )
                    }
                    aria-pressed={stationSortMode === "audience"}
                    title={
                      stationSortMode === "audience"
                        ? "Volver al orden de la red"
                        : "Ordenar por emisoras más escuchadas"
                    }
                  >
                    <i aria-hidden="true">◉</i>
                    <b>{visibleStationsListeners}</b>
                    OYENTES
                    <span aria-hidden="true">
                      {stationSortMode === "audience" ? "×" : "→"}
                    </span>
                  </button>
                </div>

                <div
                  className="stationActiveFilterChips"
                  aria-label="Filtros activos"
                >
                  {activeGenre !== "TODAS" ? (
                    <button
                      type="button"
                      onClick={() => setActiveGenre("TODAS")}
                      title={`Quitar filtro ${activeGenre}`}
                    >
                      <b>{activeGenre}</b>
                      <span aria-hidden="true">×</span>
                    </button>
                  ) : null}

                  {onlyOnAir ? (
                    <button
                      type="button"
                      onClick={() => setOnlyOnAir(false)}
                      title="Quitar filtro Solo al Aire"
                    >
                      <b>SOLO AL AIRE</b>
                      <span aria-hidden="true">×</span>
                    </button>
                  ) : null}

                  {stationSortMode === "audience" ? (
                    <button
                      type="button"
                      onClick={() => setStationSortMode("network")}
                      title="Quitar orden Más Escuchadas"
                    >
                      <b>MÁS ESCUCHADAS</b>
                      <span aria-hidden="true">×</span>
                    </button>
                  ) : null}

                  {stationSortMode === "alphabetical" ? (
                    <button
                      type="button"
                      onClick={() => setStationSortMode("network")}
                      title="Quitar orden A–Z"
                    >
                      <b>ORDEN A–Z</b>
                      <span aria-hidden="true">×</span>
                    </button>
                  ) : null}

                  {stationQuery.trim() ? (
                    <button
                      type="button"
                      onClick={() => {
                        setStationQuery("");
                        setSearchMatchIndex(0);
                      }}
                      title="Quitar búsqueda"
                    >
                      <b>BÚSQUEDA</b>
                      <em>“{stationQuery}”</em>
                      <span aria-hidden="true">×</span>
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  className="stationClearAllFilters"
                  onClick={resetStationFilters}
                >
                  <span aria-hidden="true">×</span>
                  LIMPIAR FILTROS
                </button>
              </div>
            ) : null}

            {topVisibleStations.length > 0 ? (
              <div
                className={
                  top3Collapsed
                    ? "stationSelectionTop3 collapsed"
                    : "stationSelectionTop3"
                }
                aria-live="polite"
              >
                <div className="stationSelectionTop3Heading">
                  <span aria-hidden="true">★</span>

                  <div>
                    <span className="stationSelectionTop3Context">
                      {top3SelectionContext}
                    </span>

                    <strong>TOP 3 EN VIVO</strong>

                    <small>
                      {top3Collapsed
                        ? `${topVisibleStations.length} LÍDERES · ${top3AudienceShare}% DE LA AUDIENCIA`
                        : `TOP 3 CONCENTRA ${top3AudienceShare}% · ${top3VisibleListeners} OYENTES`}
                    </small>
                  </div>

                  <div className="stationSelectionTop3Actions">
                    <button
                      type="button"
                      className="stationSelectionTop3Ranking"
                      onClick={revealFullAudienceRanking}
                      title="Ordenar toda esta selección por audiencia"
                    >
                      <span aria-hidden="true">↧</span>
                      VER RANKING COMPLETO
                    </button>

                    <button
                      type="button"
                      className="stationSelectionTop3Toggle"
                      onClick={() =>
                        setTop3Collapsed((current) => !current)
                      }
                      aria-expanded={!top3Collapsed}
                    >
                      <span aria-hidden="true">
                        {top3Collapsed ? "＋" : "−"}
                      </span>
                      {top3Collapsed
                        ? "MOSTRAR TOP 3"
                        : "MINIMIZAR"}
                    </button>
                  </div>
                </div>

                {!top3Collapsed ? (
                  <div className="stationSelectionTop3List">
                    {topVisibleStations.map((station, index) => {
                      const info =
                        metadata[station.id] ?? emptyNowPlaying(station);
                      const active =
                        station.id === selected.id && playing;
                      const listenerCount =
                        typeof info.listeners === "number"
                          ? info.listeners
                          : 0;
                      const audienceShare =
                        visibleStationsListeners > 0
                          ? Math.round(
                              (listenerCount /
                                visibleStationsListeners) *
                                100,
                            )
                          : 0;

                      return (
                        <button
                          key={station.id}
                          type="button"
                          className={active ? "active" : undefined}
                          onClick={() => playStation(station)}
                          aria-label={`Escuchar ${station.name}, puesto ${index + 1}`}
                          title={`Escuchar ${station.name}`}
                        >
                          <b>#{index + 1}</b>

                          <span className="stationSelectionTop3Logo">
                            <img
                              src={station.logo}
                              alt=""
                              width={30}
                              height={30}
                            />
                          </span>

                          <span className="stationSelectionTop3Copy">
                            <span className="stationSelectionTop3Name">
                              {station.shortName || station.name}
                            </span>

                            <small
                              className="stationSelectionTop3Now"
                              title={
                                info.artist
                                  ? `${info.title} — ${info.artist}`
                                  : info.title
                              }
                            >
                              <span>SONANDO</span>
                              <b>
                                {info.title || "Programación en vivo"}
                              </b>
                              {info.artist ? (
                                <em>{info.artist}</em>
                              ) : null}
                            </small>
                          </span>

                          <span className="stationSelectionTop3Listeners">
                            <i aria-hidden="true">◉</i>
                            {typeof info.listeners === "number"
                              ? info.listeners
                              : "—"}
                          </span>

                          <span
                            className="stationSelectionTop3Audience"
                            title={`${audienceShare}% de la audiencia de esta selección`}
                          >
                            <small>{audienceShare}%</small>

                            <span
                              className="stationSelectionTop3AudienceTrack"
                              aria-hidden="true"
                            >
                              <i
                                style={{
                                  width: `${Math.max(
                                    audienceShare,
                                    audienceShare > 0 ? 5 : 0,
                                  )}%`,
                                }}
                              />
                            </span>
                          </span>

                          <span
                            className="stationSelectionTop3Action"
                            aria-hidden="true"
                          >
                            {active ? "❚❚" : "▶"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {secondVisibleStation && secondVisibleStationInfo ? (
                  <div
                    className={
                      leadershipDuelCollapsed
                        ? "stationLeadershipDuel collapsed"
                        : "stationLeadershipDuel"
                    }
                  >
                    <div className="stationLeadershipDuelHeading">
                      <span aria-hidden="true">⚔</span>

                      <span>
                        <small>DUELO POR EL LIDERATO</small>
                        <strong>
                          {leadershipDuelCollapsed
                            ? `#1 ${leaderHeadToHeadShare}% · #2 ${challengerHeadToHeadShare}%`
                            : "#1 VS #2"}
                        </strong>
                      </span>

                      <b>
                        {leaderAudienceAdvantage === 0
                          ? "EMPATE"
                          : leaderAudienceAdvantage === 1
                            ? "1 OYENTE DE DIFERENCIA"
                            : `${leaderAudienceAdvantage} OYENTES DE DIFERENCIA`}
                      </b>

                      <button
                        type="button"
                        className="stationLeadershipDuelToggle"
                        onClick={() =>
                          setLeadershipDuelCollapsed(
                            (current) => !current,
                          )
                        }
                        aria-expanded={!leadershipDuelCollapsed}
                      >
                        <span aria-hidden="true">
                          {leadershipDuelCollapsed ? "＋" : "−"}
                        </span>

                        {leadershipDuelCollapsed
                          ? "MOSTRAR DUELO"
                          : "MINIMIZAR DUELO"}
                      </button>
                    </div>

                    {!leadershipDuelCollapsed ? (
                      <>
                        <div className="stationLeadershipDuelScore">
                          <span>
                            <small>#1</small>
                            <strong>
                              {topVisibleStation.shortName ||
                                topVisibleStation.name}
                            </strong>
                            <b>{topVisibleLeaderListeners}</b>
                            <em>{leaderHeadToHeadShare}%</em>
                          </span>

                          <i aria-hidden="true">VS</i>

                          <span>
                            <small>#2</small>
                            <strong>
                              {secondVisibleStation.shortName ||
                                secondVisibleStation.name}
                            </strong>
                            <b>{secondVisibleListeners}</b>
                            <em>{challengerHeadToHeadShare}%</em>
                          </span>
                        </div>

                        <div
                          className="stationLeadershipDuelTrack"
                          aria-label={`Líder ${leaderHeadToHeadShare}% frente a perseguidor ${challengerHeadToHeadShare}%`}
                        >
                          <span
                            style={{ width: `${leaderHeadToHeadShare}%` }}
                          />
                          <i
                            style={{
                              width: `${challengerHeadToHeadShare}%`,
                            }}
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {stationQuery.trim() ? (
        <div className="stationSearchSummary" aria-live="polite">
          <div className="stationSearchSummaryCopy">
            <small>RESULTADOS DE BÚSQUEDA</small>

            <strong title={stationQuery}>
              “{stationQuery}”
            </strong>

            <span>
              {visibleStations.length}{" "}
              {visibleStations.length === 1
                ? "COINCIDENCIA"
                : "COINCIDENCIAS"}
            </span>
          </div>

          <div className="stationSearchSummaryActions">
            {visibleStations.length === 0 ? (
              <button
                type="button"
                className="stationSearchExpand"
                onClick={expandSearchAcrossNetwork}
              >
                <span aria-hidden="true">⌕</span>
                BUSCAR EN TODA LA RED
              </button>
            ) : null}

            {visibleStations.length > 1 ? (
              <div
                className="stationSearchSummaryPager"
                aria-label="Navegar resultados de búsqueda"
              >
                <button
                  type="button"
                  onClick={() => moveSearchMatch("previous")}
                  aria-label="Ver coincidencia anterior"
                  title="Coincidencia anterior"
                >
                  <span aria-hidden="true">←</span>
                  ANTERIOR
                </button>

                <b>
                  {normalizedSearchMatchIndex + 1}
                  <span>DE</span>
                  {visibleStations.length}
                </b>

                <button
                  type="button"
                  onClick={() => moveSearchMatch("next")}
                  aria-label="Ver coincidencia siguiente"
                  title="Coincidencia siguiente"
                >
                  SIGUIENTE
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            ) : null}

            <button
              type="button"
              className="stationSearchSummaryClear"
              onClick={() => {
                setStationQuery("");
                setSearchMatchIndex(0);
              }}
            >
              <span aria-hidden="true">×</span>
              LIMPIAR BÚSQUEDA
            </button>
          </div>
        </div>
      ) : null}

      {stationQuery.trim() && visibleStations.length === 0 ? (
        <div className="stationSearchNoResults" aria-live="polite">
          <div>
            <span aria-hidden="true">⌕</span>
            <p>
              <strong>NO HAY COINCIDENCIAS CON LOS FILTROS ACTUALES</strong>
              <small>
                Mantendremos “{stationQuery}” y ampliaremos la búsqueda a toda
                la red.
              </small>
            </p>
          </div>

          <button
            type="button"
            onClick={expandSearchAcrossNetwork}
          >
            BUSCAR EN TODA LA RED
            <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}

      {firstSearchMatch && firstSearchMatchInfo ? (
        <div
          className="stationSearchSpotlight"
          style={
            {
              "--search-accent": firstSearchMatch.accent,
            } as CSSProperties
          }
          aria-live="polite"
        >
          <div className="stationSearchSpotlightArtwork">
            <img
              src={firstSearchMatchArtwork ?? firstSearchMatch.logo}
              alt={`Portada actual de ${firstSearchMatch.name}`}
              width={72}
              height={72}
              onError={(event) => {
                event.currentTarget.src = firstSearchMatch.logo;
              }}
            />

            <span aria-hidden="true">
              {firstSearchMatchPlaying ? "❚❚" : "▶"}
            </span>
          </div>

          <div className="stationSearchSpotlightCopy">
            <div className="stationSearchSpotlightHeading">
              <div className="stationSearchSpotlightLabel">
                <small>COINCIDENCIA DESTACADA</small>

                {firstSearchMatchReason ? (
                  <span>
                    COINCIDE POR {firstSearchMatchReason}
                  </span>
                ) : null}
              </div>

              <div className="stationSearchSpotlightPager">
                <span
                  className="stationSearchSpotlightKeyboard"
                  aria-hidden="true"
                >
                  ↑↓
                </span>

                <button
                  type="button"
                  onClick={() => moveSearchMatch("previous")}
                  disabled={visibleStations.length <= 1}
                  aria-label="Ver coincidencia anterior"
                  title="Coincidencia anterior"
                >
                  <span aria-hidden="true">←</span>
                </button>

                <b>
                  {normalizedSearchMatchIndex + 1}
                  <span>DE</span>
                  {visibleStations.length}
                </b>

                <button
                  type="button"
                  onClick={() => moveSearchMatch("next")}
                  disabled={visibleStations.length <= 1}
                  aria-label="Ver coincidencia siguiente"
                  title="Coincidencia siguiente"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>

            <strong>
              {highlightSearchText(
                firstSearchMatch.name,
                stationQuery,
              )}
            </strong>

            <p>
              <span>SONANDO AHORA</span>
              <b>
                {highlightSearchText(
                  firstSearchMatchInfo.title || "Programación en vivo",
                  stationQuery,
                )}
              </b>
              {firstSearchMatchInfo.artist ? (
                <em>
                  {highlightSearchText(
                    firstSearchMatchInfo.artist,
                    stationQuery,
                  )}
                </em>
              ) : null}
            </p>

            {firstSearchMatchReason === "GÉNERO" ? (
              <small className="stationSearchSpotlightGenre">
                GÉNERO ·{" "}
                {highlightSearchText(
                  firstSearchMatch.genre,
                  stationQuery,
                )}
              </small>
            ) : null}

            <div className="stationSearchSpotlightLiveMeta">
              <span>
                <i aria-hidden="true" />
                {firstSearchMatchInfo.configured
                  ? "EN LÍNEA"
                  : "DISPONIBLE"}
              </span>

              <button
                type="button"
                className="stationSearchSpotlightGenreFilter"
                onClick={() =>
                  showGenreAcrossNetwork(firstSearchMatch.genre)
                }
                aria-label={`Ver emisoras de ${firstSearchMatch.genre}`}
                title={`Ver toda la red de ${firstSearchMatch.genre}`}
              >
                <b>GÉNERO</b>
                <span aria-hidden="true">#</span>
                {firstSearchMatch.genre}
              </button>

              <span>
                <b>OYENTES</b>
                {typeof firstSearchMatchInfo.listeners === "number"
                  ? firstSearchMatchInfo.listeners
                  : "—"}
              </span>
            </div>
          </div>

          <div className="stationSearchSpotlightActions">
            <button
              type="button"
              onClick={() => playStation(firstSearchMatch)}
              aria-label={
                firstSearchMatchPlaying
                  ? `Pausar ${firstSearchMatch.name}`
                  : `Escuchar ${firstSearchMatch.name}`
              }
            >
              <span aria-hidden="true">
                {firstSearchMatchPlaying ? "❚❚" : "▶"}
              </span>
              <strong>
                {firstSearchMatchPlaying
                  ? "PAUSAR"
                  : "ESCUCHAR RESULTADO"}
              </strong>
              <kbd>ENTER</kbd>
            </button>

            <button
              type="button"
              className={
                favoriteStations.includes(firstSearchMatch.id)
                  ? "stationSearchSpotlightFavorite active"
                  : "stationSearchSpotlightFavorite"
              }
              onClick={() => toggleFavorite(firstSearchMatch.id)}
              aria-pressed={favoriteStations.includes(firstSearchMatch.id)}
              aria-label={
                favoriteStations.includes(firstSearchMatch.id)
                  ? `Quitar ${firstSearchMatch.name} de favoritas`
                  : `Agregar ${firstSearchMatch.name} a favoritas`
              }
            >
              <span aria-hidden="true">
                {favoriteStations.includes(firstSearchMatch.id)
                  ? "♥"
                  : "♡"}
              </span>
              <strong>
                {favoriteStations.includes(firstSearchMatch.id)
                  ? "EN FAVORITAS"
                  : "FAVORITA"}
              </strong>
            </button>

            <button
              type="button"
              className={
                sharedSearchMatchId === firstSearchMatch.id
                  ? "stationSearchSpotlightShare active"
                  : "stationSearchSpotlightShare"
              }
              onClick={() =>
                void shareSearchMatch(
                  firstSearchMatch,
                  firstSearchMatchInfo,
                )
              }
              aria-label={`Compartir ${firstSearchMatch.name}`}
            >
              <span aria-hidden="true">
                {sharedSearchMatchId === firstSearchMatch.id
                  ? "✓"
                  : "↗"}
              </span>
              <strong>
                {sharedSearchMatchId === firstSearchMatch.id
                  ? "COMPARTIDO"
                  : "COMPARTIR"}
              </strong>
            </button>

            <Link
              href={`/emisoras/${firstSearchMatch.id}`}
              aria-label={`Abrir página de ${firstSearchMatch.name}`}
            >
              VER EMISORA
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      ) : null}

      {activeGenre === "FAVORITAS" ? (
        <div className="stationFavoritesManager" aria-live="polite">
          <div>
            <span aria-hidden="true">♥</span>
            <p>
              <strong>EMISORAS FAVORITAS</strong>
              <small>
                {favoriteStations.length === 0
                  ? "Aún no has guardado emisoras favoritas."
                  : `${favoriteStations.length} ${
                      favoriteStations.length === 1
                        ? "emisora favorita"
                        : "emisoras favoritas"
                    } guardadas en este navegador.`}
              </small>
            </p>
          </div>

          {favoriteStations.length > 0 ? (
            <button
              type="button"
              onClick={clearFavoriteStations}
            >
              <span aria-hidden="true">×</span>
              BORRAR FAVORITAS
            </button>
          ) : null}
        </div>
      ) : null}

      {activeGenre === "RECIENTES" ? (
        <div className="stationRecentManager" aria-live="polite">
          <div>
            <span aria-hidden="true">◷</span>
            <p>
              <strong>HISTORIAL RECIENTE</strong>
              <small>
                {recentStations.length === 0
                  ? "Aún no hay emisoras en tu historial."
                  : `${recentStations.length} ${
                      recentStations.length === 1
                        ? "emisora guardada"
                        : "emisoras guardadas"
                    } en este navegador.`}
              </small>
            </p>
          </div>

          {recentStations.length > 0 ? (
            <button
              type="button"
              onClick={clearRecentStations}
            >
              <span aria-hidden="true">×</span>
              BORRAR HISTORIAL
            </button>
          ) : null}
        </div>
      ) : null}

      {stationSortMode === "audience" &&
      visibleStations.length > 0 ? (
        <div className="stationFullRankingBanner" aria-live="polite">
          <div className="stationFullRankingBannerIcon" aria-hidden="true">
            ★
          </div>

          <div className="stationFullRankingBannerMain">
            <div className="stationFullRankingBannerCopy">
              <span>{top3SelectionContext}</span>
              <strong>RANKING COMPLETO ACTIVO</strong>
              <small>
                {visibleStations.length}{" "}
                {visibleStations.length === 1 ? "EMISORA" : "EMISORAS"}
                {" · "}
                {visibleStationsListeners} OYENTES
              </small>
            </div>

            {topVisibleStation && topVisibleStationInfo ? (
              <div className="stationFullRankingBattle">
                <div className="stationFullRankingLeader">
                  <img
                    src={topVisibleStation.logo}
                    alt=""
                    width={38}
                    height={38}
                  />

                  <div className="stationFullRankingLeaderCopy">
                    <small>LÍDER #1</small>
                    <strong>
                      {topVisibleStation.shortName ||
                        topVisibleStation.name}
                    </strong>
                    <span
                      title={
                        topVisibleStationInfo.artist
                          ? `${topVisibleStationInfo.title} — ${topVisibleStationInfo.artist}`
                          : topVisibleStationInfo.title
                      }
                    >
                      {topVisibleStationInfo.title ||
                        "Programación en vivo"}
                      {topVisibleStationInfo.artist
                        ? ` · ${topVisibleStationInfo.artist}`
                        : ""}
                    </span>
                  </div>

                  <div className="stationFullRankingLeaderAudience">
                    <b>
                      {typeof topVisibleStationInfo.listeners === "number"
                        ? topVisibleStationInfo.listeners
                        : "—"}
                    </b>
                    <small>OYENTES</small>

                    {leaderAudienceAdvantage !== null ? (
                      <span
                        className={
                          leaderAudienceAdvantage === 0
                            ? "tied"
                            : undefined
                        }
                      >
                        {leaderAudienceAdvantage === 0
                          ? "EMPATE EN EL LIDERATO"
                          : leaderAudienceAdvantage === 1
                            ? "VENTAJA +1 OYENTE"
                            : `VENTAJA +${leaderAudienceAdvantage} OYENTES`}
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className={
                      topVisibleStation.id === selected.id && playing
                        ? "active"
                        : undefined
                    }
                    onClick={() => playStation(topVisibleStation)}
                    aria-label={`Escuchar la emisora líder ${topVisibleStation.name}`}
                    title={`Escuchar ${topVisibleStation.name}`}
                  >
                    <span aria-hidden="true">
                      {topVisibleStation.id === selected.id && playing
                        ? "❚❚"
                        : "▶"}
                    </span>
                    ESCUCHAR #1
                  </button>
                </div>

                {secondVisibleStation && secondVisibleStationInfo ? (
                  <div className="stationFullRankingChallenger">
                    <span className="stationFullRankingChallengerBadge">
                      #2
                    </span>

                    <img
                      src={secondVisibleStation.logo}
                      alt=""
                      width={30}
                      height={30}
                    />

                    <div className="stationFullRankingChallengerCopy">
                      <small>PERSEGUIDOR #2</small>

                      <strong>
                        {secondVisibleStation.shortName ||
                          secondVisibleStation.name}
                      </strong>

                      <span
                        className="stationFullRankingChallengerNow"
                        title={
                          secondVisibleStationInfo.artist
                            ? `${secondVisibleStationInfo.title} — ${secondVisibleStationInfo.artist}`
                            : secondVisibleStationInfo.title
                        }
                      >
                        <i>SONANDO</i>

                        <b>
                          {secondVisibleStationInfo.title ||
                            "Programación en vivo"}
                        </b>

                        {secondVisibleStationInfo.artist ? (
                          <em>{secondVisibleStationInfo.artist}</em>
                        ) : null}
                      </span>
                    </div>

                    <div className="stationFullRankingChallengerAudience">
                      <b>
                        {typeof secondVisibleStationInfo.listeners ===
                        "number"
                          ? secondVisibleStationInfo.listeners
                          : "—"}
                      </b>
                      <small>
                        {leaderAudienceAdvantage === 0
                          ? "EMPATE CON #1"
                          : leaderAudienceAdvantage === 1
                            ? "A 1 OYENTE"
                            : `A ${leaderAudienceAdvantage ?? 0} OYENTES`}
                      </small>
                    </div>

                    <button
                      type="button"
                      className={
                        secondVisibleStation.id === selected.id && playing
                          ? "active"
                          : undefined
                      }
                      onClick={() =>
                        playStation(secondVisibleStation)
                      }
                      aria-label={`Escuchar la emisora número dos ${secondVisibleStation.name}`}
                      title={`Escuchar ${secondVisibleStation.name}`}
                    >
                      <span aria-hidden="true">
                        {secondVisibleStation.id === selected.id && playing
                          ? "❚❚"
                          : "▶"}
                      </span>
                      ESCUCHAR #2
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div
            className={`${
              biggestRisingStation || biggestFallingStation
                ? "stationRankingTrend live"
                : rankingMovementReady
                  ? "stationRankingTrend stable"
                  : "stationRankingTrend waiting"
            }${rankingTrendCollapsed ? " collapsed" : ""}`}
          >
            <div className="stationRankingTrendHeading">
              <span aria-hidden="true">↕</span>

              <span>
                <small>TENDENCIA DEL RANKING</small>
                <strong>
                  {!rankingMovementReady
                    ? "ESPERANDO PRÓXIMA ACTUALIZACIÓN"
                    : biggestRisingStation || biggestFallingStation
                      ? "MOVIMIENTO DETECTADO"
                      : "RANKING ESTABLE"}
                </strong>
              </span>

              <b>
                {!rankingMovementReady
                  ? "EN VIVO"
                  : biggestRisingStation || biggestFallingStation
                    ? "CAMBIO DE POSICIONES"
                    : "SIN CAMBIOS"}
              </b>

              <span className="stationRankingTrendUpdated">
                <small>ÚLTIMA ACTUALIZACIÓN</small>
                <strong>
                  {rankingUpdatedAt ?? "ESPERANDO DATOS"}
                </strong>
              </span>

              <button
                type="button"
                className="stationRankingTrendToggle"
                onClick={() =>
                  setRankingTrendCollapsed(
                    (current) => !current,
                  )
                }
                aria-expanded={!rankingTrendCollapsed}
                title={
                  rankingTrendCollapsed
                    ? "Mostrar tendencia completa"
                    : "Minimizar tendencia"
                }
              >
                <span aria-hidden="true">
                  {rankingTrendCollapsed ? "＋" : "−"}
                </span>

                {rankingTrendCollapsed
                  ? "MOSTRAR TENDENCIA"
                  : "MINIMIZAR TENDENCIA"}
              </button>
            </div>

            {rankingMovementReady &&
            selectedVisiblePosition !== null &&
            selectedRankingMovement !== null ? (
              <button
                type="button"
                className={
                  selectedRankingMovement > 0
                    ? "stationRankingTrendCurrent up"
                    : selectedRankingMovement < 0
                      ? "stationRankingTrendCurrent down"
                      : "stationRankingTrendCurrent steady"
                }
                onClick={() =>
                  revealRankingTrendStation(selected.id)
                }
                title={`Ir a ${selected.name} dentro del ranking`}
              >
                <span aria-hidden="true">
                  {selectedRankingMovement > 0
                    ? "↑"
                    : selectedRankingMovement < 0
                      ? "↓"
                      : "—"}
                </span>

                <span>
                  <small>TU TENDENCIA</small>
                  <strong>
                    {selected.shortName || selected.name}
                  </strong>
                </span>

                <b>
                  #{selectedVisiblePosition} ·{" "}
                  {selectedRankingMovement > 0
                    ? `SUBE ${selectedRankingMovement}`
                    : selectedRankingMovement < 0
                      ? `BAJA ${Math.abs(
                          selectedRankingMovement,
                        )}`
                      : "MANTIENE"}

                  {selectedRankingListenerChange !== null ? (
                    <em
                      className={
                        selectedRankingListenerChange > 0
                          ? "listenerUp"
                          : selectedRankingListenerChange < 0
                            ? "listenerDown"
                            : "listenerSteady"
                      }
                    >
                      {selectedRankingListenerChange > 0
                        ? ` · +${selectedRankingListenerChange} OY`
                        : selectedRankingListenerChange < 0
                          ? ` · ${selectedRankingListenerChange} OY`
                          : " · 0 OY"}
                    </em>
                  ) : null}
                </b>
              </button>
            ) : null}

            {rankingMovementReady ? (
              <div className="stationRankingTrendBalance">
                <div className="stationRankingTrendBalanceHeading">
                  <span aria-hidden="true">≋</span>

                  <span>
                    <small>BALANCE DEL RANKING</small>
                    <strong>
                      {rankingMovementSummary.up} SUBEN ·{" "}
                      {rankingMovementSummary.down} BAJAN ·{" "}
                      {rankingMovementSummary.steady} MANTIENEN
                    </strong>
                  </span>

                  <b>{rankingMovementTotal} EMISORAS</b>
                </div>

                <div
                  className="stationRankingTrendBalanceTrack"
                  aria-label={`${rankingMovementSummary.up} suben, ${rankingMovementSummary.down} bajan y ${rankingMovementSummary.steady} mantienen su posición`}
                >
                  {rankingMovementUpShare > 0 ? (
                    <span
                      className="up"
                      style={{
                        width: `${rankingMovementUpShare}%`,
                      }}
                      title={`${rankingMovementUpShare}% suben`}
                    />
                  ) : null}

                  {rankingMovementSteadyShare > 0 ? (
                    <span
                      className="steady"
                      style={{
                        width: `${rankingMovementSteadyShare}%`,
                      }}
                      title={`${rankingMovementSteadyShare}% mantienen`}
                    />
                  ) : null}

                  {rankingMovementDownShare > 0 ? (
                    <span
                      className="down"
                      style={{
                        width: `${rankingMovementDownShare}%`,
                      }}
                      title={`${rankingMovementDownShare}% bajan`}
                    />
                  ) : null}
                </div>

                <div className="stationRankingTrendBalanceLegend">
                  <span className="up">
                    <i aria-hidden="true" />
                    SUBEN {rankingMovementUpShare}%
                  </span>

                  <span className="steady">
                    <i aria-hidden="true" />
                    MANTIENEN {rankingMovementSteadyShare}%
                  </span>

                  <span className="down">
                    <i aria-hidden="true" />
                    BAJAN {rankingMovementDownShare}%
                  </span>
                </div>
              </div>
            ) : null}

            {rankingMovementReady ? (
              <div
                className={
                  podiumChanged
                    ? "stationRankingPodiumChange active"
                    : "stationRankingPodiumChange stable"
                }
              >
                <div className="stationRankingPodiumChangeHeading">
                  <span aria-hidden="true">
                    {podiumChanged ? "◆" : "◇"}
                  </span>

                  <span>
                    <small>CAMBIOS EN EL PODIO</small>
                    <strong>
                      {podiumChanged
                        ? "EL TOP 3 CAMBIÓ DE POSICIONES"
                        : "PODIO ESTABLE"}
                    </strong>
                  </span>

                  <b>
                    {podiumChanged
                      ? `${podiumChanges.entered.length} ENTRA · ${podiumChanges.exited.length} SALE`
                      : "SIN CAMBIOS"}
                  </b>
                </div>

                {currentLeaderStation ? (
                  <div
                    className={
                      leadershipChanged
                        ? "stationRankingLeadershipChange changed"
                        : "stationRankingLeadershipChange stable"
                    }
                  >
                    <button
                      type="button"
                      className={
                        currentLeaderStation.id === selected.id
                          ? "stationRankingLeadershipCurrent selectedLeadership"
                          : "stationRankingLeadershipCurrent"
                      }
                      onClick={() =>
                        revealRankingTrendStation(
                          currentLeaderStation.id,
                        )
                      }
                      title={
                        currentLeaderStation.id === selected.id
                          ? `Tu emisora ${currentLeaderStation.name} es líder actual`
                          : `Ir a ${currentLeaderStation.name}, líder actual`
                      }
                    >
                      <span aria-hidden="true">
                        {leadershipChanged ? "★" : "◆"}
                      </span>

                      <span>
                        <small>
                          {currentLeaderStation.id === selected.id
                            ? leadershipChanged
                              ? "TU EMISORA · NUEVO LÍDER"
                              : "TU EMISORA · LÍDER SE MANTIENE"
                            : leadershipChanged
                              ? "NUEVO LÍDER"
                              : "LÍDER SE MANTIENE"}
                        </small>
                        <strong>
                          {currentLeaderStation.shortName ||
                            currentLeaderStation.name}
                        </strong>

                        <em
                          title={
                            currentLeaderInfo?.artist
                              ? `${currentLeaderInfo.title} — ${currentLeaderInfo.artist}`
                              : currentLeaderInfo?.title
                          }
                        >
                          <i>SONANDO</i>{" "}
                          {currentLeaderInfo?.artist
                            ? `${currentLeaderInfo.title} — ${currentLeaderInfo.artist}`
                            : currentLeaderInfo?.title ||
                              "Programación en vivo"}
                        </em>

                        {currentLeaderStation.id === selected.id &&
                        secondVisibleStation ? (
                          <span
                            className={
                              leadershipRaceCollapsed
                                ? "stationRankingLeadershipDefenseGroup collapsed"
                                : "stationRankingLeadershipDefenseGroup"
                            }
                          >
                            <span
                              className={
                                (leaderAudienceAdvantage ?? 0) > 0
                                  ? "stationRankingLeadershipDefense leading"
                                  : "stationRankingLeadershipDefense tied"
                              }
                            >
                              <i aria-hidden="true">
                                {(leaderAudienceAdvantage ?? 0) > 0
                                  ? "◆"
                                  : "↔"}
                              </i>

                              {(leaderAudienceAdvantage ?? 0) > 0
                                ? `DEFENDIENDO EL #1 · +${leaderAudienceAdvantage} ${
                                    leaderAudienceAdvantage === 1
                                      ? "OYENTE"
                                      : "OYENTES"
                                  } SOBRE #2`
                                : "EMPATE EN EL LIDERATO"}
                            </span>

                            <span
                              className={
                                leaderAudienceAdvantage === 0
                                  ? "stationRankingLeadershipStatus tied"
                                  : leadershipAdvantageTrend === null
                                    ? "stationRankingLeadershipStatus active"
                                    : leadershipAdvantageTrend > 0
                                      ? "stationRankingLeadershipStatus stronger"
                                      : leadershipAdvantageTrend < 0
                                        ? "stationRankingLeadershipStatus warning"
                                        : "stationRankingLeadershipStatus steady"
                              }
                            >
                              <small>ESTADO DEL DUELO</small>

                              <strong>
                                {leaderAudienceAdvantage === 0
                                  ? "EMPATE EN LA CIMA"
                                  : leadershipAdvantageTrend === null
                                    ? "LIDERATO ACTIVO"
                                    : leadershipAdvantageTrend > 0
                                      ? "LIDERATO SE FORTALECE"
                                      : leadershipAdvantageTrend < 0
                                        ? "#2 SE ACERCA"
                                        : "VENTAJA ESTABLE"}
                              </strong>

                              <i aria-hidden="true">
                                {leaderAudienceAdvantage === 0
                                  ? "="
                                  : leadershipAdvantageTrend === null
                                    ? "●"
                                    : leadershipAdvantageTrend > 0
                                      ? "↑"
                                      : leadershipAdvantageTrend < 0
                                        ? "!"
                                        : "—"}
                              </i>
                            </span>

                            {leadershipAdvantageTrend !== null ? (
                              <span
                                className={
                                  leadershipAdvantageTrend > 0
                                    ? "stationRankingLeadershipDefenseTrend growing"
                                    : leadershipAdvantageTrend < 0
                                      ? "stationRankingLeadershipDefenseTrend shrinking"
                                      : "stationRankingLeadershipDefenseTrend steady"
                                }
                              >
                                <i aria-hidden="true">
                                  {leadershipAdvantageTrend > 0
                                    ? "↑"
                                    : leadershipAdvantageTrend < 0
                                      ? "↓"
                                      : "—"}
                                </i>

                                <small>TENDENCIA DE VENTAJA</small>

                                <strong>
                                  {leadershipAdvantageTrend > 0
                                    ? `CRECE +${leadershipAdvantageTrend}`
                                    : leadershipAdvantageTrend < 0
                                      ? `SE REDUCE ${Math.abs(
                                          leadershipAdvantageTrend,
                                        )}`
                                      : "SE MANTIENE"}
                                </strong>
                              </span>
                            ) : null}

                            {selectedRankingListenerChange !== null &&
                            secondVisibleRankingListenerChange !== null ? (
                              <span className="stationRankingLeadershipRace">
                                <small>RITMO DEL DUELO</small>

                                <span
                                  className={
                                    (leaderAudienceAdvantage ?? 0) > 0
                                      ? "stationRankingLeadershipRaceGap leading"
                                      : "stationRankingLeadershipRaceGap tied"
                                  }
                                  title="Diferencia actual de audiencia entre el primer y segundo lugar"
                                >
                                  <i aria-hidden="true">
                                    {(leaderAudienceAdvantage ?? 0) > 0
                                      ? "↔"
                                      : "="}
                                  </i>

                                  <b>DIFERENCIA ACTUAL</b>

                                  <strong>
                                    {(leaderAudienceAdvantage ?? 0) > 0
                                      ? `+${leaderAudienceAdvantage} ${
                                          leaderAudienceAdvantage === 1
                                            ? "OYENTE"
                                            : "OYENTES"
                                        }`
                                      : "EMPATE"}
                                  </strong>

                                  <em
                                    className={
                                      leaderRelativeAdvantage > 0
                                        ? "relativeLeading"
                                        : "relativeTied"
                                    }
                                    title="Ventaja porcentual del líder respecto a la audiencia de la emisora número dos"
                                  >
                                    <small>VENTAJA RELATIVA</small>
                                    <b>
                                      {leaderRelativeAdvantage > 0
                                        ? `+${leaderRelativeAdvantage}%`
                                        : "0%"}
                                    </b>
                                  </em>
                                </span>

                                <span
                                  className={
                                    selectedRankingListenerChange > 0
                                      ? "positive"
                                      : selectedRankingListenerChange < 0
                                        ? "negative"
                                        : "neutral"
                                  }
                                >
                                  <i aria-hidden="true">●</i>
                                  <b>TU EMISORA</b>
                                  <strong>
                                    {selectedRankingListenerChange > 0
                                      ? `+${selectedRankingListenerChange}`
                                      : selectedRankingListenerChange}
                                    {" "}OY
                                  </strong>
                                </span>

                                <span
                                  className={
                                    secondVisibleRankingListenerChange > 0
                                      ? "positive"
                                      : secondVisibleRankingListenerChange < 0
                                        ? "negative"
                                        : "neutral"
                                  }
                                >
                                  <i aria-hidden="true">●</i>
                                  <b>
                                    #2{" "}
                                    {secondVisibleStation.shortName ||
                                      secondVisibleStation.name}
                                  </b>
                                  <strong>
                                    {secondVisibleRankingListenerChange > 0
                                      ? `+${secondVisibleRankingListenerChange}`
                                      : secondVisibleRankingListenerChange}
                                    {" "}OY
                                  </strong>
                                </span>

                                <span
                                  className="stationRankingLeadershipRaceNow selectedNow"
                                  title={
                                    selectedInfo.artist
                                      ? `${selectedInfo.title} — ${selectedInfo.artist}`
                                      : selectedInfo.title
                                  }
                                >
                                  <i aria-hidden="true">♫</i>

                                  <span>
                                    <small>TU EMISORA SONANDO AHORA</small>
                                    <strong>
                                      {selectedInfo.title ||
                                        "Programación en vivo"}
                                    </strong>

                                    {selectedInfo.artist ? (
                                      <em>{selectedInfo.artist}</em>
                                    ) : null}
                                  </span>
                                </span>

                                <span
                                  className="stationRankingLeadershipRaceNow rivalNow"
                                  title={
                                    secondVisibleStationInfo?.artist
                                      ? `${secondVisibleStationInfo.title} — ${secondVisibleStationInfo.artist}`
                                      : secondVisibleStationInfo?.title
                                  }
                                >
                                  <i aria-hidden="true">♪</i>

                                  <span>
                                    <small>#2 SONANDO AHORA</small>
                                    <strong>
                                      {secondVisibleStationInfo?.title ||
                                        "Programación en vivo"}
                                    </strong>

                                    {secondVisibleStationInfo?.artist ? (
                                      <em>
                                        {secondVisibleStationInfo.artist}
                                      </em>
                                    ) : null}
                                  </span>
                                </span>

                                <span className="stationRankingLeadershipRaceActions">
                                  <button
                                    type="button"
                                    className="stationRankingLeadershipRaceHome"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      revealRankingTrendStation(
                                        selected.id,
                                      );
                                    }}
                                    title={`Volver a ${selected.name}, tu emisora líder`}
                                    aria-label={`Ver tu emisora ${selected.name} dentro del ranking`}
                                  >
                                    <span aria-hidden="true">↑</span>
                                    VER TU EMISORA
                                  </button>

                                  <button
                                    type="button"
                                    className={
                                      selected.id === selected.id && playing
                                        ? "stationRankingLeadershipRaceHomeListen active"
                                        : "stationRankingLeadershipRaceHomeListen"
                                    }
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      playStation(selected);
                                    }}
                                    title={
                                      playing
                                        ? `Pausar ${selected.name}`
                                        : `Escuchar ${selected.name}, tu emisora líder`
                                    }
                                    aria-label={
                                      playing
                                        ? `Pausar tu emisora ${selected.name}`
                                        : `Escuchar tu emisora ${selected.name}`
                                    }
                                  >
                                    <span aria-hidden="true">
                                      {playing ? "❚❚" : "▶"}
                                    </span>
                                    {playing
                                      ? "PAUSAR TU EMISORA"
                                      : "ESCUCHAR TU EMISORA"}
                                  </button>

                                  <button
                                    type="button"
                                    className="stationRankingLeadershipRaceTarget"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      revealRankingTrendStation(
                                        secondVisibleStation.id,
                                      );
                                    }}
                                    title={`Ir a ${secondVisibleStation.name}, emisora número dos`}
                                    aria-label={`Ver la emisora número dos ${secondVisibleStation.name} dentro del ranking`}
                                  >
                                    <span aria-hidden="true">↓</span>
                                    VER #2
                                  </button>

                                  <button
                                    type="button"
                                    className={
                                      secondVisibleStation.id === selected.id &&
                                      playing
                                        ? "stationRankingLeadershipRaceListen active"
                                        : "stationRankingLeadershipRaceListen"
                                    }
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      playStation(secondVisibleStation);
                                    }}
                                    title={`Escuchar ${secondVisibleStation.name}, emisora número dos`}
                                    aria-label={`Escuchar la emisora número dos ${secondVisibleStation.name}`}
                                  >
                                    <span aria-hidden="true">
                                      {secondVisibleStation.id === selected.id &&
                                      playing
                                        ? "❚❚"
                                        : "▶"}
                                    </span>
                                    ESCUCHAR #2
                                  </button>
                                </span>
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                      </span>

                      <b>#1</b>
                    </button>

                    {currentLeaderStation.id === selected.id &&
                    secondVisibleStation ? (
                      <button
                        type="button"
                        className={
                          leadershipRaceCollapsed
                            ? "stationRankingLeadershipRaceToggle collapsed"
                            : "stationRankingLeadershipRaceToggle"
                        }
                        onClick={() =>
                          setLeadershipRaceCollapsed(
                            (current) => !current,
                          )
                        }
                        aria-expanded={!leadershipRaceCollapsed}
                        title={
                          leadershipRaceCollapsed
                            ? "Mostrar nuevamente todos los detalles del duelo por el liderato"
                            : "Minimizar los detalles del duelo por el liderato"
                        }
                      >
                        <span aria-hidden="true">
                          {leadershipRaceCollapsed ? "＋" : "−"}
                        </span>

                        <strong>
                          {leadershipRaceCollapsed
                            ? "MOSTRAR DUELO"
                            : "MINIMIZAR DUELO"}
                        </strong>

                        <em>
                          #1 VS #2
                          {leaderAudienceAdvantage !== null &&
                          (leaderAudienceAdvantage ?? 0) > 0
                            ? ` · +${leaderAudienceAdvantage} ${
                                leaderAudienceAdvantage === 1
                                  ? "OYENTE"
                                  : "OYENTES"
                              }`
                            : " · EMPATE"}
                        </em>

                        {leadershipRaceCollapsed ? (
                          <>
                            <span className="stationRankingLeadershipRaceCollapsedLeader">
                              <span className="stationRankingLeadershipCollapsedLogo leaderLogo">
                                <img
                                  src={selected.logo}
                                  alt=""
                                  aria-hidden="true"
                                />
                              </span>

                              <small>TU EMISORA #1</small>

                              <b>
                                {selected.shortName || selected.name}
                              </b>

                              <button
                                type="button"
                                className={
                                  playing
                                    ? "stationRankingLeadershipPlayingMark playing"
                                    : "stationRankingLeadershipPlayingMark paused"
                                }
                                onClick={() => playStation(selected)}
                                title={
                                  playing
                                    ? "Pausar tu emisora"
                                    : "Reproducir tu emisora"
                                }
                                aria-label={
                                  playing
                                    ? `Pausar ${selected.name}`
                                    : `Reproducir ${selected.name}`
                                }
                                aria-pressed={playing}
                              >
                                <i aria-hidden="true">
                                  {playing ? "●" : "▶"}
                                </i>

                                <span>
                                  {playing
                                    ? "EN REPRODUCCIÓN"
                                    : "REPRODUCCIÓN PAUSADA"}
                                </span>
                              </button>

                              {favoriteStations.includes(selected.id) ? (
                                <span
                                  className="stationRankingLeadershipFavoriteMark leaderFavorite"
                                  title="Tu emisora está guardada en favoritas"
                                >
                                  <i aria-hidden="true">♥</i>
                                  FAVORITA
                                </span>
                              ) : null}

                              <i>
                                {selectedRankingListeners ?? 0}{" "}
                                {(selectedRankingListeners ?? 0) === 1
                                  ? "OYENTE"
                                  : "OYENTES"}
                              </i>

                              {selectedRankingListenerChange !== null ? (
                                <em
                                  className={
                                    selectedRankingListenerChange > 0
                                      ? "audienceUp"
                                      : selectedRankingListenerChange < 0
                                        ? "audienceDown"
                                        : "audienceSteady"
                                  }
                                  title="Cambio de audiencia de tu emisora desde la última actualización"
                                >
                                  {selectedRankingListenerChange > 0
                                    ? `↑ +${selectedRankingListenerChange} OY`
                                    : selectedRankingListenerChange < 0
                                      ? `↓ ${Math.abs(
                                          selectedRankingListenerChange,
                                        )} OY`
                                      : "— 0 OY"}
                                </em>
                              ) : null}

                              {selectedRankingMovement !== null ? (
                                <span
                                  className={
                                    selectedRankingMovement > 0
                                      ? "stationRankingLeadershipCollapsedMovement selectedMovement up"
                                      : selectedRankingMovement < 0
                                        ? "stationRankingLeadershipCollapsedMovement selectedMovement down"
                                        : "stationRankingLeadershipCollapsedMovement selectedMovement steady"
                                  }
                                  title="Movimiento de tu emisora dentro del ranking"
                                >
                                  <i aria-hidden="true">
                                    {selectedRankingMovement > 0
                                      ? "↑"
                                      : selectedRankingMovement < 0
                                        ? "↓"
                                        : "—"}
                                  </i>

                                  <small>MOVIMIENTO DE TU EMISORA</small>

                                  <b>
                                    {selectedRankingMovement > 0
                                      ? `SUBE ${selectedRankingMovement}`
                                      : selectedRankingMovement < 0
                                        ? `BAJA ${Math.abs(
                                            selectedRankingMovement,
                                          )}`
                                        : selectedVisiblePosition === 1
                                          ? "MANTIENE #1"
                                          : `MANTIENE #${selectedVisiblePosition ?? "—"}`}
                                  </b>
                                </span>
                              ) : null}

                              <strong
                                title={
                                  selectedInfo.artist
                                    ? `${selectedInfo.title} — ${selectedInfo.artist}`
                                    : selectedInfo.title
                                }
                              >
                                ♪{" "}
                                {selectedInfo.artist
                                  ? `${selectedInfo.title} — ${selectedInfo.artist}`
                                  : selectedInfo.title ||
                                    "Programación en vivo"}
                              </strong>
                            </span>

                            <span
                              className={
                                leadershipPulseCollapsed
                                  ? "stationRankingLeadershipHeadToHeadPulse collapsed"
                                  : "stationRankingLeadershipHeadToHeadPulse"
                              }
                            >
                              <span className="stationRankingLeadershipHeadToHeadHeading">
                                <small>PULSO DEL DUELO</small>

                                {leadershipPulseCollapsed ? (
                                  <>
                                    <strong className="stationRankingLeadershipHeadToHeadCollapsedSummary">
                                      TU EMISORA {leaderHeadToHeadShare}% · RIVAL #2{" "}
                                      {challengerHeadToHeadShare}%
                                    </strong>

                                    <span
                                      className={
                                        headToHeadShareGap === 0
                                          ? "stationRankingLeadershipHeadToHeadCollapsedAdvantage tied"
                                          : headToHeadShareGap <= 4
                                            ? "stationRankingLeadershipHeadToHeadCollapsedAdvantage close"
                                            : "stationRankingLeadershipHeadToHeadCollapsedAdvantage leading"
                                      }
                                      title="Ventaja actual dentro del pulso minimizado"
                                    >
                                      <i aria-hidden="true">
                                        {headToHeadShareGap === 0
                                          ? "="
                                          : headToHeadShareGap <= 4
                                            ? "↔"
                                            : "◆"}
                                      </i>

                                      <b>
                                        {headToHeadShareGap === 0
                                          ? "EMPATE"
                                          : `VENTAJA +${headToHeadShareGap} ${
                                              headToHeadShareGap === 1
                                                ? "PTO"
                                                : "PTS"
                                            }`}
                                      </b>
                                    </span>

                                    {headToHeadMomentWinner !== "pending" ? (
                                      <span
                                        className={`stationRankingLeadershipHeadToHeadCollapsedMoment ${headToHeadMomentWinner}`}
                                        title="Quién gana el momento según el cambio reciente de audiencia"
                                      >
                                        <i aria-hidden="true">
                                          {headToHeadMomentWinner === "leader"
                                            ? "★"
                                            : headToHeadMomentWinner === "rival"
                                              ? "▲"
                                              : "="}
                                        </i>

                                        <b>
                                          {headToHeadMomentWinner === "leader"
                                            ? "TU EMISORA GANA EL MOMENTO"
                                            : headToHeadMomentWinner === "rival"
                                              ? "RIVAL GANA EL MOMENTO"
                                              : "MOMENTO EMPATADO"}
                                        </b>
                                      </span>
                                    ) : null}

                                    {headToHeadPulseTrend !== null ? (
                                      <span
                                        className={
                                          headToHeadPulseTrend > 0
                                            ? "stationRankingLeadershipHeadToHeadCollapsedTrend opening"
                                            : headToHeadPulseTrend < 0
                                              ? "stationRankingLeadershipHeadToHeadCollapsedTrend closing"
                                              : "stationRankingLeadershipHeadToHeadCollapsedTrend steady"
                                        }
                                        title="Tendencia actual del pulso del duelo"
                                      >
                                        <i aria-hidden="true">
                                          {headToHeadPulseTrend > 0
                                            ? "↑"
                                            : headToHeadPulseTrend < 0
                                              ? "↓"
                                              : "—"}
                                        </i>

                                        <b>
                                          {headToHeadPulseTrend > 0
                                            ? `SE ABRE +${headToHeadPulseTrend} ${
                                                headToHeadPulseTrend === 1
                                                  ? "OY"
                                                  : "OY"
                                              }`
                                            : headToHeadPulseTrend < 0
                                              ? `SE CIERRA ${Math.abs(
                                                  headToHeadPulseTrend,
                                                )} OY`
                                              : "SE MANTIENE"}
                                        </b>
                                      </span>
                                    ) : null}

                                    <button
                                      type="button"
                                      className="stationRankingLeadershipHeadToHeadCollapsedBar"
                                      onClick={() =>
                                        setLeadershipPulseCollapsed(false)
                                      }
                                      title={`Abrir pulso del duelo: tu emisora ${leaderHeadToHeadShare}% y rival número dos ${challengerHeadToHeadShare}%`}
                                      aria-label={`Abrir pulso del duelo. Tu emisora ${leaderHeadToHeadShare}% y rival número dos ${challengerHeadToHeadShare}%`}
                                    >
                                      <i
                                        className="leader"
                                        style={{
                                          width: `${leaderHeadToHeadShare}%`,
                                        }}
                                      />

                                      <i
                                        className="rival"
                                        style={{
                                          width: `${challengerHeadToHeadShare}%`,
                                        }}
                                      />

                                      <span
                                        className="midpoint"
                                        aria-hidden="true"
                                      />

                                      <span
                                        className="leaderMarker"
                                        style={{
                                          left: `${leaderHeadToHeadShare}%`,
                                        }}
                                        aria-hidden="true"
                                      >
                                        ◆
                                      </span>

                                      <span
                                        className="rivalMarker"
                                        style={{
                                          left: `${challengerHeadToHeadShare}%`,
                                        }}
                                        aria-hidden="true"
                                      >
                                        ◆
                                      </span>
                                    </button>

                                    <span className="stationRankingLeadershipCollapsedMarkerLegend">
                                      <small>
                                        <i className="leader" aria-hidden="true">
                                          ◆
                                        </i>
                                        TU EMISORA
                                      </small>

                                      <small>
                                        <i className="rival" aria-hidden="true">
                                          ◆
                                        </i>
                                        RIVAL #2
                                      </small>
                                    </span>
                                  </>
                                ) : null}

                                {rankingUpdatedAt ? (
                                  <em
                                    title="Hora de la última actualización real del ranking"
                                  >
                                    <i aria-hidden="true">◷</i>
                                    ACTUALIZADO {rankingUpdatedAt}
                                  </em>
                                ) : null}

                                <button
                                  type="button"
                                  className="stationRankingLeadershipHeadToHeadToggle"
                                  onClick={() =>
                                    setLeadershipPulseCollapsed(
                                      (current) => !current,
                                    )
                                  }
                                  aria-expanded={!leadershipPulseCollapsed}
                                  title={
                                    leadershipPulseCollapsed
                                      ? "Mostrar detalles del pulso del duelo"
                                      : "Minimizar pulso del duelo"
                                  }
                                >
                                  <span aria-hidden="true">
                                    {leadershipPulseCollapsed ? "+" : "−"}
                                  </span>
                                  {leadershipPulseCollapsed
                                    ? "MOSTRAR PULSO"
                                    : "MINIMIZAR PULSO"}
                                </button>
                              </span>

                              <span className="stationRankingLeadershipHeadToHeadLabels">
                                <b>
                                  TU EMISORA {leaderHeadToHeadShare}%
                                </b>

                                <b>
                                  RIVAL #2 {challengerHeadToHeadShare}%
                                </b>
                              </span>

                              <span
                                className={
                                  headToHeadShareGap === 0
                                    ? "stationRankingLeadershipHeadToHeadAdvantage tied"
                                    : headToHeadShareGap <= 4
                                      ? "stationRankingLeadershipHeadToHeadAdvantage close"
                                      : "stationRankingLeadershipHeadToHeadAdvantage leading"
                                }
                              >
                                <i aria-hidden="true">
                                  {headToHeadShareGap === 0
                                    ? "="
                                    : headToHeadShareGap <= 4
                                      ? "↔"
                                      : "◆"}
                                </i>

                                <strong>
                                  {headToHeadShareGap === 0
                                    ? "PULSO EMPATADO"
                                    : `VENTAJA DE TU EMISORA · +${headToHeadShareGap} ${
                                        headToHeadShareGap === 1
                                          ? "PTO"
                                          : "PTS"
                                      }`}
                                </strong>
                              </span>

                              {headToHeadPulseTrend !== null ? (
                                <span
                                  className={
                                    headToHeadPulseTrend > 0
                                      ? "stationRankingLeadershipHeadToHeadTrend opening"
                                      : headToHeadPulseTrend < 0
                                        ? "stationRankingLeadershipHeadToHeadTrend closing"
                                        : "stationRankingLeadershipHeadToHeadTrend steady"
                                  }
                                >
                                  <small>TENDENCIA DEL PULSO</small>

                                  <i aria-hidden="true">
                                    {headToHeadPulseTrend > 0
                                      ? "↑"
                                      : headToHeadPulseTrend < 0
                                        ? "↓"
                                        : "—"}
                                  </i>

                                  <strong>
                                    {headToHeadPulseTrend > 0
                                      ? `SE ABRE +${headToHeadPulseTrend} ${
                                          headToHeadPulseTrend === 1
                                            ? "OYENTE"
                                            : "OYENTES"
                                        }`
                                      : headToHeadPulseTrend < 0
                                        ? `SE CIERRA ${Math.abs(
                                            headToHeadPulseTrend,
                                          )} ${
                                            Math.abs(headToHeadPulseTrend) === 1
                                              ? "OYENTE"
                                              : "OYENTES"
                                          }`
                                        : "SE MANTIENE"}
                                  </strong>
                                </span>
                              ) : null}

                              {headToHeadMomentWinner !== "pending" ? (
                                <span
                                  className={`stationRankingLeadershipMomentWinner ${headToHeadMomentWinner}`}
                                  title="Comparación del cambio reciente de audiencia entre el líder y el rival número dos"
                                >
                                  <small>QUIÉN GANA EL MOMENTO</small>

                                  <span>
                                    <i aria-hidden="true">
                                      {headToHeadMomentWinner === "leader"
                                        ? "★"
                                        : headToHeadMomentWinner === "rival"
                                          ? "▲"
                                          : "="}
                                    </i>

                                    <b>
                                      {headToHeadMomentWinner === "leader"
                                        ? "TU EMISORA GANA EL MOMENTO"
                                        : headToHeadMomentWinner === "rival"
                                          ? "RIVAL GANA EL MOMENTO"
                                          : "MOMENTO EMPATADO"}
                                    </b>
                                  </span>

                                  <em>
                                    {headToHeadMomentWinner === "leader"
                                      ? `TU EMISORA +${Math.abs(
                                          headToHeadPulseTrend ?? 0,
                                        )} ${
                                          Math.abs(
                                            headToHeadPulseTrend ?? 0,
                                          ) === 1
                                            ? "OYENTE"
                                            : "OYENTES"
                                        } DE IMPULSO`
                                      : headToHeadMomentWinner === "rival"
                                        ? `RIVAL +${Math.abs(
                                            headToHeadPulseTrend ?? 0,
                                          )} ${
                                            Math.abs(
                                              headToHeadPulseTrend ?? 0,
                                            ) === 1
                                              ? "OYENTE"
                                              : "OYENTES"
                                          } DE IMPULSO`
                                        : "IMPULSO IGUALADO"}
                                  </em>
                                </span>
                              ) : null}

                              <span
                                className="stationRankingLeadershipHeadToHeadBar"
                                aria-label={`Pulso del duelo: tu emisora ${leaderHeadToHeadShare}% y rival número dos ${challengerHeadToHeadShare}%`}
                              >
                                <i
                                  className="leader"
                                  style={{
                                    width: `${leaderHeadToHeadShare}%`,
                                  }}
                                />

                                <i
                                  className="rival"
                                  style={{
                                    width: `${challengerHeadToHeadShare}%`,
                                  }}
                                />

                                <span
                                  className="stationRankingLeadershipHeadToHeadMidpoint"
                                  aria-hidden="true"
                                />

                                <button
                                  type="button"
                                  className="stationRankingLeadershipHeadToHeadLeaderMarker"
                                  style={{
                                    left: `${leaderHeadToHeadShare}%`,
                                  }}
                                  onClick={() =>
                                    revealRankingTrendStation(selected.id)
                                  }
                                  title={`Ver ${selected.name} en el ranking · ${leaderHeadToHeadShare}% del pulso`}
                                  aria-label={`Ver tu emisora ${selected.name} en el ranking. ${leaderHeadToHeadShare}% del pulso`}
                                >
                                  <i aria-hidden="true">◆</i>

                                  <b>
                                    {leaderHeadToHeadShare}%
                                  </b>

                                  <span
                                    className={
                                      leaderHeadToHeadShare < 35
                                        ? "stationRankingLeadershipMarkerActionLabel leaderAction flipRight"
                                        : "stationRankingLeadershipMarkerActionLabel leaderAction"
                                    }
                                    aria-hidden="true"
                                  >
                                    <span className="stationRankingLeadershipMarkerIdentity">
                                      <span className="stationRankingLeadershipMarkerLogo leaderLogo">
                                        <img
                                          src={selected.logo}
                                          alt=""
                                          aria-hidden="true"
                                        />
                                      </span>

                                      <span>
                                        <small>VER TU EMISORA</small>

                                        <b>
                                          {selected.shortName || selected.name}
                                        </b>

                                        <em className="stationRankingLeadershipMarkerGenre">
                                          {selected.genre}
                                        </em>

                                        {selected.slogan ? (
                                          <span className="stationRankingLeadershipMarkerSlogan">
                                            {selected.slogan}
                                          </span>
                                        ) : null}
                                      </span>
                                    </span>

                                    <span className="stationRankingLeadershipMarkerStatusRow">
                                      <span
                                        className={
                                          playing
                                            ? "stationRankingLeadershipMarkerAudioStatus playing"
                                            : "stationRankingLeadershipMarkerAudioStatus paused"
                                        }
                                      >
                                        <i aria-hidden="true">
                                          {playing ? "●" : "Ⅱ"}
                                        </i>
                                        {playing
                                          ? "EN REPRODUCCIÓN"
                                          : "PAUSADA"}
                                      </span>

                                      {favoriteStations.includes(selected.id) ? (
                                        <span className="stationRankingLeadershipMarkerFavoriteStatus">
                                          <i aria-hidden="true">♥</i>
                                          FAVORITA
                                        </span>
                                      ) : null}
                                    </span>

                                    <span className="stationRankingLeadershipMarkerAudience">
                                      <i aria-hidden="true">●</i>
                                      #1 · {selectedRankingListeners ?? 0}{" "}
                                      {(selectedRankingListeners ?? 0) === 1
                                        ? "OYENTE"
                                        : "OYENTES"}
                                    </span>

                                    {selectedRankingListenerChange !== null ? (
                                      <span
                                        className={
                                          selectedRankingListenerChange > 0
                                            ? "stationRankingLeadershipMarkerChange positive"
                                            : selectedRankingListenerChange < 0
                                              ? "stationRankingLeadershipMarkerChange negative"
                                              : "stationRankingLeadershipMarkerChange neutral"
                                        }
                                      >
                                        {selectedRankingListenerChange > 0
                                          ? `↑ +${selectedRankingListenerChange} OY`
                                          : selectedRankingListenerChange < 0
                                            ? `↓ ${Math.abs(
                                                selectedRankingListenerChange,
                                              )} OY`
                                            : "— 0 OY"}
                                      </span>
                                    ) : null}

                                    {selectedRankingMovement !== null ? (
                                      <span
                                        className={
                                          selectedRankingMovement > 0
                                            ? "stationRankingLeadershipMarkerMovement up"
                                            : selectedRankingMovement < 0
                                              ? "stationRankingLeadershipMarkerMovement down"
                                              : "stationRankingLeadershipMarkerMovement steady"
                                        }
                                      >
                                        <i aria-hidden="true">
                                          {selectedRankingMovement > 0
                                            ? "↑"
                                            : selectedRankingMovement < 0
                                              ? "↓"
                                              : "—"}
                                        </i>

                                        {selectedRankingMovement > 0
                                          ? `SUBE ${selectedRankingMovement}`
                                          : selectedRankingMovement < 0
                                            ? `BAJA ${Math.abs(
                                                selectedRankingMovement,
                                              )}`
                                            : "MANTIENE #1"}
                                      </span>
                                    ) : null}

                                    <span className="stationRankingLeadershipMarkerNowPlaying">
                                      <span className="stationRankingLeadershipMarkerArtwork">
                                        <img
                                          src={selectedArtwork}
                                          alt=""
                                          aria-hidden="true"
                                        />
                                      </span>

                                      <span>
                                        <span className="stationRankingLeadershipMarkerNowPlayingHeading">
                                          <small>SONANDO AHORA</small>

                                          <span className="stationRankingLeadershipMarkerLiveBadge">
                                            <span
                                              className="stationRankingLeadershipMarkerLiveBars"
                                              aria-hidden="true"
                                            >
                                              <i />
                                              <i />
                                              <i />
                                            </span>
                                            EN VIVO
                                          </span>
                                        </span>

                                        <em>
                                          {selectedInfo.artist
                                            ? `${selectedInfo.title} — ${selectedInfo.artist}`
                                            : selectedInfo.title ||
                                              "Programación en vivo"}
                                        </em>
                                      </span>
                                    </span>

                                    <span
                                      className={
                                        leaderAudienceAdvantage === 0
                                          ? "stationRankingLeadershipMarkerGap tied"
                                          : "stationRankingLeadershipMarkerGap leaderGap"
                                      }
                                    >
                                      <i aria-hidden="true">
                                        {leaderAudienceAdvantage === 0
                                          ? "="
                                          : "◆"}
                                      </i>

                                      {leaderAudienceAdvantage === 0
                                        ? "EMPATE EN EL LIDERATO"
                                        : `+${leaderAudienceAdvantage ?? 0} ${
                                            (leaderAudienceAdvantage ?? 0) === 1
                                              ? "OYENTE"
                                              : "OYENTES"
                                          } SOBRE #2`}
                                    </span>

                                    <span className="stationRankingLeadershipMarkerGoal leaderGoal">
                                      <i aria-hidden="true">%</i>
                                      {leaderAudienceAdvantage === 0
                                        ? "VENTAJA RELATIVA 0%"
                                        : `VENTAJA RELATIVA +${leaderRelativeAdvantage}%`}
                                    </span>

                                    {rankingUpdatedAt ? (
                                      <span className="stationRankingLeadershipMarkerUpdated">
                                        <i aria-hidden="true">◷</i>
                                        ACTUALIZADO {rankingUpdatedAt}
                                      </span>
                                    ) : null}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  className="stationRankingLeadershipHeadToHeadRivalMarker"
                                  style={{
                                    left: `${challengerHeadToHeadShare}%`,
                                  }}
                                  onClick={() =>
                                    revealRankingTrendStation(
                                      secondVisibleStation.id,
                                    )
                                  }
                                  title={`Ver ${secondVisibleStation.name} en el ranking · ${challengerHeadToHeadShare}% del pulso`}
                                  aria-label={`Ver rival número dos ${secondVisibleStation.name} en el ranking. ${challengerHeadToHeadShare}% del pulso`}
                                >
                                  <i aria-hidden="true">◆</i>

                                  <b>
                                    {challengerHeadToHeadShare}%
                                  </b>

                                  <span
                                    className={
                                      challengerHeadToHeadShare > 65
                                        ? "stationRankingLeadershipMarkerActionLabel rivalAction flipLeft"
                                        : "stationRankingLeadershipMarkerActionLabel rivalAction"
                                    }
                                    aria-hidden="true"
                                  >
                                    <span className="stationRankingLeadershipMarkerIdentity">
                                      <span className="stationRankingLeadershipMarkerLogo rivalLogo">
                                        <img
                                          src={secondVisibleStation.logo}
                                          alt=""
                                          aria-hidden="true"
                                        />
                                      </span>

                                      <span>
                                        <small>VER RIVAL #2</small>

                                        <b>
                                          {secondVisibleStation.shortName ||
                                            secondVisibleStation.name}
                                        </b>

                                        <em className="stationRankingLeadershipMarkerGenre rivalGenre">
                                          {secondVisibleStation.genre}
                                        </em>

                                        {secondVisibleStation.slogan ? (
                                          <span className="stationRankingLeadershipMarkerSlogan rivalSlogan">
                                            {secondVisibleStation.slogan}
                                          </span>
                                        ) : null}
                                      </span>
                                    </span>

                                    {favoriteStations.includes(
                                      secondVisibleStation.id,
                                    ) ? (
                                      <span className="stationRankingLeadershipMarkerStatusRow">
                                        <span className="stationRankingLeadershipMarkerFavoriteStatus rivalFavoriteStatus">
                                          <i aria-hidden="true">♥</i>
                                          FAVORITA
                                        </span>
                                      </span>
                                    ) : null}

                                    <span className="stationRankingLeadershipMarkerAudience rivalAudience">
                                      <i aria-hidden="true">●</i>
                                      #2 · {secondVisibleListeners}{" "}
                                      {secondVisibleListeners === 1
                                        ? "OYENTE"
                                        : "OYENTES"}
                                    </span>

                                    {secondVisibleRankingListenerChange !== null ? (
                                      <span
                                        className={
                                          secondVisibleRankingListenerChange > 0
                                            ? "stationRankingLeadershipMarkerChange positive"
                                            : secondVisibleRankingListenerChange < 0
                                              ? "stationRankingLeadershipMarkerChange negative"
                                              : "stationRankingLeadershipMarkerChange neutral"
                                        }
                                      >
                                        {secondVisibleRankingListenerChange > 0
                                          ? `↑ +${secondVisibleRankingListenerChange} OY`
                                          : secondVisibleRankingListenerChange < 0
                                            ? `↓ ${Math.abs(
                                                secondVisibleRankingListenerChange,
                                              )} OY`
                                            : "— 0 OY"}
                                      </span>
                                    ) : null}

                                    {secondVisibleRankingMovement !== null ? (
                                      <span
                                        className={
                                          secondVisibleRankingMovement > 0
                                            ? "stationRankingLeadershipMarkerMovement up"
                                            : secondVisibleRankingMovement < 0
                                              ? "stationRankingLeadershipMarkerMovement down"
                                              : "stationRankingLeadershipMarkerMovement steady"
                                        }
                                      >
                                        <i aria-hidden="true">
                                          {secondVisibleRankingMovement > 0
                                            ? "↑"
                                            : secondVisibleRankingMovement < 0
                                              ? "↓"
                                              : "—"}
                                        </i>

                                        {secondVisibleRankingMovement > 0
                                          ? `SUBE ${secondVisibleRankingMovement}`
                                          : secondVisibleRankingMovement < 0
                                            ? `BAJA ${Math.abs(
                                                secondVisibleRankingMovement,
                                              )}`
                                            : "MANTIENE #2"}
                                      </span>
                                    ) : null}

                                    <span className="stationRankingLeadershipMarkerNowPlaying rivalNowPlaying">
                                      <span className="stationRankingLeadershipMarkerArtwork rivalArtwork">
                                        <img
                                          src={secondVisibleArtwork}
                                          alt=""
                                          aria-hidden="true"
                                        />
                                      </span>

                                      <span>
                                        <span className="stationRankingLeadershipMarkerNowPlayingHeading">
                                          <small>SONANDO AHORA</small>

                                          <span className="stationRankingLeadershipMarkerLiveBadge rivalLive">
                                            <span
                                              className="stationRankingLeadershipMarkerLiveBars"
                                              aria-hidden="true"
                                            >
                                              <i />
                                              <i />
                                              <i />
                                            </span>
                                            EN VIVO
                                          </span>
                                        </span>

                                        <em>
                                          {secondVisibleStationInfo?.artist
                                            ? `${secondVisibleStationInfo.title} — ${secondVisibleStationInfo.artist}`
                                            : secondVisibleStationInfo?.title ||
                                              "Programación en vivo"}
                                        </em>
                                      </span>
                                    </span>

                                    <span
                                      className={
                                        rivalListenersToTie === 0
                                          ? "stationRankingLeadershipMarkerGap tied"
                                          : "stationRankingLeadershipMarkerGap rivalGap"
                                      }
                                    >
                                      <i aria-hidden="true">
                                        {rivalListenersToTie === 0
                                          ? "="
                                          : "▲"}
                                      </i>

                                      {rivalListenersToTie === 0
                                        ? "YA ESTÁ EMPATADO"
                                        : `A ${rivalListenersToTie} ${
                                            rivalListenersToTie === 1
                                              ? "OYENTE"
                                              : "OYENTES"
                                          } DE EMPATAR`}
                                    </span>

                                    <span className="stationRankingLeadershipMarkerGoal rivalGoal">
                                      <i aria-hidden="true">#1</i>
                                      {rivalListenersToLead === 1
                                        ? "1 OYENTE PARA SER #1"
                                        : `${rivalListenersToLead} OYENTES PARA SER #1`}
                                    </span>

                                    {rankingUpdatedAt ? (
                                      <span className="stationRankingLeadershipMarkerUpdated rivalUpdated">
                                        <i aria-hidden="true">◷</i>
                                        ACTUALIZADO {rankingUpdatedAt}
                                      </span>
                                    ) : null}
                                  </span>
                                </button>
                              </span>

                              <span className="stationRankingLeadershipHeadToHeadScaleLabels">
                                <small>
                                  TU EMISORA {leaderHeadToHeadShare}%
                                </small>

                                <small className="stationRankingLeadershipHeadToHeadMidpointLabel">
                                  50% EQUILIBRIO
                                </small>

                                <small>
                                  RIVAL #2 {challengerHeadToHeadShare}%
                                </small>
                              </span>

                              <span
                                className="stationRankingLeadershipHeadToHeadReferenceScale"
                                aria-hidden="true"
                              >
                                <small>0</small>
                                <small>25</small>
                                <small className="mid">50</small>
                                <small>75</small>
                                <small>100</small>
                              </span>

                              <span
                                className={
                                  leaderHeadToHeadShare > 50
                                    ? "stationRankingLeadershipEquilibriumDistance above"
                                    : leaderHeadToHeadShare < 50
                                      ? "stationRankingLeadershipEquilibriumDistance below"
                                      : "stationRankingLeadershipEquilibriumDistance tied"
                                }
                              >
                                <small>DISTANCIA AL EQUILIBRIO</small>

                                <b>
                                  {leaderHeadToHeadShare > 50
                                    ? `+${leaderHeadToHeadShare - 50} ${
                                        leaderHeadToHeadShare - 50 === 1
                                          ? "PTO"
                                          : "PTS"
                                      } SOBRE EL 50%`
                                    : leaderHeadToHeadShare < 50
                                      ? `${50 - leaderHeadToHeadShare} ${
                                          50 - leaderHeadToHeadShare === 1
                                            ? "PTO"
                                            : "PTS"
                                        } BAJO EL 50%`
                                      : "EN EQUILIBRIO"}
                                </b>
                              </span>
                            </span>

                            <span className="stationRankingLeadershipRaceCollapsedRival">
                              <span className="stationRankingLeadershipCollapsedLogo rivalLogo">
                                <img
                                  src={secondVisibleStation.logo}
                                  alt=""
                                  aria-hidden="true"
                                />
                              </span>

                              <small>RIVAL #2</small>

                            <b>
                              {secondVisibleStation.shortName ||
                                secondVisibleStation.name}
                            </b>

                            {favoriteStations.includes(
                              secondVisibleStation.id,
                            ) ? (
                              <span
                                className="stationRankingLeadershipFavoriteMark rivalFavorite"
                                title="El rival número dos está guardado en favoritas"
                              >
                                <i aria-hidden="true">♥</i>
                                FAVORITA
                              </span>
                            ) : null}

                            {rankingUpdatedAt ? (
                              <span
                                className="stationRankingLeadershipCollapsedUpdated"
                                title="Hora de la última actualización real del ranking"
                              >
                                <i aria-hidden="true">◷</i>
                                ACTUALIZADO {rankingUpdatedAt}
                              </span>
                            ) : null}

                            <i>
                              {secondVisibleListeners}{" "}
                              {secondVisibleListeners === 1
                                ? "OYENTE"
                                : "OYENTES"}
                            </i>

                            {secondVisibleRankingListenerChange !== null ? (
                              <em
                                className={
                                  secondVisibleRankingListenerChange > 0
                                    ? "audienceUp"
                                    : secondVisibleRankingListenerChange < 0
                                      ? "audienceDown"
                                      : "audienceSteady"
                                }
                                title="Cambio de audiencia de la emisora número dos desde la última actualización"
                              >
                                {secondVisibleRankingListenerChange > 0
                                  ? `↑ +${secondVisibleRankingListenerChange} OY`
                                  : secondVisibleRankingListenerChange < 0
                                    ? `↓ ${Math.abs(
                                        secondVisibleRankingListenerChange,
                                      )} OY`
                                    : "— 0 OY"}
                              </em>
                            ) : null}

                            {secondVisibleRankingMovement !== null ? (
                              <span
                                className={
                                  secondVisibleRankingMovement > 0
                                    ? "stationRankingLeadershipCollapsedMovement up"
                                    : secondVisibleRankingMovement < 0
                                      ? "stationRankingLeadershipCollapsedMovement down"
                                      : "stationRankingLeadershipCollapsedMovement steady"
                                }
                                title="Movimiento de la emisora número dos dentro del ranking"
                              >
                                <i aria-hidden="true">
                                  {secondVisibleRankingMovement > 0
                                    ? "↑"
                                    : secondVisibleRankingMovement < 0
                                      ? "↓"
                                      : "—"}
                                </i>

                                <small>MOVIMIENTO DEL RIVAL</small>

                                <b>
                                  {secondVisibleRankingMovement > 0
                                    ? `SUBE ${secondVisibleRankingMovement}`
                                    : secondVisibleRankingMovement < 0
                                      ? `BAJA ${Math.abs(
                                          secondVisibleRankingMovement,
                                        )}`
                                      : "MANTIENE #2"}
                                </b>
                              </span>
                            ) : null}

                            <span
                              className={
                                rivalLeaderReach >= 95
                                  ? "stationRankingLeadershipRivalReach critical"
                                  : rivalLeaderReach >= 85
                                    ? "stationRankingLeadershipRivalReach close"
                                    : "stationRankingLeadershipRivalReach normal"
                              }
                              title="Porcentaje de la audiencia del líder que ya alcanza la emisora número dos"
                            >
                              <small>ALCANCE SOBRE EL LÍDER</small>
                              <b>
                                RIVAL AL {rivalLeaderReach}% DEL LÍDER
                              </b>
                            </span>

                            <span
                              className={
                                rivalListenersToTie === 0
                                  ? "stationRankingLeadershipRivalGoal tied"
                                  : rivalListenersToTie <= 3
                                    ? "stationRankingLeadershipRivalGoal danger"
                                    : "stationRankingLeadershipRivalGoal controlled"
                              }
                              title="Oyentes que necesita la emisora número dos para empatar y tomar el liderato"
                            >
                              <small>META DEL RIVAL</small>

                              <span>
                                <b>
                                  {rivalListenersToTie === 0
                                    ? "YA ESTÁ EMPATADO"
                                    : `A ${rivalListenersToTie} ${
                                        rivalListenersToTie === 1
                                          ? "OYENTE"
                                          : "OYENTES"
                                      } DE EMPATAR`}
                                </b>

                                <i>
                                  {rivalListenersToLead === 1
                                    ? "1 OYENTE PARA SER #1"
                                    : `${rivalListenersToLead} OYENTES PARA SER #1`}
                                </i>
                              </span>
                            </span>

                            <span
                              className={`stationRankingLeadershipRivalPressure ${rivalPressureLevel}`}
                              title="Nivel de presión de la emisora número dos sobre el liderato"
                            >
                              <small>PRESIÓN DEL RIVAL</small>

                              <span>
                                <i aria-hidden="true">
                                  {rivalPressureLevel === "critical"
                                    ? "●"
                                    : rivalPressureLevel === "high"
                                      ? "▲"
                                      : rivalPressureLevel === "medium"
                                        ? "◆"
                                        : "✓"}
                                </i>

                                <b>{rivalPressureLabel}</b>

                                <em>
                                  {rivalPressureLevel === "critical"
                                    ? "LIDERATO EN RIESGO"
                                    : rivalPressureLevel === "high"
                                      ? "RIVAL MUY CERCA"
                                      : rivalPressureLevel === "medium"
                                        ? "RIVAL EN ZONA DE ATAQUE"
                                        : "VENTAJA BAJO CONTROL"}
                                </em>
                              </span>

                              <span
                                className="stationRankingLeadershipPressureMeter"
                                aria-label={`Presión del rival: ${rivalLeaderReach}% del líder`}
                              >
                                <span>
                                  <i
                                    style={{
                                      width: `${rivalLeaderReach}%`,
                                    }}
                                  />

                                  <em
                                    className="stationRankingPressureThreshold attack"
                                    style={{ left: "85%" }}
                                    aria-hidden="true"
                                  />

                                  <em
                                    className="stationRankingPressureThreshold critical"
                                    style={{ left: "95%" }}
                                    aria-hidden="true"
                                  />
                                </span>

                                <b>{rivalLeaderReach}%</b>

                                <small className="stationRankingPressureLegend">
                                  <span>85% ATAQUE</span>
                                  <span>95% CRÍTICA</span>
                                </small>
                              </span>

                              <span
                                className={
                                  rivalLeaderReach >= 95
                                    ? "stationRankingLeadershipNextThreshold critical"
                                    : rivalLeaderReach >= 85
                                      ? "stationRankingLeadershipNextThreshold warning"
                                      : "stationRankingLeadershipNextThreshold normal"
                                }
                                title="Próximo umbral de presión de la emisora número dos"
                              >
                                <small>PRÓXIMO UMBRAL</small>

                                <span>
                                  <i aria-hidden="true">
                                    {rivalLeaderReach >= 95
                                      ? "●"
                                      : "→"}
                                  </i>

                                  <b>
                                    {rivalLeaderReach >= 95
                                      ? "ZONA CRÍTICA ACTIVA"
                                      : rivalNextThresholdPercent === 95
                                        ? `A ${rivalListenersToNextThreshold} ${
                                            rivalListenersToNextThreshold === 1
                                              ? "OYENTE"
                                              : "OYENTES"
                                          } DE 95% CRÍTICA`
                                        : `A ${rivalListenersToNextThreshold} ${
                                            rivalListenersToNextThreshold === 1
                                              ? "OYENTE"
                                              : "OYENTES"
                                          } DE 85% ATAQUE`}
                                  </b>
                                </span>
                              </span>
                            </span>

                            <strong
                              title={
                                secondVisibleStationInfo?.artist
                                  ? `${secondVisibleStationInfo.title} — ${secondVisibleStationInfo.artist}`
                                  : secondVisibleStationInfo?.title
                              }
                            >
                              ♪{" "}
                              {secondVisibleStationInfo?.artist
                                ? `${secondVisibleStationInfo.title} — ${secondVisibleStationInfo.artist}`
                                : secondVisibleStationInfo?.title ||
                                  "Programación en vivo"}
                            </strong>
                          </span>
                          </>
                        ) : null}
                      </button>
                    ) : null}

                    {leadershipRaceCollapsed &&
                    currentLeaderStation.id === selected.id &&
                    secondVisibleStation ? (
                      <>
                        <button
                          type="button"
                          className={
                            leadershipQuickActionsCollapsed
                              ? "stationRankingLeadershipQuickActionsToggle collapsed"
                              : "stationRankingLeadershipQuickActionsToggle"
                          }
                          onClick={() =>
                            setLeadershipQuickActionsCollapsed(
                              (current) => !current,
                            )
                          }
                          aria-expanded={!leadershipQuickActionsCollapsed}
                          title={
                            leadershipQuickActionsCollapsed
                              ? "Mostrar las acciones rápidas del duelo"
                              : "Ocultar las acciones rápidas del duelo"
                          }
                        >
                          <span aria-hidden="true">
                            {leadershipQuickActionsCollapsed ? "＋" : "−"}
                          </span>

                          <strong>ACCIONES RÁPIDAS</strong>

                          <em>
                            {leadershipQuickActionsCollapsed
                              ? "MOSTRAR"
                              : "OCULTAR"}
                          </em>
                        </button>

                        {!leadershipQuickActionsCollapsed ? (
                          <div className="stationRankingLeadershipCollapsedActions">
                        <button
                          type="button"
                          className={
                            playing
                              ? "stationRankingLeadershipCollapsedHomeListen active"
                              : "stationRankingLeadershipCollapsedHomeListen"
                          }
                          onClick={() => playStation(selected)}
                          title={
                            playing
                              ? `Pausar ${selected.name}`
                              : `Escuchar ${selected.name}, tu emisora líder`
                          }
                          aria-label={
                            playing
                              ? `Pausar tu emisora ${selected.name}`
                              : `Escuchar tu emisora ${selected.name}`
                          }
                        >
                          <span aria-hidden="true">
                            {playing ? "❚❚" : "▶"}
                          </span>
                          {playing
                            ? "PAUSAR TU EMISORA"
                            : "ESCUCHAR TU EMISORA"}
                        </button>

                        <button
                          type="button"
                          className={
                            favoriteStations.includes(selected.id)
                              ? "stationRankingLeadershipCollapsedHomeFavorite active"
                              : "stationRankingLeadershipCollapsedHomeFavorite"
                          }
                          onClick={() => toggleFavorite(selected.id)}
                          aria-pressed={favoriteStations.includes(
                            selected.id,
                          )}
                          title={
                            favoriteStations.includes(selected.id)
                              ? `Quitar ${selected.name} de favoritas`
                              : `Guardar ${selected.name} en favoritas`
                          }
                          aria-label={
                            favoriteStations.includes(selected.id)
                              ? `Quitar tu emisora ${selected.name} de favoritas`
                              : `Guardar tu emisora ${selected.name} en favoritas`
                          }
                        >
                          <span aria-hidden="true">
                            {favoriteStations.includes(selected.id)
                              ? "♥"
                              : "♡"}
                          </span>

                          {favoriteStations.includes(selected.id)
                            ? "TU EMISORA EN FAVORITAS"
                            : "GUARDAR TU EMISORA"}
                        </button>

                        <button
                          type="button"
                          className="stationRankingLeadershipCollapsedHomeView"
                          onClick={() =>
                            revealRankingTrendStation(selected.id)
                          }
                          title={`Ver ${selected.name}, tu emisora líder`}
                          aria-label={`Ver tu emisora ${selected.name} dentro del ranking`}
                        >
                          <span aria-hidden="true">↑</span>
                          VER TU EMISORA
                        </button>

                        <button
                          type="button"
                          className="stationRankingLeadershipCollapsedView"
                          onClick={() =>
                            revealRankingTrendStation(
                              secondVisibleStation.id,
                            )
                          }
                          title={`Ver ${secondVisibleStation.name}, emisora número dos`}
                          aria-label={`Ver rival número dos ${secondVisibleStation.name}`}
                        >
                          <span aria-hidden="true">↓</span>
                          VER RIVAL #2
                        </button>

                        <button
                          type="button"
                          className={
                            secondVisibleStation.id === selected.id &&
                            playing
                              ? "stationRankingLeadershipCollapsedListen active"
                              : "stationRankingLeadershipCollapsedListen"
                          }
                          onClick={() =>
                            playStation(secondVisibleStation)
                          }
                          title={`Escuchar ${secondVisibleStation.name}, emisora número dos`}
                          aria-label={`Escuchar rival número dos ${secondVisibleStation.name}`}
                        >
                          <span aria-hidden="true">
                            {secondVisibleStation.id === selected.id &&
                            playing
                              ? "❚❚"
                              : "▶"}
                          </span>
                          ESCUCHAR RIVAL #2
                        </button>

                        <button
                          type="button"
                          className={
                            favoriteStations.includes(
                              secondVisibleStation.id,
                            )
                              ? "stationRankingLeadershipCollapsedFavorite active"
                              : "stationRankingLeadershipCollapsedFavorite"
                          }
                          onClick={() =>
                            toggleFavorite(secondVisibleStation.id)
                          }
                          aria-pressed={favoriteStations.includes(
                            secondVisibleStation.id,
                          )}
                          title={
                            favoriteStations.includes(
                              secondVisibleStation.id,
                            )
                              ? `Quitar ${secondVisibleStation.name} de favoritas`
                              : `Guardar ${secondVisibleStation.name} en favoritas`
                          }
                          aria-label={
                            favoriteStations.includes(
                              secondVisibleStation.id,
                            )
                              ? `Quitar rival número dos ${secondVisibleStation.name} de favoritas`
                              : `Guardar rival número dos ${secondVisibleStation.name} en favoritas`
                          }
                        >
                          <span aria-hidden="true">
                            {favoriteStations.includes(
                              secondVisibleStation.id,
                            )
                              ? "♥"
                              : "♡"}
                          </span>

                          {favoriteStations.includes(
                            secondVisibleStation.id,
                          )
                            ? "RIVAL EN FAVORITAS"
                            : "GUARDAR RIVAL"}
                        </button>

                        <button
                          type="button"
                          className="stationRankingLeadershipCollapsedShare"
                          onClick={shareCurrentRanking}
                          title="Compartir el estado actual del duelo por el liderato"
                          aria-label="Compartir duelo por el liderato"
                        >
                          <span aria-hidden="true">↗</span>
                          COMPARTIR DUELO
                        </button>

                        <div className="stationRankingLeadershipCollapsedEnterGroup">
                          <a
                            className="stationRankingLeadershipCollapsedEnter home"
                            href={`/emisoras/${selected.id}`}
                            title={`Entrar a tu emisora ${selected.name}`}
                            aria-label={`Entrar a la página de tu emisora ${selected.name}`}
                          >
                            <span aria-hidden="true">←</span>
                            ENTRAR A TU EMISORA
                          </a>

                          <a
                            className="stationRankingLeadershipCollapsedEnter rival"
                            href={`/emisoras/${secondVisibleStation.id}`}
                            title={`Entrar a la emisora ${secondVisibleStation.name}`}
                            aria-label={`Entrar a la página de la emisora rival número dos ${secondVisibleStation.name}`}
                          >
                            <span aria-hidden="true">→</span>
                            ENTRAR A LA EMISORA #2
                          </a>
                        </div>
                      </div>
                        ) : null}
                      </>
                    ) : null}

                    {leadershipChanged &&
                    previousLeaderStation ? (
                      <button
                        type="button"
                        className={
                          previousLeaderStation.id === selected.id
                            ? "stationRankingLeadershipPrevious selectedLeadership"
                            : "stationRankingLeadershipPrevious"
                        }
                        onClick={() =>
                          revealRankingTrendStation(
                            previousLeaderStation.id,
                          )
                        }
                        title={
                          previousLeaderStation.id === selected.id
                            ? `Tu emisora ${previousLeaderStation.name} era el líder anterior`
                            : `Ir a ${previousLeaderStation.name}, líder anterior`
                        }
                      >
                        <span aria-hidden="true">↘</span>

                        <span>
                          <small>
                            {previousLeaderStation.id === selected.id
                              ? "TU EMISORA · LÍDER ANTERIOR"
                              : "LÍDER ANTERIOR"}
                          </small>
                          <strong>
                            {previousLeaderStation.shortName ||
                              previousLeaderStation.name}
                          </strong>

                          <em
                            title={
                              previousLeaderInfo?.artist
                                ? `${previousLeaderInfo.title} — ${previousLeaderInfo.artist}`
                                : previousLeaderInfo?.title
                            }
                          >
                            <i>SONANDO</i>{" "}
                            {previousLeaderInfo?.artist
                              ? `${previousLeaderInfo.title} — ${previousLeaderInfo.artist}`
                              : previousLeaderInfo?.title ||
                                "Programación en vivo"}
                          </em>
                        </span>

                        <b>
                          #
                          {visibleStations.findIndex(
                            (station) =>
                              station.id ===
                              previousLeaderStation.id,
                          ) + 1}
                        </b>
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {podiumChanged ? (
                  <div className="stationRankingPodiumChangeActions">
                    {podiumChanges.entered.map(
                      ({ station, from, to }) => (
                        <button
                          key={`podium-enter-${station.id}`}
                          type="button"
                          className={
                            station.id === selected.id
                              ? "stationRankingPodiumEnter selectedPodiumChange"
                              : "stationRankingPodiumEnter"
                          }
                          onClick={() =>
                            revealRankingTrendStation(station.id)
                          }
                          title={
                            station.id === selected.id
                              ? `Tu emisora ${station.name} entró al Top 3`
                              : `Ir a ${station.name}, nueva emisora del Top 3`
                          }
                        >
                          <span aria-hidden="true">↑</span>

                          <span>
                            <small>
                              {station.id === selected.id
                                ? "TU EMISORA · ENTRA AL TOP 3"
                                : "ENTRA AL TOP 3"}
                            </small>
                            <strong>
                              {station.shortName || station.name}
                            </strong>

                            <em>
                              {(() => {
                                const podiumInfo =
                                  metadata[station.id] ??
                                  emptyNowPlaying(station);

                                return podiumInfo.artist
                                  ? `${podiumInfo.title} — ${podiumInfo.artist}`
                                  : podiumInfo.title ||
                                      "Programación en vivo";
                              })()}
                            </em>
                          </span>

                          <b>
                            #{from} → #{to}
                          </b>
                        </button>
                      ),
                    )}

                    {podiumChanges.exited.map(
                      ({ station, from, to }) => (
                        <button
                          key={`podium-exit-${station.id}`}
                          type="button"
                          className={
                            station.id === selected.id
                              ? "stationRankingPodiumExit selectedPodiumChange"
                              : "stationRankingPodiumExit"
                          }
                          onClick={() =>
                            revealRankingTrendStation(station.id)
                          }
                          title={
                            station.id === selected.id
                              ? `Tu emisora ${station.name} salió del Top 3`
                              : `Ir a ${station.name}, emisora que salió del Top 3`
                          }
                        >
                          <span aria-hidden="true">↓</span>

                          <span>
                            <small>
                              {station.id === selected.id
                                ? "TU EMISORA · SALE DEL TOP 3"
                                : "SALE DEL TOP 3"}
                            </small>
                            <strong>
                              {station.shortName || station.name}
                            </strong>

                            <em>
                              {(() => {
                                const podiumInfo =
                                  metadata[station.id] ??
                                  emptyNowPlaying(station);

                                return podiumInfo.artist
                                  ? `${podiumInfo.title} — ${podiumInfo.artist}`
                                  : podiumInfo.title ||
                                      "Programación en vivo";
                              })()}
                            </em>
                          </span>

                          <b>
                            #{from} → #{to}
                          </b>
                        </button>
                      ),
                    )}
                  </div>
                ) : (
                  <span className="stationRankingPodiumStable">
                    <span aria-hidden="true">◆</span>
                    LAS TRES PRIMERAS EMISORAS CONSERVAN EL PODIO
                  </span>
                )}
              </div>
            ) : null}

            {rankingMovementReady ? (
              <div className="stationRankingAudienceImpulse">
                <div className="stationRankingAudienceImpulseHeading">
                  <span aria-hidden="true">◔</span>

                  <span>
                    <small>IMPULSO DE AUDIENCIA</small>
                    <strong>
                      CAMBIO DE OYENTES DESDE LA ÚLTIMA ACTUALIZACIÓN
                    </strong>
                  </span>

                  <b>EN VIVO</b>
                </div>

                <div
                  className={
                    rankingListenerFlow.net > 0
                      ? "stationRankingAudienceNet positive"
                      : rankingListenerFlow.net < 0
                        ? "stationRankingAudienceNet negative"
                        : "stationRankingAudienceNet neutral"
                  }
                >
                  <span aria-hidden="true">
                    {rankingListenerFlow.net > 0
                      ? "↑"
                      : rankingListenerFlow.net < 0
                        ? "↓"
                        : "—"}
                  </span>

                  <span>
                    <small>SALDO NETO DE AUDIENCIA</small>
                    <strong>
                      {rankingListenerFlow.net > 0
                        ? `+${rankingListenerFlow.net} OYENTES`
                        : rankingListenerFlow.net < 0
                          ? `${rankingListenerFlow.net} OYENTES`
                          : "SIN CAMBIO NETO"}
                    </strong>
                  </span>

                  <b>
                    +{rankingListenerFlow.gained} GANADOS · -
                    {rankingListenerFlow.lost} PERDIDOS
                  </b>
                </div>

                <div className="stationRankingAudienceImpulseActions">
                  {biggestListenerGainStation ? (
                    <button
                      type="button"
                      className="stationRankingAudienceGain"
                      onClick={() =>
                        revealRankingTrendStation(
                          biggestListenerGainStation.id,
                        )
                      }
                      title={`Ir a ${biggestListenerGainStation.name}, mayor ganancia de oyentes`}
                    >
                      <span aria-hidden="true">＋</span>

                      <span>
                        <small>MAYOR GANANCIA</small>
                        <strong>
                          {biggestListenerGainStation.shortName ||
                            biggestListenerGainStation.name}
                        </strong>
                      </span>

                      <b>+{biggestListenerGain} OY</b>
                    </button>
                  ) : (
                    <span className="stationRankingAudienceImpulseEmpty">
                      <span aria-hidden="true">＋</span>
                      SIN GANANCIAS DE AUDIENCIA
                    </span>
                  )}

                  {biggestListenerLossStation ? (
                    <button
                      type="button"
                      className="stationRankingAudienceLoss"
                      onClick={() =>
                        revealRankingTrendStation(
                          biggestListenerLossStation.id,
                        )
                      }
                      title={`Ir a ${biggestListenerLossStation.name}, mayor pérdida de oyentes`}
                    >
                      <span aria-hidden="true">−</span>

                      <span>
                        <small>MAYOR PÉRDIDA</small>
                        <strong>
                          {biggestListenerLossStation.shortName ||
                            biggestListenerLossStation.name}
                        </strong>
                      </span>

                      <b>-{biggestListenerLoss} OY</b>
                    </button>
                  ) : (
                    <span className="stationRankingAudienceImpulseEmpty">
                      <span aria-hidden="true">−</span>
                      SIN PÉRDIDAS DE AUDIENCIA
                    </span>
                  )}
                </div>
              </div>
            ) : null}

            {!rankingTrendCollapsed ? (
              rankingMovementReady &&
              (biggestRisingStation || biggestFallingStation) ? (
                <div className="stationRankingTrendActions">
                  {biggestRisingStation ? (
                    <button
                      type="button"
                      className="stationRankingTrendUp"
                      onClick={() =>
                        revealRankingTrendStation(
                          biggestRisingStation.id,
                        )
                      }
                      title={`Ir a ${biggestRisingStation.name}, mayor subida`}
                    >
                      <span aria-hidden="true">↑</span>

                      <span>
                        <small>MAYOR SUBIDA</small>
                        <strong>
                          {biggestRisingStation.shortName ||
                            biggestRisingStation.name}
                        </strong>
                      </span>

                      <b>+{biggestRisingMovement}</b>
                    </button>
                  ) : null}

                  {biggestFallingStation ? (
                    <button
                      type="button"
                      className="stationRankingTrendDown"
                      onClick={() =>
                        revealRankingTrendStation(
                          biggestFallingStation.id,
                        )
                      }
                      title={`Ir a ${biggestFallingStation.name}, mayor bajada`}
                    >
                      <span aria-hidden="true">↓</span>

                      <span>
                        <small>MAYOR BAJADA</small>
                        <strong>
                          {biggestFallingStation.shortName ||
                            biggestFallingStation.name}
                        </strong>
                      </span>

                      <b>-{biggestFallingMovement}</b>
                    </button>
                  ) : null}
                </div>
              ) : rankingMovementReady ? (
                <span className="stationRankingTrendStable">
                  <span aria-hidden="true">—</span>
                  TODAS LAS EMISORAS MANTIENEN SU POSICIÓN
                </span>
              ) : (
                <span className="stationRankingTrendWaiting">
                  <span aria-hidden="true">◌</span>
                  COMPARANDO ESTA TABLA CON LA PRÓXIMA ACTUALIZACIÓN
                </span>
              )
            ) : null}
          </div>

          <div className="stationFullRankingBannerActions">
            {selectedNextTargetStation &&
            selectedVisiblePosition !== null ? (
              <div className="stationFullRankingRivalActions">
                <button
                  type="button"
                  className="stationFullRankingNextTarget"
                  onClick={revealSelectedNextTargetInRanking}
                  title={`Ir a ${selectedNextTargetStation.name}, rival inmediato`}
                >
                  <span aria-hidden="true">⇧</span>

                  <span>
                    <small>RIVAL DIRECTO</small>
                    <strong>
                      VER #{selectedVisiblePosition - 1}
                    </strong>
                  </span>

                  <i aria-hidden="true">↓</i>
                </button>

                <div className="stationFullRankingRivalDuel">
                  <div className="stationFullRankingRivalDuelHeading">
                    <span aria-hidden="true">⚡</span>

                    <span>
                      <small>DUELO POR EL PUESTO</small>
                      <strong>
                        #{selectedVisiblePosition} VS #
                        {selectedVisiblePosition - 1}
                      </strong>
                    </span>

                    <b>
                      +{selectedListenersToNextPosition ?? 0}{" "}
                      {selectedListenersToNextPosition === 1
                        ? "OYENTE"
                        : "OYENTES"}{" "}
                      PARA SUPERARLO
                    </b>
                  </div>

                  <div className="stationFullRankingRivalDuelScore">
                    <span>
                      <small>TU EMISORA</small>
                      <strong>
                        {selected.shortName || selected.name}
                      </strong>
                      <b>{selectedRankingListeners ?? "—"}</b>
                    </span>

                    <i aria-hidden="true">VS</i>

                    <span>
                      <small>RIVAL DIRECTO</small>
                      <strong>
                        {selectedNextTargetStation.shortName ||
                          selectedNextTargetStation.name}
                      </strong>
                      <b>{selectedNextTargetListeners ?? "—"}</b>
                    </span>
                  </div>

                  <div className="stationFullRankingRivalNow">
                    <span aria-hidden="true">♪</span>

                    <span>
                      <small>SONANDO EN EL RIVAL</small>
                      <strong
                        title={
                          selectedNextTargetInfo?.artist
                            ? `${selectedNextTargetInfo.title} — ${selectedNextTargetInfo.artist}`
                            : selectedNextTargetInfo?.title
                        }
                      >
                        {selectedNextTargetInfo?.title ||
                          "Programación en vivo"}
                      </strong>

                      {selectedNextTargetInfo?.artist ? (
                        <em>{selectedNextTargetInfo.artist}</em>
                      ) : null}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className={
                    selectedNextTargetStation.id === selected.id &&
                    playing
                      ? "stationFullRankingNextListen active"
                      : "stationFullRankingNextListen"
                  }
                  onClick={() =>
                    playStation(selectedNextTargetStation)
                  }
                  aria-label={`Escuchar rival directo ${selectedNextTargetStation.name}`}
                  title={`Escuchar ${selectedNextTargetStation.name}`}
                >
                  <span aria-hidden="true">
                    {selectedNextTargetStation.id === selected.id &&
                    playing
                      ? "❚❚"
                      : "▶"}
                  </span>

                  <span>
                    <small>RIVAL DIRECTO</small>
                    <strong>ESCUCHAR RIVAL</strong>
                  </span>
                </button>
              </div>
            ) : null}

            {selectedVisiblePosition !== null ? (
              <button
                type="button"
                className="stationFullRankingCurrent"
                onClick={revealSelectedStationInRanking}
                title={`Ir a ${selected.name} dentro del ranking`}
              >
                <span aria-hidden="true">◎</span>

                <span className="stationFullRankingCurrentCopy">
                  <span className="stationFullRankingCurrentHeading">
                    <small>TU EMISORA</small>
                    <strong>#{selectedVisiblePosition}</strong>
                  </span>

                  <span className="stationFullRankingCurrentMeta">
                    {selectedRankingAudienceShare !== null ? (
                      <b>{selectedRankingAudienceShare}% AUDIENCIA</b>
                    ) : null}

                    {selectedVisiblePosition === 1 ? (
                      <em>LÍDER DE LA SELECCIÓN</em>
                    ) : selectedRankingGap === 0 ? (
                      <em>EMPATE CON #1</em>
                    ) : selectedRankingGap === 1 ? (
                      <em>A 1 OYENTE DEL LÍDER</em>
                    ) : selectedRankingGap !== null ? (
                      <em>
                        A {selectedRankingGap} OYENTES DEL LÍDER
                      </em>
                    ) : null}
                  </span>

                  {selectedVsLeaderProgress !== null &&
                  selectedRankingListeners !== null ? (
                    <span className="stationFullRankingCurrentBattle">
                      <span className="stationFullRankingCurrentBattleLabel">
                        <small>TU EMISORA VS #1</small>
                        <b>
                          {selectedRankingListeners} /{" "}
                          {topVisibleLeaderListeners} OYENTES
                        </b>
                      </span>

                      <span
                        className="stationFullRankingCurrentBattleTrack"
                        aria-hidden="true"
                      >
                        <i
                          style={{
                            width: `${Math.max(
                              selectedVsLeaderProgress,
                              selectedVsLeaderProgress > 0 ? 5 : 0,
                            )}%`,
                          }}
                        />
                      </span>

                      {selectedListenersToLead !== null ? (
                        <span
                          className={
                            selectedVisiblePosition === 1
                              ? "stationFullRankingCurrentGoal leading"
                              : selectedRankingGap === 0
                                ? "stationFullRankingCurrentGoal tied"
                                : "stationFullRankingCurrentGoal"
                          }
                        >
                          <span aria-hidden="true">
                            {selectedVisiblePosition === 1
                              ? "★"
                              : "↗"}
                          </span>

                          {selectedVisiblePosition === 1
                            ? "DEFENDIENDO EL #1"
                            : selectedRankingGap === 0
                              ? "META: +1 OYENTE PARA ROMPER EL EMPATE"
                              : selectedListenersToLead === 1
                                ? "META: +1 OYENTE PARA SER #1"
                                : `META: +${selectedListenersToLead} OYENTES PARA SER #1`}
                        </span>
                      ) : null}

                      {selectedNextTargetStation &&
                      selectedListenersToNextPosition !== null &&
                      selectedVisiblePosition !== null ? (
                        <span className="stationFullRankingNextGoal">
                          <span aria-hidden="true">⇧</span>

                          <span>
                            <small>PRÓXIMO OBJETIVO</small>
                            <b>
                              #{selectedVisiblePosition - 1} ·{" "}
                              {selectedNextTargetStation.shortName ||
                                selectedNextTargetStation.name}
                            </b>
                          </span>

                          <em>
                            +{selectedListenersToNextPosition}{" "}
                            {selectedListenersToNextPosition === 1
                              ? "OYENTE"
                              : "OYENTES"}
                          </em>
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </span>

                <i aria-hidden="true">↓</i>
              </button>
            ) : (
              <span className="stationFullRankingCurrentOutside">
                <span aria-hidden="true">◎</span>
                EMISORA ACTIVA FUERA DE ESTA SELECCIÓN
              </span>
            )}

            <button
              type="button"
              className={
                sharedRanking
                  ? "stationFullRankingShare active"
                  : "stationFullRankingShare"
              }
              onClick={shareCurrentRanking}
              title="Compartir este ranking en vivo"
            >
              <span aria-hidden="true">
                {sharedRanking ? "✓" : "↗"}
              </span>

              <span>
                <small>RANKING EN VIVO</small>
                <strong>
                  {sharedRanking
                    ? "COMPARTIDO"
                    : "COMPARTIR RANKING"}
                </strong>
              </span>
            </button>

            <button
              type="button"
              className="stationFullRankingBannerBack"
              onClick={() => setStationSortMode("network")}
              title="Volver al orden original de la red"
            >
              <span aria-hidden="true">↺</span>
              VOLVER AL ORDEN DE LA RED
            </button>
          </div>
        </div>
      ) : null}



      {!selectedCardVisible ? (
        <button
          type="button"
          className="stationActiveShortcut"
          onClick={revealSelectedStation}
          style={
            {
              "--shortcut-accent": selected.accent,
            } as CSSProperties
          }
          aria-label={`Ir a la emisora activa ${selected.name}`}
        >
          <img
            src={selected.logo}
            alt=""
            width={34}
            height={34}
          />

          <span>
            <small>IR A LA EMISORA ACTIVA</small>
            <strong>{selected.shortName || selected.name}</strong>
          </span>

          <b aria-hidden="true">↑</b>
        </button>
      ) : null}

        </>
      ) : null}

      <style jsx>{`
        .stationVisibleIntro {
          width: 100%;
          margin: 12px 0 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: rgba(255,255,255,.56);
        }

        .stationVisibleIntro > span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #7bf5be;
          font-size: .58rem;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .stationVisibleIntro > span > i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7bf5be;
          box-shadow: 0 0 10px rgba(123,245,190,.58);
        }

        .stationVisibleIntro > small {
          color: rgba(255,255,255,.34);
          font-size: .5rem;
          font-weight: 800;
          letter-spacing: .055em;
        }

        .stationNetworkDetailsToggle {
          width: min(100%, 760px);
          min-height: 44px;
          margin: 14px auto 0;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1px solid rgba(143, 183, 255, .18);
          border-radius: 999px;
          background: rgba(7, 12, 28, .72);
          color: #dce7ff;
          box-shadow: 0 10px 30px rgba(0, 0, 0, .12);
          transition:
            border-color .2s ease,
            background .2s ease,
            transform .2s ease;
        }

        .stationNetworkDetailsToggle:hover,
        .stationNetworkDetailsToggle:focus-visible {
          border-color: rgba(123, 245, 190, .34);
          background: rgba(12, 22, 38, .92);
          outline: none;
          transform: translateY(-1px);
        }

        .stationNetworkDetailsToggle > span {
          color: #7bf5be;
          font-size: .92rem;
          font-weight: 900;
          line-height: 1;
        }

        .stationNetworkDetailsToggle > strong {
          font-size: .64rem;
          font-weight: 950;
          letter-spacing: .08em;
        }


        .stationsSection {
          position: relative;
          overflow: hidden;
        }

        .stationsSectionTitle {
          position: relative;
          z-index: 1;
        }

        .stationsSectionTitle {
          max-width: 760px;
          margin-bottom: 0;
        }

        .stationsSectionTitle > span {
          color: #ff5b8f;
          font-size: .62rem;
          font-weight: 950;
          letter-spacing: .14em;
        }

        .stationsSectionTitle h2 {
          margin: 8px 0 8px;
          font-size: clamp(1.9rem, 3.2vw, 3.1rem);
          line-height: 1;
          letter-spacing: -.035em;
        }

        .stationsSectionTitle p {
          max-width: 620px;
          margin: 0;
          color: rgba(255,255,255,.58);
          font-size: .84rem;
          line-height: 1.55;
        }

        .stationControlDock {
          position: sticky;
          top: 76px;
          z-index: 35;
          margin: 0 0 18px;
          padding: 12px 12px 9px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 17px;
          background:
            linear-gradient(
              180deg,
              rgba(8,12,30,.94),
              rgba(8,12,30,.88)
            );
          backdrop-filter: blur(18px) saturate(1.12);
          box-shadow:
            0 14px 34px rgba(0,0,0,.20),
            inset 0 1px 0 rgba(255,255,255,.025);
        }

        .stationControlDock.collapsed {
          padding-bottom: 10px;
        }

        .stationControlHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }

        .stationControlHeader > span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: rgba(123,245,190,.58);
          font-size: .4rem;
          font-weight: 950;
          letter-spacing: .1em;
        }

        .stationControlHeader > span i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7bf5be;
          box-shadow: 0 0 10px rgba(123,245,190,.34);
        }

        .stationControlCollapse {
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 9px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 999px;
          color: rgba(255,255,255,.48);
          background: rgba(255,255,255,.025);
          cursor: pointer;
          transition:
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationControlCollapse:hover {
          color: #fff;
          border-color: rgba(123,245,190,.22);
          background: rgba(123,245,190,.04);
        }

        .stationControlCollapse > span {
          color: #7bf5be;
          font-size: .72rem;
          line-height: 1;
        }

        .stationControlCollapse strong {
          font-size: .42rem;
          font-weight: 950;
          letter-spacing: .07em;
        }

        .stationControlBody {
          min-width: 0;
        }

        .stationControlCollapsedSummary {
          min-height: 32px;
          display: flex;
          align-items: center;
          gap: 7px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .stationControlCollapsedSummary::-webkit-scrollbar {
          display: none;
        }

        .stationControlCollapsedSummary > span {
          flex: 0 0 auto;
          color: rgba(255,255,255,.48);
          font-size: .48rem;
          font-weight: 900;
          letter-spacing: .06em;
        }

        .stationControlCollapsedSummary > span b {
          color: #fff;
          font-size: .67rem;
        }

        .stationControlCollapsedSummary small {
          flex: 0 0 auto;
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          padding: 0 8px;
          border: 1px solid rgba(123,245,190,.10);
          border-radius: 999px;
          color: rgba(123,245,190,.72);
          background: rgba(123,245,190,.035);
          font-size: .4rem;
          font-weight: 900;
          letter-spacing: .065em;
        }

        .stationControlDock .stationGenreFilters {
          scroll-margin-top: 108px;
          margin-bottom: 8px;
        }

        .stationControlDock .stationFilterSummary {
          margin: 2px 0 0;
        }

        .stationTools {
          display: grid;
          grid-template-columns: minmax(260px, 470px) minmax(0, 1fr);
          align-items: center;
          gap: 8px 14px;
          margin: 0 0 12px;
        }

        .stationSearch {
          width: min(100%, 470px);
          min-height: 42px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 12px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 13px;
          background: rgba(255,255,255,.025);
          transition:
            border-color .18s ease,
            background .18s ease,
            box-shadow .18s ease;
        }

        .stationSearch:focus-within {
          border-color: rgba(123,245,190,.38);
          background: rgba(123,245,190,.025);
          box-shadow: 0 0 0 3px rgba(123,245,190,.055);
        }

        .stationSearch > span {
          color: #7bf5be;
          font-size: 1rem;
          line-height: 1;
        }

        .stationSearch input {
          min-width: 0;
          flex: 1;
          border: 0;
          outline: 0;
          color: #fff;
          background: transparent;
          font: inherit;
          font-size: .62rem;
          font-weight: 850;
          letter-spacing: .065em;
        }

        .stationSearch input::placeholder {
          color: rgba(255,255,255,.32);
        }

        .stationSearchMeta {
          grid-column: 1 / -1;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: -5px 0 0 3px;
        }

        .stationSearchHint {
          color: rgba(255,255,255,.26);
          font-size: .39rem;
          font-weight: 850;
          letter-spacing: .075em;
        }

        .stationSearchEnterHint {
          color: rgba(123,245,190,.48);
        }

        .stationKeyboardHints {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 5px;
          color: rgba(255,255,255,.24);
          font-size: .36rem;
          font-weight: 850;
          letter-spacing: .055em;
          white-space: nowrap;
        }

        .stationKeyboardHints kbd {
          min-width: 20px;
          height: 19px;
          display: inline-grid;
          place-items: center;
          padding: 0 4px;
          border: 1px solid rgba(255,255,255,.08);
          border-bottom-color: rgba(255,255,255,.15);
          border-radius: 5px;
          color: rgba(123,245,190,.68);
          background: rgba(255,255,255,.025);
          box-shadow: inset 0 -1px 0 rgba(255,255,255,.035);
          font-family: inherit;
          font-size: .35rem;
          font-weight: 950;
          line-height: 1;
        }

        .stationKeyboardHints .stationEnterKey,
        .stationKeyboardHints .stationSpaceKey {
          min-width: 46px;
          padding: 0 7px;
        }

        .stationKeyboardHints span {
          color: rgba(255,255,255,.14);
        }

        .stationSearchClear {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 50%;
          color: rgba(255,255,255,.72);
          background: rgba(255,255,255,.06);
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
        }

        .stationRecentSearches {
          grid-column: 1 / -1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
          margin-top: -1px;
        }

        .stationRecentSearchesLabel {
          flex: 0 0 auto;
          color: rgba(255,255,255,.24);
          font-size: .36rem;
          font-weight: 950;
          letter-spacing: .075em;
        }

        .stationRecentSearchesChips {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }

        .stationRecentSearchChip {
          display: inline-flex;
          align-items: center;
          min-height: 27px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 999px;
          background: rgba(255,255,255,.018);
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationRecentSearchRepeat,
        .stationRecentSearchRemove,
        .stationRecentSearchesClear {
          min-height: 25px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          color: rgba(255,255,255,.46);
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          font-size: .35rem;
          font-weight: 900;
          letter-spacing: .045em;
          transition:
            color .18s ease,
            background .18s ease;
        }

        .stationRecentSearchRepeat {
          gap: 5px;
          padding: 0 7px 0 8px;
        }

        .stationRecentSearchRepeat > span {
          color: #7bf5be;
          font-size: .52rem;
          line-height: 1;
        }

        .stationRecentSearchRemove {
          width: 27px;
          padding: 0;
          border-left: 1px solid rgba(255,255,255,.055);
          color: rgba(255,255,255,.28);
        }

        .stationRecentSearchRemove > span {
          color: #ff5b8f;
          font-size: .72rem;
          line-height: 1;
        }

        .stationRecentSearchChip:hover {
          border-color: rgba(123,245,190,.18);
          background: rgba(123,245,190,.035);
          transform: translateY(-1px);
        }

        .stationRecentSearchRepeat:hover {
          color: #fff;
          background: rgba(123,245,190,.025);
        }

        .stationRecentSearchRemove:hover {
          color: #fff;
          background: rgba(255,91,143,.08);
        }

        .stationRecentSearchesClear {
          margin-left: auto;
          padding: 0 8px;
          border: 1px solid rgba(255,91,143,.10);
          border-radius: 999px;
          color: rgba(255,255,255,.32);
          background: rgba(255,91,143,.018);
        }

        .stationRecentSearchesClear:hover {
          color: #fff;
          border-color: rgba(255,91,143,.24);
          background: rgba(255,91,143,.055);
          transform: translateY(-1px);
        }

        .stationToolsRight {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          min-width: 0;
        }

        .stationRandomPlay,
        .stationViewToggle,
        .stationOnAirFilter,
        .stationAudienceSort {
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 11px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 999px;
          color: rgba(255,255,255,.48);
          background: rgba(255,255,255,.025);
          cursor: pointer;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationRandomPlay > span,
        .stationViewToggle > span,
        .stationOnAirFilter > span,
        .stationAudienceSort > span {
          color: #7bf5be;
          font-size: .78rem;
          line-height: 1;
        }

        .stationRandomPlay strong,
        .stationViewToggle strong,
        .stationOnAirFilter strong,
        .stationAudienceSort strong {
          font-size: .49rem;
          font-weight: 950;
          letter-spacing: .07em;
          white-space: nowrap;
        }

        .stationRandomPlay:hover,
        .stationViewToggle:hover,
        .stationOnAirFilter:hover,
        .stationAudienceSort:hover {
          color: #fff;
          border-color: rgba(123,245,190,.24);
          transform: translateY(-1px);
        }

        .stationViewToggle.active,
        .stationOnAirFilter.active,
        .stationAudienceSort.active {
          color: #07101a;
          border-color: #7bf5be;
          background: #7bf5be;
          box-shadow: 0 8px 22px rgba(123,245,190,.14);
        }

        .stationViewToggle.active > span,
        .stationOnAirFilter.active > span,
        .stationAudienceSort.active > span {
          color: #07101a;
        }

        .stationRandomPlay {
          color: rgba(255,255,255,.72);
          border-color: rgba(255,91,143,.15);
          background:
            linear-gradient(
              135deg,
              rgba(255,91,143,.055),
              rgba(123,245,190,.025)
            );
        }

        .stationRandomPlay > span {
          font-size: .72rem;
          filter: saturate(.85);
        }

        .stationRandomPlay:hover {
          border-color: rgba(255,91,143,.28);
          background:
            linear-gradient(
              135deg,
              rgba(255,91,143,.10),
              rgba(123,245,190,.045)
            );
        }

        .stationRandomPlay:disabled {
          cursor: not-allowed;
          opacity: .34;
          transform: none;
        }

        .stationOnAirFilter > span {
          color: #7bf5be;
          font-size: .62rem;
          text-shadow: 0 0 10px rgba(123,245,190,.38);
        }

        .stationOnAirFilter.active > span {
          color: #07101a;
          text-shadow: none;
        }

        .stationResultCount {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
          color: rgba(255,255,255,.42);
          white-space: nowrap;
        }

        .stationResultCount b {
          color: #fff;
          font-size: .95rem;
        }

        .stationResultCount small {
          font-size: .5rem;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .stationEmptyState {
          grid-column: 1 / -1;
          min-height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 10px;
          padding: 28px;
          border: 1px dashed rgba(255,255,255,.12);
          border-radius: 20px;
          color: rgba(255,255,255,.66);
          text-align: center;
          background: rgba(255,255,255,.018);
        }

        .stationEmptyState > span {
          color: #7bf5be;
          font-size: 2rem;
        }

        .stationEmptyState strong {
          color: #fff;
          font-size: .78rem;
          letter-spacing: .06em;
        }

        .stationEmptyState small {
          font-size: .68rem;
        }

        .stationEmptyState button {
          min-height: 36px;
          margin-top: 4px;
          padding: 0 13px;
          border: 1px solid rgba(123,245,190,.28);
          border-radius: 999px;
          color: #07101a;
          background: #7bf5be;
          cursor: pointer;
          font-size: .54rem;
          font-weight: 950;
          letter-spacing: .07em;
        }

        .favoriteFilter,
        .recentFilter {
          display: inline-flex !important;
          align-items: center;
          gap: 6px;
        }

        .recentFilter {
          color: rgba(143,183,255,.72) !important;
        }

        .recentFilter.active {
          color: #07101a !important;
        }

        .genreFilterCount,
        .favoriteFilterCount,
        .recentFilterCount {
          min-width: 18px;
          height: 18px;
          display: inline-grid;
          place-items: center;
          padding: 0 5px;
          border-radius: 999px;
          color: rgba(255,255,255,.68);
          background: rgba(255,255,255,.08);
          font-size: .46rem;
          font-weight: 950;
          line-height: 1;
        }

        .stationGenreFilters button.active .genreFilterCount,
        .favoriteFilter.active .favoriteFilterCount,
        .recentFilter.active .recentFilterCount {
          color: #07101a;
          background: rgba(7,16,26,.12);
        }

        .favoriteFilterCount {
        }

        .favoriteFilter.active .favoriteFilterCount {
          color: #07101a;
          background: rgba(7,16,26,.12);
        }

        .stationGenreFilters {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 8px;
          margin: 0 0 22px;
          padding: 2px 0 5px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .stationGenreFilters::-webkit-scrollbar {
          display: none;
        }

        .stationGenreFilters button {
          flex: 0 0 auto;
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 11px 0 13px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 999px;
          color: rgba(255,255,255,.56);
          background: rgba(255,255,255,.025);
          cursor: pointer;
          font-size: .56rem;
          font-weight: 950;
          letter-spacing: .08em;
          transition:
            transform .18s ease,
            border-color .18s ease,
            color .18s ease,
            background .18s ease;
        }

        .stationGenreFilters button:hover {
          color: #fff;
          border-color: rgba(255,255,255,.18);
          transform: translateY(-1px);
        }

        .stationGenreFilters button.active {
          color: #07101a;
          border-color: #7bf5be;
          background: #7bf5be;
          box-shadow: 0 8px 22px rgba(123,245,190,.16);
        }

        .stationFilterSummary {
          display: grid;
          grid-template-columns: auto auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          margin: -7px 0 18px;
          padding: 9px 11px;
          border: 1px solid rgba(123,245,190,.09);
          border-radius: 12px;
          background: rgba(123,245,190,.025);
        }

        .stationFilterSummaryCount {
          min-width: 0;
          display: grid;
          gap: 3px;
        }

        .stationFilterSummaryCount > span {
          color: rgba(255,255,255,.38);
          font-size: .46rem;
          font-weight: 900;
          letter-spacing: .07em;
          white-space: nowrap;
        }

        .stationFilterSummaryCount > span b {
          color: #fff;
          font-size: .62rem;
        }

        .stationFilterSummaryCount > small {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: rgba(123,245,190,.46);
          font-size: .33rem;
          font-weight: 900;
          letter-spacing: .065em;
          white-space: nowrap;
        }

        .stationFilterSummaryCount > small strong {
          min-width: 17px;
          height: 17px;
          display: inline-grid;
          place-items: center;
          border: 1px solid rgba(123,245,190,.13);
          border-radius: 999px;
          color: #7bf5be;
          background: rgba(123,245,190,.04);
          font-size: .36rem;
          font-weight: 950;
          line-height: 1;
        }

        .stationFilteredMetrics {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }

        .stationFilteredMetrics > button {
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0 7px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 999px;
          color: rgba(255,255,255,.34);
          background: rgba(255,255,255,.015);
          font-size: .32rem;
          font-weight: 900;
          letter-spacing: .055em;
          white-space: nowrap;
        }

        .stationFilteredMetrics > button:first-child {
          border-color: rgba(123,245,190,.10);
          background: rgba(123,245,190,.02);
        }

        .stationFilteredMetrics i {
          width: 6px;
          height: 6px;
          display: inline-grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 50%;
          color: #8fb7ff;
          background: #7bf5be;
          box-shadow: 0 0 8px rgba(123,245,190,.40);
          font-size: .28rem;
          font-style: normal;
          line-height: 1;
        }

        .stationFilteredMetrics > button:last-child i {
          width: auto;
          height: auto;
          color: #8fb7ff;
          background: transparent;
          box-shadow: none;
          font-size: .4rem;
        }

        .stationFilteredMetrics .stationFilteredTop {
          border-color: rgba(255,203,92,.12);
          background: rgba(255,203,92,.022);
        }

        .stationFilteredMetrics .stationFilteredTop i {
          width: auto;
          height: auto;
          color: #ffcb5c;
          background: transparent;
          box-shadow: none;
          font-size: .46rem;
        }

        .stationFilteredMetrics .stationFilteredTop:hover {
          border-color: rgba(255,203,92,.28);
          background: rgba(255,203,92,.06);
        }

        .stationFilteredMetrics .stationFilteredTop.active {
          color: #07101a;
          border-color: #ffcb5c;
          background: #ffcb5c;
          box-shadow: 0 7px 18px rgba(255,203,92,.11);
        }

        .stationFilteredMetrics .stationFilteredTop.active i,
        .stationFilteredMetrics .stationFilteredTop.active b,
        .stationFilteredMetrics .stationFilteredTop.active > span {
          color: #07101a;
        }

        .stationFilteredMetrics > button {
          font-family: inherit;
          cursor: pointer;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationFilteredMetrics > button > span {
          color: rgba(123,245,190,.46);
          font-size: .46rem;
          line-height: 1;
        }

        .stationFilteredMetrics > button:hover {
          color: #fff;
          border-color: rgba(123,245,190,.22);
          background: rgba(123,245,190,.05);
          transform: translateY(-1px);
        }

        .stationFilteredMetrics > button.active {
          color: #07101a;
          border-color: #7bf5be;
          background: #7bf5be;
          box-shadow: 0 7px 18px rgba(123,245,190,.10);
        }

        .stationFilteredMetrics > button.active b,
        .stationFilteredMetrics > button.active > span {
          color: #07101a;
        }

        .stationFilteredMetrics > button.active > span {
          min-width: 15px;
          height: 15px;
          display: inline-grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(7,16,26,.08);
          font-size: .56rem;
          font-weight: 950;
        }

        .stationFilteredMetrics > button.active i {
          color: #07101a;
          background: #07101a;
          box-shadow: none;
        }

        .stationFilteredMetrics > button:last-child.active i {
          color: #07101a;
          background: transparent;
        }

        .stationFilteredMetrics b {
          color: rgba(255,255,255,.76);
          font-size: .42rem;
          font-weight: 950;
        }

        .stationActiveFilterChips {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }

        .stationActiveFilterChips button {
          min-width: 0;
          min-height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0 7px;
          border: 1px solid rgba(123,245,190,.10);
          border-radius: 999px;
          color: rgba(255,255,255,.56);
          background: rgba(123,245,190,.025);
          cursor: pointer;
          font-family: inherit;
          letter-spacing: .045em;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationActiveFilterChips button b {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.66);
          font-size: .36rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationActiveFilterChips button em {
          max-width: 120px;
          overflow: hidden;
          color: rgba(255,255,255,.34);
          font-size: .34rem;
          font-style: normal;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationActiveFilterChips button > span {
          color: #ff5b8f;
          font-size: .68rem;
          line-height: 1;
        }

        .stationActiveFilterChips button:hover {
          color: #fff;
          border-color: rgba(123,245,190,.24);
          background: rgba(123,245,190,.055);
          transform: translateY(-1px);
        }

        .stationClearAllFilters {
          white-space: nowrap;
        }

        .stationFilterSummary button {
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 10px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 999px;
          color: rgba(255,255,255,.62);
          background: rgba(255,255,255,.025);
          cursor: pointer;
          font-size: .46rem;
          font-weight: 950;
          letter-spacing: .07em;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationFilterSummary > .stationClearAllFilters > span {
          color: #7bf5be;
          font-size: .85rem;
          line-height: 1;
        }

        .stationClearAllFilters:hover {
          color: #fff;
          border-color: rgba(123,245,190,.24);
          background: rgba(123,245,190,.05);
          transform: translateY(-1px);
        }

        .stationSelectionTop3 {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 12px;
          margin: 8px 0 0;
          padding: 9px 10px;
          border: 1px solid rgba(255,203,92,.09);
          border-radius: 13px;
          background:
            linear-gradient(
              120deg,
              rgba(255,203,92,.025),
              rgba(255,255,255,.01)
            );
        }

        .stationSelectionTop3Heading {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stationSelectionTop3Heading > div:not(.stationSelectionTop3Actions) {
          flex: 1;
        }

        .stationSelectionTop3Heading > span {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid rgba(255,203,92,.13);
          border-radius: 9px;
          color: #ffcb5c;
          background: rgba(255,203,92,.045);
          font-size: .62rem;
        }

        .stationSelectionTop3Heading
          > div:not(.stationSelectionTop3Actions) {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .stationSelectionTop3Context {
          width: fit-content;
          max-width: 100%;
          overflow: hidden;
          padding: 3px 6px;
          border: 1px solid rgba(123,245,190,.10);
          border-radius: 999px;
          color: rgba(123,245,190,.62);
          background: rgba(123,245,190,.025);
          font-size: .27rem;
          font-weight: 950;
          letter-spacing: .055em;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationSelectionTop3Heading strong {
          color: rgba(255,255,255,.72);
          font-size: .42rem;
          font-weight: 950;
          letter-spacing: .075em;
          white-space: nowrap;
        }

        .stationSelectionTop3Heading small {
          color: rgba(255,203,92,.42);
          font-size: .31rem;
          font-weight: 900;
          letter-spacing: .055em;
          white-space: nowrap;
        }

        .stationSelectionTop3Actions {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 5px;
        }

        .stationSelectionTop3Ranking {
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0 8px;
          border: 1px solid rgba(123,245,190,.11);
          border-radius: 999px;
          color: rgba(123,245,190,.62);
          background: rgba(123,245,190,.025);
          cursor: pointer;
          font-family: inherit;
          font-size: .33rem;
          font-weight: 950;
          letter-spacing: .055em;
          white-space: nowrap;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationSelectionTop3Ranking > span {
          color: #7bf5be;
          font-size: .58rem;
          line-height: 1;
        }

        .stationSelectionTop3Ranking:hover {
          color: #07101a;
          border-color: #7bf5be;
          background: #7bf5be;
          transform: translateY(-1px);
        }

        .stationSelectionTop3Ranking:hover > span {
          color: #07101a;
        }

        .stationSelectionTop3Toggle {
          flex: 0 0 auto;
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0 8px;
          border: 1px solid rgba(255,203,92,.10);
          border-radius: 999px;
          color: rgba(255,255,255,.40);
          background: rgba(255,203,92,.02);
          cursor: pointer;
          font-family: inherit;
          font-size: .33rem;
          font-weight: 950;
          letter-spacing: .055em;
          white-space: nowrap;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationSelectionTop3Toggle > span {
          color: #ffcb5c;
          font-size: .7rem;
          line-height: 1;
        }

        .stationSelectionTop3Toggle:hover {
          color: #fff;
          border-color: rgba(255,203,92,.26);
          background: rgba(255,203,92,.055);
          transform: translateY(-1px);
        }

        .stationSelectionTop3.collapsed {
          grid-template-columns: 1fr;
          padding-top: 8px;
          padding-bottom: 8px;
        }

        .stationSelectionTop3.collapsed .stationSelectionTop3Heading {
          width: 100%;
        }

        .stationSelectionTop3.collapsed .stationSelectionTop3Context {
          color: rgba(255,203,92,.62);
          border-color: rgba(255,203,92,.12);
          background: rgba(255,203,92,.025);
        }

        .stationSelectionTop3List {
          min-width: 0;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
        }

        .stationSelectionTop3List button {
          min-width: 0;
          min-height: 52px;
          display: grid;
          grid-template-columns:
            auto auto minmax(0, 1fr) auto minmax(48px, 72px) auto;
          align-items: center;
          gap: 6px;
          padding: 0 8px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 10px;
          color: rgba(255,255,255,.48);
          background: rgba(255,255,255,.015);
          cursor: pointer;
          font-family: inherit;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationSelectionTop3List button:hover {
          color: #fff;
          border-color: rgba(255,203,92,.22);
          background: rgba(255,203,92,.045);
          transform: translateY(-1px);
        }

        .stationSelectionTop3List button.active {
          color: #07101a;
          border-color: #ffcb5c;
          background: #ffcb5c;
          box-shadow: 0 7px 18px rgba(255,203,92,.10);
        }

        .stationSelectionTop3List button > b {
          color: #ffcb5c;
          font-size: .42rem;
          font-weight: 950;
        }

        .stationSelectionTop3List button:nth-child(2) > b {
          color: #cfd5df;
        }

        .stationSelectionTop3List button:nth-child(3) > b {
          color: #d99662;
        }

        .stationSelectionTop3List button.active > b {
          color: #07101a;
        }

        .stationSelectionTop3Logo {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 9px;
          background: rgba(255,255,255,.025);
          box-shadow: 0 5px 12px rgba(0,0,0,.12);
        }

        .stationSelectionTop3Logo img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .stationSelectionTop3List button:first-child
          .stationSelectionTop3Logo {
          border-color: rgba(255,203,92,.22);
          box-shadow: 0 5px 14px rgba(255,203,92,.08);
        }

        .stationSelectionTop3List button.active
          .stationSelectionTop3Logo {
          border-color: rgba(7,16,26,.16);
          box-shadow: none;
        }

        .stationSelectionTop3Copy {
          min-width: 0;
          display: grid;
          gap: 3px;
          text-align: left;
        }

        .stationSelectionTop3Name {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.62);
          font-size: .4rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationSelectionTop3Now {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 3px 5px;
          overflow: hidden;
          color: rgba(255,255,255,.28);
          font-size: .31rem;
          font-weight: 800;
          line-height: 1.15;
        }

        .stationSelectionTop3Now > span {
          grid-row: 1 / span 2;
          align-self: center;
          color: rgba(123,245,190,.52);
          font-size: .27rem;
          font-weight: 950;
          letter-spacing: .055em;
        }

        .stationSelectionTop3Now > b,
        .stationSelectionTop3Now > em {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationSelectionTop3Now > b {
          color: rgba(255,255,255,.48);
          font-size: .32rem;
          font-weight: 900;
        }

        .stationSelectionTop3Now > em {
          color: rgba(255,255,255,.25);
          font-size: .29rem;
          font-style: normal;
          font-weight: 750;
        }

        .stationSelectionTop3Listeners {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: rgba(255,255,255,.30);
          font-size: .33rem;
          font-weight: 900;
          white-space: nowrap;
        }

        .stationSelectionTop3Listeners i {
          color: #8fb7ff;
          font-size: .34rem;
          font-style: normal;
        }

        .stationSelectionTop3Audience {
          min-width: 0;
          display: grid;
          gap: 3px;
        }

        .stationSelectionTop3Audience > small {
          color: rgba(255,255,255,.42);
          font-size: .31rem;
          font-weight: 950;
          line-height: 1;
          text-align: right;
          white-space: nowrap;
        }

        .stationSelectionTop3AudienceTrack {
          width: 100%;
          height: 4px;
          display: block;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.055);
        }

        .stationSelectionTop3AudienceTrack > i {
          height: 100%;
          display: block;
          border-radius: inherit;
          background: #ffcb5c;
          box-shadow: 0 0 8px rgba(255,203,92,.18);
          transition: width .28s ease;
        }

        .stationSelectionTop3List button:nth-child(2)
          .stationSelectionTop3AudienceTrack > i {
          background: #cfd5df;
          box-shadow: 0 0 8px rgba(207,213,223,.12);
        }

        .stationSelectionTop3List button:nth-child(3)
          .stationSelectionTop3AudienceTrack > i {
          background: #d99662;
          box-shadow: 0 0 8px rgba(217,150,98,.12);
        }

        .stationSelectionTop3Action {
          color: #7bf5be;
          font-size: .42rem;
          line-height: 1;
        }

        .stationSelectionTop3List button.active
          .stationSelectionTop3Name,
        .stationSelectionTop3List button.active
          .stationSelectionTop3Now,
        .stationSelectionTop3List button.active
          .stationSelectionTop3Now > span,
        .stationSelectionTop3List button.active
          .stationSelectionTop3Now > b,
        .stationSelectionTop3List button.active
          .stationSelectionTop3Now > em,
        .stationSelectionTop3List button.active
          .stationSelectionTop3Listeners,
        .stationSelectionTop3List button.active
          .stationSelectionTop3Listeners i,
        .stationSelectionTop3List button.active
          .stationSelectionTop3Audience > small,
        .stationSelectionTop3List button.active
          .stationSelectionTop3Action {
          color: #07101a;
        }

        .stationSelectionTop3List button.active
          .stationSelectionTop3AudienceTrack {
          background: rgba(7,16,26,.12);
        }

        .stationSelectionTop3List button.active
          .stationSelectionTop3AudienceTrack > i {
          background: #07101a;
          box-shadow: none;
        }

        .stationSearchSummary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: -2px 0 10px;
          padding: 9px 11px;
          border: 1px solid rgba(123,245,190,.09);
          border-radius: 13px;
          background:
            linear-gradient(
              120deg,
              rgba(123,245,190,.035),
              rgba(255,255,255,.012)
            );
        }

        .stationSearchSummaryCopy {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .stationSearchSummaryCopy small {
          color: rgba(123,245,190,.58);
          font-size: .36rem;
          font-weight: 950;
          letter-spacing: .08em;
          white-space: nowrap;
        }

        .stationSearchSummaryCopy strong {
          max-width: min(360px, 46vw);
          overflow: hidden;
          color: rgba(255,255,255,.78);
          font-size: .56rem;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationSearchSummaryCopy > span {
          min-height: 22px;
          display: inline-flex;
          align-items: center;
          padding: 0 7px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 999px;
          color: rgba(255,255,255,.42);
          background: rgba(255,255,255,.018);
          font-size: .35rem;
          font-weight: 950;
          letter-spacing: .055em;
          white-space: nowrap;
        }

        .stationSearchSummaryActions {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 7px;
          flex-wrap: wrap;
        }

        .stationSearchExpand,
        .stationSearchSummaryClear {
          flex: 0 0 auto;
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 9px;
          border: 1px solid rgba(255,91,143,.11);
          border-radius: 999px;
          color: rgba(255,255,255,.42);
          background: rgba(255,91,143,.025);
          cursor: pointer;
          font-family: inherit;
          font-size: .36rem;
          font-weight: 950;
          letter-spacing: .055em;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationSearchExpand > span {
          color: #7bf5be;
          font-size: .64rem;
          line-height: 1;
        }

        .stationSearchSummaryClear > span {
          color: #ff5b8f;
          font-size: .72rem;
          line-height: 1;
        }

        .stationSearchExpand {
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 9px;
          border: 1px solid rgba(123,245,190,.12);
          border-radius: 999px;
          color: rgba(255,255,255,.46);
          background: rgba(123,245,190,.025);
          cursor: pointer;
          font-family: inherit;
          font-size: .36rem;
          font-weight: 950;
          letter-spacing: .055em;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationSearchExpand:hover {
          color: #fff;
          border-color: rgba(123,245,190,.28);
          background: rgba(123,245,190,.065);
          transform: translateY(-1px);
        }

        .stationSearchSummaryClear:hover {
          color: #fff;
          border-color: rgba(255,91,143,.25);
          background: rgba(255,91,143,.06);
          transform: translateY(-1px);
        }

        .stationSearchSummaryPager {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px;
          border: 1px solid rgba(123,245,190,.08);
          border-radius: 999px;
          background: rgba(123,245,190,.018);
        }

        .stationSearchSummaryPager button {
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0 7px;
          border: 0;
          border-radius: 999px;
          color: rgba(255,255,255,.42);
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          font-size: .34rem;
          font-weight: 950;
          letter-spacing: .05em;
          transition:
            transform .18s ease,
            color .18s ease,
            background .18s ease;
        }

        .stationSearchSummaryPager button > span {
          color: #7bf5be;
          font-size: .56rem;
          line-height: 1;
        }

        .stationSearchSummaryPager button:hover {
          color: #fff;
          background: rgba(123,245,190,.055);
          transform: translateY(-1px);
        }

        .stationSearchSummaryPager b {
          min-width: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: rgba(255,255,255,.68);
          font-size: .4rem;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationSearchSummaryPager b > span {
          color: rgba(255,255,255,.20);
          font-size: .3rem;
          letter-spacing: .05em;
        }

        .stationSearchNoResults {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin: -2px 0 14px;
          padding: 12px;
          border: 1px solid rgba(255,184,92,.11);
          border-radius: 15px;
          background:
            linear-gradient(
              120deg,
              rgba(255,184,92,.035),
              rgba(255,255,255,.012)
            );
        }

        .stationSearchNoResults > div {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .stationSearchNoResults > div > span {
          flex: 0 0 auto;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,184,92,.13);
          border-radius: 10px;
          color: #ffb85c;
          background: rgba(255,184,92,.045);
          font-size: .78rem;
        }

        .stationSearchNoResults p {
          min-width: 0;
          display: grid;
          gap: 3px;
          margin: 0;
        }

        .stationSearchNoResults strong {
          color: rgba(255,255,255,.78);
          font-size: .46rem;
          font-weight: 950;
          letter-spacing: .07em;
        }

        .stationSearchNoResults small {
          color: rgba(255,255,255,.38);
          font-size: .5rem;
          line-height: 1.35;
        }

        .stationSearchNoResults > button {
          flex: 0 0 auto;
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 10px;
          border: 1px solid rgba(123,245,190,.16);
          border-radius: 999px;
          color: rgba(255,255,255,.62);
          background: rgba(123,245,190,.035);
          cursor: pointer;
          font-family: inherit;
          font-size: .38rem;
          font-weight: 950;
          letter-spacing: .06em;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationSearchNoResults > button > span {
          color: #7bf5be;
          font-size: .62rem;
        }

        .stationSearchNoResults > button:hover {
          color: #fff;
          border-color: rgba(123,245,190,.30);
          background: rgba(123,245,190,.07);
          transform: translateY(-1px);
        }

        .stationSearchSpotlight {
          position: relative;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          margin: -2px 0 16px;
          padding: 12px;
          overflow: hidden;
          border: 1px solid color-mix(
            in srgb,
            var(--search-accent) 22%,
            rgba(255,255,255,.07)
          );
          border-radius: 16px;
          background:
            linear-gradient(
              115deg,
              color-mix(
                in srgb,
                var(--search-accent) 7%,
                rgba(5,9,24,.94)
              ),
              rgba(5,9,24,.86) 54%,
              rgba(255,255,255,.015)
            );
          box-shadow: 0 14px 34px rgba(0,0,0,.12);
        }

        .stationSearchSpotlight::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
          background: var(--search-accent);
          box-shadow: 0 0 18px var(--search-accent);
          opacity: .78;
        }

        .stationSearchSpotlightArtwork {
          position: relative;
          width: 72px;
          height: 72px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 13px;
          background: rgba(255,255,255,.025);
          box-shadow: 0 10px 24px rgba(0,0,0,.18);
        }

        .stationSearchSpotlightArtwork img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .stationSearchSpotlightArtwork > span {
          position: absolute;
          right: 6px;
          bottom: 6px;
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 50%;
          color: #07101a;
          background: var(--search-accent);
          box-shadow: 0 5px 14px rgba(0,0,0,.22);
          font-size: .54rem;
          line-height: 1;
        }

        .stationSearchSpotlightCopy {
          min-width: 0;
          display: grid;
          gap: 3px;
        }

        .stationSearchSpotlightHeading {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .stationSearchSpotlightLabel {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
        }

        .stationSearchSpotlightLabel > small {
          color: var(--search-accent);
          font-size: .4rem;
          font-weight: 950;
          letter-spacing: .095em;
        }

        .stationSearchSpotlightLabel > span {
          display: inline-flex;
          align-items: center;
          min-height: 20px;
          padding: 0 7px;
          border: 1px solid color-mix(
            in srgb,
            var(--search-accent) 20%,
            rgba(255,255,255,.06)
          );
          border-radius: 999px;
          color: color-mix(
            in srgb,
            var(--search-accent) 78%,
            #fff
          );
          background: color-mix(
            in srgb,
            var(--search-accent) 6%,
            rgba(255,255,255,.015)
          );
          font-size: .33rem;
          font-weight: 950;
          letter-spacing: .07em;
          white-space: nowrap;
        }

        .stationSearchSpotlightPager {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px;
          border: 1px solid rgba(255,255,255,.065);
          border-radius: 9px;
          background: rgba(255,255,255,.018);
        }

        .stationSearchSpotlightKeyboard {
          min-width: 25px;
          height: 22px;
          display: inline-grid;
          place-items: center;
          padding: 0 4px;
          border-right: 1px solid rgba(255,255,255,.055);
          color: rgba(123,245,190,.48);
          font-size: .35rem;
          font-weight: 950;
          letter-spacing: -.04em;
          line-height: 1;
        }

        .stationSearchSpotlightPager button {
          width: 24px;
          height: 22px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 7px;
          color: var(--search-accent);
          background: transparent;
          cursor: pointer;
          transition:
            transform .18s ease,
            color .18s ease,
            background .18s ease;
        }

        .stationSearchSpotlightPager button:hover:not(:disabled) {
          color: #fff;
          background: color-mix(
            in srgb,
            var(--search-accent) 10%,
            rgba(255,255,255,.025)
          );
          transform: translateY(-1px);
        }

        .stationSearchSpotlightPager button:disabled {
          cursor: default;
          opacity: .28;
        }

        .stationSearchSpotlightPager b {
          min-width: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: rgba(255,255,255,.72);
          font-size: .42rem;
          font-weight: 950;
          letter-spacing: .035em;
          white-space: nowrap;
        }

        .stationSearchSpotlightPager b > span {
          color: rgba(255,255,255,.22);
          font-size: .31rem;
          letter-spacing: .05em;
        }

        .stationSearchSpotlight mark {
          padding: 0 .12em;
          border-radius: .22em;
          color: #07101a;
          background: var(--search-accent);
          box-shadow: 0 0 0 1px color-mix(
            in srgb,
            var(--search-accent) 42%,
            transparent
          );
        }

        .stationSearchSpotlightGenre {
          width: fit-content;
          margin-top: 2px;
          color: rgba(255,255,255,.34);
          font-size: .4rem;
          font-weight: 900;
          letter-spacing: .06em;
        }

        .stationSearchSpotlightGenre mark {
          font-size: inherit;
          letter-spacing: inherit;
        }

        .stationSearchSpotlightLiveMeta {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 5px;
        }

        .stationSearchSpotlightLiveMeta > span,
        .stationSearchSpotlightGenreFilter {
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 0 8px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 999px;
          color: rgba(255,255,255,.54);
          background: rgba(255,255,255,.018);
          font-family: inherit;
          font-size: .38rem;
          font-weight: 900;
          letter-spacing: .045em;
          white-space: nowrap;
        }

        .stationSearchSpotlightLiveMeta > span:first-child {
          color: rgba(123,245,190,.72);
          border-color: rgba(123,245,190,.12);
          background: rgba(123,245,190,.025);
        }

        .stationSearchSpotlightGenreFilter {
          cursor: pointer;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationSearchSpotlightGenreFilter > span {
          color: var(--search-accent);
          font-size: .48rem;
          line-height: 1;
        }

        .stationSearchSpotlightGenreFilter:hover {
          color: #fff;
          border-color: color-mix(
            in srgb,
            var(--search-accent) 32%,
            rgba(255,255,255,.07)
          );
          background: color-mix(
            in srgb,
            var(--search-accent) 8%,
            rgba(255,255,255,.018)
          );
          transform: translateY(-1px);
        }

        .stationSearchSpotlightLiveMeta i {
          width: 6px;
          height: 6px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #7bf5be;
          box-shadow: 0 0 10px rgba(123,245,190,.55);
        }

        .stationSearchSpotlightLiveMeta b,
        .stationSearchSpotlightGenreFilter b {
          color: rgba(255,255,255,.24);
          font-size: .31rem;
          font-weight: 950;
          letter-spacing: .07em;
        }

        .stationSearchSpotlightCopy > strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.92);
          font-size: .78rem;
          font-weight: 950;
          letter-spacing: .025em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationSearchSpotlightCopy p {
          min-width: 0;
          display: flex;
          align-items: baseline;
          gap: 7px;
          margin: 2px 0 0;
          overflow: hidden;
          white-space: nowrap;
        }

        .stationSearchSpotlightCopy p > span {
          flex: 0 0 auto;
          color: rgba(255,255,255,.30);
          font-size: .36rem;
          font-weight: 950;
          letter-spacing: .075em;
        }

        .stationSearchSpotlightCopy p > b {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.68);
          font-size: .55rem;
          font-weight: 850;
          text-overflow: ellipsis;
        }

        .stationSearchSpotlightCopy p > em {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.38);
          font-size: .5rem;
          font-style: normal;
          text-overflow: ellipsis;
        }

        .stationSearchSpotlightActions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .stationSearchSpotlightActions button,
        .stationSearchSpotlightActions a {
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 11px;
          border-radius: 11px;
          font-size: .43rem;
          font-weight: 950;
          letter-spacing: .065em;
          text-decoration: none;
          cursor: pointer;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationSearchSpotlightActions button {
          border: 1px solid color-mix(
            in srgb,
            var(--search-accent) 34%,
            rgba(255,255,255,.08)
          );
          color: #07101a;
          background: var(--search-accent);
        }

        .stationSearchSpotlightActions button > span {
          font-size: .55rem;
        }

        .stationSearchSpotlightActions .stationSearchSpotlightFavorite {
          border: 1px solid rgba(255,91,143,.18);
          color: rgba(255,255,255,.64);
          background: rgba(255,91,143,.045);
        }

        .stationSearchSpotlightActions .stationSearchSpotlightFavorite > span {
          color: #ff5b8f;
          font-size: .7rem;
        }

        .stationSearchSpotlightActions .stationSearchSpotlightFavorite.active {
          border-color: rgba(255,91,143,.34);
          color: #fff;
          background: rgba(255,91,143,.11);
          box-shadow: 0 7px 18px rgba(255,91,143,.08);
        }

        .stationSearchSpotlightActions .stationSearchSpotlightShare {
          border: 1px solid rgba(123,245,190,.16);
          color: rgba(255,255,255,.62);
          background: rgba(123,245,190,.035);
        }

        .stationSearchSpotlightActions .stationSearchSpotlightShare > span {
          color: #7bf5be;
          font-size: .66rem;
        }

        .stationSearchSpotlightActions .stationSearchSpotlightShare.active {
          border-color: #7bf5be;
          color: #07101a;
          background: #7bf5be;
        }

        .stationSearchSpotlightActions
          .stationSearchSpotlightShare.active
          > span {
          color: #07101a;
        }

        .stationSearchSpotlightActions button kbd {
          min-width: 38px;
          height: 19px;
          display: inline-grid;
          place-items: center;
          padding: 0 5px;
          border: 1px solid rgba(7,16,26,.13);
          border-radius: 5px;
          color: rgba(7,16,26,.60);
          background: rgba(7,16,26,.055);
          font-family: inherit;
          font-size: .32rem;
          font-weight: 950;
        }

        .stationSearchSpotlightActions a {
          border: 1px solid rgba(255,255,255,.08);
          color: rgba(255,255,255,.60);
          background: rgba(255,255,255,.025);
        }

        .stationSearchSpotlightActions a > span {
          color: var(--search-accent);
          font-size: .62rem;
        }

        .stationSearchSpotlightActions button:hover,
        .stationSearchSpotlightActions a:hover {
          transform: translateY(-1px);
        }

        .stationSearchSpotlightActions .stationSearchSpotlightFavorite:hover {
          border-color: rgba(255,91,143,.34);
          color: #fff;
          background: rgba(255,91,143,.09);
        }

        .stationSearchSpotlightActions
          .stationSearchSpotlightShare:hover:not(.active) {
          border-color: rgba(123,245,190,.28);
          color: #fff;
          background: rgba(123,245,190,.075);
        }

        .stationSearchSpotlightActions a:hover {
          color: #fff;
          border-color: color-mix(
            in srgb,
            var(--search-accent) 28%,
            rgba(255,255,255,.08)
          );
          background: color-mix(
            in srgb,
            var(--search-accent) 6%,
            rgba(255,255,255,.025)
          );
        }

        .stationFavoritesManager {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin: -3px 0 16px;
          padding: 11px 12px;
          border: 1px solid rgba(255,91,143,.10);
          border-radius: 14px;
          background:
            linear-gradient(
              135deg,
              rgba(255,91,143,.045),
              rgba(255,255,255,.012)
            );
        }

        .stationFavoritesManager > div {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .stationFavoritesManager > div > span {
          flex: 0 0 auto;
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,91,143,.14);
          border-radius: 10px;
          color: #ff5b8f;
          background: rgba(255,91,143,.06);
          font-size: .86rem;
        }

        .stationFavoritesManager p {
          min-width: 0;
          display: grid;
          gap: 2px;
          margin: 0;
        }

        .stationFavoritesManager strong {
          color: rgba(255,255,255,.82);
          font-size: .5rem;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .stationFavoritesManager small {
          color: rgba(255,255,255,.38);
          font-size: .54rem;
          line-height: 1.35;
        }

        .stationFavoritesManager > button {
          flex: 0 0 auto;
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 10px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 999px;
          color: rgba(255,255,255,.56);
          background: rgba(255,255,255,.025);
          cursor: pointer;
          font-size: .44rem;
          font-weight: 950;
          letter-spacing: .07em;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationFavoritesManager > button > span {
          color: #ff5b8f;
          font-size: .85rem;
          line-height: 1;
        }

        .stationFavoritesManager > button:hover {
          color: #fff;
          border-color: rgba(255,91,143,.24);
          background: rgba(255,91,143,.04);
          transform: translateY(-1px);
        }

        .stationRecentManager {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin: -3px 0 16px;
          padding: 11px 12px;
          border: 1px solid rgba(143,183,255,.10);
          border-radius: 14px;
          background:
            linear-gradient(
              135deg,
              rgba(143,183,255,.045),
              rgba(255,255,255,.012)
            );
        }

        .stationRecentManager > div {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .stationRecentManager > div > span {
          flex: 0 0 auto;
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(143,183,255,.14);
          border-radius: 10px;
          color: #8fb7ff;
          background: rgba(143,183,255,.06);
          font-size: .9rem;
        }

        .stationRecentManager p {
          min-width: 0;
          display: grid;
          gap: 2px;
          margin: 0;
        }

        .stationRecentManager strong {
          color: rgba(255,255,255,.82);
          font-size: .5rem;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .stationRecentManager small {
          color: rgba(255,255,255,.38);
          font-size: .54rem;
          line-height: 1.35;
        }

        .stationRecentManager > button {
          flex: 0 0 auto;
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 10px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 999px;
          color: rgba(255,255,255,.56);
          background: rgba(255,255,255,.025);
          cursor: pointer;
          font-size: .44rem;
          font-weight: 950;
          letter-spacing: .07em;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationRecentManager > button > span {
          color: #ff5b8f;
          font-size: .85rem;
          line-height: 1;
        }

        .stationRecentManager > button:hover {
          color: #fff;
          border-color: rgba(255,91,143,.24);
          background: rgba(255,91,143,.04);
          transform: translateY(-1px);
        }

        .stationActiveShortcut {
          --shortcut-accent: #7bf5be;
          position: fixed;
          right: 22px;
          bottom: max(102px, calc(env(safe-area-inset-bottom) + 92px));
          z-index: 80;
          min-width: 205px;
          max-width: min(290px, calc(100vw - 28px));
          min-height: 54px;
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) 26px;
          align-items: center;
          gap: 10px;
          padding: 8px 9px;
          border: 1px solid color-mix(
            in srgb,
            var(--shortcut-accent) 42%,
            rgba(255,255,255,.10)
          );
          border-radius: 15px;
          color: #fff;
          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, var(--shortcut-accent) 12%, rgba(8,12,30,.94)),
              rgba(8,12,30,.96)
            );
          backdrop-filter: blur(14px);
          box-shadow:
            0 16px 38px rgba(0,0,0,.34),
            0 0 26px color-mix(
              in srgb,
              var(--shortcut-accent) 10%,
              transparent
            );
          cursor: pointer;
          text-align: left;
          animation: stationShortcutIn .22s ease both;
          transition:
            transform .18s ease,
            border-color .18s ease,
            box-shadow .18s ease;
        }

        .stationActiveShortcut:hover {
          transform: translateY(-2px);
          border-color: color-mix(
            in srgb,
            var(--shortcut-accent) 66%,
            rgba(255,255,255,.12)
          );
        }

        .stationActiveShortcut img {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          object-fit: cover;
          background: rgba(255,255,255,.03);
        }

        .stationActiveShortcut > span {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .stationActiveShortcut small {
          color: var(--shortcut-accent);
          font-size: .36rem;
          font-weight: 950;
          letter-spacing: .08em;
          white-space: nowrap;
        }

        .stationActiveShortcut strong {
          overflow: hidden;
          color: #fff;
          font-size: .62rem;
          font-weight: 950;
          letter-spacing: .035em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationActiveShortcut > b {
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          border: 1px solid color-mix(
            in srgb,
            var(--shortcut-accent) 30%,
            rgba(255,255,255,.08)
          );
          border-radius: 50%;
          color: var(--shortcut-accent);
          background: rgba(255,255,255,.025);
          font-size: .72rem;
        }

        @keyframes stationShortcutIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(.97);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .stationFullRankingBanner {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          margin: 0 0 10px;
          padding: 10px 11px;
          border: 1px solid rgba(255,203,92,.14);
          border-radius: 14px;
          background:
            linear-gradient(
              115deg,
              rgba(255,203,92,.055),
              rgba(123,245,190,.018)
            );
          box-shadow: 0 10px 26px rgba(0,0,0,.08);
        }

        .stationFullRankingBannerIcon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,203,92,.22);
          border-radius: 10px;
          color: #ffcb5c;
          background: rgba(255,203,92,.055);
          box-shadow: 0 0 18px rgba(255,203,92,.06);
          font-size: .72rem;
        }

        .stationFullRankingBannerMain {
          min-width: 0;
          display: grid;
          grid-template-columns:
            minmax(150px, .8fr) minmax(310px, 1.35fr);
          align-items: center;
          gap: 10px;
        }

        .stationFullRankingBannerCopy {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .stationFullRankingBannerCopy > span {
          width: fit-content;
          max-width: 100%;
          overflow: hidden;
          padding: 3px 6px;
          border: 1px solid rgba(123,245,190,.10);
          border-radius: 999px;
          color: rgba(123,245,190,.62);
          background: rgba(123,245,190,.025);
          font-size: .27rem;
          font-weight: 950;
          letter-spacing: .055em;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFullRankingBannerCopy strong {
          color: rgba(255,255,255,.82);
          font-size: .48rem;
          font-weight: 950;
          letter-spacing: .075em;
        }

        .stationFullRankingBannerCopy small {
          color: rgba(255,203,92,.46);
          font-size: .32rem;
          font-weight: 900;
          letter-spacing: .055em;
        }

        .stationFullRankingBattle {
          min-width: 0;
          display: grid;
          gap: 5px;
        }

        .stationLeadershipDuel {
          min-width: 0;
          display: grid;
          gap: 6px;
          padding: 7px 8px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 11px;
          background:
            linear-gradient(
              110deg,
              rgba(255,203,92,.025),
              rgba(214,224,235,.018)
            );
        }

        .stationLeadershipDuelHeading {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 6px;
        }

        .stationLeadershipDuelHeading > span:first-child {
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,203,92,.13);
          border-radius: 8px;
          color: #ffcb5c;
          background: rgba(255,203,92,.03);
          font-size: .46rem;
        }

        .stationLeadershipDuelHeading
          > span:nth-child(2) {
          min-width: 0;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 7px;
        }

        .stationLeadershipDuelHeading small {
          color: rgba(255,255,255,.27);
          font-size: .21rem;
          font-weight: 950;
          letter-spacing: .055em;
          white-space: nowrap;
        }

        .stationLeadershipDuelHeading strong {
          color: rgba(255,203,92,.68);
          font-size: .28rem;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationLeadershipDuelHeading > b {
          color: #7bf5be;
          font-size: .21rem;
          font-weight: 950;
          letter-spacing: .035em;
          white-space: nowrap;
        }

        .stationLeadershipDuelToggle {
          min-height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0 7px;
          border: 1px solid rgba(255,203,92,.11);
          border-radius: 999px;
          color: rgba(255,255,255,.38);
          background: rgba(255,203,92,.02);
          cursor: pointer;
          font-family: inherit;
          font-size: .22rem;
          font-weight: 950;
          letter-spacing: .045em;
          white-space: nowrap;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationLeadershipDuelToggle > span {
          color: #ffcb5c;
          font-size: .52rem;
          line-height: 1;
        }

        .stationLeadershipDuelToggle:hover {
          color: #07101a;
          border-color: #ffcb5c;
          background: #ffcb5c;
          transform: translateY(-1px);
        }

        .stationLeadershipDuelToggle:hover > span {
          color: #07101a;
        }

        .stationLeadershipDuel.collapsed {
          padding-top: 6px;
          padding-bottom: 6px;
        }

        .stationLeadershipDuel.collapsed
          .stationLeadershipDuelHeading > b {
          color: rgba(123,245,190,.68);
        }

        .stationLeadershipDuelScore {
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          align-items: center;
          gap: 6px;
        }

        .stationLeadershipDuelScore > span {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 5px;
          padding: 5px 7px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 9px;
          background: rgba(255,255,255,.012);
        }

        .stationLeadershipDuelScore > span:first-child {
          border-color: rgba(255,203,92,.10);
        }

        .stationLeadershipDuelScore > span:last-child {
          border-color: rgba(214,224,235,.10);
        }

        .stationLeadershipDuelScore small {
          color: rgba(255,255,255,.25);
          font-size: .19rem;
          font-weight: 950;
        }

        .stationLeadershipDuelScore strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.58);
          font-size: .25rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationLeadershipDuelScore b {
          color: #fff;
          font-size: .40rem;
          font-weight: 950;
          line-height: 1;
        }

        .stationLeadershipDuelScore em {
          color: rgba(255,255,255,.34);
          font-size: .21rem;
          font-style: normal;
          font-weight: 950;
        }

        .stationLeadershipDuelScore > i {
          color: rgba(255,203,92,.48);
          font-size: .22rem;
          font-style: normal;
          font-weight: 950;
        }

        .stationLeadershipDuelTrack {
          width: 100%;
          height: 7px;
          display: flex;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.04);
        }

        .stationLeadershipDuelTrack > span,
        .stationLeadershipDuelTrack > i {
          height: 100%;
          display: block;
          transition: width .28s ease;
        }

        .stationLeadershipDuelTrack > span {
          background: #ffcb5c;
          box-shadow: 0 0 10px rgba(255,203,92,.16);
        }

        .stationLeadershipDuelTrack > i {
          background: #d6e0eb;
          box-shadow: 0 0 10px rgba(214,224,235,.12);
        }

        .stationFullRankingLeader {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 8px;
          padding: 6px 7px;
          border: 1px solid rgba(255,203,92,.12);
          border-radius: 11px;
          background: rgba(255,203,92,.025);
        }

        .stationFullRankingLeader > img {
          width: 38px;
          height: 38px;
          display: block;
          object-fit: cover;
          border: 1px solid rgba(255,203,92,.18);
          border-radius: 9px;
          background: rgba(255,255,255,.025);
          box-shadow: 0 6px 16px rgba(0,0,0,.14);
        }

        .stationFullRankingLeaderCopy {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .stationFullRankingLeaderCopy > small {
          color: #ffcb5c;
          font-size: .27rem;
          font-weight: 950;
          letter-spacing: .07em;
        }

        .stationFullRankingLeaderCopy > strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.82);
          font-size: .42rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFullRankingLeaderCopy > span {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.35);
          font-size: .30rem;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFullRankingLeaderAudience {
          display: grid;
          justify-items: center;
          gap: 1px;
          padding: 0 3px;
        }

        .stationFullRankingLeaderAudience > b {
          color: #fff;
          font-size: .52rem;
          font-weight: 950;
          line-height: 1;
        }

        .stationFullRankingLeaderAudience > small {
          color: rgba(255,255,255,.28);
          font-size: .24rem;
          font-weight: 950;
          letter-spacing: .05em;
        }

        .stationFullRankingLeaderAudience > span {
          max-width: 92px;
          margin-top: 3px;
          padding: 3px 5px;
          overflow: hidden;
          border: 1px solid rgba(255,203,92,.12);
          border-radius: 999px;
          color: rgba(255,203,92,.64);
          background: rgba(255,203,92,.025);
          font-size: .22rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          text-align: center;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFullRankingLeaderAudience > span.tied {
          border-color: rgba(123,245,190,.16);
          color: #7bf5be;
          background: rgba(123,245,190,.035);
        }

        .stationFullRankingLeader > button {
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0 8px;
          border: 1px solid rgba(255,203,92,.16);
          border-radius: 999px;
          color: #ffcb5c;
          background: rgba(255,203,92,.035);
          cursor: pointer;
          font-family: inherit;
          font-size: .30rem;
          font-weight: 950;
          letter-spacing: .05em;
          white-space: nowrap;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationFullRankingLeader > button > span {
          font-size: .48rem;
          line-height: 1;
        }

        .stationFullRankingLeader > button:hover,
        .stationFullRankingLeader > button.active {
          color: #07101a;
          border-color: #ffcb5c;
          background: #ffcb5c;
          transform: translateY(-1px);
        }

        .stationFullRankingChallenger {
          min-width: 0;
          min-height: 52px;
          display: grid;
          grid-template-columns: auto auto minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 7px;
          padding: 5px 7px;
          border: 1px solid rgba(214,224,235,.10);
          border-radius: 10px;
          background: rgba(214,224,235,.018);
        }

        .stationFullRankingChallengerBadge {
          min-width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(214,224,235,.16);
          border-radius: 8px;
          color: #d6e0eb;
          background: rgba(214,224,235,.035);
          font-size: .34rem;
          font-weight: 950;
        }

        .stationFullRankingChallenger > img {
          width: 30px;
          height: 30px;
          display: block;
          object-fit: cover;
          border: 1px solid rgba(214,224,235,.14);
          border-radius: 8px;
          background: rgba(255,255,255,.02);
        }

        .stationFullRankingChallengerCopy {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationFullRankingChallengerCopy > small {
          color: rgba(214,224,235,.52);
          font-size: .24rem;
          font-weight: 950;
          letter-spacing: .055em;
        }

        .stationFullRankingChallengerCopy > strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.62);
          font-size: .36rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFullRankingChallengerNow {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 2px 5px;
          margin-top: 2px;
        }

        .stationFullRankingChallengerNow > i {
          grid-row: 1 / span 2;
          align-self: center;
          color: rgba(123,245,190,.58);
          font-size: .18rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .045em;
          white-space: nowrap;
        }

        .stationFullRankingChallengerNow > b,
        .stationFullRankingChallengerNow > em {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFullRankingChallengerNow > b {
          color: rgba(255,255,255,.43);
          font-size: .23rem;
          font-weight: 900;
        }

        .stationFullRankingChallengerNow > em {
          color: rgba(255,255,255,.22);
          font-size: .20rem;
          font-style: normal;
          font-weight: 800;
        }

        .stationFullRankingChallengerAudience {
          display: grid;
          justify-items: end;
          gap: 1px;
        }

        .stationFullRankingChallengerAudience > b {
          color: rgba(255,255,255,.72);
          font-size: .42rem;
          font-weight: 950;
          line-height: 1;
        }

        .stationFullRankingChallengerAudience > small {
          color: rgba(255,255,255,.27);
          font-size: .22rem;
          font-weight: 900;
          white-space: nowrap;
        }

        .stationFullRankingChallenger > button {
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0 7px;
          border: 1px solid rgba(214,224,235,.13);
          border-radius: 999px;
          color: rgba(214,224,235,.68);
          background: rgba(214,224,235,.025);
          cursor: pointer;
          font-family: inherit;
          font-size: .28rem;
          font-weight: 950;
          letter-spacing: .045em;
          white-space: nowrap;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationFullRankingChallenger > button > span {
          font-size: .44rem;
          line-height: 1;
        }

        .stationFullRankingChallenger > button:hover,
        .stationFullRankingChallenger > button.active {
          color: #07101a;
          border-color: #d6e0eb;
          background: #d6e0eb;
          transform: translateY(-1px);
        }

        .stationRankingTrend {
          min-width: 0;
          display: grid;
          gap: 6px;
          margin-top: 6px;
          padding: 7px 8px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 11px;
          background: rgba(255,255,255,.012);
        }

        .stationRankingTrend.live {
          border-color: rgba(143,183,255,.10);
          background:
            linear-gradient(
              110deg,
              rgba(143,183,255,.025),
              rgba(123,245,190,.018)
            );
        }

        .stationRankingTrend.stable {
          border-color: rgba(123,245,190,.10);
          background: rgba(123,245,190,.018);
        }

        .stationRankingTrend.waiting {
          border-style: dashed;
          border-color: rgba(214,224,235,.08);
        }

        .stationRankingTrendHeading {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto auto auto;
          align-items: center;
          gap: 7px;
        }

        .stationRankingTrendHeading > span:first-child {
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(143,183,255,.13);
          border-radius: 8px;
          color: #8fb7ff;
          background: rgba(143,183,255,.03);
          font-size: .48rem;
          line-height: 1;
        }

        .stationRankingTrendHeading > span:nth-child(2) {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationRankingTrendHeading small {
          color: rgba(255,255,255,.27);
          font-size: .21rem;
          font-weight: 950;
          letter-spacing: .055em;
          white-space: nowrap;
        }

        .stationRankingTrendHeading strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.57);
          font-size: .27rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingTrendHeading > b {
          color: rgba(143,183,255,.68);
          font-size: .20rem;
          font-weight: 950;
          letter-spacing: .035em;
          white-space: nowrap;
        }

        .stationRankingTrend.stable
          .stationRankingTrendHeading > b {
          color: #7bf5be;
        }

        .stationRankingTrendUpdated {
          min-width: 98px;
          display: grid;
          justify-items: end;
          gap: 1px;
          padding: 3px 6px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 8px;
          background: rgba(255,255,255,.01);
        }

        .stationRankingTrendUpdated small {
          color: rgba(255,255,255,.20);
          font-size: .14rem;
          font-weight: 950;
          letter-spacing: .045em;
          white-space: nowrap;
        }

        .stationRankingTrendUpdated strong {
          color: rgba(214,224,235,.52);
          font-size: .20rem;
          font-weight: 950;
          letter-spacing: .015em;
          white-space: nowrap;
        }

        .stationRankingTrend.live
          .stationRankingTrendUpdated strong {
          color: rgba(143,183,255,.74);
        }

        .stationRankingTrend.stable
          .stationRankingTrendUpdated strong {
          color: rgba(123,245,190,.68);
        }

        .stationRankingTrendToggle {
          min-height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0 7px;
          border: 1px solid rgba(143,183,255,.11);
          border-radius: 999px;
          color: rgba(255,255,255,.38);
          background: rgba(143,183,255,.02);
          cursor: pointer;
          font-family: inherit;
          font-size: .20rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationRankingTrendToggle > span {
          color: #8fb7ff;
          font-size: .48rem;
          line-height: 1;
        }

        .stationRankingTrendToggle:hover {
          color: #07101a;
          border-color: #8fb7ff;
          background: #8fb7ff;
          transform: translateY(-1px);
        }

        .stationRankingTrendToggle:hover > span {
          color: #07101a;
        }

        .stationRankingTrend.collapsed {
          padding-top: 6px;
          padding-bottom: 6px;
        }

        .stationRankingTrend.collapsed
          .stationRankingTrendCurrent {
          min-height: 34px;
        }

        .stationRankingTrendCurrent {
          min-width: 0;
          min-height: 40px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 7px;
          padding: 5px 7px;
          border: 1px solid rgba(143,183,255,.12);
          border-radius: 9px;
          color: rgba(255,255,255,.56);
          background: rgba(143,183,255,.022);
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationRankingTrendCurrent > span:first-child {
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(143,183,255,.14);
          border-radius: 8px;
          color: #8fb7ff;
          background: rgba(143,183,255,.03);
          font-size: .44rem;
          line-height: 1;
        }

        .stationRankingTrendCurrent > span:nth-child(2) {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationRankingTrendCurrent small {
          color: rgba(255,255,255,.25);
          font-size: .18rem;
          font-weight: 950;
          letter-spacing: .05em;
          white-space: nowrap;
        }

        .stationRankingTrendCurrent strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.62);
          font-size: .24rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingTrendCurrent > b {
          font-size: .23rem;
          font-weight: 950;
          letter-spacing: .025em;
          white-space: nowrap;
        }

        .stationRankingTrendCurrent > b > em {
          font-style: normal;
          font-weight: 950;
        }

        .stationRankingTrendCurrent > b > em.listenerUp {
          color: #7bf5be;
        }

        .stationRankingTrendCurrent > b > em.listenerDown {
          color: #ff9b9b;
        }

        .stationRankingTrendCurrent > b > em.listenerSteady {
          color: rgba(214,224,235,.48);
        }

        .stationRankingTrendCurrent.up > b {
          color: #7bf5be;
        }

        .stationRankingTrendCurrent.down > b {
          color: #ff9b9b;
        }

        .stationRankingTrendCurrent.steady > b {
          color: rgba(214,224,235,.56);
        }

        .stationRankingTrendCurrent.up
          > span:first-child {
          border-color: rgba(123,245,190,.15);
          color: #7bf5be;
          background: rgba(123,245,190,.03);
        }

        .stationRankingTrendCurrent.down
          > span:first-child {
          border-color: rgba(255,125,125,.14);
          color: #ff9b9b;
          background: rgba(255,125,125,.025);
        }

        .stationRankingTrendCurrent.steady
          > span:first-child {
          border-color: rgba(214,224,235,.10);
          color: rgba(214,224,235,.52);
          background: rgba(214,224,235,.018);
        }

        .stationRankingTrendCurrent:hover {
          border-color: var(--accent, #8fb7ff);
          background: rgba(143,183,255,.07);
          transform: translateY(-1px);
        }

        .stationRankingTrendBalance {
          min-width: 0;
          display: grid;
          gap: 5px;
          padding: 6px 7px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 9px;
          background: rgba(255,255,255,.01);
        }

        .stationRankingTrendBalanceHeading {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
        }

        .stationRankingTrendBalanceHeading > span:first-child {
          width: 21px;
          height: 21px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(214,224,235,.10);
          border-radius: 7px;
          color: rgba(214,224,235,.60);
          background: rgba(214,224,235,.018);
          font-size: .39rem;
          line-height: 1;
        }

        .stationRankingTrendBalanceHeading > span:nth-child(2) {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationRankingTrendBalanceHeading small {
          color: rgba(255,255,255,.22);
          font-size: .17rem;
          font-weight: 950;
          letter-spacing: .05em;
          white-space: nowrap;
        }

        .stationRankingTrendBalanceHeading strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.48);
          font-size: .22rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingTrendBalanceHeading > b {
          color: rgba(214,224,235,.50);
          font-size: .18rem;
          font-weight: 950;
          letter-spacing: .03em;
          white-space: nowrap;
        }

        .stationRankingTrendBalanceTrack {
          width: 100%;
          height: 6px;
          display: flex;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.04);
        }

        .stationRankingTrendBalanceTrack > span {
          height: 100%;
          display: block;
          transition: width .28s ease;
        }

        .stationRankingTrendBalanceTrack > span.up {
          background: #7bf5be;
          box-shadow: 0 0 8px rgba(123,245,190,.14);
        }

        .stationRankingTrendBalanceTrack > span.steady {
          background: rgba(214,224,235,.42);
        }

        .stationRankingTrendBalanceTrack > span.down {
          background: #ff9b9b;
          box-shadow: 0 0 8px rgba(255,155,155,.12);
        }

        .stationRankingTrendBalanceLegend {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 4px;
        }

        .stationRankingTrendBalanceLegend > span {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: rgba(255,255,255,.27);
          font-size: .17rem;
          font-weight: 950;
          letter-spacing: .025em;
          white-space: nowrap;
        }

        .stationRankingTrendBalanceLegend i {
          width: 5px;
          height: 5px;
          display: inline-block;
          border-radius: 999px;
        }

        .stationRankingTrendBalanceLegend .up i {
          background: #7bf5be;
        }

        .stationRankingTrendBalanceLegend .steady i {
          background: rgba(214,224,235,.48);
        }

        .stationRankingTrendBalanceLegend .down i {
          background: #ff9b9b;
        }

        .stationRankingTrend.collapsed
          .stationRankingTrendBalance {
          padding-top: 5px;
          padding-bottom: 5px;
        }

        .stationRankingTrend.collapsed
          .stationRankingTrendBalanceLegend {
          display: none;
        }

        .stationRankingPodiumChange {
          min-width: 0;
          display: grid;
          gap: 5px;
          padding: 6px 7px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 9px;
          background: rgba(255,255,255,.01);
        }

        .stationRankingPodiumChange.active {
          border-color: rgba(255,203,92,.12);
          background:
            linear-gradient(
              110deg,
              rgba(255,203,92,.022),
              rgba(143,183,255,.014)
            );
        }

        .stationRankingPodiumChange.stable {
          border-color: rgba(123,245,190,.09);
          background: rgba(123,245,190,.012);
        }

        .stationRankingPodiumChangeHeading {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
        }

        .stationRankingPodiumChangeHeading > span:first-child {
          width: 21px;
          height: 21px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,203,92,.13);
          border-radius: 7px;
          color: #ffcb5c;
          background: rgba(255,203,92,.025);
          font-size: .36rem;
          line-height: 1;
        }

        .stationRankingPodiumChange.stable
          .stationRankingPodiumChangeHeading > span:first-child {
          border-color: rgba(123,245,190,.12);
          color: #7bf5be;
          background: rgba(123,245,190,.02);
        }

        .stationRankingPodiumChangeHeading > span:nth-child(2) {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationRankingPodiumChangeHeading small {
          color: rgba(255,255,255,.22);
          font-size: .17rem;
          font-weight: 950;
          letter-spacing: .05em;
          white-space: nowrap;
        }

        .stationRankingPodiumChangeHeading strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.50);
          font-size: .22rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingPodiumChangeHeading > b {
          color: rgba(255,203,92,.66);
          font-size: .18rem;
          font-weight: 950;
          letter-spacing: .03em;
          white-space: nowrap;
        }

        .stationRankingPodiumChange.stable
          .stationRankingPodiumChangeHeading > b {
          color: rgba(123,245,190,.62);
        }

        .stationRankingLeadershipChange {
          min-width: 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 5px;
        }

        .stationRankingLeadershipChange.stable {
          grid-template-columns: 1fr;
        }

        .stationRankingLeadershipCurrent,
        .stationRankingLeadershipPrevious {
          min-width: 0;
          min-height: 44px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
          padding: 5px 7px;
          border-radius: 9px;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationRankingLeadershipRaceToggle {
          grid-column: 1 / -1;
          width: 100%;
          min-height: 29px;
          display: grid;
          grid-template-columns: auto auto minmax(0, 1fr);
          align-items: center;
          gap: 6px;
          padding: 4px 7px;
          border: 1px solid rgba(255,203,92,.09);
          border-radius: 8px;
          color: rgba(255,255,255,.42);
          background:
            linear-gradient(
              100deg,
              rgba(255,203,92,.018),
              rgba(143,183,255,.012)
            );
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationRankingLeadershipRaceToggle > span {
          width: 18px;
          height: 18px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,203,92,.12);
          border-radius: 6px;
          color: #ffcb5c;
          background: rgba(255,203,92,.025);
          font-size: .28rem;
          font-weight: 950;
          line-height: 1;
        }

        .stationRankingLeadershipRaceToggle > strong {
          color: rgba(255,203,92,.66);
          font-size: .15rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .stationRankingLeadershipRaceToggle > em {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.26);
          font-size: .13rem;
          font-style: normal;
          font-weight: 900;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipRaceCollapsedLeader {
          grid-column: 1 / -1;
          min-width: 0;
          display: grid;
          grid-template-columns:
            auto auto auto auto auto auto auto minmax(0, 1fr);
          align-items: center;
          gap: 5px;
          margin-top: 1px;
          padding: 4px 0 2px;
          border-top: 1px solid rgba(255,255,255,.035);
        }

        .stationRankingLeadershipCollapsedLogo {
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 8px;
          background: rgba(255,255,255,.018);
        }

        .stationRankingLeadershipCollapsedLogo > img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .stationRankingLeadershipCollapsedLogo.leaderLogo {
          border-color: color-mix(
            in srgb,
            var(--accent) 26%,
            rgba(255,255,255,.05)
          );
          box-shadow: 0 0 12px color-mix(
            in srgb,
            var(--accent) 10%,
            transparent
          );
        }

        .stationRankingLeadershipCollapsedLogo.rivalLogo {
          border-color: rgba(143,183,255,.16);
          box-shadow: 0 0 12px rgba(143,183,255,.045);
        }

        .stationRankingLeadershipPlayingMark {
          min-height: 19px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 5px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 999px;
          appearance: none;
          font: inherit;
          font-size: .09rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
          transition:
            transform .16s ease,
            border-color .16s ease,
            background .16s ease,
            color .16s ease;
        }

        .stationRankingLeadershipPlayingMark > i {
          font-size: .10rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipPlayingMark > span {
          font-size: inherit;
          font-weight: inherit;
          letter-spacing: inherit;
          line-height: inherit;
        }

        .stationRankingLeadershipPlayingMark:hover {
          transform: translateY(-1px);
        }

        .stationRankingLeadershipPlayingMark:focus-visible {
          outline: 2px solid color-mix(
            in srgb,
            var(--accent) 70%,
            white
          );
          outline-offset: 2px;
        }

        .stationRankingLeadershipPlayingMark.playing {
          border-color: rgba(123,245,190,.11);
          color: #7bf5be;
          background: rgba(123,245,190,.018);
        }

        .stationRankingLeadershipPlayingMark.playing > i {
          color: #7bf5be;
          animation: stationRankingLeadershipPlayingPulse 1.5s ease-in-out infinite;
        }

        .stationRankingLeadershipPlayingMark.playing:hover {
          border-color: rgba(123,245,190,.24);
          background: rgba(123,245,190,.045);
        }

        .stationRankingLeadershipPlayingMark.paused {
          border-color: rgba(214,224,235,.075);
          color: rgba(214,224,235,.48);
          background: rgba(214,224,235,.01);
        }

        .stationRankingLeadershipPlayingMark.paused > i {
          color: rgba(214,224,235,.42);
          font-size: .09rem;
          font-weight: 950;
        }

        .stationRankingLeadershipPlayingMark.paused:hover {
          border-color: color-mix(
            in srgb,
            var(--accent) 20%,
            rgba(255,255,255,.07)
          );
          color: color-mix(
            in srgb,
            var(--accent) 72%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 3%,
            transparent
          );
        }

        .stationRankingLeadershipPlayingMark.paused:hover > i {
          color: color-mix(
            in srgb,
            var(--accent) 78%,
            white
          );
        }

        @keyframes stationRankingLeadershipPlayingPulse {
          0%,
          100% {
            opacity: .42;
            transform: scale(.84);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .stationRankingLeadershipFavoriteMark {
          min-height: 19px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 5px;
          border: 1px solid rgba(255,112,162,.11);
          border-radius: 999px;
          color: rgba(255,112,162,.82);
          background: rgba(255,112,162,.018);
          font-size: .09rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationRankingLeadershipFavoriteMark > i {
          color: #ff70a2;
          font-size: .13rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipFavoriteMark.leaderFavorite {
          border-color: color-mix(
            in srgb,
            var(--accent) 20%,
            rgba(255,112,162,.10)
          );
        }

        .stationRankingLeadershipFavoriteMark.rivalFavorite {
          border-color: rgba(255,112,162,.13);
        }

        .stationRankingLeadershipRaceCollapsedLeader > small {
          color: color-mix(
            in srgb,
            var(--accent) 72%,
            white
          );
          font-size: .10rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .stationRankingLeadershipRaceCollapsedLeader > b {
          max-width: 140px;
          overflow: hidden;
          color: rgba(255,255,255,.60);
          font-size: .12rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipRaceCollapsedLeader > i {
          color: color-mix(
            in srgb,
            var(--accent) 72%,
            white
          );
          font-size: .11rem;
          font-style: normal;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationRankingLeadershipRaceCollapsedLeader > em {
          padding: 2px 4px;
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 6px;
          font-size: .10rem;
          font-style: normal;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationRankingLeadershipRaceCollapsedLeader
          > em.audienceUp {
          border-color: rgba(123,245,190,.10);
          color: #7bf5be;
          background: rgba(123,245,190,.012);
        }

        .stationRankingLeadershipRaceCollapsedLeader
          > em.audienceDown {
          border-color: rgba(255,155,155,.10);
          color: #ff9b9b;
          background: rgba(255,155,155,.012);
        }

        .stationRankingLeadershipRaceCollapsedLeader
          > em.audienceSteady {
          border-color: rgba(214,224,235,.07);
          color: rgba(214,224,235,.46);
          background: rgba(214,224,235,.01);
        }

        .stationRankingLeadershipRaceCollapsedLeader > strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.34);
          font-size: .11rem;
          font-weight: 850;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadPulse {
          grid-column: 1 / -1;
          min-width: 0;
          display: grid;
          gap: 4px;
          padding: 4px 0 3px;
          border-top: 1px solid rgba(255,255,255,.035);
        }

        .stationRankingLeadershipHeadToHeadPulse.collapsed
          > :not(.stationRankingLeadershipHeadToHeadHeading) {
          display: none;
        }

        .stationRankingLeadershipHeadToHeadPulse.collapsed {
          padding-bottom: 4px;
        }

        .stationRankingLeadershipHeadToHeadPulse > small {
          color: rgba(255,255,255,.18);
          font-size: .10rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadHeading {
          min-width: 0;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
        }

        .stationRankingLeadershipHeadToHeadHeading > small {
          color: rgba(255,255,255,.30);
          font-size: .10rem;
          font-weight: 950;
          letter-spacing: .05em;
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadHeading > em {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 5px;
          border: 1px solid rgba(143,183,255,.07);
          border-radius: 6px;
          color: rgba(143,183,255,.48);
          background: rgba(143,183,255,.008);
          font-size: .085rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadHeading > em > i {
          color: #8fb7ff;
          font-size: .10rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipHeadToHeadCollapsedSummary {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.42);
          font-size: .09rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadCollapsedAdvantage {
          min-height: 20px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 999px;
          background: rgba(255,255,255,.01);
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadCollapsedAdvantage > i {
          width: 14px;
          height: 14px;
          display: grid;
          place-items: center;
          border-radius: 5px;
          font-size: .09rem;
          font-style: normal;
          font-weight: 950;
          line-height: 1;
        }

        .stationRankingLeadershipHeadToHeadCollapsedAdvantage > b {
          font-size: .085rem;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
        }

        .stationRankingLeadershipHeadToHeadCollapsedAdvantage.leading {
          border-color: color-mix(
            in srgb,
            var(--accent) 18%,
            rgba(255,255,255,.04)
          );
          background: color-mix(
            in srgb,
            var(--accent) 3%,
            transparent
          );
        }

        .stationRankingLeadershipHeadToHeadCollapsedAdvantage.leading > i,
        .stationRankingLeadershipHeadToHeadCollapsedAdvantage.leading > b {
          color: color-mix(
            in srgb,
            var(--accent) 80%,
            white
          );
        }

        .stationRankingLeadershipHeadToHeadCollapsedAdvantage.close {
          border-color: rgba(255,203,92,.11);
          background: rgba(255,203,92,.01);
        }

        .stationRankingLeadershipHeadToHeadCollapsedAdvantage.close > i,
        .stationRankingLeadershipHeadToHeadCollapsedAdvantage.close > b {
          color: #ffcb5c;
        }

        .stationRankingLeadershipHeadToHeadCollapsedAdvantage.tied {
          border-color: rgba(143,183,255,.09);
          background: rgba(143,183,255,.008);
        }

        .stationRankingLeadershipHeadToHeadCollapsedAdvantage.tied > i,
        .stationRankingLeadershipHeadToHeadCollapsedAdvantage.tied > b {
          color: #8fb7ff;
        }

        .stationRankingLeadershipHeadToHeadCollapsedMoment {
          min-height: 20px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 999px;
          background: rgba(255,255,255,.01);
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadCollapsedMoment > i {
          width: 14px;
          height: 14px;
          display: grid;
          place-items: center;
          border-radius: 5px;
          font-size: .09rem;
          font-style: normal;
          font-weight: 950;
          line-height: 1;
        }

        .stationRankingLeadershipHeadToHeadCollapsedMoment > b {
          font-size: .082rem;
          font-weight: 950;
          letter-spacing: .02em;
          line-height: 1;
        }

        .stationRankingLeadershipHeadToHeadCollapsedMoment.leader {
          border-color: color-mix(
            in srgb,
            var(--accent) 18%,
            rgba(255,255,255,.04)
          );
          background: color-mix(
            in srgb,
            var(--accent) 3%,
            transparent
          );
        }

        .stationRankingLeadershipHeadToHeadCollapsedMoment.leader > i,
        .stationRankingLeadershipHeadToHeadCollapsedMoment.leader > b {
          color: color-mix(
            in srgb,
            var(--accent) 80%,
            white
          );
        }

        .stationRankingLeadershipHeadToHeadCollapsedMoment.rival {
          border-color: rgba(255,155,155,.10);
          background: rgba(255,155,155,.01);
        }

        .stationRankingLeadershipHeadToHeadCollapsedMoment.rival > i,
        .stationRankingLeadershipHeadToHeadCollapsedMoment.rival > b {
          color: #ff9b9b;
        }

        .stationRankingLeadershipHeadToHeadCollapsedMoment.tied {
          border-color: rgba(143,183,255,.09);
          background: rgba(143,183,255,.008);
        }

        .stationRankingLeadershipHeadToHeadCollapsedMoment.tied > i,
        .stationRankingLeadershipHeadToHeadCollapsedMoment.tied > b {
          color: #8fb7ff;
        }

        .stationRankingLeadershipHeadToHeadCollapsedTrend {
          min-height: 20px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 999px;
          background: rgba(255,255,255,.01);
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadCollapsedTrend > i {
          width: 14px;
          height: 14px;
          display: grid;
          place-items: center;
          border-radius: 5px;
          font-size: .09rem;
          font-style: normal;
          font-weight: 950;
          line-height: 1;
        }

        .stationRankingLeadershipHeadToHeadCollapsedTrend > b {
          font-size: .082rem;
          font-weight: 950;
          letter-spacing: .02em;
          line-height: 1;
        }

        .stationRankingLeadershipHeadToHeadCollapsedTrend.opening {
          border-color: rgba(123,245,190,.09);
          background: rgba(123,245,190,.009);
        }

        .stationRankingLeadershipHeadToHeadCollapsedTrend.opening > i,
        .stationRankingLeadershipHeadToHeadCollapsedTrend.opening > b {
          color: #7bf5be;
        }

        .stationRankingLeadershipHeadToHeadCollapsedTrend.closing {
          border-color: rgba(255,155,155,.10);
          background: rgba(255,155,155,.01);
        }

        .stationRankingLeadershipHeadToHeadCollapsedTrend.closing > i,
        .stationRankingLeadershipHeadToHeadCollapsedTrend.closing > b {
          color: #ff9b9b;
        }

        .stationRankingLeadershipHeadToHeadCollapsedTrend.steady {
          border-color: rgba(143,183,255,.09);
          background: rgba(143,183,255,.008);
        }

        .stationRankingLeadershipHeadToHeadCollapsedTrend.steady > i,
        .stationRankingLeadershipHeadToHeadCollapsedTrend.steady > b {
          color: #8fb7ff;
        }

        .stationRankingLeadershipHeadToHeadCollapsedBar {
          position: relative;
          width: 112px;
          height: 8px;
          display: flex;
          flex: 0 0 112px;
          overflow: hidden;
          padding: 0;
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 999px;
          appearance: none;
          background: rgba(255,255,255,.025);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,.08);
          cursor: pointer;
          transition:
            transform .16s ease,
            border-color .16s ease,
            box-shadow .16s ease;
        }

        .stationRankingLeadershipHeadToHeadCollapsedBar:hover {
          border-color: color-mix(
            in srgb,
            var(--accent) 24%,
            rgba(255,255,255,.05)
          );
          box-shadow:
            inset 0 0 0 1px rgba(0,0,0,.08),
            0 0 10px color-mix(
              in srgb,
              var(--accent) 12%,
              transparent
            );
          transform: translateY(-1px);
        }

        .stationRankingLeadershipHeadToHeadCollapsedBar:focus-visible {
          outline: 2px solid color-mix(
            in srgb,
            var(--accent) 70%,
            white
          );
          outline-offset: 2px;
        }

        .stationRankingLeadershipHeadToHeadCollapsedBar > i {
          height: 100%;
          display: block;
          font-style: normal;
          transition: width .48s cubic-bezier(.22,.78,.24,1);
        }

        .stationRankingLeadershipHeadToHeadCollapsedBar > i.leader {
          background: color-mix(
            in srgb,
            var(--accent) 78%,
            rgba(255,255,255,.10)
          );
        }

        .stationRankingLeadershipHeadToHeadCollapsedBar > i.rival {
          background: rgba(143,183,255,.62);
        }

        .stationRankingLeadershipHeadToHeadCollapsedBar > .midpoint {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 1px;
          background: rgba(255,255,255,.72);
          box-shadow: 0 0 4px rgba(255,255,255,.18);
          transform: translateX(-50%);
          pointer-events: none;
        }

        .stationRankingLeadershipHeadToHeadCollapsedBar > .leaderMarker {
          position: absolute;
          top: 32%;
          z-index: 3;
          width: 10px;
          height: 10px;
          display: grid;
          place-items: center;
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 64%,
            white
          );
          border-radius: 999px;
          color: color-mix(
            in srgb,
            var(--accent) 86%,
            white
          );
          background: #07101a;
          box-shadow:
            0 0 0 2px rgba(7,16,26,.72),
            0 0 8px color-mix(
              in srgb,
              var(--accent) 28%,
              transparent
            );
          font-size: .065rem;
          font-weight: 950;
          line-height: 1;
          transform: translate(-50%, -50%);
          transition:
            left .48s cubic-bezier(.22,.78,.24,1),
            border-color .18s ease,
            box-shadow .18s ease;
          pointer-events: none;
        }

        .stationRankingLeadershipHeadToHeadCollapsedBar > .rivalMarker {
          position: absolute;
          top: 68%;
          z-index: 3;
          width: 10px;
          height: 10px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(143,183,255,.82);
          border-radius: 999px;
          color: #8fb7ff;
          background: #07101a;
          box-shadow:
            0 0 0 2px rgba(7,16,26,.72),
            0 0 8px rgba(143,183,255,.24);
          font-size: .065rem;
          font-weight: 950;
          line-height: 1;
          transform: translate(-50%, -50%);
          transition:
            left .48s cubic-bezier(.22,.78,.24,1),
            border-color .18s ease,
            box-shadow .18s ease;
          pointer-events: none;
        }

        .stationRankingLeadershipCollapsedMarkerLegend {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
        }

        .stationRankingLeadershipCollapsedMarkerLegend > small {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: rgba(255,255,255,.24);
          font-size: .078rem;
          font-weight: 950;
          letter-spacing: .03em;
          white-space: nowrap;
        }

        .stationRankingLeadershipCollapsedMarkerLegend > small > i {
          font-size: .08rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipCollapsedMarkerLegend > small > i.leader {
          color: color-mix(
            in srgb,
            var(--accent) 84%,
            white
          );
        }

        .stationRankingLeadershipCollapsedMarkerLegend > small > i.rival {
          color: #8fb7ff;
        }

        .stationRankingLeadershipHeadToHeadToggle {
          min-height: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin-left: auto;
          padding: 3px 7px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 7px;
          appearance: none;
          color: rgba(255,255,255,.42);
          background: rgba(255,255,255,.012);
          font: inherit;
          font-size: .085rem;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
          transition:
            border-color .16s ease,
            color .16s ease,
            background .16s ease,
            transform .16s ease;
        }

        .stationRankingLeadershipHeadToHeadToggle > span {
          color: color-mix(
            in srgb,
            var(--accent) 72%,
            white
          );
          font-size: .13rem;
          line-height: 1;
        }

        .stationRankingLeadershipHeadToHeadToggle:hover {
          border-color: color-mix(
            in srgb,
            var(--accent) 20%,
            rgba(255,255,255,.06)
          );
          color: color-mix(
            in srgb,
            var(--accent) 76%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 3%,
            transparent
          );
          transform: translateY(-1px);
        }

        .stationRankingLeadershipHeadToHeadToggle:focus-visible {
          outline: 2px solid color-mix(
            in srgb,
            var(--accent) 70%,
            white
          );
          outline-offset: 2px;
        }

        .stationRankingLeadershipHeadToHeadLabels {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .stationRankingLeadershipHeadToHeadLabels > b {
          min-width: 0;
          overflow: hidden;
          font-size: .10rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadLabels > b:first-child {
          color: color-mix(
            in srgb,
            var(--accent) 78%,
            white
          );
        }

        .stationRankingLeadershipHeadToHeadLabels > b:last-child {
          color: #8fb7ff;
          text-align: right;
        }

        .stationRankingLeadershipHeadToHeadAdvantage {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 5px;
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 7px;
          background: rgba(255,255,255,.008);
        }

        .stationRankingLeadershipHeadToHeadAdvantage > i {
          width: 16px;
          height: 16px;
          display: grid;
          place-items: center;
          border-radius: 6px;
          font-size: .12rem;
          font-style: normal;
          font-weight: 950;
          line-height: 1;
        }

        .stationRankingLeadershipHeadToHeadAdvantage > strong {
          min-width: 0;
          overflow: hidden;
          font-size: .10rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadAdvantage.leading {
          border-color: color-mix(
            in srgb,
            var(--accent) 16%,
            rgba(255,255,255,.04)
          );
          background: color-mix(
            in srgb,
            var(--accent) 3%,
            transparent
          );
        }

        .stationRankingLeadershipHeadToHeadAdvantage.leading > i,
        .stationRankingLeadershipHeadToHeadAdvantage.leading > strong {
          color: color-mix(
            in srgb,
            var(--accent) 78%,
            white
          );
        }

        .stationRankingLeadershipHeadToHeadAdvantage.close {
          border-color: rgba(255,203,92,.10);
          background: rgba(255,203,92,.01);
        }

        .stationRankingLeadershipHeadToHeadAdvantage.close > i,
        .stationRankingLeadershipHeadToHeadAdvantage.close > strong {
          color: #ffcb5c;
        }

        .stationRankingLeadershipHeadToHeadAdvantage.tied {
          border-color: rgba(143,183,255,.09);
          background: rgba(143,183,255,.01);
        }

        .stationRankingLeadershipHeadToHeadAdvantage.tied > i,
        .stationRankingLeadershipHeadToHeadAdvantage.tied > strong {
          color: #8fb7ff;
        }

        .stationRankingLeadershipHeadToHeadTrend {
          min-width: 0;
          display: grid;
          grid-template-columns: auto auto minmax(0, 1fr);
          align-items: center;
          gap: 5px;
          padding: 3px 5px;
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 7px;
          background: rgba(255,255,255,.008);
        }

        .stationRankingLeadershipHeadToHeadTrend > small {
          color: rgba(255,255,255,.18);
          font-size: .10rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadTrend > i {
          width: 16px;
          height: 16px;
          display: grid;
          place-items: center;
          border-radius: 6px;
          font-size: .13rem;
          font-style: normal;
          font-weight: 950;
          line-height: 1;
        }

        .stationRankingLeadershipHeadToHeadTrend > strong {
          min-width: 0;
          overflow: hidden;
          font-size: .10rem;
          font-weight: 950;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadTrend.opening {
          border-color: rgba(123,245,190,.09);
          background: rgba(123,245,190,.009);
        }

        .stationRankingLeadershipHeadToHeadTrend.opening > i,
        .stationRankingLeadershipHeadToHeadTrend.opening > strong {
          color: #7bf5be;
        }

        .stationRankingLeadershipHeadToHeadTrend.closing {
          border-color: rgba(255,155,155,.10);
          background: rgba(255,155,155,.01);
        }

        .stationRankingLeadershipHeadToHeadTrend.closing > i,
        .stationRankingLeadershipHeadToHeadTrend.closing > strong {
          color: #ff9b9b;
        }

        .stationRankingLeadershipHeadToHeadTrend.steady {
          border-color: rgba(143,183,255,.08);
          background: rgba(143,183,255,.008);
        }

        .stationRankingLeadershipHeadToHeadTrend.steady > i,
        .stationRankingLeadershipHeadToHeadTrend.steady > strong {
          color: #8fb7ff;
        }

        .stationRankingLeadershipMomentWinner {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 7px;
          padding: 3px 5px;
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 7px;
          background: rgba(255,255,255,.008);
        }

        .stationRankingLeadershipMomentWinner > small {
          color: rgba(255,255,255,.18);
          font-size: .10rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .stationRankingLeadershipMomentWinner > span {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 5px;
        }

        .stationRankingLeadershipMomentWinner > span > i {
          width: 16px;
          height: 16px;
          display: grid;
          place-items: center;
          border-radius: 6px;
          font-size: .11rem;
          font-style: normal;
          font-weight: 950;
          line-height: 1;
        }

        .stationRankingLeadershipMomentWinner > span > b {
          min-width: 0;
          overflow: hidden;
          font-size: .10rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipMomentWinner > em {
          grid-column: 1 / -1;
          min-width: 0;
          padding-top: 2px;
          border-top: 1px solid rgba(255,255,255,.035);
          color: rgba(255,255,255,.24);
          font-size: .09rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .03em;
          text-align: right;
          white-space: nowrap;
        }

        .stationRankingLeadershipMomentWinner.leader > em {
          color: color-mix(
            in srgb,
            var(--accent) 62%,
            white
          );
        }

        .stationRankingLeadershipMomentWinner.rival > em {
          color: rgba(255,155,155,.72);
        }

        .stationRankingLeadershipMomentWinner.tied > em {
          color: rgba(143,183,255,.62);
        }

        .stationRankingLeadershipMomentWinner.leader {
          border-color: color-mix(
            in srgb,
            var(--accent) 18%,
            rgba(255,255,255,.04)
          );
          background: color-mix(
            in srgb,
            var(--accent) 3%,
            transparent
          );
        }

        .stationRankingLeadershipMomentWinner.leader > span > i,
        .stationRankingLeadershipMomentWinner.leader > span > b {
          color: color-mix(
            in srgb,
            var(--accent) 80%,
            white
          );
        }

        .stationRankingLeadershipMomentWinner.rival {
          border-color: rgba(255,155,155,.10);
          background: rgba(255,155,155,.01);
        }

        .stationRankingLeadershipMomentWinner.rival > span > i,
        .stationRankingLeadershipMomentWinner.rival > span > b {
          color: #ff9b9b;
        }

        .stationRankingLeadershipMomentWinner.tied {
          border-color: rgba(143,183,255,.08);
          background: rgba(143,183,255,.008);
        }

        .stationRankingLeadershipMomentWinner.tied > span > i,
        .stationRankingLeadershipMomentWinner.tied > span > b {
          color: #8fb7ff;
        }

        .stationRankingLeadershipHeadToHeadBar {
          position: relative;
          width: 100%;
          height: 8px;
          margin-top: 12px;
          margin-bottom: 12px;
          display: flex;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.03);
        }

        .stationRankingLeadershipHeadToHeadMidpoint {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 1px;
          background: rgba(255,255,255,.68);
          box-shadow:
            0 0 0 1px rgba(0,0,0,.18),
            0 0 5px rgba(255,255,255,.18);
          transform: translateX(-50%);
          pointer-events: none;
        }

        .stationRankingLeadershipHeadToHeadLeaderMarker {
          position: absolute;
          top: 50%;
          z-index: 2;
          width: 12px;
          height: 12px;
          display: grid;
          place-items: center;
          padding: 0;
          appearance: none;
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 60%,
            white
          );
          border-radius: 999px;
          color: color-mix(
            in srgb,
            var(--accent) 84%,
            white
          );
          background: #07101a;
          box-shadow:
            0 0 0 2px rgba(7,16,26,.78),
            0 0 10px color-mix(
              in srgb,
              var(--accent) 28%,
              transparent
            );
          transform: translate(-50%, -50%);
          transition:
            left .48s cubic-bezier(.22,.78,.24,1),
            border-color .18s ease,
            box-shadow .18s ease;
          cursor: pointer;
          pointer-events: auto;
        }

        .stationRankingLeadershipHeadToHeadLeaderMarker:hover {
          border-color: color-mix(
            in srgb,
            var(--accent) 88%,
            white
          );
          box-shadow:
            0 0 0 3px rgba(7,16,26,.82),
            0 0 14px color-mix(
              in srgb,
              var(--accent) 42%,
              transparent
            );
        }

        .stationRankingLeadershipHeadToHeadLeaderMarker:focus-visible {
          outline: 2px solid color-mix(
            in srgb,
            var(--accent) 74%,
            white
          );
          outline-offset: 3px;
        }

        .stationRankingLeadershipHeadToHeadLeaderMarker > i {
          font-size: .08rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipHeadToHeadLeaderMarker > b {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 5px);
          min-width: 26px;
          padding: 2px 4px;
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 26%,
            rgba(255,255,255,.08)
          );
          border-radius: 6px;
          color: color-mix(
            in srgb,
            var(--accent) 82%,
            white
          );
          background: rgba(7,16,26,.94);
          box-shadow: 0 4px 12px rgba(0,0,0,.20);
          font-size: .082rem;
          font-weight: 950;
          letter-spacing: .015em;
          line-height: 1;
          text-align: center;
          white-space: nowrap;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .stationRankingLeadershipHeadToHeadLeaderMarker > b::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          width: 0;
          height: 0;
          border-left: 3px solid transparent;
          border-right: 3px solid transparent;
          border-top: 4px solid rgba(7,16,26,.94);
          transform: translateX(-50%);
        }

        .stationRankingLeadershipHeadToHeadRivalMarker {
          position: absolute;
          top: 50%;
          z-index: 2;
          width: 12px;
          height: 12px;
          display: grid;
          place-items: center;
          padding: 0;
          appearance: none;
          border: 1px solid rgba(143,183,255,.82);
          border-radius: 999px;
          color: #8fb7ff;
          background: #07101a;
          box-shadow:
            0 0 0 2px rgba(7,16,26,.78),
            0 0 10px rgba(143,183,255,.24);
          transform: translate(-50%, -50%);
          transition:
            left .48s cubic-bezier(.22,.78,.24,1),
            border-color .18s ease,
            box-shadow .18s ease;
          cursor: pointer;
          pointer-events: auto;
        }

        .stationRankingLeadershipHeadToHeadRivalMarker:hover {
          border-color: #b8d1ff;
          box-shadow:
            0 0 0 3px rgba(7,16,26,.82),
            0 0 14px rgba(143,183,255,.36);
        }

        .stationRankingLeadershipHeadToHeadRivalMarker:focus-visible {
          outline: 2px solid #8fb7ff;
          outline-offset: 3px;
        }

        .stationRankingLeadershipHeadToHeadRivalMarker > i {
          font-size: .08rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipHeadToHeadRivalMarker > b {
          position: absolute;
          top: calc(100% + 5px);
          left: 50%;
          min-width: 26px;
          padding: 2px 4px;
          border: 1px solid rgba(143,183,255,.24);
          border-radius: 6px;
          color: #8fb7ff;
          background: rgba(7,16,26,.94);
          box-shadow: 0 4px 12px rgba(0,0,0,.20);
          font-size: .082rem;
          font-weight: 950;
          letter-spacing: .015em;
          line-height: 1;
          text-align: center;
          white-space: nowrap;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .stationRankingLeadershipHeadToHeadRivalMarker > b::before {
          content: "";
          position: absolute;
          bottom: 100%;
          left: 50%;
          width: 0;
          height: 0;
          border-left: 3px solid transparent;
          border-right: 3px solid transparent;
          border-bottom: 4px solid rgba(7,16,26,.94);
          transform: translateX(-50%);
        }

        .stationRankingLeadershipMarkerActionLabel {
          position: absolute;
          z-index: 6;
          width: min(188px, calc(100vw - 34px));
          min-width: 0;
          display: grid;
          gap: 3px;
          padding: 6px 7px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 8px;
          color: rgba(255,255,255,.70);
          background: rgba(7,16,26,.97);
          box-shadow: 0 8px 22px rgba(0,0,0,.28);
          line-height: 1.15;
          opacity: 0;
          visibility: hidden;
          transform: translateY(2px);
          transition:
            opacity .16s ease,
            transform .16s ease,
            visibility .16s ease;
          pointer-events: none;
        }

        .stationRankingLeadershipMarkerIdentity {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 6px;
        }

        .stationRankingLeadershipMarkerIdentity > span:last-child {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .stationRankingLeadershipMarkerIdentity small {
          color: rgba(255,255,255,.34);
          font-size: .072rem;
          font-weight: 950;
          letter-spacing: .045em;
          white-space: nowrap;
        }

        .stationRankingLeadershipMarkerIdentity b {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.76);
          font-size: .085rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipMarkerGenre {
          width: fit-content;
          max-width: 100%;
          overflow: hidden;
          padding: 2px 4px;
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 14%,
            rgba(255,255,255,.05)
          );
          border-radius: 999px;
          color: color-mix(
            in srgb,
            var(--accent) 62%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 2%,
            transparent
          );
          font-size: .064rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .04em;
          line-height: 1;
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .stationRankingLeadershipMarkerGenre.rivalGenre {
          border-color: rgba(143,183,255,.12);
          color: rgba(143,183,255,.72);
          background: rgba(143,183,255,.008);
        }

        .stationRankingLeadershipMarkerSlogan {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.30);
          font-size: .066rem;
          font-weight: 800;
          letter-spacing: .02em;
          line-height: 1.15;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipMarkerSlogan.rivalSlogan {
          color: rgba(143,183,255,.42);
        }

        .stationRankingLeadershipMarkerLogo {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 8px;
          background: rgba(255,255,255,.018);
        }

        .stationRankingLeadershipMarkerLogo > img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .stationRankingLeadershipMarkerLogo.leaderLogo {
          border-color: color-mix(
            in srgb,
            var(--accent) 24%,
            rgba(255,255,255,.05)
          );
          box-shadow: 0 0 10px color-mix(
            in srgb,
            var(--accent) 10%,
            transparent
          );
        }

        .stationRankingLeadershipMarkerLogo.rivalLogo {
          border-color: rgba(143,183,255,.16);
          box-shadow: 0 0 10px rgba(143,183,255,.045);
        }

        .stationRankingLeadershipMarkerNowPlaying {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 6px;
          margin-top: 1px;
          padding-top: 4px;
          border-top: 1px solid rgba(255,255,255,.04);
        }

        .stationRankingLeadershipMarkerNowPlaying > span:last-child {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .stationRankingLeadershipMarkerNowPlayingHeading {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 5px;
        }

        .stationRankingLeadershipMarkerNowPlaying small {
          color: rgba(255,255,255,.22);
          font-size: .064rem;
          font-weight: 950;
          letter-spacing: .04em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationRankingLeadershipMarkerLiveBadge {
          min-height: 15px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 4px;
          border: 1px solid rgba(123,245,190,.10);
          border-radius: 999px;
          color: #7bf5be;
          background: rgba(123,245,190,.01);
          font-size: .061rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationRankingLeadershipMarkerLiveBars {
          height: 9px;
          display: inline-flex;
          align-items: flex-end;
          gap: 1.5px;
        }

        .stationRankingLeadershipMarkerLiveBars > i {
          width: 2px;
          height: 100%;
          display: block;
          border-radius: 999px;
          background: #7bf5be;
          transform-origin: center bottom;
          animation: stationRankingLeadershipMarkerLiveBars .72s ease-in-out infinite;
        }

        .stationRankingLeadershipMarkerLiveBars > i:nth-child(2) {
          animation-delay: -.22s;
        }

        .stationRankingLeadershipMarkerLiveBars > i:nth-child(3) {
          animation-delay: -.44s;
        }

        .stationRankingLeadershipMarkerLiveBadge.rivalLive {
          border-color: rgba(143,183,255,.12);
          color: #8fb7ff;
          background: rgba(143,183,255,.008);
        }

        .stationRankingLeadershipMarkerLiveBadge.rivalLive
          .stationRankingLeadershipMarkerLiveBars > i {
          background: #8fb7ff;
        }

        @keyframes stationRankingLeadershipMarkerLiveBars {
          0%,
          100% {
            opacity: .45;
            transform: scaleY(.35);
          }

          50% {
            opacity: 1;
            transform: scaleY(1);
          }
        }

        .stationRankingLeadershipMarkerNowPlaying em {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.42);
          font-size: .074rem;
          font-style: normal;
          font-weight: 850;
          line-height: 1.15;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipMarkerNowPlaying.rivalNowPlaying em {
          color: rgba(143,183,255,.52);
        }

        .stationRankingLeadershipMarkerArtwork {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 16%,
            rgba(255,255,255,.05)
          );
          border-radius: 8px;
          background: rgba(255,255,255,.018);
        }

        .stationRankingLeadershipMarkerArtwork > img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .stationRankingLeadershipMarkerArtwork.rivalArtwork {
          border-color: rgba(143,183,255,.14);
        }

        .stationRankingLeadershipMarkerStatusRow {
          min-width: 0;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
        }

        .stationRankingLeadershipMarkerAudioStatus,
        .stationRankingLeadershipMarkerFavoriteStatus {
          min-height: 17px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 4px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 999px;
          font-size: .067rem;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationRankingLeadershipMarkerAudioStatus > i,
        .stationRankingLeadershipMarkerFavoriteStatus > i {
          font-size: .068rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipMarkerAudioStatus.playing {
          border-color: rgba(123,245,190,.10);
          color: #7bf5be;
          background: rgba(123,245,190,.01);
        }

        .stationRankingLeadershipMarkerAudioStatus.playing > i {
          color: #7bf5be;
        }

        .stationRankingLeadershipMarkerAudioStatus.paused {
          border-color: rgba(214,224,235,.07);
          color: rgba(214,224,235,.46);
          background: rgba(214,224,235,.008);
        }

        .stationRankingLeadershipMarkerAudioStatus.paused > i {
          color: rgba(214,224,235,.42);
        }

        .stationRankingLeadershipMarkerFavoriteStatus {
          border-color: rgba(255,112,162,.12);
          color: rgba(255,112,162,.82);
          background: rgba(255,112,162,.012);
        }

        .stationRankingLeadershipMarkerFavoriteStatus > i {
          color: #ff70a2;
        }

        .stationRankingLeadershipMarkerFavoriteStatus.rivalFavoriteStatus {
          border-color: rgba(255,112,162,.14);
        }

        .stationRankingLeadershipMarkerAudience {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: color-mix(
            in srgb,
            var(--accent) 68%,
            white
          );
          font-size: .073rem;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationRankingLeadershipMarkerAudience > i {
          color: #7bf5be;
          font-size: .065rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipMarkerAudience.rivalAudience {
          color: rgba(143,183,255,.72);
        }

        .stationRankingLeadershipMarkerAudience.rivalAudience > i {
          color: #8fb7ff;
        }

        .stationRankingLeadershipMarkerChange {
          width: fit-content;
          padding: 2px 4px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 6px;
          font-size: .071rem;
          font-weight: 950;
          letter-spacing: .02em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationRankingLeadershipMarkerChange.positive {
          border-color: rgba(123,245,190,.10);
          color: #7bf5be;
          background: rgba(123,245,190,.01);
        }

        .stationRankingLeadershipMarkerChange.negative {
          border-color: rgba(255,155,155,.10);
          color: #ff9b9b;
          background: rgba(255,155,155,.01);
        }

        .stationRankingLeadershipMarkerChange.neutral {
          border-color: rgba(143,183,255,.08);
          color: rgba(143,183,255,.60);
          background: rgba(143,183,255,.008);
        }

        .stationRankingLeadershipMarkerMovement {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 4px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 6px;
          font-size: .071rem;
          font-weight: 950;
          letter-spacing: .02em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationRankingLeadershipMarkerMovement > i {
          font-size: .075rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipMarkerMovement.up {
          border-color: rgba(123,245,190,.10);
          color: #7bf5be;
          background: rgba(123,245,190,.01);
        }

        .stationRankingLeadershipMarkerMovement.down {
          border-color: rgba(255,155,155,.10);
          color: #ff9b9b;
          background: rgba(255,155,155,.01);
        }

        .stationRankingLeadershipMarkerMovement.steady {
          border-color: rgba(143,183,255,.08);
          color: rgba(143,183,255,.60);
          background: rgba(143,183,255,.008);
        }

        .stationRankingLeadershipMarkerGap {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 4px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 6px;
          font-size: .071rem;
          font-weight: 950;
          letter-spacing: .02em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationRankingLeadershipMarkerGap > i {
          font-size: .072rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipMarkerGap.leaderGap {
          border-color: color-mix(
            in srgb,
            var(--accent) 16%,
            rgba(255,255,255,.05)
          );
          color: color-mix(
            in srgb,
            var(--accent) 76%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 3%,
            transparent
          );
        }

        .stationRankingLeadershipMarkerGap.rivalGap {
          border-color: rgba(255,203,92,.10);
          color: #ffcb5c;
          background: rgba(255,203,92,.01);
        }

        .stationRankingLeadershipMarkerGap.tied {
          border-color: rgba(143,183,255,.09);
          color: #8fb7ff;
          background: rgba(143,183,255,.008);
        }

        .stationRankingLeadershipMarkerGoal {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 4px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 6px;
          font-size: .069rem;
          font-weight: 950;
          letter-spacing: .02em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationRankingLeadershipMarkerGoal > i {
          min-width: 15px;
          display: inline-grid;
          place-items: center;
          font-size: .065rem;
          font-style: normal;
          font-weight: 950;
          line-height: 1;
        }

        .stationRankingLeadershipMarkerGoal.leaderGoal {
          border-color: color-mix(
            in srgb,
            var(--accent) 14%,
            rgba(255,255,255,.05)
          );
          color: color-mix(
            in srgb,
            var(--accent) 68%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 2%,
            transparent
          );
        }

        .stationRankingLeadershipMarkerGoal.rivalGoal {
          border-color: rgba(255,203,92,.10);
          color: #ffcb5c;
          background: rgba(255,203,92,.01);
        }

        .stationRankingLeadershipMarkerUpdated {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          margin-top: 1px;
          padding-top: 3px;
          border-top: 1px solid rgba(255,255,255,.045);
          color: rgba(255,255,255,.26);
          font-size: .068rem;
          font-weight: 900;
          letter-spacing: .025em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationRankingLeadershipMarkerUpdated > i {
          color: color-mix(
            in srgb,
            var(--accent) 56%,
            white
          );
          font-size: .075rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipMarkerUpdated.rivalUpdated > i {
          color: #8fb7ff;
        }

        .stationRankingLeadershipMarkerActionLabel.leaderAction {
          right: calc(100% + 7px);
          top: 50%;
          color: color-mix(
            in srgb,
            var(--accent) 78%,
            white
          );
          border-color: color-mix(
            in srgb,
            var(--accent) 22%,
            rgba(255,255,255,.06)
          );
          transform: translateY(-50%) translateX(2px);
        }

        .stationRankingLeadershipMarkerActionLabel.leaderAction
          .stationRankingLeadershipMarkerIdentity small,
        .stationRankingLeadershipMarkerActionLabel.leaderAction
          .stationRankingLeadershipMarkerIdentity b {
          color: color-mix(
            in srgb,
            var(--accent) 72%,
            white
          );
        }

        .stationRankingLeadershipMarkerActionLabel.rivalAction {
          left: calc(100% + 7px);
          top: 50%;
          color: #8fb7ff;
          border-color: rgba(143,183,255,.16);
          transform: translateY(-50%) translateX(-2px);
        }

        .stationRankingLeadershipMarkerActionLabel.rivalAction
          .stationRankingLeadershipMarkerIdentity small,
        .stationRankingLeadershipMarkerActionLabel.rivalAction
          .stationRankingLeadershipMarkerIdentity b {
          color: #8fb7ff;
        }

        .stationRankingLeadershipMarkerActionLabel.leaderAction.flipRight {
          right: auto;
          left: calc(100% + 7px);
          transform: translateY(-50%) translateX(-2px);
        }

        .stationRankingLeadershipMarkerActionLabel.rivalAction.flipLeft {
          left: auto;
          right: calc(100% + 7px);
          transform: translateY(-50%) translateX(2px);
        }

        .stationRankingLeadershipHeadToHeadLeaderMarker:hover
          > .stationRankingLeadershipMarkerActionLabel.leaderAction.flipRight,
        .stationRankingLeadershipHeadToHeadLeaderMarker:focus-visible
          > .stationRankingLeadershipMarkerActionLabel.leaderAction.flipRight,
        .stationRankingLeadershipHeadToHeadRivalMarker:hover
          > .stationRankingLeadershipMarkerActionLabel.rivalAction.flipLeft,
        .stationRankingLeadershipHeadToHeadRivalMarker:focus-visible
          > .stationRankingLeadershipMarkerActionLabel.rivalAction.flipLeft {
          transform: translateY(-50%) translateX(0);
        }

        .stationRankingLeadershipHeadToHeadLeaderMarker:hover
          > .stationRankingLeadershipMarkerActionLabel,
        .stationRankingLeadershipHeadToHeadLeaderMarker:focus-visible
          > .stationRankingLeadershipMarkerActionLabel,
        .stationRankingLeadershipHeadToHeadRivalMarker:hover
          > .stationRankingLeadershipMarkerActionLabel,
        .stationRankingLeadershipHeadToHeadRivalMarker:focus-visible
          > .stationRankingLeadershipMarkerActionLabel {
          opacity: 1;
          visibility: visible;
        }

        .stationRankingLeadershipHeadToHeadLeaderMarker:hover
          > .stationRankingLeadershipMarkerActionLabel.leaderAction,
        .stationRankingLeadershipHeadToHeadLeaderMarker:focus-visible
          > .stationRankingLeadershipMarkerActionLabel.leaderAction {
          transform: translateY(-50%) translateX(0);
        }

        .stationRankingLeadershipHeadToHeadRivalMarker:hover
          > .stationRankingLeadershipMarkerActionLabel.rivalAction,
        .stationRankingLeadershipHeadToHeadRivalMarker:focus-visible
          > .stationRankingLeadershipMarkerActionLabel.rivalAction {
          transform: translateY(-50%) translateX(0);
        }

        .stationRankingLeadershipHeadToHeadScaleLabels {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 6px;
        }

        .stationRankingLeadershipHeadToHeadScaleLabels > small {
          min-width: 0;
          color: rgba(255,255,255,.20);
          font-size: .082rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadScaleLabels > small:first-child {
          color: color-mix(
            in srgb,
            var(--accent) 58%,
            white
          );
          text-align: left;
        }

        .stationRankingLeadershipHeadToHeadScaleLabels > small:last-child {
          color: rgba(143,183,255,.54);
          text-align: right;
        }

        .stationRankingLeadershipHeadToHeadMidpointLabel {
          justify-self: center;
          margin-top: -1px;
          color: rgba(255,255,255,.24) !important;
          font-size: .085rem !important;
          font-weight: 950;
          letter-spacing: .055em !important;
          line-height: 1;
          text-align: center !important;
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadReferenceScale {
          position: relative;
          width: 100%;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          align-items: center;
          margin-top: -1px;
          padding: 0 1px;
        }

        .stationRankingLeadershipHeadToHeadReferenceScale::before {
          content: "";
          position: absolute;
          top: -3px;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(255,255,255,.025),
            rgba(255,255,255,.06) 50%,
            rgba(255,255,255,.025)
          );
          pointer-events: none;
        }

        .stationRankingLeadershipHeadToHeadReferenceScale > small {
          position: relative;
          color: rgba(255,255,255,.14);
          font-size: .072rem;
          font-weight: 900;
          letter-spacing: .02em;
          line-height: 1;
          text-align: center;
          white-space: nowrap;
        }

        .stationRankingLeadershipHeadToHeadReferenceScale > small:first-child {
          text-align: left;
        }

        .stationRankingLeadershipHeadToHeadReferenceScale > small:last-child {
          text-align: right;
        }

        .stationRankingLeadershipHeadToHeadReferenceScale > small::before {
          content: "";
          position: absolute;
          top: -5px;
          left: 50%;
          width: 1px;
          height: 3px;
          background: rgba(255,255,255,.12);
          transform: translateX(-50%);
        }

        .stationRankingLeadershipHeadToHeadReferenceScale > small:first-child::before {
          left: 0;
          transform: none;
        }

        .stationRankingLeadershipHeadToHeadReferenceScale > small:last-child::before {
          left: auto;
          right: 0;
          transform: none;
        }

        .stationRankingLeadershipHeadToHeadReferenceScale > small.mid {
          color: rgba(255,255,255,.34);
          font-weight: 950;
        }

        .stationRankingLeadershipHeadToHeadReferenceScale > small.mid::before {
          height: 5px;
          background: rgba(255,255,255,.44);
        }

        .stationRankingLeadershipEquilibriumDistance {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 3px 5px;
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 7px;
          background: rgba(255,255,255,.008);
        }

        .stationRankingLeadershipEquilibriumDistance > small {
          color: rgba(255,255,255,.18);
          font-size: .09rem;
          font-weight: 950;
          letter-spacing: .045em;
          white-space: nowrap;
        }

        .stationRankingLeadershipEquilibriumDistance > b {
          min-width: 0;
          overflow: hidden;
          font-size: .10rem;
          font-weight: 950;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipEquilibriumDistance.above {
          border-color: color-mix(
            in srgb,
            var(--accent) 16%,
            rgba(255,255,255,.04)
          );
          background: color-mix(
            in srgb,
            var(--accent) 3%,
            transparent
          );
        }

        .stationRankingLeadershipEquilibriumDistance.above > b {
          color: color-mix(
            in srgb,
            var(--accent) 78%,
            white
          );
        }

        .stationRankingLeadershipEquilibriumDistance.below {
          border-color: rgba(255,155,155,.10);
          background: rgba(255,155,155,.01);
        }

        .stationRankingLeadershipEquilibriumDistance.below > b {
          color: #ff9b9b;
        }

        .stationRankingLeadershipEquilibriumDistance.tied {
          border-color: rgba(143,183,255,.08);
          background: rgba(143,183,255,.008);
        }

        .stationRankingLeadershipEquilibriumDistance.tied > b {
          color: #8fb7ff;
        }

        .stationRankingLeadershipHeadToHeadBar > i {
          height: 100%;
          transition: width .48s cubic-bezier(.22,.78,.24,1);
        }

        .stationRankingLeadershipHeadToHeadBar > i.leader {
          background: color-mix(
            in srgb,
            var(--accent) 78%,
            white
          );
        }

        .stationRankingLeadershipHeadToHeadBar > i.rival {
          background: #8fb7ff;
        }

        .stationRankingLeadershipRaceCollapsedRival {
          grid-column: 1 / -1;
          min-width: 0;
          display: grid;
          grid-template-columns:
            auto auto auto auto auto auto auto minmax(0, 1fr);
          align-items: center;
          gap: 5px;
          margin-top: 1px;
          padding-top: 4px;
          border-top: 1px solid rgba(255,255,255,.035);
        }

        .stationRankingLeadershipRaceCollapsedRival > small {
          color: rgba(255,203,92,.52);
          font-size: .10rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .stationRankingLeadershipRaceCollapsedRival > b {
          max-width: 140px;
          overflow: hidden;
          color: rgba(255,255,255,.52);
          font-size: .12rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipRaceCollapsedRival > i {
          color: rgba(143,183,255,.58);
          font-size: .11rem;
          font-style: normal;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationRankingLeadershipCollapsedUpdated {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 4px;
          border: 1px solid rgba(143,183,255,.07);
          border-radius: 6px;
          color: rgba(143,183,255,.46);
          background: rgba(143,183,255,.008);
          font-size: .09rem;
          font-weight: 950;
          letter-spacing: .025em;
          white-space: nowrap;
        }

        .stationRankingLeadershipCollapsedUpdated > i {
          color: #8fb7ff;
          font-size: .12rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipRaceCollapsedRival > em {
          padding: 2px 4px;
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 6px;
          font-size: .10rem;
          font-style: normal;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationRankingLeadershipRaceCollapsedRival
          > em.audienceUp {
          border-color: rgba(123,245,190,.10);
          color: #7bf5be;
          background: rgba(123,245,190,.012);
        }

        .stationRankingLeadershipRaceCollapsedRival
          > em.audienceDown {
          border-color: rgba(255,155,155,.10);
          color: #ff9b9b;
          background: rgba(255,155,155,.012);
        }

        .stationRankingLeadershipRaceCollapsedRival
          > em.audienceSteady {
          border-color: rgba(214,224,235,.07);
          color: rgba(214,224,235,.46);
          background: rgba(214,224,235,.01);
        }

        .stationRankingLeadershipCollapsedMovement {
          grid-column: 1 / -1;
          min-width: 0;
          display: grid;
          grid-template-columns: auto auto minmax(0, 1fr);
          align-items: center;
          gap: 5px;
          padding: 3px 5px;
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 7px;
          background: rgba(255,255,255,.008);
        }

        .stationRankingLeadershipCollapsedMovement > i {
          width: 16px;
          height: 16px;
          display: grid;
          place-items: center;
          border-radius: 6px;
          font-size: .13rem;
          font-style: normal;
          font-weight: 950;
          line-height: 1;
        }

        .stationRankingLeadershipCollapsedMovement > small {
          color: rgba(255,255,255,.18);
          font-size: .10rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .stationRankingLeadershipCollapsedMovement > b {
          min-width: 0;
          overflow: hidden;
          font-size: .10rem;
          font-weight: 950;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipCollapsedMovement.up {
          border-color: rgba(123,245,190,.09);
          background: rgba(123,245,190,.009);
        }

        .stationRankingLeadershipCollapsedMovement.up > i,
        .stationRankingLeadershipCollapsedMovement.up > b {
          color: #7bf5be;
        }

        .stationRankingLeadershipCollapsedMovement.down {
          border-color: rgba(255,155,155,.10);
          background: rgba(255,155,155,.01);
        }

        .stationRankingLeadershipCollapsedMovement.down > i,
        .stationRankingLeadershipCollapsedMovement.down > b {
          color: #ff9b9b;
        }

        .stationRankingLeadershipCollapsedMovement.steady {
          border-color: rgba(143,183,255,.08);
          background: rgba(143,183,255,.008);
        }

        .stationRankingLeadershipCollapsedMovement.steady > i,
        .stationRankingLeadershipCollapsedMovement.steady > b {
          color: #8fb7ff;
        }

        .stationRankingLeadershipCollapsedMovement.selectedMovement {
          border-color: color-mix(
            in srgb,
            var(--accent) 16%,
            rgba(255,255,255,.04)
          );
          background: color-mix(
            in srgb,
            var(--accent) 3%,
            transparent
          );
        }

        .stationRankingLeadershipCollapsedMovement.selectedMovement
          > small {
          color: color-mix(
            in srgb,
            var(--accent) 58%,
            white
          );
        }

        .stationRankingLeadershipCollapsedMovement.selectedMovement.steady
          > i,
        .stationRankingLeadershipCollapsedMovement.selectedMovement.steady
          > b {
          color: color-mix(
            in srgb,
            var(--accent) 78%,
            white
          );
        }

        .stationRankingLeadershipRivalReach {
          grid-column: 1 / -1;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding: 3px 5px;
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 7px;
          background: rgba(255,255,255,.008);
        }

        .stationRankingLeadershipRivalReach > small {
          color: rgba(255,255,255,.18);
          font-size: .10rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .stationRankingLeadershipRivalReach > b {
          min-width: 0;
          overflow: hidden;
          font-size: .11rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipRivalReach.critical {
          border-color: rgba(255,155,155,.11);
          background: rgba(255,155,155,.012);
        }

        .stationRankingLeadershipRivalReach.critical > b {
          color: #ff9b9b;
        }

        .stationRankingLeadershipRivalReach.close {
          border-color: rgba(255,203,92,.10);
          background: rgba(255,203,92,.012);
        }

        .stationRankingLeadershipRivalReach.close > b {
          color: #ffcb5c;
        }

        .stationRankingLeadershipRivalReach.normal {
          border-color: rgba(123,245,190,.08);
          background: rgba(123,245,190,.01);
        }

        .stationRankingLeadershipRivalReach.normal > b {
          color: #7bf5be;
        }

        .stationRankingLeadershipRivalGoal {
          grid-column: 1 / -1;
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 7px;
          padding: 4px 5px;
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 7px;
          background: rgba(255,255,255,.008);
        }

        .stationRankingLeadershipRivalGoal > small {
          color: rgba(255,255,255,.18);
          font-size: .10rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .stationRankingLeadershipRivalGoal > span {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 7px;
        }

        .stationRankingLeadershipRivalGoal > span > b,
        .stationRankingLeadershipRivalGoal > span > i {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipRivalGoal > span > b {
          font-size: .11rem;
          font-weight: 950;
        }

        .stationRankingLeadershipRivalGoal > span > i {
          color: rgba(255,255,255,.26);
          font-size: .10rem;
          font-style: normal;
          font-weight: 900;
        }

        .stationRankingLeadershipRivalGoal.controlled {
          border-color: rgba(123,245,190,.07);
          background: rgba(123,245,190,.008);
        }

        .stationRankingLeadershipRivalGoal.controlled
          > span > b {
          color: #7bf5be;
        }

        .stationRankingLeadershipRivalGoal.danger {
          border-color: rgba(255,155,155,.12);
          background: rgba(255,155,155,.012);
        }

        .stationRankingLeadershipRivalGoal.danger
          > span > b {
          color: #ff9b9b;
        }

        .stationRankingLeadershipRivalGoal.tied {
          border-color: rgba(255,203,92,.13);
          background: rgba(255,203,92,.014);
        }

        .stationRankingLeadershipRivalGoal.tied
          > span > b {
          color: #ffcb5c;
        }

        .stationRankingLeadershipRivalPressure {
          grid-column: 1 / -1;
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 7px;
          padding: 4px 5px;
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 7px;
          background: rgba(255,255,255,.008);
        }

        .stationRankingLeadershipRivalPressure > small {
          color: rgba(255,255,255,.18);
          font-size: .10rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .stationRankingLeadershipRivalPressure > span {
          min-width: 0;
          display: grid;
          grid-template-columns: auto auto minmax(0, 1fr);
          align-items: center;
          justify-content: end;
          gap: 5px;
        }

        .stationRankingLeadershipRivalPressure
          > span > i {
          width: 16px;
          height: 16px;
          display: grid;
          place-items: center;
          border-radius: 6px;
          font-size: .11rem;
          font-style: normal;
          font-weight: 950;
          line-height: 1;
        }

        .stationRankingLeadershipRivalPressure
          > span > b {
          font-size: .11rem;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationRankingLeadershipRivalPressure
          > span > em {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.24);
          font-size: .10rem;
          font-style: normal;
          font-weight: 900;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipPressureMeter {
          grid-column: 1 / -1;
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
          margin-top: 1px;
        }

        .stationRankingLeadershipPressureMeter > span {
          position: relative;
          min-width: 0;
          height: 5px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.035);
        }

        .stationRankingLeadershipPressureMeter > span > i {
          position: absolute;
          inset: 0 auto 0 0;
          max-width: 100%;
          border-radius: inherit;
          background: currentColor;
          transition: width .35s ease;
        }

        .stationRankingPressureThreshold {
          position: absolute;
          top: -2px;
          bottom: -2px;
          width: 1px;
          transform: translateX(-50%);
          background: rgba(255,255,255,.30);
          pointer-events: none;
        }

        .stationRankingPressureThreshold.attack {
          background: rgba(255,203,92,.58);
        }

        .stationRankingPressureThreshold.critical {
          background: rgba(255,155,155,.72);
        }

        .stationRankingLeadershipPressureMeter > b {
          min-width: 31px;
          color: rgba(255,255,255,.34);
          font-size: .10rem;
          font-weight: 950;
          text-align: right;
          white-space: nowrap;
        }

        .stationRankingPressureLegend {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          color: rgba(255,255,255,.16);
          font-size: .08rem;
          font-weight: 950;
          letter-spacing: .03em;
          white-space: nowrap;
        }

        .stationRankingPressureLegend > span:first-child {
          color: rgba(255,203,92,.44);
        }

        .stationRankingPressureLegend > span:last-child {
          color: rgba(255,155,155,.48);
        }

        .stationRankingLeadershipNextThreshold {
          grid-column: 1 / -1;
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 7px;
          margin-top: 1px;
          padding: 3px 5px;
          border: 1px solid rgba(255,255,255,.04);
          border-radius: 7px;
          background: rgba(255,255,255,.008);
        }

        .stationRankingLeadershipNextThreshold > small {
          color: rgba(255,255,255,.18);
          font-size: .10rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .stationRankingLeadershipNextThreshold > span {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
        }

        .stationRankingLeadershipNextThreshold > span > i {
          font-size: .14rem;
          font-style: normal;
          font-weight: 950;
          line-height: 1;
        }

        .stationRankingLeadershipNextThreshold > span > b {
          min-width: 0;
          overflow: hidden;
          font-size: .10rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipNextThreshold.normal {
          border-color: rgba(123,245,190,.07);
          background: rgba(123,245,190,.008);
        }

        .stationRankingLeadershipNextThreshold.normal
          > span > i,
        .stationRankingLeadershipNextThreshold.normal
          > span > b {
          color: #7bf5be;
        }

        .stationRankingLeadershipNextThreshold.warning {
          border-color: rgba(255,203,92,.10);
          background: rgba(255,203,92,.01);
        }

        .stationRankingLeadershipNextThreshold.warning
          > span > i,
        .stationRankingLeadershipNextThreshold.warning
          > span > b {
          color: #ffcb5c;
        }

        .stationRankingLeadershipNextThreshold.critical {
          border-color: rgba(255,155,155,.12);
          background: rgba(255,155,155,.012);
        }

        .stationRankingLeadershipNextThreshold.critical
          > span > i,
        .stationRankingLeadershipNextThreshold.critical
          > span > b {
          color: #ff9b9b;
        }

        .stationRankingLeadershipRivalPressure.controlled
          .stationRankingLeadershipPressureMeter {
          color: #7bf5be;
        }

        .stationRankingLeadershipRivalPressure.medium
          .stationRankingLeadershipPressureMeter {
          color: #8fb7ff;
        }

        .stationRankingLeadershipRivalPressure.high
          .stationRankingLeadershipPressureMeter {
          color: #ffcb5c;
        }

        .stationRankingLeadershipRivalPressure.critical
          .stationRankingLeadershipPressureMeter {
          color: #ff9b9b;
        }

        .stationRankingLeadershipRivalPressure.controlled {
          border-color: rgba(123,245,190,.08);
          background: rgba(123,245,190,.009);
        }

        .stationRankingLeadershipRivalPressure.controlled
          > span > i,
        .stationRankingLeadershipRivalPressure.controlled
          > span > b {
          color: #7bf5be;
        }

        .stationRankingLeadershipRivalPressure.medium {
          border-color: rgba(143,183,255,.09);
          background: rgba(143,183,255,.01);
        }

        .stationRankingLeadershipRivalPressure.medium
          > span > i,
        .stationRankingLeadershipRivalPressure.medium
          > span > b {
          color: #8fb7ff;
        }

        .stationRankingLeadershipRivalPressure.high {
          border-color: rgba(255,203,92,.11);
          background: rgba(255,203,92,.012);
        }

        .stationRankingLeadershipRivalPressure.high
          > span > i,
        .stationRankingLeadershipRivalPressure.high
          > span > b {
          color: #ffcb5c;
        }

        .stationRankingLeadershipRivalPressure.critical {
          border-color: rgba(255,155,155,.13);
          background: rgba(255,155,155,.014);
        }

        .stationRankingLeadershipRivalPressure.critical
          > span > i,
        .stationRankingLeadershipRivalPressure.critical
          > span > b {
          color: #ff9b9b;
        }

        .stationRankingLeadershipRaceCollapsedRival > strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.30);
          font-size: .11rem;
          font-weight: 850;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipRaceToggle:hover {
          border-color: rgba(255,203,92,.20);
          background:
            linear-gradient(
              100deg,
              rgba(255,203,92,.035),
              rgba(143,183,255,.02)
            );
          transform: translateY(-1px);
        }

        .stationRankingLeadershipRaceToggle.collapsed {
          border-color: color-mix(
            in srgb,
            var(--accent) 18%,
            rgba(255,255,255,.04)
          );
          background: color-mix(
            in srgb,
            var(--accent) 3%,
            transparent
          );
          padding-bottom: 6px;
        }

        .stationRankingLeadershipRaceToggle.collapsed > strong {
          color: color-mix(
            in srgb,
            var(--accent) 74%,
            white
          );
        }

        .stationRankingLeadershipQuickActionsToggle {
          grid-column: 1 / -1;
          width: 100%;
          min-height: 28px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
          padding: 4px 7px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 8px;
          color: rgba(255,255,255,.40);
          background: rgba(255,255,255,.01);
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationRankingLeadershipQuickActionsToggle > span {
          width: 18px;
          height: 18px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(143,183,255,.10);
          border-radius: 6px;
          color: #8fb7ff;
          background: rgba(143,183,255,.015);
          font-size: .26rem;
          font-weight: 950;
          line-height: 1;
        }

        .stationRankingLeadershipQuickActionsToggle > strong {
          color: rgba(255,255,255,.45);
          font-size: .13rem;
          font-weight: 950;
          letter-spacing: .04em;
        }

        .stationRankingLeadershipQuickActionsToggle > em {
          color: rgba(143,183,255,.50);
          font-size: .10rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .035em;
          white-space: nowrap;
        }

        .stationRankingLeadershipQuickActionsToggle:hover {
          border-color: rgba(143,183,255,.14);
          background: rgba(143,183,255,.018);
          transform: translateY(-1px);
        }

        .stationRankingLeadershipQuickActionsToggle.collapsed {
          border-color: color-mix(
            in srgb,
            var(--accent) 16%,
            rgba(255,255,255,.04)
          );
          background: color-mix(
            in srgb,
            var(--accent) 3%,
            transparent
          );
        }

        .stationRankingLeadershipQuickActionsToggle.collapsed > strong {
          color: color-mix(
            in srgb,
            var(--accent) 70%,
            white
          );
        }

        .stationRankingLeadershipCollapsedActions {
          grid-column: 1 / -1;
          width: 100%;
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(128px, 1fr));
          gap: 4px;
        }

        .stationRankingLeadershipCollapsedHomeListen,
        .stationRankingLeadershipCollapsedHomeFavorite,
        .stationRankingLeadershipCollapsedHomeView,
        .stationRankingLeadershipCollapsedView,
        .stationRankingLeadershipCollapsedListen,
        .stationRankingLeadershipCollapsedFavorite,
        .stationRankingLeadershipCollapsedShare,
        .stationRankingLeadershipCollapsedEnter {
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 4px 8px;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-size: .13rem;
          font-weight: 950;
          letter-spacing: .03em;
          white-space: nowrap;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationRankingLeadershipCollapsedHomeListen {
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 28%,
            rgba(255,255,255,.05)
          );
          color: color-mix(
            in srgb,
            var(--accent) 80%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 7%,
            transparent
          );
        }

        .stationRankingLeadershipCollapsedHomeListen > span {
          color: color-mix(
            in srgb,
            var(--accent) 88%,
            white
          );
          font-size: .25rem;
          line-height: 1;
        }

        .stationRankingLeadershipCollapsedHomeListen:hover,
        .stationRankingLeadershipCollapsedHomeListen.active {
          color: #07101a;
          border-color: var(--accent);
          background: var(--accent);
          transform: translateY(-1px);
        }

        .stationRankingLeadershipCollapsedHomeListen:hover > span,
        .stationRankingLeadershipCollapsedHomeListen.active > span {
          color: #07101a;
        }

        .stationRankingLeadershipCollapsedHomeFavorite {
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 26%,
            rgba(255,255,255,.05)
          );
          color: color-mix(
            in srgb,
            var(--accent) 76%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 5%,
            transparent
          );
        }

        .stationRankingLeadershipCollapsedHomeFavorite > span {
          color: color-mix(
            in srgb,
            var(--accent) 84%,
            white
          );
          font-size: .25rem;
          line-height: 1;
        }

        .stationRankingLeadershipCollapsedHomeFavorite:hover,
        .stationRankingLeadershipCollapsedHomeFavorite.active {
          color: #07101a;
          border-color: var(--accent);
          background: var(--accent);
          transform: translateY(-1px);
        }

        .stationRankingLeadershipCollapsedHomeFavorite:hover > span,
        .stationRankingLeadershipCollapsedHomeFavorite.active > span {
          color: #07101a;
        }

        .stationRankingLeadershipCollapsedHomeView {
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 24%,
            rgba(255,255,255,.05)
          );
          color: color-mix(
            in srgb,
            var(--accent) 76%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 5%,
            transparent
          );
        }

        .stationRankingLeadershipCollapsedHomeView > span {
          color: color-mix(
            in srgb,
            var(--accent) 84%,
            white
          );
          font-size: .26rem;
          line-height: 1;
        }

        .stationRankingLeadershipCollapsedHomeView:hover {
          color: #07101a;
          border-color: var(--accent);
          background: var(--accent);
          transform: translateY(-1px);
        }

        .stationRankingLeadershipCollapsedHomeView:hover > span {
          color: #07101a;
        }

        .stationRankingLeadershipCollapsedView {
          border: 1px solid rgba(143,183,255,.11);
          color: rgba(143,183,255,.72);
          background: rgba(143,183,255,.018);
        }

        .stationRankingLeadershipCollapsedView > span {
          color: #8fb7ff;
          font-size: .26rem;
          line-height: 1;
        }

        .stationRankingLeadershipCollapsedView:hover {
          color: #07101a;
          border-color: #8fb7ff;
          background: #8fb7ff;
          transform: translateY(-1px);
        }

        .stationRankingLeadershipCollapsedView:hover > span {
          color: #07101a;
        }

        .stationRankingLeadershipCollapsedListen {
          border: 1px solid rgba(123,245,190,.12);
          color: rgba(123,245,190,.76);
          background: rgba(123,245,190,.018);
        }

        .stationRankingLeadershipCollapsedListen > span {
          color: #7bf5be;
          font-size: .25rem;
          line-height: 1;
        }

        .stationRankingLeadershipCollapsedListen:hover,
        .stationRankingLeadershipCollapsedListen.active {
          color: #07101a;
          border-color: #7bf5be;
          background: #7bf5be;
          transform: translateY(-1px);
        }

        .stationRankingLeadershipCollapsedListen:hover > span,
        .stationRankingLeadershipCollapsedListen.active > span {
          color: #07101a;
        }

        .stationRankingLeadershipCollapsedFavorite {
          border: 1px solid rgba(255,112,162,.12);
          color: rgba(255,112,162,.76);
          background: rgba(255,112,162,.018);
        }

        .stationRankingLeadershipCollapsedFavorite > span {
          color: #ff70a2;
          font-size: .25rem;
          line-height: 1;
        }

        .stationRankingLeadershipCollapsedFavorite:hover,
        .stationRankingLeadershipCollapsedFavorite.active {
          color: #07101a;
          border-color: #ff70a2;
          background: #ff70a2;
          transform: translateY(-1px);
        }

        .stationRankingLeadershipCollapsedFavorite:hover > span,
        .stationRankingLeadershipCollapsedFavorite.active > span {
          color: #07101a;
        }

        .stationRankingLeadershipCollapsedShare {
          border: 1px solid rgba(255,203,92,.12);
          color: rgba(255,203,92,.76);
          background: rgba(255,203,92,.018);
        }

        .stationRankingLeadershipCollapsedShare > span {
          color: #ffcb5c;
          font-size: .24rem;
          line-height: 1;
        }

        .stationRankingLeadershipCollapsedShare:hover {
          color: #07101a;
          border-color: #ffcb5c;
          background: #ffcb5c;
          transform: translateY(-1px);
        }

        .stationRankingLeadershipCollapsedShare:hover > span {
          color: #07101a;
        }

        .stationRankingLeadershipCollapsedEnterGroup {
          grid-column: 1 / -1;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
        }

        .stationRankingLeadershipCollapsedEnter {
          min-height: 31px;
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 22%,
            rgba(255,255,255,.05)
          );
          color: color-mix(
            in srgb,
            var(--accent) 76%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 5%,
            transparent
          );
          text-decoration: none;
        }

        .stationRankingLeadershipCollapsedEnter > span {
          color: color-mix(
            in srgb,
            var(--accent) 84%,
            white
          );
          font-size: .27rem;
          line-height: 1;
        }

        .stationRankingLeadershipCollapsedEnter.home {
          border-color: color-mix(
            in srgb,
            var(--accent) 28%,
            rgba(255,255,255,.05)
          );
          background: color-mix(
            in srgb,
            var(--accent) 7%,
            transparent
          );
        }

        .stationRankingLeadershipCollapsedEnter.rival {
          border-color: rgba(143,183,255,.12);
          color: rgba(143,183,255,.78);
          background: rgba(143,183,255,.018);
        }

        .stationRankingLeadershipCollapsedEnter.rival > span {
          color: #8fb7ff;
        }

        .stationRankingLeadershipCollapsedEnter:hover {
          color: #07101a;
          border-color: var(--accent);
          background: var(--accent);
          transform: translateY(-1px);
        }

        .stationRankingLeadershipCollapsedEnter:hover > span {
          color: #07101a;
        }

        .stationRankingLeadershipCollapsedEnter.rival:hover {
          color: #07101a;
          border-color: #8fb7ff;
          background: #8fb7ff;
        }

        .stationRankingLeadershipCollapsedEnter.rival:hover > span {
          color: #07101a;
        }

        .stationRankingLeadershipCurrent {
          border: 1px solid rgba(255,203,92,.14);
          color: rgba(255,255,255,.56);
          background:
            linear-gradient(
              110deg,
              rgba(255,203,92,.03),
              rgba(143,183,255,.018)
            );
        }

        .stationRankingLeadershipPrevious {
          border: 1px solid rgba(214,224,235,.08);
          color: rgba(255,255,255,.46);
          background: rgba(214,224,235,.012);
        }

        .stationRankingLeadershipCurrent > span:first-child,
        .stationRankingLeadershipPrevious > span:first-child {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          font-size: .40rem;
          line-height: 1;
        }

        .stationRankingLeadershipCurrent > span:first-child {
          border: 1px solid rgba(255,203,92,.16);
          color: #ffcb5c;
          background: rgba(255,203,92,.035);
        }

        .stationRankingLeadershipPrevious > span:first-child {
          border: 1px solid rgba(214,224,235,.10);
          color: rgba(214,224,235,.56);
          background: rgba(214,224,235,.018);
        }

        .stationRankingLeadershipCurrent > span:nth-child(2),
        .stationRankingLeadershipPrevious > span:nth-child(2) {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationRankingLeadershipCurrent small,
        .stationRankingLeadershipPrevious small {
          color: rgba(255,255,255,.24);
          font-size: .17rem;
          font-weight: 950;
          letter-spacing: .05em;
          white-space: nowrap;
        }

        .stationRankingLeadershipCurrent strong,
        .stationRankingLeadershipPrevious strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.58);
          font-size: .22rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipCurrent em,
        .stationRankingLeadershipPrevious em {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.27);
          font-size: .15rem;
          font-style: normal;
          font-weight: 800;
          line-height: 1.12;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipCurrent em > i,
        .stationRankingLeadershipPrevious em > i {
          color: rgba(255,203,92,.62);
          font-size: .13rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .04em;
        }

        .stationRankingLeadershipDefenseGroup {
          min-width: 0;
          display: grid;
          gap: 3px;
          margin-top: 2px;
        }

        .stationRankingLeadershipDefenseGroup.collapsed
          .stationRankingLeadershipDefenseTrend,
        .stationRankingLeadershipDefenseGroup.collapsed
          .stationRankingLeadershipRace {
          display: none;
        }

        .stationRankingLeadershipDefense {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 2px;
          padding: 3px 5px;
          border-radius: 999px;
          font-size: .15rem;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationRankingLeadershipDefense > i {
          font-size: .22rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipDefense.leading {
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 28%,
            rgba(255,255,255,.05)
          );
          color: color-mix(
            in srgb,
            var(--accent) 76%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 6%,
            transparent
          );
        }

        .stationRankingLeadershipDefense.tied {
          border: 1px solid rgba(255,203,92,.14);
          color: #ffcb5c;
          background: rgba(255,203,92,.025);
        }

        .stationRankingLeadershipStatus {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 5px;
          padding: 3px 6px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 8px;
          background: rgba(255,255,255,.01);
        }

        .stationRankingLeadershipStatus > small {
          color: rgba(255,255,255,.20);
          font-size: .10rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .stationRankingLeadershipStatus > strong {
          min-width: 0;
          overflow: hidden;
          font-size: .13rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipStatus > i {
          width: 17px;
          height: 17px;
          display: grid;
          place-items: center;
          border-radius: 6px;
          font-size: .18rem;
          font-style: normal;
          font-weight: 950;
          line-height: 1;
        }

        .stationRankingLeadershipStatus.stronger {
          border-color: rgba(123,245,190,.11);
          background: rgba(123,245,190,.014);
        }

        .stationRankingLeadershipStatus.stronger > strong,
        .stationRankingLeadershipStatus.stronger > i {
          color: #7bf5be;
        }

        .stationRankingLeadershipStatus.warning {
          border-color: rgba(255,155,155,.12);
          background: rgba(255,155,155,.014);
        }

        .stationRankingLeadershipStatus.warning > strong,
        .stationRankingLeadershipStatus.warning > i {
          color: #ff9b9b;
        }

        .stationRankingLeadershipStatus.steady {
          border-color: rgba(143,183,255,.09);
          background: rgba(143,183,255,.012);
        }

        .stationRankingLeadershipStatus.steady > strong,
        .stationRankingLeadershipStatus.steady > i {
          color: #8fb7ff;
        }

        .stationRankingLeadershipStatus.tied {
          border-color: rgba(255,203,92,.13);
          background: rgba(255,203,92,.018);
        }

        .stationRankingLeadershipStatus.tied > strong,
        .stationRankingLeadershipStatus.tied > i {
          color: #ffcb5c;
        }

        .stationRankingLeadershipStatus.active > strong,
        .stationRankingLeadershipStatus.active > i {
          color: color-mix(
            in srgb,
            var(--accent) 76%,
            white
          );
        }

        .stationRankingLeadershipDefenseTrend {
          min-width: 0;
          display: grid;
          grid-template-columns: auto auto minmax(0, 1fr);
          align-items: center;
          gap: 4px;
          padding: 3px 5px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 8px;
          background: rgba(255,255,255,.01);
        }

        .stationRankingLeadershipDefenseTrend > i {
          width: 15px;
          height: 15px;
          display: grid;
          place-items: center;
          border-radius: 5px;
          font-size: .22rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipDefenseTrend > small {
          color: rgba(255,255,255,.21);
          font-size: .12rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .stationRankingLeadershipDefenseTrend > strong {
          min-width: 0;
          overflow: hidden;
          font-size: .14rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipDefenseTrend.growing {
          border-color: rgba(123,245,190,.10);
          background: rgba(123,245,190,.015);
        }

        .stationRankingLeadershipDefenseTrend.growing > i,
        .stationRankingLeadershipDefenseTrend.growing > strong {
          color: #7bf5be;
        }

        .stationRankingLeadershipDefenseTrend.shrinking {
          border-color: rgba(255,125,125,.10);
          background: rgba(255,125,125,.014);
        }

        .stationRankingLeadershipDefenseTrend.shrinking > i,
        .stationRankingLeadershipDefenseTrend.shrinking > strong {
          color: #ff9b9b;
        }

        .stationRankingLeadershipDefenseTrend.steady {
          border-color: rgba(214,224,235,.08);
          background: rgba(214,224,235,.012);
        }

        .stationRankingLeadershipDefenseTrend.steady > i,
        .stationRankingLeadershipDefenseTrend.steady > strong {
          color: rgba(214,224,235,.50);
        }

        .stationRankingLeadershipRace {
          min-width: 0;
          display: grid;
          grid-template-columns:
            auto minmax(0, .9fr) minmax(0, 1fr) minmax(0, 1fr)
            minmax(0, 1.15fr) minmax(0, 1.15fr) auto;
          align-items: center;
          gap: 4px;
          padding: 3px 5px;
          border: 1px solid rgba(143,183,255,.07);
          border-radius: 8px;
          background: rgba(143,183,255,.012);
        }

        .stationRankingLeadershipRace > small {
          color: rgba(255,255,255,.21);
          font-size: .12rem;
          font-weight: 950;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .stationRankingLeadershipRace > span {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 3px;
          padding: 2px 4px;
          border-radius: 6px;
          background: rgba(255,255,255,.008);
        }

        .stationRankingLeadershipRaceGap {
          border: 1px solid rgba(255,255,255,.04);
        }

        .stationRankingLeadershipRaceGap > em {
          grid-column: 1 / -1;
          min-width: 0;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 5px;
          margin-top: 1px;
          padding-top: 2px;
          border-top: 1px solid rgba(255,255,255,.035);
          font-style: normal;
        }

        .stationRankingLeadershipRaceGap > em > small {
          color: rgba(255,255,255,.20);
          font-size: .10rem;
          font-weight: 950;
          letter-spacing: .035em;
          white-space: nowrap;
        }

        .stationRankingLeadershipRaceGap > em > b {
          font-size: .13rem;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationRankingLeadershipRaceGap
          > em.relativeLeading > b {
          color: color-mix(
            in srgb,
            var(--accent) 78%,
            white
          );
        }

        .stationRankingLeadershipRaceGap
          > em.relativeTied > b {
          color: rgba(214,224,235,.48);
        }

        .stationRankingLeadershipRaceGap.leading {
          border-color: color-mix(
            in srgb,
            var(--accent) 20%,
            rgba(255,255,255,.04)
          );
          background: color-mix(
            in srgb,
            var(--accent) 4%,
            transparent
          );
        }

        .stationRankingLeadershipRaceGap.tied {
          border-color: rgba(255,203,92,.10);
          background: rgba(255,203,92,.014);
        }

        .stationRankingLeadershipRaceGap > i {
          font-size: .16rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipRaceGap.leading > i,
        .stationRankingLeadershipRaceGap.leading > strong {
          color: color-mix(
            in srgb,
            var(--accent) 76%,
            white
          );
        }

        .stationRankingLeadershipRaceGap.tied > i,
        .stationRankingLeadershipRaceGap.tied > strong {
          color: #ffcb5c;
        }

        .stationRankingLeadershipRace > span > i {
          font-size: .13rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipRace > span > b {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.38);
          font-size: .12rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipRace > span > strong {
          font-size: .14rem;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationRankingLeadershipRace > span.positive > i,
        .stationRankingLeadershipRace > span.positive > strong {
          color: #7bf5be;
        }

        .stationRankingLeadershipRace > span.negative > i,
        .stationRankingLeadershipRace > span.negative > strong {
          color: #ff9b9b;
        }

        .stationRankingLeadershipRace > span.neutral > i,
        .stationRankingLeadershipRace > span.neutral > strong {
          color: rgba(214,224,235,.50);
        }

        .stationRankingLeadershipRaceNow {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 4px;
          padding: 3px 5px;
          border: 1px solid rgba(255,203,92,.075);
          border-radius: 7px;
          background: rgba(255,203,92,.012);
        }

        .stationRankingLeadershipRaceNow > i {
          width: 18px;
          height: 18px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,203,92,.11);
          border-radius: 6px;
          color: #ffcb5c;
          background: rgba(255,203,92,.02);
          font-size: .28rem;
          font-style: normal;
          line-height: 1;
        }

        .stationRankingLeadershipRaceNow.selectedNow {
          border-color: color-mix(
            in srgb,
            var(--accent) 18%,
            rgba(255,255,255,.04)
          );
          background: color-mix(
            in srgb,
            var(--accent) 4%,
            transparent
          );
        }

        .stationRankingLeadershipRaceNow.selectedNow > i {
          border-color: color-mix(
            in srgb,
            var(--accent) 30%,
            rgba(255,255,255,.05)
          );
          color: color-mix(
            in srgb,
            var(--accent) 82%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 7%,
            transparent
          );
        }

        .stationRankingLeadershipRaceNow.selectedNow small {
          color: color-mix(
            in srgb,
            var(--accent) 72%,
            white
          );
        }

        .stationRankingLeadershipRaceNow.rivalNow {
          border-color: rgba(255,203,92,.075);
          background: rgba(255,203,92,.012);
        }

        .stationRankingLeadershipRaceNow > span {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationRankingLeadershipRaceNow small,
        .stationRankingLeadershipRaceNow strong,
        .stationRankingLeadershipRaceNow em {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingLeadershipRaceNow small {
          color: rgba(255,203,92,.46);
          font-size: .10rem;
          font-weight: 950;
          letter-spacing: .04em;
        }

        .stationRankingLeadershipRaceNow strong {
          color: rgba(255,255,255,.50);
          font-size: .13rem;
          font-weight: 950;
        }

        .stationRankingLeadershipRaceNow em {
          color: rgba(255,255,255,.24);
          font-size: .11rem;
          font-style: normal;
          font-weight: 800;
        }

        .stationRankingLeadershipRaceActions {
          display: inline-grid;
          grid-template-columns: repeat(4, auto);
          gap: 3px;
        }

        .stationRankingLeadershipRaceHome,
        .stationRankingLeadershipRaceHomeListen,
        .stationRankingLeadershipRaceTarget,
        .stationRankingLeadershipRaceListen {
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 0 6px;
          border: 1px solid rgba(143,183,255,.11);
          border-radius: 7px;
          color: rgba(143,183,255,.72);
          background: rgba(143,183,255,.02);
          cursor: pointer;
          font-family: inherit;
          font-size: .14rem;
          font-weight: 950;
          letter-spacing: .03em;
          white-space: nowrap;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationRankingLeadershipRaceHome {
          border-color: color-mix(
            in srgb,
            var(--accent) 22%,
            rgba(255,255,255,.05)
          );
          color: color-mix(
            in srgb,
            var(--accent) 72%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 5%,
            transparent
          );
        }

        .stationRankingLeadershipRaceHome > span {
          color: color-mix(
            in srgb,
            var(--accent) 80%,
            white
          );
          font-size: .26rem;
          line-height: 1;
        }

        .stationRankingLeadershipRaceHome:hover {
          color: #07101a;
          border-color: var(--accent);
          background: var(--accent);
          transform: translateY(-1px);
        }

        .stationRankingLeadershipRaceHome:hover > span {
          color: #07101a;
        }

        .stationRankingLeadershipRaceHomeListen {
          border-color: color-mix(
            in srgb,
            var(--accent) 28%,
            rgba(255,255,255,.05)
          );
          color: color-mix(
            in srgb,
            var(--accent) 78%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 7%,
            transparent
          );
        }

        .stationRankingLeadershipRaceHomeListen > span {
          color: color-mix(
            in srgb,
            var(--accent) 86%,
            white
          );
          font-size: .26rem;
          line-height: 1;
        }

        .stationRankingLeadershipRaceHomeListen:hover,
        .stationRankingLeadershipRaceHomeListen.active {
          color: #07101a;
          border-color: var(--accent);
          background: var(--accent);
          transform: translateY(-1px);
        }

        .stationRankingLeadershipRaceHomeListen:hover > span,
        .stationRankingLeadershipRaceHomeListen.active > span {
          color: #07101a;
        }

        .stationRankingLeadershipRaceTarget {
          min-height: 24px;
        }

        .stationRankingLeadershipRaceTarget > span {
          color: #8fb7ff;
          font-size: .28rem;
          line-height: 1;
        }

        .stationRankingLeadershipRaceTarget:hover {
          color: #07101a;
          border-color: #8fb7ff;
          background: #8fb7ff;
          transform: translateY(-1px);
        }

        .stationRankingLeadershipRaceTarget:hover > span {
          color: #07101a;
        }

        .stationRankingLeadershipRaceListen {
          border-color: rgba(123,245,190,.12);
          color: rgba(123,245,190,.74);
          background: rgba(123,245,190,.018);
        }

        .stationRankingLeadershipRaceListen > span {
          color: #7bf5be;
          font-size: .26rem;
          line-height: 1;
        }

        .stationRankingLeadershipRaceListen:hover,
        .stationRankingLeadershipRaceListen.active {
          color: #07101a;
          border-color: #7bf5be;
          background: #7bf5be;
          transform: translateY(-1px);
        }

        .stationRankingLeadershipRaceListen:hover > span,
        .stationRankingLeadershipRaceListen.active > span {
          color: #07101a;
        }

        .stationRankingLeadershipPrevious em > i {
          color: rgba(214,224,235,.48);
        }

        .stationRankingLeadershipCurrent > b,
        .stationRankingLeadershipPrevious > b {
          font-size: .30rem;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationRankingLeadershipCurrent > b {
          color: #ffcb5c;
        }

        .stationRankingLeadershipPrevious > b {
          color: rgba(214,224,235,.54);
        }

        .stationRankingLeadershipCurrent.selectedLeadership,
        .stationRankingLeadershipPrevious.selectedLeadership {
          border-color: color-mix(
            in srgb,
            var(--accent) 54%,
            rgba(255,255,255,.10)
          );
          background:
            linear-gradient(
              110deg,
              color-mix(
                in srgb,
                var(--accent) 11%,
                rgba(7,12,28,.94)
              ),
              rgba(7,12,28,.90)
            );
          box-shadow:
            inset 0 0 0 1px color-mix(
              in srgb,
              var(--accent) 10%,
              transparent
            ),
            0 8px 22px color-mix(
              in srgb,
              var(--accent) 11%,
              transparent
            );
        }

        .stationRankingLeadershipCurrent.selectedLeadership
          > span:first-child,
        .stationRankingLeadershipPrevious.selectedLeadership
          > span:first-child {
          border-color: color-mix(
            in srgb,
            var(--accent) 54%,
            rgba(255,255,255,.10)
          );
          color: color-mix(
            in srgb,
            var(--accent) 84%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 10%,
            transparent
          );
        }

        .stationRankingLeadershipCurrent.selectedLeadership small,
        .stationRankingLeadershipPrevious.selectedLeadership small {
          color: color-mix(
            in srgb,
            var(--accent) 80%,
            white
          );
          opacity: .98;
        }

        .stationRankingLeadershipCurrent.selectedLeadership strong,
        .stationRankingLeadershipPrevious.selectedLeadership strong {
          color: #fff;
        }

        .stationRankingLeadershipCurrent.selectedLeadership > b,
        .stationRankingLeadershipPrevious.selectedLeadership > b {
          color: color-mix(
            in srgb,
            var(--accent) 82%,
            white
          );
        }

        .stationRankingLeadershipCurrent.selectedLeadership em > i,
        .stationRankingLeadershipPrevious.selectedLeadership em > i {
          color: color-mix(
            in srgb,
            var(--accent) 78%,
            white
          );
        }

        .stationRankingLeadershipCurrent:hover {
          border-color: #ffcb5c;
          background: rgba(255,203,92,.09);
          transform: translateY(-1px);
        }

        .stationRankingLeadershipPrevious:hover {
          border-color: rgba(214,224,235,.34);
          background: rgba(214,224,235,.045);
          transform: translateY(-1px);
        }

        .stationRankingLeadershipCurrent.selectedLeadership:hover,
        .stationRankingLeadershipPrevious.selectedLeadership:hover {
          border-color: var(--accent);
          background: color-mix(
            in srgb,
            var(--accent) 14%,
            rgba(7,12,28,.92)
          );
        }

        .stationRankingTrend.collapsed
          .stationRankingLeadershipChange {
          display: none;
        }

        .stationRankingPodiumChangeActions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 5px;
        }

        .stationRankingPodiumEnter,
        .stationRankingPodiumExit {
          min-width: 0;
          min-height: 42px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
          padding: 5px 7px;
          border-radius: 9px;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationRankingPodiumEnter {
          border: 1px solid rgba(123,245,190,.12);
          color: rgba(255,255,255,.54);
          background: rgba(123,245,190,.02);
        }

        .stationRankingPodiumExit {
          border: 1px solid rgba(255,125,125,.11);
          color: rgba(255,255,255,.54);
          background: rgba(255,125,125,.018);
        }

        .stationRankingPodiumEnter > span:first-child,
        .stationRankingPodiumExit > span:first-child {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          font-size: .42rem;
          line-height: 1;
        }

        .stationRankingPodiumEnter > span:first-child {
          border: 1px solid rgba(123,245,190,.14);
          color: #7bf5be;
        }

        .stationRankingPodiumExit > span:first-child {
          border: 1px solid rgba(255,125,125,.13);
          color: #ff9b9b;
        }

        .stationRankingPodiumEnter > span:nth-child(2),
        .stationRankingPodiumExit > span:nth-child(2) {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationRankingPodiumEnter small,
        .stationRankingPodiumExit small {
          color: rgba(255,255,255,.24);
          font-size: .17rem;
          font-weight: 950;
          letter-spacing: .045em;
          white-space: nowrap;
        }

        .stationRankingPodiumEnter strong,
        .stationRankingPodiumExit strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.56);
          font-size: .22rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingPodiumEnter em,
        .stationRankingPodiumExit em {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.28);
          font-size: .16rem;
          font-style: normal;
          font-weight: 800;
          line-height: 1.1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingPodiumEnter > b,
        .stationRankingPodiumExit > b {
          font-size: .27rem;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationRankingPodiumEnter > b {
          color: #7bf5be;
        }

        .stationRankingPodiumExit > b {
          color: #ff9b9b;
        }

        .stationRankingPodiumEnter.selectedPodiumChange,
        .stationRankingPodiumExit.selectedPodiumChange {
          position: relative;
          border-color: color-mix(
            in srgb,
            var(--accent) 52%,
            rgba(255,255,255,.10)
          );
          background:
            linear-gradient(
              110deg,
              color-mix(
                in srgb,
                var(--accent) 10%,
                rgba(7,12,28,.94)
              ),
              rgba(7,12,28,.90)
            );
          box-shadow:
            inset 0 0 0 1px color-mix(
              in srgb,
              var(--accent) 10%,
              transparent
            ),
            0 8px 20px color-mix(
              in srgb,
              var(--accent) 10%,
              transparent
            );
        }

        .stationRankingPodiumEnter.selectedPodiumChange
          > span:first-child,
        .stationRankingPodiumExit.selectedPodiumChange
          > span:first-child {
          border-color: color-mix(
            in srgb,
            var(--accent) 52%,
            rgba(255,255,255,.10)
          );
          color: color-mix(
            in srgb,
            var(--accent) 82%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 9%,
            transparent
          );
        }

        .stationRankingPodiumEnter.selectedPodiumChange small,
        .stationRankingPodiumExit.selectedPodiumChange small {
          color: color-mix(
            in srgb,
            var(--accent) 78%,
            white
          );
          opacity: .95;
        }

        .stationRankingPodiumEnter.selectedPodiumChange strong,
        .stationRankingPodiumExit.selectedPodiumChange strong {
          color: #fff;
        }

        .stationRankingPodiumEnter.selectedPodiumChange > b,
        .stationRankingPodiumExit.selectedPodiumChange > b {
          color: color-mix(
            in srgb,
            var(--accent) 78%,
            white
          );
        }

        .stationRankingPodiumEnter:hover {
          border-color: #7bf5be;
          background: rgba(123,245,190,.08);
          transform: translateY(-1px);
        }

        .stationRankingPodiumExit:hover {
          border-color: #ff9b9b;
          background: rgba(255,125,125,.07);
          transform: translateY(-1px);
        }

        .stationRankingPodiumStable {
          min-height: 29px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 8px;
          border-radius: 8px;
          color: rgba(123,245,190,.58);
          background: rgba(123,245,190,.014);
          font-size: .18rem;
          font-weight: 950;
          letter-spacing: .035em;
          text-align: center;
        }

        .stationRankingTrend.collapsed
          .stationRankingPodiumChangeActions,
        .stationRankingTrend.collapsed
          .stationRankingPodiumStable {
          display: none;
        }

        .stationRankingTrend.collapsed
          .stationRankingPodiumChange {
          padding-top: 5px;
          padding-bottom: 5px;
        }

        .stationRankingAudienceImpulse {
          min-width: 0;
          display: grid;
          gap: 5px;
          padding: 6px 7px;
          border: 1px solid rgba(143,183,255,.07);
          border-radius: 9px;
          background:
            linear-gradient(
              110deg,
              rgba(143,183,255,.018),
              rgba(123,245,190,.012)
            );
        }

        .stationRankingAudienceImpulseHeading {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
        }

        .stationRankingAudienceImpulseHeading > span:first-child {
          width: 21px;
          height: 21px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(143,183,255,.11);
          border-radius: 7px;
          color: #8fb7ff;
          background: rgba(143,183,255,.02);
          font-size: .39rem;
          line-height: 1;
        }

        .stationRankingAudienceImpulseHeading > span:nth-child(2) {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationRankingAudienceImpulseHeading small {
          color: rgba(255,255,255,.22);
          font-size: .17rem;
          font-weight: 950;
          letter-spacing: .05em;
          white-space: nowrap;
        }

        .stationRankingAudienceImpulseHeading strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.46);
          font-size: .21rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingAudienceImpulseHeading > b {
          color: rgba(143,183,255,.60);
          font-size: .18rem;
          font-weight: 950;
          letter-spacing: .03em;
          white-space: nowrap;
        }

        .stationRankingAudienceNet {
          min-width: 0;
          min-height: 38px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 7px;
          padding: 5px 7px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 9px;
          background: rgba(255,255,255,.01);
        }

        .stationRankingAudienceNet > span:first-child {
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          font-size: .44rem;
          line-height: 1;
        }

        .stationRankingAudienceNet > span:nth-child(2) {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationRankingAudienceNet small {
          color: rgba(255,255,255,.22);
          font-size: .17rem;
          font-weight: 950;
          letter-spacing: .05em;
          white-space: nowrap;
        }

        .stationRankingAudienceNet strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.60);
          font-size: .24rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingAudienceNet > b {
          color: rgba(255,255,255,.32);
          font-size: .18rem;
          font-weight: 950;
          letter-spacing: .025em;
          white-space: nowrap;
        }

        .stationRankingAudienceNet.positive {
          border-color: rgba(123,245,190,.12);
          background: rgba(123,245,190,.018);
        }

        .stationRankingAudienceNet.positive
          > span:first-child {
          border: 1px solid rgba(123,245,190,.14);
          color: #7bf5be;
          background: rgba(123,245,190,.03);
        }

        .stationRankingAudienceNet.positive strong {
          color: #7bf5be;
        }

        .stationRankingAudienceNet.negative {
          border-color: rgba(255,125,125,.11);
          background: rgba(255,125,125,.016);
        }

        .stationRankingAudienceNet.negative
          > span:first-child {
          border: 1px solid rgba(255,125,125,.13);
          color: #ff9b9b;
          background: rgba(255,125,125,.025);
        }

        .stationRankingAudienceNet.negative strong {
          color: #ff9b9b;
        }

        .stationRankingAudienceNet.neutral
          > span:first-child {
          border: 1px solid rgba(214,224,235,.10);
          color: rgba(214,224,235,.52);
          background: rgba(214,224,235,.018);
        }

        .stationRankingTrend.collapsed
          .stationRankingAudienceNet {
          min-height: 34px;
          padding-top: 4px;
          padding-bottom: 4px;
        }

        .stationRankingAudienceImpulseActions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 5px;
        }

        .stationRankingAudienceGain,
        .stationRankingAudienceLoss,
        .stationRankingAudienceImpulseEmpty {
          min-width: 0;
          min-height: 36px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
          padding: 5px 7px;
          border-radius: 9px;
        }

        .stationRankingAudienceGain,
        .stationRankingAudienceLoss {
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationRankingAudienceGain {
          border: 1px solid rgba(123,245,190,.12);
          color: rgba(255,255,255,.54);
          background: rgba(123,245,190,.02);
        }

        .stationRankingAudienceLoss {
          border: 1px solid rgba(255,125,125,.11);
          color: rgba(255,255,255,.54);
          background: rgba(255,125,125,.018);
        }

        .stationRankingAudienceGain > span:first-child,
        .stationRankingAudienceLoss > span:first-child {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          font-size: .42rem;
          line-height: 1;
        }

        .stationRankingAudienceGain > span:first-child {
          border: 1px solid rgba(123,245,190,.14);
          color: #7bf5be;
        }

        .stationRankingAudienceLoss > span:first-child {
          border: 1px solid rgba(255,125,125,.13);
          color: #ff9b9b;
        }

        .stationRankingAudienceGain > span:nth-child(2),
        .stationRankingAudienceLoss > span:nth-child(2) {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationRankingAudienceGain small,
        .stationRankingAudienceLoss small {
          color: rgba(255,255,255,.24);
          font-size: .17rem;
          font-weight: 950;
          letter-spacing: .045em;
          white-space: nowrap;
        }

        .stationRankingAudienceGain strong,
        .stationRankingAudienceLoss strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.55);
          font-size: .22rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingAudienceGain > b,
        .stationRankingAudienceLoss > b {
          font-size: .30rem;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationRankingAudienceGain > b {
          color: #7bf5be;
        }

        .stationRankingAudienceLoss > b {
          color: #ff9b9b;
        }

        .stationRankingAudienceGain:hover {
          border-color: #7bf5be;
          background: rgba(123,245,190,.08);
          transform: translateY(-1px);
        }

        .stationRankingAudienceLoss:hover {
          border-color: #ff9b9b;
          background: rgba(255,125,125,.07);
          transform: translateY(-1px);
        }

        .stationRankingAudienceImpulseEmpty {
          grid-template-columns: auto minmax(0, 1fr);
          border: 1px dashed rgba(255,255,255,.06);
          color: rgba(255,255,255,.25);
          background: rgba(255,255,255,.008);
          font-size: .18rem;
          font-weight: 950;
          letter-spacing: .035em;
        }

        .stationRankingTrend.collapsed
          .stationRankingAudienceImpulseActions {
          display: none;
        }

        .stationRankingTrend.collapsed
          .stationRankingAudienceImpulse {
          padding-top: 5px;
          padding-bottom: 5px;
        }

        .stationRankingTrendActions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 5px;
        }

        .stationRankingTrendUp,
        .stationRankingTrendDown {
          min-width: 0;
          min-height: 38px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
          padding: 5px 7px;
          border-radius: 9px;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationRankingTrendUp {
          border: 1px solid rgba(123,245,190,.12);
          color: rgba(255,255,255,.54);
          background: rgba(123,245,190,.02);
        }

        .stationRankingTrendDown {
          border: 1px solid rgba(255,125,125,.11);
          color: rgba(255,255,255,.54);
          background: rgba(255,125,125,.018);
        }

        .stationRankingTrendUp > span:first-child,
        .stationRankingTrendDown > span:first-child {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          font-size: .42rem;
          line-height: 1;
        }

        .stationRankingTrendUp > span:first-child {
          border: 1px solid rgba(123,245,190,.14);
          color: #7bf5be;
        }

        .stationRankingTrendDown > span:first-child {
          border: 1px solid rgba(255,125,125,.13);
          color: #ff9b9b;
        }

        .stationRankingTrendUp > span:nth-child(2),
        .stationRankingTrendDown > span:nth-child(2) {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationRankingTrendUp small,
        .stationRankingTrendDown small {
          color: rgba(255,255,255,.24);
          font-size: .18rem;
          font-weight: 950;
          letter-spacing: .045em;
          white-space: nowrap;
        }

        .stationRankingTrendUp strong,
        .stationRankingTrendDown strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.55);
          font-size: .23rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationRankingTrendUp > b,
        .stationRankingTrendDown > b {
          font-size: .34rem;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationRankingTrendUp > b {
          color: #7bf5be;
        }

        .stationRankingTrendDown > b {
          color: #ff9b9b;
        }

        .stationRankingTrendUp:hover {
          border-color: #7bf5be;
          background: rgba(123,245,190,.09);
          transform: translateY(-1px);
        }

        .stationRankingTrendDown:hover {
          border-color: #ff9b9b;
          background: rgba(255,125,125,.08);
          transform: translateY(-1px);
        }

        .stationRankingTrendStable,
        .stationRankingTrendWaiting {
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 8px;
          border-radius: 9px;
          font-size: .20rem;
          font-weight: 950;
          letter-spacing: .035em;
          text-align: center;
        }

        .stationRankingTrendStable {
          color: rgba(123,245,190,.64);
          background: rgba(123,245,190,.018);
        }

        .stationRankingTrendWaiting {
          color: rgba(214,224,235,.36);
          background: rgba(214,224,235,.012);
        }

        .stationFullRankingBannerActions {
          display: grid;
          justify-items: stretch;
          gap: 5px;
        }

        .stationFullRankingRivalActions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px;
        }

        .stationFullRankingRivalDuel {
          grid-column: 1 / -1;
          min-width: 0;
          display: grid;
          gap: 6px;
          padding: 7px 8px;
          border: 1px solid rgba(143,183,255,.10);
          border-radius: 11px;
          background:
            linear-gradient(
              115deg,
              rgba(143,183,255,.025),
              rgba(123,245,190,.018)
            );
        }

        .stationFullRankingRivalDuelHeading {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
        }

        .stationFullRankingRivalDuelHeading > span:first-child {
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(143,183,255,.14);
          border-radius: 8px;
          color: #8fb7ff;
          background: rgba(143,183,255,.03);
          font-size: .46rem;
        }

        .stationFullRankingRivalDuelHeading
          > span:nth-child(2) {
          min-width: 0;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 7px;
        }

        .stationFullRankingRivalDuelHeading small {
          color: rgba(255,255,255,.28);
          font-size: .22rem;
          font-weight: 950;
          letter-spacing: .055em;
          white-space: nowrap;
        }

        .stationFullRankingRivalDuelHeading strong {
          color: rgba(143,183,255,.72);
          font-size: .28rem;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationFullRankingRivalDuelHeading > b {
          color: #7bf5be;
          font-size: .22rem;
          font-weight: 950;
          letter-spacing: .035em;
          white-space: nowrap;
        }

        .stationFullRankingRivalDuelScore {
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          align-items: stretch;
          gap: 6px;
        }

        .stationFullRankingRivalDuelScore > span {
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 2px 7px;
          padding: 5px 7px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 9px;
          background: rgba(255,255,255,.012);
        }

        .stationFullRankingRivalDuelScore > span:first-child {
          border-color: rgba(143,183,255,.10);
          background: rgba(143,183,255,.018);
        }

        .stationFullRankingRivalDuelScore > span:last-child {
          border-color: rgba(123,245,190,.10);
          background: rgba(123,245,190,.018);
        }

        .stationFullRankingRivalDuelScore small {
          grid-column: 1 / -1;
          color: rgba(255,255,255,.24);
          font-size: .19rem;
          font-weight: 950;
          letter-spacing: .05em;
        }

        .stationFullRankingRivalDuelScore strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.60);
          font-size: .27rem;
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFullRankingRivalDuelScore b {
          color: #fff;
          font-size: .42rem;
          font-weight: 950;
          line-height: 1;
        }

        .stationFullRankingRivalDuelScore > i {
          align-self: center;
          color: rgba(255,203,92,.54);
          font-size: .24rem;
          font-style: normal;
          font-weight: 950;
        }

        .stationFullRankingRivalNow {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 6px;
          padding: 5px 7px;
          border-top: 1px solid rgba(255,255,255,.045);
        }

        .stationFullRankingRivalNow > span:first-child {
          color: #ffcb5c;
          font-size: .48rem;
          line-height: 1;
        }

        .stationFullRankingRivalNow > span:last-child {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 2px 6px;
        }

        .stationFullRankingRivalNow small {
          grid-row: 1 / span 2;
          color: rgba(255,203,92,.42);
          font-size: .19rem;
          font-weight: 950;
          letter-spacing: .05em;
          white-space: nowrap;
        }

        .stationFullRankingRivalNow strong,
        .stationFullRankingRivalNow em {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFullRankingRivalNow strong {
          color: rgba(255,255,255,.54);
          font-size: .25rem;
          font-weight: 950;
        }

        .stationFullRankingRivalNow em {
          color: rgba(255,255,255,.26);
          font-size: .21rem;
          font-style: normal;
          font-weight: 800;
        }

        .stationFullRankingNextTarget {
          min-height: 38px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 7px;
          padding: 0 9px;
          border: 1px solid rgba(123,245,190,.12);
          border-radius: 11px;
          color: rgba(255,255,255,.56);
          background: rgba(123,245,190,.022);
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationFullRankingNextTarget > span:first-child {
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(123,245,190,.13);
          border-radius: 8px;
          color: #7bf5be;
          background: rgba(123,245,190,.03);
          font-size: .48rem;
        }

        .stationFullRankingNextTarget > span:nth-child(2) {
          min-width: 0;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }

        .stationFullRankingNextTarget small {
          color: rgba(255,255,255,.28);
          font-size: .23rem;
          font-weight: 950;
          letter-spacing: .05em;
          white-space: nowrap;
        }

        .stationFullRankingNextTarget strong {
          color: #7bf5be;
          font-size: .52rem;
          font-weight: 950;
          line-height: 1;
          white-space: nowrap;
        }

        .stationFullRankingNextTarget > i {
          color: rgba(123,245,190,.52);
          font-size: .44rem;
          font-style: normal;
        }

        .stationFullRankingNextTarget:hover {
          color: #07101a;
          border-color: #7bf5be;
          background: #7bf5be;
          transform: translateY(-1px);
        }

        .stationFullRankingNextTarget:hover
          > span:first-child,
        .stationFullRankingNextTarget:hover small,
        .stationFullRankingNextTarget:hover strong,
        .stationFullRankingNextTarget:hover > i {
          color: #07101a;
        }

        .stationFullRankingNextListen {
          min-height: 38px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 7px;
          padding: 0 9px;
          border: 1px solid rgba(214,224,235,.12);
          border-radius: 11px;
          color: rgba(255,255,255,.56);
          background: rgba(214,224,235,.02);
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationFullRankingNextListen > span:first-child {
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(214,224,235,.13);
          border-radius: 8px;
          color: #d6e0eb;
          background: rgba(214,224,235,.03);
          font-size: .46rem;
          line-height: 1;
        }

        .stationFullRankingNextListen > span:last-child {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationFullRankingNextListen small {
          color: rgba(255,255,255,.28);
          font-size: .22rem;
          font-weight: 950;
          letter-spacing: .05em;
          white-space: nowrap;
        }

        .stationFullRankingNextListen strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(214,224,235,.72);
          font-size: .30rem;
          font-weight: 950;
          letter-spacing: .035em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFullRankingNextListen:hover,
        .stationFullRankingNextListen.active {
          color: #07101a;
          border-color: #d6e0eb;
          background: #d6e0eb;
          transform: translateY(-1px);
        }

        .stationFullRankingNextListen:hover
          > span:first-child,
        .stationFullRankingNextListen:hover small,
        .stationFullRankingNextListen:hover strong,
        .stationFullRankingNextListen.active
          > span:first-child,
        .stationFullRankingNextListen.active small,
        .stationFullRankingNextListen.active strong {
          color: #07101a;
        }

        .stationFullRankingCurrent {
          min-height: 64px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 7px;
          padding: 0 9px;
          border: 1px solid rgba(143,183,255,.14);
          border-radius: 11px;
          color: rgba(255,255,255,.64);
          background: rgba(143,183,255,.028);
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationFullRankingCurrent > span:first-child {
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(143,183,255,.14);
          border-radius: 8px;
          color: #8fb7ff;
          background: rgba(143,183,255,.035);
          font-size: .48rem;
        }

        .stationFullRankingCurrentCopy {
          min-width: 0;
          display: grid;
          gap: 4px;
        }

        .stationFullRankingCurrentHeading {
          min-width: 0;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }

        .stationFullRankingCurrentHeading > small {
          color: rgba(255,255,255,.32);
          font-size: .25rem;
          font-weight: 950;
          letter-spacing: .06em;
          white-space: nowrap;
        }

        .stationFullRankingCurrentHeading > strong {
          color: #8fb7ff;
          font-size: .72rem;
          font-weight: 950;
          line-height: 1;
        }

        .stationFullRankingCurrentMeta {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .stationFullRankingCurrentMeta > b,
        .stationFullRankingCurrentMeta > em {
          min-width: 0;
          overflow: hidden;
          font-size: .22rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFullRankingCurrentMeta > b {
          color: rgba(143,183,255,.66);
        }

        .stationFullRankingCurrentMeta > em {
          color: rgba(255,255,255,.28);
          font-style: normal;
          text-align: right;
        }

        .stationFullRankingCurrentBattle {
          min-width: 0;
          display: grid;
          gap: 4px;
        }

        .stationFullRankingCurrentBattleLabel {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .stationFullRankingCurrentBattleLabel > small,
        .stationFullRankingCurrentBattleLabel > b {
          min-width: 0;
          overflow: hidden;
          font-size: .20rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFullRankingCurrentBattleLabel > small {
          color: rgba(255,255,255,.24);
        }

        .stationFullRankingCurrentBattleLabel > b {
          color: rgba(143,183,255,.72);
          text-align: right;
        }

        .stationFullRankingCurrentBattleTrack {
          width: 100%;
          height: 5px;
          display: block;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.055);
        }

        .stationFullRankingCurrentBattleTrack > i {
          height: 100%;
          display: block;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #8fb7ff,
              #7bf5be
            );
          box-shadow: 0 0 10px rgba(143,183,255,.18);
          transition: width .28s ease;
        }

        .stationFullRankingCurrentGoal {
          width: fit-content;
          max-width: 100%;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 1px;
          padding: 4px 6px;
          overflow: hidden;
          border: 1px solid rgba(143,183,255,.12);
          border-radius: 999px;
          color: rgba(143,183,255,.72);
          background: rgba(143,183,255,.025);
          font-size: .21rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFullRankingCurrentGoal > span {
          color: #8fb7ff;
          font-size: .38rem;
          line-height: 1;
        }

        .stationFullRankingCurrentGoal.tied {
          border-color: rgba(123,245,190,.15);
          color: #7bf5be;
          background: rgba(123,245,190,.03);
        }

        .stationFullRankingCurrentGoal.tied > span {
          color: #7bf5be;
        }

        .stationFullRankingCurrentGoal.leading {
          border-color: rgba(255,203,92,.16);
          color: #ffcb5c;
          background: rgba(255,203,92,.03);
        }

        .stationFullRankingCurrentGoal.leading > span {
          color: #ffcb5c;
        }

        .stationFullRankingNextGoal {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
          margin-top: 1px;
          padding: 5px 6px;
          border: 1px solid rgba(123,245,190,.11);
          border-radius: 9px;
          background: rgba(123,245,190,.022);
        }

        .stationFullRankingNextGoal > span:first-child {
          color: #7bf5be;
          font-size: .46rem;
          line-height: 1;
        }

        .stationFullRankingNextGoal > span:nth-child(2) {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationFullRankingNextGoal small,
        .stationFullRankingNextGoal b {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFullRankingNextGoal small {
          color: rgba(255,255,255,.22);
          font-size: .19rem;
          font-weight: 950;
          letter-spacing: .05em;
        }

        .stationFullRankingNextGoal b {
          color: rgba(123,245,190,.66);
          font-size: .22rem;
          font-weight: 950;
        }

        .stationFullRankingNextGoal > em {
          color: rgba(255,255,255,.42);
          font-size: .21rem;
          font-style: normal;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationFullRankingCurrent > i {
          color: rgba(143,183,255,.58);
          font-size: .48rem;
          font-style: normal;
          line-height: 1;
        }

        .stationFullRankingCurrent:hover {
          color: #07101a;
          border-color: #8fb7ff;
          background: #8fb7ff;
          transform: translateY(-1px);
        }

        .stationFullRankingCurrent:hover
          > span:first-child,
        .stationFullRankingCurrent:hover
          .stationFullRankingCurrentHeading > small,
        .stationFullRankingCurrent:hover
          .stationFullRankingCurrentHeading > strong,
        .stationFullRankingCurrent:hover
          .stationFullRankingCurrentMeta > b,
        .stationFullRankingCurrent:hover
          .stationFullRankingCurrentMeta > em,
        .stationFullRankingCurrent:hover
          .stationFullRankingCurrentBattleLabel > small,
        .stationFullRankingCurrent:hover
          .stationFullRankingCurrentBattleLabel > b,
        .stationFullRankingCurrent:hover > i {
          color: #07101a;
        }

        .stationFullRankingCurrent:hover
          .stationFullRankingCurrentBattleTrack {
          background: rgba(7,16,26,.12);
        }

        .stationFullRankingCurrent:hover
          .stationFullRankingCurrentBattleTrack > i {
          background: #07101a;
          box-shadow: none;
        }

        .stationFullRankingCurrent:hover
          .stationFullRankingCurrentGoal,
        .stationFullRankingCurrent:hover
          .stationFullRankingCurrentGoal > span {
          color: #07101a;
        }

        .stationFullRankingCurrent:hover
          .stationFullRankingCurrentGoal {
          border-color: rgba(7,16,26,.16);
          background: rgba(7,16,26,.08);
        }

        .stationFullRankingCurrentOutside {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 9px;
          border: 1px dashed rgba(255,255,255,.07);
          border-radius: 10px;
          color: rgba(255,255,255,.25);
          background: rgba(255,255,255,.012);
          font-size: .25rem;
          font-weight: 900;
          letter-spacing: .045em;
          text-align: center;
        }

        .stationFullRankingCurrentOutside > span {
          color: rgba(143,183,255,.46);
          font-size: .46rem;
        }

        .stationFullRankingShare {
          min-height: 40px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 8px;
          padding: 0 9px;
          border: 1px solid rgba(255,203,92,.12);
          border-radius: 11px;
          color: rgba(255,255,255,.58);
          background: rgba(255,203,92,.022);
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationFullRankingShare > span:first-child {
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,203,92,.14);
          border-radius: 8px;
          color: #ffcb5c;
          background: rgba(255,203,92,.035);
          font-size: .48rem;
          line-height: 1;
        }

        .stationFullRankingShare > span:last-child {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .stationFullRankingShare small {
          color: rgba(255,255,255,.26);
          font-size: .21rem;
          font-weight: 950;
          letter-spacing: .05em;
        }

        .stationFullRankingShare strong {
          min-width: 0;
          overflow: hidden;
          color: #ffcb5c;
          font-size: .29rem;
          font-weight: 950;
          letter-spacing: .035em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFullRankingShare:hover,
        .stationFullRankingShare.active {
          color: #07101a;
          border-color: #ffcb5c;
          background: #ffcb5c;
          transform: translateY(-1px);
        }

        .stationFullRankingShare:hover
          > span:first-child,
        .stationFullRankingShare:hover small,
        .stationFullRankingShare:hover strong,
        .stationFullRankingShare.active
          > span:first-child,
        .stationFullRankingShare.active small,
        .stationFullRankingShare.active strong {
          color: #07101a;
        }

        .stationFullRankingBannerBack {
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 10px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 999px;
          color: rgba(255,255,255,.58);
          background: rgba(255,255,255,.025);
          cursor: pointer;
          font-family: inherit;
          font-size: .34rem;
          font-weight: 950;
          letter-spacing: .055em;
          white-space: nowrap;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationFullRankingBannerBack > span {
          color: #7bf5be;
          font-size: .64rem;
          line-height: 1;
        }

        .stationFullRankingBannerBack:hover {
          color: #07101a;
          border-color: #7bf5be;
          background: #7bf5be;
          transform: translateY(-1px);
        }

        .stationFullRankingBannerBack:hover > span {
          color: #07101a;
        }

        .stationGridCompact {
          grid-template-columns: 1fr;
          gap: 9px;
        }

        .stationGridCompact .stationCard {
          min-height: 126px;
          display: grid;
          grid-template-columns: 96px minmax(0, 1fr) minmax(170px, 230px);
          grid-template-areas:
            "artwork identity actions"
            "artwork now actions";
          align-items: center;
          column-gap: 16px;
          row-gap: 8px;
          padding: 13px 14px;
          text-align: left;
        }

        .stationGridCompact .stationBadge {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 7;
          padding: 4px 7px;
          font-size: .4rem;
        }

        .stationGridCompact .stationAudienceRank {
          top: 10px;
          right: 10px;
          min-width: 100px;
        }

        .stationGridCompact .stationSelectedState {
          position: absolute;
          left: 116px;
          top: 10px;
          z-index: 6;
          margin: 0;
          padding: 4px 7px;
          font-size: .4rem;
        }

        .stationGridCompact .stationArtwork {
          grid-area: artwork;
          width: 88px !important;
          height: 88px !important;
          margin: 0 !important;
          align-self: center;
          justify-self: center;
        }

        .stationGridCompact .stationArtworkMain {
          width: 88px !important;
          height: 88px !important;
          border-radius: 14px !important;
        }

        .stationGridCompact .stationLogoBadge {
          width: 30px !important;
          height: 30px !important;
          right: -4px !important;
          bottom: -4px !important;
        }

        .stationGridCompact .stationArtworkMomentum {
          top: 5px;
          right: 5px;
          min-width: 20px;
          width: 20px;
          height: 20px;
          padding: 0;
          font-size: .44rem;
        }

        .stationGridCompact .stationArtworkMomentumRate {
          display: none;
        }

        .stationGridCompact .stationArtworkPlay {
          min-width: 72px;
          min-height: 32px;
          padding: 0 9px;
        }

        .stationGridCompact .stationArtworkPlay strong {
          font-size: .42rem;
        }

        .stationGridCompact > .stationCard > span:not(.stationPlayingIndicator) {
          display: none;
        }

        .stationGridCompact .stationNameRow {
          grid-area: identity;
          justify-content: flex-start;
          align-self: end;
          min-width: 0;
          padding-top: 14px;
        }

        .stationGridCompact .stationNameRow h3 {
          margin: 0;
          font-size: .9rem;
          text-align: left;
        }

        .stationGridCompact .stationQuickActions {
          margin-left: 4px;
        }

        .stationGridCompact .stationFavorite,
        .stationGridCompact .stationShare {
          width: 28px;
          height: 28px;
        }

        .stationCard mark {
          padding: 0 .12em;
          border-radius: .22em;
          color: #07101a;
          background: var(--accent);
          box-shadow: 0 0 0 1px color-mix(
            in srgb,
            var(--accent) 38%,
            transparent
          );
        }

        .stationCard .stationSlogan mark,
        .stationCard .stationNow mark {
          font: inherit;
          letter-spacing: inherit;
        }

        .stationGenreQuickFilter mark {
          color: #07101a;
          background: var(--accent);
        }

        .stationGridCompact .stationSlogan {
          display: none;
        }

        .stationGridCompact .stationNow {
          grid-area: now;
          min-height: 62px;
          margin: 0;
          padding: 9px 11px 9px 14px;
        }

        .stationGridCompact .stationNowArtistSearch,
        .stationGridCompact .stationNowSongSearch {
          min-height: 22px;
          padding: 0 7px;
          font-size: .33rem;
        }

        .stationGridCompact .stationNowHeader {
          margin-bottom: 4px;
        }

        .stationGridCompact .stationNow > b {
          font-size: .69rem;
        }

        .stationGridCompact .stationNow > small {
          font-size: .54rem;
        }

        .stationGridCompact .stationFooter {
          grid-area: actions;
          align-self: start;
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin: 12px 0 0;
        }

        .stationFooterAudience {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 5px;
        }

        .stationFooterAudience > span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFooterAudienceCount {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .stationFooterAudienceCount > span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationFooterAudienceDelta {
          flex: 0 0 auto;
          min-height: 17px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 2px 4px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 999px;
          font-size: .34rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .015em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationFooterAudienceDelta.up {
          border-color: rgba(123,245,190,.14);
          color: #7bf5be;
          background: rgba(123,245,190,.035);
        }

        .stationFooterAudienceDelta.down {
          border-color: rgba(255,124,137,.14);
          color: #ff8e99;
          background: rgba(255,124,137,.035);
        }

        .stationFooterAudienceDelta.steady {
          color: rgba(255,255,255,.44);
          background: rgba(255,255,255,.018);
        }

        .stationFooterAudienceDelta.softMove {
          opacity: .76;
        }

        .stationFooterAudienceDelta.mediumMove {
          opacity: .92;
        }

        .stationFooterAudienceDelta.up.mediumMove {
          border-color: rgba(123,245,190,.24);
          background: rgba(123,245,190,.055);
        }

        .stationFooterAudienceDelta.down.mediumMove {
          border-color: rgba(255,124,137,.24);
          background: rgba(255,124,137,.055);
        }

        .stationFooterAudienceDelta.strongMove {
          opacity: 1;
          font-weight: 1000;
        }

        .stationFooterAudienceDelta.up.strongMove {
          border-color: rgba(123,245,190,.42);
          background: rgba(123,245,190,.095);
          box-shadow: 0 0 9px rgba(123,245,190,.12);
        }

        .stationFooterAudienceDelta.down.strongMove {
          border-color: rgba(255,124,137,.42);
          background: rgba(255,124,137,.095);
          box-shadow: 0 0 9px rgba(255,124,137,.12);
        }

        .stationFooterAudienceDelta.strongMove {
          animation: stationAudienceDeltaGlow 1.6s ease-in-out infinite;
        }

        @keyframes stationAudienceDeltaGlow {
          0%,
          100% {
            filter: brightness(.94);
          }

          50% {
            filter: brightness(1.10);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .stationFooterAudienceDelta.strongMove {
            animation: none;
          }
        }

        .stationFooterAudienceDeltaRate {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          color: currentColor;
          font-size: .29rem;
          font-style: normal;
          font-weight: 900;
          letter-spacing: .01em;
          line-height: 1;
          opacity: .76;
          white-space: nowrap;
        }

        .stationFooterAudienceDeltaRate > span {
          opacity: .42;
        }

        .stationFooterAudienceStrength {
          flex: 0 0 auto;
          height: 9px;
          display: inline-flex;
          align-items: flex-end;
          gap: 1px;
          margin-left: 1px;
        }

        .stationFooterAudienceStrength > i {
          width: 2px;
          display: block;
          border-radius: 999px 999px 1px 1px;
          background: currentColor;
          opacity: .18;
          transition:
            height .18s ease,
            opacity .18s ease,
            transform .18s ease;
        }

        .stationFooterAudienceStrength > i:nth-child(1) {
          height: 3px;
        }

        .stationFooterAudienceStrength > i:nth-child(2) {
          height: 6px;
        }

        .stationFooterAudienceStrength > i:nth-child(3) {
          height: 9px;
        }

        .stationFooterAudienceStrength.softMove > i:nth-child(1),
        .stationFooterAudienceStrength.mediumMove > i:nth-child(-n+2),
        .stationFooterAudienceStrength.strongMove > i {
          opacity: .92;
        }

        .stationFooterAudienceStrength.mediumMove > i:nth-child(2),
        .stationFooterAudienceStrength.strongMove > i:nth-child(3) {
          transform: translateY(-1px);
        }

        .stationFooterAudienceStrength.strongMove {
          animation: stationAudienceStrengthPulse 1.6s ease-in-out infinite;
        }

        @keyframes stationAudienceStrengthPulse {
          0%,
          100% {
            opacity: .82;
            transform: scaleY(.94);
          }

          50% {
            opacity: 1;
            transform: scaleY(1.08);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .stationFooterAudienceStrength.strongMove,
          .stationFooterLeaderCrown.newLeader,
          .stationFooterPursuerGap.pressureAlert,
          .stationFooterThirdGap.pressureAlert,
          .stationFooterRankMovement.leaderTakeover {
            animation: none;
          }

          .stationCard.mediumAudienceUp::before,
          .stationCard.mediumAudienceDown::before,
          .stationCard.strongAudienceUp::before,
          .stationCard.strongAudienceDown::before {
            transition: none;
          }
        }

        .stationFooterAudienceShare {
          appearance: none;
          flex: 0 0 auto;
          min-width: 100px;
          max-width: 164px;
          display: inline-grid;
          gap: 2px;
          padding: 3px 5px;
          border: 1px solid rgba(215,166,255,.12);
          border-radius: 7px;
          color: rgba(215,166,255,.78);
          background: rgba(215,166,255,.018);
          font: inherit;
          text-align: left;
          overflow: hidden;
          cursor: pointer;
          transition:
            border-color .18s ease,
            background .18s ease,
            transform .18s ease;
        }

        .stationFooterAudienceShare:hover,
        .stationFooterAudienceShare:focus-visible {
          border-color: rgba(215,166,255,.30);
          background: rgba(215,166,255,.060);
          transform: translateY(-1px);
          outline: none;
        }

        .stationFooterAudienceShare.rankingActive.podiumGold:hover,
        .stationFooterAudienceShare.rankingActive.podiumGold:focus-visible {
          border-color: rgba(255,216,107,.48);
          background:
            linear-gradient(
              135deg,
              rgba(255,216,107,.14),
              rgba(255,216,107,.035)
            );
        }

        .stationFooterAudienceShare.rankingActive.podiumSilver:hover,
        .stationFooterAudienceShare.rankingActive.podiumSilver:focus-visible {
          border-color: rgba(223,232,245,.42);
          background:
            linear-gradient(
              135deg,
              rgba(223,232,245,.115),
              rgba(223,232,245,.028)
            );
        }

        .stationFooterAudienceShare.rankingActive.podiumBronze:hover,
        .stationFooterAudienceShare.rankingActive.podiumBronze:focus-visible {
          border-color: rgba(233,168,115,.44);
          background:
            linear-gradient(
              135deg,
              rgba(233,168,115,.125),
              rgba(233,168,115,.030)
            );
        }

        .stationFooterAudienceShare:active {
          transform: translateY(0);
        }

        .stationFooterAudienceShare.rankingActive {
          max-width: 184px;
          border-color: rgba(143,183,255,.24);
          background:
            linear-gradient(
              135deg,
              rgba(143,183,255,.055),
              rgba(215,166,255,.025)
            );
        }

        .stationFooterAudienceShare.rankingActive.podiumGold {
          border-color: rgba(255,216,107,.34);
          background:
            linear-gradient(
              135deg,
              rgba(255,216,107,.095),
              rgba(255,216,107,.025)
            );
          box-shadow:
            inset 0 0 0 1px rgba(255,216,107,.035),
            0 0 12px rgba(255,216,107,.055);
        }

        .stationFooterAudienceShare.rankingActive.podiumSilver {
          border-color: rgba(223,232,245,.28);
          background:
            linear-gradient(
              135deg,
              rgba(223,232,245,.075),
              rgba(223,232,245,.018)
            );
          box-shadow:
            inset 0 0 0 1px rgba(223,232,245,.028),
            0 0 10px rgba(223,232,245,.045);
        }

        .stationFooterAudienceShare.rankingActive.podiumBronze {
          border-color: rgba(233,168,115,.30);
          background:
            linear-gradient(
              135deg,
              rgba(233,168,115,.085),
              rgba(233,168,115,.020)
            );
          box-shadow:
            inset 0 0 0 1px rgba(233,168,115,.030),
            0 0 10px rgba(233,168,115,.045);
        }

        .stationFooterAudienceShare.rankingActive > em {
          color: rgba(143,183,255,.82);
        }

        .stationFooterAudienceShare.rankingActive
          .stationFooterRankPosition.rankGold {
          color: #ffd86b;
        }

        .stationFooterAudienceShare.rankingActive
          .stationFooterRankPosition.rankSilver {
          color: #dfe8f5;
        }

        .stationFooterAudienceShare.rankingActive
          .stationFooterRankPosition.rankBronze {
          color: #e9a873;
        }

        .stationFooterAudienceShare.rankingActive
          .stationFooterRankPosition.rankStandard {
          color: #8fb7ff;
        }

        .stationFooterAudienceShare > em,
        .stationFooterAudienceMain {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          color: currentColor;
          font-size: .32rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationFooterRankPosition {
          min-width: 0;
          max-width: 100%;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          overflow: hidden;
          font: inherit;
          font-weight: 1000;
          white-space: nowrap;
        }

        .stationFooterRankPosition.rankGold {
          color: #ffd86b;
          text-shadow: 0 0 7px rgba(255,216,107,.20);
        }

        .stationFooterLeaderCrown {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          margin-right: 3px;
          color: #ffd86b;
          font-size: .43rem;
          line-height: 1;
          text-shadow:
            0 0 7px rgba(255,216,107,.26),
            0 0 12px rgba(255,216,107,.10);
          transform-origin: center bottom;
        }

        .stationFooterLeaderGap {
          min-height: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1px 3px;
          border: 1px solid rgba(255,216,107,.16);
          border-radius: 999px;
          font-size: .20rem;
          font-weight: 1000;
          letter-spacing: .01em;
          line-height: 1;
          text-shadow: none;
          white-space: nowrap;
        }

        .stationFooterLeaderGap.ahead {
          color: #ffd86b;
          background: rgba(255,216,107,.045);
        }

        .stationFooterLeaderGap.tied {
          color: #ffcb5c;
          border-color: rgba(255,203,92,.20);
          background: rgba(255,203,92,.055);
        }

        .stationFooterLeaderGapRate {
          color: rgba(255,216,107,.70);
          font-size: .18rem;
          font-weight: 950;
          letter-spacing: 0;
          white-space: nowrap;
        }

        .stationFooterLeaderStatus {
          min-height: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 2px;
          padding: 1px 3px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 999px;
          font-size: .16rem;
          font-weight: 1000;
          letter-spacing: .015em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationFooterLeaderStatus.tight {
          color: #ffcb5c;
          border-color: rgba(255,203,92,.20);
          background: rgba(255,203,92,.05);
        }

        .stationFooterLeaderStatus.firm {
          color: #ffd86b;
          border-color: rgba(255,216,107,.22);
          background: rgba(255,216,107,.055);
        }

        .stationFooterLeaderStatus.solid {
          color: #7bf5be;
          border-color: rgba(123,245,190,.22);
          background: rgba(123,245,190,.055);
        }

        .stationFooterLeaderStrength {
          flex: 0 0 auto;
          height: 8px;
          display: inline-flex;
          align-items: flex-end;
          gap: 1px;
          margin-left: 2px;
        }

        .stationFooterLeaderStrength > i {
          width: 2px;
          display: block;
          border-radius: 999px 999px 1px 1px;
          background: currentColor;
          opacity: .16;
        }

        .stationFooterLeaderStrength > i:nth-child(1) {
          height: 3px;
        }

        .stationFooterLeaderStrength > i:nth-child(2) {
          height: 5px;
        }

        .stationFooterLeaderStrength > i:nth-child(3) {
          height: 8px;
        }

        .stationFooterLeaderStrength.tight > i:nth-child(1),
        .stationFooterLeaderStrength.firm > i:nth-child(-n+2),
        .stationFooterLeaderStrength.solid > i {
          opacity: .92;
        }

        .stationFooterLeaderStrength.tight {
          color: #ffcb5c;
        }

        .stationFooterLeaderStrength.firm {
          color: #ffd86b;
        }

        .stationFooterLeaderStrength.solid {
          color: #7bf5be;
        }

        .stationFooterLeaderTrend {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 2px;
          font-size: .23rem;
          font-style: normal;
          font-weight: 1000;
          line-height: 1;
          text-shadow: none;
        }

        .stationFooterLeaderTrend.growing {
          color: #7bf5be;
        }

        .stationFooterLeaderTrend.shrinking {
          color: #ff8e99;
        }

        .stationFooterLeaderTrend.stable {
          color: rgba(255,255,255,.46);
        }

        .stationFooterLeaderCrown.newLeader {
          animation: stationNewLeaderCrownPulse 1.55s ease-in-out infinite;
        }

        @keyframes stationNewLeaderCrownPulse {
          0%,
          100% {
            opacity: .82;
            transform: translateY(0) scale(.94);
          }

          50% {
            opacity: 1;
            transform: translateY(-1px) scale(1.10);
          }
        }

        .stationFooterRankPosition.rankSilver {
          color: #dfe8f5;
          text-shadow: 0 0 7px rgba(223,232,245,.16);
        }

        .stationFooterRankPosition.rankBronze {
          color: #e9a873;
          text-shadow: 0 0 7px rgba(233,168,115,.16);
        }

        .stationFooterRankPosition.rankStandard {
          color: #8fb7ff;
        }

        .stationFooterTop3ChaserGap {
          min-height: 12px;
          max-width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          margin-left: 3px;
          padding: 1px 4px;
          border: 1px solid rgba(215,166,255,.18);
          border-radius: 999px;
          color: rgba(215,166,255,.82);
          background: rgba(215,166,255,.04);
          font-size: .18rem;
          font-weight: 1000;
          letter-spacing: .01em;
          line-height: 1;
          text-shadow: none;
          white-space: nowrap;
          vertical-align: middle;
        }

        .stationFooterTop3ChaserGap > i {
          color: #d7a6ff;
          font-size: .24rem;
          font-style: normal;
          line-height: 1;
        }

        .stationFooterTop3ChaserGap,
        .stationFooterThirdGap,
        .stationFooterPursuerGap {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stationFooterTop3ChaserGapRate {
          color: rgba(215,166,255,.64);
          font-size: .16rem;
          font-weight: 950;
          letter-spacing: 0;
          white-space: nowrap;
        }

        .stationFooterTop3ChaserGap.atDoor {
          color: #ffd86b;
          border-color: rgba(255,216,107,.26);
          background: rgba(255,216,107,.055);
          box-shadow: 0 0 8px rgba(255,216,107,.08);
        }

        .stationFooterTop3ChaserGap.atDoor > i {
          color: #ffd86b;
        }

        .stationFooterThirdGap {
          min-height: 12px;
          max-width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          margin-left: 3px;
          padding: 1px 4px;
          border: 1px solid rgba(205,143,96,.20);
          border-radius: 999px;
          color: rgba(224,164,115,.86);
          background: rgba(205,143,96,.04);
          font-size: .18rem;
          font-weight: 1000;
          letter-spacing: .01em;
          line-height: 1;
          text-shadow: none;
          white-space: nowrap;
          vertical-align: middle;
        }

        .stationFooterThirdGap > i {
          color: #d89a66;
          font-size: .24rem;
          font-style: normal;
          line-height: 1;
        }

        .stationFooterThirdGapRate {
          color: rgba(224,164,115,.66);
          font-size: .16rem;
          font-weight: 950;
          letter-spacing: 0;
          white-space: nowrap;
        }

        .stationFooterThirdPressure {
          flex: 0 0 auto;
          height: 8px;
          display: inline-flex;
          align-items: flex-end;
          gap: 1px;
          margin-left: 2px;
        }

        .stationFooterThirdPressure > i {
          width: 2px;
          display: block;
          border-radius: 999px 999px 1px 1px;
          background: currentColor;
          opacity: .16;
        }

        .stationFooterThirdPressure > i:nth-child(1) {
          height: 3px;
        }

        .stationFooterThirdPressure > i:nth-child(2) {
          height: 5px;
        }

        .stationFooterThirdPressure > i:nth-child(3) {
          height: 8px;
        }

        .stationFooterThirdPressure.low {
          color: rgba(224,164,115,.66);
        }

        .stationFooterThirdPressure.medium {
          color: #ffcb5c;
        }

        .stationFooterThirdPressure.high {
          color: #ff8e99;
        }

        .stationFooterThirdPressure.low > i:nth-child(1),
        .stationFooterThirdPressure.medium > i:nth-child(-n+2),
        .stationFooterThirdPressure.high > i {
          opacity: .94;
        }

        .stationFooterThirdPressureTrend {
          min-width: 20px;
          min-height: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 1px;
          padding: 1px 2px;
          border-radius: 999px;
          font-size: .17rem;
          font-weight: 1000;
          letter-spacing: 0;
          line-height: 1;
          text-shadow: none;
          white-space: nowrap;
        }

        .stationFooterThirdPressureTrend.increasing {
          color: #ff8e99;
          background: rgba(255,142,153,.05);
        }

        .stationFooterThirdPressureTrend.decreasing {
          color: #7bf5be;
          background: rgba(123,245,190,.045);
        }

        .stationFooterThirdPressureTrend.stable {
          color: rgba(255,255,255,.44);
          background: rgba(255,255,255,.025);
        }

        .stationFooterThirdGap.tied {
          color: #ffd86b;
          border-color: rgba(255,216,107,.24);
          background: rgba(255,216,107,.055);
        }

        .stationFooterThirdGap.pressureAlert {
          border-color: rgba(255,142,153,.30);
          background:
            linear-gradient(
              90deg,
              rgba(205,143,96,.055),
              rgba(255,142,153,.055)
            );
          box-shadow:
            0 0 0 1px rgba(255,142,153,.03),
            0 0 10px rgba(255,142,153,.09);
          animation:
            stationThirdPressureAlert 1.7s ease-in-out infinite;
        }

        @keyframes stationThirdPressureAlert {
          0%,
          100% {
            box-shadow:
              0 0 0 1px rgba(205,143,96,.03),
              0 0 7px rgba(205,143,96,.06);
          }

          50% {
            box-shadow:
              0 0 0 1px rgba(255,142,153,.10),
              0 0 14px rgba(255,142,153,.17);
          }
        }

        .stationFooterThirdGap.tied > i {
          color: #ffd86b;
        }

        .stationFooterThirdGap.tied
          .stationFooterThirdPressure.high {
          color: #ffd86b;
        }

        .stationFooterPursuerGap {
          min-height: 12px;
          max-width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          margin-left: 3px;
          padding: 1px 4px;
          border: 1px solid rgba(143,183,255,.16);
          border-radius: 999px;
          color: rgba(143,183,255,.82);
          background: rgba(143,183,255,.035);
          font-size: .18rem;
          font-weight: 1000;
          letter-spacing: .01em;
          line-height: 1;
          text-shadow: none;
          white-space: nowrap;
          vertical-align: middle;
        }

        .stationFooterPursuerGap > i {
          color: #8fb7ff;
          font-size: .24rem;
          font-style: normal;
          line-height: 1;
        }

        .stationFooterPursuerGapRate {
          color: rgba(143,183,255,.62);
          font-size: .16rem;
          font-weight: 950;
          letter-spacing: 0;
          white-space: nowrap;
        }

        .stationFooterPursuerPressure {
          flex: 0 0 auto;
          height: 8px;
          display: inline-flex;
          align-items: flex-end;
          gap: 1px;
          margin-left: 2px;
        }

        .stationFooterPursuerPressure > i {
          width: 2px;
          display: block;
          border-radius: 999px 999px 1px 1px;
          background: currentColor;
          opacity: .16;
        }

        .stationFooterPursuerPressure > i:nth-child(1) {
          height: 3px;
        }

        .stationFooterPursuerPressure > i:nth-child(2) {
          height: 5px;
        }

        .stationFooterPursuerPressure > i:nth-child(3) {
          height: 8px;
        }

        .stationFooterPursuerPressure.low {
          color: rgba(143,183,255,.66);
        }

        .stationFooterPursuerPressure.medium {
          color: #ffcb5c;
        }

        .stationFooterPursuerPressure.high {
          color: #ff8e99;
        }

        .stationFooterPursuerPressure.low > i:nth-child(1),
        .stationFooterPursuerPressure.medium > i:nth-child(-n+2),
        .stationFooterPursuerPressure.high > i {
          opacity: .94;
        }

        .stationFooterPursuerPressureTrend {
          min-width: 20px;
          min-height: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 1px;
          padding: 1px 2px;
          border-radius: 999px;
          font-size: .17rem;
          font-weight: 1000;
          letter-spacing: 0;
          line-height: 1;
          text-shadow: none;
          white-space: nowrap;
        }

        .stationFooterPursuerPressureTrend.increasing {
          color: #ff8e99;
          background: rgba(255,142,153,.05);
        }

        .stationFooterPursuerPressureTrend.decreasing {
          color: #7bf5be;
          background: rgba(123,245,190,.045);
        }

        .stationFooterPursuerPressureTrend.stable {
          color: rgba(255,255,255,.44);
          background: rgba(255,255,255,.025);
        }

        .stationFooterPursuerGap.tied {
          color: #ffd86b;
          border-color: rgba(255,216,107,.24);
          background: rgba(255,216,107,.055);
        }

        .stationFooterPursuerGap.pressureAlert {
          border-color: rgba(255,142,153,.30);
          background: rgba(255,142,153,.055);
          box-shadow:
            0 0 0 1px rgba(255,142,153,.035),
            0 0 10px rgba(255,142,153,.10);
          animation:
            stationPursuerPressureAlert 1.65s ease-in-out infinite;
        }

        @keyframes stationPursuerPressureAlert {
          0%,
          100% {
            box-shadow:
              0 0 0 1px rgba(255,142,153,.025),
              0 0 7px rgba(255,142,153,.06);
          }

          50% {
            box-shadow:
              0 0 0 1px rgba(255,142,153,.10),
              0 0 14px rgba(255,142,153,.18);
          }
        }

        .stationFooterPursuerGap.tied > i {
          color: #ffd86b;
        }

        .stationFooterPursuerGap.tied
          .stationFooterPursuerPressure.high {
          color: #ffd86b;
        }

        .stationFooterRankMovement {
          min-width: 18px;
          min-height: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 1px;
          margin-left: 3px;
          padding: 1px 3px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 999px;
          font-size: .25rem;
          font-weight: 1000;
          letter-spacing: 0;
          line-height: 1;
          vertical-align: middle;
        }

        .stationFooterRankMovement.up {
          color: #7bf5be;
          border-color: rgba(123,245,190,.18);
          background: rgba(123,245,190,.045);
        }

        .stationFooterRankMovement.down {
          color: #ff8e99;
          border-color: rgba(255,142,153,.18);
          background: rgba(255,142,153,.045);
        }

        .stationFooterRankMovement.steady {
          color: rgba(255,255,255,.42);
          background: rgba(255,255,255,.018);
        }

        .stationFooterRankMovement.leaderTakeover,
        .stationFooterRankMovement.top3Entry {
          color: #ffd86b;
          border-color: rgba(255,216,107,.30);
          background: rgba(255,216,107,.065);
          box-shadow:
            0 0 0 1px rgba(255,216,107,.025),
            0 0 8px rgba(255,216,107,.10);
        }

        .stationFooterRankMovement.leaderLost,
        .stationFooterRankMovement.top3Exit {
          color: #ff8e99;
          border-color: rgba(255,142,153,.26);
          background: rgba(255,142,153,.055);
          box-shadow:
            0 0 0 1px rgba(255,142,153,.02),
            0 0 7px rgba(255,142,153,.075);
        }

        .stationFooterRankMovement.leaderTakeover {
          animation:
            stationCompactLeaderTakeover 1.55s ease-in-out infinite;
        }

        @keyframes stationCompactLeaderTakeover {
          0%,
          100% {
            box-shadow:
              0 0 0 1px rgba(255,216,107,.02),
              0 0 6px rgba(255,216,107,.07);
          }

          50% {
            box-shadow:
              0 0 0 1px rgba(255,216,107,.10),
              0 0 11px rgba(255,216,107,.16);
          }
        }

        .stationFooterRankTransition {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          letter-spacing: -.01em;
        }

        .stationFooterAverageContext {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          color: rgba(255,255,255,.44);
          font-size: .22rem;
          font-weight: 900;
          letter-spacing: .015em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationFooterAudienceShare > small {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: .24rem;
          font-weight: 950;
          letter-spacing: .02em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationFooterAudienceShare > small.aboveAverage {
          color: #7bf5be;
        }

        .stationFooterAudienceShare > small.belowAverage {
          color: rgba(255,203,92,.82);
        }

        .stationFooterAudienceShare > small.atAverage {
          color: rgba(255,255,255,.48);
        }

        .stationFooterAudienceShare > small.listenersVsAverage {
          font-size: .22rem;
          letter-spacing: .015em;
          opacity: .88;
        }

        .stationFooterAudienceTrack {
          position: relative;
          width: 100%;
          height: 2px;
          display: block;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.055);
        }

        .stationFooterAudienceFill {
          position: absolute;
          inset: 0 auto 0 0;
          display: block;
          max-width: 100%;
          border-radius: inherit;
          transition:
            width .32s cubic-bezier(.22,.78,.24,1),
            background .20s ease,
            box-shadow .20s ease;
        }

        .stationFooterAudienceFill.aboveAverage {
          background: #7bf5be;
          box-shadow: 0 0 7px rgba(123,245,190,.28);
        }

        .stationFooterAudienceFill.belowAverage {
          background: #ffcb5c;
          box-shadow: 0 0 7px rgba(255,203,92,.24);
        }

        .stationFooterAudienceFill.atAverage {
          background: #d7a6ff;
          box-shadow: 0 0 7px rgba(215,166,255,.26);
        }

        .stationFooterAudienceAverage {
          position: absolute;
          top: -1px;
          bottom: -1px;
          width: 1px;
          display: block;
          transform: translateX(-50%);
          background: rgba(255,255,255,.72);
          box-shadow: 0 0 4px rgba(255,255,255,.30);
          pointer-events: none;
        }

        .stationGridCompact .stationFooter > span {
          justify-self: end;
          font-size: .48rem;
        }

        .stationGridCompact .stationFooterAudienceDelta {
          min-height: 15px;
          padding: 1px 3px;
          font-size: .29rem;
        }

        .stationGridCompact .stationFooterAudienceDeltaRate {
          display: none;
        }

        .stationGridCompact .stationFooterAudienceStrength {
          height: 7px;
          gap: 1px;
        }

        .stationGridCompact .stationFooterAudienceStrength > i {
          width: 1.5px;
        }

        .stationGridCompact
          .stationFooterAudienceStrength
          > i:nth-child(1) {
          height: 2px;
        }

        .stationGridCompact
          .stationFooterAudienceStrength
          > i:nth-child(2) {
          height: 4px;
        }

        .stationGridCompact
          .stationFooterAudienceStrength
          > i:nth-child(3) {
          height: 7px;
        }

        .stationGridCompact .stationFooterAudienceShare {
          min-width: 68px;
          max-width: 96px;
          padding: 2px 4px;
        }

        .stationGridCompact .stationFooterAudienceShare > em,
        .stationGridCompact .stationFooterAudienceMain {
          font-size: .27rem;
        }

        .stationGridCompact .stationFooterAudienceShare.rankingActive {
          max-width: 156px;
        }

        .stationGridCompact .stationFooterRankMovement {
          min-width: 15px;
          min-height: 12px;
          margin-left: 2px;
          padding: 1px 2px;
          font-size: .21rem;
        }

        .stationGridCompact .stationFooterRankTransition {
          letter-spacing: -.02em;
        }

        .stationGridCompact .stationFooterLeaderCrown {
          gap: 1px;
          margin-right: 2px;
          font-size: .34rem;
        }

        .stationGridCompact .stationFooterPursuerGap,
        .stationGridCompact .stationFooterThirdGap,
        .stationGridCompact .stationFooterTop3ChaserGap {
          display: none;
        }

        .stationGridCompact .stationFooterLeaderGap {
          min-height: 10px;
          padding: 1px 2px;
          font-size: .17rem;
        }

        .stationGridCompact .stationFooterLeaderGapRate,
        .stationGridCompact .stationFooterLeaderStatus,
        .stationGridCompact .stationFooterLeaderStrength {
          display: none;
        }

        .stationGridCompact .stationFooterLeaderTrend {
          font-size: .18rem;
        }

        .stationGridCompact .stationFooterAverageContext,
        .stationGridCompact .stationFooterAudienceShare > small {
          display: none;
        }

        .stationGridCompact .stationFooterAudienceTrack {
          height: 2px;
        }

        .stationGridCompact .stationFooter > button.stationCardPlay {
          width: 100%;
          min-height: 38px;
        }

        .stationGridCompact .stationGenreQuickFilter {
          min-height: 22px;
          padding: 0 6px;
          font-size: .34rem;
        }

        .stationGridCompact .stationLiveStrip {
          grid-area: actions;
          align-self: center;
          min-height: 32px;
          margin: 51px 0 0;
        }

        .stationGridCompact .stationPageLink {
          grid-area: actions;
          align-self: end;
          min-height: 35px;
          margin: 0;
        }

        .stationGridCompact .stationLiveGenre {
          max-width: 34%;
        }

        @media (max-width: 900px) {
          .stationSelectionTop3 {
            grid-template-columns: 1fr;
          }

          .stationSelectionTop3List {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .stationFilterSummary {
            grid-template-columns: auto minmax(0, 1fr) auto;
          }

          .stationFilteredMetrics {
            grid-column: 1 / -1;
            grid-row: 2;
          }

          .stationActiveFilterChips {
            grid-column: 1 / 3;
            grid-row: 3;
          }

          .stationClearAllFilters {
            grid-column: 3;
            grid-row: 3;
          }

          .stationGridCompact .stationCard {
            grid-template-columns: 82px minmax(0, 1fr);
            grid-template-areas:
              "artwork identity"
              "artwork now"
              "actions actions";
            min-height: 0;
            row-gap: 9px;
          }

          .stationGridCompact .stationArtwork {
            width: 76px !important;
            height: 76px !important;
          }

          .stationGridCompact .stationArtworkMain {
            width: 76px !important;
            height: 76px !important;
          }

          .stationGridCompact .stationFooter {
            grid-area: actions;
            grid-template-columns: auto minmax(120px, 180px);
            align-items: center;
            margin: 0;
          }

          .stationGridCompact .stationFooter > span {
            justify-self: start;
          }

          .stationGridCompact .stationLiveStrip {
            grid-area: actions;
            margin: 46px 0 0;
          }

          .stationGridCompact .stationPageLink {
            grid-area: actions;
            margin-top: 88px;
          }
        }

        @media (max-width: 1100px) {
          .stationFullRankingBanner {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationFullRankingBannerMain {
            grid-template-columns: 1fr;
          }

          .stationFullRankingBannerActions {
            grid-column: 1 / -1;
          }

          .stationFullRankingCurrent,
          .stationFullRankingCurrentOutside,
          .stationFullRankingNextTarget,
          .stationRankingTrendHeading {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationRankingTrendHeading > b {
            grid-column: 1 / -1;
            padding-left: 31px;
          }

          .stationRankingTrendUpdated {
            grid-column: 1 / -1;
            width: 100%;
            justify-items: start;
            padding-left: 31px;
          }

          .stationRankingTrendToggle {
            grid-column: 1 / -1;
            width: 100%;
            min-height: 28px;
          }

          .stationRankingTrendUpdated small {
            font-size: .13rem;
          }

          .stationRankingTrendUpdated strong {
            font-size: .19rem;
          }

          .stationRankingTrendBalanceHeading {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationRankingTrendBalanceHeading > b {
            grid-column: 1 / -1;
            padding-left: 27px;
          }

          .stationRankingTrendBalanceLegend {
            grid-template-columns: 1fr;
            justify-items: start;
          }

          .stationRankingTrendBalanceLegend > span {
            justify-content: flex-start;
          }

          .stationRankingTrendCurrent {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationRankingTrendCurrent > b {
            grid-column: 1 / -1;
            padding-left: 30px;
          }

          .stationRankingPodiumChangeHeading {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationRankingPodiumChangeHeading > b {
            grid-column: 1 / -1;
            padding-left: 27px;
          }

          .stationRankingLeadershipChange {
            grid-template-columns: 1fr;
          }

          .stationRankingLeadershipCurrent em,
          .stationRankingLeadershipPrevious em {
            font-size: .14rem;
          }

          .stationRankingLeadershipRaceToggle {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationRankingLeadershipRaceToggle > strong {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .stationRankingLeadershipRaceToggle > em {
            grid-column: 1 / -1;
            padding-left: 24px;
            text-align: left;
          }

          .stationRankingLeadershipCollapsedActions {
            grid-template-columns: 1fr;
          }

          .stationRankingLeadershipQuickActionsToggle,
          .stationRankingLeadershipCollapsedHomeListen,
          .stationRankingLeadershipCollapsedHomeListen,
          .stationRankingLeadershipCollapsedHomeFavorite,
          .stationRankingLeadershipCollapsedHomeView,
          .stationRankingLeadershipCollapsedView,
          .stationRankingLeadershipCollapsedListen,
          .stationRankingLeadershipCollapsedFavorite,
          .stationRankingLeadershipCollapsedShare,
          .stationRankingLeadershipCollapsedEnter {
            width: 100%;
            min-height: 32px;
          }

          .stationRankingLeadershipQuickActionsToggle {
            grid-template-columns: auto minmax(0, 1fr) auto;
          }

          .stationRankingLeadershipCollapsedActions {
            grid-template-columns: 1fr;
          }

          .stationRankingLeadershipCollapsedEnterGroup {
            grid-template-columns: 1fr;
          }

          .stationRankingLeadershipRaceCollapsedLeader,
          .stationRankingLeadershipRaceCollapsedRival {
            grid-template-columns:
              auto auto minmax(0, 1fr) auto auto;
          }

          .stationRankingLeadershipPlayingMark,
          .stationRankingLeadershipFavoriteMark {
            justify-self: start;
          }

          .stationRankingLeadershipCollapsedLogo {
            width: 26px;
            height: 26px;
          }

          .stationRankingLeadershipRaceCollapsedLeader > strong {
            grid-column: 1 / -1;
            text-align: left;
          }

          .stationRankingLeadershipRaceCollapsedLeader > b {
            max-width: none;
          }

          .stationRankingLeadershipHeadToHeadHeading {
            align-items: flex-start;
            flex-direction: column;
            gap: 4px;
          }

          .stationRankingLeadershipHeadToHeadHeading > em,
          .stationRankingLeadershipHeadToHeadCollapsedSummary {
            white-space: normal;
          }

          .stationRankingLeadershipHeadToHeadCollapsedAdvantage,
          .stationRankingLeadershipHeadToHeadCollapsedMoment,
          .stationRankingLeadershipHeadToHeadCollapsedTrend {
            white-space: normal;
          }

          .stationRankingLeadershipHeadToHeadCollapsedBar {
            width: min(100%, 180px);
            flex-basis: min(100%, 180px);
          }

          .stationRankingLeadershipCollapsedMarkerLegend {
            flex-wrap: wrap;
            gap: 5px 10px;
          }

          .stationRankingLeadershipHeadToHeadToggle {
            width: 100%;
            margin-left: 0;
          }

          .stationRankingLeadershipHeadToHeadLabels {
            align-items: flex-start;
            flex-direction: column;
            gap: 2px;
          }

          .stationRankingLeadershipHeadToHeadLabels > b:last-child {
            text-align: left;
          }

          .stationRankingLeadershipHeadToHeadAdvantage > strong {
            white-space: normal;
          }

          .stationRankingLeadershipHeadToHeadTrend {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationRankingLeadershipHeadToHeadTrend > small {
            grid-column: 1 / -1;
          }

          .stationRankingLeadershipHeadToHeadTrend > strong {
            text-align: left;
            white-space: normal;
          }

          .stationRankingLeadershipHeadToHeadScaleLabels {
            grid-template-columns: 1fr;
            gap: 3px;
          }

          .stationRankingLeadershipHeadToHeadReferenceScale > small {
            font-size: .068rem;
          }

          .stationRankingLeadershipHeadToHeadLeaderMarker > b,
          .stationRankingLeadershipHeadToHeadRivalMarker > b {
            min-width: 24px;
            font-size: .078rem;
          }

          .stationRankingLeadershipMarkerActionLabel {
            display: none;
          }

          .stationRankingLeadershipHeadToHeadScaleLabels > small,
          .stationRankingLeadershipHeadToHeadScaleLabels > small:first-child,
          .stationRankingLeadershipHeadToHeadScaleLabels > small:last-child,
          .stationRankingLeadershipHeadToHeadMidpointLabel {
            justify-self: start;
            text-align: left !important;
          }

          .stationRankingLeadershipEquilibriumDistance {
            align-items: flex-start;
            flex-direction: column;
            gap: 3px;
          }

          .stationRankingLeadershipEquilibriumDistance > b {
            text-align: left;
            white-space: normal;
          }

          .stationRankingLeadershipMomentWinner {
            grid-template-columns: 1fr;
          }

          .stationRankingLeadershipMomentWinner > span {
            justify-content: flex-start;
          }

          .stationRankingLeadershipMomentWinner > span > b {
            white-space: normal;
          }

          .stationRankingLeadershipMomentWinner > em {
            text-align: left;
            white-space: normal;
          }

          .stationRankingLeadershipCollapsedUpdated {
            grid-column: 1 / -1;
            justify-self: start;
          }

          .stationRankingLeadershipCollapsedMovement {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationRankingLeadershipCollapsedMovement > small {
            grid-column: 1 / -1;
          }

          .stationRankingLeadershipCollapsedMovement > b {
            text-align: left;
            white-space: normal;
          }

          .stationRankingLeadershipRivalReach {
            align-items: flex-start;
            flex-direction: column;
          }

          .stationRankingLeadershipRivalReach > b {
            white-space: normal;
          }

          .stationRankingLeadershipRivalGoal {
            grid-template-columns: 1fr;
          }

          .stationRankingLeadershipRivalGoal > span {
            align-items: flex-start;
            flex-direction: column;
            gap: 2px;
          }

          .stationRankingLeadershipRivalGoal > span > b,
          .stationRankingLeadershipRivalGoal > span > i {
            white-space: normal;
          }

          .stationRankingLeadershipRivalPressure {
            grid-template-columns: 1fr;
          }

          .stationRankingLeadershipRivalPressure > span {
            justify-content: start;
          }

          .stationRankingLeadershipRivalPressure
            > span > em {
            text-align: left;
            white-space: normal;
          }

          .stationRankingLeadershipPressureMeter {
            width: 100%;
          }

          .stationRankingPressureLegend {
            justify-content: flex-start;
          }

          .stationRankingLeadershipNextThreshold {
            grid-template-columns: 1fr;
          }

          .stationRankingLeadershipNextThreshold > span {
            justify-content: flex-start;
          }

          .stationRankingLeadershipNextThreshold > span > b {
            white-space: normal;
          }

          .stationRankingLeadershipRaceCollapsedRival > strong {
            grid-column: 1 / -1;
            text-align: left;
          }

          .stationRankingLeadershipRaceCollapsedRival > b {
            max-width: none;
          }

          .stationRankingLeadershipStatus {
            grid-template-columns: minmax(0, 1fr) auto;
          }

          .stationRankingLeadershipStatus > small {
            grid-column: 1 / -1;
          }

          .stationRankingLeadershipStatus > strong {
            font-size: .12rem;
          }

          .stationRankingLeadershipDefense {
            max-width: 100%;
            overflow: hidden;
            font-size: .13rem;
            text-overflow: ellipsis;
          }

          .stationRankingLeadershipDefenseTrend {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationRankingLeadershipDefenseTrend > small {
            grid-column: 2;
          }

          .stationRankingLeadershipDefenseTrend > strong {
            grid-column: 2;
          }

          .stationRankingLeadershipRace {
            grid-template-columns: 1fr;
          }

          .stationRankingLeadershipRace > small {
            margin-bottom: 1px;
          }

          .stationRankingLeadershipRaceGap {
            width: 100%;
          }

          .stationRankingLeadershipRaceNow {
            width: 100%;
          }

          .stationRankingLeadershipRaceNow.selectedNow,
          .stationRankingLeadershipRaceNow.rivalNow {
            width: 100%;
          }

          .stationRankingLeadershipRaceNow strong {
            font-size: .12rem;
          }

          .stationRankingLeadershipRaceNow em {
            font-size: .10rem;
          }

          .stationRankingLeadershipRaceGap > em > small {
            font-size: .10rem;
          }

          .stationRankingLeadershipRaceGap > em > b {
            font-size: .12rem;
          }

          .stationRankingLeadershipRace > span {
            grid-template-columns: auto minmax(0, 1fr) auto;
          }

          .stationRankingLeadershipRaceActions {
            width: 100%;
            grid-template-columns: 1fr;
          }

          .stationRankingLeadershipRaceToggle,
          .stationRankingLeadershipCollapsedView,
          .stationRankingLeadershipCollapsedListen,
          .stationRankingLeadershipCollapsedFavorite,
          .stationRankingLeadershipCollapsedShare,
          .stationRankingLeadershipCollapsedEnter,
          .stationRankingLeadershipRaceHome,
          .stationRankingLeadershipRaceHomeListen,
          .stationRankingLeadershipRaceTarget,
          .stationRankingLeadershipRaceListen {
            width: 100%;
            min-height: 26px;
          }

          .stationRankingLeadershipCurrent.selectedLeadership small,
          .stationRankingLeadershipPrevious.selectedLeadership small {
            font-size: .15rem;
          }

          .stationRankingPodiumChangeActions {
            grid-template-columns: 1fr;
          }

          .stationRankingPodiumEnter em,
          .stationRankingPodiumExit em {
            font-size: .15rem;
          }

          .stationRankingPodiumEnter.selectedPodiumChange small,
          .stationRankingPodiumExit.selectedPodiumChange small {
            font-size: .15rem;
          }

          .stationRankingAudienceImpulseHeading {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationRankingAudienceImpulseHeading > b {
            grid-column: 1 / -1;
            padding-left: 27px;
          }

          .stationRankingAudienceNet {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationRankingAudienceNet > b {
            grid-column: 1 / -1;
            padding-left: 30px;
          }

          .stationRankingAudienceImpulseActions {
            grid-template-columns: 1fr;
          }

          .stationRankingTrendActions {
            grid-template-columns: 1fr;
          }

          .stationFullRankingRivalActions {
            grid-template-columns: 1fr;
          }

          .stationFullRankingRivalDuelHeading {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationFullRankingRivalDuelHeading > b {
            grid-column: 1 / -1;
            padding-left: 29px;
          }

          .stationFullRankingRivalDuelScore {
            grid-template-columns: 1fr;
          }

          .stationFullRankingRivalDuelScore > i {
            justify-self: center;
          }

          .stationFullRankingRivalNow > span:last-child {
            grid-template-columns: 1fr;
          }

          .stationFullRankingRivalNow small {
            grid-row: auto;
          }

          .stationRankingLeadershipRaceHome,
          .stationRankingLeadershipRaceHomeListen,
          .stationRankingLeadershipRaceTarget,
          .stationRankingLeadershipRaceListen,
          .stationRankingLeadershipCurrent,
          .stationRankingLeadershipPrevious,
          .stationRankingPodiumEnter,
          .stationRankingPodiumExit,
          .stationRankingAudienceGain,
          .stationRankingAudienceLoss,
          .stationRankingTrendToggle,
          .stationRankingTrendCurrent,
          .stationRankingTrendUp,
          .stationRankingTrendDown,
          .stationFullRankingNextTarget,
          .stationFullRankingNextListen,
          .stationFullRankingCurrent,
          .stationFullRankingCurrentOutside,
          .stationFullRankingShare,
          .stationFullRankingBannerBack {
            width: 100%;
          }

          .stationFullRankingCurrentMeta {
            align-items: flex-start;
            flex-direction: column;
            gap: 3px;
          }

          .stationFullRankingCurrentMeta > em {
            text-align: left;
          }

          .stationFullRankingCurrentBattleLabel {
            align-items: flex-start;
            flex-direction: column;
            gap: 2px;
          }

          .stationFullRankingCurrentBattleLabel > b {
            text-align: left;
          }

          .stationFullRankingCurrentGoal {
            width: 100%;
            justify-content: center;
          }

          .stationFullRankingNextGoal {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationFullRankingNextGoal > em {
            grid-column: 1 / -1;
            padding-left: 22px;
          }
        }

        @media (max-width: 600px) {
          .stationFullRankingBanner {
            grid-template-columns: auto minmax(0, 1fr);
            gap: 8px;
          }

          .stationFullRankingBannerMain {
            grid-column: 2;
          }

          .stationFullRankingLeader {
            grid-template-columns: auto minmax(0, 1fr) auto;
          }

          .stationFullRankingLeaderAudience {
            display: none;
          }

          .stationFullRankingLeader > button {
            grid-column: 1 / -1;
            width: 100%;
          }

          .stationLeadershipDuelHeading {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .stationLeadershipDuelHeading > b {
            grid-column: 1 / -1;
            padding-left: 29px;
          }

          .stationLeadershipDuelToggle {
            grid-column: 1 / -1;
            width: 100%;
            min-height: 28px;
          }

          .stationLeadershipDuelScore {
            grid-template-columns: 1fr;
          }

          .stationLeadershipDuelScore > i {
            justify-self: center;
          }

          .stationFullRankingChallenger {
            grid-template-columns: auto auto minmax(0, 1fr) auto;
          }

          .stationFullRankingChallengerAudience {
            display: none;
          }

          .stationFullRankingChallengerNow {
            grid-template-columns: 1fr;
          }

          .stationFullRankingChallengerNow > i {
            grid-row: auto;
          }

          .stationFullRankingChallenger > button {
            grid-column: 1 / -1;
            width: 100%;
          }

          .stationFullRankingBannerActions {
            grid-column: 1 / -1;
            width: 100%;
          }

          .stationFullRankingBannerBack {
            width: 100%;
          }

          .stationSelectionTop3 {
            gap: 8px;
          }

          .stationSelectionTop3Heading {
            flex-wrap: wrap;
          }

          .stationSelectionTop3Context {
            max-width: min(100%, 280px);
          }

          .stationSelectionTop3Heading small {
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .stationSelectionTop3Actions {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .stationSelectionTop3Ranking,
          .stationSelectionTop3Toggle {
            width: 100%;
            min-height: 30px;
          }

          .stationSelectionTop3List {
            grid-template-columns: 1fr;
          }

          .stationSelectionTop3List button {
            min-height: 58px;
          }

          .stationSelectionTop3Logo {
            width: 34px;
            height: 34px;
          }

          .stationSelectionTop3Audience {
            min-width: 64px;
          }

          .stationGridCompact .stationCard {
            grid-template-columns: 68px minmax(0, 1fr);
            grid-template-areas:
              "artwork identity"
              "artwork now"
              "actions actions";
            column-gap: 11px;
            padding: 11px;
          }

          .stationGridCompact .stationArtwork {
            width: 64px !important;
            height: 64px !important;
          }

          .stationGridCompact .stationArtworkMain {
            width: 64px !important;
            height: 64px !important;
          }

          .stationGridCompact .stationLogoBadge {
            width: 25px !important;
            height: 25px !important;
          }

          .stationGridCompact .stationArtworkMomentum {
            top: 4px;
            right: 4px;
            min-width: 18px;
            width: 18px;
            height: 18px;
            padding: 0;
            font-size: .38rem;
          }

          .stationGridCompact .stationArtworkPlay {
            min-width: 58px;
            min-height: 29px;
          }

          .stationGridCompact .stationArtworkPlay strong {
            display: none;
          }

          .stationGridCompact .stationSelectedState {
            left: 90px;
            max-width: calc(100% - 150px);
          }

          .stationGridCompact .stationNameRow {
            padding-top: 12px;
          }

          .stationGridCompact .stationNameRow h3 {
            font-size: .78rem;
          }

          .stationGridCompact .stationNow {
            min-height: 58px;
          }

          .stationGridCompact .stationFooter {
            grid-template-columns: 1fr;
          }

          .stationGridCompact .stationFooter > span {
            display: none;
          }

          .stationGridCompact .stationLiveStrip {
            margin-top: 48px;
          }

          .stationGridCompact .stationPageLink {
            margin-top: 88px;
          }
        }

        .stationCard {
          position: relative;
          overflow: hidden;
          transition:
            transform .22s ease,
            border-color .22s ease,
            box-shadow .22s ease,
            background .22s ease;
        }

        .stationCard::after {
          content: "";
          position: absolute;
          inset: auto 18px 0;
          height: 2px;
          border-radius: 999px 999px 0 0;
          background: var(--accent);
          opacity: 0;
          transform: scaleX(.35);
          transition:
            opacity .22s ease,
            transform .22s ease;
          pointer-events: none;
        }

        .stationCard:hover {
          transform: translateY(-4px);
        }

        .stationCard.active {
          border-color: color-mix(
            in srgb,
            var(--accent) 48%,
            rgba(255,255,255,.1)
          );
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--accent) 6%, rgba(13,18,40,.96)),
              rgba(8,12,30,.97)
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.045),
            0 18px 42px color-mix(in srgb, var(--accent) 13%, transparent);
        }

        .stationCard.active::after {
          opacity: 1;
          transform: scaleX(1);
        }

        .stationCard.mediumAudienceUp::before,
        .stationCard.mediumAudienceDown::before,
        .stationCard.strongAudienceUp::before,
        .stationCard.strongAudienceDown::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 5;
          border-radius: inherit;
          pointer-events: none;
          transition:
            opacity .22s ease,
            box-shadow .22s ease,
            border-color .22s ease;
        }

        .stationCard.mediumAudienceUp::before {
          opacity: .62;
          box-shadow:
            inset 2px 0 0 rgba(123,245,190,.34);
        }

        .stationCard.mediumAudienceDown::before {
          opacity: .62;
          box-shadow:
            inset 2px 0 0 rgba(255,124,137,.34);
        }

        .stationCard.mediumAudienceUp:hover::before {
          opacity: .84;
          box-shadow:
            inset 2px 0 0 rgba(123,245,190,.48);
        }

        .stationCard.mediumAudienceDown:hover::before {
          opacity: .84;
          box-shadow:
            inset 2px 0 0 rgba(255,124,137,.48);
        }

        .stationCard.strongAudienceUp::before {
          opacity: .76;
          border: 1px solid rgba(123,245,190,.18);
          box-shadow:
            inset 0 0 18px rgba(123,245,190,.055),
            inset 3px 0 0 rgba(123,245,190,.42);
        }

        .stationCard.strongAudienceDown::before {
          opacity: .76;
          border: 1px solid rgba(255,124,137,.18);
          box-shadow:
            inset 0 0 18px rgba(255,124,137,.050),
            inset 3px 0 0 rgba(255,124,137,.40);
        }

        .stationCard.strongAudienceUp:hover::before {
          opacity: .94;
          box-shadow:
            inset 0 0 24px rgba(123,245,190,.075),
            inset 3px 0 0 rgba(123,245,190,.58);
        }

        .stationCard.strongAudienceDown:hover::before {
          opacity: .94;
          box-shadow:
            inset 0 0 24px rgba(255,124,137,.070),
            inset 3px 0 0 rgba(255,124,137,.56);
        }

        .stationAudienceRank {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 6;
          min-width: 112px;
          display: grid;
          justify-items: center;
          gap: 1px;
          padding: 6px 8px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 11px;
          color: rgba(255,255,255,.68);
          background: rgba(5,9,24,.78);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 20px rgba(0,0,0,.18);
        }

        .stationAudienceRank small {
          font-size: .32rem;
          font-weight: 950;
          letter-spacing: .065em;
          white-space: nowrap;
          opacity: .55;
        }

        .stationAudienceRank strong {
          color: #fff;
          font-size: .9rem;
          line-height: 1;
          letter-spacing: -.02em;
        }

        .stationAudienceMovement {
          width: 100%;
          min-height: 19px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          margin-top: 3px;
          padding: 2px 5px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 999px;
          color: rgba(255,255,255,.34);
          background: rgba(255,255,255,.018);
          font-size: .18rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationAudienceMovement > span:first-child {
          font-size: .31rem;
          line-height: 1;
        }

        .stationAudienceMovementPosition {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationAudienceMovementPosition.becameLeader {
          color: #ffd86b;
          text-shadow: 0 0 9px rgba(255,216,107,.26);
        }

        .stationAudienceMovementPosition.lostLeadership {
          color: #ff9b9b;
          text-shadow: 0 0 8px rgba(255,155,155,.18);
        }

        .stationAudienceMovementPosition.enteredTop3 {
          color: #ffd86b;
          text-shadow: 0 0 7px rgba(255,216,107,.18);
        }

        .stationAudienceMovementPosition.exitedTop3 {
          color: #ff9b9b;
          text-shadow: 0 0 7px rgba(255,155,155,.14);
        }

        .stationAudienceMovement > em {
          font-size: .16rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .02em;
          white-space: nowrap;
        }

        .stationAudienceMovement > em.listenerUp {
          color: #7bf5be;
        }

        .stationAudienceMovement > em.listenerDown {
          color: #ff9b9b;
        }

        .stationAudienceMovement > em.listenerSteady {
          color: rgba(214,224,235,.42);
        }

        .stationAudienceMovement.up {
          border-color: rgba(123,245,190,.15);
          color: #7bf5be;
          background: rgba(123,245,190,.03);
        }

        .stationAudienceMovement.down {
          border-color: rgba(255,125,125,.14);
          color: #ff9b9b;
          background: rgba(255,125,125,.025);
        }

        .stationAudienceMovement.steady {
          border-color: rgba(214,224,235,.10);
          color: rgba(214,224,235,.48);
          background: rgba(214,224,235,.018);
        }

        .stationAudienceMovement.selected {
          border-color: color-mix(
            in srgb,
            var(--accent) 34%,
            rgba(255,255,255,.08)
          );
          box-shadow: 0 0 9px color-mix(
            in srgb,
            var(--accent) 10%,
            transparent
          );
        }

        .stationAudienceMovement.selected.up {
          color: #7bf5be;
        }

        .stationAudienceMovement.selected.down {
          color: #ff9b9b;
        }

        .stationAudienceRank:has(.becameLeader) {
          border-color: rgba(255,216,107,.30);
          box-shadow:
            0 8px 20px rgba(0,0,0,.18),
            0 0 14px rgba(255,216,107,.08);
        }

        .stationAudienceRank:has(.lostLeadership) {
          border-color: rgba(255,155,155,.24);
          box-shadow:
            0 8px 20px rgba(0,0,0,.18),
            0 0 12px rgba(255,155,155,.06);
        }

        .stationAudienceRankDetailsToggle {
          width: 100%;
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin-top: 3px;
          padding: 0 6px;
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 17%,
            rgba(255,255,255,.06)
          );
          border-radius: 999px;
          color: rgba(255,255,255,.38);
          background: rgba(255,255,255,.018);
          cursor: pointer;
          font-family: inherit;
          font-size: .18rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          white-space: nowrap;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationAudienceRankDetailsToggle > span {
          color: var(--accent);
          font-size: .40rem;
          line-height: 1;
        }

        .stationAudienceRankDetailsToggle:hover {
          color: #07101a;
          border-color: var(--accent);
          background: var(--accent);
          transform: translateY(-1px);
        }

        .stationAudienceRankDetailsToggle:hover > span {
          color: #07101a;
        }

        .stationAudienceNextMove {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin-top: 3px;
          padding: 3px 5px;
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 22%,
            rgba(255,255,255,.06)
          );
          border-radius: 999px;
          color: color-mix(
            in srgb,
            var(--accent) 78%,
            white
          );
          background: color-mix(
            in srgb,
            var(--accent) 7%,
            transparent
          );
          font-size: .22rem;
          font-weight: 950;
          letter-spacing: .03em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationAudienceNextMove > span {
          font-size: .34rem;
          line-height: 1;
        }

        .stationAudienceNextMove.leading {
          border-color: rgba(255,215,88,.18);
          color: #ffd758;
          background: rgba(255,215,88,.035);
        }

        .stationAudiencePodiumGoal {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin-top: 3px;
          padding: 3px 5px;
          border: 1px solid rgba(222,145,86,.16);
          border-radius: 999px;
          color: rgba(222,145,86,.78);
          background: rgba(222,145,86,.035);
          font-size: .21rem;
          font-weight: 950;
          letter-spacing: .03em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationAudiencePodiumGoal > span {
          color: #de9156;
          font-size: .31rem;
          line-height: 1;
        }

        .stationAudiencePodiumGoal.achieved {
          border-color: rgba(123,245,190,.16);
          color: #7bf5be;
          background: rgba(123,245,190,.035);
        }

        .stationAudiencePodiumGoal.achieved > span {
          color: #7bf5be;
        }

        .stationAudienceTop3Progress {
          width: 100%;
          display: grid;
          gap: 4px;
          margin-top: 3px;
        }

        .stationAudienceTop3ProgressLabel {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .stationAudienceTop3ProgressLabel small {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.24);
          font-size: .18rem;
          font-weight: 950;
          letter-spacing: .04em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationAudienceTop3ProgressLabel b {
          color: rgba(222,145,86,.82);
          font-size: .22rem;
          font-weight: 950;
          white-space: nowrap;
        }

        .stationAudienceTop3ProgressTrack {
          width: 100%;
          height: 5px;
          display: block;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.06);
        }

        .stationAudienceTop3ProgressTrack > i {
          height: 100%;
          display: block;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #8fb7ff,
              #de9156
            );
          box-shadow: 0 0 9px rgba(222,145,86,.16);
          transition: width .28s ease;
        }

        .stationAudienceTop3Progress.achieved
          .stationAudienceTop3ProgressLabel b {
          color: #7bf5be;
        }

        .stationAudienceTop3Progress.achieved
          .stationAudienceTop3ProgressTrack > i {
          background: #7bf5be;
          box-shadow: 0 0 9px rgba(123,245,190,.18);
        }

        .stationAudiencePodiumTargetGroup {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 4px;
          margin-top: 4px;
        }

        .stationAudiencePodiumTargetNow {
          grid-column: 1 / -1;
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 5px;
          padding: 5px 6px;
          border: 1px solid rgba(255,203,92,.11);
          border-radius: 9px;
          background: rgba(255,203,92,.02);
        }

        .stationAudiencePodiumTargetNow > span:first-child {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,203,92,.13);
          border-radius: 7px;
          color: #ffcb5c;
          background: rgba(255,203,92,.03);
          font-size: .36rem;
          line-height: 1;
        }

        .stationAudiencePodiumTargetNow > span:last-child {
          min-width: 0;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 1px 5px;
        }

        .stationAudiencePodiumTargetNow small {
          grid-row: 1 / span 2;
          color: rgba(255,203,92,.44);
          font-size: .17rem;
          font-weight: 950;
          letter-spacing: .045em;
          white-space: nowrap;
        }

        .stationAudiencePodiumTargetNow strong,
        .stationAudiencePodiumTargetNow em {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationAudiencePodiumTargetNow strong {
          color: rgba(255,255,255,.52);
          font-size: .20rem;
          font-weight: 950;
        }

        .stationAudiencePodiumTargetNow em {
          color: rgba(255,255,255,.25);
          font-size: .18rem;
          font-style: normal;
          font-weight: 800;
        }

        .stationAudiencePodiumTarget {
          width: 100%;
          min-height: 32px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 5px;
          margin-top: 0;
          padding: 4px 5px;
          border: 1px solid rgba(222,145,86,.14);
          border-radius: 9px;
          color: rgba(255,255,255,.50);
          background: rgba(222,145,86,.025);
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationAudiencePodiumTarget > span:first-child {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(222,145,86,.14);
          border-radius: 7px;
          color: #de9156;
          background: rgba(222,145,86,.03);
          font-size: .34rem;
          line-height: 1;
        }

        .stationAudiencePodiumTarget > span:nth-child(2) {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationAudiencePodiumTarget small,
        .stationAudiencePodiumTarget strong {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationAudiencePodiumTarget small {
          color: rgba(255,255,255,.23);
          font-size: .17rem;
          font-weight: 950;
          letter-spacing: .045em;
        }

        .stationAudiencePodiumTarget strong {
          color: rgba(222,145,86,.78);
          font-size: .20rem;
          font-weight: 950;
        }

        .stationAudiencePodiumTarget > b {
          color: #de9156;
          font-size: .18rem;
          font-weight: 950;
          letter-spacing: .025em;
          white-space: nowrap;
        }

        .stationAudiencePodiumTarget:hover {
          color: #07101a;
          border-color: #de9156;
          background: #de9156;
          transform: translateY(-1px);
        }

        .stationAudiencePodiumTarget:hover
          > span:first-child,
        .stationAudiencePodiumTarget:hover small,
        .stationAudiencePodiumTarget:hover strong,
        .stationAudiencePodiumTarget:hover > b {
          color: #07101a;
        }

        .stationAudiencePodiumTargetView {
          min-width: 54px;
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 0 6px;
          border: 1px solid rgba(143,183,255,.13);
          border-radius: 9px;
          color: rgba(143,183,255,.76);
          background: rgba(143,183,255,.025);
          cursor: pointer;
          font-family: inherit;
          font-size: .18rem;
          font-weight: 950;
          letter-spacing: .025em;
          white-space: nowrap;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationAudiencePodiumTargetView > span {
          color: #8fb7ff;
          font-size: .34rem;
          line-height: 1;
        }

        .stationAudiencePodiumTargetView:hover {
          color: #07101a;
          border-color: #8fb7ff;
          background: #8fb7ff;
          transform: translateY(-1px);
        }

        .stationAudiencePodiumTargetView:hover > span {
          color: #07101a;
        }

        .stationAudienceShare {
          width: 100%;
          display: grid;
          gap: 3px;
          margin-top: 3px;
        }

        .stationAudienceShare > b {
          color: rgba(255,255,255,.58);
          font-size: .3rem;
          font-weight: 950;
          letter-spacing: .04em;
          line-height: 1;
          text-align: center;
        }

        .stationAudienceShare > i {
          width: 100%;
          height: 4px;
          display: block;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
        }

        .stationAudienceShare > i > em {
          height: 100%;
          display: block;
          border-radius: inherit;
          background: var(--accent);
          box-shadow: 0 0 8px color-mix(
            in srgb,
            var(--accent) 34%,
            transparent
          );
          transition: width .28s ease;
        }

        .stationAudienceGap {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.30);
          font-size: .24rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          text-align: center;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationAudienceRank.top1 .stationAudienceGap {
          color: rgba(255,215,88,.70);
        }

        .stationAudienceGap.tied {
          color: #7bf5be;
        }

        .stationAudienceRank.top2 .stationAudienceGap {
          color: rgba(214,224,235,.54);
        }

        .stationAudienceRank.top3 .stationAudienceGap {
          color: rgba(222,145,86,.56);
        }

        .stationAudienceRank.top1 .stationAudienceShare > i > em {
          background: #ffd758;
          box-shadow: 0 0 8px rgba(255,215,88,.22);
        }

        .stationAudienceRank.top2 .stationAudienceShare > i > em {
          background: #d6e0eb;
          box-shadow: 0 0 8px rgba(214,224,235,.16);
        }

        .stationAudienceRank.top3 .stationAudienceShare > i > em {
          background: #de9156;
          box-shadow: 0 0 8px rgba(222,145,86,.16);
        }

        .stationAudienceRank.top1 {
          border-color: rgba(255,215,88,.35);
          background: rgba(69,52,6,.76);
        }

        .stationAudienceRank.top1 strong {
          color: #ffd758;
        }

        .stationAudienceRank.top2 {
          border-color: rgba(214,224,235,.3);
          background: rgba(43,51,64,.78);
        }

        .stationAudienceRank.top2 strong {
          color: #d6e0eb;
        }

        .stationAudienceRank.top3 {
          border-color: rgba(222,145,86,.3);
          background: rgba(65,37,20,.78);
        }

        .stationAudienceRank.top3 strong {
          color: #de9156;
        }

        .stationAudienceRank.selectedRank {
          min-width: 148px;
          border-color: color-mix(
            in srgb,
            var(--accent) 64%,
            rgba(255,255,255,.18)
          );
          background:
            linear-gradient(
              145deg,
              color-mix(
                in srgb,
                var(--accent) 18%,
                rgba(5,9,24,.90)
              ),
              rgba(5,9,24,.88)
            );
          box-shadow:
            0 0 0 2px color-mix(
              in srgb,
              var(--accent) 13%,
              transparent
            ),
            0 10px 26px rgba(0,0,0,.22),
            0 0 20px color-mix(
              in srgb,
              var(--accent) 16%,
              transparent
            );
        }

        .stationAudienceRank.compactSelectedRank {
          min-width: 108px;
        }

        .stationAudienceRank.compactSelectedRank
          .stationAudienceRankDetailsToggle {
          min-height: 22px;
          font-size: .16rem;
        }

        .stationAudienceRank.selectedRank::before {
          content: "";
          position: absolute;
          top: -4px;
          right: -4px;
          width: 9px;
          height: 9px;
          border: 2px solid rgba(5,9,24,.92);
          border-radius: 999px;
          background: var(--accent);
          box-shadow: 0 0 10px color-mix(
            in srgb,
            var(--accent) 54%,
            transparent
          );
        }

        .stationAudienceRank.selectedRank > small {
          color: var(--accent);
          opacity: .92;
        }

        .stationAudienceRank.selectedRank > strong {
          color: var(--accent);
          text-shadow: 0 0 12px color-mix(
            in srgb,
            var(--accent) 24%,
            transparent
          );
        }

        .stationAudienceRank.selectedRank
          .stationAudienceShare > b {
          color: rgba(255,255,255,.78);
        }

        .stationAudienceRank.selectedRank
          .stationAudienceShare > i {
          background: color-mix(
            in srgb,
            var(--accent) 12%,
            rgba(255,255,255,.07)
          );
        }

        .stationAudienceRank.selectedRank
          .stationAudienceShare > i > em {
          background: var(--accent);
          box-shadow: 0 0 10px color-mix(
            in srgb,
            var(--accent) 40%,
            transparent
          );
        }

        .stationSelectedState {
          width: fit-content;
          max-width: 100%;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin: 0 auto 12px;
          padding: 6px 9px;
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 34%,
            rgba(255,255,255,.08)
          );
          border-radius: 999px;
          color: #fff;
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          font-size: .5rem;
          font-weight: 950;
          letter-spacing: .075em;
        }

        .stationSelectedState > span {
          color: var(--accent);
          font-size: .62rem;
        }

        .stationSelectedState strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationCard.active .stationArtwork {
          filter: drop-shadow(
            0 14px 24px color-mix(in srgb, var(--accent) 16%, transparent)
          );
        }

        .stationArtwork {
          position: relative;
          isolation: isolate;
        }

        .stationArtwork::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 2;
          border-radius: inherit;
          background: linear-gradient(
            180deg,
            rgba(3, 6, 18, .02),
            rgba(3, 6, 18, .58)
          );
          opacity: 0;
          transition: opacity .22s ease;
          pointer-events: none;
        }

        .stationArtworkMomentum {
          position: absolute;
          top: 7px;
          right: 7px;
          z-index: 6;
          min-width: 25px;
          height: 25px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 0 7px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 999px;
          color: rgba(255,255,255,.82);
          background: rgba(5,9,24,.84);
          backdrop-filter: blur(8px);
          box-shadow:
            0 5px 14px rgba(0,0,0,.26),
            inset 0 1px 0 rgba(255,255,255,.06);
          font-size: .56rem;
          font-weight: 1000;
          line-height: 1;
          white-space: nowrap;
          pointer-events: none;
        }

        .stationArtworkMomentumRate {
          font-size: .38rem;
          font-weight: 1000;
          letter-spacing: .01em;
          line-height: 1;
        }

        .stationArtworkMomentum.up {
          color: #7bf5be;
          border-color: rgba(123,245,190,.28);
          background: rgba(10,38,31,.88);
        }

        .stationArtworkMomentum.down {
          color: #ff8e99;
          border-color: rgba(255,142,153,.28);
          background: rgba(45,18,24,.88);
        }

        .stationArtworkMomentum.mediumMove {
          opacity: .82;
          transform: scale(.90);
        }

        .stationArtworkMomentum.strongMove {
          opacity: 1;
          transform: scale(1);
          box-shadow:
            0 5px 16px rgba(0,0,0,.28),
            0 0 12px currentColor,
            inset 0 1px 0 rgba(255,255,255,.08);
        }

        .stationArtworkPlay {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 4;
          min-width: 104px;
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 14px;
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 46%,
            rgba(255,255,255,.12)
          );
          border-radius: 999px;
          color: #fff;
          background: rgba(5, 9, 24, .82);
          backdrop-filter: blur(10px);
          box-shadow:
            0 14px 32px rgba(0,0,0,.34),
            inset 0 1px 0 rgba(255,255,255,.08);
          cursor: pointer;
          opacity: 0;
          transform: translate(-50%, -42%) scale(.92);
          transition:
            opacity .2s ease,
            transform .2s ease,
            background .2s ease;
        }

        .stationArtworkPlay > span {
          color: var(--accent);
          font-size: .86rem;
          line-height: 1;
        }

        .stationArtworkPlay strong {
          font-size: .52rem;
          font-weight: 950;
          letter-spacing: .075em;
        }

        .stationArtwork:hover::after,
        .stationCard.active .stationArtwork::after {
          opacity: 1;
        }

        .stationArtwork:hover .stationArtworkPlay,
        .stationCard.active .stationArtworkPlay {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        .stationArtworkPlay:hover {
          background: color-mix(
            in srgb,
            var(--accent) 16%,
            rgba(5, 9, 24, .9)
          );
        }

        .stationNameRow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: 0;
        }

        .stationNameRow h3 {
          min-width: 0;
          margin: 0;
        }

        .stationQuickActions {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .stationFavorite,
        .stationShare {
          flex: 0 0 auto;
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 50%;
          color: rgba(255,255,255,.44);
          background: rgba(255,255,255,.025);
          cursor: pointer;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationFavorite span,
        .stationShare span {
          font-size: .9rem;
          line-height: 1;
        }

        .stationFavorite:hover {
          color: #ff5b8f;
          border-color: rgba(255,91,143,.28);
          transform: translateY(-1px) scale(1.04);
        }

        .stationFavorite.active {
          color: #ff5b8f;
          border-color: rgba(255,91,143,.34);
          background: rgba(255,91,143,.09);
          box-shadow: 0 7px 18px rgba(255,91,143,.10);
        }

        .stationShare:hover {
          color: #7bf5be;
          border-color: rgba(123,245,190,.28);
          transform: translateY(-1px) scale(1.04);
        }

        .stationShare.active {
          color: #07101a;
          border-color: #7bf5be;
          background: #7bf5be;
          box-shadow: 0 7px 18px rgba(123,245,190,.12);
        }

        .stationNow {
          position: relative;
          overflow: hidden;
          min-height: 86px;
          padding: 12px 13px 12px 16px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 13px;
          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, var(--accent) 4%, transparent),
              rgba(255,255,255,.015)
            );
          transition:
            border-color .2s ease,
            background .2s ease,
            box-shadow .2s ease;
        }

        .stationNow::before {
          content: "";
          position: absolute;
          left: 0;
          top: 12px;
          bottom: 12px;
          width: 3px;
          border-radius: 0 999px 999px 0;
          background: var(--accent);
          opacity: .55;
        }

        .stationNowHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 7px;
        }

        .stationCard .stationNowLabel {
          color: color-mix(in srgb, var(--accent) 78%, #ffffff);
          font-size: .48rem;
          font-weight: 950;
          letter-spacing: .09em;
        }

        .stationNowHeaderActions {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 5px;
        }

        .stationNowArtistSearch,
        .stationNowSongSearch {
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0 8px;
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 18%,
            rgba(255,255,255,.055)
          );
          border-radius: 999px;
          color: rgba(255,255,255,.42);
          background: color-mix(
            in srgb,
            var(--accent) 4%,
            rgba(255,255,255,.012)
          );
          cursor: pointer;
          font-size: .36rem;
          font-weight: 950;
          letter-spacing: .055em;
          white-space: nowrap;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationNowArtistSearch > span,
        .stationNowSongSearch > span {
          color: var(--accent);
          font-size: .58rem;
          line-height: 1;
        }

        .stationNowArtistSearch:hover,
        .stationNowSongSearch:hover {
          color: #fff;
          border-color: color-mix(
            in srgb,
            var(--accent) 34%,
            rgba(255,255,255,.07)
          );
          background: color-mix(
            in srgb,
            var(--accent) 8%,
            rgba(255,255,255,.018)
          );
          transform: translateY(-1px);
        }

        .stationNowSongSearch {
          border-color: rgba(123,245,190,.11);
          background: rgba(123,245,190,.018);
        }

        .stationNowSongSearch > span {
          color: #7bf5be;
        }

        .stationNowSongSearch:hover {
          border-color: rgba(123,245,190,.26);
          background: rgba(123,245,190,.055);
        }

        .stationNow > b {
          display: block;
          overflow: hidden;
          color: #fff;
          font-size: .78rem;
          line-height: 1.25;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationNow > small {
          display: block;
          overflow: hidden;
          margin-top: 4px;
          color: rgba(255,255,255,.5);
          font-size: .62rem;
          line-height: 1.3;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationNowPlaying {
          border-color: color-mix(
            in srgb,
            var(--accent) 28%,
            rgba(255,255,255,.055)
          );
          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, var(--accent) 9%, rgba(255,255,255,.012)),
              rgba(255,255,255,.015)
            );
          box-shadow: inset 0 0 24px color-mix(
            in srgb,
            var(--accent) 5%,
            transparent
          );
        }

        .stationNowPlaying::before {
          opacity: 1;
          box-shadow: 0 0 12px color-mix(
            in srgb,
            var(--accent) 42%,
            transparent
          );
        }

        .stationNowPulse {
          height: 14px;
          display: inline-flex;
          align-items: end;
          gap: 2px;
        }

        .stationNowPulse i {
          width: 2px;
          border-radius: 999px;
          background: var(--accent);
          animation: stationNowBars .72s ease-in-out infinite alternate;
        }

        .stationNowPulse i:nth-child(1) {
          height: 6px;
          animation-delay: -.3s;
        }

        .stationNowPulse i:nth-child(2) {
          height: 13px;
          animation-delay: -.12s;
        }

        .stationNowPulse i:nth-child(3) {
          height: 9px;
          animation-delay: -.22s;
        }

        @keyframes stationNowBars {
          from {
            transform: scaleY(.4);
            opacity: .55;
          }

          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        .stationCardPlay {
          border-color: color-mix(
            in srgb,
            var(--accent) 34%,
            rgba(255,255,255,.1)
          ) !important;
          transition:
            transform .2s ease,
            filter .2s ease,
            background .2s ease !important;
        }

        .stationCard.active .stationCardPlay {
          color: #fff !important;
          background: var(--accent) !important;
          box-shadow: 0 9px 22px color-mix(
            in srgb,
            var(--accent) 18%,
            transparent
          );
        }

        .stationCardPlay:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }

        .stationGenreQuickFilter {
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 0 7px;
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 18%,
            rgba(255,255,255,.045)
          );
          border-radius: 999px;
          color: color-mix(
            in srgb,
            var(--accent) 76%,
            rgba(255,255,255,.64)
          );
          background: color-mix(
            in srgb,
            var(--accent) 5%,
            rgba(255,255,255,.012)
          );
          cursor: pointer;
          font-family: inherit;
          font-size: .38rem;
          font-weight: 950;
          letter-spacing: .055em;
          white-space: nowrap;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationGenreQuickFilter > span {
          color: var(--accent);
          font-size: .48rem;
          line-height: 1;
        }

        .stationGenreQuickFilter:hover {
          color: #fff;
          border-color: color-mix(
            in srgb,
            var(--accent) 36%,
            rgba(255,255,255,.07)
          );
          background: color-mix(
            in srgb,
            var(--accent) 9%,
            rgba(255,255,255,.018)
          );
          transform: translateY(-1px);
        }

        .stationLiveStrip {
          width: 100%;
          min-height: 34px;
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 11px;
          padding: 0 10px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 10px;
          background: rgba(255,255,255,.018);
          color: rgba(255,255,255,.48);
          overflow: hidden;
        }

        .stationLiveGenre {
          min-width: 0;
          max-width: 42%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: color-mix(in srgb, var(--accent) 78%, #ffffff);
          font-size: .49rem;
          font-weight: 950;
          letter-spacing: .07em;
          text-transform: uppercase;
        }

        .stationLiveListeners {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-left: auto;
          white-space: nowrap;
          font-size: .46rem;
          font-weight: 850;
          letter-spacing: .055em;
        }

        .stationLiveListeners > span {
          color: #7bf5be;
          font-size: .48rem;
        }

        .stationLiveStatus {
          flex: 0 0 auto;
          padding-left: 8px;
          border-left: 1px solid rgba(255,255,255,.07);
          color: rgba(255,255,255,.38);
          white-space: nowrap;
          font-size: .44rem;
          font-weight: 900;
          letter-spacing: .06em;
        }

        .stationLiveSignal {
          height: 17px;
          display: inline-flex;
          align-items: end;
          gap: 2px;
          padding-left: 8px;
          border-left: 1px solid rgba(255,255,255,.07);
        }

        .stationLiveSignal i {
          width: 2px;
          min-height: 4px;
          border-radius: 999px;
          background: var(--accent);
          animation: stationLiveBars .75s ease-in-out infinite alternate;
        }

        .stationLiveSignal i:nth-child(1) {
          height: 7px;
          animation-delay: -.42s;
        }

        .stationLiveSignal i:nth-child(2) {
          height: 14px;
          animation-delay: -.18s;
        }

        .stationLiveSignal i:nth-child(3) {
          height: 10px;
          animation-delay: -.32s;
        }

        .stationLiveSignal i:nth-child(4) {
          height: 16px;
          animation-delay: -.08s;
        }

        @keyframes stationLiveBars {
          from {
            transform: scaleY(.42);
            opacity: .58;
          }

          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        .stationCard.active .stationLiveStrip {
          border-color: color-mix(
            in srgb,
            var(--accent) 25%,
            rgba(255,255,255,.06)
          );
          background: color-mix(
            in srgb,
            var(--accent) 6%,
            rgba(255,255,255,.018)
          );
        }

        .stationPageLink {
          width: 100%;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 12px;
          padding: 0 13px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          color: rgba(255,255,255,.72);
          background: rgba(255,255,255,.025);
          text-decoration: none;
          font-size: .55rem;
          font-weight: 950;
          letter-spacing: .075em;
          transition:
            transform .18s ease,
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .stationPageLink span:last-child {
          color: var(--accent);
          font-size: .9rem;
          line-height: 1;
          transition: transform .18s ease;
        }

        .stationPageLink:hover {
          color: #fff;
          border-color: color-mix(
            in srgb,
            var(--accent) 38%,
            rgba(255,255,255,.1)
          );
          background: color-mix(
            in srgb,
            var(--accent) 8%,
            rgba(255,255,255,.02)
          );
          transform: translateY(-1px);
        }

        .stationPageLink:hover span:last-child {
          transform: translateX(3px);
        }

        .stationCard.active .stationPageLink {
          border-color: color-mix(
            in srgb,
            var(--accent) 28%,
            rgba(255,255,255,.08)
          );
        }

        .stationMetricsHeader {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin: 18px 0 0;
        }

        .stationMetricsHeader > span {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          color: rgba(255,255,255,.42);
          font-size: .48rem;
          font-weight: 950;
          letter-spacing: .07em;
          line-height: 1;
        }

        .stationMetricsHeader > span > b {
          font: inherit;
          color: inherit;
        }

        .stationMetricsHeader > span > i {
          color: #8fb7ff;
          font-size: .55rem;
          font-style: normal;
          line-height: 1;
        }

        .stationMetricsNetworkStatus {
          width: fit-content;
          min-height: 18px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 999px;
          font-size: .31rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .045em;
          line-height: 1;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationMetricsNetworkStatus > i {
          font-size: .40rem;
          font-style: normal;
          line-height: 1;
        }

        .stationMetricsNetworkStatus > b {
          color: rgba(255,255,255,.28);
          font-size: .34rem;
          font-style: normal;
          font-weight: 900;
          line-height: 1;
        }

        .stationMetricsNetworkStatus > strong {
          color: currentColor;
          font-size: .31rem;
          font-weight: 950;
          letter-spacing: .02em;
          line-height: 1;
        }

        .stationMetricsUpdatedAt {
          width: fit-content;
          min-height: 18px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 999px;
          color: rgba(255,255,255,.40);
          background: rgba(255,255,255,.012);
          font-size: .29rem;
          font-style: normal;
          font-weight: 900;
          letter-spacing: .035em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationMetricsLivePulse {
          position: relative;
          width: 8px;
          height: 8px;
          flex: 0 0 8px;
          display: inline-grid;
          place-items: center;
        }

        .stationMetricsLivePulse::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: rgba(123,245,190,.22);
          animation: stationMetricsLivePulse 1.8s ease-out infinite;
        }

        .stationMetricsLivePulse > i {
          position: relative;
          z-index: 1;
          width: 4px;
          height: 4px;
          display: block;
          border-radius: 999px;
          background: #7bf5be;
          box-shadow: 0 0 7px rgba(123,245,190,.45);
        }

        .stationMetricsUpdatedAt > b {
          color: #7bf5be;
          font-size: .29rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
        }

        .stationMetricsUpdatedAt > span:not(.stationMetricsLivePulse) {
          color: rgba(255,255,255,.24);
          font-size: .28rem;
          line-height: 1;
        }

        .stationMetricsUpdatedAt > strong {
          color: rgba(255,255,255,.68);
          font-size: .29rem;
          font-weight: 950;
          letter-spacing: .02em;
          line-height: 1;
        }

        .stationMetricsFilterStatus {
          appearance: none;
          min-height: 18px;
          max-width: 100%;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 999px;
          color: rgba(255,255,255,.38);
          background: rgba(255,255,255,.01);
          font: inherit;
          line-height: 1;
          cursor: default;
          transition:
            border-color .18s ease,
            color .18s ease,
            background .18s ease,
            transform .18s ease;
        }

        .stationMetricsFilterStatus > i {
          color: rgba(143,183,255,.62);
          font-size: .35rem;
          font-style: normal;
          line-height: 1;
        }

        .stationMetricsFilterStatus > b {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          color: currentColor;
          font-size: .29rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationMetricsFilterStatus > span {
          color: rgba(255,255,255,.22);
          font-size: .27rem;
          line-height: 1;
        }

        .stationMetricsFilterStatus > strong {
          min-width: 0;
          color: rgba(255,255,255,.66);
          font-size: .28rem;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationMetricsFilterStatus > strong.listenersResult {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: rgba(123,245,190,.78);
        }

        .stationMetricsFilterStatus > strong.listenersResult > i {
          font-size: .30rem;
          font-style: normal;
          line-height: 1;
        }

        .stationMetricsFilterStatus > span.audienceShareResult {
          min-width: 74px;
          max-width: 118px;
          display: inline-grid;
          gap: 2px;
          padding: 3px 5px;
          border: 1px solid rgba(215,166,255,.12);
          border-radius: 7px;
          color: rgba(215,166,255,.82);
          background: rgba(215,166,255,.018);
          overflow: hidden;
        }

        .stationMetricsFilterStatus > span.audienceShareResult > strong {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          color: currentColor;
          font-size: .25rem;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
          white-space: nowrap;
        }

        .audienceShareMiniTrack {
          position: relative;
          width: 100%;
          height: 2px;
          display: block;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.055);
        }

        .audienceShareMiniFill {
          position: absolute;
          inset: 0 auto 0 0;
          display: block;
          max-width: 100%;
          border-radius: inherit;
          background: #d7a6ff;
          box-shadow: 0 0 6px rgba(215,166,255,.28);
          transition: width .32s cubic-bezier(.22,.78,.24,1);
        }

        .stationMetricsFilterStatus > em {
          color: #8fb7ff;
          font-size: .27rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .03em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationMetricsFilterStatus.active {
          border-color: rgba(143,183,255,.18);
          color: #8fb7ff;
          background: rgba(143,183,255,.025);
          cursor: pointer;
        }

        .stationMetricsFilterStatus.active:hover,
        .stationMetricsFilterStatus.active:focus-visible {
          border-color: rgba(143,183,255,.30);
          background: rgba(143,183,255,.06);
          transform: translateY(-1px);
          outline: none;
        }

        @keyframes stationMetricsLivePulse {
          0% {
            opacity: .85;
            transform: scale(.65);
          }

          70%,
          100% {
            opacity: 0;
            transform: scale(2.1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .stationMetricsLivePulse::before {
            animation: none;
            opacity: .45;
            transform: scale(1.35);
          }
        }

        .stationMetricsNetworkStatus.optimal {
          border-color: rgba(123,245,190,.14);
          color: #7bf5be;
          background: rgba(123,245,190,.014);
        }

        .stationMetricsNetworkStatus.partial {
          border-color: rgba(255,203,92,.14);
          color: #ffcb5c;
          background: rgba(255,203,92,.014);
        }

        .stationMetricsNetworkStatus.critical {
          border-color: rgba(255,155,155,.14);
          color: #ff9b9b;
          background: rgba(255,155,155,.014);
        }

        .stationMetricsToggle {
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          border: 1px solid rgba(255,255,255,.065);
          border-radius: 999px;
          color: rgba(255,255,255,.46);
          background: rgba(255,255,255,.012);
          font: inherit;
          font-size: .34rem;
          font-weight: 950;
          letter-spacing: .045em;
          line-height: 1;
          cursor: pointer;
          transition:
            border-color .2s ease,
            color .2s ease,
            background .2s ease,
            transform .2s ease;
        }

        .stationMetricsToggle > i {
          width: 15px;
          height: 15px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          color: #8fb7ff;
          background: rgba(143,183,255,.05);
          font-size: .48rem;
          font-style: normal;
          font-weight: 900;
          line-height: 1;
        }

        .stationMetricsToggle:hover,
        .stationMetricsToggle:focus-visible {
          border-color: rgba(143,183,255,.18);
          color: rgba(255,255,255,.78);
          background: rgba(143,183,255,.02);
          outline: none;
          transform: translateY(-1px);
        }

        .stationMetricsToggle.collapsed {
          border-color: rgba(143,183,255,.11);
          color: rgba(143,183,255,.72);
        }

        .stationMetricsCollapsedSummary {
          min-width: 0;
          width: 100%;
          min-height: 44px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin: 10px 0 0;
          padding: 8px 11px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 13px;
          color: inherit;
          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.022),
              rgba(255,255,255,.009)
            );
          font: inherit;
          cursor: pointer;
          transition:
            border-color .2s ease,
            background .2s ease,
            transform .2s ease;
        }

        .stationMetricsCollapsedSummary:hover,
        .stationMetricsCollapsedSummary:focus-visible {
          border-color: rgba(143,183,255,.16);
          background: rgba(143,183,255,.018);
          outline: none;
          transform: translateY(-1px);
        }

        .stationMetricsCollapsedSummary > span {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding-right: 10px;
          border-right: 1px solid rgba(255,255,255,.045);
        }

        .stationMetricsCollapsedSummary > span > i {
          color: #8fb7ff;
          font-size: .48rem;
          font-style: normal;
          line-height: 1;
        }

        .stationMetricsCollapsedSummary > span > i.live {
          color: #7bf5be;
        }

        .stationMetricsCollapsedSummary > span > i.listeners {
          font-size: .54rem;
        }

        .stationMetricsCollapsedSummary > span.coverage {
          border-right-color: rgba(255,255,255,.035);
        }

        .stationMetricsCollapsedSummary
          > span.collapsedListenersCount.filtered
          > i,
        .stationMetricsCollapsedSummary
          > span.collapsedListenersCount.filtered
          > b {
          color: #7bf5be;
        }

        .stationMetricsCollapsedSummary
          > span.collapsedListenersCount.filtered
          > em {
          color: rgba(123,245,190,.62);
        }

        .stationMetricsCollapsedSummary
          > span.collapsedAudienceShare
          > i,
        .stationMetricsCollapsedSummary
          > span.collapsedAudienceShare
          > b {
          color: #d7a6ff;
        }

        .stationMetricsCollapsedSummary
          > span.collapsedAudienceShare
          > em {
          color: rgba(215,166,255,.66);
        }

        .collapsedAudienceShareTrack {
          position: relative;
          width: 46px;
          height: 2px;
          display: block;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.055);
        }

        .collapsedAudienceShareFill {
          position: absolute;
          inset: 0 auto 0 0;
          display: block;
          max-width: 100%;
          border-radius: inherit;
          background: #d7a6ff;
          box-shadow: 0 0 6px rgba(215,166,255,.26);
          transition: width .32s cubic-bezier(.22,.78,.24,1);
        }

        .stationMetricsCollapsedSummary > span.coverage.optimal > i,
        .stationMetricsCollapsedSummary > span.coverage.optimal > b,
        .stationMetricsCollapsedSummary > span.coverage.optimal > em {
          color: #7bf5be;
        }

        .stationMetricsCollapsedSummary > span.coverage.partial > i,
        .stationMetricsCollapsedSummary > span.coverage.partial > b,
        .stationMetricsCollapsedSummary > span.coverage.partial > em {
          color: #ffcb5c;
        }

        .stationMetricsCollapsedSummary > span.coverage.critical > i,
        .stationMetricsCollapsedSummary > span.coverage.critical > b,
        .stationMetricsCollapsedSummary > span.coverage.critical > em {
          color: #ff9b9b;
        }

        .stationMetricsCollapsedSummary > span.coverage > em {
          opacity: .72;
        }

        .stationMetricsCollapsedSummary > span > b {
          color: rgba(255,255,255,.78);
          font-size: .54rem;
          font-weight: 950;
          line-height: 1;
        }

        .stationMetricsCollapsedSummary
          > span.collapsedStationsCount.filtered
          > b {
          display: inline-flex;
          align-items: baseline;
          gap: 2px;
        }

        .stationMetricsCollapsedSummary
          > span.collapsedStationsCount.filtered
          > b
          > small {
          color: rgba(255,255,255,.28);
          font-size: .62em;
          font-weight: 900;
          line-height: 1;
        }

        .stationMetricsCollapsedSummary
          > span.collapsedStationsCount.filtered
          > b
          > strong {
          color: rgba(255,255,255,.50);
          font-size: .66em;
          font-weight: 950;
          line-height: 1;
        }

        .collapsedVisibleTrack {
          position: relative;
          width: 46px;
          height: 2px;
          display: block;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.055);
        }

        .collapsedVisibleFill {
          position: absolute;
          inset: 0 auto 0 0;
          display: block;
          max-width: 100%;
          border-radius: inherit;
          background: #8fb7ff;
          box-shadow: 0 0 6px rgba(143,183,255,.24);
          transition: width .32s cubic-bezier(.22,.78,.24,1);
        }

        .stationMetricsCollapsedSummary > span > em {
          color: rgba(255,255,255,.30);
          font-size: .32rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .045em;
          line-height: 1;
        }

        .stationMetricsCollapsedSummary > small {
          flex: 0 0 auto;
          margin-left: auto;
          color: #8fb7ff;
          font-size: .31rem;
          font-weight: 950;
          letter-spacing: .05em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationNetworkMetrics {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(155px, 1fr)
          );
          gap: 10px;
          margin: 10px 0 0;
        }

        .stationNetworkMetrics.collapsed {
          display: none;
        }

        .stationMetric {
          min-width: 0;
          min-height: 58px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 13px;
          border: 1px solid rgba(255,255,255,.065);
          border-radius: 14px;
          color: inherit;
          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.025),
              rgba(255,255,255,.012)
            );
          box-shadow: inset 0 1px 0 rgba(255,255,255,.025);
        }

        .stationMetricAction {
          width: 100%;
          font: inherit;
          text-align: left;
          cursor: pointer;
          transition:
            border-color .2s ease,
            background .2s ease,
            box-shadow .2s ease,
            transform .2s ease;
        }

        .stationMetricAction:hover,
        .stationMetricAction:focus-visible {
          border-color: rgba(143,183,255,.16);
          background:
            linear-gradient(
              135deg,
              rgba(143,183,255,.035),
              rgba(255,255,255,.012)
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.035),
            0 10px 24px rgba(0,0,0,.12);
          outline: none;
          transform: translateY(-1px);
        }

        .stationMetricAction.active {
          border-color: rgba(143,183,255,.24);
          background:
            linear-gradient(
              135deg,
              rgba(143,183,255,.055),
              rgba(255,255,255,.014)
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.04),
            0 0 0 1px rgba(143,183,255,.025);
        }

        .stationMetricAction.favoritesAction.active {
          border-color: rgba(255,112,162,.24);
          background:
            linear-gradient(
              135deg,
              rgba(255,112,162,.055),
              rgba(255,255,255,.014)
            );
        }

        .stationMetricAction.liveAction.active {
          border-color: rgba(123,245,190,.24);
          background:
            linear-gradient(
              135deg,
              rgba(123,245,190,.055),
              rgba(255,255,255,.014)
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.04),
            0 0 0 1px rgba(123,245,190,.025);
        }

        .stationMetricAction.audienceAction.active {
          border-color: rgba(143,183,255,.24);
          background:
            linear-gradient(
              135deg,
              rgba(143,183,255,.055),
              rgba(255,255,255,.014)
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.04),
            0 0 0 1px rgba(143,183,255,.025);
        }

        .stationMetricAction.allStationsAction.active {
          border-color: rgba(255,255,255,.13);
          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.045),
              rgba(255,255,255,.014)
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.04),
            0 0 0 1px rgba(255,255,255,.02);
        }

        .stationMetricAction.allStationsAction:hover,
        .stationMetricAction.allStationsAction:focus-visible {
          border-color: rgba(255,255,255,.16);
          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.045),
              rgba(143,183,255,.012)
            );
        }

        .stationMetricAction.genresAction.active {
          border-color: rgba(215,166,255,.26);
          background:
            linear-gradient(
              135deg,
              rgba(215,166,255,.07),
              rgba(255,255,255,.014)
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.04),
            0 0 0 1px rgba(215,166,255,.025);
        }

        .stationMetricAction.genresAction:hover,
        .stationMetricAction.genresAction:focus-visible {
          border-color: rgba(215,166,255,.20);
          background:
            linear-gradient(
              135deg,
              rgba(215,166,255,.04),
              rgba(255,255,255,.012)
            );
        }

        .stationMetricAction.genresAction.active:hover,
        .stationMetricAction.genresAction.active:focus-visible {
          border-color: rgba(215,166,255,.34);
          background:
            linear-gradient(
              135deg,
              rgba(215,166,255,.09),
              rgba(255,255,255,.016)
            );
        }

        .stationMetricAction.audienceAction:hover,
        .stationMetricAction.audienceAction:focus-visible {
          border-color: rgba(143,183,255,.20);
          background:
            linear-gradient(
              135deg,
              rgba(143,183,255,.04),
              rgba(255,255,255,.012)
            );
        }

        .stationMetricAction.liveAction:hover,
        .stationMetricAction.liveAction:focus-visible {
          border-color: rgba(123,245,190,.20);
          background:
            linear-gradient(
              135deg,
              rgba(123,245,190,.04),
              rgba(255,255,255,.012)
            );
        }

        .stationMetricAction > div > em {
          margin-top: 3px;
          color: rgba(143,183,255,.52);
          font-size: .30rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .045em;
          line-height: 1;
        }

        .stationMetricAction.favoritesAction > div > em {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          color: rgba(255,112,162,.58);
          white-space: nowrap;
        }

        .stationMetricAction.favoritesAction.active > div > em {
          color: #ff70a2;
        }

        .stationMetricAction.recentAction > div > em {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          color: rgba(143,183,255,.58);
          white-space: nowrap;
        }

        .stationMetricAction.recentAction.active > div > em {
          color: #8fb7ff;
        }

        .stationMetricAction.liveAction > div > em {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          color: rgba(123,245,190,.60);
          white-space: nowrap;
        }

        .stationMetricAction.liveAction.active > div > em {
          color: #7bf5be;
        }

        .stationMetricAction.audienceAction > div > em {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          color: rgba(143,183,255,.64);
          white-space: nowrap;
        }

        .stationMetricAction.audienceAction:hover > div > em,
        .stationMetricAction.audienceAction:focus-visible > div > em {
          color: #8fb7ff;
        }

        .stationMetricAction.audienceAction.active > div > em {
          color: #8fb7ff;
        }

        .stationMetricAction.allStationsAction > div > em {
          color: rgba(255,255,255,.46);
        }

        .stationMetricAction.allStationsAction.active > div > em {
          color: #ffffff;
        }

        .stationMetricAction.genresAction > div > em {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          color: rgba(215,166,255,.66);
          white-space: nowrap;
        }

        .stationMetricAction.genresAction.active > div > em {
          color: #d7a6ff;
        }

        .stationMetricIcon {
          flex: 0 0 auto;
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 10px;
          color: #ff5b8f;
          background: rgba(255,91,143,.07);
          font-size: .75rem;
        }

        .stationMetricIcon.live {
          color: #7bf5be;
          background: rgba(123,245,190,.065);
          animation: networkLivePulse 1.6s ease-in-out infinite;
        }

        .stationMetricIcon.listeners {
          color: #8fb7ff;
          background: rgba(143,183,255,.065);
          font-size: .7rem;
        }

        .stationMetricIcon.genres {
          color: #d7a6ff;
          background: rgba(215,166,255,.065);
          font-size: .78rem;
        }

        .stationMetricIcon.favorites {
          color: #ff70a2;
          background: rgba(255,112,162,.065);
          font-size: .72rem;
        }

        .stationMetricIcon.online {
          color: #7bf5be;
          background: rgba(123,245,190,.065);
          font-size: .58rem;
          animation: stationMetricOnlinePulse 1.8s ease-in-out infinite;
        }

        .stationMetricIcon.recent {
          color: #8fb7ff;
          background: rgba(143,183,255,.065);
          font-size: .72rem;
        }

        @keyframes stationMetricOnlinePulse {
          0%,
          100% {
            opacity: .5;
            transform: scale(.88);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .stationMetric > div {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .stationMetricCoverageHeading {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stationMetricCoverageStatus {
          width: fit-content;
          min-height: 17px;
          display: inline-flex;
          align-items: center;
          padding: 2px 5px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 999px;
          font-size: .30rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .04em;
          line-height: 1;
          white-space: nowrap;
        }

        .stationMetricCoverageStatus.optimal {
          border-color: rgba(123,245,190,.13);
          color: #7bf5be;
          background: rgba(123,245,190,.012);
        }

        .stationMetricCoverageStatus.partial {
          border-color: rgba(255,203,92,.13);
          color: #ffcb5c;
          background: rgba(255,203,92,.012);
        }

        .stationMetricCoverageStatus.critical {
          border-color: rgba(255,155,155,.13);
          color: #ff9b9b;
          background: rgba(255,155,155,.012);
        }

        .stationMetricCoverageTrack {
          position: relative;
          width: 100%;
          height: 3px;
          overflow: hidden;
          margin-top: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,.055);
        }

        .stationMetricCoverageFill {
          position: absolute;
          inset: 0 auto 0 0;
          max-width: 100%;
          border-radius: inherit;
          transition:
            width .42s cubic-bezier(.22,.78,.24,1),
            background .24s ease,
            box-shadow .24s ease;
        }

        .stationMetricCoverageFill.optimal {
          background: #7bf5be;
          box-shadow: 0 0 9px rgba(123,245,190,.24);
        }

        .stationMetricCoverageFill.partial {
          background: #ffcb5c;
          box-shadow: 0 0 9px rgba(255,203,92,.22);
        }

        .stationMetricCoverageFill.critical {
          background: #ff9b9b;
          box-shadow: 0 0 9px rgba(255,155,155,.22);
        }

        .stationMetricCoverageDetail {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 5px;
          margin-top: 4px;
          overflow: hidden;
        }

        .stationMetricCoverageDetail > b,
        .stationMetricCoverageDetail > em {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationMetricCoverageDetail > b {
          flex: 1 1 auto;
          color: rgba(255,255,255,.48);
          font-size: .29rem;
          font-weight: 950;
          letter-spacing: .03em;
          line-height: 1;
        }

        .stationMetricCoverageDetail > em {
          flex: 0 1 auto;
          color: #ff9b9b;
          font-size: .27rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
        }

        .stationMetricCoverageDetail > em.allOnline {
          color: #7bf5be;
        }

        .operationalCoverageMetric {
          border-color: rgba(123,245,190,.085);
        }

        .stationMetric strong {
          color: #fff;
          font-size: 1rem;
          line-height: 1;
          letter-spacing: -.02em;
        }

        .stationMetricPrimaryCount {
          display: inline-flex;
          align-items: baseline;
          gap: 2px;
        }

        .stationMetricPrimaryCount.filtered > span {
          color: rgba(255,255,255,.28);
          font-size: .60em;
          font-weight: 900;
        }

        .stationMetricPrimaryCount.filtered > small {
          color: rgba(255,255,255,.46);
          font-size: .58em;
          font-weight: 950;
          letter-spacing: -.015em;
          line-height: 1;
        }

        .stationMetricVisibleTrack {
          position: relative;
          width: 100%;
          height: 3px;
          display: block;
          margin-top: 4px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.055);
        }

        .stationMetricVisibleFill {
          position: absolute;
          inset: 0 auto 0 0;
          display: block;
          max-width: 100%;
          border-radius: inherit;
          background: #8fb7ff;
          box-shadow: 0 0 7px rgba(143,183,255,.26);
          transition: width .32s cubic-bezier(.22,.78,.24,1);
        }

        .stationMetric small {
          overflow: hidden;
          color: rgba(255,255,255,.38);
          font-size: .43rem;
          font-weight: 950;
          letter-spacing: .075em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @keyframes networkLivePulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(123,245,190,.05);
          }

          50% {
            box-shadow: 0 0 0 6px rgba(123,245,190,.02);
          }
        }

        .networkNowStrip {
          margin: 14px 0 0;
          padding: 12px 0 2px;
          border-top: 1px solid rgba(255,255,255,.045);
        }

        .networkNowStripHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 9px;
        }

        .networkNowStripHeader > span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: rgba(255,255,255,.72);
          font-size: .52rem;
          font-weight: 950;
          letter-spacing: .095em;
        }

        .networkNowStripHeader > span i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #7bf5be;
          box-shadow: 0 0 12px rgba(123,245,190,.48);
          animation: networkTickerPulse 1.55s ease-in-out infinite;
        }

        .networkNowStripMeta {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .networkNowStripHeader small {
          color: rgba(255,255,255,.27);
          font-size: .4rem;
          font-weight: 850;
          letter-spacing: .08em;
        }

        .networkNowStripMeta b {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: rgba(123,245,190,.52);
          font-size: .38rem;
          font-weight: 950;
          letter-spacing: .07em;
          white-space: nowrap;
        }

        .networkNowStripMeta b > span {
          color: #7bf5be;
          font-size: .58rem;
          line-height: 1;
        }

        .networkNowActiveStationBadge {
          min-width: 0;
          min-height: 25px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 7px;
          border: 1px solid color-mix(
            in srgb,
            var(--accent) 18%,
            rgba(255,255,255,.055)
          );
          border-radius: 999px;
          background: color-mix(
            in srgb,
            var(--accent) 3%,
            transparent
          );
          box-shadow: 0 0 12px color-mix(
            in srgb,
            var(--accent) 4%,
            transparent
          );
          white-space: nowrap;
        }

        .networkNowActiveStationBadge > i {
          color: color-mix(
            in srgb,
            var(--accent) 78%,
            white
          );
          font-size: .38rem;
          font-style: normal;
          line-height: 1;
        }

        .networkNowActiveStationBadge > strong {
          max-width: 92px;
          overflow: hidden;
          color: rgba(255,255,255,.72);
          font-size: .37rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .networkNowActiveStationBadge > em {
          color: color-mix(
            in srgb,
            var(--accent) 80%,
            white
          );
          font-size: .44rem;
          font-style: normal;
          font-weight: 950;
          line-height: 1;
        }

        .networkNowActiveStationBadge > small {
          color: rgba(255,255,255,.30);
          font-size: .31rem;
          font-weight: 950;
          letter-spacing: .045em;
          line-height: 1;
        }

        .networkNowTotalAudience {
          min-height: 25px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 7px;
          border: 1px solid rgba(123,245,190,.11);
          border-radius: 999px;
          color: #7bf5be;
          background: rgba(123,245,190,.012);
          box-shadow: 0 0 12px rgba(123,245,190,.025);
          white-space: nowrap;
        }

        .networkNowTotalAudience > i {
          color: #7bf5be;
          font-size: .38rem;
          font-style: normal;
          line-height: 1;
          animation: networkNowTotalAudiencePulse 1.8s ease-in-out infinite;
        }

        .networkNowTotalAudience > span {
          display: inline-flex;
          align-items: baseline;
          gap: 3px;
        }

        .networkNowTotalAudience small {
          color: rgba(123,245,190,.48);
          font-size: .31rem;
          font-weight: 950;
          letter-spacing: .055em;
          line-height: 1;
        }

        .networkNowTotalAudience b {
          color: #7bf5be;
          font-size: .49rem;
          font-weight: 950;
          line-height: 1;
        }

        .networkNowTotalAudience em {
          color: rgba(255,255,255,.32);
          font-size: .31rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .04em;
          line-height: 1;
        }

        @keyframes networkNowTotalAudiencePulse {
          0%,
          100% {
            opacity: .42;
            transform: scale(.82);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .networkNowSummaryToggle {
          min-height: 25px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 7px;
          border: 1px solid rgba(255,255,255,.065);
          border-radius: 999px;
          color: rgba(255,255,255,.50);
          background: rgba(255,255,255,.014);
          font: inherit;
          font-size: .31rem;
          font-weight: 950;
          letter-spacing: .04em;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
          transition:
            border-color .2s ease,
            color .2s ease,
            background .2s ease,
            transform .2s ease;
        }

        .networkNowSummaryToggle > span {
          width: 14px;
          height: 14px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          color: #8fb7ff;
          background: rgba(143,183,255,.05);
          font-size: .48rem;
          font-weight: 900;
          line-height: 1;
        }

        .networkNowSummaryToggle:hover,
        .networkNowSummaryToggle:focus-visible {
          border-color: rgba(143,183,255,.18);
          color: rgba(255,255,255,.78);
          background: rgba(143,183,255,.025);
          outline: none;
          transform: translateY(-1px);
        }

        .networkNowSummaryToggle.collapsed {
          border-color: rgba(143,183,255,.11);
          color: rgba(143,183,255,.72);
        }

        .networkNowSummaryGroup {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .networkNowSummaryGroup.collapsed {
          display: none;
        }

        .networkNowCollapsedDuel {
          min-width: 0;
          min-height: 25px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 7px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 999px;
          color: inherit;
          background: rgba(255,255,255,.012);
          font: inherit;
          white-space: nowrap;
          cursor: pointer;
          transition:
            border-color .2s ease,
            background .2s ease,
            box-shadow .2s ease,
            transform .2s ease;
        }

        .networkNowCollapsedDuel:hover,
        .networkNowCollapsedDuel:focus-visible {
          border-color: rgba(143,183,255,.18);
          background: rgba(143,183,255,.022);
          box-shadow: 0 0 12px rgba(143,183,255,.025);
          outline: none;
          transform: translateY(-1px);
        }

        .networkNowCollapsedDuelStation {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .networkNowCollapsedDuelStation > i {
          color: #ffcb5c;
          font-size: .37rem;
          font-style: normal;
          line-height: 1;
        }

        .networkNowCollapsedDuelStation > b {
          font-size: .37rem;
          font-weight: 950;
          line-height: 1;
        }

        .networkNowCollapsedDuelStation > strong {
          max-width: 82px;
          overflow: hidden;
          font-size: .34rem;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .networkNowCollapsedDuelStation.leader {
          color: #ffcb5c;
        }

        .networkNowCollapsedDuelStation.challenger {
          color: #8fb7ff;
        }

        .networkNowCollapsedDuelChange {
          min-height: 14px;
          display: inline-flex;
          align-items: center;
          padding: 2px 4px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 999px;
          font-size: .28rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .02em;
          line-height: 1;
          white-space: nowrap;
        }

        .networkNowCollapsedDuelChange.positive {
          border-color: rgba(123,245,190,.12);
          color: #7bf5be;
          background: rgba(123,245,190,.01);
        }

        .networkNowCollapsedDuelChange.negative {
          border-color: rgba(255,155,155,.12);
          color: #ff9b9b;
          background: rgba(255,155,155,.01);
        }

        .networkNowCollapsedDuelChange.neutral {
          border-color: rgba(143,183,255,.08);
          color: rgba(143,183,255,.58);
          background: rgba(143,183,255,.008);
        }

        .networkNowCollapsedDuelVs {
          color: rgba(255,255,255,.22);
          font-size: .28rem;
          font-weight: 950;
          letter-spacing: .06em;
          line-height: 1;
        }

        .networkNowCollapsedDuelGap {
          padding-left: 5px;
          border-left: 1px solid rgba(255,255,255,.055);
          color: rgba(255,203,92,.72);
          font-size: .31rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
        }

        .networkNowCollapsedDuelGap.tied {
          color: rgba(143,183,255,.72);
        }

        .networkNowCollapsedDuelOpen {
          padding-left: 5px;
          border-left: 1px solid rgba(255,255,255,.05);
          color: rgba(255,255,255,.26);
          font-size: .27rem;
          font-weight: 950;
          letter-spacing: .055em;
          line-height: 1;
          transition: color .2s ease;
        }

        .networkNowCollapsedDuel:hover .networkNowCollapsedDuelOpen,
        .networkNowCollapsedDuel:focus-visible .networkNowCollapsedDuelOpen {
          color: #8fb7ff;
        }

        .networkNowCurrentLeader {
          min-width: 0;
          min-height: 25px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 7px;
          border: 1px solid rgba(255,203,92,.15);
          border-radius: 999px;
          color: #ffcb5c;
          background: rgba(255,203,92,.015);
          box-shadow: 0 0 12px rgba(255,203,92,.025);
          white-space: nowrap;
        }

        .networkNowCurrentLeader > i {
          color: #ffcb5c;
          font-size: .42rem;
          font-style: normal;
          line-height: 1;
        }

        .networkNowCurrentLeader > span:not(.networkNowCurrentLeaderShare) {
          min-width: 0;
          display: inline-grid;
          gap: 1px;
        }

        .networkNowCurrentLeader small {
          color: rgba(255,203,92,.48);
          font-size: .28rem;
          font-weight: 950;
          letter-spacing: .055em;
          line-height: 1;
        }

        .networkNowCurrentLeader strong {
          max-width: 90px;
          overflow: hidden;
          color: #ffcb5c;
          font-size: .37rem;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .networkNowCurrentLeader > b {
          font-size: .47rem;
          font-weight: 950;
          line-height: 1;
        }

        .networkNowCurrentLeader > em {
          color: rgba(255,255,255,.30);
          font-size: .29rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
        }

        .networkNowCurrentLeaderShare {
          padding-left: 5px;
          border-left: 1px solid rgba(255,203,92,.10);
          color: rgba(255,203,92,.66);
          font-size: .29rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
        }

        .networkNowCurrentChallenger {
          min-width: 0;
          min-height: 25px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 7px;
          border: 1px solid rgba(143,183,255,.13);
          border-radius: 999px;
          color: #8fb7ff;
          background: rgba(143,183,255,.012);
          box-shadow: 0 0 12px rgba(143,183,255,.02);
          white-space: nowrap;
        }

        .networkNowCurrentChallenger > i {
          min-width: 18px;
          color: #8fb7ff;
          font-size: .34rem;
          font-style: normal;
          font-weight: 950;
          line-height: 1;
        }

        .networkNowCurrentChallenger > span:not(.networkNowCurrentChallengerGap) {
          min-width: 0;
          display: inline-grid;
          gap: 1px;
        }

        .networkNowCurrentChallenger small {
          color: rgba(143,183,255,.48);
          font-size: .28rem;
          font-weight: 950;
          letter-spacing: .055em;
          line-height: 1;
        }

        .networkNowCurrentChallenger strong {
          max-width: 90px;
          overflow: hidden;
          color: #8fb7ff;
          font-size: .37rem;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .networkNowCurrentChallenger > b {
          font-size: .47rem;
          font-weight: 950;
          line-height: 1;
        }

        .networkNowCurrentChallenger > em {
          color: rgba(255,255,255,.30);
          font-size: .29rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
        }

        .networkNowCurrentChallengerGap {
          padding-left: 5px;
          border-left: 1px solid rgba(143,183,255,.10);
          color: rgba(143,183,255,.68);
          font-size: .29rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
        }

        .networkNowAudienceBalance {
          min-height: 25px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 7px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 999px;
          background: rgba(255,255,255,.01);
          white-space: nowrap;
        }

        .networkNowAudienceBalance > small {
          color: rgba(255,255,255,.28);
          font-size: .29rem;
          font-weight: 950;
          letter-spacing: .055em;
          line-height: 1;
        }

        .networkNowAudienceBalanceItem {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding-left: 5px;
          border-left: 1px solid rgba(255,255,255,.045);
          line-height: 1;
        }

        .networkNowAudienceBalanceItem > i {
          font-size: .38rem;
          font-style: normal;
          line-height: 1;
        }

        .networkNowAudienceBalanceItem > b {
          font-size: .43rem;
          font-weight: 950;
          line-height: 1;
        }

        .networkNowAudienceBalanceItem > em {
          font-size: .29rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
        }

        .networkNowAudienceBalanceItem.rising {
          color: #7bf5be;
        }

        .networkNowAudienceBalanceItem.falling {
          color: #ff9b9b;
        }

        .networkNowAudienceBalanceItem.stable {
          color: rgba(143,183,255,.62);
        }

        .networkNowNetAudience {
          min-height: 25px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 7px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 999px;
          background: rgba(255,255,255,.01);
          white-space: nowrap;
        }

        .networkNowNetAudience > small {
          color: rgba(255,255,255,.28);
          font-size: .29rem;
          font-weight: 950;
          letter-spacing: .055em;
          line-height: 1;
        }

        .networkNowNetAudience > i {
          font-size: .42rem;
          font-style: normal;
          line-height: 1;
        }

        .networkNowNetAudience > b {
          font-size: .48rem;
          font-weight: 950;
          line-height: 1;
        }

        .networkNowNetAudience > em {
          font-size: .29rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .04em;
          line-height: 1;
        }

        .networkNowNetAudience.positive {
          border-color: rgba(123,245,190,.12);
          color: #7bf5be;
          background: rgba(123,245,190,.012);
        }

        .networkNowNetAudience.negative {
          border-color: rgba(255,155,155,.12);
          color: #ff9b9b;
          background: rgba(255,155,155,.012);
        }

        .networkNowNetAudience.neutral {
          border-color: rgba(143,183,255,.08);
          color: rgba(143,183,255,.62);
          background: rgba(143,183,255,.008);
        }

        .networkNowUpdatedBadge {
          min-height: 21px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 6px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 999px;
          background: rgba(255,255,255,.012);
          font-size: .35rem;
          font-weight: 950;
          letter-spacing: .05em;
          line-height: 1;
          white-space: nowrap;
        }

        .networkNowUpdatedBadge > i {
          font-size: .43rem;
          font-style: normal;
          line-height: 1;
        }

        .networkNowUpdatedBadge.ready {
          border-color: rgba(123,245,190,.10);
          color: rgba(123,245,190,.62);
          background: rgba(123,245,190,.01);
        }

        .networkNowUpdatedBadge.ready > i {
          color: #7bf5be;
        }

        .networkNowUpdatedBadge.waiting {
          color: rgba(255,255,255,.28);
        }

        .networkNowUpdatedBadge.waiting > i {
          color: rgba(255,255,255,.34);
          animation: networkNowWaitingPulse 1.5s ease-in-out infinite;
        }

        @keyframes networkNowWaitingPulse {
          0%,
          100% {
            opacity: .35;
          }

          50% {
            opacity: .9;
          }
        }

        .networkNowNavigation {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px;
          border: 1px solid rgba(255,255,255,.065);
          border-radius: 10px;
          background: rgba(255,255,255,.018);
        }

        .networkNowNavigation button {
          width: 30px;
          height: 28px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 8px;
          color: rgba(255,255,255,.54);
          background: transparent;
          cursor: pointer;
          transition:
            transform .18s ease,
            color .18s ease,
            background .18s ease;
        }

        .networkNowNavigation button:hover {
          color: #fff;
          background: rgba(123,245,190,.075);
          transform: translateY(-1px);
        }

        .networkNowNavigation button > span {
          color: #7bf5be;
          font-size: 1rem;
          line-height: 1;
          transform: translateY(-1px);
        }

        .networkNowScroller {
          display: flex;
          gap: 8px;
          padding: 1px 0 7px;
          overflow-x: auto;
          overscroll-behavior-inline: contain;
          scroll-behavior: smooth;
          scroll-padding-inline: 1px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          touch-action: pan-x;
        }

        .networkNowScroller::-webkit-scrollbar {
          display: none;
        }

        .networkNowItem {
          --ticker-accent: #7bf5be;
          flex: 0 0 auto;
          width: 230px;
          height: 104px;
          min-height: 104px;
          max-height: 104px;
          box-sizing: border-box;
          overflow: hidden;
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) 28px;
          align-items: center;
          gap: 9px;
          padding: 8px 9px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 13px;
          color: #fff;
          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, var(--ticker-accent) 4%, rgba(255,255,255,.018)),
              rgba(255,255,255,.012)
            );
          cursor: pointer;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          text-align: left;
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease,
            box-shadow .18s ease;
        }

        .networkNowItem:hover {
          transform: translateY(-2px);
          border-color: color-mix(
            in srgb,
            var(--ticker-accent) 30%,
            rgba(255,255,255,.07)
          );
        }

        .networkNowItem.active {
          transform: translateY(-1px);
          border-color: color-mix(
            in srgb,
            var(--ticker-accent) 58%,
            rgba(255,255,255,.08)
          );
          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, var(--ticker-accent) 11%, rgba(255,255,255,.02)),
              rgba(255,255,255,.015)
            );
          box-shadow: 0 9px 24px color-mix(
            in srgb,
            var(--ticker-accent) 10%,
            transparent
          );
        }

        .networkNowLogoWrap {
          position: relative;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }

        .networkNowLogoWrap > img {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          object-fit: cover;
          background: rgba(255,255,255,.025);
          transition:
            transform .22s ease,
            filter .22s ease,
            box-shadow .22s ease;
        }

        .networkNowItem.active .networkNowLogoWrap > img {
          transform: scale(1.03);
          box-shadow: 0 0 12px color-mix(
            in srgb,
            var(--ticker-accent) 16%,
            transparent
          );
        }

        .networkNowLogoEqualizer {
          position: absolute;
          right: -3px;
          bottom: -3px;
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: flex-end;
          justify-content: center;
          gap: 1.5px;
          padding: 3px;
          border: 1px solid color-mix(
            in srgb,
            var(--ticker-accent) 46%,
            rgba(255,255,255,.08)
          );
          border-radius: 999px;
          background: rgba(5,10,18,.92);
          box-shadow:
            0 0 0 2px rgba(5,10,18,.82),
            0 0 10px color-mix(
              in srgb,
              var(--ticker-accent) 18%,
              transparent
            );
          pointer-events: none;
        }

        .networkNowLogoEqualizer > i {
          width: 2px;
          height: 8px;
          display: block;
          border-radius: 999px;
          background: var(--ticker-accent);
          transform-origin: center bottom;
          animation: networkNowLogoEqualizerPulse .7s ease-in-out infinite;
        }

        .networkNowLogoEqualizer > i:nth-child(2) {
          animation-delay: -.18s;
        }

        .networkNowLogoEqualizer > i:nth-child(3) {
          animation-delay: -.36s;
        }

        @keyframes networkNowLogoEqualizerPulse {
          0%,
          100% {
            opacity: .5;
            transform: scaleY(.35);
          }

          50% {
            opacity: 1;
            transform: scaleY(1);
          }
        }

        .networkNowItem mark {
          padding: 0 .1em;
          border-radius: .2em;
          color: #07101a;
          background: var(--ticker-accent);
        }

        .networkNowItemCopy {
          min-width: 0;
          min-height: 0;
          display: grid;
          align-content: center;
          gap: 3px;
          overflow: hidden;
        }

        .networkNowItemTitleRow {
          min-width: 0;
          max-width: 100%;
          display: flex;
          align-items: center;
          gap: 5px;
          overflow: hidden;
        }

        .networkNowItemTitleRow > strong {
          flex: 1 1 72px;
          max-width: 100%;
        }

        .networkNowStatusRow {
          min-width: 0;
          max-width: 100%;
          max-height: 35px;
          display: flex;
          align-items: center;
          align-content: flex-start;
          flex-wrap: wrap;
          gap: 3px;
          overflow: hidden;
        }

        .networkNowStatusRow > span {
          max-width: 100%;
          box-sizing: border-box;
        }

        .networkNowRankBadge {
          flex: 0 0 auto;
          min-width: 22px;
          min-height: 17px;
          display: inline-grid;
          place-items: center;
          padding: 2px 4px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 999px;
          color: rgba(255,255,255,.42);
          background: rgba(255,255,255,.012);
          font-size: .38rem;
          font-weight: 950;
          letter-spacing: .02em;
          line-height: 1;
          white-space: nowrap;
        }

        .networkNowRankBadge.top1 {
          border-color: rgba(255,203,92,.20);
          color: #ffcb5c;
          background: rgba(255,203,92,.025);
          box-shadow: 0 0 9px rgba(255,203,92,.035);
        }

        .networkNowRankBadge.top2 {
          border-color: rgba(196,215,235,.16);
          color: #c4d7eb;
          background: rgba(196,215,235,.018);
        }

        .networkNowRankBadge.top3 {
          border-color: rgba(210,151,104,.16);
          color: #d29768;
          background: rgba(210,151,104,.018);
        }

        .networkNowMovementBadge {
          flex: 0 0 auto;
          min-height: 16px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 2px 4px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 999px;
          font-size: .33rem;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
          white-space: nowrap;

          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;        }

        .networkNowMovementBadge > i {
          font-size: .36rem;
          font-style: normal;
          line-height: 1;
        }

        .networkNowMovementBadge.up {
          border-color: rgba(123,245,190,.13);
          color: #7bf5be;
          background: rgba(123,245,190,.014);
        }

        .networkNowMovementBadge.down {
          border-color: rgba(255,155,155,.13);
          color: #ff9b9b;
          background: rgba(255,155,155,.014);
        }

        .networkNowMovementBadge.steady {
          border-color: rgba(143,183,255,.09);
          color: rgba(143,183,255,.62);
          background: rgba(143,183,255,.009);
        }

        .networkNowItemCopy strong {
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          color: #fff;
          font-size: .56rem;
          font-weight: 950;
          letter-spacing: .045em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .networkNowGenreBadge {
          flex: 0 1 auto;
          max-width: 92px;
          min-height: 16px;
          display: inline-flex;
          align-items: center;
          overflow: hidden;
          padding: 2px 5px;
          border: 1px solid color-mix(
            in srgb,
            var(--ticker-accent) 14%,
            rgba(255,255,255,.045)
          );
          border-radius: 999px;
          color: color-mix(
            in srgb,
            var(--ticker-accent) 64%,
            white
          );
          background: color-mix(
            in srgb,
            var(--ticker-accent) 2%,
            transparent
          );
          font-size: .33rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .networkNowItem.active .networkNowGenreBadge {
          border-color: color-mix(
            in srgb,
            var(--ticker-accent) 26%,
            rgba(255,255,255,.055)
          );
          color: color-mix(
            in srgb,
            var(--ticker-accent) 82%,
            white
          );
          background: color-mix(
            in srgb,
            var(--ticker-accent) 5%,
            transparent
          );
        }

        .networkNowSignalBadge {
          flex: 0 0 auto;
          min-height: 16px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 5px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 999px;
          font-size: .31rem;
          font-weight: 950;
          letter-spacing: .04em;
          line-height: 1;
          white-space: nowrap;

          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;        }

        .networkNowSignalBadge > i {
          font-size: .34rem;
          font-style: normal;
          line-height: 1;
        }

        .networkNowSignalBadge.online {
          border-color: rgba(123,245,190,.12);
          color: #7bf5be;
          background: rgba(123,245,190,.012);
        }

        .networkNowSignalBadge.online > i {
          color: #7bf5be;
          animation: networkNowSignalPulse 1.65s ease-in-out infinite;
        }

        .networkNowSignalBadge.offline {
          border-color: rgba(255,155,155,.10);
          color: rgba(255,155,155,.68);
          background: rgba(255,155,155,.008);
        }

        .networkNowSignalBadge.offline > i {
          color: rgba(255,155,155,.62);
        }

        @keyframes networkNowSignalPulse {
          0%,
          100% {
            opacity: .38;
            transform: scale(.8);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .networkNowPlaybackBadge {
          flex: 0 0 auto;
          min-height: 16px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 5px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 999px;
          font-size: .31rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          white-space: nowrap;

          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;        }

        .networkNowPlaybackBadge > i {
          font-size: .34rem;
          font-style: normal;
          line-height: 1;
        }

        .networkNowPlaybackBadge.playing {
          border-color: color-mix(
            in srgb,
            var(--ticker-accent) 24%,
            rgba(123,245,190,.10)
          );
          color: color-mix(
            in srgb,
            var(--ticker-accent) 70%,
            #7bf5be
          );
          background: color-mix(
            in srgb,
            var(--ticker-accent) 3%,
            rgba(123,245,190,.008)
          );
          box-shadow: 0 0 10px color-mix(
            in srgb,
            var(--ticker-accent) 5%,
            transparent
          );
        }

        .networkNowPlaybackBadge.playing > i {
          animation: networkNowPlaybackPulse 1.45s ease-in-out infinite;
        }

        .networkNowPlaybackBadge.paused {
          border-color: rgba(214,224,235,.08);
          color: rgba(214,224,235,.48);
          background: rgba(214,224,235,.008);
        }

        @keyframes networkNowPlaybackPulse {
          0%,
          100% {
            opacity: .5;
            transform: scale(.88);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .networkNowFavoriteBadge {
          flex: 0 0 auto;
          min-height: 16px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 5px;
          border: 1px solid rgba(255,112,162,.14);
          border-radius: 999px;
          color: rgba(255,112,162,.82);
          background: rgba(255,112,162,.014);
          font-size: .32rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          white-space: nowrap;

          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;        }

        .networkNowFavoriteBadge > i {
          color: #ff70a2;
          font-size: .37rem;
          font-style: normal;
          line-height: 1;
        }

        .networkNowItem.active .networkNowFavoriteBadge {
          border-color: rgba(255,112,162,.24);
          color: #ff8ab4;
          background: rgba(255,112,162,.025);
          box-shadow: 0 0 9px rgba(255,112,162,.035);
        }

        .networkNowRecentBadge {
          flex: 0 0 auto;
          min-height: 16px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 5px;
          border: 1px solid rgba(143,183,255,.11);
          border-radius: 999px;
          color: rgba(143,183,255,.68);
          background: rgba(143,183,255,.009);
          font-size: .32rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          white-space: nowrap;

          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;        }

        .networkNowRecentBadge > i {
          color: #8fb7ff;
          font-size: .39rem;
          font-style: normal;
          line-height: 1;
        }

        .networkNowItem.active .networkNowRecentBadge {
          border-color: color-mix(
            in srgb,
            var(--ticker-accent) 18%,
            rgba(143,183,255,.11)
          );
          color: color-mix(
            in srgb,
            var(--ticker-accent) 54%,
            #8fb7ff
          );
          background: color-mix(
            in srgb,
            var(--ticker-accent) 2.5%,
            rgba(143,183,255,.009)
          );
        }

        .networkNowLeaderBadge {
          flex: 0 0 auto;
          min-height: 16px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 2px 4px;
          border: 1px solid rgba(255,203,92,.18);
          border-radius: 999px;
          color: #ffcb5c;
          background: rgba(255,203,92,.025);
          font-size: .35rem;
          font-weight: 950;
          letter-spacing: .025em;
          line-height: 1;
          white-space: nowrap;
          box-shadow: 0 0 10px rgba(255,203,92,.035);

          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;        }

        .networkNowLeaderBadge > i {
          color: #ffcb5c;
          font-size: .37rem;
          font-style: normal;
          line-height: 1;
        }

        .networkNowItem.audienceLeader {
          border-color: color-mix(
            in srgb,
            #ffcb5c 28%,
            rgba(255,255,255,.07)
          );
        }

        .networkNowItem.audienceLeader:hover {
          border-color: color-mix(
            in srgb,
            #ffcb5c 48%,
            var(--ticker-accent)
          );
        }

        .networkNowItemMeta {
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
        }

        .networkNowTrack {
          min-width: 0;
          display: grid;
          gap: 1px;
        }

        .networkNowItemCopy small {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.48);
          font-size: .5rem;
          font-weight: 850;
          line-height: 1.2;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .networkNowTrack > em {
          min-width: 0;
          overflow: hidden;
          color: color-mix(
            in srgb,
            var(--ticker-accent) 52%,
            rgba(255,255,255,.32)
          );
          font-size: .39rem;
          font-style: normal;
          font-weight: 850;
          letter-spacing: .018em;
          line-height: 1.15;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .networkNowItem.active .networkNowTrack > em {
          color: color-mix(
            in srgb,
            var(--ticker-accent) 72%,
            white
          );
        }

        .networkNowAudienceMeta {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          white-space: nowrap;
        }

        .networkNowItemListeners {
          min-height: 16px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 2px 4px;
          border: 1px solid color-mix(
            in srgb,
            var(--ticker-accent) 13%,
            rgba(255,255,255,.045)
          );
          border-radius: 999px;
          color: color-mix(
            in srgb,
            var(--ticker-accent) 68%,
            white
          );
          background: color-mix(
            in srgb,
            var(--ticker-accent) 2.5%,
            transparent
          );
          line-height: 1;
          white-space: nowrap;
        }

        .networkNowItemListeners > i {
          color: var(--ticker-accent);
          font-size: .34rem;
          font-style: normal;
          line-height: 1;
          animation: networkNowAudiencePulse 1.8s ease-in-out infinite;
        }

        .networkNowItemListeners > b {
          font-size: .44rem;
          font-weight: 950;
          line-height: 1;
        }

        .networkNowItemListeners > em {
          color: rgba(255,255,255,.28);
          font-size: .36rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .04em;
          line-height: 1;
        }

        .networkNowItem.active .networkNowItemListeners {
          border-color: color-mix(
            in srgb,
            var(--ticker-accent) 26%,
            rgba(255,255,255,.055)
          );
          background: color-mix(
            in srgb,
            var(--ticker-accent) 6%,
            transparent
          );
        }

        .networkNowListenerChange {
          min-height: 16px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 2px 4px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 999px;
          font-size: .34rem;
          font-weight: 950;
          line-height: 1;
          white-space: nowrap;
        }

        .networkNowListenerChange > i {
          font-size: .36rem;
          font-style: normal;
          line-height: 1;
        }

        .networkNowListenerChange > b {
          font-size: .41rem;
          font-weight: 950;
          line-height: 1;
        }

        .networkNowListenerChange > em {
          font-size: .31rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
        }

        .networkNowListenerChange.positive {
          border-color: rgba(123,245,190,.13);
          color: #7bf5be;
          background: rgba(123,245,190,.014);
        }

        .networkNowListenerChange.negative {
          border-color: rgba(255,155,155,.13);
          color: #ff9b9b;
          background: rgba(255,155,155,.014);
        }

        .networkNowListenerChange.neutral {
          border-color: rgba(143,183,255,.08);
          color: rgba(143,183,255,.58);
          background: rgba(143,183,255,.008);
        }

        .networkNowAudienceShare {
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }

        .networkNowAudienceShareTrack {
          position: relative;
          height: 3px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.055);
        }

        .networkNowAudienceShareFill {
          position: absolute;
          inset: 0 auto 0 0;
          min-width: 0;
          max-width: 100%;
          border-radius: inherit;
          background: var(--ticker-accent);
          box-shadow: 0 0 8px color-mix(
            in srgb,
            var(--ticker-accent) 32%,
            transparent
          );
          transition: width .48s cubic-bezier(.22,.78,.24,1);
        }

        .networkNowAudienceShareLabel {
          display: inline-flex;
          align-items: baseline;
          gap: 2px;
          white-space: nowrap;
        }

        .networkNowAudienceShareLabel > b {
          color: color-mix(
            in srgb,
            var(--ticker-accent) 72%,
            white
          );
          font-size: .39rem;
          font-weight: 950;
          line-height: 1;
        }

        .networkNowAudienceShareLabel > em {
          color: rgba(255,255,255,.23);
          font-size: .31rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .045em;
          line-height: 1;
        }

        .networkNowItem.audienceLeader .networkNowAudienceShareTrack {
          background: rgba(255,203,92,.07);
        }

        .networkNowItem.audienceLeader .networkNowAudienceShareFill {
          box-shadow:
            0 0 9px color-mix(
              in srgb,
              var(--ticker-accent) 36%,
              transparent
            ),
            0 0 12px rgba(255,203,92,.045);
        }

        .networkNowInsightRow {
          min-width: 0;
          max-width: 100%;
          max-height: 19px;
          display: flex;
          align-items: center;
          flex-wrap: nowrap;
          gap: 3px;
          margin-top: 2px;
          overflow: hidden;
        }

        .networkNowInsightRow > span {
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .networkNowInsightRow > span:first-child {
          flex: 1 1 auto;
        }

        .networkNowInsightRow > span:last-child {
          flex: 0 1 auto;
        }

        .networkNowGapToLeader {
          width: fit-content;
          max-width: 100%;
          min-height: 16px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          margin-top: 0;
          padding: 2px 5px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 999px;
          font-size: .33rem;
          font-weight: 950;
          letter-spacing: .03em;
          line-height: 1;
          white-space: nowrap;
        }

        .networkNowGapToLeader > i {
          font-size: .37rem;
          font-style: normal;
          line-height: 1;
        }

        .networkNowGapToLeader.leader {
          border-color: rgba(255,203,92,.16);
          color: #ffcb5c;
          background: rgba(255,203,92,.018);
        }

        .networkNowGapToLeader.chasing {
          border-color: rgba(143,183,255,.09);
          color: rgba(143,183,255,.68);
          background: rgba(143,183,255,.008);
        }

        .networkNowTrendBadge {
          width: fit-content;
          max-width: 100%;
          min-height: 17px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 0;
          padding: 2px 5px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 999px;
          background: rgba(255,255,255,.008);
          white-space: nowrap;
        }

        .networkNowTrendBadge > small {
          color: rgba(255,255,255,.24);
          font-size: .28rem;
          font-weight: 950;
          letter-spacing: .05em;
          line-height: 1;
        }

        .networkNowTrendBadge > b {
          font-size: .34rem;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
        }

        .networkNowTrendBars {
          height: 9px;
          display: inline-flex;
          align-items: flex-end;
          gap: 1.5px;
        }

        .networkNowTrendBars > i {
          width: 2px;
          display: block;
          border-radius: 999px;
          transform-origin: center bottom;
        }

        .networkNowTrendBars > i:nth-child(1) {
          height: 4px;
        }

        .networkNowTrendBars > i:nth-child(2) {
          height: 6px;
        }

        .networkNowTrendBars > i:nth-child(3) {
          height: 8px;
        }

        .networkNowTrendBadge.rising {
          border-color: rgba(123,245,190,.12);
          color: #7bf5be;
          background: rgba(123,245,190,.01);
        }

        .networkNowTrendBadge.rising .networkNowTrendBars > i {
          background: #7bf5be;
          animation: networkNowTrendRise .78s ease-in-out infinite alternate;
        }

        .networkNowTrendBadge.falling {
          border-color: rgba(255,155,155,.12);
          color: #ff9b9b;
          background: rgba(255,155,155,.01);
        }

        .networkNowTrendBadge.falling .networkNowTrendBars {
          transform: scaleY(-1);
        }

        .networkNowTrendBadge.falling .networkNowTrendBars > i {
          background: #ff9b9b;
          animation: networkNowTrendRise .78s ease-in-out infinite alternate;
        }

        .networkNowTrendBadge.stable {
          border-color: rgba(143,183,255,.08);
          color: rgba(143,183,255,.62);
          background: rgba(143,183,255,.008);
        }

        .networkNowTrendBadge.stable .networkNowTrendBars > i {
          height: 5px;
          background: rgba(143,183,255,.62);
        }

        .networkNowTrendBadge.rising .networkNowTrendBars > i:nth-child(2),
        .networkNowTrendBadge.falling .networkNowTrendBars > i:nth-child(2) {
          animation-delay: -.18s;
        }

        .networkNowTrendBadge.rising .networkNowTrendBars > i:nth-child(3),
        .networkNowTrendBadge.falling .networkNowTrendBars > i:nth-child(3) {
          animation-delay: -.36s;
        }

        @keyframes networkNowTrendRise {
          from {
            opacity: .45;
            transform: scaleY(.55);
          }

          to {
            opacity: 1;
            transform: scaleY(1);
          }
        }

        @keyframes networkNowAudiencePulse {
          0%,
          100% {
            opacity: .42;
            transform: scale(.82);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .networkNowItemAction {
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          border: 1px solid color-mix(
            in srgb,
            var(--ticker-accent) 26%,
            rgba(255,255,255,.07)
          );
          border-radius: 50%;
          color: var(--ticker-accent);
          background: rgba(4,8,22,.42);
          font-size: .58rem;
        }

        .networkNowItemAction.playing {
          color: #07101a;
          border-color: var(--ticker-accent);
          background: var(--ticker-accent);
        }

        @keyframes networkTickerPulse {
          0%,
          100% {
            opacity: .55;
            transform: scale(.82);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .stationNetworkBar {
          --network-accent: #ff2d76;
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.2fr) auto;
          gap: 24px;
          align-items: center;
          margin: 24px 0 24px;
          padding: 16px 18px;
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--network-accent) 28%, rgba(255,255,255,.08));
          border-radius: 24px;
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--network-accent) 11%, transparent), transparent 34%),
            linear-gradient(180deg, rgba(13, 18, 40, .94), rgba(7, 11, 28, .96));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.045),
            0 24px 60px rgba(0,0,0,.22);
          backdrop-filter: blur(20px);
        }

        .stationNetworkBar::before {
          content: "";
          position: absolute;
          z-index: -2;
          inset: -28px;
          background-image:
            linear-gradient(
              90deg,
              rgba(7,11,28,.96) 0%,
              rgba(7,11,28,.84) 47%,
              rgba(7,11,28,.72) 100%
            ),
            var(--network-artwork);
          background-position: center;
          background-size: cover;
          opacity: .42;
          filter: blur(12px) saturate(1.15);
          transform: scale(1.07);
          pointer-events: none;
        }

        .stationNetworkBar::after {
          content: "";
          position: absolute;
          z-index: -1;
          width: 280px;
          height: 280px;
          right: -86px;
          top: -150px;
          border-radius: 50%;
          background: var(--network-accent);
          opacity: .11;
          filter: blur(48px);
          pointer-events: none;
        }

        .stationNetworkBar > * {
          position: relative;
          z-index: 1;
        }

        .stationNetworkIdentity {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .stationNetworkLogoWrap {
          position: relative;
          width: 66px;
          height: 66px;
          flex: 0 0 auto;
        }

        .stationNetworkLogoWrap > img {
          width: 66px;
          height: 66px;
          display: block;
          object-fit: cover;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 18px;
          background: rgba(255,255,255,.04);
          box-shadow: 0 14px 28px rgba(0,0,0,.24);
        }

        .stationNetworkEqualizer {
          position: absolute;
          right: -5px;
          bottom: -5px;
          width: 27px;
          height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          border: 3px solid #080d23;
          border-radius: 50%;
          background: var(--network-accent);
        }

        .stationNetworkEqualizer i {
          width: 2px;
          height: 8px;
          border-radius: 999px;
          background: #fff;
          animation: networkEq .8s ease-in-out infinite alternate;
        }

        .stationNetworkEqualizer i:nth-child(2) {
          height: 12px;
          animation-delay: .18s;
        }

        .stationNetworkEqualizer i:nth-child(3) {
          height: 6px;
          animation-delay: .36s;
        }

        .stationNetworkIdentity > div:last-child {
          min-width: 0;
          display: grid;
          gap: 3px;
        }

        .stationNetworkKicker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,.48);
          font-size: .55rem;
          font-weight: 950;
          letter-spacing: .11em;
        }

        .stationNetworkKicker i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #7bf5be;
          box-shadow: 0 0 14px rgba(123,245,190,.5);
        }

        .stationNetworkIdentity strong {
          overflow: hidden;
          color: #fff;
          font-size: clamp(.92rem, 1.45vw, 1.15rem);
          font-weight: 950;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationNetworkIdentity small {
          overflow: hidden;
          color: rgba(255,255,255,.46);
          font-size: .64rem;
          font-weight: 750;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationNetworkNow {
          min-width: 0;
          display: grid;
          gap: 3px;
          padding: 10px 14px 10px 22px;
          border-left: 1px solid rgba(255,255,255,.09);
          border-radius: 0 14px 14px 0;
          background: rgba(4,8,22,.18);
          backdrop-filter: blur(8px);
        }

        .stationNetworkNow > span {
          color: var(--network-accent);
          font-size: .53rem;
          font-weight: 950;
          letter-spacing: .11em;
        }

        .stationNetworkNow strong,
        .stationNetworkNow small {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stationNetworkNow strong {
          color: #fff;
          font-size: .88rem;
          font-weight: 900;
        }

        .stationNetworkNow small {
          color: rgba(255,255,255,.5);
          font-size: .68rem;
        }

        .stationNetworkActions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .stationNetworkListeners {
          display: grid;
          gap: 2px;
          text-align: right;
        }

        .stationNetworkListeners b {
          color: #fff;
          font-size: 1.05rem;
          font-weight: 950;
        }

        .stationNetworkListeners small {
          color: rgba(255,255,255,.4);
          font-size: .48rem;
          font-weight: 900;
          letter-spacing: .08em;
          white-space: nowrap;
        }

        .stationNetworkSkip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 14px;
          background: rgba(4,8,22,.34);
          backdrop-filter: blur(8px);
        }

        .stationNetworkPosition {
          min-width: 58px;
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 0 8px;
          border-left: 1px solid rgba(255,255,255,.055);
          border-right: 1px solid rgba(255,255,255,.055);
          color: rgba(255,255,255,.34);
          white-space: nowrap;
        }

        .stationNetworkPosition strong {
          color: rgba(255,255,255,.84);
          font-size: .56rem;
          font-weight: 950;
          line-height: 1;
        }

        .stationNetworkPosition span {
          color: rgba(255,255,255,.22);
          font-size: .34rem;
          font-weight: 950;
          letter-spacing: .055em;
        }

        .stationNetworkSkip button {
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 10px;
          border: 0;
          border-radius: 10px;
          color: rgba(255,255,255,.56);
          background: transparent;
          cursor: pointer;
          transition:
            transform .18s ease,
            color .18s ease,
            background .18s ease;
        }

        .stationNetworkSkip button:hover {
          color: #fff;
          background: color-mix(
            in srgb,
            var(--network-accent) 10%,
            rgba(255,255,255,.025)
          );
          transform: translateY(-1px);
        }

        .stationNetworkSkip button > span {
          color: var(--network-accent);
          font-size: .72rem;
          line-height: 1;
        }

        .stationNetworkSkip button strong {
          font-size: .43rem;
          font-weight: 950;
          letter-spacing: .065em;
        }

        .stationNetworkFavorite,
        .stationNetworkShare {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 13px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 14px;
          color: rgba(255,255,255,.68);
          background: rgba(4,8,22,.42);
          backdrop-filter: blur(8px);
          cursor: pointer;
          transition:
            transform .2s ease,
            color .2s ease,
            border-color .2s ease,
            background .2s ease;
        }

        .stationNetworkFavorite:hover,
        .stationNetworkShare:hover {
          color: #fff;
          border-color: color-mix(
            in srgb,
            var(--network-accent) 34%,
            rgba(255,255,255,.10)
          );
          background: color-mix(
            in srgb,
            var(--network-accent) 8%,
            rgba(4,8,22,.46)
          );
          transform: translateY(-2px);
        }

        .stationNetworkFavorite > span {
          color: #ff5b8f;
          font-size: .78rem;
          line-height: 1;
        }

        .stationNetworkFavorite.active {
          color: #fff;
          border-color: rgba(255,91,143,.32);
          background: rgba(255,91,143,.10);
          box-shadow: 0 8px 22px rgba(255,91,143,.10);
        }

        .stationNetworkFavorite.active > span {
          color: #ff5b8f;
        }

        .stationNetworkFavorite strong,
        .stationNetworkShare strong {
          font-size: .5rem;
          font-weight: 950;
          letter-spacing: .07em;
        }

        .stationNetworkFavoriteKey,
        .stationNetworkShareKey {
          min-width: 18px;
          height: 18px;
          display: inline-grid;
          place-items: center;
          margin-left: 1px;
          padding: 0 4px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 5px;
          color: rgba(255,255,255,.40);
          background: rgba(255,255,255,.025);
          font-family: inherit;
          font-size: .34rem;
          font-weight: 950;
          line-height: 1;
        }

        .stationNetworkFavorite.active .stationNetworkFavoriteKey {
          border-color: rgba(255,91,143,.22);
          color: rgba(255,255,255,.72);
          background: rgba(255,91,143,.08);
        }

        .stationNetworkShare.active .stationNetworkShareKey {
          border-color: rgba(7,16,26,.16);
          color: rgba(7,16,26,.68);
          background: rgba(7,16,26,.06);
        }

        .stationNetworkShare.active {
          color: #07101a;
          border-color: #7bf5be;
          background: #7bf5be;
        }

        .stationNetworkShare > span {
          color: var(--network-accent);
          font-size: .72rem;
          line-height: 1;
        }

        .stationNetworkShare.active > span {
          color: #07101a;
        }

        .stationNetworkOpen {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 13px;
          border: 1px solid rgba(143,183,255,.13);
          border-radius: 14px;
          color: rgba(255,255,255,.72);
          background: rgba(143,183,255,.045);
          text-decoration: none;
          backdrop-filter: blur(8px);
          transition:
            transform .2s ease,
            color .2s ease,
            border-color .2s ease,
            background .2s ease;
        }

        .stationNetworkOpen:hover {
          color: #fff;
          border-color: rgba(143,183,255,.30);
          background: rgba(143,183,255,.085);
          transform: translateY(-2px);
        }

        .stationNetworkOpen > span {
          color: #8fb7ff;
          font-size: .72rem;
          line-height: 1;
        }

        .stationNetworkOpen strong {
          font-size: .5rem;
          font-weight: 950;
          letter-spacing: .07em;
        }

        .stationNetworkPlay {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 16px;
          border: 1px solid color-mix(in srgb, var(--network-accent) 45%, rgba(255,255,255,.12));
          border-radius: 14px;
          color: #fff;
          background: var(--network-accent);
          box-shadow: 0 13px 28px color-mix(in srgb, var(--network-accent) 22%, transparent);
          cursor: pointer;
          transition: transform .2s ease, filter .2s ease;
        }

        .stationNetworkPlay:hover {
          transform: translateY(-2px);
          filter: brightness(1.08);
        }

        .stationNetworkPlay > span {
          font-size: .78rem;
        }

        .stationNetworkPlay strong {
          font-size: .62rem;
          font-weight: 950;
          letter-spacing: .07em;
        }

        @keyframes networkEq {
          from { transform: scaleY(.45); }
          to { transform: scaleY(1); }
        }

        @media (max-width: 900px) {
          .stationNetworkBar {
            grid-template-columns: minmax(0, 1fr) auto;
          }

          .stationNetworkNow {
            grid-column: 1 / -1;
            grid-row: 2;
            padding: 14px 12px 10px;
            border-top: 1px solid rgba(255,255,255,.07);
            border-left: 0;
            border-radius: 12px;
          }
        }

        @media (max-width: 600px) {
          .stationSearchSummary {
            align-items: stretch;
            flex-direction: column;
            gap: 8px;
          }

          .stationSearchSummaryCopy {
            gap: 6px;
          }

          .stationSearchSummaryCopy strong {
            max-width: 100%;
          }

          .stationSearchSummaryActions {
            width: 100%;
            align-items: stretch;
            flex-direction: column;
          }

          .stationSearchExpand {
            width: 100%;
          }

          .stationSearchSummaryPager {
            width: 100%;
            justify-content: space-between;
          }

          .stationSearchSummaryPager button {
            flex: 1;
          }

          .stationSearchSummaryClear {
            width: 100%;
          }

          .stationSearchNoResults {
            align-items: stretch;
            flex-direction: column;
            gap: 9px;
          }

          .stationSearchNoResults > button {
            width: 100%;
          }

          .stationSearchSpotlight {
            grid-template-columns: 58px minmax(0, 1fr);
            gap: 10px;
            padding: 10px;
          }

          .stationSearchSpotlightArtwork {
            width: 58px;
            height: 58px;
            border-radius: 11px;
          }

          .stationSearchSpotlightArtwork > span {
            right: 4px;
            bottom: 4px;
            width: 22px;
            height: 22px;
          }

          .stationSearchSpotlightHeading {
            align-items: flex-start;
            flex-direction: column;
            gap: 5px;
          }

          .stationSearchSpotlightLabel {
            align-items: flex-start;
            flex-direction: column;
            gap: 4px;
          }

          .stationSearchSpotlightPager {
            align-self: flex-start;
          }

          .stationSearchSpotlightKeyboard {
            display: none;
          }

          .stationSearchSpotlightCopy > strong {
            font-size: .68rem;
          }

          .stationSearchSpotlightCopy p {
            display: grid;
            gap: 2px;
            white-space: normal;
          }

          .stationSearchSpotlightLiveMeta {
            gap: 4px;
            margin-top: 4px;
          }

          .stationSearchSpotlightLiveMeta > span,
          .stationSearchSpotlightGenreFilter {
            min-height: 22px;
            padding: 0 7px;
          }

          .stationSearchSpotlightCopy p > b,
          .stationSearchSpotlightCopy p > em {
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .stationSearchSpotlightActions {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .stationSearchSpotlightActions > button:first-child {
            grid-column: 1 / -1;
          }

          .stationSearchSpotlightActions > button,
          .stationSearchSpotlightActions > a {
            padding-left: 7px;
            padding-right: 7px;
          }

          .stationSearchSpotlightActions button,
          .stationSearchSpotlightActions a {
            width: 100%;
            min-width: 0;
          }

          .stationFavoritesManager,
          .stationRecentManager {
            align-items: stretch;
            flex-direction: column;
            gap: 9px;
          }

          .stationFavoritesManager > button,
          .stationRecentManager > button {
            width: 100%;
          }

          .stationControlDock {
            top: 66px;
            margin-bottom: 14px;
            padding: 9px 9px 7px;
            border-radius: 14px;
          }

          .stationControlHeader {
            margin-bottom: 6px;
          }

          .stationControlHeader > span {
            font-size: .36rem;
          }

          .stationControlCollapse strong {
            font-size: .37rem;
          }

          .stationControlDock.collapsed {
            padding-bottom: 7px;
          }

          .stationControlCollapsedSummary {
            min-height: 28px;
          }

          .stationActiveShortcut {
            right: 14px;
            bottom: max(94px, calc(env(safe-area-inset-bottom) + 86px));
            min-width: 195px;
            max-width: calc(100vw - 28px);
          }

          .networkNowStripHeader small,
          .networkNowStripMeta b {
            display: none;
          }

          .networkNowNavigation button {
            width: 34px;
            height: 30px;
          }

          .networkNowItem {
            width: 205px;
            height: 102px;
            min-height: 102px;
            max-height: 102px;
            align-items: start;
          }

          .networkNowStatusRow {
            gap: 2px;
          }

          .stationMetricsHeader {
            align-items: flex-start;
          }

          .stationMetricsCollapsedSummary {
            flex-wrap: wrap;
          }

          .stationMetricsCollapsedSummary > small {
            width: 100%;
            margin-left: 0;
            text-align: right;
          }

          .stationNetworkMetrics {
            grid-template-columns: 1fr;
            gap: 7px;
          }

          .stationMetric {
            min-height: 52px;
          }

          .stationsSectionTitle h2 {
            font-size: clamp(1.8rem, 9vw, 2.45rem);
          }

          .stationsSectionTitle p {
            font-size: .78rem;
          }

          .stationTools {
            grid-template-columns: 1fr;
            align-items: stretch;
            gap: 7px;
          }

          .stationSearch {
            width: 100%;
          }

          .stationSearchMeta {
            display: block;
            margin: -2px 2px 1px;
          }

          .stationRecentSearches {
            align-items: flex-start;
            flex-direction: column;
            gap: 6px;
          }

          .stationRecentSearchesChips {
            width: 100%;
          }

          .stationRecentSearchesClear {
            width: 100%;
            margin-left: 0;
          }

          .stationSearchHint {
            display: grid;
            gap: 2px;
            line-height: 1.35;
          }

          .stationSearchEnterHint {
            display: block;
          }

          .stationKeyboardHints {
            display: none;
          }

          .stationFilterSummary {
            grid-template-columns: 1fr;
            align-items: stretch;
            gap: 7px;
          }

          .stationFilterSummaryCount {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .stationFilteredMetrics {
            grid-column: auto;
            grid-row: auto;
            width: 100%;
          }

          .stationFilteredMetrics > button {
            flex: 1 1 120px;
            justify-content: center;
          }

          .stationActiveFilterChips {
            grid-column: auto;
            grid-row: auto;
            width: 100%;
          }

          .stationActiveFilterChips button {
            width: auto;
            max-width: 100%;
          }

          .stationClearAllFilters {
            grid-column: auto;
            grid-row: auto;
            width: 100%;
          }

          .stationToolsRight {
            width: 100%;
            justify-content: space-between;
            margin-left: 0;
          }

          .stationRandomPlay,
          .stationViewToggle,
          .stationOnAirFilter,
          .stationAudienceSort {
            min-height: 34px;
          }

          .stationToolsRight {
            flex-wrap: wrap;
          }

          .stationResultCount {
            align-self: center;
          }

          .stationGenreFilters {
            margin-bottom: 18px;
          }

          .stationGenreFilters button {
            min-height: 32px;
            padding: 0 11px;
            font-size: .52rem;
          }

          .stationNetworkBar {
            grid-template-columns: 1fr;
            gap: 14px;
            padding: 16px;
            border-radius: 20px;
          }

          .stationNetworkNow {
            grid-column: auto;
            grid-row: auto;
          }

          .stationNetworkActions {
            justify-content: space-between;
            padding-top: 2px;
          }

          .stationNetworkListeners {
            text-align: left;
          }

          .stationNetworkSkip {
            width: 100%;
            justify-content: space-between;
          }

          .stationNetworkSkip button {
            flex: 1;
            min-height: 34px;
          }

          .stationNetworkPosition {
            min-width: 54px;
            min-height: 34px;
            padding: 0 6px;
          }

          .stationNetworkFavoriteKey,
          .stationNetworkShareKey {
            display: none;
          }

          .stationNetworkFavorite,
          .stationNetworkShare,
          .stationNetworkOpen {
            min-width: 118px;
          }

          .stationNetworkPlay {
            min-width: 126px;
          }

          .stationAudienceRank {
            top: 12px;
            right: 12px;
            min-width: 86px;
            padding: 5px 7px;
          }

          .stationAudienceRank small {
            display: none;
          }

          .stationAudienceRank.selectedRank > small {
            display: block;
            font-size: .26rem;
          }

          .stationAudienceRank.selectedRank {
            min-width: 104px;
          }

          .stationAudienceRank.compactSelectedRank {
            min-width: 96px;
          }

          .stationAudienceMovement {
            min-height: 18px;
            padding: 2px 4px;
            font-size: .16rem;
          }

          .stationAudienceMovement > em {
            font-size: .14rem;
          }

          .stationAudienceRankDetailsToggle {
            min-height: 22px;
            padding: 0 4px;
            font-size: .16rem;
          }

          .stationAudienceNextMove {
            padding: 3px 4px;
            font-size: .19rem;
          }

          .stationAudiencePodiumGoal {
            padding: 3px 4px;
            font-size: .18rem;
          }

          .stationAudienceTop3ProgressLabel small {
            font-size: .16rem;
          }

          .stationAudienceTop3ProgressLabel b {
            font-size: .20rem;
          }

          .stationAudiencePodiumTargetGroup {
            grid-template-columns: 1fr;
          }

          .stationAudiencePodiumTargetNow > span:last-child {
            grid-template-columns: 1fr;
          }

          .stationAudiencePodiumTargetNow small {
            grid-row: auto;
          }

          .stationAudiencePodiumTarget {
            grid-template-columns: auto minmax(0, 1fr);
            min-height: 30px;
          }

          .stationAudiencePodiumTarget > b {
            grid-column: 1 / -1;
            justify-self: center;
          }

          .stationAudiencePodiumTargetView {
            width: 100%;
            min-height: 28px;
          }

          .stationAudienceShare {
            margin-top: 2px;
          }

          .stationAudienceShare > b {
            font-size: .28rem;
          }

          .stationAudienceGap {
            font-size: .22rem;
          }

          .stationArtworkPlay {
            min-width: 96px;
            min-height: 40px;
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }

          .stationArtwork::after {
            opacity: .72;
          }

          .stationNow {
            min-height: 82px;
            padding: 11px 12px 11px 15px;
          }

          .stationNow > b {
            font-size: .74rem;
          }

          .stationNow > small {
            font-size: .59rem;
          }

          .stationNowArtistSearch,
          .stationNowSongSearch {
            min-height: 23px;
            padding: 0 7px;
            font-size: .32rem;
          }

          .stationGenreQuickFilter {
            min-height: 22px;
            padding: 0 6px;
            font-size: .33rem;
          }

          .stationLiveStrip {
            gap: 7px;
            padding: 0 8px;
          }

          .stationLiveGenre {
            max-width: 36%;
          }

          .stationLiveListeners {
            font-size: .43rem;
          }

          .stationLiveStatus {
            font-size: .4rem;
          }

          .stationPageLink {
            min-height: 42px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .stationMetricCoverageFill {
            transition: none;
          }

          .stationMetricIcon.online {
            animation: none;
          }

          .networkNowTrendBars > i {
            animation: none !important;
          }

          .networkNowLogoEqualizer > i {
            animation: none;
            opacity: .9;
            transform: scaleY(.7);
          }

          .networkNowPlaybackBadge.playing > i {
            animation: none;
          }

          .networkNowSignalBadge.online > i {
            animation: none;
          }

          .networkNowTotalAudience > i {
            animation: none;
          }

          .networkNowUpdatedBadge.waiting > i {
            animation: none;
          }

          .networkNowAudienceShareFill {
            transition: none;
          }

          .networkNowItemListeners > i {
            animation: none;
          }

          .stationRankingLeadershipMarkerLiveBars > i {
            animation: none;
            opacity: .85;
            transform: scaleY(.72);
          }

          .stationRankingLeadershipMarkerActionLabel {
            transition: none;
          }

          .stationRankingLeadershipHeadToHeadBar > i,
          .stationRankingLeadershipHeadToHeadLeaderMarker,
          .stationRankingLeadershipHeadToHeadRivalMarker,
          .stationRankingLeadershipHeadToHeadCollapsedBar > i,
          .stationRankingLeadershipHeadToHeadCollapsedBar > .leaderMarker,
          .stationRankingLeadershipHeadToHeadCollapsedBar > .rivalMarker {
            transition: none;
          }

          .stationRankingLeadershipHeadToHeadCollapsedBar,
          .stationRankingLeadershipHeadToHeadCollapsedBar:hover {
            transition: none;
            transform: none;
          }

          .stationRankingLeadershipHeadToHeadToggle,
          .stationRankingLeadershipHeadToHeadToggle:hover {
            transition: none;
            transform: none;
          }

          .stationRankingLeadershipPlayingMark.playing > i {
            animation: none;
          }

          .stationRankingLeadershipPlayingMark:hover {
            transform: none;
          }

          .stationActiveShortcut {
            animation: none;
          }

          .stationNetworkEqualizer i {
            animation: none;
          }

          .stationLiveSignal i,
          .stationNowPulse i,
          .stationMetricIcon.live,
          .networkNowStripHeader > span i {
            animation: none;
          }

          .stationControlDock,
          .stationControlCollapse,
          .stationFavoritesManager > button,
          .stationRecentManager > button,
          .stationLeadershipDuelToggle,
          .stationAudienceRankDetailsToggle,
          .stationAudiencePodiumTarget,
          .stationAudiencePodiumTargetView,
          .stationFullRankingLeader > button,
          .stationFullRankingChallenger > button,
          .stationFullRankingNextTarget,
          .stationFullRankingNextListen,
          .stationFullRankingCurrent,
          .stationFullRankingShare,
          .stationFullRankingBannerBack,
          .stationSelectionTop3Ranking,
          .stationSelectionTop3Toggle,
          .stationSelectionTop3List button,
          .stationFilteredMetrics > button,
          .stationSearchNoResults > button,
          .stationSearchExpand,
          .stationSearchSummaryPager button,
          .stationSearchSummaryClear,
          .stationRecentSearchChip,
          .stationRecentSearchRepeat,
          .stationRecentSearchRemove,
          .stationRecentSearchesClear,
          .stationSearchSpotlightGenreFilter,
          .stationGenreQuickFilter,
          .stationNowArtistSearch,
          .stationNowSongSearch,
          .stationSearchSpotlightPager button,
          .stationSearchSpotlightActions button,
          .stationSearchSpotlightActions a,
          .networkNowNavigation button,
          .stationNetworkSkip button,
          .stationNetworkFavorite,
          .stationNetworkShare,
          .stationNetworkOpen,
          .stationNetworkPlay,
          .stationActiveShortcut,
          .networkNowItem,
          .stationSearch,
          .stationRandomPlay,
          .stationViewToggle,
          .stationOnAirFilter,
          .stationAudienceSort,
          .stationGenreFilters button,
          .stationActiveFilterChips button,
          .stationClearAllFilters,
          .stationFavorite,
          .stationShare,
          .stationCard,
          .stationCard::after,
          .stationArtwork::after,
          .stationArtworkPlay,
          .stationNow,
          .stationCardPlay,
          .stationPageLink,
          .stationPageLink span:last-child {
            transition: none;
          }

          .stationLeadershipDuelToggle:hover,
          .stationAudienceRankDetailsToggle:hover,
          .stationAudiencePodiumTarget:hover,
          .stationAudiencePodiumTargetView:hover,
          .stationFullRankingLeader > button:hover,
          .stationFullRankingChallenger > button:hover,
          .stationRankingLeadershipRaceToggle:hover,
          .stationRankingLeadershipQuickActionsToggle:hover,
          .stationRankingLeadershipCollapsedHomeListen:hover,
          .stationRankingLeadershipCollapsedHomeFavorite:hover,
          .stationRankingLeadershipCollapsedHomeView:hover,
          .stationRankingLeadershipCollapsedView:hover,
          .stationRankingLeadershipCollapsedListen:hover,
          .stationRankingLeadershipCollapsedFavorite:hover,
          .stationRankingLeadershipCollapsedShare:hover,
          .stationRankingLeadershipCollapsedEnter:hover,
          .stationRankingLeadershipRaceHome:hover,
          .stationRankingLeadershipRaceHomeListen:hover,
          .stationRankingLeadershipRaceTarget:hover,
          .stationRankingLeadershipRaceListen:hover,
          .stationRankingLeadershipCurrent:hover,
          .stationRankingLeadershipPrevious:hover,
          .stationRankingPodiumEnter:hover,
          .stationRankingPodiumExit:hover,
          .stationRankingAudienceGain:hover,
          .stationRankingAudienceLoss:hover,
          .stationRankingTrendToggle:hover,
          .stationRankingTrendCurrent:hover,
          .stationRankingTrendUp:hover,
          .stationRankingTrendDown:hover,
          .stationFullRankingNextTarget:hover,
          .stationFullRankingNextListen:hover,
          .stationFullRankingCurrent:hover,
          .stationFullRankingShare:hover,
          .stationFullRankingBannerBack:hover,
          .stationSelectionTop3Ranking:hover,
          .stationSelectionTop3Toggle:hover,
          .stationSelectionTop3List button:hover,
          .stationFilteredMetrics > button:hover,
          .stationSearchNoResults > button:hover,
          .stationSearchExpand:hover,
          .stationSearchSummaryPager button:hover,
          .stationSearchSummaryClear:hover,
          .stationRecentSearchChip:hover,
          .stationRecentSearchRepeat:hover,
          .stationRecentSearchRemove:hover,
          .stationRecentSearchesClear:hover,
          .stationSearchSpotlightGenreFilter:hover,
          .stationGenreQuickFilter:hover,
          .stationNowArtistSearch:hover,
          .stationNowSongSearch:hover,
          .stationSearchSpotlightPager button:hover,
          .stationSearchSpotlightActions button:hover,
          .stationSearchSpotlightActions a:hover,
          .networkNowNavigation button:hover,
          .stationNetworkSkip button:hover,
          .stationNetworkFavorite:hover,
          .stationNetworkShare:hover,
          .stationNetworkOpen:hover,
          .stationNetworkPlay:hover,
          .stationActiveShortcut:hover,
          .networkNowItem:hover,
          .stationOnAirFilter:hover,
          .stationAudienceSort:hover,
          .stationGenreFilters button:hover,
          .stationActiveFilterChips button:hover,
          .stationClearAllFilters:hover,
          .stationFavorite:hover,
          .stationShare:hover,
          .stationCard:hover,
          .stationCardPlay:hover,
          .stationPageLink:hover,
          .stationPageLink:hover span:last-child {
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}
