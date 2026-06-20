import { motion } from 'framer-motion';
import { Table2 } from 'lucide-react';
import { CALIBRATION_DATA } from '../utils/calibrationData';
import type { AnalysisResult } from '../types';

interface CalibrationTableProps {
  result: AnalysisResult | null;
}

export default function CalibrationTable({ result }: CalibrationTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-4 sm:p-6"
    >
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Table2 className="w-5 h-5 text-green-400" />
        Calibration Table
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Water Content
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Observed Color
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                HEX
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                RGB
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {CALIBRATION_DATA.map((entry, index) => {
              const isMatch = result?.matchedEntry.range === entry.range;
              return (
                <motion.tr
                  key={entry.range}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`border-b border-slate-800/50 transition-all duration-300 ${
                    isMatch
                      ? 'bg-slate-800/80'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  <td className="py-3 px-3">
                    <span className="font-mono text-xs sm:text-sm text-white font-medium">
                      {entry.range}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
                        style={{
                          backgroundColor: entry.hex,
                          boxShadow: isMatch ? `0 0 12px ${entry.hex}60` : 'none',
                        }}
                      />
                      <span className="text-xs sm:text-sm text-slate-300 whitespace-nowrap">
                        {entry.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell">
                    <span className="font-mono text-xs text-slate-400">{entry.hex}</span>
                  </td>
                  <td className="py-3 px-3 hidden md:table-cell">
                    <span className="font-mono text-xs text-slate-400">
                      {entry.rgb.join(', ')}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold"
                      style={{
                        backgroundColor: entry.hex + '20',
                        color: entry.hex,
                        border: `1px solid ${entry.hex}40`,
                      }}
                    >
                      {entry.status}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile HEX/RGB display */}
      <div className="sm:hidden mt-4 space-y-2">
        {CALIBRATION_DATA.map((entry) => (
          <div key={entry.range} className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>{entry.range}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{entry.hex}</span>
              <span className="font-mono">{entry.rgb.join(',')}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}