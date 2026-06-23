import { auth } from '@clerk/nextjs/server';
import { getBaseSeason, SEASON_PALETTES, seasonNameToStoragePath } from '@/lib/personal-color/rule-engine';
import type { SeasonName } from '@/lib/personal-color/rule-engine';
import { SEASON_DESCRIPTIONS_EN } from '@/lib/personal-color/style-guide';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

function getPdfUrl(seasonName: string): string | null {
  try {
    const sb = getSupabaseAdmin();
    const { folder, file } = seasonNameToStoragePath(seasonName as SeasonName);
    return sb.storage.from('reports').getPublicUrl(`${folder}/${file}.pdf`).data.publicUrl;
  } catch {
    return null;
  }
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionClaims } = await auth();
  const email = (sessionClaims?.email as string | undefined) ?? '';

  if (!email) return Response.json({ error: 'No email found' }, { status: 400 });

  const { data, error } = await supabase
    .from('analysis_orders')
    .select('id, email, analysis_result, paid_at, created_at')
    .eq('email', email)
    .eq('paid', true)
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const analyses = (data ?? []).map((row) => {
    const stored = row.analysis_result as { seasonName?: string; imageUrl?: string } | null;
    const seasonName = stored?.seasonName ?? '';
    const baseSeason = getBaseSeason(seasonName as SeasonName);
    return {
      id: row.id,
      seasonName,
      baseSeason,
      description: SEASON_DESCRIPTIONS_EN[seasonName as SeasonName] ?? '',
      palette: SEASON_PALETTES[seasonName as SeasonName] ?? [],
      pdfUrl: seasonName ? getPdfUrl(seasonName) : null,
      date: row.paid_at ?? row.created_at,
    };
  });

  return Response.json({ analyses });
}
