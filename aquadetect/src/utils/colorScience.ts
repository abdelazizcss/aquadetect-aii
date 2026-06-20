/**
 * Color Science utilities for CIELAB color space and Delta-E calculations
 */

// Convert RGB to linear sRGB
function rgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

// Convert linear sRGB to XYZ (D65 illuminant)
function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const lr = rgbToLinear(r);
  const lg = rgbToLinear(g);
  const lb = rgbToLinear(b);

  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb;
  const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb;

  return [x * 100, y * 100, z * 100];
}

// D65 reference white point
const D65_X = 95.047;
const D65_Y = 100.0;
const D65_Z = 108.883;

function labF(t: number): number {
  const delta = 6 / 29;
  return t > delta * delta * delta ? Math.cbrt(t) : t / (3 * delta * delta) + 4 / 29;
}

// Convert RGB to CIELAB
export function rgbToCielab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const [x, y, z] = rgbToXyz(r, g, b);

  const fx = labF(x / D65_X);
  const fy = labF(y / D65_Y);
  const fz = labF(z / D65_Z);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return { L: Math.round(L * 100) / 100, a: Math.round(a * 100) / 100, b: Math.round(bVal * 100) / 100 };
}

// Calculate Delta-E (CIE76)
export function deltaE76(
  lab1: { L: number; a: number; b: number },
  lab2: { L: number; a: number; b: number }
): number {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.round(Math.sqrt(dL * dL + da * da + db * db) * 100) / 100;
}

// Calculate Delta-E (CIE2000) - more accurate
export function deltaE2000(
  lab1: { L: number; a: number; b: number },
  lab2: { L: number; a: number; b: number }
): number {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  const kL = 1, kC = 1, kH = 1;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cb = (C1 + C2) / 2;
  const Cb7 = Math.pow(Cb, 7);
  const G = 0.5 * (1 - Math.sqrt(Cb7 / (Cb7 + Math.pow(25, 7))));

  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  const h1p = Math.atan2(b1, a1p) * 180 / Math.PI;
  const h2p = Math.atan2(b2, a2p) * 180 / Math.PI;
  const h1pn = h1p >= 0 ? h1p : h1p + 360;
  const h2pn = h2p >= 0 ? h2p : h2p + 360;

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2pn - h1pn) <= 180) {
    dhp = h2pn - h1pn;
  } else if (h2pn - h1pn > 180) {
    dhp = h2pn - h1pn - 360;
  } else {
    dhp = h2pn - h1pn + 360;
  }

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);

  const Lp = (L1 + L2) / 2;
  const Cp = (C1p + C2p) / 2;

  let Hp: number;
  if (C1p * C2p === 0) {
    Hp = h1pn + h2pn;
  } else if (Math.abs(h1pn - h2pn) <= 180) {
    Hp = (h1pn + h2pn) / 2;
  } else if (h1pn + h2pn < 360) {
    Hp = (h1pn + h2pn + 360) / 2;
  } else {
    Hp = (h1pn + h2pn - 360) / 2;
  }

  const T = 1 - 0.17 * Math.cos((Hp - 30) * Math.PI / 180) + 0.24 * Math.cos(2 * Hp * Math.PI / 180)
    + 0.32 * Math.cos((3 * Hp + 6) * Math.PI / 180) - 0.20 * Math.cos((4 * Hp - 63) * Math.PI / 180);

  const SL = 1 + 0.015 * Math.pow(Lp - 50, 2) / Math.sqrt(20 + Math.pow(Lp - 50, 2));
  const SC = 1 + 0.045 * Cp;
  const SH = 1 + 0.015 * Cp * T;

  const Cp7 = Math.pow(Cp, 7);
  const RT = -2 * Math.sqrt(Cp7 / (Cp7 + Math.pow(25, 7)))
    * Math.sin(60 * Math.exp(-Math.pow((Hp - 275) / 25, 2)) * Math.PI / 180);

  const dE = Math.sqrt(
    Math.pow(dLp / (kL * SL), 2) +
    Math.pow(dCp / (kC * SC), 2) +
    Math.pow(dHp / (kH * SH), 2) +
    RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
  );

  return Math.round(dE * 100) / 100;
}

// Parse hex to RGB
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

// RGB to hex
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Calculate confidence based on Delta-E
export function calculateConfidence(deltaE: number): number {
  // Lower Delta-E = higher confidence
  if (deltaE <= 5) return Math.round((1 - deltaE / 50) * 100 * 10) / 10;
  if (deltaE <= 15) return Math.round((0.9 - (deltaE - 5) / 50) * 100 * 10) / 10;
  if (deltaE <= 30) return Math.round((0.7 - (deltaE - 15) / 100) * 100 * 10) / 10;
  return Math.round(Math.max(50, (0.55 - (deltaE - 30) / 200)) * 100 * 10) / 10;
}

// Get average color from image data
export function getAverageColor(imageData: ImageData): [number, number, number] {
  const data = imageData.data;
  let r = 0, g = 0, b = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }

  return [
    Math.round(r / pixelCount),
    Math.round(g / pixelCount),
    Math.round(b / pixelCount),
  ];
}