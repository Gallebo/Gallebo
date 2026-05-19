export const PLACEHOLDER_DESTINATIONS = [
  {
    slug: "zagreb",
    name: "Zagreb",
    description: "Medvednica, historic Upper Town, nearby airfields",
    image:
      "https://images.unsplash.com/photo-1565008576549-57569a34971a?w=600&q=80",
    badge: "Flights nearby",
  },
  {
    slug: "london",
    name: "London",
    description: "The River Thames, countryside strips within reach",
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80",
    badge: "Flights nearby",
  },
  {
    slug: "paris",
    name: "Paris",
    description: "Champagne region, Loire Valley day trips",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
    badge: "Flights nearby",
  },
  {
    slug: "munich",
    name: "Munich",
    description: "Alps panoramas, lakes, Bavarian airfields",
    image:
      "https://images.unsplash.com/photo-1595867818082-083862f3d630?w=600&q=80",
    badge: "Flights nearby",
  },
  {
    slug: "rome",
    name: "Rome",
    description: "Coastal hops, Umbria and Lazio scenery",
    image:
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80",
    badge: "Flights nearby",
  },
  {
    slug: "vienna",
    name: "Vienna",
    description: "Danube valley, wine region overflights",
    image:
      "https://images.unsplash.com/photo-1516557647-ff5967996b2c?w=600&q=80",
    badge: "Flights nearby",
  },
] as const;

export const PLACEHOLDER_FLIGHTS = [
  {
    slug: "alps-panorama",
    title: "Alpine panorama from above",
    location: "Near Munich",
    image:
      "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&q=80",
  },
  {
    slug: "coastal-croatia",
    title: "Adriatic coast sightseeing",
    location: "Istria region",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  },
  {
    slug: "london-countryside",
    title: "Countryside circuit",
    location: "South East England",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
  },
  {
    slug: "tuscany-hills",
    title: "Rolling hills flyover",
    location: "Tuscany",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  },
] as const;

export const FEATURES = [
  {
    title: "Unforgettable",
    description: "Create beautiful memories that will last a lifetime.",
    icon: "smile" as const,
  },
  {
    title: "Simple",
    description: "Easily discover and request shared flights across Europe.",
    icon: "thumbs-up" as const,
  },
  {
    title: "Safe",
    description: "Pilots are verified through identity checks (Didit KYC).",
    icon: "lock" as const,
  },
] as const;
