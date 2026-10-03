import Link from "next/link";
import { LogIn } from "lucide-react";
import { BRAND_LOGO, BRAND_NAME } from "../../lib/catalogue";

const NAV = [
  { href: "/#pgs", label: "PGs" },
  { href: "/#booking", label: "How booking works" },
  { href: "/#contact", label: "Contact" },
];

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 bg-chalk/85 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-ink">
          <img src={BRAND_LOGO} alt="" className="w-9 h-9 rounded-xl object-cover border border-line bg-white" />
          <span className="font-display font-bold text-[17px] tracking-tight text-ink truncate">{BRAND_NAME}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="hidden md:inline-flex px-3 py-2 rounded-lg font-medium text-muted hover:text-ink hover:bg-white"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="ml-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-white bg-ink hover:bg-ink-soft"
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
