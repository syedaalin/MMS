import {
  deriveBrandColorsFromPalette,
  type LogoBrandColors,
} from '@mms/shared';

export interface ExtractLogoBrandColorsOptions {
  /** Longest canvas edge when sampling pixels (performance vs accuracy). */
  sampleSize?: number;
  /** Maximum dominant swatches passed to the derivation step. */
  maxSwatches?: number;
  /** Alpha threshold (0–255); transparent pixels are ignored. */
  minAlpha?: number;
  /** Bits per channel when quantizing similar pixels (higher = more precision). */
  quantizeBits?: number;
}

const DEFAULT_OPTIONS: Required<ExtractLogoBrandColorsOptions> = {
  sampleSize: 72,
  maxSwatches: 10,
  minAlpha: 40,
  quantizeBits: 4,
};

function quantizeChannel(value: number, bits: number): number {
  const levels = 1 << bits;
  const step = 255 / (levels - 1);
  return Math.round(Math.round(value / step) * step);
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (channel: number) =>
    Math.max(0, Math.min(255, channel)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image for colour extraction'));
    image.src = src;
  });
}

function sampleDominantSwatches(
  imageData: ImageData,
  options: Required<ExtractLogoBrandColorsOptions>,
): string[] {
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    if (a < options.minAlpha) continue;

    const qr = quantizeChannel(r, options.quantizeBits);
    const qg = quantizeChannel(g, options.quantizeBits);
    const qb = quantizeChannel(b, options.quantizeBits);
    const key = `${qr}|${qg}|${qb}`;

    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      existing.r += r;
      existing.g += g;
      existing.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  return [...buckets.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, options.maxSwatches)
    .map(([, bucket]) =>
      rgbToHex(
        Math.round(bucket.r / bucket.count),
        Math.round(bucket.g / bucket.count),
        Math.round(bucket.b / bucket.count),
      ),
    );
}

/**
 * Samples a logo image and derives accessible primary/accent brand colours.
 * Browser-only — uses canvas pixel sampling with transparency filtering and quantization.
 */
export async function extractLogoBrandColors(
  imageDataUrl: string,
  options?: ExtractLogoBrandColorsOptions,
): Promise<LogoBrandColors | null> {
  if (!imageDataUrl.startsWith('data:image/')) return null;

  const resolved = { ...DEFAULT_OPTIONS, ...options };

  try {
    const image = await loadImage(imageDataUrl);
    const longestEdge = Math.max(image.naturalWidth, image.naturalHeight, 1);
    const scale = resolved.sampleSize / longestEdge;
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height);
    const swatches = sampleDominantSwatches(pixels, resolved);

    return deriveBrandColorsFromPalette(swatches);
  } catch {
    return null;
  }
}
