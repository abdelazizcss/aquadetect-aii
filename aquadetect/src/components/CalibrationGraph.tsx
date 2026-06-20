import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { CALIBRATION_DATA } from '../utils/calibrationData';
import type { AnalysisResult } from '../types';

interface CalibrationGraphProps {
  result: AnalysisResult | null;
}

export default function CalibrationGraph({ result }: CalibrationGraphProps) {
  const chartData = CALIBRATION_DATA.map((entry) => ({
    ppm: entry.ppmCenter,
    name: entry.name,
    hex: entry.hex,
    status: entry.status,
    range: entry.range,
  }));

  const samplePoint = result ? [{
    ppm: result.waterContent,
    hex: result.hex,
    name: result.detectedColor,
  }] : [];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; ppm: number; hex: string; range: string; status: string } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-3 text-sm border border-slate-700">
          <p className="font-semibold text-white">{data.name}</p>
          <p className="text-slate-400 font-mono text-xs">{data.ppm} ppm</p>
          <p className="text-slate-500 text-xs">{data.range}</p>
          <p className="text-xs mt-1" style={{ color: data.hex }}>{data.status}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card p-4 sm:p-6"
    >
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-yellow-400" />
        Calibration Graph
      </h2>

      <div className="h-[300px] sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(51, 65, 85, 0.5)"
              vertical={false}
            />
            <XAxis
              type="number"
              dataKey="ppm"
              name="Water Concentration"
              unit=" ppm"
              domain={[0, 1000]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              label={{
                value: 'Water Concentration (ppm)',
                position: 'insideBottom',
                offset: -10,
                style: { fill: '#64748b', fontSize: 11 },
              }}
            />
            <YAxis
              type="number"
              dataKey="ppm"
              name="Color Response"
              domain={[0, 1000]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              label={{
                value: 'Color Response',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                style: { fill: '#64748b', fontSize: 11 },
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Reference lines for ranges */}
            <ReferenceLine x={50} stroke="#00339940" strokeDasharray="5 5" />
            <ReferenceLine x={150} stroke="#4A90E240" strokeDasharray="5 5" />
            <ReferenceLine x={450} stroke="#7B1FA240" strokeDasharray="5 5" />
            <ReferenceLine x={750} stroke="#C2185B40" strokeDasharray="5 5" />

            {/* Calibration points */}
            <Scatter name="Calibration" data={chartData} fillOpacity={1}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.hex}
                  stroke={entry.hex}
                  strokeWidth={2}
                />
              ))}
            </Scatter>

            {/* Sample point */}
            {samplePoint.length > 0 && (
              <Scatter name="Sample" data={samplePoint}>
                {samplePoint.map((entry, index) => (
                  <Cell
                    key={`sample-${index}`}
                    fill="#ffffff"
                    stroke={entry.hex}
                    strokeWidth={3}
                  />
                ))}
              </Scatter>
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {CALIBRATION_DATA.map((entry) => (
          <div key={entry.range} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.hex }}
            />
            <span className="text-[10px] text-slate-500">{entry.range}</span>
          </div>
        ))}
        {result && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white border-2" style={{ borderColor: result.hex }} />
            <span className="text-[10px] text-slate-400 font-medium">Sample</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}