import RadioBossPublicInfo from "@/components/radioboss/RadioBossPublicInfo";

export default function TestRadioBossPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#05091a",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: 30 }}>
          <span
            style={{
              color: "#32f5b0",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 2,
            }}
          >
            PRUEBA AISLADA
          </span>

          <h1 style={{ margin: "8px 0 0", fontSize: 32 }}>
            Integración pública RadioBOSS
          </h1>

          <p style={{ color: "#aab2d5" }}>
            Solo Bachata · Station ID 221
          </p>
        </header>

        <RadioBossPublicInfo
          serverHost="c15.radioboss.fm"
          stationId={221}
          stationName="SOLO BACHATA"
        />
      </div>
    </main>
  );
}
