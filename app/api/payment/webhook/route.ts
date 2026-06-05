import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { deliverResult } from '@/lib/deliverResult';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Bonum docs: HmacSHA256(rawBody, MERCHANT_CHECKSUM_KEY) → hex → compare x-checksum-v2
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
  amount:        number;
  currency:      string;
  completedAt?:  string;
  terminalId?:   string;
  invoiceId?:    string;   // Bonum's internal invoice ID
  transactionId?: string;  // Our transactionId we passed at invoice creation
  paymentVendor?: string;
  status?:       string;
};

type BonumWebhook = {
  type:    string;   // "PAYMENT"
  status:  string;   // "SUCCESS" | "FAILED"
  message?: string;
  body:    BonumWebhookBody;
};

type StoredAnalysis = { seasonName: string; imageUrl?: string };

const SUCCESS_STATUSES = new Set(['SUCCESS', 'PAID', 'COMPLETED', 'APPROVED']);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text().catch(() => '');
    const checksumHeader = req.headers.get('x-checksum-v2');

    // Log for Vercel Functions debug — visible at vercel.com → project → Functions → webhook
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

    const type   = (payload.type   ?? '').toUpperCase();
    const status = (payload.status ?? '').toUpperCase();

    console.log('webhook | type:', type, '| status:', status, '| body.invoiceId:', payload.body?.invoiceId, '| body.transactionId:', payload.body?.transactionId);

    if (type !== 'PAYMENT') {
      console.log('webhook: ignoring non-PAYMENT type:', type);
      return Response.json({ received: true });
    }

    if (!SUCCESS_STATUSES.has(status)) {
      console.log('webhook: non-success status:', status);
      return Response.json({ received: true });
    }

    // Bonum webhook body contains BOTH:
    //   body.invoiceId    = Bonum's own invoice ID (stored in our analysis_orders.invoice_id)
    //   body.transactionId = our UUID we passed at invoice creation (= our analysis_orders.id)
    const bonumInvoiceId   = payload.body?.invoiceId   ?? null;
    const ourTransactionId = payload.body?.transactionId ?? null;
    const completedAt      = payload.body?.completedAt ?? null;

    if (!bonumInvoiceId && !ourTransactionId) {
      console.error('webhook: no invoiceId or transactionId in body:', JSON.stringify(payload.body));
      return Response.json({ error: 'invoiceId missing' }, { status: 400 });
    }

    // Look up order — try Bonum invoiceId first, then our transactionId (UUID)
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

    if (!order) {
      console.error('webhook: order not found | bonumInvoiceId:', bonumInvoiceId, '| ourTransactionId:', ourTransactionId);
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('webhook: found order', order.id, '| already paid:', order.paid);

    const paidAt = completedAt
      ? new Date(completedAt.replace(' ', 'T')).toISOString()
      : new Date().toISOString();

    // Atomic update — race-condition safe against concurrent verify calls
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
      console.log('webhook: already paid, skipping:', order.id);
      return Response.json({ received: true });
    }

    console.log('webhook: marked paid, delivering for order:', order.id);

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
