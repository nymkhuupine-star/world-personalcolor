import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { token?: unknown };
    const { token } = body;

    if (typeof token !== 'string' || !token)
      return Response.json({ error: 'Token шаардлагатай.' }, { status: 400 });

    const now = new Date().toISOString();
    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .select('email, expires_at')
      .eq('token', token)
      .gt('expires_at', now)
      .single();

    if (sessionErr || !session)
      return Response.json({ error: 'Session дууссан байна. Дахин нэвтэрнэ үү.' }, { status: 401 });

    const { data: analyses, error: analysesErr } = await supabase
      .from('analyses')
      .select('id, season, sub_type, reasoning, recommended_colors, created_at')
      .eq('email', session.email)
      .order('created_at', { ascending: false });

    if (analysesErr)
      return Response.json({ error: 'Үр дүн татахад алдаа гарлаа.' }, { status: 500 });

    return Response.json({
      success: true,
      email: session.email,
      expiresAt: session.expires_at,
      analyses: analyses ?? [],
    });
  } catch (err) {
    console.error('results-by-token error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}
