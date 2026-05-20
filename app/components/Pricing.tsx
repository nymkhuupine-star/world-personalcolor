import { Check } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "0",
    description: "Өөрийн үндсэн улирлыг мэдэхэд тусална",
    features: ["Улирлын ерөнхий оношлогоо", "Вэб дээр харах", "Нэг удаагийн шинжилгээ"],
    buttonText: "Үнэгүй эхлэх",
    premium: false,
  },
  {
    name: "Premium",
    price: "9,900",
    description: "Танд зориулсан цогц загварын гарын авлага",
    features: [
      "Дэлгэрэнгүй 10 хуудас тайлан",
      "Мэйлээр хүлээн авах (PDF)",
      "Нүүр будалтын HEX кодууд",
      "Үсний өнгөний зөвлөгөө",
      "Хувцаслалтын стиль",
    ],
    buttonText: "Premium авах",
    premium: true,
  },
];

export default function Pricing() {
  return (
    <section className="py-24 bg-white" id="pricing">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">Үнийн санал</h2>
          <p className="text-slate-600 mt-4">Өөрт тохирох багцаа сонгож, загварын аялалаа эхлүүл</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative p-8 rounded-3xl border ${
                plan.premium 
                ? "border-indigo-600 shadow-xl shadow-indigo-100 ring-1 ring-indigo-600" 
                : "border-slate-100 shadow-sm"
              }`}
            >
              {plan.premium && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Хамгийн эрэлттэй
                </span>
              )}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900">{plan.price}₮</span>
                  <span className="ml-1 text-slate-500">/удаа</span>
                </div>
                <p className="mt-2 text-slate-600 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-slate-600">
                    <Check className="text-indigo-600 shrink-0" size={18} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                  plan.premium
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                    : "bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
