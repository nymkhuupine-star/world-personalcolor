export const REPORT_GROUPS = [
  {
    key: 'spring',
    label: 'Хавар',
    en: 'Spring',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    subtypes: [
      { key: 'light', label: 'Light Spring' },
      { key: 'true', label: 'True Spring' },
      { key: 'bright', label: 'Bright Spring' },
    ],
  },
  {
    key: 'summer',
    label: 'Зун',
    en: 'Summer',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    subtypes: [
      { key: 'light', label: 'Light Summer' },
      { key: 'true', label: 'True Summer' },
      { key: 'soft', label: 'Soft Summer' },
    ],
  },
  {
    key: 'autumn',
    label: 'Намар',
    en: 'Autumn',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    subtypes: [
      { key: 'soft', label: 'Soft Autumn' },
      { key: 'true', label: 'True Autumn' },
      { key: 'dark', label: 'Dark Autumn' },
    ],
  },
  {
    key: 'winter',
    label: 'Өвөл',
    en: 'Winter',
    color: 'text-sky-500',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    subtypes: [
      { key: 'cool', label: 'Cool Winter' },
      { key: 'bright', label: 'Bright Winter' },
      { key: 'dark', label: 'Dark Winter' },
    ],
  },
] as const;

export type ReportGroup = (typeof REPORT_GROUPS)[number];
export type SeasonKey = ReportGroup['key'];
export type SeasonName = ReportGroup['en'];
export type SubtypeKey = ReportGroup['subtypes'][number]['key'];

export function isSeasonKey(v: string): v is SeasonKey {
  return REPORT_GROUPS.some((g) => g.key === v);
}

export function seasonKeyFromSeasonName(v: string): SeasonKey | null {
  const normalized = v.trim().toLowerCase();
  const match = REPORT_GROUPS.find((g) => g.en.toLowerCase() === normalized);
  return match?.key ?? null;
}

export function isSubtypeKeyForSeason(season: SeasonKey, subtype: string): boolean {
  const group = REPORT_GROUPS.find((g) => g.key === season);
  return group?.subtypes.some((s) => s.key === subtype) ?? false;
}

export function reportId(season: SeasonKey, subtype: string) {
  return `${season}/${subtype}`;
}

export function parseReportId(id: string): { season: SeasonKey; subtype: string } | null {
  const [seasonRaw, subtypeRaw, ...rest] = id.split('/');
  if (rest.length) return null;
  if (!seasonRaw || !subtypeRaw) return null;
  if (!isSeasonKey(seasonRaw)) return null;
  return { season: seasonRaw, subtype: subtypeRaw };
}

function hasWord(input: string, word: string) {
  return new RegExp(`\\b${word}\\b`, 'i').test(input);
}

export function normalizeSubtypeKey(season: SeasonKey, subTypeRaw: string): string | null {
  const input = subTypeRaw.trim();
  if (!input) return null;

  // Prefer exact matches against known subtype labels.
  const group = REPORT_GROUPS.find((g) => g.key === season);
  const exact = group?.subtypes.find((s) => s.label.toLowerCase() === input.toLowerCase());
  if (exact) return exact.key;

  // Otherwise, infer from keywords (tolerant of "Light-Spring", "Bright winter", etc).
  const candidates = group?.subtypes.map((s) => s.key) ?? [];
  for (const key of candidates) {
    if (hasWord(input, key)) return key;
  }

  // Common synonyms to reduce email attachment failures.
  if (season === 'winter') {
    if (hasWord(input, 'true')) return 'cool';
    if (hasWord(input, 'deep')) return 'dark';
    if (hasWord(input, 'clear')) return 'bright';
  }
  if (season === 'autumn') {
    if (hasWord(input, 'deep')) return 'dark';
    if (hasWord(input, 'warm')) return 'true';
  }
  if (season === 'summer') {
    if (hasWord(input, 'cool')) return 'true';
  }
  if (season === 'spring') {
    if (hasWord(input, 'warm')) return 'true';
    if (hasWord(input, 'clear')) return 'bright';
  }

  return null;
}

