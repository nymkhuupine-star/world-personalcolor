// ─────────────────────────────────────────────────────────────────────────────
// Personal Color — Image Analysis Pipeline
// Browser-only. Uses MediaPipe FaceMesh (WASM) + pure-TS color math.
//
// Pipeline:
//   File → Canvas → MediaPipe landmarks → region pixel extraction
//   → RGB avg → LAB conversion → ColorMetrics
// ─────────────────────────────────────────────────────────────────────────────

import type { ColorMetrics } from './rule-engine';

// ── Internal types ────────────────────────────────────────────────────────────

/** Deliberate, user-readable error — safe to surface as-is in the UI, unlike
 *  unexpected internal errors (library failures, bad input) whose raw message
 *  shouldn't reach the user. */
export class UserFacingImageError extends Error {}

type RGB = { r: number; g: number; b: number };
export type LAB = { L: number; a: number; b: number };
type Point = { x: number; y: number };

/** Normalized landmark (0-1 range) returned by MediaPipe FaceMesh */
interface NormalizedLandmark { x: number; y: number; z: number }

/** Minimal FaceMesh results shape */
interface FaceMeshResults {
  multiFaceLandmarks: NormalizedLandmark[][];
}

// ── MediaPipe landmark index groups ──────────────────────────────────────────
//
// Source: MediaPipe face_mesh_connections.py topology (468 pts standard,
//         468-477 iris when refineLandmarks = true).

const LM = {
  // Left cheek — below eye, above jaw, lateral to nose. Avoids makeup zones.
  LEFT_CHEEK:  [36, 47, 100, 116, 117, 118, 119, 120, 121, 126, 142,
                203, 205, 206, 187, 123, 147],
  // Right cheek — mirrored
  RIGHT_CHEEK: [266, 277, 329, 345, 346, 347, 348, 349, 350, 355, 371,
                423, 425, 426, 411, 352, 376],
  // Forehead center band (avoids eyebrow region)
  FOREHEAD:    [10, 67, 109, 151, 338, 297],
  // Left eye opening contour (for iris color sampling)
  LEFT_EYE:    [33, 133, 157, 158, 159, 160, 161, 246,
                163, 144, 145, 153, 154, 155, 173],
  // Right eye opening contour
  RIGHT_EYE:   [263, 362, 384, 385, 386, 387, 388, 466,
                390, 373, 374, 380, 381, 382, 398],
  // Iris landmarks (available when refineLandmarks = true)
  LEFT_IRIS:   [468, 469, 470, 471, 472],
  RIGHT_IRIS:  [473, 474, 475, 476, 477],
  // Face extent landmarks for hair bounding box
  FACE_TOP:    10,   // top-center of forehead
  FACE_LEFT:   234,  // left jaw/ear junction
  FACE_RIGHT:  454,  // right jaw/ear junction
} as const;

// ── MediaPipe FaceMesh — lazy singleton ───────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FaceMeshInstance = any;
let _faceMesh: FaceMeshInstance | null = null;

async function getFaceMesh(): Promise<FaceMeshInstance> {
  if (_faceMesh) return _faceMesh;

  // Dynamic import avoids SSR issues; WASM served from CDN.
  const { FaceMesh } = await import('@mediapipe/face_mesh');
  const fm = new FaceMesh({
    locateFile: (file: string) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
  });

  fm.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,      // adds iris landmarks 468-477
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  await fm.initialize();
  _faceMesh = fm;
  return fm;
}

// ── Image utilities ───────────────────────────────────────────────────────────

/** Decode a File into a canvas element (preserves full resolution). */
function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image decode failed')); };
    img.src = url;
  });
}

/**
 * Downscale a canvas so its longer edge is at most maxDim, preserving aspect
 * ratio. Never upscales. Used to normalize Laplacian-variance blur detection
 * across camera resolutions — a 4K photo's native detail inflates variance
 * regardless of actual focus, while a small webcam capture reads as low
 * variance even in perfect focus. Measuring both on the same target size
 * puts them on equal footing so one fixed threshold works for either.
 */
function resizeForBlurCheck(canvas: HTMLCanvasElement, maxDim = 800): HTMLCanvasElement {
  const { width, height } = canvas;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  if (scale === 1) return canvas;

  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(width * scale));
  out.height = Math.max(1, Math.round(height * scale));
  out.getContext('2d')!.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
}

/** Run MediaPipe FaceMesh on a canvas and return landmarks for the first face. */
function detectLandmarks(fm: FaceMeshInstance, canvas: HTMLCanvasElement): Promise<NormalizedLandmark[]> {
  return new Promise((resolve, reject) => {
    fm.onResults((results: FaceMeshResults) => {
      const face = results.multiFaceLandmarks?.[0];
      if (!face?.length) {
        reject(new UserFacingImageError('Could not detect a face. Please upload a photo where your face is fully visible.'));
      } else {
        resolve(face);
      }
    });
    fm.send({ image: canvas }).catch(reject);
  });
}

// ── Pixel sampling ────────────────────────────────────────────────────────────

/**
 * Convert normalized landmark coordinates to pixel coordinates.
 */
function lmToPixel(lm: NormalizedLandmark, w: number, h: number): Point {
  return { x: Math.round(lm.x * w), y: Math.round(lm.y * h) };
}

/**
 * Sample pixels in a circular neighbourhood around each landmark.
 * Radius is in pixels; larger = more samples, slower.
 */
function sampleAroundLandmarks(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  landmarks: NormalizedLandmark[],
  indices: readonly number[],
  radius = 8,
): RGB[] {
  const pixels: RGB[] = [];
  const seen = new Set<number>();

  for (const idx of indices) {
    const lm = landmarks[idx];
    if (!lm) continue;
    const { x: cx, y: cy } = lmToPixel(lm, width, height);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue; // circle mask
        const px = cx + dx;
        const py = cy + dy;
        if (px < 0 || px >= width || py < 0 || py >= height) continue;

        const key = py * width + px;
        if (seen.has(key)) continue;
        seen.add(key);

        const i = key * 4;
        pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }
  }

  return pixels;
}

/**
 * Sample all pixels in an axis-aligned rectangle.
 * Used for hair extraction (above forehead bounding box).
 */
function sampleRect(
  data: Uint8ClampedArray,
  width: number,
  x0: number, y0: number,
  x1: number, y1: number,
  step = 3, // sample every Nth pixel for performance
): RGB[] {
  const pixels: RGB[] = [];
  const bx0 = Math.max(0, x0), bx1 = Math.min(width, x1);
  const by0 = Math.max(0, y0), by1 = y1;

  for (let y = by0; y < by1; y += step) {
    for (let x = bx0; x < bx1; x += step) {
      const i = (y * width + x) * 4;
      pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }
  }

  return pixels;
}

// ── Color math ────────────────────────────────────────────────────────────────

/** sRGB gamma linearization (IEC 61966-2-1). */
function linearize(c8: number): number {
  const c = c8 / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** RGB (0-255) → CIE L*a*b* (D65 illuminant). */
function rgbToLab(rgb: RGB): LAB {
  // Step 1: linearize
  const r = linearize(rgb.r);
  const g = linearize(rgb.g);
  const b = linearize(rgb.b);

  // Step 2: RGB → XYZ (D65 matrix, IEC 61966-2-1)
  const X = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const Y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  const Z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

  // Step 3: normalize to D65 white point
  function f(t: number): number {
    return t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116;
  }
  const fx = f(X / 0.95047);
  const fy = f(Y / 1.00000);
  const fz = f(Z / 1.08883);

  return {
    L: Math.max(0, 116 * fy - 16),
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/** Average RGB across a pixel array. Returns null if empty. */
function avgRGB(pixels: RGB[]): RGB | null {
  if (!pixels.length) return null;
  let r = 0, g = 0, b = 0;
  for (const p of pixels) { r += p.r; g += p.g; b += p.b; }
  const n = pixels.length;
  return { r: r / n, g: g / n, b: b / n };
}

/** CIE C* (chroma) from LAB. */
function chroma(lab: LAB): number {
  return Math.sqrt(lab.a ** 2 + lab.b ** 2);
}

/** CIE76 ΔE — simple Euclidean LAB distance. */
function deltaE(a: LAB, b: LAB): number {
  return Math.sqrt((a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

/**
 * The "hair" rectangle sampled above the forehead landmark reads as scalp,
 * not hair, when someone is bald or has very short/receding hair — and scalp
 * is barely distinguishable from forehead skin in LAB space. Treated as real
 * hair data, that would report a near-zero skin/hair gap and quietly distort
 * both the contrast metric and the undertone hair blend. When the sampled
 * "hair" LAB is this close to skin LAB, don't trust it.
 */
const HAIR_SKIN_MIN_DELTA_E = 10;

function isHairSignalReliable(hairLab: LAB | null, skinLab: LAB): hairLab is LAB {
  return hairLab !== null && deltaE(hairLab, skinLab) >= HAIR_SKIN_MIN_DELTA_E;
}

// ── Skin-pixel filter ─────────────────────────────────────────────────────────

/**
 * Reject pixels that are clearly not skin (background, strong shadows).
 * Using loose LAB bounds to handle diverse skin tones.
 */
function isSkinPixel(lab: LAB): boolean {
  return (
    lab.L > 18 && lab.L < 96 &&
    lab.a > -2 && lab.a < 32 &&
    lab.b > -2 && lab.b < 45
  );
}

/** Filter pixels by skin color in LAB space. */
function filterSkin(pixels: RGB[]): RGB[] {
  return pixels.filter(p => isSkinPixel(rgbToLab(p)));
}

// ── Dominant skin tone (K-Means) ─────────────────────────────────────────────

/**
 * Cluster pixels into k groups by LAB distance. Centroids are seeded
 * deterministically from L*-sorted percentiles (not random) so the same photo
 * always produces the same clusters — the pipeline elsewhere is fully
 * deterministic and this shouldn't be the exception.
 */
function kMeansClusterLab(pixels: RGB[], k: number, iterations = 6): { rgb: RGB[]; meanL: number }[] {
  const labeled = pixels.map(rgb => ({ rgb, lab: rgbToLab(rgb) }));
  const sortedByL = [...labeled].sort((a, b) => a.lab.L - b.lab.L);

  let centroids: LAB[] = Array.from({ length: k }, (_, i) => {
    const idx = Math.round(((i + 0.5) / k) * (sortedByL.length - 1));
    return sortedByL[idx].lab;
  });

  const assignments = new Array<number>(labeled.length).fill(0);
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < labeled.length; i++) {
      const { lab } = labeled[i];
      let best = 0, bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        const dl = lab.L - centroids[c].L, da = lab.a - centroids[c].a, db = lab.b - centroids[c].b;
        const dist = dl * dl + da * da + db * db;
        if (dist < bestDist) { bestDist = dist; best = c; }
      }
      assignments[i] = best;
    }

    const sums = Array.from({ length: k }, () => ({ L: 0, a: 0, b: 0, n: 0 }));
    for (let i = 0; i < labeled.length; i++) {
      const s = sums[assignments[i]];
      s.L += labeled[i].lab.L; s.a += labeled[i].lab.a; s.b += labeled[i].lab.b; s.n++;
    }
    centroids = sums.map((s, c) => (s.n > 0 ? { L: s.L / s.n, a: s.a / s.n, b: s.b / s.n } : centroids[c]));
  }

  const clusters: { rgb: RGB[]; meanL: number }[] = Array.from({ length: k }, (_, c) => ({ rgb: [], meanL: centroids[c].L }));
  for (let i = 0; i < labeled.length; i++) clusters[assignments[i]].rgb.push(labeled[i].rgb);
  return clusters;
}

/**
 * Splits a region's pixels into 3 brightness clusters (K-Means, k=3) and keeps
 * only the middle one — dropping the brightest cluster (specular highlight /
 * oily shine) and the darkest (blemish, wrinkle shadow, stubble). Falls back
 * to the untouched input when there isn't enough data to cluster safely, so
 * this never starves the downstream minimum-sample-size check.
 */
const MIN_CLUSTERABLE = 15;   // need at least this many pixels per cluster to trust k-means
const MIN_DOMINANT_KEEP = 25; // below this, the "middle" cluster is too thin to trust alone

/**
 * Floor on combined cheek+forehead pixels that pass the skin-color filter,
 * below which the mean skin LAB is too noisy to trust. This is a bail-out
 * for degenerate cases (heavy occlusion, extreme lighting, a filter that
 * rejected almost everything) — not the typical sample size. The landmark
 * circles sampleAroundLandmarks() draws around each cheek/forehead point
 * already yield low thousands of raw pixels before this filter runs, and
 * the final averaging pool below (weightedConcat's targetSize) resamples
 * from that pool rather than averaging only these filtered pixels directly.
 */
const MIN_SKIN_SAMPLE_PIXELS = 150;

function extractDominantSkinTone(pixels: RGB[]): RGB[] {
  if (pixels.length < MIN_CLUSTERABLE * 3) return pixels;

  const clusters = kMeansClusterLab(pixels, 3).filter(c => c.rgb.length > 0);
  if (clusters.length < 3) return pixels;

  clusters.sort((a, b) => a.meanL - b.meanL);
  const [darkest, middle, brightest] = clusters;

  if (middle.rgb.length >= MIN_DOMINANT_KEEP) return middle.rgb;
  // Middle band too thin (skin was fairly uniform and k-means over-split it) —
  // merge with whichever neighbour is larger instead of returning too few pixels.
  return darkest.rgb.length > brightest.rgb.length
    ? [...middle.rgb, ...darkest.rgb]
    : [...middle.rgb, ...brightest.rgb];
}

// ── Anti-redness filter ──────────────────────────────────────────────────────

/**
 * Exertion, cold air, anxiety or rosacea flush the cheeks — pushing a*
 * (red-green axis) abnormally high in a way that reads as a false
 * warm/pink signal rather than the person's baseline undertone. A fixed
 * absolute cutoff doesn't transfer across skin depths: deeper/darker skin's
 * own resting a* sits lower to begin with, and melanin dampens how far a
 * flush visibly pushes it, so a universal number either misses real flush
 * on deep skin or falsely trips on lighter skin's ordinary cheek color.
 * Threshold relative to the forehead's own a* instead — the forehead is
 * rarely flushed the way cheeks are, so it stands in for the person's own
 * unflushed baseline. Falls back to the old absolute cutoff when there's no
 * reliable forehead baseline to compare against.
 */
const REDNESS_A_MARGIN = 12;       // relative: cheek a* may exceed forehead a* by this much
const REDNESS_A_THRESHOLD = 24;    // absolute fallback when no forehead baseline is available
const MIN_BASELINE_PIXELS = 20;    // forehead samples needed to trust it as a baseline

/**
 * Healthy sclera sits close to neutral (a* near 0-3). Fatigue, irritation or
 * bloodshot eyes push it well past that — used to veto the sclera as a white
 * balance reference (see the WB step in analyzeImage()).
 */
const SCLERA_REDNESS_A_THRESHOLD = 8;

/** Median a* — more robust than a mean against a handful of stray outlier pixels. */
function medianA(pixels: RGB[]): number {
  const sorted = pixels.map(p => rgbToLab(p).a).sort((x, y) => x - y);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function filterRedness(pixels: RGB[], foreheadBaseline: RGB[]): { kept: RGB[]; droppedRatio: number } {
  if (pixels.length === 0) return { kept: [], droppedRatio: 0 };
  const cutoff = foreheadBaseline.length >= MIN_BASELINE_PIXELS
    ? medianA(foreheadBaseline) + REDNESS_A_MARGIN
    : REDNESS_A_THRESHOLD;
  const kept = pixels.filter(p => rgbToLab(p).a <= cutoff);
  return { kept, droppedRatio: 1 - kept.length / pixels.length };
}

/**
 * Resample two pixel pools to a target total size so their simple mean
 * reflects the given weight ratio — lets the rest of the pipeline (which
 * expects a flat RGB[] to average) stay untouched while still favoring one
 * region over another (e.g. forehead over flushed cheeks).
 */
function weightedConcat(a: RGB[], weightA: number, b: RGB[], weightB: number, targetSize = 400): RGB[] {
  const resample = (arr: RGB[], n: number): RGB[] => {
    if (arr.length === 0 || n <= 0) return [];
    const out: RGB[] = [];
    for (let i = 0; i < n; i++) out.push(arr[Math.floor((i / n) * arr.length)]);
    return out;
  };
  const total = weightA + weightB;
  const nA = Math.round(targetSize * (weightA / total));
  return [...resample(a, nA), ...resample(b, targetSize - nA)];
}

/** Filter iris pixels (remove bright sclera / eyelid). */
function filterIris(pixels: RGB[]): RGB[] {
  return pixels.filter(({ r, g, b }) => (r + g + b) / 3 < 195);
}

/** Keep only bright eye-region pixels (sclera = white of the eye). */
function filterSclera(pixels: RGB[]): RGB[] {
  return pixels.filter(({ r, g, b }) => (r + g + b) / 3 > 200);
}

/**
 * Shift skin pixels so that the sclera (which should be near-white)
 * maps to pure white — corrects for warm/cool ambient lighting.
 * Scale is capped at 1.5× per channel to avoid amplifying noise.
 */
function applyWhiteBalance(pixels: RGB[], scleraRef: RGB): RGB[] {
  const sr = Math.min(255 / Math.max(scleraRef.r, 1), 1.5);
  const sg = Math.min(255 / Math.max(scleraRef.g, 1), 1.5);
  const sb = Math.min(255 / Math.max(scleraRef.b, 1), 1.5);
  return pixels.map(({ r, g, b }) => ({
    r: Math.min(255, Math.round(r * sr)),
    g: Math.min(255, Math.round(g * sg)),
    b: Math.min(255, Math.round(b * sb)),
  }));
}

/**
 * Whole-frame average color, strided for speed. Feeds the Gray World
 * fallback below — deliberately sampled from the full image (not just the
 * face) since the assumption is about the scene's overall color balance.
 */
function averageSceneColor(data: Uint8ClampedArray): RGB {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 40) { // stride ~10px
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
  return { r: r / n, g: g / n, b: b / n };
}

/**
 * Gray World assumption: a natural scene's average color tends toward
 * neutral gray, so any consistent skew in the frame average is read as an
 * ambient color cast. Used only as a fallback when there's no usable sclera
 * reference — it's weaker evidence than a known-white sclera (a scene that's
 * legitimately dominated by one hue, e.g. a warm wooden background, will
 * fool it), so the correction is capped tighter (±30% per channel) than
 * applyWhiteBalance's sclera-based 1.5× cap.
 */
function applyGrayWorldBalance(pixels: RGB[], sceneAvg: RGB): RGB[] {
  const gray = (sceneAvg.r + sceneAvg.g + sceneAvg.b) / 3;
  const scaleFor = (c: number) => Math.min(1.3, Math.max(0.7, gray / Math.max(c, 1)));
  const sr = scaleFor(sceneAvg.r), sg = scaleFor(sceneAvg.g), sb = scaleFor(sceneAvg.b);
  return pixels.map(({ r, g, b }) => ({
    r: Math.min(255, Math.round(r * sr)),
    g: Math.min(255, Math.round(g * sg)),
    b: Math.min(255, Math.round(b * sb)),
  }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, v));
}

function clampRound(v: number): number {
  return Math.round(clamp(v));
}

// ── ColorMetrics calculators ─────────────────────────────────────────────────

/**
 * Individual Typology Angle — classifies skin depth from LAB, independent
 * of undertone. ITA = atan2(L* - 50, b*) * 180/π (Chardon et al.).
 */
function calcITA(L: number, b: number): number {
  return Math.atan2(L - 50, b) * (180 / Math.PI);
}

/**
 * b* neutral-point (mid) and half-range as a *continuous* function of skin
 * depth (ITA°) — linearly interpolated between anchors instead of looked up
 * from discrete buckets. Melanin lifts baseline b* (more yellow) as skin
 * gets deeper, regardless of true undertone — a single fixed cutoff (e.g.
 * b*=12) reads deep/dark skin as warm by default. A bucketed lookup fixes
 * that but creates a hard jump right at each boundary; interpolating removes
 * the cliff and keeps the warm/cool split sliding smoothly with depth. This
 * matters most for deep/dark skin, where melanin's b* swing is largest and a
 * bucket edge would most easily misclassify a borderline reading.
 * Anchors are the old buckets' centers, ordered lightest → deepest (ITA
 * descending); mid/halfRange values are unchanged from before.
 */
const UNDERTONE_ANCHORS: { ita: number; mid: number; halfRange: number }[] = [
  { ita:  68,   mid: 10, halfRange:  9 }, // very light
  { ita:  48,   mid: 11, halfRange:  9 }, // light
  { ita:  34.5, mid: 13, halfRange: 10 }, // intermediate
  { ita:  19,   mid: 16, halfRange: 10 }, // tan
  { ita: -10,   mid: 19, halfRange: 11 }, // brown
  { ita: -50,   mid: 22, halfRange: 12 }, // dark
];

function undertoneParams(ita: number): { mid: number; halfRange: number } {
  const first = UNDERTONE_ANCHORS[0];
  const last  = UNDERTONE_ANCHORS[UNDERTONE_ANCHORS.length - 1];
  if (ita >= first.ita) return first;
  if (ita <= last.ita)  return last;

  for (let i = 0; i < UNDERTONE_ANCHORS.length - 1; i++) {
    const hi = UNDERTONE_ANCHORS[i], lo = UNDERTONE_ANCHORS[i + 1];
    if (ita <= hi.ita && ita >= lo.ita) {
      const t = (ita - lo.ita) / (hi.ita - lo.ita); // 0 at lo, 1 at hi
      return {
        mid:       lo.mid       + (hi.mid       - lo.mid)       * t,
        halfRange: lo.halfRange + (hi.halfRange - lo.halfRange) * t,
      };
    }
  }
  return last; // unreachable — ita is finite and bounded by first/last above
}

/**
 * Undertone from skin LAB (b* axis = yellow↑ / blue↓), thresholded relative
 * to the skin's own depth (see undertoneParams). Hair LAB gives a secondary
 * signal (weighted 20%).
 */
function calcUndertone(
  skinLab: LAB,
  hairLab: LAB | null,
): ColorMetrics['undertone'] {
  // Combine skin and hair b* signal
  const effB = hairLab
    ? skinLab.b * 0.80 + hairLab.b * 0.20
    : skinLab.b;

  const { mid, halfRange } = undertoneParams(calcITA(skinLab.L, skinLab.b));
  const lo = mid - halfRange;
  const hi = mid + halfRange;

  // warm: b* = lo → 0, b* = hi → 100
  const warm = clampRound((effB - lo) / (hi - lo) * 100);
  // cool: b* = hi → 0, b* = lo → 100
  const cool = clampRound((hi - effB) / (hi - lo) * 100);
  // neutral peaks when warm ≈ cool
  const neutral = clampRound(100 - Math.abs(warm - cool) * 0.85);

  return { warm, cool, neutral };
}

/**
 * Value (lightness) from skin L*.
 *   light: L* 65-85+
 *   medium: L* 45-65
 *   deep:   L* 20-45
 */
function calcValue(skinLab: LAB): ColorMetrics['value'] {
  const L = skinLab.L;

  const light  = clampRound((L - 48) / 37 * 100);  // L=48→0, L=85→100
  const deep   = clampRound((65 - L) / 37 * 100);   // L=65→0, L=28→100
  const medium = clampRound(100 - Math.abs(L - 57) / 15 * 100);

  return { light, medium, deep };
}

/**
 * Chroma from skin C* (colorfulness / saturation).
 *   soft:   low chroma (C* ≈ 10-28)
 *   clear:  medium (C* ≈ 32-50)
 *   bright: high (C* ≈ 50-75)
 */
function calcChroma(skinLab: LAB): ColorMetrics['chroma'] {
  const c = chroma(skinLab);

  const soft   = clampRound((38 - c) / 28 * 100);  // c=38→0, c=10→100
  const bright = clampRound((c - 35) / 35 * 100);  // c=35→0, c=70→100
  const clear  = clampRound(100 - Math.abs(c - 40) / 15 * 100); // peak c=40

  return { soft, clear, bright };
}

/**
 * Contrast from the L* range across skin, hair, eye, and sclera regions.
 *   high:   large L* gap (e.g. fair skin + dark hair/eyes)
 *   medium: moderate gap
 *   low:    similar lightness across all regions
 *
 * eyeLab is deliberately iris-only (filterIris() explicitly excludes the
 * sclera to isolate iris color) — so on its own it can't supply the "bright
 * white against dark everything else" look that reads as high contrast on
 * deep/dark skin (a hallmark of Bright/Dark Winter). Skin+hair+iris L* alone
 * cluster low together for deep skin regardless of true contrast level,
 * biasing every deep-skin photo toward "low contrast" even when a bright
 * sclera says otherwise. scleraLab (reusing the reference already sampled
 * for white balance, same reliability gate) adds that missing signal back
 * as its own L* data point, without touching a* or b* — contrast stays a
 * lightness-only metric so it doesn't overlap with the separate chroma axis.
 */
function calcContrast(
  skinLab: LAB,
  hairLab: LAB | null,
  eyeLab:  LAB | null,
  scleraLab: LAB | null = null,
): ColorMetrics['contrast'] {
  const ls = [skinLab.L];
  if (hairLab) ls.push(hairLab.L);
  if (eyeLab)  ls.push(eyeLab.L);
  if (scleraLab) ls.push(scleraLab.L);

  const range = Math.max(...ls) - Math.min(...ls);

  const high   = clampRound((range - 25) / 35 * 100);  // range=25→0, 60→100
  const low    = clampRound((45 - range) / 35 * 100);  // range=45→0, 10→100
  const medium = clampRound(100 - Math.abs(range - 35) / 15 * 100); // peak=35

  return { high, low, medium };
}

// ── Image quality check (no MediaPipe, canvas-only) ──────────────────────────

export type QualityResult = { ok: boolean; issues: string[] };

type LumaStats = { avgLuma: number; stdDevLuma: number; avgR: number; avgG: number; avgB: number };

/** Single pass over strided pixels — feeds both the brightness and color-cast checks. */
function computeLumaStats(data: Uint8ClampedArray): LumaStats {
  let sumLuma = 0, sumLumaSq = 0, sumR = 0, sumG = 0, sumB = 0, count = 0;
  for (let i = 0; i < data.length; i += 32) { // sample every 8th pixel (stride=8 → 32 bytes)
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    sumLuma += luma;
    sumLumaSq += luma * luma;
    sumR += r; sumG += g; sumB += b;
    count++;
  }
  const avgLuma = sumLuma / count;
  return {
    avgLuma,
    stdDevLuma: Math.sqrt(Math.max(0, sumLumaSq / count - avgLuma * avgLuma)),
    avgR: sumR / count,
    avgG: sumG / count,
    avgB: sumB / count,
  };
}

/**
 * A low/high average luminance alone can't tell "underexposed room" apart
 * from "well-lit photo of someone with deep or very fair skin" — both read
 * as an extreme mean. What differs is spread: a genuinely bad exposure
 * clips toward black/white and goes flat (low std-dev), while a properly
 * lit subject of any skin tone still shows contrast between skin,
 * catchlights, teeth, hair, background. So exposure is only flagged when
 * the extreme mean is *also* accompanied by a flat histogram.
 */
const DARK_LUMA_THRESHOLD = 38;
const BRIGHT_LUMA_THRESHOLD = 232;
const FLAT_STDDEV_THRESHOLD = 25; // below this, the frame lacks real detail/contrast

function checkBrightness(stats: LumaStats): string | null {
  const { avgLuma, stdDevLuma } = stats;
  if (avgLuma < DARK_LUMA_THRESHOLD && stdDevLuma < FLAT_STDDEV_THRESHOLD) {
    return 'The photo is too dark. Please upload a photo taken in natural light.';
  }
  if (avgLuma > BRIGHT_LUMA_THRESHOLD && stdDevLuma < FLAT_STDDEV_THRESHOLD) {
    return 'The photo is too bright. Try facing away from direct light or taking it in a shaded area.';
  }
  return null;
}

/**
 * Strong incandescent (yellow/orange) or shade/overcast (blue) ambient light
 * shifts the whole frame's color balance, which corrupts undertone detection
 * more than it corrupts exposure. Heuristic threshold, not fit to a dataset —
 * kept generous so a face-filling selfie (whose skin is naturally warmer
 * than neutral gray, R > B by construction) doesn't trip it on skin tone
 * alone; only a real ambient cast pushes the whole-frame average this far.
 */
const COLOR_CAST_THRESHOLD = 45;

function checkColorCast(stats: LumaStats): string | null {
  const warmth = (stats.avgR + stats.avgG) / 2 - stats.avgB;
  if (warmth > COLOR_CAST_THRESHOLD) {
    return 'The photo has a strong yellow/orange lighting cast. Please take the photo in natural white light.';
  }
  if (-warmth > COLOR_CAST_THRESHOLD) {
    return 'The photo has a strong blue lighting cast. Please take the photo in natural white light.';
  }
  return null;
}

function checkBlur(data: Uint8ClampedArray, width: number, height: number): string | null {
  // Laplacian variance on grayscale samples — low variance → blurry
  const step = 5;
  let sumSq = 0, count = 0;
  const lum = (idx: number) => 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const c      = lum((y * width + x) * 4);
      const top    = lum(((y - 1) * width + x) * 4);
      const bottom = lum(((y + 1) * width + x) * 4);
      const left   = lum((y * width + x - 1) * 4);
      const right  = lum((y * width + x + 1) * 4);
      const lap = top + bottom + left + right - 4 * c;
      sumSq += lap * lap;
      count++;
    }
  }
  const variance = count > 0 ? sumSq / count : 999;
  if (variance < 55) return 'The photo is blurry. Please upload a sharp, well-focused photo.';
  return null;
}

/**
 * Fast client-side quality check — brightness + blur only, no MediaPipe.
 * Call this before analyzeImage to give early feedback.
 */
export async function checkImageQuality(imageFile: File): Promise<QualityResult> {
  const canvas = await fileToCanvas(imageFile);
  const { width, height } = canvas;
  const { data } = canvas.getContext('2d')!.getImageData(0, 0, width, height);

  const issues: string[] = [];

  const lumaStats = computeLumaStats(data);
  const bIssue = checkBrightness(lumaStats);
  if (bIssue) issues.push(bIssue);
  const castIssue = checkColorCast(lumaStats);
  if (castIssue) issues.push(castIssue);

  // Normalize resolution before measuring blur so the same variance
  // threshold is meaningful for both a 4K photo and a small webcam capture.
  const blurCanvas = resizeForBlurCheck(canvas);
  const blurData = blurCanvas === canvas
    ? data
    : blurCanvas.getContext('2d')!.getImageData(0, 0, blurCanvas.width, blurCanvas.height).data;
  const blurIssue = checkBlur(blurData, blurCanvas.width, blurCanvas.height);
  if (blurIssue) issues.push(blurIssue);

  return { ok: issues.length === 0, issues };
}

// ── Main export ───────────────────────────────────────────────────────────────

/** Pipeline stages reported via onStage — used to show real (not simulated) progress. */
export type AnalysisStage = 'landmarks' | 'sampling' | 'color';

/**
 * Analyze an image file and return ColorMetrics for the Rule Engine.
 *
 * Must be called in a browser context (uses Canvas API + MediaPipe WASM).
 * Throws a UserFacingImageError with a user-readable message if no face is detected.
 */
export async function analyzeImage(
  imageFile: File,
  hairOverrideLab?: LAB | null,
  onStage?: (stage: AnalysisStage) => void,
): Promise<ColorMetrics> {
  if (typeof window === 'undefined') {
    throw new Error('analyzeImage() must be called in a browser context.');
  }

  // 1. Decode image → canvas
  const canvas = await fileToCanvas(imageFile);
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d')!;
  const { data } = ctx.getImageData(0, 0, width, height);

  // 2. MediaPipe FaceMesh — detect 468 face landmarks
  const fm = await getFaceMesh();
  const landmarks = await detectLandmarks(fm, canvas);

  // Face size check — face must span at least 12% of image width
  const faceWidthRatio = landmarks[454].x - landmarks[234].x;
  if (faceWidthRatio < 0.12) {
    throw new UserFacingImageError('Your face is too small in the frame. Please take a closer photo of your face.');
  }

  onStage?.('landmarks');

  // ── 3. Extract region pixels ──────────────────────────────────────────────

  // Skin: cheeks + forehead sampled separately (not merged up front) so
  // redness filtering and dynamic region weighting can treat them differently.
  const cheekRaw = [
    ...sampleAroundLandmarks(data, width, height, landmarks, LM.LEFT_CHEEK,  8),
    ...sampleAroundLandmarks(data, width, height, landmarks, LM.RIGHT_CHEEK, 8),
  ];
  const foreheadRaw = sampleAroundLandmarks(data, width, height, landmarks, LM.FOREHEAD, 6);

  const cheekFiltered    = filterSkin(cheekRaw);
  const foreheadFiltered = filterSkin(foreheadRaw);

  if (cheekFiltered.length + foreheadFiltered.length < MIN_SKIN_SAMPLE_PIXELS) {
    throw new UserFacingImageError(
      'Could not read your skin tone. ' +
      'Please upload a photo with your full face visible in natural light.',
    );
  }

  // Anti-redness: exertion/cold/rosacea flush reads as a false warm/pink
  // signal — drop those cheek pixels and lean on the forehead more instead.
  // Threshold is relative to the forehead's own a* (see filterRedness), so
  // flush detection transfers across skin depths instead of using one
  // universal cutoff.
  const { kept: cheekDeRed, droppedRatio: cheekRednessRatio } = filterRedness(cheekFiltered, foreheadFiltered);
  const cheekWeight    = cheekRednessRatio > 0.3 ? 0.3 : 0.65;
  const foreheadWeight = 1 - cheekWeight;

  // K-Means dominant-tone extraction — drops the specular-highlight cluster
  // (oily shine) and the shadow cluster (blemish, wrinkle, stubble), keeping
  // the middle brightness band as the region's true skin tone.
  const cheekSource    = cheekDeRed.length >= 30 ? cheekDeRed : cheekFiltered;
  const cheekDominant    = extractDominantSkinTone(cheekSource);
  const foreheadDominant = extractDominantSkinTone(foreheadFiltered);

  let skinPixels = weightedConcat(cheekDominant, cheekWeight, foreheadDominant, foreheadWeight);
  if (skinPixels.length < 30) skinPixels = [...cheekDeRed, ...foreheadFiltered];       // fallback 1: skip clustering/weighting
  if (skinPixels.length < 30) skinPixels = [...cheekFiltered, ...foreheadFiltered];    // fallback 2: skip redness filter too (guaranteed ≥ MIN_SKIN_SAMPLE_PIXELS, checked above)

  // White balance: sample sclera from eye contour, use as reference white.
  // Tired/irritated/bloodshot eyes push the sclera's own a* (red-green axis)
  // up independent of ambient lighting — that's a physiological artifact, not
  // a color-cast signal, so using it as the "should be neutral" reference
  // would corrupt the correction. When that happens, fall back to a Gray
  // World estimate (whole-frame average ≈ neutral) rather than skipping
  // correction entirely — a weaker but still useful signal.
  const scleraRaw = [
    ...sampleAroundLandmarks(data, width, height, landmarks, LM.LEFT_EYE,  4),
    ...sampleAroundLandmarks(data, width, height, landmarks, LM.RIGHT_EYE, 4),
  ];
  const scleraPixels = filterSclera(scleraRaw);
  const scleraRef = avgRGB(scleraPixels);
  const scleraBloodshot = scleraRef ? rgbToLab(scleraRef).a > SCLERA_REDNESS_A_THRESHOLD : false;
  if (scleraRef && scleraPixels.length >= 10 && !scleraBloodshot) {
    skinPixels = applyWhiteBalance(skinPixels, scleraRef);
  } else {
    skinPixels = applyGrayWorldBalance(skinPixels, averageSceneColor(data));
  }

  // Eyes: use iris landmarks if available (refined mode), else eye contour
  const hasIris = landmarks.length > 468;
  const leftEyeIndices  = hasIris ? LM.LEFT_IRIS  : LM.LEFT_EYE;
  const rightEyeIndices = hasIris ? LM.RIGHT_IRIS : LM.RIGHT_EYE;

  const eyePixels = filterIris([
    ...sampleAroundLandmarks(data, width, height, landmarks, leftEyeIndices,  hasIris ? 5 : 4),
    ...sampleAroundLandmarks(data, width, height, landmarks, rightEyeIndices, hasIris ? 5 : 4),
  ]);

  // Hair: rectangle above the forehead landmark.
  // Skipped when hairOverrideLab is given — a dyed color read from the photo
  // is not the person's true undertone/contrast signal, so the questionnaire's
  // natural hair color LAB is used instead (see analyzeImage callers).
  let hairLab: LAB | null;
  if (hairOverrideLab) {
    hairLab = hairOverrideLab;
  } else {
    const faceTop   = landmarks[LM.FACE_TOP];
    const faceLeft  = landmarks[LM.FACE_LEFT];
    const faceRight = landmarks[LM.FACE_RIGHT];

    const hairX0 = Math.round((faceLeft.x  - 0.04) * width);
    const hairX1 = Math.round((faceRight.x + 0.04) * width);
    const hairY1 = Math.max(0, Math.round(faceTop.y * height) - 8); // just above forehead

    const hairPixels = hairY1 > 15
      ? sampleRect(data, width, hairX0, 0, hairX1, hairY1)
      : [];

    const hairRGB = avgRGB(hairPixels.length >= 30 ? hairPixels : []);
    hairLab = hairRGB ? rgbToLab(hairRGB) : null;
  }

  onStage?.('sampling');

  // ── 4. Convert to LAB ─────────────────────────────────────────────────────

  const skinRGB = avgRGB(skinPixels)!;
  const skinLab = rgbToLab(skinRGB);

  // Bald / very short hair → the sampled region is scalp, not hair. Only the
  // sampled branch is at risk here — a questionnaire-sourced hairOverrideLab
  // is a self-reported reference, not a pixel sample, so it can't have
  // "caught scalp instead of hair". Fall back to skin(+iris)-only contrast
  // and undertone by nulling it out; calcContrast()/calcUndertone() already
  // handle a null hairLab.
  if (!hairOverrideLab && !isHairSignalReliable(hairLab, skinLab)) {
    hairLab = null;
  }

  const eyeRGB = avgRGB(eyePixels.length >= 5 ? eyePixels : skinPixels);
  const eyeLab = eyeRGB ? rgbToLab(eyeRGB) : null;

  // Same reliability gate as the white-balance step above (enough sclera
  // pixels, not bloodshot) — reused here as a contrast signal instead.
  const scleraLab = (scleraRef && scleraPixels.length >= 10 && !scleraBloodshot)
    ? rgbToLab(scleraRef)
    : null;

  onStage?.('color');

  // ── 5. Calculate ColorMetrics ─────────────────────────────────────────────

  return {
    undertone: calcUndertone(skinLab, hairLab),
    value:     calcValue(skinLab),
    chroma:    calcChroma(skinLab),
    contrast:  calcContrast(skinLab, hairLab, eyeLab, scleraLab),
  };
}
