import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, Palette, Gauge } from 'lucide-react';
import { getStatusColor, getStatusBgColor } from '../utils/calibrationData';
import type { AnalysisResult } from '../types';

interface ResultDashboardProps {
  result: AnalysisResult | null;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="glass-card p-4 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-20 h-20 opacity-5" style={{ color }}>
      <Icon className="w-20 h-20" />
    </div>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-xl sm:text-2xl font-bold" style={{ color }}>
          {value}
        </p>
      </div>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: color + '20' }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
    </div>
  </motion.div>
);

export default function ResultDashboard({ result }: ResultDashboardProps) {
  if (!result) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-blue-400" />
          Result Dashboard
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <Info className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-500 text-sm">Upload a fuel test strip image to begin analysis</p>
        </div>
      </motion.div>
    );
  }

  const statusColor = getStatusColor(result.status);
  const statusBg = getStatusBgColor(result.status);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-4 sm:p-6"
      id="result-dashboard"
    >
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Gauge className="w-5 h-5 text-blue-400" />
        Result Dashboard
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Water Content */}
        <StatCard
          label="Water Content"
          value={result.range || `${result.waterContent} ppm`}
          icon={AlertTriangle}
          color={statusColor}
          delay={0}
        />

        {/* Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="glass-card p-4 relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{ background: `linear-gradient(135deg, ${statusColor}, transparent)` }}
          />
          <div className="relative">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold"
              style={{ backgroundColor: statusBg, color: statusColor, border: `1px solid ${statusColor}40` }}
            >
              {result.status === 'Safe' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {result.status.toUpperCase()}
            </div>
          </div>
        </motion.div>

        {/* Detected Color */}
        <StatCard
          label="Detected Color"
          value={result.detectedColor}
          icon={Palette}
          color={statusColor}
          delay={0.2}
        />

      </div>
    </motion.div>
  );
}