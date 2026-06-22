'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Mail, Download, ArrowRight, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';

// Webhook typically fires within 1-5s. Poll for up to 30s before showing manual retry.
const AUTO_RETRY_LIMIT    = 20;   // 20 × 3s = 60s
const AUTO_RETRY_INTERVAL = 3000; // ms

type State = 'verifying' | 'waiting' | 'success' | 'already' | 'unpaid' | 'error';
type EmailState = 'idle' | 'sending' | 'sent' | 'error';

type AnalysisResult = {
  season:            string;
  subType:           string;
  reasoning:         string;
  recommendedColors: string[];
};

type VerifyResponse = {
  success?:          boolean;
  paid?:             boolean;
  alreadyDelivered?: boolean;
  emailSent?:        boolean;
  error?:            string;
  pdfUrl?:           string | null;
  result?:           AnalysisResult;
  imageUrl?:         string;
};

const SEASON_MN: Record<string, string> = {
  Spring: 'Spring', Summer: 'Summer', Autumn: 'Autumn', Winter: 'Winter',
};

const SEASON_STYLE: Record<string, { gradient: string; bg: string; text: string; ring: string }> = {
  Spring: { gradient: 'from-rose-400 to-pink-300',     bg: 'bg-rose-50',   text: 'text-rose-600',   ring: 'ring-rose-100' },
  Summer: { gradient: 'from-violet-400 to-purple-300', bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100' },
  Autumn: { gradient: 'from-amber-400 to-orange-300',  bg: 'bg-amber-50',  text: 'text-amber-600',  ring: 'ring-amber-100' },
  Winter: { gradient: 'from-sky-400 to-blue-300',      bg: 'bg-sky-50',    text: 'text-sky-600',    ring: 'ring-sky-100' },
};

function PaymentSuccessContent() {
  const searchParams   = useSearchParams();
  const orderId        = searchParams.get('orderId');

  const [state, setState]           = useState<State>('verifying');
  const [errorMsg, setErrorMsg]     = useState('');
  const [retrying, setRetrying]     = useState(false);
  const [autoCount, setAutoCount]   = useState(0);
  const [pdfUrl, setPdfUrl]           = useState<string | null>(null);
  const [result, setResult]           = useState<AnalysisResult | null>(null);
  const [emailState, setEmailState]   = useState<EmailState>('idle');
  const [autoEmailSent, setAutoEmailSent] = useState(false);
  const autoCountRef = useRef(0);

  const verify = useCallback(async (): Promise<boolean> => {
    if (!orderId) {
      setState('error');
      setErrorMsg('Order number is missing.');
      return false;
    }
    try {
      const res  = await fetch(`/api/payment/verify?orderId=${encodeURIComponent(orderId)}`);
      const data = await res.json() as VerifyResponse;

      if (data.alreadyDelivered || (data.success && data.paid)) {
        setPdfUrl(data.pdfUrl ?? null);
        setResult(data.result ?? null);
        if (data.emailSent) setAutoEmailSent(true);
        setState(data.alreadyDelivered ? 'already' : 'success');
        return true;
      }

      if (data.success === false && data.paid === false) {
        return false;
      }

      setState('error');
      setErrorMsg(data.error ?? 'An error occurred during verification.');
      return false;
    } catch {
      setState('error');
      setErrorMsg('A network error occurred.');
      return false;
    }
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const run = async () => {
      const paid = await verify();
      if (paid || cancelled) return;

      setState('waiting');
      autoCountRef.current = 0;
      setAutoCount(0);

      const retry = async () => {
        if (cancelled) return;
        autoCountRef.current += 1;
        setAutoCount(autoCountRef.current);

        const success = await verify();
        if (success || cancelled) return;

        if (autoCountRef.current < AUTO_RETRY_LIMIT) {
          timer = setTimeout(retry, AUTO_RETRY_INTERVAL);
        } else {
          setState('unpaid');
        }
      };

      timer = setTimeout(retry, AUTO_RETRY_INTERVAL);
    };

    void run();
    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    setState('verifying');
    autoCountRef.current = 0;
    setAutoCount(0);
    const paid = await verify();
    if (!paid) setState('unpaid');
    setRetrying(false);
  };

  const handleRequestEmail = async () => {
    if (!orderId || emailState === 'sending' || emailState === 'sent') return;
    setEmailState('sending');
    try {
      const res = await fetch('/api/payment/request-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      setEmailState(res.ok ? 'sent' : 'error');
    } catch {
      setEmailState('error');
    }
  };

  const isSuccess = state === 'success' || state === 'already';

  return (
    <div className="rounded-none sm:rounded-[2rem] bg-white border-0 sm:border border-slate-100 shadow-none sm:shadow-xl p-6 sm:p-10 text-center space-y-6">

      {/* Verifying (first load) */}
      {state === 'verifying' && (
        <>
          <div className="flex justify-center">
            <Loader2 className="h-16 w-16 text-violet-400 animate-spin" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-slate-900">
              Verifying payment...
            </h1>
            <p className="text-sm text-slate-500">Please wait.</p>
          </div>
        </>
      )}

      {/* Waiting — auto-polling for webhook */}
      {state === 'waiting' && (
        <>
          <div className="flex justify-center">
            <Loader2 className="h-16 w-16 text-violet-400 animate-spin" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-slate-900">
              Waiting for confirmation...
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Checking payment. This will only take a few seconds.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: AUTO_RETRY_LIMIT }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  i < autoCount ? 'bg-violet-400' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Success / Already delivered */}
      {isSuccess && (
        <div className="space-y-0 text-left -m-6 sm:-m-10">
          {/* Top banner */}
          <div className="px-4 pt-5 pb-4 sm:px-8 sm:pt-8 sm:pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-100">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm sm:text-base">Payment successful!</p>
                {result && (
                  <p className="text-xs text-slate-400 truncate">
                    {SEASON_MN[result.season] ?? result.season} · {result.subType}
                  </p>
                )}
              </div>
              {result && (() => {
                const colors = Array.isArray(result.recommendedColors) ? result.recommendedColors : [];
                return colors.length > 0 ? (
                  <div className="flex gap-1 shrink-0">
                    {colors.slice(0, 4).map(color => (
                      <div key={color} className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-white shadow ring-1 ring-black/5" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
            {autoEmailSent && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
                <Mail className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2} />
                <p className="text-xs text-emerald-700">Your report has been sent to your email address.</p>
              </div>
            )}
          </div>

          {/* PDF iframe */}
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full block"
              style={{ height: '80vh', minHeight: 480, backgroundColor: '#fff', colorScheme: 'light' }}
              title="PDF Report"
            />
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-amber-600 bg-amber-50">
              Your PDF report will be ready shortly.
            </div>
          )}

          {/* Bottom action bar */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {pdfUrl && (
              <a
                href={pdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (orderId) fetch('/api/payment/track-download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) }).catch(() => {});
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-3 sm:py-3 text-sm font-semibold text-white shadow shadow-violet-200/60 active:scale-[0.98] transition-all"
              >
                <Download className="h-4 w-4" strokeWidth={2} />
                Download
              </a>
            )}
            <button
              onClick={handleRequestEmail}
              disabled={emailState === 'sending' || emailState === 'sent'}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {emailState === 'sending' ? (
                <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />Sending...</>
              ) : emailState === 'sent' ? (
                <><CheckCircle className="h-4 w-4 text-emerald-500" strokeWidth={2} />Sent!</>
              ) : emailState === 'error' ? (
                <><AlertCircle className="h-4 w-4 text-rose-500" strokeWidth={2} />Try again</>
              ) : (
                <><Mail className="h-4 w-4" strokeWidth={2} />Receive by email</>
              )}
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors py-2 sm:px-2"
            >
              Home
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      )}

      {/* Unpaid — manual retry after auto-retries exhausted */}
      {state === 'unpaid' && (
        <>
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 border-2 border-amber-100">
              <AlertCircle className="h-10 w-10 text-amber-500" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-slate-900">Payment is being processed</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              If you successfully completed the payment through QPay, your
              <strong> PDF report</strong> will be ready shortly.
            </p>
          </div>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-200/60 hover:scale-[1.025] transition-all active:scale-[0.975] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} strokeWidth={2} />
            Check again
          </button>
          <Link href="/" className="block text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Return to home page
          </Link>
        </>
      )}

      {/* Error */}
      {state === 'error' && (
        <>
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 border-2 border-rose-100">
              <AlertCircle className="h-10 w-10 text-rose-500" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-slate-900">An error occurred</h1>
            <p className="text-sm text-slate-500">{errorMsg}</p>
          </div>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} strokeWidth={2} />
            Try again
          </button>
          <Link href="/" className="block text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Return to home page
          </Link>
        </>
      )}

    </div>
  );
}

function Loading() {
  return (
    <div className="rounded-[2rem] bg-white border border-slate-100 shadow-xl p-10 text-center space-y-6">
      <div className="flex justify-center">
        <Loader2 className="h-16 w-16 text-violet-400 animate-spin" strokeWidth={1.5} />
      </div>
      <p className="text-sm text-slate-500">Loading...</p>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-pink-50 flex items-center justify-center px-0 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl"
      >
        <Suspense fallback={<Loading />}>
          <PaymentSuccessContent />
        </Suspense>
      </motion.div>
    </main>
  );
}
