import { Lock, Smile, ThumbsUp } from "lucide-react";

import { FEATURES } from "@/lib/marketing/data";

const ICONS = {
  smile: Smile,
  "thumbs-up": ThumbsUp,
  lock: Lock,
} as const;

export function FeatureGrid() {
  return (
    <section className="py-14">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
        {FEATURES.map((feature) => {
          const Icon = ICONS[feature.icon];
          return (
            <div key={feature.title} className="text-center sm:text-left">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:mx-0">
                <Icon className="size-6" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
