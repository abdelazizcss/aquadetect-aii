import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { CALIBRATION_DATA } from '../utils/calibrationData';
import type { AnalysisResult } from '../types';

interface PDFReportProps {
  result: AnalysisResult | null;
}

export default function PDFReport({ result }: PDFReportProps) {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    if (!result) return;

    setGenerating(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header background
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 45, 'F');

      // Branding
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(66, 165, 245);
      doc.text('Aqua', 20, 25);
      doc.setTextColor(123, 31, 162);
      doc.text('Detect', 52, 25);

      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text('Fuel Water Content Analysis Report', 20, 33);

      // Date
      const now = new Date();
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${now.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })}`, pageWidth - 80, 25);

      // Separator line
      doc.setDrawColor(66, 165, 245);
      doc.setLineWidth(0.5);
      doc.line(20, 50, pageWidth - 20, 50);

      // Main Results Section
      let y = 60;
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Analysis Results', 20, y);

      y += 12;

      // Result cards
      const results = [
        { label: 'Water Content', value: result.range },
        { label: 'Status', value: result.status.toUpperCase() },
        { label: 'Detected Color', value: result.detectedColor },
        { label: 'Confidence', value: `${result.confidence}%` },
        { label: 'Risk Level', value: result.riskLevel },
      ];

      results.forEach((item) => {
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(20, y - 4, pageWidth - 40, 10, 2, 2, 'F');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(item.label, 25, y + 2);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(item.value, 100, y + 2);

        y += 14;
      });

      // Color Analysis Section
      y += 5;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Color Analysis', 20, y);

      y += 10;

      // Color swatch
      const [r, g, b] = result.rgb;
      doc.setFillColor(r, g, b);
      doc.roundedRect(20, y, 20, 20, 3, 3, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`RGB: ${r}, ${g}, ${b}`, 45, y + 8);
      doc.text(`HEX: ${result.hex.toUpperCase()}`, 45, y + 14);

      doc.setTextColor(100, 116, 139);
      doc.text(`CIELAB: L*=${result.cielab.L}, a*=${result.cielab.a}, b*=${result.cielab.b}`, 45, y + 20);
      doc.text(`Delta-E (CIE76): ${result.deltaE.toFixed(2)}`, 45, y + 26);

      y += 35;

      // Calibration Reference Table
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Calibration Reference', 20, y);

      y += 10;

      // Table header
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(20, y - 4, pageWidth - 40, 8, 2, 2, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(148, 163, 184);
      doc.text('Water Content', 25, y + 1);
      doc.text('Color', 60, y + 1);
      doc.text('HEX', 100, y + 1);
      doc.text('RGB', 125, y + 1);
      doc.text('Status', 160, y + 1);

      y += 10;

      CALIBRATION_DATA.forEach((entry) => {
        const isMatch = result.matchedEntry.range === entry.range;
        if (isMatch) {
          doc.setFillColor(30, 58, 100);
          doc.roundedRect(20, y - 4, pageWidth - 40, 8, 1, 1, 'F');
        }

        doc.setFontSize(8);
        doc.setFont('helvetica', isMatch ? 'bold' : 'normal');
        doc.setTextColor(isMatch ? 66 : 200, isMatch ? 165 : 200, isMatch ? 245 : 200);

        doc.text(entry.range, 25, y + 1);

        const [er, eg, eb] = entry.rgb;
        doc.setFillColor(er, eg, eb);
        doc.circle(65, y - 1, 2, 'F');

        doc.text(entry.name, 70, y + 1);
        doc.text(entry.hex, 100, y + 1);
        doc.text(`${er},${eg},${eb}`, 125, y + 1);

        doc.setTextColor(er, eg, eb);
        doc.text(entry.status, 160, y + 1);

        y += 9;
      });

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.3);
      doc.line(20, footerY, pageWidth - 20, footerY);

      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('AquaDetect™ - Fuel Water Content Analyzer', 20, footerY + 5);
      doc.text('ISO 6296 Calibration Standard', 20, footerY + 9);
      doc.text(`Page 1 of 1`, pageWidth - 40, footerY + 5);

      // Download
      doc.save(`AquaDetect_Report_${now.toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      onClick={generatePDF}
      disabled={!result || generating}
      className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
        result && !generating
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'
          : 'bg-slate-800 text-slate-600 cursor-not-allowed'
      }`}
    >
      {generating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating Report...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          Download PDF Report
        </>
      )}
    </motion.button>
  );
}