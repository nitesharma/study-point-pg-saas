"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { PGListing } from "../../lib/db";
import { startingPrice, totalBedsAvailable } from "../../lib/catalogue";

function BedTiles({ count, delay }: { count: number; delay: number }) {
  if (count === 0) {
    return (
      <span className="font-board text-[11px] font-bold tracking-widest text-white/40 px-2 py-1.5 rounded-md bg-white/5">
        FULL
      </span>
    );
  }
  const digits = String(Math.min(count, 99)).padStart(2, "0").split("");
  return (
    <span className="flex gap-1" aria-label={`${count} beds open`} style={{ perspective: 400 }}>
      {digits.map((d, i) => (
        <span
          key={i}
          className="flip-in relative w-7 h-9 rounded-md bg-ink-soft border border-white/10 flex items-center justify-center font-board text-lg font-bold text-[#5ee39a] overflow-hidden"
          style={{ animationDelay: `${delay + i * 80}ms` }}
        >
          {d}
          <span className="absolute inset-x-0 top-1/2 h-px bg-ink/70" aria-hidden />
        </span>
      ))}
    </span>
  );
}

export default function VacancyBoard({ listings, loading }: { listings: PGListing[]; loading: boolean }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    const timer = setInterval(update, 30_000);
    const first = setTimeout(update, 0);
    return () => {
      clearInterval(timer);
      clearTimeout(first);
    };
  }, []);

  const rows = [...listings]
    .sort((a, b) => totalBedsAvailable(b) - totalBedsAvailable(a))
    .slice(0, 6);
  const totalBeds = listings.reduce((s, l) => s + totalBedsAvailable(l), 0);
  const openPgs = listings.filter((l) => totalBedsAvailable(l) > 0).length;

  return (
    <div className="bg-ink text-white rounded-3xl p-5 sm:p-6 shadow-[0_30px_60px_-30px_rgba(20,33,61,0.6)] ring-1 ring-white/5">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10">
        <p className="font-board text-[11px] font-bold tracking-[0.2em] uppercase text-white/80 flex items-center gap-2">
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-[#5ee39a] motion-safe:animate-ping opacity-60" />
            <span className="relative w-2 h-2 rounded-full bg-[#5ee39a]" />
          </span>
          Beds open today
        </p>
        {time && <p className="font-board text-[11px] text-white/50">as of {time}</p>}
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 sm:gap-x-6 pt-3 pb-1 font-board text-[10px] uppercase tracking-widest text-white/40">
        <span>PG</span>
        <span className="text-right">Rent from</span>
        <span className="text-right w-[60px]">Beds</span>
      </div>

      <ul className="divide-y divide-white/10">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="py-3.5 flex items-center gap-4">
                <span className="h-4 flex-1 rounded bg-white/10 animate-pulse" />
                <span className="h-9 w-[60px] rounded bg-white/10 animate-pulse" />
              </li>
            ))
          : rows.map((l, i) => {
              const price = startingPrice(l);
              return (
                <li key={l.id}>
                  <Link
                    href={`/catalogue/${l.id}`}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 sm:gap-x-6 py-3 -mx-2 px-2 rounded-lg hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-marigold"
                  >
                    <span className="min-w-0">
                      <span className="block font-display font-semibold text-[15px] truncate">{l.title}</span>
                      <span className="block text-xs text-white/50 truncate">
                        {[l.locality, l.city].filter(Boolean).join(", ")}
                      </span>
                    </span>
                    <span className="font-board text-sm text-right text-white/85">
                      {price ? `₹${price.toLocaleString("en-IN")}` : "—"}
                    </span>
                    <span className="w-[60px] flex justify-end">
                      <BedTiles count={totalBedsAvailable(l)} delay={200 + i * 120} />
                    </span>
                  </Link>
                </li>
              );
            })}
      </ul>

      {!loading && rows.length === 0 && (
        <p className="py-8 text-sm text-white/60 text-center">
          Vacancies will show here as soon as our PGs are listed.
        </p>
      )}

      {!loading && rows.length > 0 && (
        <div className="flex items-center justify-between gap-3 pt-4 mt-1 border-t border-white/10">
          <p className="text-xs text-white/60">
            <span className="font-board font-bold text-white">{totalBeds}</span> beds open across{" "}
            <span className="font-board font-bold text-white">{openPgs}</span> PG{openPgs === 1 ? "" : "s"}
          </p>
          <a href="#pgs" className="inline-flex items-center gap-1 text-xs font-semibold text-marigold hover:underline">
            See all PGs <ArrowDown className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
