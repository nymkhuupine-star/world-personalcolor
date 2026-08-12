import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin-auth';
import { REPORT_GROUPS, isSeasonKey, isSubtypeKeyForSeason, reportId } from '@/utils/reportPdfs';

export const runtime = 'nodejs';

const BUCKET = 'reports';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const sb = adminClient();
  const statuses: Record<string, boolean> = {};

  await Promise.all(
    REPORT_GROUPS.map(async (group) => {
      const { data } = await sb.storage.from(BUCKET).list(group.key);
      const names = new Set((data ?? []).map((f) => f.name));
      for (const s of group.subtypes) {
        statuses[reportId(group.key, s.key)] = names.has(`${s.key}.pdf`);
      }
    })
  );

  return Response.json(statuses);
}

export async function DELETE(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { season, subtype } = (await req.json()) as { season?: string; subtype?: string };

    if (typeof season !== 'string' || !isSeasonKey(season)) {
      return Response.json({ error: 'Invalid season.' }, { status: 400 });
    }
    if (typeof subtype !== 'string' || !isSubtypeKeyForSeason(season, subtype)) {
      return Response.json({ error: 'Invalid subtype.' }, { status: 400 });
    }

    const sb = adminClient();
    const { error } = await sb.storage.from(BUCKET).remove([`${season}/${subtype}.pdf`]);
    if (error) {
      console.error('Supabase delete error:', error);
      return Response.json({ error: 'Failed to delete file.' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('PDF delete error:', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { season, subtype } = (await req.json()) as { season?: string; subtype?: string };

    if (typeof season !== 'string' || !isSeasonKey(season)) {
      return Response.json({ error: 'Invalid season.' }, { status: 400 });
    }
    if (typeof subtype !== 'string' || !isSubtypeKeyForSeason(season, subtype)) {
      return Response.json({ error: 'Invalid subtype.' }, { status: 400 });
    }

    const sb = adminClient();
    const path = `${season}/${subtype}.pdf`;

    // Delete existing file first so the signed URL works as an upsert.
    await sb.storage.from(BUCKET).remove([path]);

    const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      console.error('Supabase signed URL error:', error);
      return Response.json({ error: 'Failed to create upload URL.' }, { status: 500 });
    }

    return Response.json({ signedUrl: data.signedUrl, token: data.token, path });
  } catch (err) {
    console.error('PDF signed URL error:', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}