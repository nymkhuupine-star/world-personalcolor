import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { REPORT_GROUPS, isSeasonKey, isSubtypeKeyForSeason, reportId } from '@/utils/reportPdfs';

export const runtime = 'nodejs';

const BUCKET = 'reports';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function requireAdmin(): Promise<{ error: Response } | { error: null }> {
  const { userId } = await auth();
  if (!userId) return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';

  if (!adminEmail || email !== adminEmail) {
    return { error: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { error: null };
}

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return check.error;

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
  const check = await requireAdmin();
  if (check.error) return check.error;

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
  const check = await requireAdmin();
  if (check.error) return check.error;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const season = formData.get('season') as string | null;
    const subtype = formData.get('subtype') as string | null;

    if (!file || !season || !subtype) {
      return Response.json({ error: 'file, season, subtype required.' }, { status: 400 });
    }
    if (!isSeasonKey(season) || !isSubtypeKeyForSeason(season, subtype)) {
      return Response.json({ error: 'Invalid season or subtype.' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return Response.json({ error: 'Only PDF files allowed.' }, { status: 400 });
    }

    const sb = adminClient();
    const path = `${season}/${subtype}.pdf`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (error) {
      console.error('Supabase upload error:', error);
      return Response.json({ error: 'Failed to upload file.' }, { status: 500 });
    }

    return Response.json({ success: true, path });
  } catch (err) {
    console.error('PDF upload error:', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
