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

// Extract invoice/transaction ID from all known Bonum payload shapes
function extractField(
  payload: Record<string, unknown>,
  keys: string[],
): string | null {
  const body = payload.body as Record<string, unknown> | undefined;
  const data = payload.data as Record<string, unknown> | undefined;
  for (const k of keys) {
    const v =
      (body?.[k] as string | undefined) ??
      (data?.[k] as string | undefined) ??
      (payload[k] as string | undefined);
    if (v) return v;
  }
  return null;
}

type StoredAnalysis = { seasonName: string; imageUrl?: string };

const SUCCESS_STATUSES = new Set(['SUCCESS', 'PAID', 'COMPLETED', 'APPROVED']);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text().catch(() => '');
    const checksumHeader = req.headers.get('x-checksum-v2');

    // Log everything so we can diagnose in Vercel Functions logs
    const hdrs: Record<string, string> = {};
    req.headers.forEach((v, k) => { hdrs[k] = v; });
    console.log('webhook | headers:', JSON.stringify(hdrs));
    console.log('webhook | body:', rawBody.slice(0, 3000));

    if (checksumHeader && !verifyChecksum(rawBody, checksumHeader)) {
      console.error('webhook: invalid checksum, header:', checksumHeader);
      return Response.json({ error: 'Invalid checksum' }, { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = rawBody ? JSON.parse(rawBody) as Record<string, unknown> : {};
    } catch {
      console.error('webhook: JSON parse failed:', rawBody);
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const type   = String(payload.type   ?? payload.event ?? '').toUpperCase();
    const status = String(payload.status ?? '').toUpperCase();

    console.log('webhook | type:', type, '| status:', status);

    // Accept any payment/invoice/transaction event; ignore obviously unrelated types
    if (type && !type.includes('PAYMENT') && !type.includes('INVOICE') && !type.includes('TRANSACTION')) {
      console.log('webhook: ignoring non-payment type:', type);
      return Response.json({ received: true });
    }

    if (status && !SUCCESS_STATUSES.has(status)) {
      console.log('webhook: non-success status, ignoring:', status);
      return Response.json({ received: true });
    }

    // Bonum may send their invoiceId OR our transactionId — extract both
    const bonumInvoiceId  = extractField(payload, ['invoiceId', 'invoice_id']);
    const ourTransactionId = extractField(payload, ['transactionId', 'transaction_id', 'orderId', 'order_id']);
    const completedAt     = extractField(payload, ['completedAt', 'completed_at', 'paidAt', 'paid_at']);

    console.log('webhook | bonumInvoiceId:', bonumInvoiceId, '| ourTransactionId:', ourTransactionId);

    if (!bonumInvoiceId && !ourTransactionId) {
      console.error('webhook: no invoiceId or transactionId in payload:', JSON.stringify(payload));
      return Response.json({ error: 'invoiceId missing' }, { status: 400 });
    }

    // Look up the order — try by Bonum invoiceId first, then by our order UUID
    let order: { id: string; paid: boolean; email: string; analysis_result: unknown } | null = null;

    if (bonumInvoiceId) {
      const { data } = await supabase
        .from('analysis_orders')
        .select('id, paid, email, analysis_result')
        .eq('invoice_id', bonumInvoiceId)
        .single();
      order = data;
    }

    if (!order && ourTransactionId) {
      const { data } = await supabase
        .from('analysis_orders')
        .select('id, paid, email, analysis_result')
        .eq('id', ourTransactionId)
        .single();
      order = data;
    }

    // Last resort: maybe Bonum sent their invoiceId in the transactionId field
    if (!order && bonumInvoiceId) {
      const { data } = await supabase
        .from('analysis_orders')
        .select('id, paid, email, analysis_result')
        .eq('id', bonumInvoiceId)
        .single();
      order = data;
    }

    if (!order) {
      console.error('webhook: order not found | bonumInvoiceId:', bonumInvoiceId, '| ourTransactionId:', ourTransactionId);
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('webhook: found order', order.id, '| already paid:', order.paid);

    const paidAt = completedAt
      ? new Date(completedAt.replace(' ', 'T')).toISOString()
      : new Date().toISOString();

    // Atomic update — race-condition safe
    const { data: updatedRows, error: updateErr } = await supabase
      .from('analysis_orders')
      .update({ paid: true, paid_at: paidAt })
      .eq('id', order.id)
      .eq('paid', false)
      .select('id');

    if (updateErr) {
      console.error('webhook: update error:', updateErr);
      return Response.json({ error: 'Update failed' }, { status: 500 });
    }

    if (!updatedRows || updatedRows.length === 0) {
      console.log('webhook: already paid, skipping delivery for order:', order.id);
      return Response.json({ received: true });
    }

    console.log('webhook: paid confirmed, delivering result for order:', order.id);

    const stored = order.analysis_result as StoredAnalysis | null;
    if (stored?.seasonName && order.email) {
      await deliverResult(order.email, stored.seasonName, stored.imageUrl ?? null).catch(
        (err) => console.error('webhook: deliverResult error:', err),
      );
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error('payment/webhook error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}
