import type { CalibrationEntry } from '../types';

export const CALIBRATION_DATA: CalibrationEntry[] = [
  {
    range: '<100 ppm',
    name: 'Cyan Blue / Teal',
    hex: '#33809E',
    rgb: [51, 128, 158],
    status: 'Excellent',
    description: 'Low water content - Teal/Cyan blue',
    ppmCenter: 50,
    hsv: {
      lower: [92, 80, 130],
      upper: [112, 200, 235],
    },
    extendedColors: {
      'photo_2026-06-22_14-57-40.jpg': {
        rgb: [51, 128, 158],
        hex: '#33809E',
        hsvStd: 'H: 197°, S: 68%, V: 62%',
        hsvCv: [98, 173, 158],
        description: 'Mid-left strip region - Day/cool lighting',
      },
      '20260621_204154.jpg': {
        rgb: [118, 163, 209],
        hex: '#76A3D1',
        hsvStd: 'H: 210°, S: 44%, V: 82%',
        hsvCv: [105, 112, 209],
        description: 'Center of middle strip in dish - Indoor lighting',
      },
      '20260621_215851.jpg': {
        rgb: [68, 148, 176],
        hex: '#4494B0',
        hsvStd: 'H: 196°, S: 61%, V: 69%',
        hsvCv: [98, 156, 176],
        description: 'Stable turquoise strip body',
      },
    },
  },
  {
    range: '100-200 ppm',
    name: 'Medium Purple / Violet Transition',
    hex: '#695594',
    rgb: [105, 85, 148],
    status: 'Safe',
    description: 'Transition phase - Initial purple shift',
    ppmCenter: 150,
    hsv: {
      lower: [120, 50, 100],
      upper: [135, 150, 200],
    },
    extendedColors: {
      'photo_2_2026-06-22_15-58-14.jpg': {
        rgb: [105, 85, 148],
        hex: '#695594',
        hsvStd: 'H: 259°, S: 43%, V: 58%',
        hsvCv: [129, 110, 148],
        description: 'Main reaction center',
      },
    },
  },
  {
    range: '200-250 ppm',
    name: 'Slate Blue / Lavender',
    hex: '#6771ff',
    rgb: [132, 134, 166],
    status: 'Safe',
    description: 'Moderate water - Slate blue/Lavender',
    ppmCenter: 225,
    hsv: {
      lower: [108, 40, 110],
      upper: [124, 95, 195],
    },
    extendedColors: {
      '20260621_212422.jpg': {
        rgb: [132, 134, 166],
        hex: '#8486A6',
        hsvStd: 'H: 236°, S: 20%, V: 65%',
        hsvCv: [118, 52, 166],
        description: 'Basic strip body E0',
      },
      '20260621_213253.jpg': {
        rgb: [114, 118, 147],
        hex: '#727693',
        hsvStd: 'H: 233°, S: 22%, V: 58%',
        hsvCv: [116, 57, 147],
        description: 'Stable strip body EA',
      },
      '20260621_213605.jpg': {
        rgb: [105, 115, 143],
        hex: '#69738F',
        hsvStd: 'H: 224°, S: 26%, V: 56%',
        hsvCv: [112, 68, 143],
        description: 'Colored strip body E1',
      },
      'photo_1_2026-06-22_15-30-40.jpg': {
        rgb: [35, 110, 152],
        hex: '#236E98',
        hsvStd: 'H: 201°, S: 77%, V: 60%',
        hsvCv: [100, 196, 152],
        description: 'Highly saturated blue spots E3',
      },
      'photo_2_2026-06-22_15-30-40.jpg': {
        rgb: [142, 123, 158],
        hex: '#8E7B9E',
        hsvStd: 'H: 273°, S: 22%, V: 62%',
        hsvCv: [136, 56, 158],
        description: 'E3 strip body (purple background)',
      },
    },
  },
  {
    range: '250-400 ppm',
    name: 'True Violet / Mauve',
    hex: '#8b66a1',
    rgb: [135, 110, 148],
    status: 'Attention',
    description: 'Elevated water - True violet',
    ppmCenter: 325,
    hsv: {
      lower: [130, 25, 120],
      upper: [155, 90, 210],
    },
    extendedColors: {
      '20260621_215250.jpg': {
        rgb: [135, 110, 148],
        hex: '#876E94',
        hsvStd: 'H: 279°, S: 26%, V: 58%',
        hsvCv: [139, 66, 148],
        description: 'Top of strip (balanced violet)',
      },
      '20260621_215250_spot.jpg': {
        rgb: [48, 105, 153],
        hex: '#306999',
        hsvStd: 'H: 207°, S: 69%, V: 60%',
        hsvCv: [103, 176, 153],
        description: 'Bottom spot below dividing line',
      },
    },
  },
  {
    range: '400-550 ppm',
    name: 'Magenta/Orchid Violet',
    hex: '#ab78b5',
    rgb: [146, 112, 153],
    status: 'High Contamination',
    description: 'High water - Deep magenta',
    ppmCenter: 475,
    hsv: {
      lower: [138, 35, 110],
      upper: [160, 110, 190],
    },
    extendedColors: {
      '20260621_215851.jpg': {
        rgb: [146, 112, 153],
        hex: '#927099',
        hsvStd: 'H: 290°, S: 27%, V: 60%',
        hsvCv: [145, 69, 153],
        description: 'Main strip body (dark purple)',
      },
      '20260621_215851_spot.jpg': {
        rgb: [42, 118, 163],
        hex: '#2A76A3',
        hsvStd: 'H: 202°, S: 74%, V: 64%',
        hsvCv: [101, 189, 163],
        description: 'Remaining blue spots (far left)',
      },
      '20260621_220322.jpg': {
        rgb: [168, 136, 173],
        hex: '#A888AD',
        hsvStd: 'H: 292°, S: 21%, V: 68%',
        hsvCv: [146, 54, 173],
        description: 'Direct transitional range (light purple)',
      },
      '20260621_220451.jpg': {
        rgb: [42, 118, 163],
        hex: '#2A76A3',
        hsvStd: 'H: 202°, S: 74%, V: 64%',
        hsvCv: [101, 189, 163],
        description: 'Remaining blue spots',
      },
    },
  },
  {
    range: '550-750 ppm',
    name: 'Pale Lavender / Pink',
    hex: '#de8093',
    rgb: [225, 200, 205],
    status: 'Critical',
    description: 'Very high water - Bleaching effect',
    ppmCenter: 650,
    hsv: {
      lower: [140, 15, 170],
      upper: [180, 50, 240],
    },
    extendedColors: {
      '20260621_220322.jpg': {
        rgb: [225, 200, 205],
        hex: '#E1C8CD',
        hsvStd: 'H: 348°, S: 11%, V: 88%',
        hsvCv: [174, 28, 225],
        description: 'Bleached reaction center core',
      },
      '20260621_220451.jpg': {
        rgb: [225, 200, 205],
        hex: '#E1C8CD',
        hsvStd: 'H: 348°, S: 11%, V: 88%',
        hsvCv: [174, 28, 225],
        description: 'Bleached reaction center core',
      },
      '20260621_220451_halo.jpg': {
        rgb: [180, 150, 185],
        hex: '#B496B9',
        hsvStd: 'H: 291°, S: 19%, V: 73%',
        hsvCv: [146, 48, 185],
        description: 'Transitional halo around light center',
      },
    },
  },
  {
    range: '>750 ppm',
    name: 'Stable Light Pink / Totally Bleached',
    hex: '#eba2b8',
    rgb: [242, 190, 205],
    status: 'Critical',
    description: 'Critical - Stable light pink bleaching phase',
    ppmCenter: 875,
    hsv: {
      lower: [160, 2, 220],
      upper: [180, 25, 255],
    },
    isBleached: true,
    extendedColors: {
      '20260621_221537.jpg': {
        rgb: [242, 190, 205],
        hex: '#F2BECD',
        hsvStd: 'H: 334°, S: 3%, V: 95%',
        hsvCv: [167, 8, 242],
        description: 'Bleached center core',
      },
      '20260621_222027.jpg': {
        rgb: [242, 190, 205],
        hex: '#F2BECD',
        hsvStd: 'H: 334°, S: 3%, V: 95%',
        hsvCv: [167, 8, 242],
        description: 'Bleached center core (repeat set)',
      },
      '20260621_222043.jpeg': {
        rgb: [242, 190, 205],
        hex: '#F2BECD',
        hsvStd: 'H: 334°, S: 3%, V: 95%',
        hsvCv: [167, 8, 242],
        description: 'Bleached center core (repeat set)',
      },
      '20260621_222027_boundary.jpg': {
        rgb: [210, 130, 155],
        hex: '#D2829B',
        hsvStd: 'H: 341°, S: 38%, V: 82%',
        hsvCv: [170, 97, 210],
        description: 'Active pink boundary lines',
      },
      '20260621_222043_boundary.jpeg': {
        rgb: [210, 130, 155],
        hex: '#D2829B',
        hsvStd: 'H: 341°, S: 38%, V: 82%',
        hsvCv: [170, 97, 210],
        description: 'Active pink boundary lines',
      },
    },
  },
];

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Excellent': return '#33809E';
    case 'Safe': return '#8486A6';
    case 'Attention': return '#876E94';
    case 'High Contamination': return '#927099';
    case 'Critical': return '#f4a4ba';
    default: return '#94a3b8';
  }
};

export const getStatusBgColor = (status: string): string => {
  switch (status) {
    case 'Excellent': return 'rgba(51, 128, 158, 0.15)';
    case 'Safe': return 'rgba(132, 134, 166, 0.15)';
    case 'Attention': return 'rgba(135, 110, 148, 0.15)';
    case 'High Contamination': return 'rgba(146, 112, 153, 0.15)';
    case 'Critical': return 'rgba(242, 190, 205, 0.15)';
    default: return 'rgba(148, 163, 184, 0.15)';
  }
};

export const getStatusGlow = (status: string): string => {
  switch (status) {
    case 'Excellent': return '0 0 20px rgba(51, 128, 158, 0.4)';
    case 'Safe': return '0 0 20px rgba(132, 134, 166, 0.4)';
    case 'Attention': return '0 0 20px rgba(135, 110, 148, 0.4)';
    case 'High Contamination': return '0 0 20px rgba(146, 112, 153, 0.4)';
    case 'Critical': return '0 0 20px rgba(242, 190, 205, 0.4)';
    default: return 'none';
  }
};

