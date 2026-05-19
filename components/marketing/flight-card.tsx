import Image from "next/image";

import { cn } from "@/lib/utils";

type FlightCardProps = {
  title: string;
  location: string;
  image: string;
  className?: string;
};

export function FlightCard({
  title,
  location,
  image,
  className,
}: FlightCardProps) {
  return (
    <article
      className={cn(
        "group overflow-hidden rounded-lg bg-card shadow-card transition-shadow hover:shadow-lg",
        className
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{location}</p>
      </div>
    </article>
  );
}
