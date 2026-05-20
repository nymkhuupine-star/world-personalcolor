import { Star, CheckCircle2, XCircle } from "lucide-react";

const testimonials = [
  {
    name: "А. Сарнай",
    role: "Маркетер",
    content: "Өөртөө тохирохгүй өнгөөр нүүрээ буддаг байснаа мэдээд маш их гайхсан. Одоо дэлгүүр хэсэх бүр амархан болсон!",
    stars: 5,
  },
  {
    name: "Б. Тулга",
    role: "Оюутан",
    content: "AI маш нарийн оношилдог юм байна. Миний улирал яг таарсан, тайлан нь маш ойлгомжтой. Баярлалаа!",
    stars: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">Бодит үр дүн</h2>
          <p className="text-slate-600 mt-4">Хувийн өнгөө олсноор таны төрх хэрхэн өөрчлөгдөхийг хараарай</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Before/After Visual */}
          <div className="relative group">
            <div className="flex gap-4 overflow-hidden rounded-3xl shadow-2xl">
              <div className="relative w-1/2">
                <img src="https://unsplash.com" alt="Wrong" className="grayscale contrast-75 h-[400px] w-full object-cover" />
                <div className="absolute top-4 left-4 bg-red-500/90 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <XCircle size={14} /> Буруу өнгө
                </div>
              </div>
              <div className="relative w-1/2 border-l-4 border-white">
                <img src="https://unsplash.com" alt="Right" className="h-[400px] w-full object-cover" />
                <div className="absolute top-4 left-4 bg-green-500/90 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={14} /> Төгс зохицол
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
              <span className="text-sm font-medium text-slate-900">Арьсны гэрэлтэлт +40% нэмэгдсэн</span>
            </div>
          </div>

          {/* Testimonial Cards */}
          <div className="space-y-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex gap-1 mb-4 text-yellow-400">
                  {[...Array(t.stars)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
               <p className="text-slate-700 italic mb-6">
  &ldquo;{t.content}&rdquo;
</p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100" />
                  <div>
                    <h4 className="font-bold text-slate-900">{t.name}</h4>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
