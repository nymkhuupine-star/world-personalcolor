import { createClient } from '@supabase/supabase-js';
import { seasonNameToStoragePath, type SeasonName } from '@/lib/personal-color/rule-engine';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type StoredAnalysis = { seasonName: string };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId)
    return new Response('orderId шаардлагатай.', { status: 400 });

  const { data: order, error } = await supabase
    .from('analysis_orders')
    .select('paid, analysis_result')
    .eq('id', orderId)
    .single();

  if (error || !order)
    return new Response('Захиалга олдсонгүй.', { status: 404 });

  if (!order.paid)
    return new Response('Төлбөр баталгаажаагүй байна.', { status: 403 });

  const stored = order.analysis_result as StoredAnalysis | null;
  if (!stored?.seasonName)
    return new Response('Мэдээлэл дутуу байна.', { status: 400 });

  const { folder, file: subtypeFile } = seasonNameToStoragePath(stored.seasonName as SeasonName);
  const pdfPath = `${folder}/${subtypeFile}.pdf`;

  const { data, error: downloadErr } = await supabase.storage
    .from('reports')
    .download(pdfPath);

  if (downloadErr || !data)
    return new Response('PDF олдсонгүй.', { status: 404 });

  const buffer = await data.arrayBuffer();

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
