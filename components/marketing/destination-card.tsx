import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DestinationCardProps = {
  name: string;
  description: string;
  image: string;
  badge: string;
  className?: string;
};

export function DestinationCard({
  name,
  description,
  image,
  badge,
  className,
}: DestinationCardProps) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg bg-card shadow-card transition-shadow hover:shadow-lg",
        className
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
        />
        <Badge className="absolute top-3 right-3 border-0 bg-primary text-primary-foreground">
          {badge}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground">{name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </article>
  );
}
