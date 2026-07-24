import type { ColorMetrics } from './rule-engine';

export type NaturalHairColor =
  | 'black'        // Хар
  | 'dark_brown'   // Бараан бор
  | 'medium_brown' // Бор
  | 'light_brown'  // Цайвар бор
  | 'blonde';      // Шаргал

export type EyeColor =
  | 'black'       // Хар
  | 'dark_brown'  // Бараан бор
  | 'light_brown' // Цайвар бор
  | 'green'       // Ногоон
  | 'grey'        // Саарал
  | 'blue';       // Цэнхэр

export type QuestionnaireAnswers = {
  gender:             'male' | 'female';
  hairDyed:           'yes' | 'no';
  naturalHairColor?:  NaturalHairColor; // зөвхөн hairDyed === 'yes' үед
  eyeColor:           EyeColor;
  jewelryPreference:  'gold' | 'silver' | 'both' | 'unsure';
};

/** Асуулга бүрэн бөглөгдсөн эсэхийг шалгах */
export function isQuestionnaireComplete(a: Partial<QuestionnaireAnswers>): boolean {
  if (!a.hairDyed || !a.eyeColor || !a.jewelryPreference) return false;
  if (a.hairDyed === 'yes' && !a.naturalHairColor) return false;
  return true;
}

// Төрөлхийн үсний өнгө тус бүрийн жишиг LAB утга.
// Зурагнаас будсан үсний өнгө биш, эдгээрийг image-analysis.ts-ийн
// analyzeImage()-д hairOverrideLab болгон дамжуулж, будсан үсний дохиог
// сольж undertone/contrast тооцооллыг залруулна (Card.tsx-д ашиглагдана).
export const HAIR_LAB: Record<NaturalHairColor, { L: number; a: number; b: number }> = {
  black:        { L: 15, a: 2,  b: 4  },
  dark_brown:   { L: 25, a: 8,  b: 12 },
  medium_brown: { L: 35, a: 10, b: 18 },
  light_brown:  { L: 45, a: 10, b: 22 },
  blonde:       { L: 65, a: 4,  b: 28 },
};

// Үсний өнгө → value + undertone нэмэлт жин
const HAIR_METRICS: Record<NaturalHairColor, { light: number; medium: number; deep: number; warm: number; cool: number }> = {
  black:        { light:  0, medium: 10, deep: 45, warm:  0, cool:  5 },
  dark_brown:   { light:  5, medium: 20, deep: 35, warm:  8, cool:  0 },
  medium_brown: { light: 15, medium: 40, deep: 15, warm: 12, cool:  0 },
  light_brown:  { light: 30, medium: 35, deep:  5, warm: 18, cool:  0 },
  blonde:       { light: 50, medium: 20, deep:  0, warm: 25, cool:  0 },
};

// Нүдний өнгө → undertone + contrast дохио
const EYE_METRICS: Record<EyeColor, { warm: number; cool: number; neutral: number; high: number; medium: number; low: number }> = {
  black:       { warm:  0, cool: 10, neutral: 15, high: 40, medium: 15, low:  0 },
  dark_brown:  { warm: 20, cool:  0, neutral: 10, high: 30, medium: 20, low:  0 },
  light_brown: { warm: 25, cool:  0, neutral:  5, high:  5, medium: 35, low: 10 },
  green:       { warm:  0, cool: 20, neutral: 10, high:  5, medium: 30, low: 15 },
  grey:        { warm:  0, cool: 30, neutral:  5, high:  0, medium: 15, low: 35 },
  blue:        { warm:  0, cool: 35, neutral:  0, high:  0, medium: 10, low: 40 },
};

export function questionnaireToMetrics(a: QuestionnaireAnswers): Partial<ColorMetrics> {
  let warm = 50, cool = 50, neutral = 20;
  let light = 33, medium = 34, deep = 33;
  let low = 33, medC = 34, high = 33;
  // Chroma: soft=Summer/Autumn, clear=Spring/Winter, bright=Bright Spring/Winter
  let soft = 33, clear = 33, bright = 33;

  // Q1: Будсан үсний байгалийн өнгө → value + undertone
  if (a.hairDyed === 'yes' && a.naturalHairColor) {
    const h = HAIR_METRICS[a.naturalHairColor];
    light  += h.light;
    medium += h.medium;
    deep   += h.deep;
    warm   += h.warm;
    cool   += h.cool;
  }

  // Q2: Нүдний өнгө → undertone + contrast
  if (a.eyeColor) {
    const e = EYE_METRICS[a.eyeColor];
    warm    += e.warm;
    cool    += e.cool;
    neutral += e.neutral;
    high    += e.high;
    medC    += e.medium;
    low     += e.low;
  }

  // Q3: Мөнгөн/алтан гоёл өмсөхөд арьс тод/цонхигор харагдах эсэх (баримт
  // ажиглалт, хувийн дуршил биш) → undertone + chroma (хамгийн тодорхой дохио)
  if (a.jewelryPreference === 'gold') {
    warm  += 30; cool -= 10;
    clear += 20; soft -= 15;  // алт = Spring/Autumn → тодорхой/дулаан хром
  }
  if (a.jewelryPreference === 'silver') {
    cool  += 30; warm -= 10;
    clear += 15; bright += 10; soft -= 10;  // мөнгө = Winter/Summer → тунгалаг хром
  }
  if (a.jewelryPreference === 'both') {
    neutral += 20;
    soft += 10;  // хоёулаа = мутед/зөөлөн хром
  }
  // 'unsure' → дохио өгөхгүй

  const c = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

  return {
    undertone: { warm: c(warm), cool: c(cool), neutral: c(neutral) },
    value:     { light: c(light), medium: c(medium), deep: c(deep) },
    chroma:    { soft: c(soft), clear: c(clear), bright: c(bright) },
    contrast:  { low: c(low), medium: c(medC), high: c(high) },
  };
}

/** The category with the highest score in a 3-way metric group (e.g. warm/cool/neutral). */
function dominantKey(m: Record<string, number>): string {
  return Object.entries(m).reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
}

/**
 * Weight used when the image and questionnaire *disagree* on which category
 * dominates a metric group (e.g. image says undertone=cool, questionnaire
 * says warm). This is a modest lean toward the image, not a takeover — a
 * single self-report question disagreeing doesn't prove the image is right.
 * The image follows a fixed, controlled protocol across every user; a lone
 * questionnaire answer is a one-off self-report with its own known
 * reliability issues (see why the vein question was removed entirely).
 * Neither source is "ground truth" here — there's no validated dataset this
 * pipeline has been checked against (see prior accuracy discussion).
 */
const CONFLICT_IMAGE_WEIGHT = 0.75;

/**
 * Blends image-derived and questionnaire-derived metrics with a per-group
 * dynamic weight ("Dynamic Weight Matrix"): each of the 4 metric groups
 * (undertone/value/chroma/contrast) is weighted independently, based on
 * whether *that specific group* conflicts between the two sources — not one
 * global weight applied uniformly regardless of where the disagreement is.
 */
export function mergeMetrics(
  image: ColorMetrics,
  questionnaire: Partial<ColorMetrics>,
  imageWeight = 0.6,
): ColorMetrics {
  function blend(img: Record<string, number>, q: Record<string, number> | undefined) {
    if (!q) return img;
    const conflict = dominantKey(img) !== dominantKey(q);
    const w  = conflict ? CONFLICT_IMAGE_WEIGHT : imageWeight;
    const qw = 1 - w;
    const out: Record<string, number> = {};
    for (const key of Object.keys(img)) {
      out[key] = Math.round(img[key] * w + (q[key] ?? img[key]) * qw);
    }
    return out;
  }

  return {
    undertone: blend(image.undertone, questionnaire.undertone) as ColorMetrics['undertone'],
    value:     blend(image.value,     questionnaire.value)     as ColorMetrics['value'],
    chroma:    blend(image.chroma,    questionnaire.chroma)    as ColorMetrics['chroma'],
    contrast:  blend(image.contrast,  questionnaire.contrast)  as ColorMetrics['contrast'],
  };
}
