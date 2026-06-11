import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({})) as { password?: string };
  const secret = process.env.ADMIN_SECRET;

  if (!secret || password !== secret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set('admin_token', secret, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 хоног
    path: '/',
  });

  return Response.json({ success: true });
}
