/**
 * 📄 PDF Generation Utilities
 * Configurações e helpers para geração de PDF profissional
 */

// 📏 A4 Dimensions and Configuration
export const PDF_CONFIG = {
  // A4 dimensions in mm
  A4_WIDTH: 210,
  A4_HEIGHT: 297,
  A4_USABLE_HEIGHT: 295, // Leaving margin for pagination
  
  // PDF generation settings
  PADDING: 20, // 20mm padding
  SCALE: 2, // High resolution for print quality
  DPI: 300, // Print quality DPI
  
  // Typography settings
  FONT_SIZE: 12,
  LINE_HEIGHT: 1.6,
  FONT_FAMILY: "'Inter', 'Arial', sans-serif",
  
  // Timeout settings
  GENERATION_TIMEOUT: 10000, // 10 seconds
  
  // Canvas settings
  CANVAS_CONFIG: {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  },
  
  // Simplified canvas config for retry
  CANVAS_CONFIG_SIMPLE: {
    scale: 1,
    useCORS: false,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
  }
} as const;

/**
 * 📁 Generate safe filename for PDF
 */
export function generatePDFFilename(title: string, maxLength: number = 50): string {
  return `proposta-${title
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .toLowerCase()
    .substring(0, maxLength)
    .replace(/-+$/, '') // Remove trailing hyphens
  }.pdf`;
}

/**
 * 🎨 Apply PDF-specific styles to HTML element
 */
export function applyPDFStyles(element: HTMLElement): HTMLStyleElement {
  // Create style element
  const style = document.createElement('style');
  style.textContent = `
    .temp-pdf-content {
      background: #ffffff !important;
      color: #000000 !important;
      font-family: ${PDF_CONFIG.FONT_FAMILY} !important;
      font-size: ${PDF_CONFIG.FONT_SIZE}px !important;
      line-height: ${PDF_CONFIG.LINE_HEIGHT} !important;
      max-width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      width: ${PDF_CONFIG.A4_WIDTH}mm !important;
      padding: ${PDF_CONFIG.PADDING}mm !important;
    }
    
    /* Headers - Professional Hierarchy */
    .temp-pdf-content h1,
    .temp-pdf-content h2,
    .temp-pdf-content h3,
    .temp-pdf-content h4,
    .temp-pdf-content h5,
    .temp-pdf-content h6 {
      color: #2d2d2d !important;
      margin-top: 1.5rem !important;
      margin-bottom: 1rem !important;
      font-weight: 600 !important;
    }
    
    .temp-pdf-content h1 {
      font-size: 24px !important;
      font-weight: 700 !important;
      border-bottom: 2px solid #cccccc !important;
      padding-bottom: 0.5rem !important;
      margin-bottom: 1.5rem !important;
    }
    
    .temp-pdf-content h2 {
      font-size: 20px !important;
      font-weight: 600 !important;
      margin-top: 2rem !important;
    }
    
    .temp-pdf-content h3 {
      font-size: 16px !important;
      font-weight: 600 !important;
      margin-top: 1.5rem !important;
    }
    
    /* Paragraphs */
    .temp-pdf-content p {
      color: #000000 !important;
      margin-bottom: 1rem !important;
      line-height: 1.6 !important;
      text-align: justify !important;
    }
    
    /* Text Formatting */
    .temp-pdf-content strong {
      color: #000000 !important;
      font-weight: 700 !important;
    }
    
    .temp-pdf-content em {
      color: #2d2d2d !important;
      font-style: italic !important;
    }
    
    /* Lists */
    .temp-pdf-content ul,
    .temp-pdf-content ol {
      margin-bottom: 1rem !important;
      padding-left: 1.5rem !important;
    }
    
    .temp-pdf-content li {
      color: #000000 !important;
      margin-bottom: 0.5rem !important;
      line-height: 1.6 !important;
    }
    
    .temp-pdf-content ul li::marker {
      color: #666666 !important;
    }
    
    /* Tables */
    .temp-pdf-content table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 1rem 0 !important;
    }
    
    .temp-pdf-content th,
    .temp-pdf-content td {
      border: 1px solid #cccccc !important;
      padding: 0.5rem !important;
      text-align: left !important;
      color: #000000 !important;
      font-size: 11px !important;
    }
    
    .temp-pdf-content th {
      background-color: #f5f5f5 !important;
      font-weight: 600 !important;
      color: #2d2d2d !important;
    }
    
    /* Horizontal Rules */
    .temp-pdf-content hr {
      border: none !important;
      border-top: 1px solid #cccccc !important;
      margin: 1.5rem 0 !important;
    }
    
    /* Blockquotes */
    .temp-pdf-content blockquote {
      border-left: 4px solid #cccccc !important;
      padding-left: 1rem !important;
      margin: 1rem 0 !important;
      color: #666666 !important;
      font-style: italic !important;
      background-color: #fafafa !important;
      padding: 0.75rem 1rem !important;
    }
    
    /* Override brand colors for professional PDF */
    .temp-pdf-content .text-sgbus-green,
    .temp-pdf-content .text-green-400,
    .temp-pdf-content .text-green-500,
    .temp-pdf-content .border-sgbus-green,
    .temp-pdf-content .bg-sgbus-green {
      color: #2d2d2d !important;
      background-color: transparent !important;
      border-color: #cccccc !important;
    }
    
    /* Remove any shadows, gradients for clean PDF */
    .temp-pdf-content * {
      box-shadow: none !important;
      text-shadow: none !important;
      background-image: none !important;
    }
  `;
  
  // Apply class to element
  element.className = 'temp-pdf-content';
  
  // Apply inline styles for positioning
  element.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    width: ${PDF_CONFIG.A4_WIDTH}mm;
    padding: ${PDF_CONFIG.PADDING}mm;
    background: #ffffff;
    color: #000000;
    font-family: ${PDF_CONFIG.FONT_FAMILY};
    font-size: ${PDF_CONFIG.FONT_SIZE}px;
    line-height: ${PDF_CONFIG.LINE_HEIGHT};
  `;
  
  return style;
}

/**
 * 📄 Calculate PDF dimensions based on canvas
 */
export function calculatePDFDimensions(canvas: HTMLCanvasElement) {
  const imgWidth = PDF_CONFIG.A4_WIDTH;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  return {
    imgWidth,
    imgHeight,
    pageHeight: PDF_CONFIG.A4_USABLE_HEIGHT,
    pagesNeeded: Math.ceil(imgHeight / PDF_CONFIG.A4_USABLE_HEIGHT)
  };
}

/**
 * 📑 Add pages to PDF with proper pagination
 */
export function addPagesToPDF(
  pdf: any, // jsPDF instance
  canvas: HTMLCanvasElement,
  dimensions: ReturnType<typeof calculatePDFDimensions>
) {
  const { imgWidth, imgHeight, pageHeight } = dimensions;
  const imageData = canvas.toDataURL('image/png');
  
  let heightLeft = imgHeight;
  let position = 0;

  // Add first page
  pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Add additional pages if needed
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
}

/**
 * 🧹 Cleanup DOM elements safely
 */
export function cleanupPDFElements(elements: (HTMLElement | null)[]) {
  elements.forEach(element => {
    try {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    } catch (error) {
      console.warn('Error cleaning up PDF element:', error);
    }
  });
}

/**
 * ⏱️ Create timeout promise for PDF generation
 */
export function createGenerationTimeout(timeoutMs: number = PDF_CONFIG.GENERATION_TIMEOUT) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout: Geração de PDF cancelada (>${timeoutMs / 1000}s)`));
    }, timeoutMs);
  });
}

/**
 * 🎯 Validate HTML content for PDF generation
 */
export function validateHTMLContent(htmlContent: string | null): string {
  if (!htmlContent) {
    throw new Error('Conteúdo HTML não disponível para export');
  }
  
  const trimmed = htmlContent.trim();
  if (!trimmed) {
    throw new Error('Conteúdo HTML vazio após sanitização');
  }
  
  return trimmed;
}

/**
 * 📊 Performance monitoring for PDF generation
 */
export class PDFGenerationMonitor {
  private startTime: number = 0;
  private steps: { name: string; time: number }[] = [];
  
  start() {
    this.startTime = performance.now();
    this.steps = [];
  }
  
  step(name: string) {
    const currentTime = performance.now();
    this.steps.push({
      name,
      time: currentTime - this.startTime
    });
  }
  
  finish() {
    const totalTime = performance.now() - this.startTime;
    
    console.log('📊 PDF Generation Performance:', {
      totalTime: `${totalTime.toFixed(2)}ms`,
      steps: this.steps.map(step => ({
        name: step.name,
        time: `${step.time.toFixed(2)}ms`
      }))
    });
    
    return totalTime;
  }
}

/**
 * 🔍 Error classification for better user feedback
 */
export function classifyPDFError(error: Error): {
  type: 'timeout' | 'content' | 'canvas' | 'pdf' | 'unknown';
  userMessage: string;
} {
  const message = error.message.toLowerCase();
  
  if (message.includes('timeout')) {
    return {
      type: 'timeout',
      userMessage: 'Timeout: A geração do PDF demorou muito. Tente novamente.'
    };
  }
  
  if (message.includes('html não disponível') || message.includes('conteúdo') || message.includes('vazio')) {
    return {
      type: 'content',
      userMessage: 'Esta proposta não possui conteúdo válido para exportar.'
    };
  }
  
  if (message.includes('canvas') || message.includes('html2canvas')) {
    return {
      type: 'canvas',
      userMessage: 'Erro na captura do conteúdo. Tentando modo simplificado...'
    };
  }
  
  if (message.includes('jspdf') || message.includes('pdf')) {
    return {
      type: 'pdf',
      userMessage: 'Erro na geração do PDF. Tentando fallback para impressão...'
    };
  }
  
  return {
    type: 'unknown',
    userMessage: 'Ocorreu um erro inesperado durante a geração do PDF.'
  };
} 