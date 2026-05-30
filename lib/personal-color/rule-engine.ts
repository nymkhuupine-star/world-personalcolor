// ─────────────────────────────────────────────────────────────────────────────
// 12-Season Personal Color Rule Engine
// Deterministic scoring — AI does NOT choose the season.
// ─────────────────────────────────────────────────────────────────────────────

export type ColorMetrics = {
  undertone: {
    warm: number;    // 0-100
    cool: number;    // 0-100
    neutral: number; // 0-100
  };
  value: {
    light: number;   // 0-100
    medium: number;  // 0-100
    deep: number;    // 0-100
  };
  chroma: {
    soft: number;    // 0-100
    clear: number;   // 0-100
    bright: number;  // 0-100
  };
  contrast: {
    low: number;     // 0-100
    medium: number;  // 0-100
    high: number;    // 0-100
  };
};

export type SeasonName =
  | 'Light Spring'
  | 'True Spring'
  | 'Bright Spring'
  | 'Light Summer'
  | 'True Summer'
  | 'Soft Summer'
  | 'Soft Autumn'
  | 'True Autumn'
  | 'Dark Autumn'
  | 'Cool Winter'
  | 'Bright Winter'
  | 'Dark Winter';

export type SeasonScore = {
  season: SeasonName;
  score: number; // 0-100, rounded to 1 decimal
};

export type RuleEngineResult = {
  primary: { season: SeasonName; score: number };
  secondary: { season: SeasonName; score: number };
  confidence: 'high' | 'medium' | 'low';
  warning?: string;
  allScores: SeasonScore[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Scoring formulas — each weight sum equals 1.0
// ─────────────────────────────────────────────────────────────────────────────

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function scoreAll(m: ColorMetrics): SeasonScore[] {
  const { undertone: u, value: v, chroma: c, contrast: k } = m;

  const scores: [SeasonName, number][] = [
    // ── Spring ──────────────────────────────────────────────────────────────
    [
      'Light Spring',
      u.warm * 0.35 + v.light * 0.30 + c.clear * 0.20 + k.medium * 0.15,
    ],
    [
      'True Spring',
      u.warm * 0.45 + c.clear * 0.25 + v.medium * 0.15 + k.medium * 0.15,
    ],
    [
      'Bright Spring',
      u.warm * 0.25 + c.bright * 0.35 + c.clear * 0.20 + k.high * 0.20,
    ],

    // ── Summer ──────────────────────────────────────────────────────────────
    [
      'Light Summer',
      u.cool * 0.35 + v.light * 0.30 + c.soft * 0.20 + k.low * 0.15,
    ],
    [
      'True Summer',
      u.cool * 0.45 + c.soft * 0.25 + v.medium * 0.15 + k.medium * 0.15,
    ],
    [
      'Soft Summer',
      // muted is represented by soft; low contrast amplifies the muted quality
      u.cool * 0.25 + c.soft * 0.40 + k.low * 0.20 + v.medium * 0.15,
    ],

    // ── Autumn ──────────────────────────────────────────────────────────────
    [
      'Soft Autumn',
      u.warm * 0.25 + c.soft * 0.40 + v.medium * 0.20 + k.low * 0.15,
    ],
    [
      'True Autumn',
      u.warm * 0.45 + v.medium * 0.20 + v.deep * 0.15 + c.soft * 0.20,
    ],
    [
      'Dark Autumn',
      u.warm * 0.25 + v.deep * 0.35 + c.soft * 0.20 + k.high * 0.20,
    ],

    // ── Winter ──────────────────────────────────────────────────────────────
    [
      'Cool Winter',
      u.cool * 0.45 + c.clear * 0.25 + k.high * 0.15 + v.deep * 0.15,
    ],
    [
      'Bright Winter',
      u.cool * 0.25 + c.bright * 0.35 + c.clear * 0.20 + k.high * 0.20,
    ],
    [
      'Dark Winter',
      u.cool * 0.25 + v.deep * 0.35 + c.clear * 0.15 + k.high * 0.25,
    ],
  ];

  return scores
    .map(([season, raw]) => ({ season, score: round1(clamp(raw)) }))
    .sort((a, b) => b.score - a.score);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/** Returns all 12 season scores sorted from highest to lowest. */
export function calculateSeasonScores(metrics: ColorMetrics): SeasonScore[] {
  return scoreAll(metrics);
}

/** Returns confidence level based on the gap between primary and secondary. */
export function getConfidence(
  primaryScore: number,
  secondaryScore: number,
): 'high' | 'medium' | 'low' {
  const gap = primaryScore - secondaryScore;
  if (gap >= 12) return 'high';
  if (gap >= 6) return 'medium';
  return 'low';
}

// ─────────────────────────────────────────────────────────────────────────────
// Season palettes — 4 flattering HEX colors per season
// ─────────────────────────────────────────────────────────────────────────────

export const SEASON_PALETTES: Record<SeasonName, [string, string, string, string]> = {
  'Light Spring':   ['#FAC8A0', '#FFD98E', '#97D5C9', '#C3E3F0'],
  'True Spring':    ['#FF8040', '#FFC947', '#5CC8A0', '#FFA060'],
  'Bright Spring':  ['#FF3D6E', '#FF8800', '#00BB66', '#FF44AA'],
  'Light Summer':   ['#C9AACC', '#AACCE0', '#DDB8D8', '#AACCDD'],
  'True Summer':    ['#7D8EC0', '#B080A8', '#8899C4', '#C08898'],
  'Soft Summer':    ['#A89CAC', '#94A8B8', '#B4A498', '#94A8A0'],
  'Soft Autumn':    ['#C49A6C', '#AA8858', '#7DAA6C', '#C4A84C'],
  'True Autumn':    ['#B85C30', '#986E28', '#7A5828', '#B87838'],
  'Dark Autumn':    ['#803018', '#604018', '#485530', '#804020'],
  'Cool Winter':    ['#CC0040', '#280088', '#AA0055', '#000066'],
  'Bright Winter':  ['#FF0055', '#0033FF', '#FF2800', '#00AAFF'],
  'Dark Winter':    ['#2A0030', '#00224C', '#3C0020', '#00280C'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Extract the base group season from a full 12-season name. */
export function getBaseSeason(name: SeasonName): 'Spring' | 'Summer' | 'Autumn' | 'Winter' {
  if (name.includes('Spring')) return 'Spring';
  if (name.includes('Summer')) return 'Summer';
  if (name.includes('Autumn')) return 'Autumn';
  return 'Winter';
}

/**
 * Map a SeasonName to its Supabase Storage path.
 * "Light Spring" → { folder: "spring", file: "light" }
 */
export function seasonNameToStoragePath(name: SeasonName): { folder: string; file: string } {
  const [qualifier, base] = name.split(' ') as [string, string];
  return { folder: base.toLowerCase(), file: qualifier.toLowerCase() };
}

/** Full analysis: primary, secondary, confidence, and optional warning. */
export function getPrimaryAndSecondarySeason(metrics: ColorMetrics): RuleEngineResult {
  const allScores = scoreAll(metrics);
  const [first, second] = allScores;

  const confidence = getConfidence(first.score, second.score);

  const result: RuleEngineResult = {
    primary: { season: first.season, score: first.score },
    secondary: { season: second.season, score: second.score },
    confidence,
    allScores,
  };

  if (confidence === 'low') {
    result.warning =
      'Result is close between two seasons. Please upload a clearer natural-light photo.';
  }

  return result;
}
