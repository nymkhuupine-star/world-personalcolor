import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = { title: 'Буцаалтын нөхцөл | Personal Color' };

const sections = [
  {
    title: 'Дижитал бүтээгдэхүүний онцлог',
    body: 'Платформын үйлчилгээ нь цахим (дижитал) бүтээгдэхүүн бөгөөд автомат оношилгооны үр дүн, зөвлөмж бүхий тайлан хэрэглэгчид нэгэнт хүргэгдсэн эсвэл харах боломжтой болсон тохиолдолд төлбөрийг буцаан олгох хууль эрх зүйн боломжгүй.',
  },
  {
    title: 'Системийн алдаа дутагдал',
    body: 'Платформын техникийн болон системийн алдаанаас шалтгаалан төлбөр хасагдсан боловч үйлчилгээ үзүүлэгдээгүй, автомат шинжилгээ хийгдээгүй тохиолдолд хэрэглэгчийн хүсэлтийг үндэслэн төлбөрийг бүрэн буцаан олгоно.',
  },
  {
    title: 'Давхар төлөлт',
    body: 'Системийн болон банкны гүйлгээний саатлаас шалтгаалан нэг үйлчилгээнд давхар төлөлт хийгдсэн нь банкны хуулгаар нотлогдвол илүү төлөгдсөн дүнг хэрэглэгчид бүрэн буцаана.',
  },
];

export default function RefundPolicyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-10 text-2xl font-bold text-slate-900">Буцаалтын нөхцөл</h1>
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

          {/* Section 4 — with email link */}
          <div className="flex gap-4">
            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600">
              4
            </span>
            <div>
              <h2 className="mb-2 text-sm font-semibold text-slate-800">Хүсэлт гаргах хугацаа ба суваг</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Төлбөр буцаахтай холбоотой гомдол, хүсэлтийг гүйлгээ хийгдсэнээс хойш ажлын
                3 өдрийн дотор гүйлгээний баримтын хамт{' '}
                <a href="mailto:personalcolor.web@gmail.com"
                  className="text-violet-600 hover:underline">
                  personalcolor.web@gmail.com
                </a>{' '}
                цахим хаягаар ирүүлнэ. Хүсэлтийг ажлын 2–5 өдөрт багтаан шийдвэрлэх бөгөөд
                буцаалт хийхэд банк хоорондын гүйлгээний шимтгэл суутгагдаж болно.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
