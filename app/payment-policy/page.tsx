import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = { title: 'Төлбөрийн нөхцөл | Personal Color' };

const sections = [
  {
    title: 'Төлбөрийн хэрэгсэл',
    body: 'Үйлчилгээний төлбөрийг Bonum Pay, QPay, дотоодын банкны картууд, цахим хэтэвч болон платформд нэгдсэн бусад цахим төлбөрийн системүүдийг ашиглан төлөх боломжтой.',
  },
  {
    title: 'Үйлчилгээ идэвхжих',
    body: 'Төлбөр дамжуулах системээр дамжин гүйлгээ амжилттай баталгаажсан даруйд үйлчилгээ болон автомат шинжилгээний эрх шууд идэвхжинэ.',
  },
  {
    title: 'Валютын зохицуулалт',
    body: 'Платформ дээрх бүх үйлчилгээний үнэ, тариф нь Монгол төгрөгөөр (MNT) илэрхийлэгдсэн бөгөөд нэмэлт өөрчлөлтийг тухай бүрд нь вэбсайт дээр шинэчилнэ.',
  },
  {
    title: 'Нууцлал ба аюулгүй байдал',
    body: 'Хэрэглэгчийн төлбөрийн мэдээлэл (картны дугаар, нууц код гэх мэт) нь "Personal Color Mongolia"-ийн серверт хадгалагдахгүй. Бүх гүйлгээ нь олон улсын аюулгүй байдлын стандарт хангасан, шифрлэгдсэн хамгаалалттай төлбөрийн системээр (Gateways) нууцлагдан боловсруулагдана.',
  },
];

export default function PaymentPolicyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-10 text-2xl font-bold text-slate-900">Төлбөрийн нөхцөл</h1>
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
                Төлбөрийн гүйлгээ хийгдсэн боловч үйлчилгээ идэвхжээгүй, эсвэл төлбөртэй
                холбоотой ямар нэгэн алдаа, асуудал гарсан тохиолдолд хэрэглэгч гүйлгээний
                баримтаа хавсарган{' '}
                <a href="mailto:info@personalcolor.mn"
                  className="text-violet-600 hover:underline">
                  info@personalcolor.mn
                </a>{' '}
                цахим хаягаар болон Инстаграм хаягаар шууд холбогдож шийдвэрлүүлэх үүрэгтэй.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
