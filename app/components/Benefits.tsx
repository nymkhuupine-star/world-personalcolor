import { ShoppingBag, Sparkles, Wallet } from 'lucide-react';

const benefits = [
  {
    title: 'Shopping Efficiency (Цаг хэмнэнэ)',
    description:
      'Дэлгүүр хэсэхдээ өөрт зохихгүй өнгөнүүдийг шууд хассанаар сонголт хийх алхмыг 2 дахин хурдасгаж, цагаа хэмнэнэ.',
    icon: ShoppingBag,
    iconStyle: 'bg-blue-50 text-blue-600 ring-blue-100',
  },
  {
    title: 'Confidence Boost (Илүү итгэлтэй)',
    description:
      'Төрөлх арьсны өнгөнд тань төгс зохицох өнгийг өмссөнөөр таны царай гэрэлтэж, хаана ч өөртөө итгэлтэй, эрчим хүчтэй харагдах болно.',
    icon: Sparkles,
    iconStyle: 'bg-pink-50 text-pink-600 ring-pink-100',
  },
  {
    title: 'Economic (Мөнгөө хэмнэнэ)',
    description:
      'Зохидоггүй өнгийн хувцас, нүүр будалтын бүтээгдэхүүн авч ашиглахгүй хаях эрсдэлээс сэргийлж, урт хугацаанд санхүүгээ хэмнэнэ.',
    icon: Wallet,
    iconStyle: 'bg-orange-50 text-orange-600 ring-orange-100',
  },
] as const;

export default function Benefits() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900">Ашиг тус</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {benefits.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200/60 bg-white p-8 text-left shadow-sm shadow-slate-200/30 transition-shadow hover:shadow-md"
            >
              <div
                className={`mb-6 flex h-12 w-12 items-center justify-center rounded-full ring-1 ${item.iconStyle}`}
              >
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="leading-relaxed text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
