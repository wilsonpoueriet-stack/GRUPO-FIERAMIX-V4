"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/dashboard";
import {
  getActiveStreams,
  getAudienceRanking,
  getLeaderStation,
  getTotalListeners,
} from "@/lib/dashboard";
import { useDashboard } from "@/hooks/useDashboard";

type DashboardStation = {
  id: string;
  success: boolean;
  title?: string;
  artist?: string;
  artwork?: string;
  listeners?: number | null;
  live?: boolean;
  autodj?: boolean;
  nexttrack?: string;
  nexttrack_artist?: string;
  error?: string;
};

const stationNames: Record<string, string> = {
  fieramix: "FIERAMIX La Brava",
  bachata: "Solo Bachata",
  baladas: "Solo Baladas",
  merengue: "Solo Merengue",
  salsa: "Solo Salsa",
  reggaeton: "Solo Reggaetón",
  rancheras: "Solo Rancheras",
  cristiana: "Solo Música Cristiana",
  internacional: "Solo Música Internacional",
};

function getStationName(id: string): string {
  return stationNames[id] ?? id;
}

export default function DashboardHome() {
  const [stations, setStations] = useState<DashboardStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/now-playing-all", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`La API respondió ${response.status}`);
        }

        const data = (await response.json()) as DashboardStation[];

        if (cancelled || !Array.isArray(data)) {
          return;
        }

        setStations(data);
        setError("");
        setLastUpdated(
          new Date().toLocaleTimeString("es-DO", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el dashboard",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    const timer = window.setInterval(() => {
      void loadDashboard();
    }, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const activeStations = useMemo(
    () => stations.filter((station) => station.success),
    [stations],
  );

  const failedStations = useMemo(
    () => stations.filter((station) => !station.success),
    [stations],
  );

  const totalListeners = getTotalListeners(
  activeStations.map(
    (station) => station.listeners ?? 0,
  ),
);

  const ranking = useMemo(
  () => getAudienceRanking(activeStations),
  [activeStations],
);

  const leader = getLeaderStation(ranking);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #17305a 0, #08111f 42%, #050a13 100%)",
        color: "white",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span
            style={{
              color: "#43f5b1",
              fontSize: ".75rem",
              fontWeight: 900,
              letterSpacing: 2,
            }}
          >
            CENTRO DE OPERACIONES
          </span>

          <h1
            style={{
              fontSize: "2.3rem",
              margin: "8px 0",
            }}
          >
            🎛️ GRUPO FIERAMIX
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.7,
            }}
          >
            Network Operations Center
          </p>
        </div>

        <div
          style={{
            padding: "12px 16px",
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 14,
            fontSize: ".8rem",
          }}
        >
          <strong>Actualización automática</strong>
          <div style={{ marginTop: 5, opacity: 0.7 }}>
            {lastUpdated
              ? `Última consulta: ${lastUpdated}`
              : "Esperando datos..."}
          </div>
        </div>
      </header>

      {error && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            background: "rgba(255,70,90,.14)",
            border: "1px solid rgba(255,70,90,.5)",
            borderRadius: 14,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 18,
          marginBottom: 30,
        }}
      >
        <MetricCard
          label="Oyentes totales"
          value={loading ? "..." : String(totalListeners)}
          icon="👥"
        />

        <MetricCard
          label="Emisoras activas"
          value={
            loading
              ? "..."
              : `${activeStations.length} / ${stations.length || 9}`
          }
          icon="📻"
        />

        <MetricCard
          label="Streams con respuesta"
          value={
  loading
    ? "..."
    : String(
        getActiveStreams(
          stations.map((station) => station.success),
        ),
      )
}
          icon="🟢"
        />

        <MetricCard
          label="Streams con error"
          value={loading ? "..." : String(failedStations.length)}
          icon={failedStations.length > 0 ? "⚠️" : "✅"}
        />
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: "rgba(13,27,50,.92)",
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "22px 24px",
              borderBottom: "1px solid rgba(255,255,255,.08)",
            }}
          >
            <span
              style={{
                color: "#43f5b1",
                fontSize: ".72rem",
                fontWeight: 900,
                letterSpacing: 1.5,
              }}
            >
              ESTADO DE LA RED
            </span>

            <h2 style={{ margin: "7px 0 0" }}>
              Emisoras en tiempo real
            </h2>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 820,
              }}
            >
              <thead>
                <tr>
                  <TableHeader>Emisora</TableHeader>
                  <TableHeader>Estado</TableHeader>
                  <TableHeader>Oyentes</TableHeader>
                  <TableHeader>Sonando ahora</TableHeader>
                  <TableHeader>Próxima canción</TableHeader>
                </tr>
              </thead>

              <tbody>
                {ranking.map((station) => (
                  <tr
                    key={station.id}
                    style={{
                      borderTop:
                        "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <TableCell>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <img
                          src={station.artwork}
                          alt=""
                          width={48}
                          height={48}
                          style={{
                            width: 48,
                            height: 48,
                            objectFit: "cover",
                            borderRadius: 10,
                            background: "#15233a",
                          }}
                        />

                        <strong>
                          {getStationName(station.id)}
                        </strong>
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusBadge station={station} />
                    </TableCell>

                    <TableCell>
                      <strong>{station.listeners ?? 0}</strong>
                    </TableCell>

                    <TableCell>
                      <strong>{station.title || "Sin información"}</strong>
                      <small
                        style={{
                          display: "block",
                          marginTop: 4,
                          opacity: 0.65,
                        }}
                      >
                        {station.artist || ""}
                      </small>
                    </TableCell>

                    <TableCell>
                      <strong>
                        {station.nexttrack || "No disponible"}
                      </strong>

                      {station.nexttrack_artist && (
                        <small
                          style={{
                            display: "block",
                            marginTop: 4,
                            opacity: 0.65,
                          }}
                        >
                          {station.nexttrack_artist}
                        </small>
                      )}
                    </TableCell>
                  </tr>
                ))}

                {failedStations.map((station) => (
                  <tr
                    key={station.id}
                    style={{
                      borderTop:
                        "1px solid rgba(255,255,255,.06)",
                      background: "rgba(255,70,90,.06)",
                    }}
                  >
                    <TableCell>
                      <strong>
                        {getStationName(station.id)}
                      </strong>
                    </TableCell>

                    <TableCell>
                      <span style={{ color: "#ff7084" }}>
                        🔴 ERROR
                      </span>
                    </TableCell>

                    <TableCell>0</TableCell>

                    <TableCell>
                      {station.error || "Sin respuesta"}
                    </TableCell>

                    <TableCell>—</TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside
          style={{
            display: "grid",
            gap: 20,
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(42,73,126,.95), rgba(17,32,58,.95))",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 20,
              padding: 24,
            }}
          >
            <span
              style={{
                color: "#ffd65a",
                fontSize: ".72rem",
                fontWeight: 900,
                letterSpacing: 1.5,
              }}
            >
              EMISORA LÍDER
            </span>

            <h2 style={{ margin: "10px 0 6px" }}>
              {leader
                ? getStationName(leader.id)
                : "Cargando..."}
            </h2>

            <div
              style={{
                fontSize: "2.6rem",
                fontWeight: 900,
                margin: "18px 0 5px",
              }}
            >
              {leader?.listeners ?? 0}
            </div>

            <div style={{ opacity: 0.65 }}>
              oyentes conectados
            </div>

            {leader && (
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 18,
                  borderTop:
                    "1px solid rgba(255,255,255,.1)",
                }}
              >
                <strong>{leader.title}</strong>
                <small
                  style={{
                    display: "block",
                    marginTop: 5,
                    opacity: 0.65,
                  }}
                >
                  {leader.artist}
                </small>
              </div>
            )}
          </div>

          <div
            style={{
              background: "rgba(13,27,50,.92)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 20,
              padding: 24,
            }}
          >
            <span
              style={{
                color: "#43f5b1",
                fontSize: ".72rem",
                fontWeight: 900,
                letterSpacing: 1.5,
              }}
            >
              RANKING DE AUDIENCIA
            </span>

            <ol
              style={{
                listStyle: "none",
                padding: 0,
                margin: "18px 0 0",
              }}
            >
              {ranking.map((station, index) => (
                <li
                  key={station.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    padding: "12px 0",
                    borderTop:
                      index === 0
                        ? "none"
                        : "1px solid rgba(255,255,255,.07)",
                  }}
                >
                  <span>
                    <strong style={{ marginRight: 8 }}>
                      {index + 1}.
                    </strong>
                    {getStationName(station.id)}
                  </span>

                  <strong>{station.listeners ?? 0}</strong>
                </li>
              ))}
            </ol>
          </div>

          <div
            style={{
              background: "rgba(13,27,50,.92)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 20,
              padding: 24,
            }}
          >
            <span
              style={{
                color:
                  failedStations.length > 0
                    ? "#ff7084"
                    : "#43f5b1",
                fontSize: ".72rem",
                fontWeight: 900,
                letterSpacing: 1.5,
              }}
            >
              ALERTAS DEL SISTEMA
            </span>

            <div style={{ marginTop: 16 }}>
              {failedStations.length === 0 ? (
                <p style={{ margin: 0, opacity: 0.75 }}>
                  ✅ Todos los servicios están respondiendo.
                </p>
              ) : (
                failedStations.map((station) => (
                  <p
                    key={station.id}
                    style={{
                      margin: "10px 0",
                      color: "#ff9bab",
                    }}
                  >
                    ⚠️ {getStationName(station.id)}:{" "}
                    {station.error || "Sin respuesta"}
                  </p>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
  
function StatusBadge({
  station,
}: {
  station: DashboardStation;
}) {
  const text = station.live
    ? "LIVE"
    : station.autodj
      ? "AUTODJ"
      : "AL AIRE";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 10px",
        color: station.live ? "#ff8897" : "#55f3b6",
        background: station.live
          ? "rgba(255,70,90,.12)"
          : "rgba(67,245,177,.1)",
        borderRadius: 999,
        fontSize: ".68rem",
        fontWeight: 900,
      }}
    >
      <i
        style={{
          width: 7,
          height: 7,
          background: "currentColor",
          borderRadius: "50%",
        }}
      />
      {text}
    </span>
  );
}

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      style={{
        padding: "15px 18px",
        textAlign: "left",
        color: "rgba(255,255,255,.6)",
        fontSize: ".7rem",
        letterSpacing: 1,
      }}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td
      style={{
        padding: "15px 18px",
        verticalAlign: "middle",
        fontSize: ".82rem",
      }}
    >
      {children}
    </td>
  );
}