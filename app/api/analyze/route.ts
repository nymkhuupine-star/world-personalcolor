import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import {
  type SeasonName,
  SEASON_PALETTES,
  getBaseSeason,
  seasonNameToStoragePath,
} from '@/lib/personal-color/rule-engine';
import { SEASON_DESCRIPTIONS } from '@/lib/personal-color/season-descriptions';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SEASON_MN: Record<string, string> = {
  Spring: 'Хавар', Summer: 'Зун', Autumn: 'Намар', Winter: 'Өвөл',
};

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isAllowedImageUrl(v: string) {
  try {
    const u = new URL(v);
    if (u.protocol !== 'https:') return false;
    const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
    return u.hostname === supabaseHost;
  } catch { return false; }
}

export async function POST(req: Request) {
  try {
    const { RESEND_API_KEY } = process.env;
    if (!RESEND_API_KEY)
      return Response.json({ error: 'API keys missing.' }, { status: 500 });

    const body = await req.json() as {
      imageUrl: unknown;
      email: unknown;
      seasonName: unknown;
      confidence: unknown;
    };

    const { imageUrl, email, seasonName, confidence } = body;

    if (typeof email !== 'string' || !isEmail(email))
      return Response.json({ error: 'Зөв имэйл хаяг оруулна уу.' }, { status: 400 });
    if (typeof imageUrl !== 'string' || !isAllowedImageUrl(imageUrl))
      return Response.json({ error: 'Valid image URL required.' }, { status: 400 });
    if (typeof seasonName !== 'string' || !seasonName)
      return Response.json({ error: 'seasonName required.' }, { status: 400 });

    const season     = seasonName as SeasonName;
    const baseSeason = getBaseSeason(season);
    const reasoning  = SEASON_DESCRIPTIONS[season] ?? SEASON_DESCRIPTIONS['True Spring'];
    const recommendedColors: string[] = SEASON_PALETTES[season] ?? SEASON_PALETTES['True Spring'];

    // PDF URL from Supabase Storage
    const { folder, file: subtypeFile } = seasonNameToStoragePath(season);
    const pdfPath = `${folder}/${subtypeFile}.pdf`;
    const { data: listed } = await supabase.storage.from('reports').list(folder, { search: `${subtypeFile}.pdf` });
    const pdfUrl = listed?.length
      ? supabase.storage.from('reports').getPublicUrl(pdfPath).data.publicUrl
      : null;

    // Send email
    const resend = new Resend(RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Personal Color AI <onboarding@resend.dev>',
      to: email,
      subject: 'Таны хувийн өнгөний оношлогоо бэлэн боллоо!',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;padding:24px;border-radius:12px">
          <h2 style="color:#333">Сайн байна уу?</h2>
          <p>Таны хувийн өнгөний шинжилгээний үр дүн бэлэн боллоо.</p>
          <div style="background:#f9f9f9;padding:16px;border-radius:8px;border-left:4px solid #7c3aed">
            <p><strong>Таны улирал:</strong> ${SEASON_MN[baseSeason]} (${season})</p>
            <p><strong>Тайлбар:</strong> ${reasoning}</p>
          </div>
          ${pdfUrl ? `
          <div style="margin-top:20px;text-align:center">
            <a href="${pdfUrl}" target="_blank"
              style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
              📄 PDF тайланг үзэх
            </a>
          </div>` : ''}
          <hr style="margin:20px 0"/>
          <p style="font-size:12px;color:#888;text-align:center">© ${new Date().getFullYear()} Personal Color AI</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return Response.json({ error: 'Имэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу.' }, { status: 502 });
    }

    // Save to analyses table
    await supabase.from('analyses').insert({
      email,
      image_path: imageUrl,
      season: baseSeason,
      sub_type: season,
      reasoning,
      recommended_colors: recommendedColors,
      email_sent: true,
      paid: false,
    });

    return Response.json({
      canAnalyze: true,
      season: baseSeason,
      subType: season,
      reasoning,
      recommendedColors,
      confidence,
    });

  } catch (error: unknown) {
    console.error('API Error:', error);
    return Response.json({ error: 'Дотоод алдаа гарлаа. Дахин оролдоно уу.' }, { status: 500 });
  }
}
