import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = { title: 'Terms of Service | Personal Color' };

const sections = [
  {
    title: 'General Provisions',
    body: '"Personal Color" (hereinafter referred to as the "Platform") provides professional, digital personal color analysis services based on user-submitted photographs. The Platform delivers customized styling and recommendation reports digitally to the user. By accessing or using our website and services, you agree to be bound by these Terms of Service.',
  },
  {
    title: 'User Responsibilities',
    body: "To ensure the highest accuracy of the analysis results, the user is responsible for submitting photographs that strictly follow the Platform's lighting and quality guidelines. Submitting or using another individual's photograph without their explicit, documented consent is strictly prohibited and violates our community standards.",
  },
  {
    title: 'Nature of Service',
    body: 'The analysis results, color palettes, and digital style guides provided by the Platform are intended solely for aesthetic, wardrobe, and styling recommendations. These materials do not constitute medical, dermatological, or health-related diagnoses.',
  },
  {
    title: 'Service Delivery (24-Hour Review)',
    body: 'Unlike fully automated filters, each submission is carefully evaluated by our trained color specialists to ensure premium quality. Your personalized 15-page Digital Style Guide will be processed and delivered to your designated email address within 24 hours from the time of successful payment and photo submission.',
  },
  {
    title: 'Privacy & Data Security',
    body: 'Your privacy is our utmost priority. All user-submitted photographs and personal information are encrypted and used exclusively for the color analysis process. Your photos are securely stored in our system solely for the duration of the analysis and will never be shared with or disclosed to third parties.',
  },
  {
    title: 'Payment & Refunds',
    body: 'The custom analysis process begins immediately once the service fee is paid in full via our secured payment gateways (Stripe / PayPal). Because each digital report is custom-tailored, uniquely prepared, and delivered upon your specific request, all sales are final, and we cannot issue refunds once the styling report has been generated.',
  },
  {
    title: 'Updates to Terms',
    body: 'The Platform reserves the right to update, modify, or replace any part of these Terms of Service at any time to reflect changes in our services, market conditions, or international legal requirements. Any modifications will take effect immediately upon being published on the website.',
  },
];

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-10 text-2xl font-bold text-slate-900">Terms of Service</h1>
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
        </div>
      </main>
      <Footer />
    </>
  );
}
