"use client";

import { useEffect, useState } from "react";
import { activePromotions } from "@/config/promotions";
import PromotionCard from "./PromotionCard";

export default function PromotionCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalPromotions = activePromotions.length;

  useEffect(() => {
    if (totalPromotions <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((current) =>
        current === totalPromotions - 1 ? 0 : current + 1,
      );
    }, 7000);

    return () => {
      window.clearInterval(timer);
    };
  }, [totalPromotions]);

  function showPrevious() {
    setCurrentIndex((current) =>
      current === 0 ? totalPromotions - 1 : current - 1,
    );
  }

  function showNext() {
    setCurrentIndex((current) =>
      current === totalPromotions - 1 ? 0 : current + 1,
    );
  }

  if (totalPromotions === 0) {
    return null;
  }

  const currentPromotion = activePromotions[currentIndex];

  return (
    <section
      aria-label="Promociones destacadas"
      style={{
        position: "relative",
        maxWidth: 1240,
        margin: "0 auto",
        padding: "28px 20px",
      }}
    >
      <div
        style={{
          marginBottom: 18,
        }}
      >
        <span
          style={{
            display: "block",
            marginBottom: 6,
            color: "#ff2d76",
            fontSize: ".72rem",
            fontWeight: 900,
            letterSpacing: 1.8,
          }}
        >
          PROMOCIONES DESTACADAS
        </span>

        <h2
          style={{
            margin: 0,
            color: "white",
            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
          }}
        >
          Lo mejor de nuestra programación
        </h2>
      </div>

      <div
        style={{
          position: "relative",
        }}
      >
        <PromotionCard promotion={currentPromotion} />

        {totalPromotions > 1 ? (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Promoción anterior"
              style={{
                position: "absolute",
                top: "50%",
                left: 14,
                width: 44,
                height: 44,
                color: "white",
                fontSize: "1.4rem",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,.2)",
                borderRadius: "50%",
                background: "rgba(4,8,20,.72)",
                transform: "translateY(-50%)",
              }}
            >
              ‹
            </button>

            <button
              type="button"
              onClick={showNext}
              aria-label="Promoción siguiente"
              style={{
                position: "absolute",
                top: "50%",
                right: 14,
                width: 44,
                height: 44,
                color: "white",
                fontSize: "1.4rem",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,.2)",
                borderRadius: "50%",
                background: "rgba(4,8,20,.72)",
                transform: "translateY(-50%)",
              }}
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {totalPromotions > 1 ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 16,
          }}
        >
          {activePromotions.map((promotion, index) => (
            <button
              key={promotion.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Mostrar promoción ${index + 1}`}
              aria-current={index === currentIndex}
              style={{
                width: index === currentIndex ? 28 : 9,
                height: 9,
                padding: 0,
                cursor: "pointer",
                border: 0,
                borderRadius: 999,
                background:
                  index === currentIndex
                    ? "#ff2d76"
                    : "rgba(255,255,255,.28)",
                transition: "width .25s ease",
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}