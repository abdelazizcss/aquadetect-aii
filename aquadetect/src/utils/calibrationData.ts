import type { CalibrationEntry } from '../types';

export const CALIBRATION_DATA: CalibrationEntry[] = [
  {
    range: '>150 ppm',
    name: 'Bleu Cyan Clair',
    hex: '#4A90E2',
    rgb: [74, 144, 226],
    status: 'Safe',
    description: 'Acceptable water level',
    ppmCenter: 75,
  },
  {
    range: '150-450 ppm',
    name: 'Indigo / Violet Franc',
    hex: '#7B1FA2',
    rgb: [123, 31, 162],
    status: 'Attention',
    description: 'Moderate moisture detected',
    ppmCenter: 300,
  },
  {
    range: '450-750 ppm',
    name: 'Pourpre / Rose-Violet',
    hex: '#C2185B',
    rgb: [194, 24, 91],
    status: 'High Contamination',
    description: 'High water contamination',
    ppmCenter: 600,
  },
  {
    range: '750>',
    name: 'Rose Vif / Fuchsia Total',
    hex: '#E91E63',
    rgb: [233, 30, 99],
    status: 'Critical',
    description: 'Critical water contamination',
    ppmCenter: 875,
  },
];

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Safe': return '#4A90E2';
    case 'Attention': return '#7B1FA2';
    case 'High Contamination': return '#C2185B';
    case 'Critical': return '#E91E63';
    default: return '#94a3b8';
  }
};

export const getStatusBgColor = (status: string): string => {
  switch (status) {
    case 'Safe': return 'rgba(74, 144, 226, 0.15)';
    case 'Attention': return 'rgba(123, 31, 162, 0.15)';
    case 'High Contamination': return 'rgba(194, 24, 91, 0.15)';
    case 'Critical': return 'rgba(233, 30, 99, 0.15)';
    default: return 'rgba(148, 163, 184, 0.15)';
  }
};

export const getStatusGlow = (status: string): string => {
  switch (status) {
    case 'Safe': return '0 0 20px rgba(74, 144, 226, 0.4)';
    case 'Attention': return '0 0 20px rgba(123, 31, 162, 0.4)';
    case 'High Contamination': return '0 0 20px rgba(194, 24, 91, 0.4)';
    case 'Critical': return '0 0 20px rgba(233, 30, 99, 0.4)';
    default: return 'none';
  }
};
