import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = { title: 'Нууцлалын бодлого | Personal Color' };

const sections = [
  {
    title: 'Мэдээлэл цуглуулах ба зорилго',
    body: '"Personal Color Mongolia" платформ нь хэрэглэгчийн оруулсан гэрэл зураг болон цахим шуудангийн хаягийг зөвхөн тухайн үеийн хувийн өнгөний оношилгоог хийх, зөвлөмж бүхий тайланг боловсруулахад ашиглана.',
  },
  {
    title: 'Гуравдагч этгээдэд үл задруулах',
    body: 'Бид хэрэглэгчийн хувийн мэдээллийг хууль тогтоомжид зааснаас бусад тохиолдолд ямар ч гуравдагч этгээд, байгууллагад худалдахгүй, арилжихгүй, задруулахгүй бөгөөд нууцлалыг бүрэн хангана.',
  },
  {
    title: 'Гэрэл зургийн аюулгүй байдал',
    body: 'Хэрэглэгчийн оруулсан гэрэл зураг нь манай серверийн өгөгдлийн санд хэзээ ч хадгалагдахгүй. Автомат оношилгоо хийгдэж, тайлан бэлэн болсон даруйд системээс хэрэглэгчийн зургийг бүрмөсөн, автоматаар устгана.',
  },
  {
    title: 'Дата хадгалалт ба аюулгүй байдал',
    body: 'Оношилгооны үр дүнгийн тайлан болон цахим шуудангийн хаяг зэрэг үндсэн мэдээллүүд нь олон улсын аюулгүй байдлын стандарт хангасан, шифрлэгдсэн хамгаалалттай сервер дээр хадгалагдах бөгөөд зөвшөөрөлгүй хандалтаас найдвартай хамгаалагдсан болно.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-10 text-2xl font-bold text-slate-900">Нууцлалын бодлого</h1>
        <div className="space-y-8">
          {sections.map((s, i) => (
            <div key={i} className="flex gap-4">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600">
                {i + 1}
              </span>
              <div>
                <h2 className="mb-2 text-sm font-semibold text-slate-800">{s.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}

          {/* Section 5 — with email link */}
          <div className="flex gap-4">
            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600">
              5
            </span>
            <div>
              <h2 className="mb-2 text-sm font-semibold text-slate-800">Эргэх холбоо</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Нууцлалын бодлого болон хувийн мэдээллийн аюулгүй байдалтай холбоотой аливаа
                асуулт, санал гомдлыг{' '}
                <a href="mailto:info@personalcolor.mn"
                  className="text-violet-600 hover:underline">
                  info@personalcolor.mn
                </a>{' '}
                хаягаар хүлээн авч, шуурхай шийдвэрлэнэ.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
