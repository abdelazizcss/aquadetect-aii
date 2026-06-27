import { CALIBRATION_DATA } from './calibrationData';
import { rgbToCielab, deltaE2000, rgbToHex } from './colorScience';
import type { AnalysisResult, CalibrationEntry } from '../types';

export function detectStripRegion(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): { x: number; y: number; width: number; height: number } {
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Build improved confidence map for strip detection
  // Works with any background color by using edge detection and contrast
  const buildStripConfidenceMap = (width: number, height: number, data: Uint8ClampedArray): Float32Array => {
    const map = new Float32Array(width * height);
    const grayMap = new Float32Array(width * height);

    // First pass: convert to grayscale for edge detection
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        grayMap[y * width + x] = gray;
      }
    }

    // Second pass: build confidence using multiple features
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const brightness = (r + g + b) / 3;
        const sat = max === 0 ? 0 : ((max - min) / max) * 100;

        let confidence = 0;

        // Local contrast using gradient
        const gx = getGradientX(grayMap, width, height, x, y);
        const gy = getGradientY(grayMap, width, height, x, y);
        const gradientMag = Math.sqrt(gx * gx + gy * gy);

        // Hue detection for blue/violet strips
        const hue = getHue(r, g, b);
        const isBlueViolet = (hue >= 180 && hue <= 280) || (hue >= 300 && hue <= 340);

        // Mid-tone check (not too dark, not too bright)
        const isMidTone = brightness >= 40 && brightness <= 220;

        // Moderate saturation
        const isModerateSat = sat >= 5 && sat <= 80;

        // Blue channel dominance
        const blueDominance = b > r && b > g && (b - r) > 15;

        // Combine features
        let featureScore = 0;
        if (isMidTone) featureScore += 25;
        if (isModerateSat) featureScore += 20;
        if (isBlueViolet) featureScore += 30;
        if (blueDominance) featureScore += 15;
        if (gradientMag > 15) featureScore += 10;

        // Background suppression
        let bgPenalty = 0;
        if (brightness > 250 && sat < 3) bgPenalty = 100;
        else if (brightness < 20) bgPenalty = 80;
        else if (sat < 3 && brightness > 220) bgPenalty = 40;

        confidence = Math.max(0, featureScore - bgPenalty);

        // Boost confidence for coherent regions
        const neighborBoost = getNeighborConsistency(grayMap, width, height, x, y, 2);
        if (neighborBoost > 0.5) confidence *= 1.3;

        map[y * width + x] = confidence;
      }
    }
    return map;
  };

  const stripMap = buildStripConfidenceMap(w, h, data);

  // Smooth the map to reduce noise
  const smoothedMap = smoothMap(stripMap, w, h, 3);

  // Detect horizontal strip region
  const horizontalRegion = detectRegionFromMap(w, h, smoothedMap, false);
  // Detect vertical strip region
  const verticalRegion = detectRegionFromMap(w, h, smoothedMap, true);

  // Choose the region with higher confidence (better strip detection)
  const horizontalScore = calculateRegionScore(smoothedMap, w, h, horizontalRegion);
  const verticalScore = calculateRegionScore(smoothedMap, w, h, verticalRegion);

  const chosenRegion = horizontalScore >= verticalScore ? horizontalRegion : verticalRegion;

  // Return the full detected strip region
  // Central ROI extraction is handled in analyzeImage function
  return chosenRegion;
}

function getGradientX(grayMap: Float32Array, w: number, _h: number, x: number, y: number): number {
  if (x <= 0 || x >= w - 1) return 0;
  const left = grayMap[y * w + (x - 1)];
  const right = grayMap[y * w + (x + 1)];
  return (right - left) / 2;
}

function getGradientY(grayMap: Float32Array, w: number, h: number, x: number, y: number): number {
  if (y <= 0 || y >= h - 1) return 0;
  const top = grayMap[(y - 1) * w + x];
  const bottom = grayMap[(y + 1) * w + x];
  return (bottom - top) / 2;
}

function getHue(r: number, g: number, b: number): number {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const delta = max - min;

  if (delta < 0.0001) return 0;

  let h = 0;
  if (max === rf) {
    h = ((gf - bf) / delta) % 6;
  } else if (max === gf) {
    h = (bf - rf) / delta + 2;
  } else {
    h = (rf - gf) / delta + 4;
  }
  h = Math.round(h * 30);
  if (h < 0) h += 180;
  return h;
}

function getNeighborConsistency(
  grayMap: Float32Array,
  w: number, h: number,
  cx: number, cy: number,
  radius: number
): number {
  let sum = 0;
  let count = 0;
  const center = grayMap[cy * w + cx];

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;

      const diff = Math.abs(grayMap[ny * w + nx] - center);
      if (diff < 30) sum++;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

function smoothMap(map: Float32Array, w: number, h: number, windowSize: number): Float32Array {
  const result = new Float32Array(w * h);
  const half = Math.floor(windowSize / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            sum += map[ny * w + nx];
            count++;
          }
        }
      }
      result[y * w + x] = count > 0 ? sum / count : 0;
    }
  }
  return result;
}

function detectRegionFromMap(
  w: number, h: number,
  confidenceMap: Float32Array,
  isVertical: boolean
): { x: number; y: number; width: number; height: number } {
  // Project saturation along the appropriate axis
  const axisSignal: number[] = [];
  const axisLength = isVertical ? w : h;

  // Project confidence along the strip orientation
  for (let i = 0; i < axisLength; i++) {
    let sum = 0;
    let count = 0;
    if (isVertical) {
      for (let j = 0; j < h; j++) {
        sum += confidenceMap[j * w + i];
        count++;
      }
    } else {
      for (let j = 0; j < h; j++) {
        sum += confidenceMap[j * w + i];
        count++;
      }
    }
    axisSignal.push(count > 0 ? sum / count : 0);
  }

  const smoothed = smoothSignal(axisSignal, 5);
  const maxVal = Math.max(...smoothed);
  const minVal = Math.min(...smoothed);
  const range = maxVal - minVal;

  if (range < 2) {
    return {
      x: Math.floor(w * 0.1),
      y: Math.floor(h * 0.3),
      width: Math.floor(w * 0.8),
      height: Math.floor(h * 0.4),
    };
  }

  // Use adaptive threshold
  const threshold = minVal + range * 0.35;

  let bestA1 = -1;
  let bestA2 = -1;
  let bestLen = 0;
  let startA = -1;

  for (let i = 0; i < axisLength; i++) {
    if (smoothed[i] >= threshold) {
      if (startA === -1) startA = i;
    } else {
      if (startA !== -1) {
        const len = i - startA;
        if (len > bestLen) {
          bestLen = len;
          bestA1 = startA;
          bestA2 = i - 1;
        }
        startA = -1;
      }
    }
  }

  if (startA !== -1) {
    const len = axisLength - startA;
    if (len > bestLen) {
      bestLen = len;
      bestA1 = startA;
      bestA2 = axisLength - 1;
    }
  }

  if (bestA1 === -1 || bestLen < 10) {
    return {
      x: Math.floor(w * 0.1),
      y: Math.floor(h * 0.3),
      width: Math.floor(w * 0.8),
      height: Math.floor(h * 0.4),
    };
  }

  const margin = 6;
  const a1 = Math.max(0, bestA1 - margin);
  const a2 = Math.min(axisLength - 1, bestA2 + margin);

  // Find perpendicular boundaries using confidence projection
  const perpConf: number[] = [];
  const perpLength = isVertical ? h : w;

  for (let i = 0; i < perpLength; i++) {
    let sum = 0;
    let count = 0;
    for (let j = a1; j <= a2; j++) {
      const x = isVertical ? j : i;
      const y = isVertical ? i : j;
      if (x >= 0 && x < w && y >= 0 && y < h) {
        sum += confidenceMap[y * w + x];
        count++;
      }
    }
    perpConf.push(count > 0 ? sum / count : 0);
  }

  const maxPerp = Math.max(...perpConf);
  const perpThreshold = maxPerp * 0.3;

  let p1 = 0;
  let p2 = perpLength - 1;

  for (let i = 0; i < perpLength; i++) {
    if (perpConf[i] >= perpThreshold) {
      p1 = i;
      break;
    }
  }
  for (let i = perpLength - 1; i >= 0; i--) {
    if (perpConf[i] >= perpThreshold) {
      p2 = i;
      break;
    }
  }

  if (isVertical) {
    return {
      x: Math.max(0, a1 - 4),
      y: Math.max(0, p1 - 4),
      width: Math.min(w - 1, a2 + 4) - Math.max(0, a1 - 4) + 1,
      height: Math.min(h - 1, p2 + 4) - Math.max(0, p1 - 4) + 1,
    };
  } else {
    return {
      x: Math.max(0, p1 - 4),
      y: Math.max(0, a1 - 4),
      width: Math.min(w - 1, p2 + 4) - Math.max(0, p1 - 4) + 1,
      height: Math.min(h - 1, a2 + 4) - Math.max(0, a1 - 4) + 1,
    };
  }
}

function calculateRegionScore(
  saturationMap: Float32Array,
  w: number,
  h: number,
  region: { x: number; y: number; width: number; height: number }
): number {
  let sum = 0;
  let count = 0;

  for (let y = region.y; y < region.y + region.height && y < h; y++) {
    for (let x = region.x; x < region.x + region.width && x < w; x++) {
      sum += saturationMap[y * w + x];
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
}

function smoothSignal(signal: number[], windowSize: number): number[] {
  const result: number[] = [];
  const half = Math.floor(windowSize / 2);

  for (let i = 0; i < signal.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(signal.length - 1, i + half); j++) {
      sum += signal[j];
      count++;
    }
    result.push(sum / count);
  }

  return result;
}

export function analyzeImage(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  _imageWidth: number,
  _imageHeight: number
): AnalysisResult {
  const stripRegion = detectStripRegion(canvas, ctx);

  // Expanded central region for clearer analysis
  const centralHeight = Math.floor(stripRegion.height * 0.7);
  const yStart = stripRegion.y + Math.floor(stripRegion.height * 0.15);
  const centralRegion = {
    x: stripRegion.x,
    y: yStart,
    width: stripRegion.width,
    height: centralHeight,
  };

  const centralData = ctx.getImageData(centralRegion.x, centralRegion.y, centralRegion.width, centralRegion.height);
  const rawPixels = centralData.data;

  const classifiedPixels = classifyPixelsAdvanced(rawPixels);
  const avgColor = calculateWeightedAverage(classifiedPixels);
  const classification = multiAlgorithmClassification(avgColor, classifiedPixels);

  let isCriticalBleached = false;
  if (classification.range === '>750 ppm') {
    const edgeResult = detectBleachingEdge(centralData);
    isCriticalBleached = edgeResult.hasBleachingGradient || edgeResult.isWhiteCore;
  }

  const confidence = calculateProfessionalConfidence(avgColor, classification, isCriticalBleached);

  const entry = classification.entry;
  let ppm = entry.ppmCenter;

  if (classification.range === '>750 ppm' && isCriticalBleached && entry.isBleached) {
    ppm = Math.max(ppm, 800);
  }

  let status: string;
  let riskLevel: string;
  let colorName: string;

  if (isCriticalBleached && entry.isBleached) {
    status = 'Critical';
    riskLevel = 'Critical';
    colorName = 'Rose Vif / Fuchsia Total';
  } else {
    const ppmStatus = getStatusFromPpm(ppm);
    status = ppmStatus.status;
    riskLevel = ppmStatus.riskLevel;
    colorName = ppmStatus.colorName;
  }

  const hex = rgbToHex(avgColor.r, avgColor.g, avgColor.b);
  const cielab = rgbToCielab(avgColor.r, avgColor.g, avgColor.b);
  const entryLab = rgbToCielab(...entry.rgb);
  const deltaE = deltaE2000(cielab, entryLab);

  return {
    waterContent: Math.round(ppm),
    range: classification.range,
    status,
    detectedColor: colorName,
    confidence: Math.min(confidence, 99.9),
    riskLevel,
    rgb: [avgColor.r, avgColor.g, avgColor.b],
    hex,
    deltaE,
    cielab,
    matchedEntry: entry,
  };
}

interface ClassifiedPixel {
  h: number;
  s: number;
  v: number;
  r: number;
  g: number;
  b: number;
  weight: number;
  isValid: boolean;
}

function classifyPixelsAdvanced(
  rawPixels: Uint8ClampedArray
): ClassifiedPixel[] {
  const pixels: ClassifiedPixel[] = [];

  for (let i = 0; i < rawPixels.length; i += 4) {
    const r = rawPixels[i];
    const g = rawPixels[i + 1];
    const b = rawPixels[i + 2];

    if (rawPixels[i + 3] < 128) continue;

    const { h, s, v } = rgbToHsv(r, g, b);
    const brightness = (r + g + b) / 3;

    const isBlack = v < 20;
    const isTransparent = s < 5 && v > 240 && brightness > 235;

    if (isBlack || isTransparent) continue;

    let weight = 1.0;

    if (brightness > 215 && s < 30) {
      weight = 1.5;
      if (r > g && r > b && r - g < 20 && r - b < 20) {
        weight = 1.8;
      }
    } else if (s > 30 && s < 200) {
      weight += 0.3;
    } else if (s >= 200 || brightness < 40) {
      weight *= 0.5;
    }

    if (brightness >= 80 && brightness <= 160) weight += 0.2;

    pixels.push({
      h,
      s,
      v,
      r,
      g,
      b,
      weight,
      isValid: true,
    });
  }

  return pixels;
}

function calculateWeightedAverage(pixels: ClassifiedPixel[]): { r: number; g: number; b: number; h: number; s: number; v: number } {
  if (pixels.length === 0) {
    return { r: 0, g: 0, b: 0, h: 0, s: 0, v: 0 };
  }

  let totalWeight = 0;
  let r = 0, g = 0, b = 0, h = 0, s = 0, v = 0;

  for (const p of pixels) {
    const w = p.weight;
    r += p.r * w;
    g += p.g * w;
    b += p.b * w;

    const hRad = (p.h / 180) * Math.PI * 2;
    h += Math.cos(hRad) * w;
    s += p.s * w;
    v += p.v * w;

    totalWeight += w;
  }

  const avgH = Math.atan2(h / totalWeight, Math.abs(h) / totalWeight) * 180 / Math.PI;
  const normalizedH = avgH < 0 ? avgH + 180 : avgH;

  return {
    r: Math.round(r / totalWeight),
    g: Math.round(g / totalWeight),
    b: Math.round(b / totalWeight),
    h: Math.round(normalizedH),
    s: Math.round(s / totalWeight),
    v: Math.round(v / totalWeight),
  };
}

function multiAlgorithmClassification(
  avgColor: { r: number; g: number; b: number; h: number; s: number; v: number },
  pixels: ClassifiedPixel[]
): { range: string; entry: CalibrationEntry; confidenceScore: number } {
  const hsvResults: { entry: CalibrationEntry; score: number }[] = [];
  const rgbResults: { entry: CalibrationEntry; score: number }[] = [];

  for (const entry of CALIBRATION_DATA) {
    if (!entry.hsv) continue;
    const score = calculateHSVScore(entry, pixels);
    hsvResults.push({ entry, score });
  }

  for (const entry of CALIBRATION_DATA) {
    const score = calculateRGBScore(avgColor, entry, pixels);
    rgbResults.push({ entry, score });
  }

  const fusedScores = new Map<CalibrationEntry, number>();

  for (const result of hsvResults) {
    fusedScores.set(result.entry, result.score * 0.7);
  }

  for (const result of rgbResults) {
    const current = fusedScores.get(result.entry) || 0;
    fusedScores.set(result.entry, current + result.score * 0.3);
  }

  let bestEntry = CALIBRATION_DATA[0];
  let bestScore = 0;

  for (const [entry, score] of fusedScores) {
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  return {
    range: bestEntry.range,
    entry: bestEntry,
    confidenceScore: bestScore,
  };
}

function calculateHSVScore(
  entry: CalibrationEntry,
  pixels: ClassifiedPixel[]
): number {
  if (!entry.hsv) return 0;

  const { lower, upper } = entry.hsv;
  let matchCount = 0;
  let totalWeight = 0;

  for (const p of pixels) {
    const hInRange = checkHueRange(p.h, lower[0], upper[0]);
    const sInRange = p.s >= lower[1] && p.s <= upper[1];
    const vInRange = p.v >= lower[2] && p.v <= upper[2];

    if (sInRange && vInRange) {
      totalWeight += p.weight;
      if (hInRange) matchCount += p.weight;
    }
  }

  if (totalWeight === 0) return 0;
  return (matchCount / totalWeight) * 100;
}

function calculateRGBScore(
  avgColor: { r: number; g: number; b: number },
  entry: CalibrationEntry,
  pixels: ClassifiedPixel[]
): number {
  const [er, eg, eb] = entry.rgb;
  const maxDist = Math.sqrt(255 * 255 * 3);
  const dist = Math.sqrt(
    Math.pow(avgColor.r - er, 2) +
    Math.pow(avgColor.g - eg, 2) +
    Math.pow(avgColor.b - eb, 2)
  );

  const similarity = Math.max(0, (1 - dist / maxDist) * 100);

  let matchCount = 0;
  let totalWeight = 0;
  const rgbThreshold = 50;

  for (const p of pixels) {
    const pDist = Math.sqrt(
      Math.pow(p.r - er, 2) +
      Math.pow(p.g - eg, 2) +
      Math.pow(p.b - eb, 2)
    );

    if (pDist < rgbThreshold) {
      matchCount += p.weight;
    }
    totalWeight += p.weight;
  }

  const pixelMatchScore = totalWeight > 0 ? (matchCount / totalWeight) * 100 : 0;

  return similarity * 0.4 + pixelMatchScore * 0.6;
}

function checkHueRange(h: number, lower: number, upper: number): boolean {
  const tolerance = 8;
  if (lower <= upper) {
    return h >= lower - tolerance && h <= upper + tolerance;
  } else {
    return h >= lower - tolerance || h <= upper + tolerance;
  }
}

function detectBleachingEdge(imageData: ImageData): { hasBleachingGradient: boolean; maxGradient: number; avgBrightness: number; isWhiteCore: boolean } {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  const centerY = Math.floor(height / 2);
  const quarterHeight = Math.floor(height * 0.15);
  const centerX = Math.floor(width / 2);

  const satValues: number[] = [];
  const brightValues: number[] = [];

  for (let offset = -quarterHeight; offset <= quarterHeight; offset += 3) {
    const y = Math.min(height - 1, Math.max(0, centerY + offset));
    const idx = (y * width + centerX) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : ((max - min) / max) * 100;
    const bright = (r + g + b) / 3;

    satValues.push(sat);
    brightValues.push(bright);
  }

  const avgSat = satValues.reduce((a, b) => a + b, 0) / satValues.length;
  const avgBrightness = brightValues.reduce((a, b) => a + b, 0) / brightValues.length;

  const topSat = satValues.slice(0, Math.floor(satValues.length / 3)).reduce((a, b) => a + b, 0) / Math.floor(satValues.length / 3);
  const bottomSat = satValues.slice(-Math.floor(satValues.length / 3)).reduce((a, b) => a + b, 0) / Math.floor(satValues.length / 3);
  const gradient = Math.abs(topSat - bottomSat);

  const isWhiteCore = avgBrightness > 200 && avgSat < 15;
  const hasBleachingGradient = gradient > 40 || (avgSat < 20 && avgBrightness > 190);

  return { hasBleachingGradient, maxGradient: gradient, avgBrightness, isWhiteCore };
}


function calculateProfessionalConfidence(
  colorData: { h: number; s: number; v: number; r: number; g: number; b: number },
  classification: { range: string; entry: CalibrationEntry; confidenceScore: number },
  isCriticalBleached: boolean
): number {
  let confidence = 60;

  confidence += classification.confidenceScore * 0.3;

  if (classification.entry.hsv) {
    const { lower, upper } = classification.entry.hsv;
    const hInRange = checkHueRange(colorData.h, lower[0], upper[0]);
    const sInRange = colorData.s >= lower[1] && colorData.s <= upper[1];
    const vInRange = colorData.v >= lower[2] && colorData.v <= upper[2];

    if (hInRange) confidence += 8;
    if (sInRange) confidence += 6;
    if (vInRange) confidence += 6;
  }

  if (isCriticalBleached && classification.entry.isBleached) {
    confidence += 10;
  }

  const rgbBalance = Math.abs(colorData.r - colorData.g);
  if (rgbBalance < 80) {
    confidence += 3;
  }

  if (colorData.b > colorData.r && colorData.b > colorData.g) {
    confidence += 2;
  }

  return Math.min(99.9, Math.max(50, confidence));
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;

  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const v = max * 255;
  const delta = max - min;

  let h = 0;
  if (delta > 0.0001) {
    if (max === rf) {
      h = ((gf - bf) / delta) % 6;
    } else if (max === gf) {
      h = (bf - rf) / delta + 2;
    } else {
      h = (rf - gf) / delta + 4;
    }
    h = Math.round(h * 30);
    if (h < 0) h += 180;
  }

  const s = max === 0 ? 0 : Math.round((delta / max) * 255);

  return { h, s, v: Math.round(v) };
}

function getStatusFromPpm(ppm: number): { status: string; riskLevel: string; colorName: string } {
  if (ppm < 100) {
    return { status: 'Excellent', riskLevel: 'Low', colorName: 'Bleu Cyan / Teal' };
  } else if (ppm <= 200) {
    return { status: 'Safe', riskLevel: 'Low', colorName: 'Medium Purple / Violet Transition' };
  } else if (ppm <= 250) {
    return { status: 'Safe', riskLevel: 'Low', colorName: 'Bleu Ardoise / Lavender' };
  } else if (ppm <= 400) {
    return { status: 'Attention', riskLevel: 'Moderate', colorName: 'Vrai Violet / Mauve' };
  } else if (ppm <= 550) {
    return { status: 'High Contamination', riskLevel: 'High', colorName: 'Magenta/Orchid Violet' };
  } else if (ppm <= 750) {
    return { status: 'Critical', riskLevel: 'Critical', colorName: 'Stable Light Pink' };
  } else {
    return { status: 'Critical', riskLevel: 'Critical', colorName: 'Blanc Ivoire / Décoloré' };
  }
}

export function generateColorHistogram(
  _canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  stripRegion: { x: number; y: number; width: number; height: number }
): string {
  const histCanvas = document.createElement('canvas');
  const histCtx = histCanvas.getContext('2d')!;
  histCanvas.width = 300;
  histCanvas.height = 150;

  // Extract central region pixels
  const centralHeight = Math.floor(stripRegion.height * 0.7);
  const yStart = stripRegion.y + Math.floor(stripRegion.height * 0.15);
  const centralRegion = {
    x: stripRegion.x,
    y: yStart,
    width: stripRegion.width,
    height: centralHeight,
  };

  const imageData = ctx.getImageData(centralRegion.x, centralRegion.y, centralRegion.width, centralRegion.height);
  const data = imageData.data;

  // Initialize histograms
  const rHist = new Array(256).fill(0);
  const gHist = new Array(256).fill(0);
  const bHist = new Array(256).fill(0);

  // Count pixel values (skip transparent and very dark/bright)
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    if (brightness < 20 || brightness > 240) continue;

    rHist[r]++;
    gHist[g]++;
    bHist[b]++;
  }

  // Find max value for normalization
  const maxVal = Math.max(...rHist, ...gHist, ...bHist);

  // Draw background
  histCtx.fillStyle = '#0f172a';
  histCtx.fillRect(0, 0, histCanvas.width, histCanvas.height);

  // Draw histograms
  const colors = [
    { hist: rHist, color: 'rgba(239, 68, 68, 0.6)', fill: 'rgba(239, 68, 68, 0.15)' },
    { hist: gHist, color: 'rgba(34, 197, 94, 0.6)', fill: 'rgba(34, 197, 94, 0.15)' },
    { hist: bHist, color: 'rgba(59, 130, 246, 0.6)', fill: 'rgba(59, 130, 246, 0.15)' },
  ];

  const barWidth = histCanvas.width / 256;

  for (const { hist, color, fill } of colors) {
    histCtx.fillStyle = fill;
    histCtx.strokeStyle = color;
    histCtx.lineWidth = 1.5;

    histCtx.beginPath();
    histCtx.moveTo(0, histCanvas.height);

    for (let i = 0; i < 256; i++) {
      const height = (hist[i] / maxVal) * histCanvas.height * 0.9;
      histCtx.lineTo(i * barWidth, histCanvas.height - height);
    }

    histCtx.lineTo(histCanvas.width, histCanvas.height);
    histCtx.closePath();
    histCtx.fill();
    histCtx.stroke();
  }

  // Add labels
  histCtx.fillStyle = '#94a3b8';
  histCtx.font = '10px Inter, sans-serif';
  histCtx.textAlign = 'center';
  histCtx.fillText('0', 5, histCanvas.height - 5);
  histCtx.fillText('128', histCanvas.width / 2, histCanvas.height - 5);
  histCtx.fillText('255', histCanvas.width - 5, histCanvas.height - 5);
  histCtx.fillText('RGB Color Distribution', histCanvas.width / 2, 12);

  return histCanvas.toDataURL('image/png');
}

export function generateEdgeDetection(
  _canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  stripRegion: { x: number; y: number; width: number; height: number }
): string {
  const edgeCanvas = document.createElement('canvas');
  const edgeCtx = edgeCanvas.getContext('2d')!;
  edgeCanvas.width = stripRegion.width;
  edgeCanvas.height = stripRegion.height;

  // Extract strip region
  const imageData = ctx.getImageData(
    stripRegion.x,
    stripRegion.y,
    stripRegion.width,
    stripRegion.height
  );
  const data = imageData.data;
  const w = stripRegion.width;
  const h = stripRegion.height;

  // Convert to grayscale and apply Sobel edge detection
  const gray = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      gray[y * w + x] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }
  }

  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  const edgeData = edgeCtx.createImageData(w, h);
  const edgePixels = edgeData.data;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let gx = 0, gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * w + (x + kx);
          const kidx = (ky + 1) * 3 + (kx + 1);
          gx += gray[idx] * sobelX[kidx];
          gy += gray[idx] * sobelY[kidx];
        }
      }

      const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      const pixelIdx = (y * w + x) * 4;

      // Color edges based on intensity
      const intensity = magnitude / 255;
      edgePixels[pixelIdx] = Math.floor(59 + intensity * 180);     // R
      edgePixels[pixelIdx + 1] = Math.floor(130 - intensity * 80); // G
      edgePixels[pixelIdx + 2] = Math.floor(246 - intensity * 180); // B
      edgePixels[pixelIdx + 3] = Math.floor(200 + intensity * 55); // A
    }
  }

  edgeCtx.putImageData(edgeData, 0, 0);

  // Add label
  edgeCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  edgeCtx.fillRect(5, 5, 100, 20);
  edgeCtx.fillStyle = '#60a5fa';
  edgeCtx.font = 'bold 11px Inter, sans-serif';
  edgeCtx.fillText('Edge Detection', 10, 18);

  return edgeCanvas.toDataURL('image/png');
}

export function generateHSVChannels(
  _canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  stripRegion: { x: number; y: number; width: number; height: number }
): { h: string; s: string; v: string } {
  const size = 200;

  // Extract region
  const centralHeight = Math.floor(stripRegion.height * 0.7);
  const yStart = stripRegion.y + Math.floor(stripRegion.height * 0.15);
  const imageData = ctx.getImageData(stripRegion.x, yStart, stripRegion.width, centralHeight);
  const data = imageData.data;

  // Extract each channel
  const channels: { h: Uint8ClampedArray; s: Uint8ClampedArray; v: Uint8ClampedArray } = {
    h: new Uint8ClampedArray(stripRegion.width * centralHeight),
    s: new Uint8ClampedArray(stripRegion.width * centralHeight),
    v: new Uint8ClampedArray(stripRegion.width * centralHeight),
  };

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    // H
    let h = 0;
    if (delta > 0) {
      if (max === r) h = ((g - b) / delta) % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
      h = Math.round(h * 30);
      if (h < 0) h += 180;
    }

    // S (0-255)
    const s = max === 0 ? 0 : Math.round((delta / max) * 255);
    // V
    const v = max;

    const idx = i / 4;
    channels.h[idx] = h;
    channels.s[idx] = s;
    channels.v[idx] = v;
  }

  const createChannelCanvas = (channelData: Uint8ClampedArray, label: string, colorMap: (v: number) => [number, number, number]): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = size;
    canvas.height = size;

    const imgData = ctx.createImageData(size, size);
    const pixels = imgData.data;

    // Resize to fit canvas
    const scaleX = stripRegion.width / size;
    const scaleY = centralHeight / size;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);
        const srcIdx = srcY * stripRegion.width + srcX;
        const val = channelData[srcIdx];

        const [r, g, b] = colorMap(val);
        const dstIdx = (y * size + x) * 4;
        pixels[dstIdx] = r;
        pixels[dstIdx + 1] = g;
        pixels[dstIdx + 2] = b;
        pixels[dstIdx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Label
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(5, 5, 70, 20);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(label, 10, 18);

    return canvas.toDataURL('image/png');
  };

  const hChannel = createChannelCanvas(channels.h, 'Hue (H)', (v: number): [number, number, number] => {
    const hueNorm = v / 180;
    const r = Math.floor(255 * (1 - Math.abs(hueNorm * 2 - 1)));
    const g = Math.floor(255 * (1 - Math.abs((hueNorm - 0.33) * 3)));
    const b = Math.floor(255 * (1 - Math.abs((hueNorm - 0.67) * 3)));
    return [Math.min(255, r + 100), Math.min(255, g + 100), Math.min(255, b + 100)];
  });

  const sChannel = createChannelCanvas(channels.s, 'Saturation (S)', (v: number): [number, number, number] => {
    const intensity = Math.floor((v / 255) * 255);
    return [intensity, Math.floor(intensity / 2), 255 - intensity];
  });

  const vChannel = createChannelCanvas(channels.v, 'Value (V)', (v: number): [number, number, number] => {
    return [v, v, v];
  });

  return { h: hChannel, s: sChannel, v: vChannel };
}

export function generatePixelClassificationMap(
  _canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  stripRegion: { x: number; y: number; width: number; height: number }
): string {
  const classCanvas = document.createElement('canvas');
  const classCtx = classCanvas.getContext('2d')!;
  classCanvas.width = stripRegion.width;
  classCanvas.height = stripRegion.height;

  // Extract central region
  const centralHeight = Math.floor(stripRegion.height * 0.7);
  const yStart = stripRegion.y + Math.floor(stripRegion.height * 0.15);
  const imageData = ctx.getImageData(stripRegion.x, yStart, stripRegion.width, centralHeight);
  const data = imageData.data;

  const resultData = classCtx.createImageData(stripRegion.width, centralHeight);
  const resultPixels = resultData.data;

  // Color scheme for classification
  const classColors: { [key: string]: [number, number, number] } = {
    valid: [34, 197, 94],      // Green - valid pixels
    highlight: [251, 191, 36], // Yellow - bright highlights
    lowSat: [148, 163, 184],   // Gray - low saturation
    dark: [30, 30, 30],        // Near black - dark pixels
    transparent: [0, 0, 0],    // Black - transparent
  };

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const brightness = (r + g + b) / 3;
    const sat = max === 0 ? 0 : ((max - min) / max) * 100;

    let color: [number, number, number];

    if (alpha < 128) {
      color = classColors.transparent;
    } else if (brightness < 20) {
      color = classColors.dark;
    } else if (brightness > 235 && sat < 5) {
      color = classColors.transparent;
    } else if (brightness > 215 && sat < 30) {
      color = classColors.highlight;
    } else if (sat < 5) {
      color = classColors.lowSat;
    } else {
      color = classColors.valid;
    }

    const idx = i;
    resultPixels[idx] = color[0];
    resultPixels[idx + 1] = color[1];
    resultPixels[idx + 2] = color[2];
    resultPixels[idx + 3] = alpha > 128 ? 220 : 0;
  }

  classCtx.putImageData(resultData, 0, 0);

  // Add legend
  const legendY = 10;
  classCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  classCtx.fillRect(5, 5, 130, 110);

  const legendItems = [
    { color: classColors.valid, label: 'Valid Pixels' },
    { color: classColors.highlight, label: 'Highlights' },
    { color: classColors.lowSat, label: 'Low Saturation' },
    { color: classColors.dark, label: 'Dark Pixels' },
  ];

  classCtx.font = '10px Inter, sans-serif';
  legendItems.forEach((item, idx) => {
    const y = legendY + idx * 24;
    classCtx.fillStyle = `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`;
    classCtx.fillRect(10, y, 16, 16);
    classCtx.fillStyle = '#fff';
    classCtx.fillText(item.label, 32, y + 12);
  });

  return classCanvas.toDataURL('image/png');
}

export function drawAnalysisOverlay(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  stripRegion?: { x: number; y: number; width: number; height: number }
): void {
  const region = stripRegion || detectStripRegion(canvas, ctx);
  const { x: centerX, y: centerY, width: sampleWidth, height: sampleHeight } = region;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, canvas.width, centerY);
  ctx.fillRect(0, centerY + sampleHeight, canvas.width, canvas.height - centerY - sampleHeight);
  ctx.fillRect(0, centerY, centerX, sampleHeight);
  ctx.fillRect(centerX + sampleWidth, centerY, canvas.width - centerX - sampleWidth, sampleHeight);

  ctx.strokeStyle = 'rgba(33, 150, 243, 0.9)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(centerX - 2, centerY - 2, sampleWidth + 4, sampleHeight + 4);
  ctx.setLineDash([]);

  const bracketSize = Math.min(20, sampleWidth * 0.1, sampleHeight * 0.15);
  ctx.strokeStyle = '#42a5f5';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY + bracketSize);
  ctx.lineTo(centerX, centerY);
  ctx.lineTo(centerX + bracketSize, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX + sampleWidth - bracketSize, centerY);
  ctx.lineTo(centerX + sampleWidth, centerY);
  ctx.lineTo(centerX + sampleWidth, centerY + bracketSize);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY + sampleHeight - bracketSize);
  ctx.lineTo(centerX, centerY + sampleHeight);
  ctx.lineTo(centerX + bracketSize, centerY + sampleHeight);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX + sampleWidth - bracketSize, centerY + sampleHeight);
  ctx.lineTo(centerX + sampleWidth, centerY + sampleHeight);
  ctx.lineTo(centerX + sampleWidth, centerY + sampleHeight - bracketSize);
  ctx.stroke();

  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillStyle = '#42a5f5';
  ctx.textAlign = 'center';
  ctx.fillText('ANALYZED REGION', centerX + sampleWidth / 2, centerY - 10);
}