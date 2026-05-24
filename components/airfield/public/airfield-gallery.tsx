import Image from "next/image";
import { getAirfieldPhotoPublicUrl } from "@/lib/airfield/utils";

interface Photo {
  id: string;
  storage_path: string;
  caption?: string | null;
}

interface AirfieldGalleryProps {
  airfieldName: string;
  photos: Photo[];
}

export function AirfieldGallery({ airfieldName, photos }: AirfieldGalleryProps) {
  if (photos.length === 0) return null;

  const photosWithUrls = photos
    .map((p) => ({ ...p, url: getAirfieldPhotoPublicUrl(p.storage_path) }))
    .filter((p) => Boolean(p.url));

  if (photosWithUrls.length === 0) return null;

  return (
    <section className="py-16" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--ink-3)" }}
          >
            Gallery
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            The airfield, photographed.
          </h2>
        </div>

        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {photosWithUrls.map((photo) => (
            <div
              key={photo.id}
              className="mb-3 break-inside-avoid overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--line)" }}
            >
              <Image
                src={photo.url!}
                alt={photo.caption ?? `${airfieldName} photo`}
                width={400}
                height={300}
                className="block w-full object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
