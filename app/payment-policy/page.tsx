import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = { title: 'Payment Policy | Personal Color' };

const sections = [
  {
    title: 'Payment Methods',
    body: 'Service fees can be paid using Bonum Pay, QPay, domestic bank cards, digital wallets, and other digital payment systems integrated with the platform.',
  },
  {
    title: 'Service Activation',
    body: 'The service and automated analysis access are activated immediately upon successful confirmation of the transaction through the payment gateway.',
  },
  {
    title: 'Currency',
    body: 'All service prices and rates on the platform are expressed in Mongolian Tugrug (MNT), and any changes will be updated on the website promptly.',
  },
  {
    title: 'Privacy & Security',
    body: 'User payment information (such as card numbers and security codes) is not stored on "Personal Color Mongolia" servers. All transactions are processed securely and confidentially through payment gateways that meet international security standards with encrypted protection.',
  },
];

export default function PaymentPolicyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-10 text-2xl font-bold text-slate-900">Payment Policy</h1>
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
              <h2 className="mb-2 text-sm font-semibold text-slate-800">Contact</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                If a payment transaction has been completed but the service has not been activated, or if any error or issue related to payment arises, the user may attach their transaction receipt and contact us at{' '}
                <a href="mailto:personalcolor.web@gmail.com"
                  className="text-violet-600 hover:underline">
                  personalcolor.web@gmail.com
                </a>{' '}
                or via our Instagram page to have the issue resolved.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
