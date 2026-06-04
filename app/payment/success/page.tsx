'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-pink-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="rounded-[2rem] bg-white border border-slate-100 shadow-xl p-10 text-center space-y-6">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-100">
              <CheckCircle className="h-10 w-10 text-emerald-500" strokeWidth={1.5} />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-slate-900">
              Төлбөр амжилттай!
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Таны хувийн өнгөний шинжилгээний PDF тайлан имэйлрүү таны
              имэйл хаяг руу удахгүй илгээгдэнэ.
            </p>
          </div>

          {/* Email hint */}
          <div className="flex items-center gap-3 rounded-2xl bg-violet-50 border border-violet-100 px-5 py-4">
            <Mail className="h-5 w-5 shrink-0 text-violet-500" strokeWidth={1.5} />
            <p className="text-sm text-violet-700 text-left">
              Имэйлийнхээ inbox болон <strong>spam</strong> хавтсыг шалгана уу.
            </p>
          </div>

          {/* Back to home */}
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-200/60 hover:scale-[1.025] transition-all active:scale-[0.975]"
          >
            Нүүр хуудас руу буцах
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>

        </div>
      </motion.div>
    </main>
  );
}
