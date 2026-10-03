import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Point Group – PG Management",
  description: "Admin and tenant portal for Study Point Group PGs.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
