import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = { title: 'Privacy Policy | Personal Color' };

const sections = [
  {
    title: 'Data Collection & Purpose',
    body: 'The "Personal Color Mongolia" platform uses the photo and email address submitted by the user solely for the purpose of conducting a personal color analysis and generating the recommendation report.',
  },
  {
    title: 'No Disclosure to Third Parties',
    body: 'We will not sell, trade, or disclose user personal information to any third party or organization except as required by law, and we fully uphold user privacy.',
  },
  {
    title: 'Photo Security',
    body: 'Photos submitted by the user are never stored in our server database. As soon as the automated analysis is complete and the report is ready, the user\'s photo is permanently and automatically deleted from the system.',
  },
  {
    title: 'Data Storage & Security',
    body: 'Core information such as analysis results and email addresses are stored on servers that meet international security standards with encrypted protection, and are reliably safeguarded against unauthorized access.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-10 text-2xl font-bold text-slate-900">Privacy Policy</h1>
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
                Any questions or complaints regarding this privacy policy and the security of personal information can be directed to{' '}
                <a href="mailto:personalcolor.web@gmail.com"
                  className="text-violet-600 hover:underline">
                  personalcolor.web@gmail.com
                </a>{' '}
                and will be addressed promptly.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
