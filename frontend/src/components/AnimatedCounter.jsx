import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring, animate } from "framer-motion";

/**
 * AnimatedCounter
 * Counts up from 0 to `value` when it enters the viewport.
 *
 * Props:
 *  value      {number}  — target number
 *  duration   {number}  — animation duration in seconds (default 1.4)
 *  decimals   {number}  — decimal places to show (default 0)
 *  prefix     {string}  — e.g. "$"
 *  suffix     {string}  — e.g. "%"
 *  className  {string}
 */
export default function AnimatedCounter({
  value,
  duration = 1.4,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });

  useEffect(() => {
    if (!inView || !ref.current) return;

    const node = ref.current;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1], // expo out — fast start, soft landing
      onUpdate(v) {
        node.textContent =
          prefix + v.toFixed(decimals) + suffix;
      },
    });

    return () => controls.stop();
  }, [inView, value, duration, decimals, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}