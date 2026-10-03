import Link from "next/link";
import { MapPin, MessageCircle, Phone, Navigation, ImageOff, ArrowUpRight } from "lucide-react";
import { PGListing } from "../../lib/db";
import {
  GENDER_LABELS,
  amenityById,
  callLink,
  directionsUrl,
  startingPrice,
  totalBedsAvailable,
  whatsappLink,
} from "../../lib/catalogue";

export default function ListingCard({ listing }: { listing: PGListing }) {
  const price = startingPrice(listing);
  const beds = totalBedsAvailable(listing);
  const cover = listing.images[0];
  const amenities = listing.amenities.map(amenityById).filter((a): a is NonNullable<typeof a> => !!a);
  const shown = amenities.slice(0, 4);
  const whatsapp = listing.whatsapp || listing.phone;
  const href = `/catalogue/${listing.id}`;

  return (
    <article className="group bg-white rounded-2xl border border-line hover:border-ink/25 hover:shadow-[0_12px_32px_-16px_rgba(20,33,61,0.35)] transition-all overflow-hidden flex flex-col">
      <Link href={href} className="relative block aspect-[4/3] bg-chalk overflow-hidden" aria-label={`View ${listing.title}`}>
        {cover ? (
          <img
            src={cover}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted/60">
            <ImageOff className="w-8 h-8" />
            <span className="text-xs">Photos coming soon</span>
          </div>
        )}
        <span className="absolute top-3 left-3 flex gap-1.5">
          <span className="px-2.5 py-1 rounded-md bg-white text-[11px] font-semibold text-ink shadow-sm">
            {GENDER_LABELS[listing.gender]}
          </span>
          {listing.isDemo && (
            <span className="px-2.5 py-1 rounded-md bg-marigold text-[11px] font-semibold text-ink shadow-sm">Demo</span>
          )}
        </span>
        <span
          className={`absolute bottom-3 left-3 inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-md text-xs font-semibold shadow-sm ${
            beds > 0 ? "bg-leaf text-white" : "bg-ink text-white"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${beds > 0 ? "bg-white" : "bg-white/50"}`} />
          {beds > 0 ? `${beds} bed${beds > 1 ? "s" : ""} open` : "Fully booked"}
        </span>
      </Link>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div>
          <Link href={href} className="inline-flex items-start gap-1 group/title">
            <h3 className="font-display text-xl font-bold tracking-tight text-ink leading-snug group-hover/title:underline decoration-marigold decoration-2 underline-offset-4">
              {listing.title}
            </h3>
            <ArrowUpRight className="w-4 h-4 mt-1.5 text-muted shrink-0" />
          </Link>
          <p className="text-sm text-muted flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{[listing.locality, listing.city].filter(Boolean).join(", ")}</span>
          </p>
        </div>

        {shown.length > 0 && (
          <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted">
            {shown.map((a) => (
              <li key={a.id} className="inline-flex items-center gap-1">
                <a.icon className="w-3.5 h-3.5 text-ink/70" /> {a.label}
              </li>
            ))}
            {amenities.length > shown.length && (
              <li className="text-ink/70 font-medium">+{amenities.length - shown.length} more</li>
            )}
          </ul>
        )}

        <div className="mt-auto flex items-baseline justify-between gap-2 pt-4 border-t border-dashed border-line">
          <span className="text-xs text-muted">Rent from</span>
          <span className="font-board text-xl font-bold text-ink">
            {price ? `₹${price.toLocaleString("en-IN")}` : "On request"}
            {price && <span className="text-xs font-normal text-muted">/mo</span>}
          </span>
        </div>

        <div className={`grid gap-2 ${listing.phone ? "grid-cols-3" : "grid-cols-1"}`}>
          {listing.phone && (
            <>
              <a
                href={whatsappLink(whatsapp, `Hi, I'm interested in ${listing.title}. Is a bed available?`)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-leaf-soft text-leaf hover:bg-leaf hover:text-white text-xs font-semibold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
              <a
                href={callLink(listing.phone)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-chalk text-ink hover:bg-ink hover:text-white text-xs font-semibold transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
            </>
          )}
          <a
            href={directionsUrl(listing)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-chalk text-ink hover:bg-ink hover:text-white text-xs font-semibold transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" /> Directions
          </a>
        </div>
      </div>
    </article>
  );
}
