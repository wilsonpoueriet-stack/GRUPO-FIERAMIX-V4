type MetricCardProps = {
  icon: string;
  label: string;
  value: string;
};

export default function MetricCard({
  icon,
  label,
  value,
}: MetricCardProps) {
  return (
    <div
      style={{
        background: "rgba(19,35,63,.92)",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 18,
        padding: 24,
      }}
    >
      <div style={{ fontSize: "1.4rem" }}>{icon}</div>

      <div
        style={{
          marginTop: 14,
          opacity: 0.68,
          fontSize: ".85rem",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 5,
          fontSize: "2rem",
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  );
}