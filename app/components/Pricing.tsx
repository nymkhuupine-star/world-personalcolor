'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Үнэгүй',
    price: '0',
    description: 'Өөрийн үндсэн улирлыг мэдэхэд тусална',
    features: [
      'Улирлын ерөнхий оношлогоо',
      'Вэб дээр үр дүнг харах',
      'Өнгөний палитр (HEX код)',
    ],
    cta: 'Үнэгүй эхлэх',
    href: '#upload',
    premium: false,
  },
  {
    name: 'Premium',
    price: '9,900',
    description: 'Танд зориулсан цогц загварын гарын авлага',
    features: [
      'Дэлгэрэнгүй 10 хуудас тайлан',
      'Мэйлээр PDF тайлан хүлээн авах',
      'Нүүр будалтын HEX кодууд',
      'Үсний өнгөний зөвлөгөө',
      'Хувцаслалтын стиль зөвлөмж',
    ],
    cta: 'Premium авах',
    href: '#upload',
    premium: true,
  },
];

export default function Pricing() {
  return (
    <section className="py-28 bg-white" id="pricing">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
            Үнийн санал
          </span>
          <h2 className="font-serif text-4xl font-bold text-slate-900">
            Өөрт тохирох <em className="not-italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">багцаа</em> сонгоорой
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`relative rounded-3xl p-8 flex flex-col ${
                plan.premium
                  ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 text-white shadow-2xl shadow-violet-200'
                  : 'border border-slate-100 bg-white shadow-sm'
              }`}
            >
              {plan.premium && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[11px] font-bold text-violet-600 shadow-md">
                    <Sparkles className="h-3 w-3" strokeWidth={2} /> Хамгийн эрэлттэй
                  </span>
                </div>
              )}

              <div className="mb-8">
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${plan.premium ? 'text-violet-200' : 'text-slate-400'}`}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1">
                  <span className={`font-serif text-5xl font-bold ${plan.premium ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}₮
                  </span>
                  <span className={`mb-1.5 text-sm ${plan.premium ? 'text-violet-200' : 'text-slate-400'}`}>/удаа</span>
                </div>
                <p className={`mt-2 text-sm ${plan.premium ? 'text-violet-100' : 'text-slate-500'}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3.5 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.premium ? 'text-violet-200' : 'text-violet-500'}`} strokeWidth={2.5} />
                    <span className={plan.premium ? 'text-violet-50' : 'text-slate-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href}>
                <button className={`w-full rounded-2xl py-3.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                  plan.premium
                    ? 'bg-white text-violet-600 hover:bg-violet-50 shadow-lg'
                    : 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-200 hover:shadow-violet-300'
                }`}>
                  {plan.cta}
                </button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
