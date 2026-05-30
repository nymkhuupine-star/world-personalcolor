import type { ColorMetrics } from './rule-engine';

export type NaturalHairColor =
  | 'black'        // Хар
  | 'dark_brown'   // Харлуу хүрэн
  | 'medium_brown' // Хүрэн
  | 'light_brown'  // Цайвар хүрэн
  | 'blonde'       // Шаргал / Алтан
  | 'auburn';      // Улаан / Буурцаг

export type QuestionnaireAnswers = {
  vein:              'blue_green' | 'purple_red' | 'both';
  hairDyed:          'yes' | 'no';
  naturalHairColor?: NaturalHairColor; // зөвхөн hairDyed === 'yes' үед
  contrast:          'high' | 'medium' | 'low';
  sunReaction:       'burns' | 'mixed' | 'tans';
};

/** Асуулга бүрэн бөглөгдсөн эсэхийг шалгах */
export function isQuestionnaireComplete(a: Partial<QuestionnaireAnswers>): boolean {
  if (!a.vein || !a.hairDyed || !a.contrast || !a.sunReaction) return false;
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
  auburn:       { light: 10, medium: 30, deep: 20, warm: 30, cool:  0 },
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

  // Q3: Ялгаа → contrast
  if (a.contrast === 'high')   { high += 45; low  -= 15; }
  if (a.contrast === 'medium') { medC += 40; }
  if (a.contrast === 'low')    { low  += 45; high -= 15; }

  // Q4: Нарны хариу → undertone + value нөхнө
  if (a.sunReaction === 'burns') { cool += 20; light  += 15; }
  if (a.sunReaction === 'mixed') { neutral += 15; medium += 10; }
  if (a.sunReaction === 'tans')  { warm += 20; medium += 10; }

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
