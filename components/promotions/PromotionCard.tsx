import Link from "next/link";
import type { Promotion } from "@/types/promotion";
import { colors } from "@/styles/colors";
import { radius } from "@/styles/radius";
import { spacing } from "@/styles/spacing";
import { typography } from "@/styles/typography";

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
        borderRadius: radius.card,
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
          padding: spacing.lg,
          background: `linear-gradient(180deg, transparent 25%, ${colors.overlay} 100%)`,
        }}
      >
        <div>
          <span
            style={{
              display: "inline-block",
              marginBottom: spacing.sm,
              color: colors.primary,
              fontSize: typography.label,
              fontWeight: typography.weightBold,
              letterSpacing: typography.letterSpacingLabel,
              textTransform: "uppercase",
            }}
          >
            {promotion.category}
          </span>

          <h3
            style={{
              margin: 0,
              color: colors.textSecondary,
              fontSize: typography.subtitle,
            }}
          >
            {promotion.title}
          </h3>

          {promotion.description ? (
            <p
              style={{
                maxWidth: 520,
                margin: `${spacing.sm}px 0 ${spacing.md}px`,
                color: colors.textSecondary,
                lineHeight: typography.lineHeightBody,
              }}
            >
              {promotion.description}
            </p>
          ) : null}

          <Link
            href={promotion.href}
            style={{
              display: "inline-block",
              padding: `${spacing.sm}px ${spacing.md}px`,
              color: colors.text,
              fontSize: typography.button,
              fontWeight: typography.weightBlack,
              textDecoration: "none",
              borderRadius: radius.badge,
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