export interface ExtendedColor {
  rgb: [number, number, number];
  hex: string;
  hsvStd?: string;
  hsvCv: [number, number, number];
  description?: string;
}

export interface CalibrationEntry {
  range: string;
  name: string;
  hex: string;
  rgb: [number, number, number];
  status: string;
  description: string;
  ppmCenter: number;
  hsv?: {
    lower: [number, number, number];
    upper: [number, number, number];
  };
  isBleached?: boolean;
  extendedColors?: {
    [key: string]: ExtendedColor;
  };
}

export interface AnalysisResult {
  waterContent: number;
  range: string;
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

export interface ImageUploaderProps {
  onAnalysisComplete: (result: AnalysisResult, images: ImageAnalysisState) => void;
  onAnalysisStart?: () => void;
}