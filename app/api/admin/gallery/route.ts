import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin-auth';
import { isSeasonKey, isSubtypeKeyForSeason } from '@/utils/reportPdfs';

export const runtime = 'nodejs';

const BUCKET = 'reports';
const MIME_TO_EXT: Record<string, string> = {
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

function galleryFolder(season: string, subtype: string) {
  return `${season}/${subtype}/gallery`;
}

function validateSeasonSubtype(season: unknown, subtype: unknown): { season: string; subtype: string } | null {
  if (typeof season !== 'string' || !isSeasonKey(season)) return null;
  if (typeof subtype !== 'string' || !isSubtypeKeyForSeason(season, subtype)) return null;
  return { season, subtype };
}

export async function GET(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const parsed = validateSeasonSubtype(url.searchParams.get('season'), url.searchParams.get('subtype'));
  if (!parsed) return Response.json({ error: 'Invalid season/subtype.' }, { status: 400 });

  const sb = adminClient();
  const { data, error } = await sb.storage.from(BUCKET).list(galleryFolder(parsed.season, parsed.subtype));
  if (error) {
    console.error('Supabase gallery list error:', error);
    return Response.json({ error: 'Failed to list images.' }, { status: 500 });
  }

  const images = (data ?? [])
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => ({
      name: f.name,
      url: sb.storage.from(BUCKET).getPublicUrl(`${galleryFolder(parsed.season, parsed.subtype)}/${f.name}`).data.publicUrl,
    }));

  return Response.json({ images });
}

export async function POST(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { season, subtype, mimeType } = (await req.json()) as { season?: string; subtype?: string; mimeType?: string };
    const parsed = validateSeasonSubtype(season, subtype);
    if (!parsed) return Response.json({ error: 'Invalid season/subtype.' }, { status: 400 });

    const ext = typeof mimeType === 'string' ? MIME_TO_EXT[mimeType] : undefined;
    if (!ext) return Response.json({ error: 'Only JPG, PNG or WEBP images are allowed.' }, { status: 400 });

    const sb = adminClient();
    const path = `${galleryFolder(parsed.season, parsed.subtype)}/${randomUUID()}.${ext}`;

    const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      console.error('Supabase gallery signed URL error:', error);
      return Response.json({ error: 'Failed to create upload URL.' }, { status: 500 });
    }

    return Response.json({ signedUrl: data.signedUrl, token: data.token, path });
  } catch (err) {
    console.error('Gallery signed URL error:', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { season, subtype, name } = (await req.json()) as { season?: string; subtype?: string; name?: string };
    const parsed = validateSeasonSubtype(season, subtype);
    if (!parsed) return Response.json({ error: 'Invalid season/subtype.' }, { status: 400 });
    if (typeof name !== 'string' || !name || name.includes('/')) {
      return Response.json({ error: 'Invalid file name.' }, { status: 400 });
    }

    const sb = adminClient();
    const { error } = await sb.storage.from(BUCKET).remove([`${galleryFolder(parsed.season, parsed.subtype)}/${name}`]);
    if (error) {
      console.error('Supabase gallery delete error:', error);
      return Response.json({ error: 'Failed to delete image.' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Gallery delete error:', err);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
