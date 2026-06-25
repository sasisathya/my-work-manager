/**
 * Canvas export functionality
 * PDF, PNG, SVG, HTML, JSON exports
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CanvasElement, CanvasProject } from './types';
import { downloadFile } from './utils';

/**
 * Export canvas to PDF
 */
export const exportToPDF = async (
  project: CanvasProject,
  svgElement: SVGSVGElement,
  filename: string = `${project.name}.pdf`
) => {
  try {
    // Convert SVG to canvas first
    const canvas = await html2canvas(svgElement as any, {
      backgroundColor: project.backgroundColor || '#ffffff',
      scale: 2,
    });

    // Create PDF with appropriate dimensions
    const pdfWidth = project.width / 4; // Convert pixels to reasonable PDF dimensions
    const pdfHeight = project.height / 4;
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    const pdfCanvasWidth = pdf.internal.pageSize.getWidth();
    const pdfCanvasHeight = pdf.internal.pageSize.getHeight();

    const imageData = canvas.toDataURL('image/png');
    pdf.addImage(imageData, 'PNG', 0, 0, pdfCanvasWidth, pdfCanvasHeight);

    pdf.save(filename);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF');
  }
};

/**
 * Export canvas to PNG
 */
export const exportToPNG = async (
  project: CanvasProject,
  svgElement: SVGSVGElement,
  filename: string = `${project.name}.png`
) => {
  try {
    const canvas = await html2canvas(svgElement as any, {
      backgroundColor: project.backgroundColor || '#ffffff',
      scale: 2,
    });

    canvas.toBlob((blob) => {
      if (blob) {
        downloadFile(blob, filename);
      }
    });
  } catch (error) {
    console.error('PNG export failed:', error);
    throw new Error('Failed to export PNG');
  }
};

/**
 * Export canvas to SVG
 */
export const exportToSVG = (
  project: CanvasProject,
  svgElement: SVGSVGElement,
  filename: string = `${project.name}.svg`
) => {
  try {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    downloadFile(blob, filename);
  } catch (error) {
    console.error('SVG export failed:', error);
    throw new Error('Failed to export SVG');
  }
};

/**
 * Export canvas to HTML
 */
export const exportToHTML = (
  project: CanvasProject,
  svgElement: SVGSVGElement,
  filename: string = `${project.name}.html`
) => {
  try {
    const svgData = new XMLSerializer().serializeToString(svgElement);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .container {
            background-color: ${project.backgroundColor || '#ffffff'};
            width: ${project.width}px;
            height: ${project.height}px;
            margin: 0 auto;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        svg {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div class="container">
        ${svgData}
    </div>
</body>
</html>
    `.trim();

    const blob = new Blob([html], { type: 'text/html' });
    downloadFile(blob, filename);
  } catch (error) {
    console.error('HTML export failed:', error);
    throw new Error('Failed to export HTML');
  }
};

/**
 * Export project data to JSON
 */
export const exportToJSON = (
  project: CanvasProject,
  filename: string = `${project.name}.json`
) => {
  try {
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadFile(blob, filename);
  } catch (error) {
    console.error('JSON export failed:', error);
    throw new Error('Failed to export JSON');
  }
};

/**
 * Import project from JSON
 */
export const importFromJSON = (file: File): Promise<CanvasProject> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const project: CanvasProject = JSON.parse(json);
        resolve(project);
      } catch (error) {
        reject(new Error('Failed to parse JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
