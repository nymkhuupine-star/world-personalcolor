'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  forwardRef, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Mirrors Card.tsx's JPEG_QUALITY — kept local so this component has no
// dependency on its parent beyond the props below.
const JPEG_QUALITY = 0.85;

type Lighting = 'dark' | 'bright' | 'warm' | 'cool' | 'no-face' | 'good';

// Maps the face-guide oval's on-screen position/size (see the CSS below —
// top-[44%], min(58vmin,340px) x min(78vmin,460px)) to a pixel rect in the
// video's own coordinate space, inverting the `object-cover` crop the <video>
// uses to fill the viewport. Without this, the live gauge sampled the whole
// frame — background, hair, clothing — which is why a red wall or warm shirt
// could trip a false "too yellow" warning even under perfectly neutral light.
// The oval is horizontally centered, so the video's `scaleX(-1)` mirror never
// needs correcting here — mirroring around the center leaves a centered rect unchanged.
function computeOvalSampleRect(videoW: number, videoH: number, vpW: number, vpH: number) {
  const vmin = Math.min(vpW, vpH);
  const ovalW = Math.min(0.58 * vmin, 340);
  const ovalH = Math.min(0.78 * vmin, 460);
  const cx = vpW / 2;
  const cy = vpH * 0.44;

  const scale = Math.max(vpW / videoW, vpH / videoH);
  const offsetX = (videoW * scale - vpW) / 2;
  const offsetY = (videoH * scale - vpH) / 2;
  const toVideoX = (vpX: number) => (vpX + offsetX) / scale;
  const toVideoY = (vpY: number) => (vpY + offsetY) / scale;

  const x0 = Math.max(0, toVideoX(cx - ovalW / 2));
  const y0 = Math.max(0, toVideoY(cy - ovalH / 2));
  const x1 = Math.min(videoW, toVideoX(cx + ovalW / 2));
  const y1 = Math.min(videoH, toVideoY(cy + ovalH / 2));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// Cheap RGB-space skin-tone rule (Kovac et al.) — lets the gauge average only
// face-like pixels inside the oval instead of the whole crop box (which still
// includes its corners: hair, ears, background peeking around the oval).
function isSkinTone(r: number, g: number, b: number) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return r > 95 && g > 40 && b > 20 && (max - min) > 15 && Math.abs(r - g) > 15 && r > g && r > b;
}

export type CameraCaptureHandle = { open: () => void };

interface Props {
  /** Set by the parent after a failed getUserMedia() call; also read here so a
   *  retry goes straight to the file picker instead of re-triggering the same failure. */
  cameraError: string | null;
  onError: (message: string | null) => void;
  onFallbackToFilePicker: () => void;
  onCapture: (file: File) => void;
}

/**
 * Full-screen live camera capture — portaled to document.body so it always
 * covers the real viewport (phones, tablets, laptops alike) regardless of
 * any parent animation transform, plus a face-position guide and a live
 * lighting gauge.
 */
const CameraCapture = forwardRef<CameraCaptureHandle, Props>(function CameraCapture(
  { cameraError, onError, onFallbackToFilePicker, onCapture },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lightingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [lighting, setLighting] = useState<Lighting | null>(null);
  const [flashing, setFlashing] = useState(false);
  const emaRef = useRef<{ r: number; g: number; b: number; brightness: number; skinRatio: number } | null>(null);
  const stableRef = useRef<{ candidate: Lighting | null; count: number }>({ candidate: null, count: 0 });

  // SSR-safe "is client" flag — createPortal(..., document.body) needs
  // `document` at call time, which doesn't exist during SSR. useSyncExternalStore
  // (server snapshot=false, client snapshot=true) gives that without the
  // setState-in-effect anti-pattern a plain useState+useEffect mount flag has.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (showCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [showCamera]);

  // Lock background scroll while the full-screen camera is open
  useEffect(() => {
    if (!showCamera) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [showCamera]);

  // Live lighting gauge — samples only the face-guide oval (not the whole frame,
  // which false-triggered on warm backgrounds/clothing), averages skin-toned
  // pixels only, and requires a reading to repeat before it reaches the UI so a
  // single specular-highlight frame can't flip the badge.
  useEffect(() => {
    if (!showCamera) return;
    const SIZE = 48;
    const EMA_ALPHA = 0.3;
    const STABLE_FRAMES = 2;
    const MIN_SKIN_RATIO = 0.12;
    emaRef.current = null;
    stableRef.current = { candidate: null, count: 0 };

    const id = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth) return;

      const rect = computeOvalSampleRect(video.videoWidth, video.videoHeight, window.innerWidth, window.innerHeight);
      if (rect.w <= 0 || rect.h <= 0) return;

      const canvas = lightingCanvasRef.current ?? (lightingCanvasRef.current = document.createElement('canvas'));
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, rect.x, rect.y, rect.w, rect.h, 0, 0, SIZE, SIZE);
      const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

      let skinR = 0, skinG = 0, skinB = 0, skinCount = 0;
      const totalCount = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        const pr = data[i], pg = data[i + 1], pb = data[i + 2];
        if (isSkinTone(pr, pg, pb)) { skinR += pr; skinG += pg; skinB += pb; skinCount++; }
      }

      const skinRatio = skinCount / totalCount;
      const r = skinCount > 0 ? skinR / skinCount : 0;
      const g = skinCount > 0 ? skinG / skinCount : 0;
      const b = skinCount > 0 ? skinB / skinCount : 0;
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      const prev = emaRef.current;
      const ema = prev
        ? {
            r: prev.r + EMA_ALPHA * (r - prev.r),
            g: prev.g + EMA_ALPHA * (g - prev.g),
            b: prev.b + EMA_ALPHA * (b - prev.b),
            brightness: prev.brightness + EMA_ALPHA * (brightness - prev.brightness),
            skinRatio: prev.skinRatio + EMA_ALPHA * (skinRatio - prev.skinRatio),
          }
        : { r, g, b, brightness, skinRatio };
      emaRef.current = ema;

      // Priority: can't judge light quality without a face in frame; then hard
      // exposure problems; then a color cast measured on skin pixels only, as a
      // brightness-normalized ratio (not a raw channel gap) so it doesn't drift
      // with scene brightness the way the old `r - b > 35` rule did.
      let candidate: Lighting;
      if (ema.skinRatio < MIN_SKIN_RATIO) candidate = 'no-face';
      else if (ema.brightness < 70) candidate = 'dark';
      else if (ema.brightness > 225) candidate = 'bright';
      else if ((ema.r - ema.b) / Math.max(ema.brightness, 1) > 0.22) candidate = 'warm';
      else if ((ema.b - ema.r) / Math.max(ema.brightness, 1) > 0.16) candidate = 'cool';
      else candidate = 'good';

      const stable = stableRef.current;
      stable.count = candidate === stable.candidate ? stable.count + 1 : 1;
      stable.candidate = candidate;
      if (stable.count >= STABLE_FRAMES) setLighting(candidate);
    }, 350);
    return () => { clearInterval(id); setLighting(null); };
  }, [showCamera]);

  // Stop the camera stream if the component unmounts while it's open
  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  };

  const openCamera = async () => {
    // Camera already failed once (e.g. permission denied) — retrying just
    // re-triggers the same failure, so go straight to the file picker.
    if (cameraError) { onFallbackToFilePicker(); return; }
    onError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width:  { ideal: 3840 },
          height: { ideal: 2160 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setShowCamera(true);
      console.log('Camera actual settings:', stream.getVideoTracks()[0]?.getSettings());

      // Best-effort white balance lock — non-standard, Chrome desktop/Android only.
      // Real skin-tone correctness doesn't rely on this: applyWhiteBalance() in
      // image-analysis.ts calibrates against the sclera (white of the eye) per photo,
      // which works on every device/browser regardless of hardware support here.
      try {
        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as (MediaTrackCapabilities & { whiteBalanceMode?: string[] }) | undefined;
        if (caps?.whiteBalanceMode?.includes('continuous')) {
          await track.applyConstraints({ advanced: [{ whiteBalanceMode: 'continuous' } as unknown as MediaTrackConstraintSet] });
        }
      } catch (wbErr) {
        console.warn('White balance constraint not supported on this device:', wbErr);
      }
    } catch (err) {
      console.error('Camera access failed:', err);
      onError('Could not access the camera. Please check your camera permissions or upload a photo instead.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    // Screen-flash fill light: a solid white full-screen flash right before the
    // grab is a genuine, camera-visible light source — unlike a drawn-on UI
    // border (which the sensor never sees, since it's composited after capture),
    // this light actually bounces off the face and gets recorded, giving the
    // sclera-based white balance step a more even, more neutral base to start
    // from — especially in dim or color-cast rooms.
    setFlashing(true);
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setFlashing(false); return; }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        setFlashing(false);
        if (!blob) return;
        onCapture(new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        closeCamera();
      }, 'image/jpeg', JPEG_QUALITY);
    }, 220); // give the flash light a beat to actually hit the face before we grab the frame
  };

  useImperativeHandle(ref, () => ({ open: openCamera }));

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {showCamera && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Screen-flash fill light — real light the camera sensor actually sees,
              unlike a drawn-on border overlay (which is composited after capture
              and never reaches the lens). Covers everything while active. */}
          <AnimatePresence>
            {flashing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="pointer-events-none absolute inset-0 z-[50] bg-white"
              />
            )}
          </AnimatePresence>

          {/* Face position guide — head-shaped oval, dims everything outside it.
              Width/height and the label offset both derive from the same min() clamp
              so the label stays glued to the oval's actual edge on every screen size.
              Border color reflects the live gauge, so the oval itself is real feedback
              (green = framed + lit correctly) rather than a static decoration. */}
          <div
            className="pointer-events-none absolute left-1/2 top-[44%] z-[5] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-dashed transition-colors duration-300"
            style={{
              width: 'min(58vmin, 340px)',
              height: 'min(78vmin, 460px)',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
              borderColor: lighting === 'good'
                ? 'rgba(52,211,153,0.9)'
                : lighting === null || lighting === 'no-face'
                  ? 'rgba(255,255,255,0.85)'
                  : 'rgba(244,63,94,0.9)',
            }}
          />
          <p
            className="pointer-events-none absolute left-1/2 z-[5] -translate-x-1/2 px-4 text-center text-xs font-semibold text-white/90"
            style={{ top: 'max(calc(44% - min(39vmin, 230px) - 2rem), 4.5rem)' }}
          >
            {lighting === 'no-face'
              ? 'Нүүрээ хүрээн дотор, тод харагдахаар байрлуулна уу'
              : 'Нүүрээ хүрээн дотор байрлуулна уу'}
            <br />
            <span className="font-normal text-white/70">Байгалийн цайвар гэрэлд, нүдний шил/малгайгүйгээр авахыг зөвлөж байна</span>
          </p>

          <div
            className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
          >
            {/* Live lighting gauge */}
            {lighting ? (
              <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${lighting === 'good' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                <span className="text-xs font-semibold text-white">
                  {lighting === 'no-face' ? 'Нүүр олдсонгүй'
                    : lighting === 'dark' ? 'Хэт харанхуй'
                    : lighting === 'bright' ? 'Хэт тод гэрэлтэй'
                    : lighting === 'warm' ? 'Хэт шар гэрэлтэй'
                    : lighting === 'cool' ? 'Хэт хөх гэрэлтэй'
                    : 'Гэрэлтүүлэг төгс байна'}
                </span>
              </div>
            ) : <span />}

            <button
              type="button"
              onClick={closeCamera}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 active:scale-90"
              aria-label="Close camera"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          <div
            className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent p-6"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
          >
            <button
              type="button"
              onClick={capturePhoto}
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 backdrop-blur-sm transition-transform active:scale-90"
              aria-label="Take photo"
            >
              <div className="h-12 w-12 rounded-full bg-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
});

export default CameraCapture;
