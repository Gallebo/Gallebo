"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  stagger?: boolean;
  className?: string;
  once?: boolean;
}

export function Reveal({
  children,
  delay = 0,
  stagger = false,
  className,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (stagger) {
      Array.from(el.children).forEach((child, i) => {
        (child as HTMLElement).setAttribute("data-stagger", "");
        (child as HTMLElement).style.setProperty("--stagger-i", String(i));
      });
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => el.classList.add("visible"), delay);
            if (once) io.disconnect();
          } else if (!once) {
            if (timer) clearTimeout(timer);
            el.classList.remove("visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [delay, stagger, once]);

  return (
    <div ref={ref} className={cn("gallebo-reveal", className)}>
      {children}
    </div>
  );
}
