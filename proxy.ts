import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Нийтэд нээлттэй routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/analyze',
  '/api/save-analysis',
  '/api/verify/(.*)',
  '/api/payment/(.*)',
  '/payment/success',
  '/how-it-works(.*)',
  '/pricing(.*)',
  '/faq(.*)',
  '/terms',
  '/payment-policy',
  '/refund-policy',
  '/privacy-policy',
]);

// /api/analyze endpoint-д энгийн IP-д суурилсан rate limit
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;        // цагт хамгийн ихдээ 10 хүсэлт
const WINDOW_MS = 60 * 60 * 1000; // 1 цаг

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // /api/analyze rate limit шалгах
  if (request.nextUrl.pathname === '/api/analyze') {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Хэт олон хүсэлт. 1 цагийн дараа дахин оролдоно уу.' },
        { status: 429 }
      );
    }
  }

  // Хамгаалагдсан routes руу нэвтрээгүй хэрэглэгч хандвал redirect
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
