"use client";

export function PilotGreeting({ name }: { name: string }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <span>
      {greeting}, {name}
    </span>
  );
}
