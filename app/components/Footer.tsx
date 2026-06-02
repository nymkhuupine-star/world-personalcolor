import { Sparkles } from 'lucide-react';
import Link from 'next/link';

const links = [
  { label: 'Хэрхэн ажилладаг вэ', href: '#how-it-works' },
  { label: 'Үнэ', href: '#pricing' },
  { label: 'Түгээмэл асуулт', href: '#faq' },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-slate-900 shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-400 opacity-90" />
              <Sparkles className="relative h-4 w-4 text-white" strokeWidth={1.5} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">Personal Color</p>
              {/* <p className="text-[11px] text-slate-400">AI шинжилгээ</p> */}
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-6">
            {links.map((l) => (
              <a key={l.href} href={l.href}
                className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Copy */}
          <p className="text-xs text-slate-300">
            © {new Date().getFullYear()} Personal Color 
          </p>
        </div>
      </div>
    </footer>
  );
}
