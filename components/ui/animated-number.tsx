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
    const el = ref.current;
    if (!el) return;

    let rafId = 0;

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
              if (k < 1) {
                rafId = requestAnimationFrame(step);
              } else {
                setDisplay(value);
              }
            }
            rafId = requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.4 },
    );

    io.observe(el);

    return () => {
      io.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
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
