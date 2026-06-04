import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { Resend } from 'resend';
import {
  type SeasonName,
  SEASON_PALETTES,
  getBaseSeason,
  seasonNameToStoragePath,
} from '@/lib/personal-color/rule-engine';
import { SEASON_DESCRIPTIONS } from '@/lib/personal-color/season-descriptions';

export const runtime = 'nodejs';

function verifyChecksum(rawBody: string, headerValue: string): boolean {
  const key = process.env.BONUM_MERCHANT_CHECKSUM_KEY;
  if (!key) return true; // key тохируулаагүй бол алгасна (dev)
  const computed = createHmac('sha256', Buffer.from(key, 'utf8'))
    .update(rawBody, 'utf8')
    .digest('hex');
  return computed === headerValue;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SEASON_MN: Record<string, string> = {
  Spring: 'Хавар', Summer: 'Зун', Autumn: 'Намар', Winter: 'Өвөл',
};

type BonumWebhook = {
  type:   string;
  status: string;
  body: {
    amount:        number;
    currency:      string;
    completedAt:   string;
    terminalId:    string;
    invoiceId:     string;
    paymentVendor: string;
  };
};

type StoredAnalysis = {
  seasonName: string;
  imageUrl?:  string;
};

export async function POST(req: Request) {
  try {
    // Raw body-г эхлээд text-ээр авна — checksum raw JSON дээр тооцогддог
    const rawBody = await req.text().catch(() => '');
    const checksumHeader = req.headers.get('x-checksum-v2');

    if (checksumHeader && !verifyChecksum(rawBody, checksumHeader)) {
      console.error('webhook: invalid checksum');
      return Response.json({ error: 'Invalid checksum' }, { status: 401 });
    }

    const payload = rawBody ? JSON.parse(rawBody) as BonumWebhook : null;

    if (!payload || payload.type !== 'PAYMENT' || payload.status !== 'SUCCESS')
      return Response.json({ received: true });

    const { invoiceId, completedAt } = payload.body;
    if (!invoiceId)
      return Response.json({ error: 'invoiceId missing' }, { status: 400 });

    const { data: order, error: findErr } = await supabase
      .from('analysis_orders')
      .select('id, paid, email, analysis_result')
      .eq('invoice_id', invoiceId)
      .single();

    if (findErr || !order)
      return Response.json({ error: 'Order not found' }, { status: 404 });

    // Idempotent — already processed
    if (order.paid)
      return Response.json({ received: true });

    // Bonum completedAt format: "2026-01-29 11:20:33" — replace space with T for valid ISO
    const paidAt = completedAt
      ? new Date(completedAt.replace(' ', 'T')).toISOString()
      : new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('analysis_orders')
      .update({ paid: true, paid_at: paidAt })
      .eq('id', order.id);

    if (updateErr) {
      console.error('webhook update error:', updateErr);
      return Response.json({ error: 'Update failed' }, { status: 500 });
    }

    const stored = order.analysis_result as StoredAnalysis | null;
    if (stored?.seasonName && order.email) {
      await deliverResult(order.email, stored.seasonName, stored.imageUrl ?? null).catch(
        (err) => console.error('deliverResult error:', err),
      );
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error('payment/webhook error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}

async function deliverResult(email: string, seasonName: string, imageUrl: string | null) {
  const season            = seasonName as SeasonName;
  const baseSeason        = getBaseSeason(season);
  const reasoning         = SEASON_DESCRIPTIONS[season] ?? SEASON_DESCRIPTIONS['True Spring'];
  const recommendedColors = (SEASON_PALETTES[season] ?? SEASON_PALETTES['True Spring']) as string[];

  // PDF public URL from Supabase Storage (reports bucket must be public)
  const { folder, file: subtypeFile } = seasonNameToStoragePath(season);
  const pdfPath = `${folder}/${subtypeFile}.pdf`;
  const { data: listed } = await supabase.storage
    .from('reports')
    .list(folder, { search: `${subtypeFile}.pdf` });
  const pdfUrl = listed?.length
    ? supabase.storage.from('reports').getPublicUrl(pdfPath).data.publicUrl
    : null;

  // Find or insert analyses row — always capture id and ensure paid: true
  let analysisRowId: string | null = null;

  const { data: existing } = await supabase
    .from('analyses')
    .select('id')
    .eq('email', email)
    .eq('sub_type', season)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existing?.id) {
    analysisRowId = existing.id as string;
    await supabase.from('analyses').update({ paid: true }).eq('id', analysisRowId);
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
    analysisRowId = inserted?.id ?? null;
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

  if (emailErr) {
    console.error('Resend error:', emailErr);
    return;
  }

  // Mark email as successfully sent
  if (analysisRowId) {
    await supabase
      .from('analyses')
      .update({ email_sent: true })
      .eq('id', analysisRowId);
  }
}
