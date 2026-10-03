"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Building2, X, Phone, MessageCircle, MapPin } from "lucide-react";
import PublicHeader from "../components/catalogue/PublicHeader";
import ListingCard from "../components/catalogue/ListingCard";
import VacancyBoard from "../components/catalogue/VacancyBoard";
import { dbService, PGListing } from "../lib/db";
import {
  AMENITIES,
  BRAND_LOGO,
  BRAND_NAME,
  callLink,
  startingPrice,
  totalBedsAvailable,
  whatsappLink,
} from "../lib/catalogue";

const BUDGETS = [
  { label: "Any budget", max: 0 },
  { label: "Up to ₹5,000", max: 5000 },
  { label: "Up to ₹8,000", max: 8000 },
  { label: "Up to ₹12,000", max: 12000 },
  { label: "Up to ₹20,000", max: 20000 },
];

const GENDERS = [
  { id: "", label: "All" },
  { id: "boys", label: "Boys" },
  { id: "girls", label: "Girls" },
  { id: "co-living", label: "Co-living" },
];

const QUICK_AMENITIES = ["ac", "wifi", "food", "housekeeping", "lift", "parking", "laundry", "power"];

const STEPS = [
  {
    title: "Ask about a bed",
    body: "Call, WhatsApp or send an enquiry from any PG page to ask which beds are open and the exact rent.",
  },
  {
    title: "Visit and pick your bed",
    body: "Walk through the rooms, check the food and washrooms, and choose the bed you want.",
  },
  {
    title: "Pay the deposit, move in",
    body: "Pay the security deposit and first month's rent to confirm your bed, then move in.",
  },
];

const controlCls =
  "h-10 px-3 rounded-lg text-sm bg-white border border-line text-ink focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10";

export default function HomePage() {
  const [listings, setListings] = useState<PGListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [budget, setBudget] = useState(0);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    dbService.getPublishedListings().then((data) => {
      setListings(data.sort((a, b) => a.title.localeCompare(b.title)));
      setLoading(false);
    });
  }, []);

  const cities = useMemo(
    () => Array.from(new Set(listings.map((l) => l.city.trim()).filter(Boolean))).sort(),
    [listings]
  );
  const localities = useMemo(
    () => Array.from(new Set(listings.map((l) => (l.locality || "").trim()).filter(Boolean))).slice(0, 4),
    [listings]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return listings.filter((l) => {
      if (q && ![l.title, l.locality, l.city, l.address].some((v) => v?.toLowerCase().includes(q))) return false;
      if (city && l.city.trim() !== city) return false;
      if (gender && l.gender !== gender) return false;
      if (budget) {
        const price = startingPrice(l);
        if (!price || price > budget) return false;
      }
      if (amenities.length && !amenities.every((a) => l.amenities.includes(a))) return false;
      if (onlyAvailable && totalBedsAvailable(l) === 0) return false;
      return true;
    });
  }, [listings, search, city, gender, budget, amenities, onlyAvailable]);

  const filtersActive = !!(search || city || gender || budget || amenities.length || onlyAvailable);
  const contact = listings.find((l) => l.phone);

  const clearFilters = () => {
    setSearch("");
    setCity("");
    setGender("");
    setBudget(0);
    setAmenities([]);
    setOnlyAvailable(false);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    document.getElementById("pgs")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-chalk text-ink">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(#e3e6ee 1px, transparent 1px)",
            backgroundSize: "100% 32px",
          }}
          aria-hidden
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
          <div className="animate-fade-in">
            <p className="text-sm font-medium text-muted flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-marigold" />
              {cities.length ? `Student PGs in ${cities.join(", ")}` : "Student PGs & hostels"}
            </p>
            <h1 className="font-display mt-4 text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.25rem] font-extrabold tracking-[-0.03em] text-ink">
              Find a <span className="highlight">vacant bed</span> near your classes. Move in this week.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted max-w-xl leading-relaxed">
              Real photos, monthly rent and today&apos;s bed count for every {BRAND_NAME} PG. Call or WhatsApp the
              PG directly and visit before you pay.
            </p>

            <form onSubmit={submitSearch} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-xl">
              <label className="relative flex-1">
                <span className="sr-only">Search by area, PG name or city</span>
                <Search className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Area, PG name or city"
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-white border border-line shadow-sm text-base text-ink placeholder:text-muted/70 focus:outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
                />
              </label>
              <button
                type="submit"
                className="h-14 px-7 rounded-xl bg-ink hover:bg-ink-soft text-white font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Find a bed
              </button>
            </form>

            {localities.length > 0 && (
              <p className="mt-4 text-sm text-muted flex flex-wrap items-center gap-x-2 gap-y-1">
                Popular:
                {localities.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setSearch(loc);
                      document.getElementById("pgs")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="font-medium text-ink underline decoration-line decoration-2 underline-offset-4 hover:decoration-marigold"
                  >
                    {loc}
                  </button>
                ))}
              </p>
            )}
          </div>

          <VacancyBoard listings={listings} loading={loading} />
        </div>
      </section>

      {/* Listings */}
      <section id="pgs" className="scroll-mt-16 max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Our PGs</h2>
            <p className="text-muted mt-2">
              {loading
                ? "Loading PGs…"
                : filtersActive
                ? `${filtered.length} of ${listings.length} PG${listings.length === 1 ? "" : "s"} match`
                : `${listings.length} PG${listings.length === 1 ? "" : "s"}, sorted A–Z`}
            </p>
          </div>
          {filtersActive && (
            <button
              onClick={clearFilters}
              className="self-start md:self-auto inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline"
            >
              <X className="w-4 h-4" /> Clear filters
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div role="radiogroup" aria-label="PG for" className="inline-flex p-1 rounded-lg bg-white border border-line">
              {GENDERS.map((g) => (
                <button
                  key={g.id}
                  role="radio"
                  aria-checked={gender === g.id}
                  onClick={() => setGender(g.id)}
                  className={`px-3 h-8 rounded-md text-sm font-medium transition-colors ${
                    gender === g.id ? "bg-ink text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            {cities.length > 1 && (
              <select aria-label="City" className={controlCls} value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">All cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            <select
              aria-label="Budget"
              className={controlCls}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            >
              {BUDGETS.map((b) => (
                <option key={b.max} value={b.max}>
                  {b.label}
                </option>
              ))}
            </select>
            <label className={`${controlCls} inline-flex items-center gap-2 cursor-pointer select-none`}>
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 accent-[#1f9d55]"
              />
              Beds open now
            </label>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {QUICK_AMENITIES.map((id) => {
              const a = AMENITIES.find((x) => x.id === id)!;
              const active = amenities.includes(id);
              return (
                <button
                  key={id}
                  aria-pressed={active}
                  onClick={() => setAmenities((prev) => (active ? prev.filter((x) => x !== id) : [...prev, id]))}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-full border text-xs font-medium transition-colors ${
                    active
                      ? "bg-marigold/20 border-marigold text-ink"
                      : "bg-white border-line text-muted hover:text-ink hover:border-ink/30"
                  }`}
                >
                  <a.icon className="w-3.5 h-3.5" /> {a.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white border border-line rounded-2xl overflow-hidden">
                  <div className="aspect-[4/3] bg-line/60 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 w-2/3 rounded bg-line/80 animate-pulse" />
                    <div className="h-4 w-1/3 rounded bg-line/60 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-dashed border-line rounded-2xl py-16 px-4 text-center">
              <Building2 className="w-10 h-10 text-muted/50 mx-auto mb-3" />
              {listings.length === 0 ? (
                <>
                  <p className="font-display text-lg font-semibold">No PGs listed yet</p>
                  <p className="text-sm text-muted mt-1">Check back soon, or call us to ask about vacancies.</p>
                </>
              ) : (
                <>
                  <p className="font-display text-lg font-semibold">No PG matches these filters</p>
                  <p className="text-sm text-muted mt-1">Remove a filter or try a nearby area.</p>
                  <button
                    onClick={clearFilters}
                    className="mt-5 px-4 h-10 rounded-lg bg-ink text-white text-sm font-semibold hover:bg-ink-soft"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How booking works */}
      <section id="booking" className="scroll-mt-16 border-y border-line bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-[1fr_2fr] gap-10">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">How booking works</h2>
            <p className="text-muted mt-3 max-w-sm">Three steps from first message to moving in. You see the room before you pay anything.</p>
          </div>
          <ol className="grid sm:grid-cols-3 gap-6 sm:gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative pt-6 border-t-2 border-ink">
                <span className="font-board text-sm font-bold text-marigold">Step {i + 1}</span>
                <h3 className="font-display text-xl font-semibold mt-1">{s.title}</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-16 max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="bg-ink text-white rounded-3xl px-6 py-10 sm:px-12 sm:py-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Questions before you visit?</h2>
            <p className="text-white/70 mt-3">
              Ask about food, timings, deposits or a bed for a friend. Message or call us directly.
            </p>
          </div>
          {contact ? (
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a
                href={whatsappLink(contact.whatsapp || contact.phone, `Hi, I'm looking for a PG with ${BRAND_NAME}.`)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-leaf hover:bg-[#188a4a] font-semibold whitespace-nowrap"
              >
                <MessageCircle className="w-5 h-5" /> WhatsApp us
              </a>
              <a
                href={callLink(contact.phone)}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white text-ink hover:bg-chalk font-semibold whitespace-nowrap"
              >
                <Phone className="w-5 h-5" /> Call {contact.phone}
              </a>
            </div>
          ) : (
            <a
              href="#pgs"
              className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-white text-ink font-semibold"
            >
              Browse PGs
            </a>
          )}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <div className="flex items-center gap-2.5">
            <img src={BRAND_LOGO} alt="" className="w-7 h-7 rounded-lg object-cover border border-line bg-white" />
            <span>
              © {new Date().getFullYear()} {BRAND_NAME}
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#pgs" className="hover:text-ink">PGs</a>
            <a href="#booking" className="hover:text-ink">How booking works</a>
            <Link href="/admin" className="hover:text-ink">Owner & tenant login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
