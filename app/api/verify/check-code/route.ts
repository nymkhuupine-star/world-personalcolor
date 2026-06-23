import { randomUUID } from 'crypto';
import {
  type SeasonName,
  SEASON_PALETTES,
  getBaseSeason,
} from '@/lib/personal-color/rule-engine';
import { SEASON_DESCRIPTIONS } from '@/lib/personal-color/season-descriptions';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

const SESSION_DAYS = 7;

type AnalysisRow = {
  id: string;
  season: string;
  sub_type: string;
  reasoning: string | null;
  recommended_colors: string[] | null;
  created_at: string;
};

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  try {
    const body = await req.json().catch(() => ({})) as { email?: unknown; code?: unknown };
    const { email, code } = body;

    if (typeof email !== 'string' || !isEmail(email))
      return Response.json({ error: 'Зөв имэйл хаяг оруулна уу.' }, { status: 400 });
    if (typeof code !== 'string' || !/^\d{6}$/.test(code))
      return Response.json({ error: 'Код буруу байна.' }, { status: 400 });

    const now = new Date().toISOString();
    const { data: codeRow, error: codeErr } = await supabase
      .from('verification_codes')
      .select('id')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (codeErr || !codeRow)
      return Response.json({ error: 'Код буруу эсвэл хугацаа дууссан байна.' }, { status: 400 });

    await supabase.from('verification_codes').update({ used: true }).eq('id', codeRow.id);

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('sessions').insert({ token, email, expires_at: expiresAt });

    // Primary: query analyses table
    const { data: analyses } = await supabase
      .from('analyses')
      .select('id, season, sub_type, reasoning, recommended_colors, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false });

    let finalAnalyses: AnalysisRow[] = (analyses ?? []) as AnalysisRow[];

    // Fallback: if analyses empty, build from paid analysis_orders
    // (handles case where analyses row failed to insert but webhook ran)
    if (finalAnalyses.length === 0) {
      const { data: paidOrders } = await supabase
        .from('analysis_orders')
        .select('id, analysis_result, paid_at')
        .eq('email', email)
        .eq('paid', true)
        .order('paid_at', { ascending: false })
        .limit(10);

      if (paidOrders?.length) {
        finalAnalyses = paidOrders
          .filter(o => (o.analysis_result as { seasonName?: string } | null)?.seasonName)
          .map(o => {
            const stored = o.analysis_result as { seasonName: string };
            const season = stored.seasonName as SeasonName;
            const baseSeason = getBaseSeason(season);
            return {
              id: o.id,
              season: baseSeason,
              sub_type: stored.seasonName,
              reasoning: SEASON_DESCRIPTIONS[season] ?? null,
              recommended_colors: (SEASON_PALETTES[season] ?? []) as string[],
              created_at: (o.paid_at as string | null) ?? now,
            };
          });
      }
    }

    return Response.json({ success: true, token, analyses: finalAnalyses });
  } catch (err) {
    console.error('check-code error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}

// processPendingOrders — kept for future admin use, not called from OTP flow
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _processPendingOrders(_email: string) { /* reserved */ }
