'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, Wallet } from 'lucide-react';

const benefits = [
  {
    icon: Sparkles,
    title: 'Өөртөө итгэлтэй',
    description: 'Өөртөө төгс зохицох өнгөөр хувцасласнаар таны царай улам гэрэлтэж, алхам тутамдаа өөртөө итгэлтэй, дур булаам төрхийг бүтээнэ.',
    gradient: 'from-violet-500 to-pink-500',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
  },
  {
    icon: ShoppingBag,
    title: 'Цаг хэмнэнэ',
    description: 'Дэлгүүр хэсэж, өөрт зохихгүй хувцас сонгож цаг алдахаа болино. Арьс, үс, нүдний өнгийг цогцоор нь шинжилж, таныд тохирох өнгийг хэдхэн секундэд тодорхойлно.',
    gradient: 'from-rose-400 to-orange-400',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
  },
  {
    icon: Wallet,
    title: 'Мөнгөө хэмнэнэ',
    description: 'Та зохихгүй хувцас, гоо сайхны бүтээгдэхүүн худалдан авч санхүүгийн алдагдал хүлээхээ болино. Танд хамгийн сайн зохих өнгөнүүдийг сонгосноор илүүдэл зардал гаргахгүй, ухаалаг худалдан авалт хийхэд тусална.',
    gradient: 'from-amber-400 to-yellow-400',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' as const },
  }),
};

export default function Benefits() {
  return (
    <section className="relative bg-white py-28 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-violet-100/40 blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-rose-100/30 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <span className="inline-block mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
            Яагаад хэрэгтэй вэ
          </span>
          <h2 className="font-serif text-4xl font-bold text-slate-900 leading-tight">
            Энэхүү оношилгоо таны амьдралыг хэрхэн<em className="not-italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent"> өөрчлөх </em> вэ?
          </h2>

             
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {benefits.map((item, i) => (
            <motion.div
              key={i}
              custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
              className="group relative rounded-3xl border border-slate-100 bg-white p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 rounded-t-3xl bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <span className="text-[11px] font-bold tracking-widest text-slate-300"></span>
              <div className={`mt-4 mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.text}`} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
