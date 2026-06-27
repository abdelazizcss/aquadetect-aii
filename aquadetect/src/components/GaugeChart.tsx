import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface GaugeChartProps {
  value: number;
  maxValue: number;
  label: string;
  status: string;
  color: string;
  unit: string;
  range?: string;
}

export default function GaugeChart({ value, maxValue, label, status, color, unit, range }: GaugeChartProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatedValue = useSpring(0, { stiffness: 40, damping: 15 });
  const displayValue = useTransform(animatedValue, (v) => Math.round((v / 100) * maxValue));

  const percentage = Math.min((value / maxValue) * 100, 100);

  useEffect(() => {
    const timeout = setTimeout(() => {
      animatedValue.set(percentage);
      setIsAnimating(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [percentage, animatedValue, maxValue]);

  // Draw gauge on canvas for crisp rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 280;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2 + 20;
    const radius = 110;
    const lineWidth = 12;

    const startAngle = Math.PI * 0.8;
    const endAngle = Math.PI * 2.2;
    const totalAngle = endAngle - startAngle;

    let currentPercentage = 0;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Background arc
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Colored segments on background (0-150 Safe, 150-450 Attention, 450-750 High, >750 Critical)
      const segments = [
        { start: 0, end: 0.15, color: '#4A90E2' },
        { start: 0.15, end: 0.45, color: '#7B1FA2' },
        { start: 0.45, end: 0.75, color: '#C2185B' },
        { start: 0.75, end: 1, color: '#E91E63' },
      ];

      segments.forEach(seg => {
        ctx.beginPath();
        ctx.arc(
          cx, cy, radius,
          startAngle + seg.start * totalAngle,
          startAngle + seg.end * totalAngle
        );
        ctx.strokeStyle = seg.color + '40';
        ctx.lineWidth = lineWidth - 4;
        ctx.lineCap = 'butt';
        ctx.stroke();
      });

      // Active arc
      const activeAngle = startAngle + (currentPercentage / 100) * totalAngle;
      if (currentPercentage > 0) {
        // Glow effect
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, activeAngle);
        ctx.strokeStyle = color + '60';
        ctx.lineWidth = lineWidth + 8;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Main active arc
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, activeAngle);

        const gradient = ctx.createConicGradient(startAngle, cx, cy);
        gradient.addColorStop(0, '#003399');
        gradient.addColorStop(0.25, '#4A90E2');
        gradient.addColorStop(0.5, '#7B1FA2');
        gradient.addColorStop(0.75, '#C2185B');
        gradient.addColorStop(1, '#E91E63');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Needle dot
        const dotX = cx + radius * Math.cos(activeAngle);
        const dotY = cy + radius * Math.sin(activeAngle);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Tick marks
      for (let i = 0; i <= 20; i++) {
        const angle = startAngle + (i / 20) * totalAngle;
        const isMajor = i % 5 === 0;
        const innerR = radius - (isMajor ? 22 : 18);
        const outerR = radius - 14;

        ctx.beginPath();
        ctx.moveTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
        ctx.lineTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
        ctx.strokeStyle = isMajor ? 'rgba(148, 163, 184, 0.6)' : 'rgba(148, 163, 184, 0.3)';
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Scale labels
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.textAlign = 'center';
      const labels = ['0', '250', '500', '750', '1000'];
      labels.forEach((lbl, i) => {
        const angle = startAngle + (i / 4) * totalAngle;
        const labelR = radius - 32;
        ctx.fillText(lbl, cx + labelR * Math.cos(angle), cy + labelR * Math.sin(angle) + 3);
      });
    };

    const animateGauge = () => {
      const startTime = Date.now();
      const duration = 1500;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        currentPercentage = percentage * eased;

        draw();

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    };

    const timeout = setTimeout(animateGauge, 500);
    return () => clearTimeout(timeout);
  }, [percentage, color]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="glass-card p-6 flex flex-col items-center"
    >
      <div className="relative">
        <canvas ref={canvasRef} className="block" />

        {/* Center Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: '40px' }}>
          <motion.span
            className="text-3xl sm:text-4xl font-bold font-mono"
            style={{ color }}
          >
            {isAnimating ? (
              <span className="text-slate-500">---</span>
            ) : (
              <motion.span>
                <motion.span>{range || displayValue}</motion.span>
              </motion.span>
            )}
          </motion.span>
          <span className="text-sm text-slate-400 mt-1">{unit}</span>
        </div>
      </div>

      {/* Label & Status */}
      <div className="text-center mt-4">
        <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{label}</p>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.5, type: 'spring', stiffness: 200 }}
          className="mt-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{
            backgroundColor: color + '20',
            color: color,
            border: `1px solid ${color}40`,
            boxShadow: `0 0 20px ${color}30`,
          }}
        >
          {status}
        </motion.div>
      </div>
    </motion.div>
  );
}