import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, RotateCcw, ZoomIn, Maximize2, Target } from 'lucide-react';
import { analyzeImage, drawAnalysisOverlay, detectStripRegion } from '../utils/imageAnalysis';
import type { ImageAnalysisState, AnalysisResult } from '../types';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

interface ImageUploaderProps {
  onAnalysisComplete: (result: AnalysisResult, images: ImageAnalysisState) => void;
  onAnalysisStart?: () => void;
}

export default function ImageUploader({ onAnalysisComplete, onAnalysisStart }: ImageUploaderProps) {
  const [state, setState] = useState<ImageAnalysisState>({
    originalImage: null,
    detectedStrip: null,
    analyzedArea: null,
    zoomedRegion: null,
    isAnalyzing: false,
    analysisComplete: false,
    result: null,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processImage = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      setState(prev => ({ ...prev, originalImage: imageUrl }));
      onAnalysisStart?.();
      setState(prev => ({ ...prev, isAnalyzing: true }));

      const img = new Image();
      img.onload = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const maxSize = 600;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Detect the precise strip region first
        const stripRegion = detectStripRegion(canvas, ctx);

        // Simulate analysis delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Analyze
        const result = analyzeImage(canvas, ctx, canvas.width, canvas.height);

        // Draw overlay highlighting only the strip
        drawAnalysisOverlay(canvas, ctx, stripRegion);

        // Generate sub-images using detected strip region
        const stripCanvas = document.createElement('canvas');
        const stripCtx = stripCanvas.getContext('2d')!;
        stripCanvas.width = stripRegion.width;
        stripCanvas.height = stripRegion.height;
        stripCtx.drawImage(
          canvas,
          stripRegion.x, stripRegion.y, stripRegion.width, stripRegion.height,
          0, 0, stripRegion.width, stripRegion.height
        );

        // Remove background - keep only the strip
        const imageData = stripCtx.getImageData(0, 0, stripCanvas.width, stripCanvas.height);
        const stripData = imageData.data;
        
        for (let i = 0; i < stripData.length; i += 4) {
          const r = stripData[i];
          const g = stripData[i + 1];
          const b = stripData[i + 2];
          
          const brightness = (r + g + b) / 3;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : ((max - min) / max);
          
          // Make white/light background transparent
          if (brightness > 200 && saturation < 0.1) {
            stripData[i + 3] = 0; // Alpha = 0 (transparent)
          }
        }
        
        stripCtx.putImageData(imageData, 0, 0);

        // Zoomed region - center of the detected strip
        const zoomCanvas = document.createElement('canvas');
        const zoomCtx = zoomCanvas.getContext('2d')!;
        zoomCanvas.width = 200;
        zoomCanvas.height = 200;
        const zoomW = stripRegion.width * 0.5;
        const zoomH = stripRegion.height * 0.8;
        zoomCtx.drawImage(
          canvas,
          stripRegion.x + stripRegion.width * 0.25,
          stripRegion.y + stripRegion.height * 0.1,
          zoomW,
          zoomH,
          0, 0, 200, 200
        );

        const overlayUrl = canvas.toDataURL('image/png');
        const stripUrl = stripCanvas.toDataURL('image/png');
        const zoomUrl = zoomCanvas.toDataURL('image/png');

        const newState: ImageAnalysisState = {
          originalImage: imageUrl,
          detectedStrip: stripUrl,
          analyzedArea: overlayUrl,
          zoomedRegion: zoomUrl,
          isAnalyzing: false,
          analysisComplete: true,
          result,
        };

        setState(newState);
        onAnalysisComplete(result, newState);
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  }, [onAnalysisComplete]);

  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleCameraCapture = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const onCameraChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  }, [processImage]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processImage(acceptedFiles[0]);
    }
  }, [processImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.bmp', '.tiff'] },
    maxFiles: 1,
  });

  const showCameraButton = isMobile && 'mediaDevices' in navigator;

  const handleReset = () => {
    onAnalysisStart?.();
    setState({
      originalImage: null,
      detectedStrip: null,
      analyzedArea: null,
      zoomedRegion: null,
      isAnalyzing: false,
      analysisComplete: false,
      result: null,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-4 sm:p-6"
    >
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5 text-blue-400" />
        Image Analysis Panel
      </h2>

      <canvas ref={canvasRef} className="hidden" />

      <AnimatePresence mode="wait">
        {!state.originalImage ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-blue-400 bg-blue-500/10'
                  : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
              }`}
            >
              <input {...getInputProps()} />
              <motion.div
                animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-semibold text-white">
                    {isDragActive ? 'Drop your image here' : 'Upload Fuel Test Strip Image'}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Drag & drop or click to browse • JPEG, PNG, BMP, TIFF
                  </p>
                </div>
              </motion.div>

              {showCameraButton && (
                <button
                  onClick={handleCameraCapture}
                  type="button"
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </button>
              )}

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onCameraChange}
                className="hidden"
              />
            </div>
          </motion.div>
        ) : state.isAnalyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            <div className="relative">
              <motion.div
                className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-400 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              />
              <Target className="absolute inset-0 m-auto w-8 h-8 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">Analyzing Image...</p>
              <p className="text-sm text-slate-400">Processing color data and calculating water content</p>
            </div>
            <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="relative group">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700/50">
                  <img src={state.originalImage!} alt="Original" className="w-full h-full object-contain" />
                </div>
                <div className="absolute top-2 left-2 px-3 py-1 bg-black/60 rounded text-xs text-white font-medium">
                  Original Image
                </div>
              </div>

              <div className="relative group">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700/50">
                  <img src={state.detectedStrip!} alt="Detected Strip" className="w-full h-full object-contain" />
                </div>
                <div className="absolute top-2 left-2 px-3 py-1 bg-black/60 rounded text-xs text-white font-medium flex items-center gap-1">
                  <Maximize2 className="w-3 h-3" /> Detected Strip
                </div>
              </div>

              <div className="relative group">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700/50">
                  <img src={state.analyzedArea!} alt="Analyzed Area" className="w-full h-full object-contain" />
                </div>
                <div className="absolute top-2 left-2 px-3 py-1 bg-black/60 rounded text-xs text-white font-medium flex items-center gap-1">
                  <Target className="w-3 h-3" /> Analyzed Area
                </div>
              </div>

              <div className="relative group">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700/50">
                  <img src={state.zoomedRegion!} alt="Zoomed Region" className="w-full h-full object-contain" />
                </div>
                <div className="absolute top-2 left-2 px-3 py-1 bg-black/60 rounded text-xs text-white font-medium flex items-center gap-1">
                  <ZoomIn className="w-3 h-3" /> Zoomed Region
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium flex items-center justify-center gap-2 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Analyze New Image
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}