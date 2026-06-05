import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  type SeasonName,
  SEASON_PALETTES,
  getBaseSeason,
  seasonNameToStoragePath,
} from '@/lib/personal-color/rule-engine';
import { SEASON_DESCRIPTIONS } from '@/lib/personal-color/season-descriptions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SEASON_MN: Record<string, string> = {
  Spring: 'Хавар', Summer: 'Зун', Autumn: 'Намар', Winter: 'Өвөл',
};

/**
 * Deliver analysis result via email.
 *
 * By default (force = false) the email is sent at most once per email+season
 * combination — if the analyses row already has email_sent = true the function
 * returns early without sending.  Pass force = true to always resend (admin use).
 */
export async function deliverResult(
  email: string,
  seasonName: string,
  imageUrl: string | null,
  { force = false }: { force?: boolean } = {},
): Promise<void> {
  const season            = seasonName as SeasonName;
  const baseSeason        = getBaseSeason(season);
  const reasoning         = SEASON_DESCRIPTIONS[season] ?? SEASON_DESCRIPTIONS['True Spring'];
  const recommendedColors = (SEASON_PALETTES[season] ?? SEASON_PALETTES['True Spring']) as string[];

  // PDF public URL from Supabase Storage
  const { folder, file: subtypeFile } = seasonNameToStoragePath(season);
  const pdfPath = `${folder}/${subtypeFile}.pdf`;
  const { data: listed } = await supabase.storage
    .from('reports')
    .list(folder, { search: `${subtypeFile}.pdf` });
  const pdfUrl = listed?.length
    ? supabase.storage.from('reports').getPublicUrl(pdfPath).data.publicUrl
    : null;

  // Find existing analyses row for this email + season
  const { data: existing } = await supabase
    .from('analyses')
    .select('id, email_sent')
    .eq('email', email)
    .eq('sub_type', season)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let analysisId: string | null = existing?.id ?? null;

  // If email was already delivered and this is not a forced resend, stop here.
  // This prevents duplicate emails from processPendingOrders, verify, etc.
  if (existing?.email_sent === true && !force) return;

  if (!existing) {
    const { data: inserted, error: insertErr } = await supabase
      .from('analyses')
      .insert({
        email,
        image_path:         imageUrl,
        season:             baseSeason,
        sub_type:           season,
        reasoning,
        recommended_colors: recommendedColors,
        email_sent:         false,
        paid:               true,
      })
      .select('id')
      .single();

    if (insertErr) console.error('analyses insert error:', insertErr);
    analysisId = inserted?.id ?? null;
  }

  // Send email
  const { RESEND_API_KEY } = process.env;
  if (!RESEND_API_KEY) return;

  const resend = new Resend(RESEND_API_KEY);
  const { error: emailErr } = await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL ?? 'Personal Color AI <noreply@personalcolor.mn>',
    to:      email,
    subject: 'Таны хувийн өнгөний оношлогоо бэлэн боллоо!',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;padding:24px;border-radius:12px">
        <h2 style="color:#333">Сайн байна уу?</h2>
        <p>Таны хувийн өнгөний шинжилгээний үр дүн бэлэн боллоо.</p>
        <div style="background:#f9f9f9;padding:16px;border-radius:8px;border-left:4px solid #7c3aed">
          <p><strong>Таны улирал:</strong> ${SEASON_MN[baseSeason] ?? baseSeason} (${season})</p>
          <p><strong>Тайлбар:</strong> ${reasoning}</p>
        </div>
        ${pdfUrl ? `
        <div style="margin-top:20px;text-align:center">
          <a href="${pdfUrl}" target="_blank"
            style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
            PDF тайланг үзэх
          </a>
        </div>` : ''}
        <hr style="margin:20px 0"/>
        <p style="font-size:12px;color:#888;text-align:center">© ${new Date().getFullYear()} Personal Color AI</p>
      </div>
    `,
  });

  if (emailErr) throw new Error(`Resend: ${JSON.stringify(emailErr)}`);

  if (analysisId) {
    await supabase.from('analyses').update({ email_sent: true }).eq('id', analysisId);
  }
}
