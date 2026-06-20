import { CALIBRATION_DATA } from './calibrationData';
import { rgbToCielab, deltaE76, calculateConfidence, getAverageColor } from './colorScience';
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

  for (const entry of CALIBRATION_DATA) {
    const entryLab = rgbToCielab(...entry.rgb);
    const dE = deltaE76(cielab, entryLab);
    if (dE < bestDeltaE) {
      bestDeltaE = dE;
      bestMatch = entry;
    }
  }

  // Estimate PPM based on color interpolation
  const estimatedPpm = interpolatePpm(r, g, b);

  // Calculate confidence
  const confidence = calculateConfidence(bestDeltaE);

  // Determine risk level
  const riskLevel = getRiskLevel(bestMatch.status);

  return {
    waterContent: Math.round(estimatedPpm),
    status: bestMatch.status,
    detectedColor: bestMatch.name,
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
 * Interpolate PPM value based on RGB color
 */
function interpolatePpm(r: number, g: number, b: number): number {
  const lab = rgbToCielab(r, g, b);

  // Weighted interpolation based on CIELAB distance to each calibration point
  let weightedSum = 0;
  let totalWeight = 0;

  for (const entry of CALIBRATION_DATA) {
    const entryLab = rgbToCielab(...entry.rgb);
    const dE = deltaE76(lab, entryLab);
    const weight = 1 / (dE + 1); // Inverse distance weighting
    weightedSum += entry.ppmCenter * weight;
    totalWeight += weight;
  }

  const estimatedPpm = weightedSum / totalWeight;

  // Clamp to reasonable range
  return Math.max(0, Math.min(1000, estimatedPpm));
}

/**
 * Determine risk level from status
 */
function getRiskLevel(status: string): string {
  switch (status) {
    case 'Excellent': return 'Very Low';
    case 'Safe': return 'Low';
    case 'Attention': return 'Moderate';
    case 'High Contamination': return 'High';
    case 'Critical': return 'Critical';
    default: return 'Unknown';
  }
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