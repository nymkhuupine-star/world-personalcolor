'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Mail, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

// Webhook typically fires within 1-5s. Poll for up to 30s before showing manual retry.
const AUTO_RETRY_LIMIT    = 20;   // 20 × 3s = 60s
const AUTO_RETRY_INTERVAL = 3000; // ms

type State = 'verifying' | 'waiting' | 'success' | 'already' | 'unpaid' | 'error';

type VerifyResponse = {
  success?:          boolean;
  paid?:             boolean;
  alreadyDelivered?: boolean;
  error?:            string;
  result?: {
    season:            string;
    subType:           string;
    reasoning:         string;
    recommendedColors: string[];
  };
  imageUrl?: string;
};

function PaymentSuccessContent() {
  const { isSignedIn } = useUser();
  const searchParams   = useSearchParams();
  const orderId        = searchParams.get('orderId');

  const [state, setState]       = useState<State>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [autoCount, setAutoCount] = useState(0);
  const autoCountRef = useRef(0);

  const verify = useCallback(async (): Promise<boolean> => {
    if (!orderId) {
      setState('error');
      setErrorMsg('Захиалгын дугаар байхгүй байна.');
      return false;
    }
    try {
      const res  = await fetch(`/api/payment/verify?orderId=${encodeURIComponent(orderId)}`);
      const data = await res.json() as VerifyResponse;

      if (data.alreadyDelivered || (data.success && data.paid)) {
        if (isSignedIn && data.result && !data.alreadyDelivered) {
          fetch('/api/save-analysis', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ result: data.result, imageUrl: data.imageUrl ?? '' }),
          }).catch((err) => console.error('save-analysis error:', err));
        }
        setState(data.alreadyDelivered ? 'already' : 'success');
        return true;
      }

      if (data.success === false && data.paid === false) {
        return false; // caller decides whether to retry or show unpaid
      }

      setState('error');
      setErrorMsg(data.error ?? 'Баталгаажуулахад алдаа гарлаа.');
      return false;
    } catch {
      setState('error');
      setErrorMsg('Сүлжээний алдаа гарлаа.');
      return false;
    }
  }, [orderId, isSignedIn]);

  // On mount: first check, then auto-retry while waiting for webhook.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const run = async () => {
      const paid = await verify();
      if (paid || cancelled) return;

      // Not paid yet — enter waiting state and schedule retries
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
          // Exhausted retries — show manual button
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

  return (
    <div className="rounded-[2rem] bg-white border border-slate-100 shadow-xl p-10 text-center space-y-6">

      {/* Verifying (first load) */}
      {state === 'verifying' && (
        <>
          <div className="flex justify-center">
            <Loader2 className="h-16 w-16 text-violet-400 animate-spin" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-slate-900">
              Төлбөр баталгаажиж байна...
            </h1>
            <p className="text-sm text-slate-500">Түр хүлээнэ үү.</p>
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
              Баталгаажилтыг хүлээж байна...
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Төлбөрийг шалгаж байна. Энэ хэдэн секунд болно.
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
      {(state === 'success' || state === 'already') && (
        <>
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-100">
              <CheckCircle className="h-10 w-10 text-emerald-500" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-slate-900">Төлбөр амжилттай!</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              {state === 'already'
                ? 'Таны PDF тайлан урьд нь илгээгдсэн байна.'
                : 'Таны PDF тайлан имэйл рүү илгээгдэнэ.'}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-violet-50 border border-violet-100 px-5 py-4">
            <Mail className="h-5 w-5 shrink-0 text-violet-500" strokeWidth={1.5} />
            <p className="text-sm text-violet-700 text-left">
              Имэйлийнхээ <strong>inbox</strong> болон <strong>spam</strong> хавтсыг шалгана уу.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-200/60 hover:scale-[1.025] transition-all active:scale-[0.975]"
          >
            Нүүр хуудас руу буцах
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </>
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
            <h1 className="font-serif text-2xl font-bold text-slate-900">Төлбөр боловсруулж байна</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Хэрэв та QPay-д төлбөр амжилттай хийсэн бол таны имэйл хаяг руу
              <strong> PDF тайлан</strong> удахгүй ирнэ.
            </p>
          </div>
          <div className="rounded-2xl bg-violet-50 border border-violet-100 px-5 py-4 text-sm text-violet-700 text-left space-y-1">
            <p className="font-semibold">Имэйлдээ шалгана уу:</p>
            <p className="text-xs text-violet-600">inbox болон spam хавтсыг аль алийг нь шалгаарай.</p>
          </div>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-200/60 hover:scale-[1.025] transition-all active:scale-[0.975] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} strokeWidth={2} />
            Дахин шалгах
          </button>
          <Link href="/" className="block text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Нүүр хуудас руу буцах
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
            <h1 className="font-serif text-2xl font-bold text-slate-900">Алдаа гарлаа</h1>
            <p className="text-sm text-slate-500">{errorMsg}</p>
          </div>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} strokeWidth={2} />
            Дахин оролдох
          </button>
          <Link href="/" className="block text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Нүүр хуудас руу буцах
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
      <p className="text-sm text-slate-500">Уншиж байна...</p>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-pink-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <Suspense fallback={<Loading />}>
          <PaymentSuccessContent />
        </Suspense>
      </motion.div>
    </main>
  );
}
