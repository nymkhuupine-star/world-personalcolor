import { createClient } from '@supabase/supabase-js';
import { sendMail } from '@/lib/mailer';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { email?: unknown };
    const { email } = body;

    if (typeof email !== 'string' || !isEmail(email))
      return Response.json({ error: 'Зөв имэйл хаяг оруулна уу.' }, { status: 400 });

    // Rate limit: max 3 codes per email per 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count, error: countErr } = await supabase
      .from('verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', tenMinAgo);

    if (countErr) {
      console.error('verification_codes table error:', countErr);
      return Response.json(
        { error: 'Суурь өгөгдлийн сан алдаа. Supabase migration ажиллуулсан уу?' },
        { status: 500 }
      );
    }

    if ((count ?? 0) >= 3)
      return Response.json(
        { error: 'Хэт олон хүсэлт. 10 минутын дараа дахин оролдоно уу.' },
        { status: 429 }
      );

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertErr } = await supabase
      .from('verification_codes')
      .insert({ email, code, expires_at: expiresAt, used: false });

    if (insertErr) {
      console.error('Insert error:', insertErr);
      return Response.json({ error: 'Код хадгалахад алдаа гарлаа.' }, { status: 500 });
    }

    const year = new Date().getFullYear();
    await sendMail({
      to: email,
      subject: 'Таны баталгаажуулах код',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;border:1px solid #eee;padding:32px;border-radius:12px;text-align:center">
          <h2 style="color:#333;margin-bottom:8px">Баталгаажуулах код</h2>
          <p style="color:#666;margin-bottom:24px">Таны хувийн өнгөний үр дүнг харахын тулд доорх кодыг оруулна уу.</p>
          <div style="background:#f5f0ff;border:2px dashed #7c3aed;border-radius:12px;padding:20px 32px;display:inline-block;margin-bottom:24px">
            <span style="font-size:40px;font-weight:900;letter-spacing:10px;color:#7c3aed">${code}</span>
          </div>
          <p style="color:#999;font-size:13px">Энэ код 10 минутын дараа хүчингүй болно.</p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
          <p style="font-size:12px;color:#bbb">Хэрэв та энэ хүсэлт гаргаагүй бол имэйлийг үл тоомсорлоно уу.</p>
          <p style="font-size:12px;color:#ccc;margin-top:8px">© ${year} Personal Color AI</p>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('send-code unexpected error:', err);
    return Response.json({ error: 'Имэйл илгээхэд алдаа гарлаа.' }, { status: 500 });
  }
}
