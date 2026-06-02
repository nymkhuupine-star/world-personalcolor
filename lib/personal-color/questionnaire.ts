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
  vein:               'blue_green' | 'purple_red' | 'both';
  hairDyed:           'yes' | 'no';
  naturalHairColor?:  NaturalHairColor; // зөвхөн hairDyed === 'yes' үед
  eyeColor:           EyeColor;
  jewelryPreference:  'gold' | 'silver' | 'both' | 'unsure';
};

/** Асуулга бүрэн бөглөгдсөн эсэхийг шалгах */
export function isQuestionnaireComplete(a: Partial<QuestionnaireAnswers>): boolean {
  if (!a.vein || !a.hairDyed || !a.eyeColor || !a.jewelryPreference) return false;
  if (a.hairDyed === 'yes' && !a.naturalHairColor) return false;
  return true;
}

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

  // Q1: Венийн өнгө → хамгийн хүчтэй undertone дохио
  if (a.vein === 'blue_green') { cool += 35; warm -= 20; }
  if (a.vein === 'purple_red') { warm += 35; cool -= 20; }
  if (a.vein === 'both')       { neutral += 30; }

  // Q2: Будсан үсний байгалийн өнгө → value + undertone
  if (a.hairDyed === 'yes' && a.naturalHairColor) {
    const h = HAIR_METRICS[a.naturalHairColor];
    light  += h.light;
    medium += h.medium;
    deep   += h.deep;
    warm   += h.warm;
    cool   += h.cool;
  }

  // Q3: Нүдний өнгө → undertone + contrast
  if (a.eyeColor) {
    const e = EYE_METRICS[a.eyeColor];
    warm    += e.warm;
    cool    += e.cool;
    neutral += e.neutral;
    high    += e.high;
    medC    += e.medium;
    low     += e.low;
  }

  // Q4: Гоёлын металл → undertone-ийн хамгийн тодорхой дохио
  if (a.jewelryPreference === 'gold')   { warm    += 30; cool -= 10; }
  if (a.jewelryPreference === 'silver') { cool    += 30; warm -= 10; }
  if (a.jewelryPreference === 'both')   { neutral += 20; }
  // 'unsure' → дохио өгөхгүй

  const c = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

  return {
    undertone: { warm: c(warm), cool: c(cool), neutral: c(neutral) },
    value:     { light: c(light), medium: c(medium), deep: c(deep) },
    contrast:  { low: c(low), medium: c(medC), high: c(high) },
  };
}

export function mergeMetrics(
  image: ColorMetrics,
  questionnaire: Partial<ColorMetrics>,
  imageWeight = 0.6,
): ColorMetrics {
  const qw = 1 - imageWeight;

  function blend(img: Record<string, number>, q: Record<string, number> | undefined) {
    if (!q) return img;
    const out: Record<string, number> = {};
    for (const key of Object.keys(img)) {
      out[key] = Math.round(img[key] * imageWeight + (q[key] ?? img[key]) * qw);
    }
    return out;
  }

  return {
    undertone: blend(image.undertone, questionnaire.undertone) as ColorMetrics['undertone'],
    value:     blend(image.value,     questionnaire.value)     as ColorMetrics['value'],
    chroma:    image.chroma,
    contrast:  blend(image.contrast,  questionnaire.contrast)  as ColorMetrics['contrast'],
  };
}
