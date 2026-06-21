import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative z-10"
    >
      <div className="glass-card px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden glow-blue border border-white/10 shadow-lg shadow-blue-500/20">
                <img
                  src="/aqua-logo.jpg"
                  alt="AquaDetect Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </motion.div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">
                <span className="text-white">Aqua</span>
                <span className="gradient-text">Detect</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 tracking-widest uppercase">
                Fuel Water Content Analyzer
              </p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 sm:gap-4">
            <motion.div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Zap className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400 font-medium">System Online</span>
            </motion.div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Calibration Standard</p>
              <p className="text-xs font-mono text-blue-400">ISO 6296</p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}