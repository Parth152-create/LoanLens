import { useEffect, useRef } from "react";
import { useInView, animate } from "framer-motion";

/**
 * ProbabilityMeter
 * Big animated probability number + gradient bar.
 *
 * Props:
 *  probability  {number}  — 0 to 1
 */
export default function ProbabilityMeter({ probability = 0 }) {
  const percent = Math.round(probability * 100);

  const numRef = useRef(null);
  const barRef = useRef(null);
  const inView = useInView(numRef, { once: true });

  // Animate the number count-up
  useEffect(() => {
    if (!inView || !numRef.current) return;
    const node = numRef.current;
    const controls = animate(0, percent, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        node.textContent = Math.round(v) + "%";
      },
    });
    return () => controls.stop();
  }, [inView, percent]);

  // Animate the bar width
  useEffect(() => {
    if (!inView || !barRef.current) return;
    const node = barRef.current;
    const controls = animate(0, percent, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        node.style.width = Math.round(v) + "%";
      },
    });
    return () => controls.stop();
  }, [inView, percent]);

  // Bar colour: green → yellow → red based on probability
  const barGradient =
    percent < 35
      ? "linear-gradient(90deg, #10b981, #34d399)"
      : percent < 65
      ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
      : "linear-gradient(90deg, #ef4444, #f97316)";

  const numberColor =
    percent < 35 ? "#10b981" : percent < 65 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ width: "100%" }}>
      {/* Big probability number */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "0.4rem",
          marginBottom: "0.5rem",
        }}
      >
        <span
          ref={numRef}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "3.5rem",
            fontWeight: 800,
            color: numberColor,
            lineHeight: 1,
            transition: "color 0.4s ease",
          }}
        >
          0%
        </span>
        <span
          style={{
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            fontWeight: 500,
            paddingBottom: "0.4rem",
          }}
        >
          default probability
        </span>
      </div>

      {/* Gradient meter bar */}
      <div
        style={{
          width: "100%",
          height: 10,
          borderRadius: "99px",
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          ref={barRef}
          style={{
            height: "100%",
            width: "0%",
            borderRadius: "99px",
            background: barGradient,
            boxShadow: `0 0 8px ${numberColor}55`,
            transition: "background 0.4s ease, box-shadow 0.4s ease",
          }}
        />
      </div>

      {/* Scale labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "0.35rem",
        }}
      >
        {["0%", "25%", "50%", "75%", "100%"].map((l) => (
          <span
            key={l}
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              fontWeight: 500,
            }}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}