import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PG details – Study Point Group",
  description:
    "Browse Study Point Group PGs with real photos, videos, amenities, transparent pricing, live bed availability and Google Maps location.",
};

export default function CatalogueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
