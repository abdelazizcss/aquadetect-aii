import { motion } from 'framer-motion';
import { Pipette, Copy } from 'lucide-react';
import { rgbToCielab } from '../utils/colorScience';
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

  const { rgb, hex, deltaE } = result;
  const lab = rgbToCielab(rgb[0], rgb[1], rgb[2]);

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
        {/* Color Preview */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
        >
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
        </motion.div>

        {/* RGB Values */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">RGB Values</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'R', value: rgb[0], color: '#ef4444' },
              { label: 'G', value: rgb[1], color: '#22c55e' },
              { label: 'B', value: rgb[2], color: '#3b82f6' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className="text-xs font-medium mb-1" style={{ color }}>{label}</p>
                <p className="text-xl font-bold font-mono text-white">{value}</p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / 255) * 100}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HEX Value */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">HEX</p>
          <div className="flex items-center gap-3">
            <p className="text-xl font-bold font-mono text-white">{hex.toUpperCase()}</p>
            <button
              onClick={() => copyToClipboard(hex)}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* CIELAB */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">CIELAB</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'L*', value: lab.L },
              { label: 'a*', value: lab.a },
              { label: 'b*', value: lab.b },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-2 rounded-lg bg-slate-900/50">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-bold font-mono text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Delta-E */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Delta-E</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold font-mono text-white">{deltaE.toFixed(2)}</p>
            <div className="text-right">
              <p className="text-xs text-slate-500">
                {deltaE < 1 ? 'Imperceptible' :
                 deltaE < 2 ? 'Perceptible' :
                 deltaE < 10 ? 'Noticeable' :
                 'Different'}
              </p>
              <p className="text-[10px] text-slate-600">CIE76 Standard</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}