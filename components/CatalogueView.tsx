"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Store,
  Globe,
  Eye,
  EyeOff,
  Save,
  Loader2,
  MapPin,
  Phone,
  Images,
  Video,
  Sparkles,
  IndianRupee,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Inbox,
  MessageCircle,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { dbService, Enquiry, PGListing, Property, Room, SharingType } from "../lib/db";
import {
  AMENITIES,
  SHARING_TYPES,
  callLink,
  createDefaultListing,
  mapEmbedUrl,
  pricingFromRooms,
  whatsappLink,
} from "../lib/catalogue";
import MediaUpload from "./ui/MediaUpload";

interface CatalogueViewProps {
  properties: Property[];
  selectedPropertyId: string;
  rooms: Room[];
}

const inputCls =
  "w-full p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";
const labelCls = "text-xs font-bold text-slate-500";

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
  action,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function CatalogueView({ properties, selectedPropertyId, rooms }: CatalogueViewProps) {
  const property = properties.find((p) => p.id === selectedPropertyId);
  const [tab, setTab] = useState<"listing" | "enquiries">("listing");
  const [listing, setListing] = useState<PGListing | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [copied, setCopied] = useState(false);
  const [demoCount, setDemoCount] = useState(0);
  const [demoPhone, setDemoPhone] = useState("");
  const [demoBusy, setDemoBusy] = useState(false);

  useEffect(() => {
    if (!property) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [existing, enq, all] = await Promise.all([
        dbService.getListing(property.id),
        dbService.getEnquiries(property.id),
        dbService.getListings(),
      ]);
      if (cancelled) return;
      setDemoCount(all.filter((l) => l.isDemo).length);
      setDemoPhone(existing?.phone || "");
      setIsNew(!existing);
      setListing(existing || createDefaultListing(property, rooms));
      setEnquiries(enq);
      setSavedAt(null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // Rooms are only used to seed a brand-new listing; reloading on room edits would discard unsaved changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property?.id]);

  const publicUrl = useMemo(
    () => (typeof window !== "undefined" && property ? `${window.location.origin}/catalogue/${property.id}` : ""),
    [property]
  );

  if (!property) {
    return <p className="text-sm text-slate-500">Select a property to manage its catalogue listing.</p>;
  }

  if (loading || !listing) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        <span className="text-sm">Loading catalogue…</span>
      </div>
    );
  }

  const update = <K extends keyof PGListing>(key: K, value: PGListing[K]) =>
    setListing((prev) => (prev ? { ...prev, [key]: value } : prev));

  const toggleAmenity = (id: string) =>
    update(
      "amenities",
      listing.amenities.includes(id) ? listing.amenities.filter((a) => a !== id) : [...listing.amenities, id]
    );

  const updatePricing = (index: number, patch: Partial<PGListing["pricing"][number]>) =>
    update(
      "pricing",
      listing.pricing.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );

  const unusedSharing = SHARING_TYPES.filter((s) => !listing.pricing.some((p) => p.sharing === s));

  const handleSave = async (publish?: boolean) => {
    if (!listing.title.trim()) {
      alert("Please enter a PG name / title.");
      return;
    }
    const next: PGListing = {
      ...listing,
      published: publish ?? listing.published,
      updatedAt: new Date().toISOString(),
    };
    if (next.published && (!next.phone.trim() || !next.city.trim())) {
      alert("Add at least a contact phone number and city before publishing.");
      return;
    }
    setSaving(true);
    try {
      await dbService.saveListing(next);
      setListing(next);
      setIsNew(false);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
      alert("Could not save the listing. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEnquiryStatus = async (id: string, status: Enquiry["status"]) => {
    await dbService.updateEnquiryStatus(id, status);
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  };

  const handleDeleteEnquiry = async (id: string) => {
    if (!confirm("Delete this enquiry?")) return;
    await dbService.deleteEnquiry(id);
    setEnquiries((prev) => prev.filter((e) => e.id !== id));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt("Copy this link:", publicUrl);
    }
  };

  const newEnquiries = enquiries.filter((e) => e.status === "new").length;

  const handleAddDemos = async () => {
    if (demoPhone.replace(/\D/g, "").length < 10) {
      alert("Enter the 10-digit number visitors should call or WhatsApp from the demo PGs.");
      return;
    }
    setDemoBusy(true);
    try {
      await dbService.addDemoListings(demoPhone.trim());
      setDemoCount((await dbService.getListings()).filter((l) => l.isDemo).length);
    } catch (err) {
      console.error(err);
      alert("Could not add the demo PGs. Please try again.");
    } finally {
      setDemoBusy(false);
    }
  };

  const handleRemoveDemos = async () => {
    if (!confirm("Remove all demo PGs from your website?")) return;
    setDemoBusy(true);
    try {
      await dbService.removeDemoListings();
      setDemoCount(0);
    } catch (err) {
      console.error(err);
      alert("Could not remove the demo PGs. Please try again.");
    } finally {
      setDemoBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Store className="w-7 h-7 text-indigo-600" /> PG Catalogue
          </h2>
          <p className="text-slate-500 text-sm">
            Showcase <span className="font-semibold text-slate-700">{property.name}</span> on your public website with
            photos, videos, pricing, amenities and location.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold"
          >
            <Globe className="w-4 h-4" /> Website home
          </a>
          {!isNew && (
            <a
              href={`/catalogue/${property.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              <ExternalLink className="w-4 h-4" /> Preview listing
            </a>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border ${
          listing.published ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
        }`}
      >
        <div className="flex items-center gap-3">
          {listing.published ? (
            <Eye className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <EyeOff className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div>
            <p className={`text-sm font-bold ${listing.published ? "text-emerald-800" : "text-amber-800"}`}>
              {listing.published ? "Live on your website" : isNew ? "Not created yet" : "Hidden (draft)"}
            </p>
            <p className="text-xs text-slate-600 break-all">
              {listing.published ? publicUrl : "Publish to make this PG visible on the public catalogue."}
            </p>
          </div>
        </div>
        {listing.published && (
          <button
            onClick={copyLink}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100"
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        )}
      </div>

      {/* Demo PGs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl border border-dashed border-slate-300 bg-white">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-slate-900">
              {demoCount > 0 ? `${demoCount} demo PGs are live on your website` : "Try the website with demo PGs"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {demoCount > 0
                ? "They're marked “Demo” for visitors. Remove them before you share the site with real customers."
                : "Adds 5 sample PGs with photos, prices and amenities so you can test search, filters and enquiries."}
            </p>
          </div>
        </div>
        {demoCount > 0 ? (
          <button
            onClick={handleRemoveDemos}
            disabled={demoBusy}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold disabled:opacity-50 shrink-0"
          >
            {demoBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Remove demo PGs
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <input
              type="tel"
              value={demoPhone}
              onChange={(e) => setDemoPhone(e.target.value)}
              placeholder="Contact number for demos"
              aria-label="Contact number for demo PGs"
              className="p-2.5 rounded-xl text-sm bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:w-56"
            />
            <button
              onClick={handleAddDemos}
              disabled={demoBusy}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
            >
              {demoBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add demo PGs
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 w-full sm:w-fit">
        {[
          { id: "listing" as const, label: "Listing Details", icon: Store },
          { id: "enquiries" as const, label: `Enquiries${newEnquiries ? ` (${newEnquiries} new)` : ""}`, icon: Inbox },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "listing" ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Basics */}
          <Section icon={Store} title="Basic Details" subtitle="What visitors see first on the listing card.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className={labelCls}>PG Name *</label>
                <input className={inputCls} value={listing.title} onChange={(e) => update("title", e.target.value)} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className={labelCls}>Tagline</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Premium PG near Metro with home-cooked food"
                  value={listing.tagline || ""}
                  onChange={(e) => update("tagline", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>PG For</label>
                <select
                  className={inputCls}
                  value={listing.gender}
                  onChange={(e) => update("gender", e.target.value as PGListing["gender"])}
                >
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                  <option value="co-living">Co-living (Unisex)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Security Deposit (₹)</label>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={listing.securityDeposit || ""}
                  onChange={(e) => update("securityDeposit", Number(e.target.value) || 0)}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className={labelCls}>Description</label>
                <textarea
                  rows={4}
                  className={inputCls}
                  placeholder="Describe rooms, food, neighbourhood, nearby colleges/offices…"
                  value={listing.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className={labelCls}>House Rules</label>
                <textarea
                  rows={2}
                  className={inputCls}
                  placeholder="e.g. Gate closes at 10:30 PM, no smoking…"
                  value={listing.houseRules || ""}
                  onChange={(e) => update("houseRules", e.target.value)}
                />
              </div>
            </div>
          </Section>

          {/* Location & contact */}
          <Section icon={MapPin} title="Location & Contact" subtitle="Powers Google Maps, Call, WhatsApp and Directions.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className={labelCls}>Full Address</label>
                <input className={inputCls} value={listing.address} onChange={(e) => update("address", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Locality / Area</label>
                <input
                  className={inputCls}
                  value={listing.locality || ""}
                  onChange={(e) => update("locality", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>City *</label>
                <input className={inputCls} value={listing.city} onChange={(e) => update("city", e.target.value)} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className={labelCls}>Google Maps Pin (optional)</label>
                <input
                  className={inputCls}
                  placeholder='Coordinates like "28.6139,77.2090" or exact place name'
                  value={listing.mapQuery || ""}
                  onChange={(e) => update("mapQuery", e.target.value)}
                />
                <p className="text-[11px] text-slate-400">Leave empty to locate using the address above.</p>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Call Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    className={`${inputCls} pl-9`}
                    placeholder="98XXXXXXXX"
                    value={listing.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>WhatsApp Number</label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    className={`${inputCls} pl-9`}
                    placeholder="Same as call number"
                    value={listing.whatsapp}
                    onChange={(e) => update("whatsapp", e.target.value)}
                  />
                </div>
              </div>
            </div>
            {(listing.address || listing.mapQuery) && (
              <iframe
                title="Map preview"
                src={mapEmbedUrl(listing)}
                className="w-full h-48 rounded-xl border border-slate-200"
                loading="lazy"
              />
            )}
          </Section>

          {/* Pricing & availability */}
          <Section
            icon={IndianRupee}
            title="Pricing & Availability"
            subtitle="Monthly rent per bed and beds open for booking."
            action={
              <button
                type="button"
                onClick={() => {
                  const fromRooms = pricingFromRooms(rooms);
                  if (!fromRooms.length) {
                    alert("No rooms found for this property yet.");
                    return;
                  }
                  update("pricing", fromRooms);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold shrink-0"
                title="Fill rent and vacant beds from Rooms & Beds"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sync from rooms
              </button>
            }
          >
            <div className="space-y-3">
              {listing.pricing.length === 0 && (
                <p className="text-sm text-slate-500">No sharing options yet. Add one below or sync from rooms.</p>
              )}
              {listing.pricing.map((p, i) => (
                <div
                  key={p.sharing}
                  className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.2fr_1fr_1fr_auto] gap-3 items-end p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className={labelCls}>Sharing</label>
                    <select
                      className={inputCls}
                      value={p.sharing}
                      onChange={(e) => updatePricing(i, { sharing: e.target.value as SharingType })}
                    >
                      {[p.sharing, ...unusedSharing].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Rent / month (₹)</label>
                    <input
                      type="number"
                      min={0}
                      className={inputCls}
                      value={p.price || ""}
                      onChange={(e) => updatePricing(i, { price: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Beds available</label>
                    <input
                      type="number"
                      min={0}
                      className={inputCls}
                      value={p.bedsAvailable}
                      onChange={(e) => updatePricing(i, { bedsAvailable: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => update("pricing", listing.pricing.filter((_, idx) => idx !== i))}
                    className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {unusedSharing.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    update("pricing", [...listing.pricing, { sharing: unusedSharing[0], price: 0, bedsAvailable: 0 }])
                  }
                  className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Plus className="w-4 h-4" /> Add sharing option
                </button>
              )}
              <label className="flex items-center gap-2 text-sm text-slate-700 pt-1">
                <input
                  type="checkbox"
                  checked={!!listing.foodIncluded}
                  onChange={(e) => update("foodIncluded", e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                Meals included in rent
              </label>
            </div>
          </Section>

          {/* Amenities */}
          <Section icon={Sparkles} title="Amenities" subtitle="Tap to toggle what this PG offers.">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITIES.map((a) => {
                const active = listing.amenities.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAmenity(a.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      active
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <a.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Photos */}
          <div className="xl:col-span-2">
            <Section icon={Images} title="Photos" subtitle="The first photo is used as the cover image.">
              <MediaUpload
                kind="image"
                folder={`catalogue/${property.id}/images`}
                value={listing.images}
                onChange={(urls) => update("images", urls)}
              />
            </Section>
          </div>

          {/* Videos */}
          <div className="xl:col-span-2">
            <Section icon={Video} title="Videos" subtitle="Upload a walkthrough or paste a YouTube link.">
              <MediaUpload
                kind="video"
                folder={`catalogue/${property.id}/videos`}
                value={listing.videos}
                onChange={(urls) => update("videos", urls)}
              />
            </Section>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {enquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Inbox className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">No enquiries yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Enquiries submitted from your public listing will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {enquiries.map((e) => (
                <li key={e.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900">{e.name}</p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          e.status === "new"
                            ? "bg-indigo-100 text-indigo-700"
                            : e.status === "contacted"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {e.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {e.phone} · {new Date(e.createdAt).toLocaleString()}
                      {e.preferredSharing ? ` · ${e.preferredSharing}` : ""}
                      {e.moveInDate ? ` · Move-in ${new Date(e.moveInDate).toLocaleDateString()}` : ""}
                    </p>
                    {e.message && <p className="text-sm text-slate-700 break-words">{e.message}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <a
                      href={whatsappLink(e.phone, `Hi ${e.name}, thanks for your enquiry about ${listing.title}.`)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => e.status === "new" && handleEnquiryStatus(e.id, "contacted")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                    <a
                      href={callLink(e.phone)}
                      onClick={() => e.status === "new" && handleEnquiryStatus(e.id, "contacted")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                    <select
                      value={e.status}
                      onChange={(ev) => handleEnquiryStatus(e.id, ev.target.value as Enquiry["status"])}
                      className="px-2 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={() => handleDeleteEnquiry(e.id)}
                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                      title="Delete enquiry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sticky save bar */}
      {tab === "listing" && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              {savedAt ? `Saved at ${savedAt}` : "Changes are not visible publicly until saved."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleSave()}
                disabled={saving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
              <button
                onClick={() => handleSave(!listing.published)}
                disabled={saving}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm disabled:opacity-50 ${
                  listing.published ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {listing.published ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                {listing.published ? "Unpublish" : "Save & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
