import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { REPORT_GROUPS, isSeasonKey, isSubtypeKeyForSeason, reportId } from '@/utils/reportPdfs';

export const runtime = 'nodejs';

const BUCKET = 'reports';
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp'] as const;
type AllowedExt = (typeof ALLOWED_EXTS)[number];

const MIME_TO_EXT: Record<string, AllowedExt> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
};

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function requireAdmin(): Promise<{ error: Response } | { error: null }> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  const secret = process.env.ADMIN_SECRET;
  if (!secret || token !== secret)
    return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  return { error: null };
}

/** All possible image paths for a subtype — used to find/remove whichever extension is currently stored. */
function imageVariantPaths(season: string, subtype: string) {
  return ALLOWED_EXTS.map((ext) => `${season}/${subtype}.${ext}`);
}

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return check.error;

  const sb = adminClient();
  const statuses: Record<string, string | null> = {};

  await Promise.all(
    REPORT_GROUPS.map(async (group) => {
      const { data } = await sb.storage.from(BUCKET).list(group.key);
      const names = new Set((data ?? []).map((f) => f.name));
      for (const s of group.subtypes) {
        const match = ALLOWED_EXTS.find((ext) => names.has(`${s.key}.${ext}`));
        statuses[reportId(group.key, s.key)] = match ?? null;
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
    const { error } = await sb.storage.from(BUCKET).remove(imageVariantPaths(season, subtype));
    if (error) {
      console.error('Supabase image delete error:', error);
      return Response.json({ error: 'Failed to delete image.' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Image delete error:', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  try {
    const { season, subtype, mimeType } = (await req.json()) as { season?: string; subtype?: string; mimeType?: string };

    if (typeof season !== 'string' || !isSeasonKey(season)) {
      return Response.json({ error: 'Invalid season.' }, { status: 400 });
    }
    if (typeof subtype !== 'string' || !isSubtypeKeyForSeason(season, subtype)) {
      return Response.json({ error: 'Invalid subtype.' }, { status: 400 });
    }
    const ext = typeof mimeType === 'string' ? MIME_TO_EXT[mimeType] : undefined;
    if (!ext) {
      return Response.json({ error: 'Only JPG, PNG or WEBP images are allowed.' }, { status: 400 });
    }

    const sb = adminClient();
    const path = `${season}/${subtype}.${ext}`;

    // Clear every possible extension first — only one image per subtype at a time,
    // and a re-upload might use a different format than what's currently stored.
    await sb.storage.from(BUCKET).remove(imageVariantPaths(season, subtype));

    const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      console.error('Supabase signed URL error:', error);
      return Response.json({ error: 'Failed to create upload URL.' }, { status: 500 });
    }

    return Response.json({ signedUrl: data.signedUrl, token: data.token, path, ext });
  } catch (err) {
    console.error('Image signed URL error:', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
