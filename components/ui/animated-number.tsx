"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number | string;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  duration = 1800,
  prefix = "",
  suffix = "",
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<number | string>(0);
  const started = useRef(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const numericValue =
              typeof value === "string"
                ? parseFloat(value.replace(/[^\d.]/g, ""))
                : value;
            const isFloat = String(value).includes(".");

            function step(t: number) {
              const k = Math.min(1, (t - start) / duration);
              const eased = 1 - Math.pow(1 - k, 3);
              const v = numericValue * eased;
              setDisplay(isFloat ? parseFloat(v.toFixed(2)) : Math.round(v));
              if (k < 1) requestAnimationFrame(step);
              else setDisplay(value);
            }
            requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.4 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [value, duration]);

  const formatted =
    typeof display === "number" && display >= 1000
      ? display.toLocaleString("en-US")
      : display;

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
