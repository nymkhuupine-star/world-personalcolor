'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Mail, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type State = 'verifying' | 'success' | 'already' | 'unpaid' | 'error';

type VerifyResponse = {
  success?: boolean;
  paid?: boolean;
  alreadyDelivered?: boolean;
  error?: string;
};

function PaymentSuccessContent() {
  const searchParams  = useSearchParams();
  const orderId       = searchParams.get('orderId');
  const [state, setState]     = useState<State>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [retrying, setRetrying] = useState(false);

  const verify = useCallback(async () => {
    if (!orderId) {
      setState('error');
      setErrorMsg('Захиалгын дугаар байхгүй байна.');
      return;
    }
    try {
      const res  = await fetch(`/api/payment/verify?orderId=${encodeURIComponent(orderId)}`);
      const data = await res.json() as VerifyResponse;

      if (data.alreadyDelivered || (data.success && data.paid)) {
        setState(data.alreadyDelivered ? 'already' : 'success');
      } else if (data.success === false && data.paid === false) {
        setState('unpaid');
      } else {
        setState('error');
        setErrorMsg(data.error ?? 'Баталгаажуулахад алдаа гарлаа.');
      }
    } catch {
      setState('error');
      setErrorMsg('Сүлжээний алдаа гарлаа.');
    }
  }, [orderId]);

  useEffect(() => { verify(); }, [verify]);

  const handleRetry = async () => {
    setRetrying(true);
    setState('verifying');
    await verify();
    setRetrying(false);
  };

  return (
    <div className="rounded-[2rem] bg-white border border-slate-100 shadow-xl p-10 text-center space-y-6">

      {/* Verifying */}
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

      {/* Unpaid / pending */}
      {state === 'unpaid' && (
        <>
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 border-2 border-amber-100">
              <AlertCircle className="h-10 w-10 text-amber-500" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-slate-900">Баталгаажаагүй байна</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Төлбөр хараахан баталгаажаагүй байна.
              Түр хүлээгээд дахин шалгана уу.
            </p>
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
