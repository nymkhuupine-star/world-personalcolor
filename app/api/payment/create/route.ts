import { createBonumInvoice } from '@/lib/bonum';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  try {
    const body = await req.json().catch(() => ({})) as {
      email?:          unknown;
      analysisResult?: unknown;
      amount?:         unknown;
    };

    const { email, analysisResult, amount } = body;

    if (typeof email !== 'string' || !isEmail(email))
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    if (typeof amount !== 'number' || amount <= 0)
      return Response.json({ error: 'Invalid amount.' }, { status: 400 });
    if (!analysisResult || typeof analysisResult !== 'object' || Array.isArray(analysisResult))
      return Response.json({ error: 'Analysis result is missing.' }, { status: 400 });

    // Insert order — row.id becomes transactionId
    const { data: order, error: insertErr } = await supabase
      .from('analysis_orders')
      .insert({ email, analysis_result: analysisResult, amount, paid: false })
      .select('id')
      .single();

    if (insertErr || !order) {
      console.error('payment/create insert error:', insertErr);
      return Response.json({ error: 'An error occurred while saving the order.' }, { status: 500 });
    }

    const transactionId = order.id as string;

    // Create Bonum invoice
    let invoiceId: string;
    let followUpLink: string;
    try {
      ({ invoiceId, followUpLink } = await createBonumInvoice(transactionId, amount));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('payment/create Bonum error:', msg);
      return Response.json({ error: `An error occurred while creating the Bonum invoice. (${msg})` }, { status: 502 });
    }

    // Persist invoiceId and transactionId
    const { error: updateErr } = await supabase
      .from('analysis_orders')
      .update({ invoice_id: invoiceId, transaction_id: transactionId })
      .eq('id', transactionId);

    if (updateErr) {
      console.error('payment/create update error:', updateErr);
      return Response.json({ error: 'An error occurred while updating the order.' }, { status: 500 });
    }

    return Response.json({ followUpLink, orderId: transactionId });
  } catch (err) {
    console.error('payment/create error:', err);
    return Response.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
