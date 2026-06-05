import { createClient } from '@supabase/supabase-js';
import {
  type SeasonName,
  SEASON_PALETTES,
  getBaseSeason,
} from '@/lib/personal-color/rule-engine';
import { SEASON_DESCRIPTIONS } from '@/lib/personal-color/season-descriptions';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type AnalysisRow = {
  id: string;
  season: string;
  sub_type: string;
  reasoning: string | null;
  recommended_colors: string[] | null;
  created_at: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { token?: unknown };
    const { token } = body;

    if (typeof token !== 'string' || !token)
      return Response.json({ error: 'Token шаардлагатай.' }, { status: 400 });

    const now = new Date().toISOString();
    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .select('email, expires_at')
      .eq('token', token)
      .gt('expires_at', now)
      .single();

    if (sessionErr || !session)
      return Response.json({ error: 'Session дууссан байна. Дахин нэвтэрнэ үү.' }, { status: 401 });

    const { data: analyses, error: analysesErr } = await supabase
      .from('analyses')
      .select('id, season, sub_type, reasoning, recommended_colors, created_at')
      .eq('email', session.email)
      .order('created_at', { ascending: false });

    if (analysesErr)
      return Response.json({ error: 'Үр дүн татахад алдаа гарлаа.' }, { status: 500 });

    let finalAnalyses: AnalysisRow[] = (analyses ?? []) as AnalysisRow[];

    // Fallback: build from paid analysis_orders if analyses table is empty
    if (finalAnalyses.length === 0) {
      const { data: paidOrders } = await supabase
        .from('analysis_orders')
        .select('id, analysis_result, paid_at')
        .eq('email', session.email)
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

    return Response.json({
      success: true,
      email: session.email,
      expiresAt: session.expires_at,
      analyses: finalAnalyses,
    });
  } catch (err) {
    console.error('results-by-token error:', err);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}
