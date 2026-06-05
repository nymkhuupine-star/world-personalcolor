import { createClient } from '@supabase/supabase-js';
import { getBonumInvoiceStatus } from '@/lib/bonum';
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

    // Webhook already confirmed payment — return immediately without re-checking Bonum.
    if (order.paid) {
      const stored = order.analysis_result as StoredAnalysis | null;
      const seasonName        = stored?.seasonName ?? '';
      const season            = seasonName as SeasonName;
      const baseSeason        = getBaseSeason(season);
      const reasoning         = SEASON_DESCRIPTIONS[season] ?? SEASON_DESCRIPTIONS['True Spring'];
      const recommendedColors = (SEASON_PALETTES[season] ?? SEASON_PALETTES['True Spring']) as string[];

      return Response.json({
        success: true,
        alreadyDelivered: true,
        result:  { season: baseSeason, subType: seasonName, reasoning, recommendedColors },
        imageUrl: stored?.imageUrl ?? '',
      });
    }

    if (!order.invoice_id)
      return Response.json({ error: 'invoice_id байхгүй.' }, { status: 400 });

    // Fallback: webhook may be slightly delayed — check Bonum directly.
    // If Bonum API is unreachable, return unpaid rather than trusting the redirect.
    let paid = false;
    try {
      const status = await getBonumInvoiceStatus(order.invoice_id);
      paid = status.paid;
    } catch (err) {
      console.error('verify: Bonum status check failed:', err);
      return Response.json({ success: false, paid: false });
    }

    if (!paid)
      return Response.json({ success: false, paid: false });

    // Atomic update: only marks paid if webhook has not already done so.
    const { data: updatedRows } = await supabase
      .from('analysis_orders')
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq('id', order.id)
      .eq('paid', false)
      .select('id');

    // If no rows updated, webhook ran concurrently and already handled it.
    if (!updatedRows || updatedRows.length === 0) {
      const stored = order.analysis_result as StoredAnalysis | null;
      const seasonName        = stored?.seasonName ?? '';
      const season            = seasonName as SeasonName;
      const baseSeason        = getBaseSeason(season);
      const reasoning         = SEASON_DESCRIPTIONS[season] ?? SEASON_DESCRIPTIONS['True Spring'];
      const recommendedColors = (SEASON_PALETTES[season] ?? SEASON_PALETTES['True Spring']) as string[];

      return Response.json({
        success: true,
        alreadyDelivered: true,
        result:  { season: baseSeason, subType: seasonName, reasoning, recommendedColors },
        imageUrl: stored?.imageUrl ?? '',
      });
    }

    const stored = order.analysis_result as StoredAnalysis | null;
    if (stored?.seasonName && order.email) {
      await deliverResult(order.email, stored.seasonName, stored.imageUrl ?? null).catch(
        (err) => console.error('verify: deliverResult error:', err),
      );
    }

    const seasonName        = stored?.seasonName ?? '';
    const season            = seasonName as SeasonName;
    const baseSeason        = getBaseSeason(season);
    const reasoning         = SEASON_DESCRIPTIONS[season] ?? SEASON_DESCRIPTIONS['True Spring'];
    const recommendedColors = (SEASON_PALETTES[season] ?? SEASON_PALETTES['True Spring']) as string[];

    return Response.json({
      success: true,
      paid:    true,
      result:  { season: baseSeason, subType: seasonName, reasoning, recommendedColors },
      imageUrl: stored?.imageUrl ?? '',
    });
  } catch (err) {
    console.error('payment/verify error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}
