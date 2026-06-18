import type { NextConfig } from "next";

const securityHeaders = [
  // Clickjacking хамгаалалт
  { key: 'X-Frame-Options', value: 'DENY' },
  // MIME sniffing хамгаалалт
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // XSS filter (хуучин browser-уудад)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // HTTPS-г шаардах (deploy хийсний дараа идэвхтэй болно)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Referrer мэдээлэл хязгаарлах
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Permission policy — камер/микрофон гэх мэтийг хаах
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // PDF proxy — same-origin iframe-д харагдахын тулд DENY-г SAMEORIGIN-р override хийнэ
        source: '/api/payment/pdf',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
    ];
  },
};

export default nextConfig;
