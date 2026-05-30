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

type RGB = { r: number; g: number; b: number };
type LAB = { L: number; a: number; b: number };
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

/** Run MediaPipe FaceMesh on a canvas and return landmarks for the first face. */
function detectLandmarks(fm: FaceMeshInstance, canvas: HTMLCanvasElement): Promise<NormalizedLandmark[]> {
  return new Promise((resolve, reject) => {
    fm.onResults((results: FaceMeshResults) => {
      const face = results.multiFaceLandmarks?.[0];
      if (!face?.length) {
        reject(new Error('Нүүр илрүүлж чадсангүй. Нүүр бүтэн харагдах зураг оруулна уу.'));
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

/** Filter iris pixels (remove bright sclera / eyelid). */
function filterIris(pixels: RGB[]): RGB[] {
  return pixels.filter(({ r, g, b }) => (r + g + b) / 3 < 195);
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
 * Undertone from skin LAB (b* axis = yellow↑ / blue↓).
 * Hair LAB gives a secondary signal (weighted 20%).
 */
function calcUndertone(
  skinLab: LAB,
  hairLab: LAB | null,
): ColorMetrics['undertone'] {
  // Combine skin and hair b* signal
  const effB = hairLab
    ? skinLab.b * 0.80 + hairLab.b * 0.20
    : skinLab.b;

  // warm: b* 7 → 0, b* 30 → 100
  const warm = clampRound((effB - 7) / 23 * 100);
  // cool: b* 25 → 0, b* 3 → 100
  const cool = clampRound((25 - effB) / 22 * 100);
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
 * Contrast from the L* range across skin, hair, and eye regions.
 *   high:   large L* gap (e.g. fair skin + dark hair/eyes)
 *   medium: moderate gap
 *   low:    similar lightness across all regions
 */
function calcContrast(
  skinLab: LAB,
  hairLab: LAB | null,
  eyeLab:  LAB | null,
): ColorMetrics['contrast'] {
  const ls = [skinLab.L];
  if (hairLab) ls.push(hairLab.L);
  if (eyeLab)  ls.push(eyeLab.L);

  const range = Math.max(...ls) - Math.min(...ls);

  const high   = clampRound((range - 25) / 35 * 100);  // range=25→0, 60→100
  const low    = clampRound((45 - range) / 35 * 100);  // range=45→0, 10→100
  const medium = clampRound(100 - Math.abs(range - 35) / 15 * 100); // peak=35

  return { high, low, medium };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Analyze an image file and return ColorMetrics for the Rule Engine.
 *
 * Must be called in a browser context (uses Canvas API + MediaPipe WASM).
 * Throws a user-readable Mongolian error if no face is detected.
 */
export async function analyzeImage(imageFile: File): Promise<ColorMetrics> {
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

  // ── 3. Extract region pixels ──────────────────────────────────────────────

  // Skin: left cheek + right cheek + forehead (filtered for skin tone)
  const rawSkinPixels = [
    ...sampleAroundLandmarks(data, width, height, landmarks, LM.LEFT_CHEEK,  8),
    ...sampleAroundLandmarks(data, width, height, landmarks, LM.RIGHT_CHEEK, 8),
    ...sampleAroundLandmarks(data, width, height, landmarks, LM.FOREHEAD,    6),
  ];
  const skinPixels = filterSkin(rawSkinPixels);

  if (skinPixels.length < 30) {
    throw new Error(
      'Арьсны өнгийг уншиж чадсангүй. ' +
      'Нүүр бүтэн харагдах, байгалийн гэрэлтэй зураг оруулна уу.',
    );
  }

  // Eyes: use iris landmarks if available (refined mode), else eye contour
  const hasIris = landmarks.length > 468;
  const leftEyeIndices  = hasIris ? LM.LEFT_IRIS  : LM.LEFT_EYE;
  const rightEyeIndices = hasIris ? LM.RIGHT_IRIS : LM.RIGHT_EYE;

  const eyePixels = filterIris([
    ...sampleAroundLandmarks(data, width, height, landmarks, leftEyeIndices,  hasIris ? 5 : 4),
    ...sampleAroundLandmarks(data, width, height, landmarks, rightEyeIndices, hasIris ? 5 : 4),
  ]);

  // Hair: rectangle above the forehead landmark
  const faceTop   = landmarks[LM.FACE_TOP];
  const faceLeft  = landmarks[LM.FACE_LEFT];
  const faceRight = landmarks[LM.FACE_RIGHT];

  const hairX0 = Math.round((faceLeft.x  - 0.04) * width);
  const hairX1 = Math.round((faceRight.x + 0.04) * width);
  const hairY1 = Math.max(0, Math.round(faceTop.y * height) - 8); // just above forehead

  const hairPixels = hairY1 > 15
    ? sampleRect(data, width, hairX0, 0, hairX1, hairY1)
    : [];

  // ── 4. Convert to LAB ─────────────────────────────────────────────────────

  const skinRGB = avgRGB(skinPixels)!;
  const skinLab = rgbToLab(skinRGB);

  const eyeRGB = avgRGB(eyePixels.length >= 5 ? eyePixels : skinPixels);
  const eyeLab = eyeRGB ? rgbToLab(eyeRGB) : null;

  const hairRGB = avgRGB(hairPixels.length >= 30 ? hairPixels : []);
  const hairLab = hairRGB ? rgbToLab(hairRGB) : null;

  // ── 5. Calculate ColorMetrics ─────────────────────────────────────────────

  return {
    undertone: calcUndertone(skinLab, hairLab),
    value:     calcValue(skinLab),
    chroma:    calcChroma(skinLab),
    contrast:  calcContrast(skinLab, hairLab, eyeLab),
  };
}
