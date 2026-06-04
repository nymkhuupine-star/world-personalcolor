import { createClient } from '@supabase/supabase-js';
import { createBonumInvoice } from '@/lib/bonum';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as {
      email?:          unknown;
      analysisResult?: unknown;
      amount?:         unknown;
    };

    const { email, analysisResult, amount } = body;

    if (typeof email !== 'string' || !isEmail(email))
      return Response.json({ error: 'Зөв имэйл хаяг оруулна уу.' }, { status: 400 });
    if (typeof amount !== 'number' || amount <= 0)
      return Response.json({ error: 'Дүн буруу байна.' }, { status: 400 });
    if (!analysisResult || typeof analysisResult !== 'object' || Array.isArray(analysisResult))
      return Response.json({ error: 'Шинжилгээний үр дүн байхгүй байна.' }, { status: 400 });

    // Insert order — row.id becomes transactionId
    const { data: order, error: insertErr } = await supabase
      .from('analysis_orders')
      .insert({ email, analysis_result: analysisResult, amount, paid: false })
      .select('id')
      .single();

    if (insertErr || !order) {
      console.error('payment/create insert error:', insertErr);
      return Response.json({ error: 'Захиалга хадгалахад алдаа гарлаа.' }, { status: 500 });
    }

    const transactionId = order.id as string;

    // Create Bonum invoice
    let invoiceId: string;
    let followUpLink: string;
    try {
      ({ invoiceId, followUpLink } = await createBonumInvoice(transactionId, amount));
    } catch (err) {
      console.error('payment/create Bonum error:', err);
      return Response.json({ error: 'Bonum invoice үүсгэхэд алдаа гарлаа.' }, { status: 502 });
    }

    // Persist invoiceId and transactionId
    const { error: updateErr } = await supabase
      .from('analysis_orders')
      .update({ invoice_id: invoiceId, transaction_id: transactionId })
      .eq('id', transactionId);

    if (updateErr) {
      console.error('payment/create update error:', updateErr);
      return Response.json({ error: 'Захиалга шинэчлэхэд алдаа гарлаа.' }, { status: 500 });
    }

    return Response.json({ followUpLink, orderId: transactionId });
  } catch (err) {
    console.error('payment/create error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}
