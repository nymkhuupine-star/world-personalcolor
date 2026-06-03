import Link from 'next/link';
import Image from 'next/image';

const policyLinks = [
  { label: 'Үйлчилгээний нөхцөл', href: '/terms' },
  { label: 'Төлбөрийн нөхцөл', href: '/payment-policy' },
  { label: 'Буцаалтын нөхцөл', href: '/refund-policy' },
  { label: 'Нууцлалын бодлого', href: '/privacy-policy' },
];

export default function Footer() {
  return (
    <footer className="border-t border-pink-100 bg-pink-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Mobile */}
        <div className="flex flex-col items-center gap-4 md:hidden">
          <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-center">
            {policyLinks.map((l) => (
              <Link key={l.href} href={l.href}
                className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-slate-300">
            © {new Date().getFullYear()} Personal Color
          </p>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex md:items-center md:justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/personal1.png"
              alt="Personal Color logo"
              width={200}
              height={75}
              className="h-14 w-auto"
            />
          </Link>
          <nav className="flex flex-wrap justify-center items-center gap-6">
            {policyLinks.map((l) => (
              <Link key={l.href} href={l.href}
                className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-slate-300">
            © {new Date().getFullYear()} Personal Color
          </p>
        </div>
      </div>
    </footer>
  );
}
