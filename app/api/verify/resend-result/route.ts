import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { seasonNameToStoragePath, getBaseSeason, type SeasonName } from '@/lib/personal-color/rule-engine';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SEASON_MN: Record<string, string> = {
  Spring: 'Хавар', Summer: 'Зун', Autumn: 'Намар', Winter: 'Өвөл',
};

export async function POST(req: Request) {
  try {
    const { RESEND_API_KEY } = process.env;
    if (!RESEND_API_KEY)
      return Response.json({ error: 'Server configuration error.' }, { status: 500 });

    const body = await req.json().catch(() => ({})) as { email?: unknown; analysisId?: unknown };
    const { email, analysisId } = body;

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return Response.json({ error: 'Зөв имэйл хаяг оруулна уу.' }, { status: 400 });
    if (typeof analysisId !== 'string' || !analysisId)
      return Response.json({ error: 'analysisId шаардлагатай.' }, { status: 400 });

    // Try analyses table first (unauthenticated users), then user_analyses (authenticated)
    let analysis: { season: string; sub_type: string; reasoning: string | null } | null = null;

    const { data: a1 } = await supabase
      .from('analyses')
      .select('season, sub_type, reasoning')
      .eq('id', analysisId)
      .eq('email', email)
      .single();

    if (a1) {
      analysis = a1;
    } else {
      const { data: a2 } = await supabase
        .from('user_analyses')
        .select('season, sub_type, reasoning')
        .eq('id', analysisId)
        .eq('email', email)
        .single();
      if (a2) analysis = a2;
    }

    if (!analysis)
      return Response.json({ error: 'Үр дүн олдсонгүй.' }, { status: 404 });

    // PDF URL from storage
    const { folder, file: subtypeFile } = seasonNameToStoragePath(analysis.sub_type as SeasonName);
    const pdfPath = `${folder}/${subtypeFile}.pdf`;
    const { data: listed } = await supabase.storage.from('reports').list(folder, { search: `${subtypeFile}.pdf` });
    const pdfUrl = listed?.length
      ? supabase.storage.from('reports').getPublicUrl(pdfPath).data.publicUrl
      : null;

    const baseSeason = getBaseSeason(analysis.sub_type as SeasonName);
    const seasonMn = SEASON_MN[baseSeason] ?? baseSeason;

    const resend = new Resend(RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: 'Personal Color AI <onboarding@resend.dev>',
      to: email,
      subject: `Таны хувийн өнгөний үр дүн — ${seasonMn} (${analysis.sub_type})`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;padding:24px;border-radius:12px">
          <h2 style="color:#333">Сайн байна уу?</h2>
          <p>Таны хувийн өнгөний шинжилгээний үр дүн доор байна.</p>
          <div style="background:#f9f9f9;padding:16px;border-radius:8px;border-left:4px solid #7c3aed">
            <p><strong>Таны улирал:</strong> ${seasonMn} (${analysis.sub_type})</p>
            ${analysis.reasoning ? `<p><strong>Тайлбар:</strong> ${analysis.reasoning}</p>` : ''}
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
      return Response.json({ error: 'Имэйл илгээхэд алдаа гарлаа.' }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('resend-result error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}
