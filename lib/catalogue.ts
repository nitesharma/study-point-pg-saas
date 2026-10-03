import {
  AirVent,
  Wifi,
  Utensils,
  Sparkles,
  ArrowUpDown,
  Car,
  WashingMachine,
  Droplets,
  Tv,
  Refrigerator,
  Cctv,
  ShieldCheck,
  Zap,
  Dumbbell,
  BookOpen,
  Flame,
  BedDouble,
  Bath,
  Sofa,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { PGListing, Property, Room, SharingType } from "./db";

export const AMENITIES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "ac", label: "AC Rooms", icon: AirVent },
  { id: "wifi", label: "High-speed Wi-Fi", icon: Wifi },
  { id: "food", label: "Food / Meals", icon: Utensils },
  { id: "housekeeping", label: "Housekeeping", icon: Sparkles },
  { id: "lift", label: "Lift", icon: ArrowUpDown },
  { id: "parking", label: "Parking", icon: Car },
  { id: "laundry", label: "Washing Machine", icon: WashingMachine },
  { id: "ro", label: "RO Drinking Water", icon: Droplets },
  { id: "tv", label: "TV", icon: Tv },
  { id: "fridge", label: "Fridge", icon: Refrigerator },
  { id: "cctv", label: "CCTV", icon: Cctv },
  { id: "security", label: "24x7 Security", icon: ShieldCheck },
  { id: "power", label: "Power Backup", icon: Zap },
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "study", label: "Study Area", icon: BookOpen },
  { id: "geyser", label: "Geyser / Hot Water", icon: Flame },
  { id: "furnished", label: "Fully Furnished", icon: BedDouble },
  { id: "attached_bath", label: "Attached Washroom", icon: Bath },
  { id: "common_area", label: "Common Lounge", icon: Sofa },
  { id: "locker", label: "Personal Locker", icon: Lock },
];

export const amenityById = (id: string) => AMENITIES.find((a) => a.id === id);

export const SHARING_TYPES: SharingType[] = ["Single", "Double", "Triple", "Four Sharing"];

export const GENDER_LABELS: Record<PGListing["gender"], string> = {
  boys: "Boys",
  girls: "Girls",
  "co-living": "Co-living",
};

/** Normalises an Indian phone number to the digits-only international format wa.me / tel: expect. */
export const toInternationalPhone = (phone: string): string => {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
};

export const whatsappLink = (phone: string, text: string) =>
  `https://wa.me/${toInternationalPhone(phone)}?text=${encodeURIComponent(text)}`;

export const callLink = (phone: string) => `tel:+${toInternationalPhone(phone)}`;

const mapTarget = (l: Pick<PGListing, "mapQuery" | "address" | "locality" | "city" | "title">) =>
  (l.mapQuery && l.mapQuery.trim()) ||
  [l.title, l.address, l.locality, l.city].filter(Boolean).join(", ");

export const mapEmbedUrl = (l: Pick<PGListing, "mapQuery" | "address" | "locality" | "city" | "title">) =>
  `https://www.google.com/maps?q=${encodeURIComponent(mapTarget(l))}&z=15&output=embed`;

export const directionsUrl = (l: Pick<PGListing, "mapQuery" | "address" | "locality" | "city" | "title">) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapTarget(l))}`;

/** Returns a YouTube embed URL for watch/short/youtu.be links, or null for any other video URL. */
export const youtubeEmbedUrl = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

export const startingPrice = (l: PGListing): number | null => {
  const prices = l.pricing.filter((p) => p.price > 0).map((p) => p.price);
  return prices.length ? Math.min(...prices) : null;
};

export const totalBedsAvailable = (l: PGListing) =>
  l.pricing.reduce((sum, p) => sum + (p.bedsAvailable || 0), 0);

/** Derives per-sharing price and live vacancy from the property's rooms & beds. */
export const pricingFromRooms = (rooms: Room[]) =>
  SHARING_TYPES.map((sharing) => {
    const ofType = rooms.filter((r) => r.type === sharing);
    const rents = ofType.map((r) => r.rent).filter((r) => r > 0);
    return {
      sharing,
      price: rents.length ? Math.min(...rents) : 0,
      bedsAvailable: ofType.reduce(
        (sum, r) => sum + r.beds.filter((b) => b.status === "available").length,
        0
      ),
    };
  }).filter((p) => p.price > 0 || p.bedsAvailable > 0);

export const createDefaultListing = (property: Property, rooms: Room[]): PGListing => ({
  id: property.id,
  propertyId: property.id,
  published: false,
  title: property.name,
  tagline: "",
  description: "",
  gender: "co-living",
  address: property.address || "",
  locality: "",
  city: "",
  mapQuery: "",
  phone: "",
  whatsapp: "",
  images: property.logoUrl ? [property.logoUrl] : [],
  videos: [],
  amenities: ["wifi", "housekeeping", "ro", "cctv"],
  pricing: pricingFromRooms(rooms),
  securityDeposit: 0,
  foodIncluded: false,
  houseRules: "",
  updatedAt: new Date().toISOString(),
});

export const BRAND_NAME = "Study Point Group";
export const BRAND_LOGO = "/images/logo.jpeg";

export const sharingLabel = (s: SharingType) =>
  s === "Single" ? "Single Room" : s === "Four Sharing" ? s : `${s} Sharing`;
