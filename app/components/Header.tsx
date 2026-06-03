'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SignInButton, SignOutButton, UserButton, useUser } from '@clerk/nextjs';

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '#how-it-works', label: 'Хэрхэн ажилладаг вэ' },
  { href: '#faq', label: 'Түгээмэл асуулт' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogo = () => {
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/');
    }
  };

  const handleNav = (hash: string) => {
    if (pathname === '/') {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(`/${hash}`);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
   <header className="sticky top-0 z-50  px-4 pt-4 lg:px-8 ">
      <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between rounded-4xl border border-white/70 bg-white/70 px-6 py-2 shadow-lg shadow-slate-200/40 backdrop-blur-xl">
        <button
          onClick={handleLogo}
          className="group flex items-center gap-3 pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
        >
          <div className="relative h-12 w-48">
            <Image src="/personal1.png" alt="Personal Color logo" fill sizes="192px" className="object-contain object-left" />
          </div>
        </button>

        <nav className="hidden items-center gap-2 lg:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              {item.label}
            </button>
          ))}
          {!isSignedIn && (
            <button
              onClick={() => handleNav('#search-result')}
              className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              Өмнөх үр дүн хайх
            </button>
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isSignedIn ? (
            <>
              <Link
                href="/my-results"
                className="px-4 py-2 text-sm font-semibold text-violet-600 transition-colors hover:bg-violet-50 rounded-full focus:outline-none"
              >
                Миний үр дүн
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none">
                  Нэвтрэх
                </button>
              </SignInButton>
              <button
                onClick={() => handleNav('#upload')}
                className="rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:scale-[1.04] hover:shadow-violet-300 focus:outline-none active:scale-[0.97]"
              >
                Шинжилгээ эхлүүлэх
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 p-2.5 text-slate-700 shadow-sm shadow-slate-200/60 backdrop-blur-sm transition-colors hover:bg-white lg:hidden"
          aria-label="Цэс нээх"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-7xl px-6 pt-4">
            <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-2xl shadow-slate-200/70 backdrop-blur-xl">
              <div className="flex items-center justify-between px-5 py-4">
                <button
                  onClick={() => { setOpen(false); handleLogo(); }}
                  className="flex items-center gap-3"
                >
                  <div className="relative h-12 w-48">
                    <Image src="/personal1.png" alt="Personal Color logo" fill sizes="192px" className="object-contain object-left" />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 p-2.5 text-slate-700 shadow-sm shadow-slate-200/60 backdrop-blur-sm transition-colors hover:bg-white"
                  aria-label="Цэс хаах"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-1 px-3 pb-4">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => { setOpen(false); handleNav(item.href); }}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <span>{item.label}</span>
                    <span className="text-slate-400">→</span>
                  </button>
                ))}
                {!isSignedIn && (
                  <button
                    onClick={() => { setOpen(false); handleNav('#search-result'); }}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <span>Өмнөх үр дүн хайх</span>
                    <span className="text-slate-400">→</span>
                  </button>
                )}

                {isSignedIn ? (
                  <div className="mt-3 flex flex-col gap-2 px-1">
                    <Link
                      href="/my-results"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center justify-center rounded-xl bg-violet-50 border border-violet-200 px-4 py-3 text-sm font-semibold text-violet-600 transition-colors hover:bg-violet-100"
                    >
                      Миний үр дүн
                    </Link>
                    <button
                      onClick={() => { setOpen(false); handleNav('#upload'); }}
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200"
                    >
                      Шинжилгээ эхлүүлэх
                    </button>
                    <SignOutButton redirectUrl="/">
                      <button
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50"
                      >
                        Гарах
                      </button>
                    </SignOutButton>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-2 px-1">
                    <SignInButton mode="modal">
                      <button
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                      >
                        Нэвтрэх
                      </button>
                    </SignInButton>
                    <button
                      onClick={() => { setOpen(false); handleNav('#upload'); }}
                      className="inline-flex items-center justify-center text-center rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:scale-[1.03] active:scale-[0.97]"
                    >
                      Шинжилгээ эхлүүлэх
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
