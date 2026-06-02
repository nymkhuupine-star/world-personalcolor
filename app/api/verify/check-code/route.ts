import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

const SESSION_DAYS = 7;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { email?: unknown; code?: unknown };
    const { email, code } = body;

    if (typeof email !== 'string' || !isEmail(email))
      return Response.json({ error: 'Зөв имэйл хаяг оруулна уу.' }, { status: 400 });
    if (typeof code !== 'string' || !/^\d{6}$/.test(code))
      return Response.json({ error: 'Код буруу байна.' }, { status: 400 });

    const now = new Date().toISOString();
    const { data: codeRow, error: codeErr } = await supabase
      .from('verification_codes')
      .select('id')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (codeErr || !codeRow)
      return Response.json({ error: 'Код буруу эсвэл хугацаа дууссан байна.' }, { status: 400 });

    // Mark code as used (single-use)
    await supabase.from('verification_codes').update({ used: true }).eq('id', codeRow.id);

    // Create 7-day session token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('sessions').insert({ token, email, expires_at: expiresAt });

    const { data: analyses, error: analysesErr } = await supabase
      .from('analyses')
      .select('id, season, sub_type, reasoning, recommended_colors, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (analysesErr)
      return Response.json({ error: 'Үр дүн татахад алдаа гарлаа.' }, { status: 500 });

    return Response.json({ success: true, token, analyses: analyses ?? [] });
  } catch (err) {
    console.error('check-code error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}
