'use client';

import { motion } from 'framer-motion';
import { Check, Gift, RefreshCw, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

const perks = [
  {
    icon: RefreshCw,
    title: 'Нэг удаа төлж, дахин харах',
    desc: 'Нэг удаа төлсний дараа үр дүнгээ хэдэн ч удаа бүртгэлдээ нэвтэрч дахин харах боломжтой.',
  },
  {
    icon: Gift,
    title: 'Шинэ өнгөний мэдээлэл үнэгүй',
    desc: 'Цаашид нэмэгдэх улирлын шинэ өнгөний зөвлөмж, палитруудыг нэмэлт төлбөргүй үзэх эрхтэй.',
  },
  {
    icon: Zap,
    title: 'Хурдан үр дүн',
    desc: 'Таны арьс, нүд, үсний өнгийг нарийн шинжилж улирлын төрлийг хурдан тодорхойлно.',
  },
  {
    icon: Sparkles,
    title: 'Дэлгэрэнгүй PDF тайлан',
    desc: 'Хувийн өнгө, хувцаслалт, будалтын зөвлөмж бүхий PDF тайланг имэйлээр хүлээн авна.',
  },
];

export default function Payment() {
  return (
    <section id="pricing" className="relative overflow-hidden py-24 lg:py-32 bg-white">
      {/* background glows */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full  blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-fullblur-[100px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-12">

        {/* heading */}
       
          <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
             Үнийн мэдээлэл
          </span>
          <h2 className="font-serif text-4xl font-bold text-slate-900">
             Нэг удаа төлж, <em className="not-italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent"> бүх боломжийг </em> эдэл
          </h2>
        </motion.div>

        {/* two-column layout */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">

          {/* LEFT — price card */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* gradient border */}
            <div className="rounded-[2rem] bg-gradient-to-br from-violet-400 via-purple-400 to-pink-400 p-px shadow-2xl shadow-violet-200/50">
              <div className="relative flex flex-col gap-7 overflow-hidden rounded-[calc(2rem-1px)] bg-white px-10 py-10">
                {/* inner glows */}
                <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-violet-50/80 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-pink-50/70 blur-2xl" />

                <div className="relative">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500">
                    Стандарт багц
                  </p>
                  <div className="mt-3 flex items-end gap-1.5">
                    <span className=" text-[4.5rem] font-bold leading-none tracking-tight text-slate-900">
                      8,900
                    </span>
                    <span className="mb-2 text-2xl font-semibold text-slate-400">₮</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-400">нэг удаагийн төлбөр · давтагдахгүй</p>
                </div>

                <ul className="relative space-y-3">
                  {[
                    'Улирлын өнгөний шинжилгээ',
                    'PDF тайлан имэйлээр',
                    'Үр дүнгээ дахин харах эрх',
                    'Шинэ өнгөний мэдээлэл үнэгүй',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-pink-100">
                        <Check className="h-[11px] w-[11px] text-violet-600" strokeWidth={3} />
                      </span>
                      <span className="text-sm text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="#upload"
                  className="relative mt-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-200/60 transition-all hover:scale-[1.025] hover:shadow-violet-300/60 active:scale-[0.975]"
                >
                  <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                  Шинжилгээ эхлүүлэх
                </Link>

                <p className="relative -mt-3 text-center text-[11px] text-slate-400">
                  QPay · Карт · Интернет банк
                </p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT — perks */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-4"
          >
            {perks.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white/80 px-6 py-5 shadow-sm shadow-slate-100/60 backdrop-blur-sm transition-shadow hover:shadow-md"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-pink-100">
                  <Icon className="h-[18px] w-[18px] text-violet-500" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
