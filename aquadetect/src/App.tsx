import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import GaugeChart from './components/GaugeChart';
import ImageUploader from './components/ImageUploader';
import ResultDashboard from './components/ResultDashboard';
import AdvancedColorAnalysis from './components/AdvancedColorAnalysis';
import CalibrationTable from './components/CalibrationTable';
import CalibrationGraph from './components/CalibrationGraph';
import PDFReport from './components/PDFReport';
import { getStatusColor } from './utils/calibrationData';
import type { AnalysisResult, ImageAnalysisState } from './types';

export default function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const handleAnalysisComplete = useCallback((newResult: AnalysisResult, _newImages: ImageAnalysisState) => {
    setResult(newResult);
  }, []);
  const handleAnalysisStart = useCallback(() => {
    setResult(null);
  }, []);

  const statusColor = result ? getStatusColor(result.status) : '#94a3b8';

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(148, 163, 184, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {/* Top Row: Gauge + Image Uploader */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Gauge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <GaugeChart
                value={result?.waterContent ?? 0}
                maxValue={1000}
                label="Water Content"
                status={result?.status ?? 'Waiting'}
                color={statusColor}
                unit="ppm"
                range={result?.range}
              />
            </motion.div>

            {/* Image Uploader */}
            <ImageUploader onAnalysisComplete={handleAnalysisComplete} onAnalysisStart={handleAnalysisStart} />
          </div>

          {/* Result Dashboard */}
          <ResultDashboard result={result} />

          {/* Color Analysis + PDF Report */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-1">
              <AdvancedColorAnalysis result={result} />
            </div>
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <CalibrationGraph result={result} />
              <PDFReport result={result} />
            </div>
          </div>

          {/* Calibration Table */}
          <CalibrationTable result={result} />

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="glass-card p-4 text-center"
          >
            <p className="text-xs text-slate-600">
              AquaDetect™ — Fuel Water Content Analyzer • ISO 6296 Calibration Standard
            </p>
            <p className="text-[10px] text-slate-700 mt-1">
              Advanced Colorimetric Analysis System • HSV Primary Classification • RGB Fusion • CIELAB Delta-E Precision
            </p>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}