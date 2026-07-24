'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CreditCard, Lock, Sparkles } from 'lucide-react';
import ResultGallery from './ResultGallery';

interface Props {
  /** Payment gate — shown after analysis when SKIP_PAYMENT is false; never exposes season/colors. */
  readyToPay: boolean;
  paying: boolean;
  price: number;
  onPay: () => void;
  /** SKIP_PAYMENT mode — season name shown directly, no payment gate. */
  resultSeason: string | null;
  onReset: () => void;
}

/** Post-analysis panels: the payment gate and the (temporary, SKIP_PAYMENT) direct result. */
export default function AnalysisResult({ readyToPay, paying, price, onPay, resultSeason, onReset }: Props) {
  return (
    <>
      {/* Payment gate — шинжилгээ дууссаны дараа л харагдана, result харуулахгүй */}
      <AnimatePresence>
        {readyToPay && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-violet-100 bg-violet-50/60 px-6 py-5 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                <Sparkles className="h-5 w-5 text-violet-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Your analysis is ready!</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pay to receive your full PDF report
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between rounded-xl border border-violet-100 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
                Detailed results + PDF report
              </div>
              <span className="text-base font-bold text-slate-800">{price.toLocaleString()}₮</span>
            </div>

            {/* Pay button */}
            <button
              onClick={onPay}
              disabled={paying}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-200/70 transition-all duration-300 hover:scale-[1.025] active:scale-[0.975] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {paying ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                    Redirecting to QPay...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" strokeWidth={1.75} />
                    Get PDF Report — {price.toLocaleString()}₮
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>

            {/* Reset link */}
            <button
              type="button"
              onClick={onReset}
              className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors text-center"
            >
              ← Run a new analysis
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SKIP_PAYMENT result — 2Checkout зөвшөөрөл хүлээгдэж байгаа тул season-ыг шууд харуулна */}
      <AnimatePresence>
        {resultSeason && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-violet-100 bg-violet-50/60 px-6 py-5 space-y-4 text-center"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
                <Sparkles className="h-6 w-6 text-violet-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-500">Your Personal Color</p>
                <p className="mt-1 text-2xl font-bold bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent"
                  style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                  {resultSeason}
                </p>
              </div>
            </div>

            <ResultGallery seasonName={resultSeason} />

            <button
              type="button"
              onClick={onReset}
              className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors text-center"
            >
              ← Run a new analysis
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
