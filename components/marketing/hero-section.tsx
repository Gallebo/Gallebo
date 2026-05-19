import Image from "next/image";

import { HeroSearchCard } from "@/components/marketing/hero-search-card";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=85";

export function HeroSection() {
  return (
    <section className="relative">
      <div className="relative h-[min(52vh,520px)] w-full overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="Light aircraft flying above clouds at sunset"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-background" />
      </div>
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <HeroSearchCard className="-mt-16 sm:-mt-20" />
      </div>
    </section>
  );
}
