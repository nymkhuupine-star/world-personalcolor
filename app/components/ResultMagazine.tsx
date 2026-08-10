'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import supabase from '@/utils/supabase';
import { resolveFullSeasonName } from '@/utils/reportPdfs';

interface Props {
  /** Full 12-season name, e.g. "Light Spring" — exactly what the rule engine produces. */
  seasonName: string;
  /** Uploaded portrait's public URL — dropped into the circular slot on the cover page. */
  userPhotoUrl?: string;
  /** Shown as a small caption under the user's photo on the cover page. */
  userEmail?: string;
}

const pageVariants = {
  enter: (direction: number) => ({ rotateY: direction > 0 ? 90 : -90, opacity: 0 }),
  center: { rotateY: 0, opacity: 1 },
  exit: (direction: number) => ({ rotateY: direction > 0 ? -90 : 90, opacity: 0 }),
};

/**
 * Magazine-style page-flip viewer for the admin-uploaded gallery images of the
 * user's resolved season — one image on screen at a time, flipped through with
 * prev/next controls (mirrors a physical style-guide booklet rather than a grid).
 */
export default function ResultMagazine({ seasonName, userPhotoUrl, userEmail }: Props) {
  const [urls, setUrls] = useState<string[] | null>(null);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setUrls(null);
    setPage(0);

    const resolved = resolveFullSeasonName(seasonName);
    if (!resolved) { setUrls([]); return; }

    (async () => {
      const { data } = await supabase.storage
        .from('reports')
        .list(`${resolved.season}/${resolved.subtype}/gallery`);
      if (cancelled) return;
      const imageUrls = (data ?? [])
        .filter((f) => f.name !== '.emptyFolderPlaceholder')
        .map((f) => supabase.storage
          .from('reports')
          .getPublicUrl(`${resolved.season}/${resolved.subtype}/gallery/${f.name}`).data.publicUrl);
      setUrls(imageUrls);
    })();

    return () => { cancelled = true; };
  }, [seasonName]);

  const count = urls?.length ?? 0;

  const goTo = (next: number) => {
    if (next < 0 || next >= count) return;
    setDirection(next > page ? 1 : -1);
    setPage(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(page + 1);
      if (e.key === 'ArrowLeft') goTo(page - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, count]);

  if (urls === null) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[2rem] border border-violet-100 bg-white/60">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 rounded-[2rem] border border-dashed border-violet-200 bg-white/60 text-center">
        <Images className="h-8 w-8 text-violet-300" strokeWidth={1.5} />
        <p className="px-8 text-sm text-slate-500">Sample images for this style are coming soon.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-violet-100 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.15)]"
        style={{ perspective: 1600, background: 'linear-gradient(135deg, #fdf4f0 0%, #f5f0ff 100%)' }}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={urls[page]}
            src={urls[page]}
            alt={`${seasonName} — page ${page + 1}`}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-full w-full object-contain"
            style={{ backfaceVisibility: 'hidden' }}
          />
        </AnimatePresence>

        {/* User's own portrait, dropped into the cover page's circular photo slot,
            with the email's local part (before @) as a badge to its right. */}
        {page === 0 && userPhotoUrl && (
          <div
            className="absolute z-10"
            style={{ left: '20%', top: '91%', width: '9%', transform: 'translate(-50%, -50%)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={userPhotoUrl}
              alt="Your photo"
              className="w-full rounded-full border-[3px] border-white object-cover shadow-lg"
              style={{ aspectRatio: '1 / 1' }}
            />
            {userEmail && (
              <p
                className="absolute top-1/2 max-w-[8rem] truncate rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm"
                style={{ left: '100%', marginLeft: '0.4rem', transform: 'translateY(-50%)' }}
              >
                {userEmail.split('@')[0]}
              </p>
            )}
          </div>
        )}

        {page > 0 && (
          <button
            type="button"
            onClick={() => goTo(page - 1)}
            aria-label="Previous page"
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        {page < count - 1 && (
          <button
            type="button"
            onClick={() => goTo(page + 1)}
            aria-label="Next page"
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
          </button>
        )}

        <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {page + 1} / {count}
        </div>
      </div>

      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to page ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === page ? 'w-6 bg-violet-500' : 'w-1.5 bg-violet-200 hover:bg-violet-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
