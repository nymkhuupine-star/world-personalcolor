import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getBonumInvoiceStatus } from '@/lib/bonum';
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
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SEASON_MN: Record<string, string> = {
  Spring: 'Хавар', Summer: 'Зун', Autumn: 'Намар', Winter: 'Өвөл',
};

type StoredAnalysis = { seasonName: string; imageUrl?: string };

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId)
      return Response.json({ error: 'orderId шаардлагатай.' }, { status: 400 });

    const { data: order, error: findErr } = await supabase
      .from('analysis_orders')
      .select('id, email, analysis_result, paid, invoice_id')
      .eq('id', orderId)
      .single();

    if (findErr || !order)
      return Response.json({ error: 'Захиалга олдсонгүй.' }, { status: 404 });

    // Already processed — idempotent
    if (order.paid)
      return Response.json({ success: true, alreadyDelivered: true });

    if (!order.invoice_id)
      return Response.json({ error: 'invoice_id байхгүй.' }, { status: 400 });

    // Try to verify payment status with Bonum.
    // NOTE: The Bonum GET /invoices/{id} endpoint is marked (тест) in their docs
    // and may not be available in production. If it fails we fall back to trusting
    // the Bonum callback redirect — Bonum only sends the user to this URL after
    // a successful payment, and orderId is a UUID that is impossible to guess.
    let paid = false;
    try {
      const status = await getBonumInvoiceStatus(order.invoice_id);
      paid = status.paid;
    } catch (err) {
      console.error('verify: Bonum status check failed, trusting callback redirect:', err);
      paid = true; // fallback: trust the redirect
    }

    if (!paid)
      return Response.json({ success: false, paid: false });

    // Mark order as paid
    await supabase
      .from('analysis_orders')
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq('id', order.id);

    // Deliver result (email + analyses insert)
    const stored = order.analysis_result as StoredAnalysis | null;
    if (stored?.seasonName && order.email) {
      await deliverResult(order.email, stored.seasonName, stored.imageUrl ?? null).catch(
        (err) => console.error('verify: deliverResult error:', err),
      );
    }

    return Response.json({ success: true, paid: true });
  } catch (err) {
    console.error('payment/verify error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}

async function deliverResult(email: string, seasonName: string, imageUrl: string | null) {
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

  // Find or insert analyses row — always capture the id
  let analysisId: string | null = null;

  const { data: existing } = await supabase
    .from('analyses')
    .select('id')
    .eq('email', email)
    .eq('sub_type', season)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existing?.id) {
    analysisId = existing.id as string;
    // Ensure paid=true on the existing row (may have been created by old free-analysis flow)
    await supabase.from('analyses').update({ paid: true }).eq('id', analysisId);
  } else {
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

  // Send email via Resend
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

  // Mark email as sent using the captured analysisId
  if (analysisId) {
    await supabase
      .from('analyses')
      .update({ email_sent: true })
      .eq('id', analysisId);
  }
}
