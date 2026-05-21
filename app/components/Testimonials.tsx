'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'А. Сарнай',
    role: 'Маркетер',
    content: 'Өөртөө тохирохгүй өнгөөр нүүрээ буддаг байснаа мэдсэнээрээ маш их гайхсан. Одоо дэлгүүр хэсэх бүр амархан болсон!',
    stars: 5,
    season: 'Хавар',
    gradient: 'from-rose-400 to-pink-400',
    initials: 'АС',
  },
  {
    name: 'Б. Тулга',
    role: 'Оюутан',
    content: 'AI маш нарийн оношилдог юм байна. Миний улирал яг таарсан, тайлан нь маш ойлгомжтой байсан. Баярлалаа!',
    stars: 5,
    season: 'Өвөл',
    gradient: 'from-sky-400 to-blue-500',
    initials: 'БТ',
  },
  {
    name: 'Д. Номин',
    role: 'Дизайнер',
    content: 'Хувийн өнгөний шинжилгээ ийм хялбар, хурдан байдгийг мэдсэнгүй. Гоё дизайн, тун хэрэгтэй сервис!',
    stars: 5,
    season: 'Зун',
    gradient: 'from-violet-400 to-purple-500',
    initials: 'ДН',
  },
];

const SEASON_COLOR: Record<string, string> = {
  'Хавар': 'bg-rose-50 text-rose-600',
  'Зун': 'bg-violet-50 text-violet-600',
  'Намар': 'bg-amber-50 text-amber-600',
  'Өвөл': 'bg-sky-50 text-sky-600',
};

export default function Testimonials() {
  return (
    <section className="py-28 bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
            Хэрэглэгчдийн туршлага
          </span>
          <h2 className="font-serif text-4xl font-bold text-slate-900">
            Бодит <em className="not-italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">үр дүн</em>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col rounded-3xl border border-slate-100 bg-white p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <Quote className="h-6 w-6 text-slate-200 mb-4" strokeWidth={1.5} />

              <div className="flex gap-1 mb-4">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
                ))}
              </div>

              <p className="text-sm leading-relaxed text-slate-600 flex-1 mb-6">
                &ldquo;{t.content}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-white text-xs font-bold shadow-sm`}>
                  {t.initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${SEASON_COLOR[t.season]}`}>
                  {t.season}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-14 grid grid-cols-3 gap-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm"
        >
          {[
            { value: '1,000+', label: 'Шинжилгээ хийгдсэн' },
            { value: '98%', label: 'Сэтгэл ханамж' },
            { value: '4.9★', label: 'Дундаж үнэлгээ' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-serif text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">{value}</p>
              <p className="mt-1 text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
