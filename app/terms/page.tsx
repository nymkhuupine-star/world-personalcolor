import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = { title: 'Terms of Service | Personal Color' };

const sections = [
  {
    title: 'General Provisions',
    body: '"Personal Color Mongolia" (hereinafter "Platform") is an automated service that performs personal color analysis based on user-submitted photos and delivers recommendation reports digitally. By using this platform, the user is deemed to have accepted the following terms of service.',
  },
  {
    title: 'User Responsibilities',
    body: 'To ensure accurate analysis results, the user is responsible for submitting photos and information that meet the platform\'s requirements and guidelines. Additionally, using another person\'s photo without their consent is strictly prohibited.',
  },
  {
    title: 'Nature of Service',
    body: 'The analysis results and reports are intended solely for aesthetic and styling recommendations and do not constitute medical or health diagnoses.',
  },
  {
    title: 'Privacy & Data Security',
    body: 'User-submitted photos and personal information will be used exclusively for color analysis purposes and will not be disclosed to third parties. After the analysis is complete, the user\'s photo will be permanently deleted from the system.',
  },
  {
    title: 'Payment & Refunds',
    body: 'The analysis process begins automatically once the service fee has been paid in full. Since the automated analysis has been carried out and the report is ready, refunds for the service fee cannot be issued.',
  },
  {
    title: 'Updates to Terms',
    body: '"Personal Color Mongolia" reserves the right to update or modify these terms of service at any time in response to market conditions or changes in legislation. Any changes take effect from the date they are published on the website.',
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
