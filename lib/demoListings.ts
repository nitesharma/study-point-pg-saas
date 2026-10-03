import type { PGListing } from "./db";

const photo = (id: string) => `https://images.unsplash.com/${id}?w=1600&q=75&auto=format&fit=crop`;

const DESCRIPTION =
  "Fully furnished rooms with a bed, study table, chair and wardrobe for every resident. " +
  "Breakfast and dinner are cooked fresh in the PG kitchen, rooms are cleaned daily, " +
  "and the common study hall stays open late for exam season.";

type DemoSeed = Omit<PGListing, "phone" | "whatsapp" | "updatedAt">;

/**
 * Sample PGs used to demo the public catalogue. They are flagged `isDemo` so they can be
 * shown with a "Demo" badge and removed in one click from Admin → PG Catalogue.
 * Contact numbers are filled in when an admin adds them (see withContact).
 */
const DEMO_SEEDS: DemoSeed[] = [
  {
    id: "demo-mukherjee-nagar",
    propertyId: "demo-mukherjee-nagar",
    isDemo: true,
    published: true,
    title: "Study Point Boys PG",
    tagline: "Two minutes' walk from GTB Nagar metro",
    description: DESCRIPTION,
    gender: "boys",
    address: "12, Banda Bahadur Marg",
    locality: "Mukherjee Nagar",
    city: "Delhi",
    mapQuery: "Mukherjee Nagar, Delhi",
    images: [
      photo("photo-1555854877-bab0e564b8d5"),
      photo("photo-1522771739844-6a9f6d5f14af"),
      photo("photo-1505693416388-ac5ce068fe85"),
      photo("photo-1540518614846-7eded433c457"),
    ],
    videos: [],
    amenities: ["ac", "wifi", "food", "housekeeping", "lift", "cctv", "ro", "study", "power"],
    pricing: [
      { sharing: "Single", price: 12500, bedsAvailable: 1 },
      { sharing: "Double", price: 8500, bedsAvailable: 3 },
      { sharing: "Triple", price: 7000, bedsAvailable: 2 },
    ],
    securityDeposit: 10000,
    foodIncluded: true,
    houseRules: "Main gate closes at 10:30 PM.\nVisitors are allowed in the lobby until 8 PM.\nNo smoking inside the building.",
  },
  {
    id: "demo-kingsway-camp",
    propertyId: "demo-kingsway-camp",
    isDemo: true,
    published: true,
    title: "Study Point Girls Residency",
    tagline: "Women-only building with a warden on every floor",
    description: DESCRIPTION,
    gender: "girls",
    address: "4, Hudson Lane",
    locality: "Kingsway Camp",
    city: "Delhi",
    mapQuery: "Hudson Lane, Kingsway Camp, Delhi",
    images: [
      photo("photo-1586023492125-27b2c045efd7"),
      photo("photo-1560448204-e02f11c3d0e2"),
      photo("photo-1513694203232-719a280e022f"),
    ],
    videos: [],
    amenities: ["ac", "wifi", "food", "housekeeping", "security", "laundry", "geyser", "cctv", "attached_bath"],
    pricing: [
      { sharing: "Double", price: 9500, bedsAvailable: 2 },
      { sharing: "Triple", price: 7500, bedsAvailable: 0 },
    ],
    securityDeposit: 12000,
    foodIncluded: true,
    houseRules: "Gate closes at 9:30 PM.\nOnly female visitors are allowed inside rooms.",
  },
  {
    id: "demo-old-rajinder-nagar",
    propertyId: "demo-old-rajinder-nagar",
    isDemo: true,
    published: true,
    title: "Study Point Rajinder Nagar",
    tagline: "Walk to the coaching lanes in five minutes",
    description: DESCRIPTION,
    gender: "co-living",
    address: "22, Bada Bazaar Road",
    locality: "Old Rajinder Nagar",
    city: "Delhi",
    mapQuery: "Bada Bazaar Road, Old Rajinder Nagar, Delhi",
    images: [photo("photo-1502672260266-1c1ef2d93688"), photo("photo-1493809842364-78817add7ffb")],
    videos: [],
    amenities: ["wifi", "housekeeping", "power", "ro", "study", "common_area"],
    pricing: [
      { sharing: "Triple", price: 6000, bedsAvailable: 0 },
      { sharing: "Four Sharing", price: 5000, bedsAvailable: 0 },
    ],
    securityDeposit: 6000,
    foodIncluded: false,
    houseRules: "Separate floors for men and women.\nQuiet hours from 11 PM to 7 AM.",
  },
  {
    id: "demo-laxmi-nagar",
    propertyId: "demo-laxmi-nagar",
    isDemo: true,
    published: true,
    title: "Study Point Laxmi Nagar",
    tagline: "Budget beds near Nirman Vihar metro",
    description: DESCRIPTION,
    gender: "boys",
    address: "B-14, Vikas Marg",
    locality: "Laxmi Nagar",
    city: "Delhi",
    mapQuery: "Vikas Marg, Laxmi Nagar, Delhi",
    images: [photo("photo-1598928506311-c55ded91a20c"), photo("photo-1536376072261-38c75010e6c9")],
    videos: [],
    amenities: ["wifi", "food", "parking", "ro", "laundry"],
    pricing: [
      { sharing: "Triple", price: 5800, bedsAvailable: 2 },
      { sharing: "Four Sharing", price: 4800, bedsAvailable: 5 },
    ],
    securityDeposit: 5000,
    foodIncluded: true,
    houseRules: "Gate closes at 11 PM.\nMonthly rent is due by the 5th.",
  },
  {
    id: "demo-mukherjee-nagar-premium",
    propertyId: "demo-mukherjee-nagar-premium",
    isDemo: true,
    published: true,
    title: "Study Point Premium Rooms",
    tagline: "Private AC rooms with attached washrooms",
    description: DESCRIPTION,
    gender: "co-living",
    address: "A-7, Commercial Complex",
    locality: "Mukherjee Nagar",
    city: "Delhi",
    mapQuery: "Commercial Complex, Mukherjee Nagar, Delhi",
    images: [photo("photo-1484154218962-a197022b5858"), photo("photo-1505693416388-ac5ce068fe85")],
    videos: [],
    amenities: ["ac", "wifi", "food", "housekeeping", "lift", "gym", "attached_bath", "fridge", "tv", "locker"],
    pricing: [
      { sharing: "Single", price: 16000, bedsAvailable: 2 },
      { sharing: "Double", price: 11000, bedsAvailable: 1 },
    ],
    securityDeposit: 15000,
    foodIncluded: true,
    houseRules: "Biometric entry, open 24 hours.\nGuests must be registered at reception.",
  },
];

export const DEMO_LISTING_IDS = DEMO_SEEDS.map((d) => d.id);

/** Demo listings with the admin-provided contact number filled in. */
export const buildDemoListings = (phone: string): PGListing[] =>
  DEMO_SEEDS.map((d) => ({ ...d, phone, whatsapp: phone, updatedAt: new Date().toISOString() }));
