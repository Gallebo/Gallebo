import { Shield, Star } from "lucide-react";

export function TrustBar() {
  return (
    <section className="border-b border-border/60 bg-background py-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 px-4 text-center sm:flex-row sm:gap-6">
        <div className="flex items-center gap-1 text-primary">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="size-4 fill-current" aria-hidden />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Verified pilots · GDPR-compliant identity checks · EASA cost-sharing
        </p>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Shield className="size-4 text-primary" aria-hidden />
          <span>Secure. Private. Reliable.</span>
        </div>
      </div>
    </section>
  );
}
