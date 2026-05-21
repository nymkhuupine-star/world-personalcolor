import { writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';

const VALID_SEASONS = ['spring', 'summer', 'autumn', 'winter'];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const season = formData.get('season') as string;
    const file = formData.get('file') as File | null;

    if (!VALID_SEASONS.includes(season)) {
      return Response.json({ error: 'Invalid season.' }, { status: 400 });
    }
    if (!file || file.type !== 'application/pdf') {
      return Response.json({ error: 'PDF file required.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(process.cwd(), 'public', 'reports', `${season}.pdf`);
    await writeFile(filePath, buffer);

    return Response.json({ success: true, season });
  } catch (err) {
    console.error('PDF upload error:', err);
    return Response.json({ error: 'Failed to save PDF.' }, { status: 500 });
  }
}

export async function GET() {
  const statuses: Record<string, boolean> = {};
  for (const season of VALID_SEASONS) {
    try {
      await access(join(process.cwd(), 'public', 'reports', `${season}.pdf`));
      statuses[season] = true;
    } catch {
      statuses[season] = false;
    }
  }
  return Response.json(statuses);
}
