'use client';

import Link from 'next/link';
import { Menu, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';

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
      <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between rounded-4xl border border-white/70 bg-white/70 px-6 py-4 shadow-lg shadow-slate-200/40 backdrop-blur-xl">
        <Link
          href="/"
          className="group flex items-center gap-3 pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
        >
          <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-slate-900 text-white shadow-sm shadow-slate-200">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-400 opacity-90" />
            <Sparkles className="relative h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-slate-900">
              Personal Color
            </div>
            
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              {item.label}
            </a>
          ))}
          {!isSignedIn && (
            <a
              href="#search-result"
              className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              Өмнөх үр дүн хайх
            </a>
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
              <Link
                href="#upload"
                className="rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:scale-[1.04] hover:shadow-violet-300 focus:outline-none active:scale-[0.97]"
              >
                Шинжилгээ эхлүүлэх
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center border border-slate-200 bg-white/70 p-2.5 text-slate-700 shadow-sm shadow-slate-200/60 backdrop-blur-sm transition-colors hover:bg-white lg:hidden"
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
                <div className="flex items-center gap-3">
                  <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-slate-900 text-white">
                    <div className="absolute h-10 w-10 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-400 opacity-90" />
                    <Sparkles className="relative h-5 w-5" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold tracking-tight text-slate-900">
                      Personal Color
                    </div>
                    <div className="text-[11px] font-medium text-slate-500">AI шинжилгээ</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center border border-slate-200 bg-white/70 p-2.5 text-slate-700 shadow-sm shadow-slate-200/60 backdrop-blur-sm transition-colors hover:bg-white"
                  aria-label="Цэс хаах"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-1 px-3 pb-4">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <span>{item.label}</span>
                    <span className="text-slate-400">→</span>
                  </a>
                ))}
                {!isSignedIn && (
                  <a
                    href="#search-result"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <span>Өмнөх үр дүн хайх</span>
                    <span className="text-slate-400">→</span>
                  </a>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2 px-1">
                  <Link
                    href="#signin"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-200/60 transition-colors hover:bg-slate-50"
                  >
                    Нэвтрэх
                  </Link>
                  <Link
                    href="#upload"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:scale-[1.03] hover:shadow-violet-300 active:scale-[0.97]"
                  >
                    Шинжилгээ эхлүүлэх
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
