import { getBonumInvoiceStatus } from '@/lib/bonum';
import { deliverResult } from '@/lib/deliverResult';
import {
  type SeasonName,
  SEASON_PALETTES,
  getBaseSeason,
  seasonNameToStoragePath,
} from '@/lib/personal-color/rule-engine';
import { SEASON_DESCRIPTIONS } from '@/lib/personal-color/season-descriptions';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

type StoredAnalysis = { seasonName: string; imageUrl?: string };

function getPdfUrl(seasonName: string): string | null {
  try {
    const sb = getSupabaseAdmin();
    const { folder, file: subtypeFile } = seasonNameToStoragePath(seasonName as SeasonName);
    return sb.storage.from('reports').getPublicUrl(`${folder}/${subtypeFile}.pdf`).data.publicUrl;
  } catch {
    return null;
  }
}

function buildResult(stored: StoredAnalysis | null) {
  const seasonName        = stored?.seasonName ?? '';
  const season            = seasonName as SeasonName;
  const baseSeason        = getBaseSeason(season);
  const reasoning         = SEASON_DESCRIPTIONS[season] ?? SEASON_DESCRIPTIONS['True Spring'];
  const recommendedColors = (SEASON_PALETTES[season] ?? SEASON_PALETTES['True Spring']) as string[];
  return { season: baseSeason, subType: seasonName, reasoning, recommendedColors };
}

export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
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

    // PRIMARY PATH: webhook already confirmed payment — no external API call needed.
    if (order.paid) {
      return Response.json({
        success:          true,
        alreadyDelivered: true,
        result:           buildResult(stored),
        imageUrl:         stored?.imageUrl ?? '',
        pdfUrl:           stored?.seasonName ? getPdfUrl(stored.seasonName) : null,
      });
    }

    if (!order.invoice_id)
      return Response.json({ success: false, paid: false });

    // FALLBACK PATH: webhook may not have fired yet — ask Bonum directly.
    // If Bonum API is unreachable, return unpaid (never trust the redirect blindly).
    let bonumPaid = false;
    try {
      const status = await getBonumInvoiceStatus(order.invoice_id);
      bonumPaid = status.paid;
      console.log('verify: Bonum status for', orderId, '→', status.status, '| paid:', bonumPaid);
    } catch (err) {
      console.error('verify: Bonum status check failed for', orderId, ':', err);
      return Response.json({ success: false, paid: false });
    }

    if (!bonumPaid)
      return Response.json({ success: false, paid: false });

    // Bonum confirms paid — atomic update (safe against concurrent webhook)
    const { data: updatedRows } = await supabase
      .from('analysis_orders')
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq('id', order.id)
      .eq('paid', false)
      .select('id');

    // If nothing updated, webhook ran concurrently — return as already delivered
    if (!updatedRows || updatedRows.length === 0) {
      return Response.json({
        success:          true,
        alreadyDelivered: true,
        result:           buildResult(stored),
        imageUrl:         stored?.imageUrl ?? '',
        pdfUrl:           stored?.seasonName ? getPdfUrl(stored.seasonName) : null,
      });
    }

    // Deliver result and send email automatically
    if (stored?.seasonName && order.email) {
      await deliverResult(order.email, stored.seasonName, stored.imageUrl ?? null).catch(
        (err) => console.error('verify: deliverResult error:', err),
      );
    }

    return Response.json({
      success:   true,
      paid:      true,
      emailSent: true,
      result:    buildResult(stored),
      imageUrl:  stored?.imageUrl ?? '',
      pdfUrl:    stored?.seasonName ? getPdfUrl(stored.seasonName) : null,
    });

  } catch (err) {
    console.error('payment/verify error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}
