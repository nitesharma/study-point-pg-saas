"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Send,
  ImageOff,
  Utensils,
  ShieldCheck,
  Building2,
  Share2,
} from "lucide-react";
import PublicHeader from "../../../components/catalogue/PublicHeader";
import EnquiryModal from "../../../components/catalogue/EnquiryModal";
import ModalOverlay from "../../../components/ui/ModalOverlay";
import { dbService, PGListing } from "../../../lib/db";
import {
  GENDER_LABELS,
  amenityById,
  callLink,
  directionsUrl,
  mapEmbedUrl,
  sharingLabel,
  startingPrice,
  totalBedsAvailable,
  whatsappLink,
  youtubeEmbedUrl,
} from "../../../lib/catalogue";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<PGListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    dbService.getListing(id).then((l) => {
      setListing(l && l.published ? l : null);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (listing) document.title = `${listing.title} – PG in ${listing.locality || listing.city}`;
  }, [listing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-chalk">
        <PublicHeader />
        <div className="flex justify-center py-32">
          <Loader2 className="w-8 h-8 text-ink animate-spin" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-chalk">
        <PublicHeader />
        <div className="max-w-md mx-auto text-center py-24 px-4">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900">PG not found</h1>
          <p className="text-sm text-slate-500 mt-2">This listing may have been removed or is not public yet.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 mt-6 px-4 py-2.5 rounded-xl bg-marigold hover:bg-[#e89a26] text-ink text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Browse all PGs
          </Link>
        </div>
      </div>
    );
  }

  const images = listing.images;
  const price = startingPrice(listing);
  const beds = totalBedsAvailable(listing);
  const amenities = listing.amenities.map(amenityById).filter((a): a is NonNullable<typeof a> => !!a);
  const whatsapp = listing.whatsapp || listing.phone;
  const waText = `Hi, I'm interested in ${listing.title}${
    listing.locality ? ` (${listing.locality})` : ""
  }. Could you share bed availability?`;

  const prevImage = () => setActiveImage((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setActiveImage((i) => (i + 1) % images.length);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    }
  };

  const renderContactButtons = (compact = false) => (
    <div className={`grid ${compact ? (listing.phone ? "grid-cols-4" : "grid-cols-2") + " gap-1.5" : "grid-cols-2 gap-2"}`}>
      {listing.phone && (
        <>
          <a
            href={whatsappLink(whatsapp, waText)}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 rounded-xl bg-leaf hover:bg-[#188a4a] text-white text-xs sm:text-sm font-semibold"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <a
            href={callLink(listing.phone)}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 rounded-xl bg-ink hover:bg-ink-soft text-white text-xs sm:text-sm font-semibold"
          >
            <Phone className="w-4 h-4" /> Call
          </a>
        </>
      )}
      <button
        onClick={() => setEnquiryOpen(true)}
        className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 rounded-xl bg-marigold hover:bg-[#e89a26] text-ink text-xs sm:text-sm font-semibold"
      >
        <Send className="w-4 h-4" /> Enquire
      </button>
      <a
        href={directionsUrl(listing)}
        target="_blank"
        rel="noreferrer"
        className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold"
      >
        <Navigation className="w-4 h-4" /> Directions
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-chalk text-slate-900 pb-24 lg:pb-0">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> All PGs
          </Link>
          <button
            onClick={share}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        {/* Gallery */}
        <section className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 sm:gap-3 rounded-2xl overflow-hidden md:h-[440px]">
          <div className="relative md:col-span-3 md:row-span-2 aspect-[4/3] md:aspect-auto bg-slate-200">
            {images.length ? (
              <>
                <img
                  src={images[activeImage]}
                  alt={listing.title}
                  onClick={() => setLightbox(true)}
                  className="w-full h-full object-cover cursor-zoom-in"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-800" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-800" />
                    </button>
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/70 text-white text-xs font-semibold">
                      {activeImage + 1} / {images.length}
                    </span>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <ImageOff className="w-10 h-10" />
              </div>
            )}
          </div>
          {images.slice(1, 3).map((src, i) => (
            <button
              key={src}
              onClick={() => setActiveImage(i + 1)}
              className="hidden md:block relative bg-slate-200 overflow-hidden"
            >
              <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
              {i === 1 && images.length > 3 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox(true);
                  }}
                  className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white font-bold"
                >
                  +{images.length - 3} photos
                </span>
              )}
            </button>
          ))}
        </section>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
            {images.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setActiveImage(i)}
                className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 ${
                  i === activeImage ? "border-ink" : "border-transparent"
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full bg-ink/5 text-ink text-xs font-bold">
                  {GENDER_LABELS[listing.gender]} PG
                </span>
                {listing.isDemo && (
                  <span className="px-2.5 py-1 rounded-full bg-marigold/25 text-ink text-xs font-bold">
                    Demo listing – sample photos and prices
                  </span>
                )}
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    beds > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {beds > 0 ? `${beds} bed${beds > 1 ? "s" : ""} available` : "Currently full"}
                </span>
                {listing.foodIncluded && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                    <Utensils className="w-3 h-3" /> Meals included
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{listing.title}</h1>
              {listing.tagline && <p className="text-slate-600 mt-1">{listing.tagline}</p>}
              <p className="text-sm text-slate-500 flex items-start gap-1.5 mt-3">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                {[listing.address, listing.locality, listing.city].filter(Boolean).join(", ")}
              </p>
              {listing.description && (
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed mt-5 whitespace-pre-line">
                  {listing.description}
                </p>
              )}
            </section>

            {/* Pricing */}
            {listing.pricing.length > 0 && (
              <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
                <h2 className="font-display text-xl font-bold text-slate-900 mb-4">Room Options & Pricing</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {listing.pricing.map((p) => (
                    <div
                      key={p.sharing}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{sharingLabel(p.sharing)}</p>
                        <p
                          className={`text-xs font-semibold mt-0.5 ${
                            p.bedsAvailable > 0 ? "text-emerald-700" : "text-slate-500"
                          }`}
                        >
                          {p.bedsAvailable > 0 ? `${p.bedsAvailable} bed${p.bedsAvailable > 1 ? "s" : ""} available` : "Full"}
                        </p>
                      </div>
                      <p className="font-board text-lg font-bold text-slate-900">
                        {p.price ? `₹${p.price.toLocaleString("en-IN")}` : "—"}
                        <span className="text-xs font-medium text-slate-500">/mo</span>
                      </p>
                    </div>
                  ))}
                </div>
                {!!listing.securityDeposit && (
                  <p className="text-xs text-slate-500 mt-3">
                    Security deposit: ₹{listing.securityDeposit.toLocaleString("en-IN")}
                  </p>
                )}
              </section>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
                <h2 className="font-display text-xl font-bold text-slate-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <span className="w-9 h-9 rounded-xl bg-chalk flex items-center justify-center shrink-0">
                        <a.icon className="w-4 h-4 text-ink" />
                      </span>
                      {a.label}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Videos */}
            {listing.videos.length > 0 && (
              <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
                <h2 className="font-display text-xl font-bold text-slate-900 mb-4">Video Tour</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listing.videos.map((v) => {
                    const yt = youtubeEmbedUrl(v);
                    return (
                      <div key={v} className="aspect-video rounded-xl overflow-hidden bg-slate-900">
                        {yt ? (
                          <iframe
                            src={yt}
                            title="PG video tour"
                            className="w-full h-full"
                            loading="lazy"
                            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video src={v} controls preload="metadata" className="w-full h-full" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Location */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-xl font-bold text-slate-900">Location</h2>
                <a
                  href={directionsUrl(listing)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-chalk hover:bg-line text-ink text-xs font-semibold"
                >
                  <Navigation className="w-3.5 h-3.5" /> Get Directions
                </a>
              </div>
              <iframe
                title={`${listing.title} on Google Maps`}
                src={mapEmbedUrl(listing)}
                className="w-full h-72 sm:h-80 rounded-xl border border-slate-200"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </section>

            {listing.houseRules && (
              <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
                <h2 className="font-display text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-ink" /> House Rules
                </h2>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{listing.houseRules}</p>
              </section>
            )}
          </div>

          {/* Contact sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
              <div>
                <p className="text-xs text-slate-500 font-medium">Starting from</p>
                <p className="font-board text-3xl font-bold text-slate-900">
                  {price ? `₹${price.toLocaleString("en-IN")}` : "On request"}
                  {price && <span className="text-sm font-medium text-slate-500">/month</span>}
                </p>
              </div>
              {renderContactButtons()}
              <p className="text-xs text-slate-500 text-center">
                Call or WhatsApp ahead to book a visit.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile sticky action bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs text-slate-500">Starting from</p>
          <p className="font-board text-base font-bold text-slate-900">
            {price ? `₹${price.toLocaleString("en-IN")}/mo` : "On request"}
          </p>
        </div>
        {renderContactButtons(true)}
      </div>

      {enquiryOpen && <EnquiryModal listing={listing} onClose={() => setEnquiryOpen(false)} />}

      {lightbox && images.length > 0 && (
        <ModalOverlay tone="bg-slate-950/90" onClose={() => setLightbox(false)} dismissOnBackdrop>
          <div className="relative w-full max-w-5xl">
            <img src={images[activeImage]} alt={listing.title} className="w-full max-h-[80vh] object-contain rounded-xl" />
            <button
              onClick={() => setLightbox(false)}
              className="absolute -top-2 right-0 sm:-right-2 -translate-y-full px-3 py-1.5 rounded-lg bg-white text-slate-900 text-sm font-semibold"
            >
              Close
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white flex items-center justify-center"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-900" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white flex items-center justify-center"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5 text-slate-900" />
                </button>
              </>
            )}
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
