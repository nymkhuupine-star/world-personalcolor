import Link from 'next/link';
import Image from 'next/image';

const policyLinks = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Payment Policy', href: '/payment-policy' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
];

const paymentBadges = [
  {
    label: 'Visa',
    svg: (
      <svg viewBox="0 0 48 32" className="h-6 w-auto" aria-label="Visa">
        <rect width="48" height="32" rx="4" fill="#1A1F71" />
        <text x="24" y="22" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="1">VISA</text>
      </svg>
    ),
  },
  {
    label: 'Mastercard',
    svg: (
      <svg viewBox="0 0 48 32" className="h-6 w-auto" aria-label="Mastercard">
        <rect width="48" height="32" rx="4" fill="#252525" />
        <circle cx="18" cy="16" r="9" fill="#EB001B" />
        <circle cx="30" cy="16" r="9" fill="#F79E1B" />
        <path d="M24 8.8a9 9 0 0 1 0 14.4A9 9 0 0 1 24 8.8z" fill="#FF5F00" />
      </svg>
    ),
  },
  {
    label: 'Amex',
    svg: (
      <svg viewBox="0 0 48 32" className="h-6 w-auto" aria-label="American Express">
        <rect width="48" height="32" rx="4" fill="#2E77BC" />
        <text x="24" y="22" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="0.5">AMERICAN EXPRESS</text>
      </svg>
    ),
  },
  {
    label: 'PayPal',
    svg: (
      <svg viewBox="0 0 48 32" className="h-6 w-auto" aria-label="PayPal">
        <rect width="48" height="32" rx="4" fill="#F5F5F5" />
        <text x="24" y="21" textAnchor="middle" fill="#003087" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">Pay</text>
        <text x="33" y="21" textAnchor="middle" fill="#009CDE" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">Pal</text>
      </svg>
    ),
  },
  {
    label: 'Apple Pay',
    svg: (
      <svg viewBox="0 0 48 32" className="h-6 w-auto" aria-label="Apple Pay">
        <rect width="48" height="32" rx="4" fill="#000" />
        <text x="24" y="21" textAnchor="middle" fill="white" fontSize="10" fontWeight="500" fontFamily="-apple-system, Arial, sans-serif"> Pay</text>
      </svg>
    ),
  },
];

const socialLinks = [
  {
    href: 'https://www.facebook.com/profile.php?id=100067716833909',
    label: 'Facebook',
    hoverClass: 'hover:text-blue-600',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    ),
  },
  {
    href: 'https://www.instagram.com/personalcolor_mn/',
    label: 'Instagram',
    hoverClass: 'hover:text-pink-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-pink-100 bg-pink-100">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Mobile */}
        <div className="flex flex-col items-center gap-5 md:hidden">
          <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-center">
            {policyLinks.map((l) => (
              <Link key={l.href} href={l.href}
                className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {paymentBadges.map((b) => (
              <span key={b.label} className="opacity-70">{b.svg}</span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {socialLinks.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                aria-label={s.label} className={`text-slate-400 ${s.hoverClass} transition-colors`}>
                {s.icon}
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-300">
            © {new Date().getFullYear()} Personal Color. All rights reserved.
          </p>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image src="/personal1.png" alt="Personal Color logo" width={200} height={75} className="h-14 w-auto" />
            </Link>
            <nav className="flex flex-wrap justify-center items-center gap-6">
              {policyLinks.map((l) => (
                <Link key={l.href} href={l.href}
                  className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              {socialLinks.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  aria-label={s.label} className={`text-slate-400 ${s.hoverClass} transition-colors`}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Payment badges + copyright */}
          <div className="mt-6 flex items-center justify-between border-t border-pink-200/60 pt-5">
            <p className="text-xs text-slate-300">
              © {new Date().getFullYear()} Personal Color. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              {paymentBadges.map((b) => (
                <span key={b.label} className="opacity-60 hover:opacity-90 transition-opacity">{b.svg}</span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
