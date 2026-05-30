'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SignInButton } from '@clerk/nextjs';
import { X, Mail } from 'lucide-react';

type Props = {
  onDismiss: () => void;
};

export default function HookModal({ onDismiss }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md rounded-3xl border border-white/60 bg-white shadow-2xl shadow-black/10 overflow-hidden"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400" />

          <div className="p-7">
            <button
              onClick={onDismiss}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center gap-4 pt-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 border border-violet-100">
                <Mail className="h-5 w-5 text-violet-500" strokeWidth={1.5} />
              </div>

              <div className="space-y-2">
                <p className="text-base font-semibold text-slate-800">
                  Үр дүн имэйлээр илгээгдлээ
                </p>
                <p className="text-sm leading-relaxed text-slate-500">
                  Та энэ үр дүнгээ хадгалж, хүссэн үедээ орж харахыг хүсвэл нэвтэрч орно уу.
                </p>
              </div>

              <SignInButton mode="modal" forceRedirectUrl="/">
                <button className="w-full rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:scale-[1.02] hover:shadow-violet-300 active:scale-[0.98]">
                  Нэвтрэх / Бүртгүүлэх
                </button>
              </SignInButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
