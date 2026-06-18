import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { deliverResult } from '@/lib/deliverResult';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function verifyChecksum(rawBody: string, headerValue: string): boolean {
  const key = process.env.BONUM_MERCHANT_CHECKSUM_KEY;

  if (!key) {
    console.warn('webhook: BONUM_MERCHANT_CHECKSUM_KEY not set — skipping signature check');
    return true;
  }

  const computed = createHmac('sha256', Buffer.from(key, 'utf8'))
    .update(rawBody, 'utf8')
    .digest('hex');

  return computed === headerValue;
}

type BonumWebhookBody = {
  amount: number;
  currency: string;
  completedAt?: string;
  terminalId?: string;
  invoiceId?: string;
  transactionId?: string;
  paymentVendor?: string;
  status?: string;
};

type BonumWebhook = {
  type: string;
  status: string;
  message?: string;
  body: BonumWebhookBody;
};

type StoredAnalysis = {
  seasonName: string;
  imageUrl?: string | null;
  confidence?: number;
  reasoning?: string;
  recommendedColors?: string[];
};

const SUCCESS_STATUSES = new Set(['SUCCESS', 'PAID', 'COMPLETED', 'APPROVED']);

function getBaseSeasonFromSeasonName(seasonName: string) {
  if (seasonName.includes('Spring')) return 'Spring';
  if (seasonName.includes('Summer')) return 'Summer';
  if (seasonName.includes('Autumn')) return 'Autumn';
  if (seasonName.includes('Winter')) return 'Winter';
  return seasonName;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text().catch(() => '');
    const checksumHeader = req.headers.get('x-checksum-v2');

    console.log('webhook | raw body:', rawBody.slice(0, 3000));

    if (checksumHeader && !verifyChecksum(rawBody, checksumHeader)) {
      console.error('webhook: invalid checksum');
      return Response.json({ error: 'Invalid checksum' }, { status: 401 });
    }

    let payload: BonumWebhook;

    try {
      payload = JSON.parse(rawBody) as BonumWebhook;
    } catch {
      console.error('webhook: JSON parse failed:', rawBody);
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const type = (payload.type ?? '').toUpperCase();
    const status = (payload.status ?? '').toUpperCase();

    console.log(
      'webhook | type:',
      type,
      '| status:',
      status,
      '| body.invoiceId:',
      payload.body?.invoiceId,
      '| body.transactionId:',
      payload.body?.transactionId,
    );

    if (type !== 'PAYMENT') {
      return Response.json({ received: true });
    }

    if (!SUCCESS_STATUSES.has(status)) {
      return Response.json({ received: true });
    }

    const bonumInvoiceId = payload.body?.invoiceId ?? null;
    const ourTransactionId = payload.body?.transactionId ?? null;
    const completedAt = payload.body?.completedAt ?? null;

    if (!bonumInvoiceId && !ourTransactionId) {
      console.error('webhook: no invoiceId or transactionId in body:', payload.body);
      return Response.json({ error: 'invoiceId missing' }, { status: 400 });
    }

    let order: {
      id: string;
      paid: boolean;
      email: string;
      analysis_result: unknown;
    } | null = null;

    if (bonumInvoiceId) {
      const { data, error } = await supabase
        .from('analysis_orders')
        .select('id, paid, email, analysis_result')
        .eq('invoice_id', bonumInvoiceId)
        .single();

      if (error) {
        console.warn('webhook: order lookup by invoice_id failed:', error.message);
      }

      order = data;
    }

    if (!order && ourTransactionId) {
      const { data, error } = await supabase
        .from('analysis_orders')
        .select('id, paid, email, analysis_result')
        .eq('id', ourTransactionId)
        .single();

      if (error) {
        console.warn('webhook: order lookup by id failed:', error.message);
      }

      order = data;
    }

    if (!order) {
      console.error(
        'webhook: order not found | bonumInvoiceId:',
        bonumInvoiceId,
        '| ourTransactionId:',
        ourTransactionId,
      );

      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // completedAt is Mongolia local time (UTC+8) — append offset before parsing
    const paidAt = completedAt
      ? new Date(completedAt.replace(' ', 'T') + '+08:00').toISOString()
      : new Date().toISOString();

    const { data: updatedRows, error: updateErr } = await supabase
      .from('analysis_orders')
      .update({
        paid: true,
        paid_at: paidAt,
      })
      .eq('id', order.id)
      .eq('paid', false)
      .select('id');

    if (updateErr) {
      console.error('webhook: update error:', updateErr);
      return Response.json({ error: 'Update failed' }, { status: 500 });
    }

    if (!updatedRows || updatedRows.length === 0) {
      console.log('webhook: already paid, skipping:', order.id);
      return Response.json({ received: true });
    }

    const stored = order.analysis_result as StoredAnalysis | null;
    const normalizedEmail = order.email.toLowerCase().trim();

    if (!stored?.seasonName || !normalizedEmail) {
      console.error('webhook: missing stored analysis or email:', {
        email: order.email,
        stored,
      });

      return Response.json({ received: true });
    }

    await deliverResult(
      normalizedEmail,
      stored.seasonName,
      stored.imageUrl ?? null,
      { skipEmail: true },
    ).catch((err) => {
      console.error('webhook: deliverResult error:', err);
    });

    const { error: analysisInsertError } = await supabase
      .from('analyses')
      .insert({
        email: normalizedEmail,
        image_path: stored.imageUrl ?? null,
        season: getBaseSeasonFromSeasonName(stored.seasonName),
        sub_type: stored.seasonName,
        reasoning: stored.reasoning ?? null,
        recommended_colors: stored.recommendedColors ?? null,
        email_sent: true,
        paid: true,
        order_id: order.id,
      });

    if (analysisInsertError) {
      console.error('webhook: analyses insert error:', analysisInsertError);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error('payment/webhook error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}