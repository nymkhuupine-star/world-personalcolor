import { createClient } from '@supabase/supabase-js';
import { deliverResult } from '@/lib/deliverResult';
import {
  type SeasonName,
  SEASON_PALETTES,
  getBaseSeason,
} from '@/lib/personal-color/rule-engine';
import { SEASON_DESCRIPTIONS } from '@/lib/personal-color/season-descriptions';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type StoredAnalysis = { seasonName: string; imageUrl?: string };

function buildResult(stored: StoredAnalysis | null) {
  const seasonName        = stored?.seasonName ?? '';
  const season            = seasonName as SeasonName;
  const baseSeason        = getBaseSeason(season);
  const reasoning         = SEASON_DESCRIPTIONS[season] ?? SEASON_DESCRIPTIONS['True Spring'];
  const recommendedColors = (SEASON_PALETTES[season] ?? SEASON_PALETTES['True Spring']) as string[];
  return { season: baseSeason, subType: seasonName, reasoning, recommendedColors };
}

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

    const stored = order.analysis_result as StoredAnalysis | null;

    // Webhook already confirmed payment — fast path, no external API call needed.
    if (order.paid) {
      return Response.json({
        success:          true,
        alreadyDelivered: true,
        result:           buildResult(stored),
        imageUrl:         stored?.imageUrl ?? '',
      });
    }

    // Payment not yet confirmed by webhook. Tell the client to retry.
    return Response.json({ success: false, paid: false });

  } catch (err) {
    console.error('payment/verify error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}
