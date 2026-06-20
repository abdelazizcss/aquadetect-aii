export interface CalibrationEntry {
  range: string;
  name: string;
  hex: string;
  rgb: [number, number, number];
  status: string;
  description: string;
  ppmCenter: number;
}

export interface AnalysisResult {
  waterContent: number;
  status: string;
  detectedColor: string;
  confidence: number;
  riskLevel: string;
  rgb: [number, number, number];
  hex: string;
  deltaE: number;
  cielab: { L: number; a: number; b: number };
  matchedEntry: CalibrationEntry;
}

export interface ImageAnalysisState {
  originalImage: string | null;
  detectedStrip: string | null;
  analyzedArea: string | null;
  zoomedRegion: string | null;
  isAnalyzing: boolean;
  analysisComplete: boolean;
  result: AnalysisResult | null;
}