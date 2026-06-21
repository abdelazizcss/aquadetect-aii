import { CALIBRATION_DATA } from './calibrationData';
import { rgbToCielab, deltaE2000, calculateConfidence, getAverageColor } from './colorScience';
import type { AnalysisResult, CalibrationEntry } from '../types';

/**
 * Analyze an image to detect fuel test strip color and determine water content
 */
export function analyzeImage(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  _imageWidth: number,
  _imageHeight: number
): AnalysisResult {
  // Get image data from the canvas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  void imageData; // Used for full image context

  // Get the dominant color from the center region (test strip area)
  const centerX = Math.floor(canvas.width * 0.3);
  const centerY = Math.floor(canvas.height * 0.2);
  const sampleWidth = Math.floor(canvas.width * 0.4);
  const sampleHeight = Math.floor(canvas.height * 0.6);

  const stripData = ctx.getImageData(centerX, centerY, sampleWidth, sampleHeight);
  const avgColor = getAverageColor(stripData);

  // Use the strip color (likely more accurate for the test strip)
  const [r, g, b] = avgColor;

  // Convert to CIELAB
  const cielab = rgbToCielab(r, g, b);

  // Find the closest calibration entry
  let bestMatch: CalibrationEntry = CALIBRATION_DATA[0];
  let bestDeltaE = Infinity;

  // Use deltaE2000 for more accurate color matching
  for (const entry of CALIBRATION_DATA) {
    const entryLab = rgbToCielab(...entry.rgb);
    const dE = deltaE2000(cielab, entryLab);
    if (dE < bestDeltaE) {
      bestDeltaE = dE;
      bestMatch = entry;
    }
  }

  // Use PPM center from best match with interpolation between closest two points
  const estimatedPpm = interpolatePpmFromMatch(cielab, bestMatch, bestDeltaE);

  // Calculate confidence
  const confidence = calculateConfidence(bestDeltaE);

  // Determine status and risk level based on actual PPM value
  const { status, riskLevel, colorName } = getStatusFromPpm(estimatedPpm);

  return {
    waterContent: Math.round(estimatedPpm),
    status,
    detectedColor: colorName,
    confidence: Math.min(confidence, 99.9),
    riskLevel,
    rgb: [r, g, b],
    hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
    deltaE: bestDeltaE,
    cielab,
    matchedEntry: bestMatch,
  };
}

/**
 * Get status and risk level from PPM value
 */
function getStatusFromPpm(ppm: number): { status: string; riskLevel: string; colorName: string } {
  if (ppm <= 150) {
    return { status: 'Safe', riskLevel: 'Low', colorName: 'Bleu Cyan Clair' };
  } else if (ppm <= 450) {
    return { status: 'Attention', riskLevel: 'Moderate', colorName: 'Indigo / Violet Franc' };
  } else if (ppm <= 750) {
    return { status: 'High Contamination', riskLevel: 'High', colorName: 'Pourpre / Rose-Violet' };
  } else {
    return { status: 'Critical', riskLevel: 'Critical', colorName: 'Rose Vif / Fuchsia Total' };
  }
}

/**
 * Interpolate PPM based on best match and neighboring points
 */
function interpolatePpmFromMatch(
  lab: { L: number; a: number; b: number },
  bestMatch: CalibrationEntry,
  bestDeltaE: number
): number {
  // Find the second closest entry for interpolation
  let secondBest: CalibrationEntry | null = null;
  let secondBestDeltaE = Infinity;

  for (const entry of CALIBRATION_DATA) {
    if (entry === bestMatch) continue;
    const entryLab = rgbToCielab(...entry.rgb);
    const dE = deltaE2000(lab, entryLab);
    if (dE < secondBestDeltaE) {
      secondBestDeltaE = dE;
      secondBest = entry;
    }
  }

  // If best match is very close (deltaE < 5), use its ppmCenter directly
  if (bestDeltaE < 5 || !secondBest) {
    return bestMatch.ppmCenter;
  }

  // Otherwise interpolate between the two closest points
  const totalDeltaE = bestDeltaE + secondBestDeltaE;
  const weight = 1 - (bestDeltaE / totalDeltaE);

  const estimatedPpm = bestMatch.ppmCenter * weight + secondBest.ppmCenter * (1 - weight);

  // Clamp to reasonable range
  return Math.max(0, Math.min(1000, estimatedPpm));
}

/**
 * Draw analysis overlay on canvas
 */
export function drawAnalysisOverlay(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): void {
  const centerX = Math.floor(canvas.width * 0.3);
  const centerY = Math.floor(canvas.height * 0.2);
  const sampleWidth = Math.floor(canvas.width * 0.4);
  const sampleHeight = Math.floor(canvas.height * 0.6);

  // Draw overlay border
  ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(centerX - 2, centerY - 2, sampleWidth + 4, sampleHeight + 4);
  ctx.setLineDash([]);

  // Draw corner brackets
  const bracketSize = 20;
  ctx.strokeStyle = '#42a5f5';
  ctx.lineWidth = 3;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + bracketSize);
  ctx.lineTo(centerX, centerY);
  ctx.lineTo(centerX + bracketSize, centerY);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(centerX + sampleWidth - bracketSize, centerY);
  ctx.lineTo(centerX + sampleWidth, centerY);
  ctx.lineTo(centerX + sampleWidth, centerY + bracketSize);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + sampleHeight - bracketSize);
  ctx.lineTo(centerX, centerY + sampleHeight);
  ctx.lineTo(centerX + bracketSize, centerY + sampleHeight);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(centerX + sampleWidth - bracketSize, centerY + sampleHeight);
  ctx.lineTo(centerX + sampleWidth, centerY + sampleHeight);
  ctx.lineTo(centerX + sampleWidth, centerY + sampleHeight - bracketSize);
  ctx.stroke();

  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(0, 0, canvas.width, centerY);
  ctx.fillRect(0, 0, centerX, canvas.height);
  ctx.fillRect(centerX + sampleWidth, 0, canvas.width - centerX - sampleWidth, canvas.height);
  ctx.fillRect(0, centerY + sampleHeight, canvas.width, canvas.height - centerY - sampleHeight);

  // Label
  ctx.font = '14px Inter, sans-serif';
  ctx.fillStyle = '#42a5f5';
  ctx.textAlign = 'center';
  ctx.fillText('ANALYZED REGION', centerX + sampleWidth / 2, centerY - 10);
}