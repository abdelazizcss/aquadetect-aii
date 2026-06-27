import { motion } from 'framer-motion';
import { Pipette, Copy } from 'lucide-react';
import type { AnalysisResult } from '../types';

interface AdvancedColorAnalysisProps {
  result: AnalysisResult | null;
}

export default function AdvancedColorAnalysis({ result }: AdvancedColorAnalysisProps) {
  if (!result) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Pipette className="w-5 h-5 text-purple-400" />
          Advanced Color Analysis
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-slate-500 text-sm">Color data will appear after analysis</p>
        </div>
      </motion.div>
    );
  }

  const { hex } = result;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-4 sm:p-6"
    >
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Pipette className="w-5 h-5 text-purple-400" />
        Advanced Color Analysis
      </h2>

      <div className="space-y-4">
        {/* Color Preview & HEX */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl border-2 border-white/20 shadow-lg"
              style={{
                backgroundColor: hex,
                boxShadow: `0 0 30px ${hex}40`,
              }}
            />
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Detected Color</p>
              <p className="text-lg font-bold font-mono text-white">{hex.toUpperCase()}</p>
              <button
                onClick={() => copyToClipboard(hex)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
              >
                <Copy className="w-3 h-3" /> Copy HEX
              </button>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}