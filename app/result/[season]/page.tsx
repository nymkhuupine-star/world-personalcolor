import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import ResultMagazine from '@/app/components/ResultMagazine';
import { SEASON_PALETTES, getBaseSeason, type SeasonName } from '@/lib/personal-color/rule-engine';

const VALID_SEASONS = Object.keys(SEASON_PALETTES) as SeasonName[];

function isSeasonName(v: string): v is SeasonName {
  return (VALID_SEASONS as string[]).includes(v);
}

export async function generateMetadata({ params }: { params: Promise<{ season: string }> }) {
  const { season: raw } = await params;
  const seasonName = decodeURIComponent(raw);
  return { title: isSeasonName(seasonName) ? `${seasonName} | Personal Color` : 'Personal Color' };
}

interface SearchParams {
  photo?: string;
  email?: string;
}

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ season: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { season: raw } = await params;
  const seasonName = decodeURIComponent(raw);
  const { photo, email } = await searchParams;

  if (!isSeasonName(seasonName)) {
    redirect('/');
  }

  const palette = SEASON_PALETTES[seasonName];
  const baseSeason = getBaseSeason(seasonName);

  return (
    <main
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fdf4f0 40%, #fce8e2 70%, #fad4cc 100%)' }}
    >
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to home
        </Link>

        <div className="mt-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
            <Sparkles className="h-6 w-6 text-violet-600" strokeWidth={1.5} />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">
            Your Personal Color — {baseSeason}
          </p>
          <h1
            className="mt-1 text-3xl font-bold bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent lg:text-4xl"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            {seasonName}
          </h1>

          <div className="mt-4 flex items-center justify-center gap-2">
            {palette.map((color) => (
              <span
                key={color}
                className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <ResultMagazine seasonName={seasonName} userPhotoUrl={photo} userEmail={email} />
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-violet-300 hover:text-violet-600"
          >
            Run a new analysis
          </Link>
        </div>
      </div>
    </main>
  );
}
