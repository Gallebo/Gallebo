"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BookingAccordionItemProps = {
  id: string;
  expanded: boolean;
  onToggle: () => void;
};

type BookingConversationsAccordionProps<T extends { id: string }> = {
  items: T[];
  className?: string;
  children: (item: T, accordion: BookingAccordionItemProps) => ReactNode;
};

function bookingIdFromHash(hash: string, itemIds: string[]): string | null {
  if (!hash.startsWith("booking-")) return null;
  const rest = hash.slice("booking-".length).replace(/-chat$/, "");
  return itemIds.find((id) => rest === id) ?? null;
}

export function BookingConversationsAccordion<T extends { id: string }>({
  items,
  className,
  children,
}: BookingConversationsAccordionProps<T>) {
  const [expandedId, setExpandedId] = useState<string | null>(
    items[0]?.id ?? null,
  );

  useEffect(() => {
    const itemIds = items.map((item) => item.id);

    const syncFromHash = () => {
      const fromHash = bookingIdFromHash(window.location.hash.slice(1), itemIds);
      if (fromHash) {
        setExpandedId(fromHash);
        requestAnimationFrame(() => {
          document
            .getElementById(`booking-${fromHash}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [items]);

  useEffect(() => {
    if (!items.length) {
      setExpandedId(null);
      return;
    }
    if (!expandedId || !items.some((item) => item.id === expandedId)) {
      const first = items[0];
      if (first) setExpandedId(first.id);
    }
  }, [items, expandedId]);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (!items.length) return null;

  return (
    <ul
      className={cn("flex flex-col gap-3", className)}
      style={{ listStyle: "none", margin: 0, padding: 0 }}
    >
      {items.map((item) => {
        const expanded = expandedId === item.id;
        return (
          <li key={item.id}>
            {children(item, {
              id: item.id,
              expanded,
              onToggle: () => toggle(item.id),
            })}
          </li>
        );
      })}
    </ul>
  );
}

type BookingAccordionBodyProps = {
  expanded: boolean;
  children: ReactNode;
  className?: string;
};

export function BookingAccordionBody({
  expanded,
  children,
  className,
}: BookingAccordionBodyProps) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-in-out",
        className,
      )}
      style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      aria-hidden={!expanded}
    >
      <div className="overflow-hidden">
        <div className="pt-3">{children}</div>
      </div>
    </div>
  );
}
