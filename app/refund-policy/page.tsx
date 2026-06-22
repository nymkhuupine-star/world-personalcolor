import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = { title: 'Refund Policy | Personal Color' };

const sections = [
  {
    title: 'Nature of Digital Products',
    body: 'The platform\'s service is a digital product. Once the automated analysis results and recommendation report have been delivered to the user or made available for viewing, it is not legally possible to issue a refund.',
  },
  {
    title: 'System Errors & Failures',
    body: 'If a payment was charged due to a technical or system error on the platform, but the service was not provided and the automated analysis was not performed, a full refund will be issued upon the user\'s request.',
  },
  {
    title: 'Duplicate Payments',
    body: 'If a duplicate payment was made for a single service due to a system or bank transaction delay, and this is confirmed by a bank statement, the excess amount charged will be fully refunded to the user.',
  },
];

export default function RefundPolicyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-10 text-2xl font-bold text-slate-900">Refund Policy</h1>
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
              <h2 className="mb-2 text-sm font-semibold text-slate-800">Timeframe & Channel for Requests</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Refund complaints and requests must be submitted within 3 business days of the transaction, along with proof of payment, to{' '}
                <a href="mailto:personalcolor.web@gmail.com"
                  className="text-violet-600 hover:underline">
                  personalcolor.web@gmail.com
                </a>{' '}
                Requests will be resolved within 2–5 business days, and interbank transaction fees may be deducted from the refund.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
