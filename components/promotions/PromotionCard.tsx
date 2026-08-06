import Link from "next/link";
import type { Promotion } from "@/types/promotion";
import { colors } from "@/styles/colors";

type PromotionCardProps = {
  promotion: Promotion;
};

export default function PromotionCard({
  promotion,
}: PromotionCardProps) {
  return (
    <article
      style={{
        position: "relative",
        minHeight: 380,
        overflow: "hidden",
        willChange: "transform",
        backfaceVisibility: "hidden",
        border: `1px solid ${colors.border}`,
        borderRadius: 20,
        background: colors.surface,
        transition: "transform .25s ease",
      }}
    >
      <img
        src={promotion.image}
        alt={`${promotion.title} - EL GRUPO FIERAMIX.COM`}
        style={{
          width: "100%",
height: 380,
          objectFit: "cover",
          objectPosition: "center",
          display: "block",
          userSelect: "none",
          transition: "transform .35s ease",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-end",
          padding: 24,
          background: `linear-gradient(180deg, transparent 25%, ${colors.overlay} 100%)`,
        }}
      >
        <div>
          <span
            style={{
              display: "inline-block",
              marginBottom: 10,
              color: colors.primary,
              fontSize: ".7rem",
              fontWeight: 900,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {promotion.category}
          </span>

          <h3
            style={{
              margin: 0,
              color: colors.textSecondary,
              fontSize: "1.7rem",
            }}
          >
            {promotion.title}
          </h3>

          {promotion.description ? (
            <p
              style={{
                maxWidth: 520,
                margin: "10px 0 18px",
                color: colors.textSecondary,
                lineHeight: 1.5,
              }}
            >
              {promotion.description}
            </p>
          ) : null}

          <Link
            href={promotion.href}
            style={{
              display: "inline-block",
              padding: "11px 16px",
              color: colors.text,
              fontSize: ".75rem",
              fontWeight: 900,
              textDecoration: "none",
              borderRadius: 999,
              background: colors.primary,
            }}
          >
            {promotion.buttonText ?? "VER MÁS"}
          </Link>
        </div>
      </div>
    </article>
  );
}