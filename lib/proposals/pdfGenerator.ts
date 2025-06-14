/**
 * 📄 PDF Generation Utilities
 * Configurações e helpers para geração de PDF profissional
 */

// 📏 A4 Dimensions and Configuration
export const PDF_CONFIG = {
  // A4 dimensions in mm
  A4_WIDTH: 210,
  A4_HEIGHT: 297,
  A4_USABLE_HEIGHT: 280, // Reduced to leave bottom margin
  
  // PDF generation settings - MARGENS AJUSTADAS
  PADDING_TOP: 15,        // 15mm margem superior primeira página
  PADDING_RIGHT: 15,      // 15mm margem direita
  PADDING_BOTTOM: 15,     // 15mm margem inferior (NOVA)
  PADDING_LEFT: 15,       // 15mm margem esquerda
  PADDING_TOP_SUBSEQUENT: 20, // 20mm margem superior páginas subsequentes (NOVA)
  
  SCALE: 2, // High resolution for print quality
  DPI: 300, // Print quality DPI
  
  // Typography settings
  FONT_SIZE: 12,
  LINE_HEIGHT: 1.6,
  FONT_FAMILY: "'Inter', 'Arial', sans-serif",
  
  // Timeout settings
  GENERATION_TIMEOUT: 10000, // 10 seconds
  
  // Smart page break settings
  MIN_SECTION_HEIGHT: 80, // px - minimum height to keep section together
  ORPHAN_THRESHOLD: 60, // px - minimum content after header
  WIDOW_THRESHOLD: 40, // px - minimum content before page break
  
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
 * 🧠 Analyze content structure for smart page breaks
 */
interface ContentSection {
  element: HTMLElement;
  type: 'header' | 'content' | 'table' | 'list' | 'blockquote';
  level?: number; // For headers (1-6)
  estimatedHeight: number;
  nextElements: HTMLElement[];
  shouldKeepTogether: boolean;
}

export function analyzeContentStructure(element: HTMLElement): ContentSection[] {
  const sections: ContentSection[] = [];
  const allElements = Array.from(element.children) as HTMLElement[];
  
  allElements.forEach((el, index) => {
    const tagName = el.tagName.toLowerCase();
    const nextElements = allElements.slice(index + 1, index + 4); // Next 3 elements
    
    let section: ContentSection = {
      element: el,
      type: 'content',
      estimatedHeight: estimateElementHeight(el),
      nextElements,
      shouldKeepTogether: false
    };
    
    // Classify element type
    if (tagName.match(/^h[1-6]$/)) {
      section.type = 'header';
      section.level = parseInt(tagName.substring(1));
      section.shouldKeepTogether = true; // Headers should stay with following content
    } else if (tagName === 'table') {
      section.type = 'table';
      section.shouldKeepTogether = true; // Tables should not break
    } else if (tagName === 'ul' || tagName === 'ol') {
      section.type = 'list';
      section.shouldKeepTogether = section.estimatedHeight < PDF_CONFIG.MIN_SECTION_HEIGHT;
    } else if (tagName === 'blockquote') {
      section.type = 'blockquote';
      section.shouldKeepTogether = true;
    }
    
    sections.push(section);
  });
  
  return sections;
}

/**
 * 📏 Estimate element height in pixels
 */
function estimateElementHeight(element: HTMLElement): number {
  // Create temporary element to measure
  const temp = element.cloneNode(true) as HTMLElement;
  temp.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    width: 170mm; // A4 width minus padding
    visibility: hidden;
    font-size: 12px;
    line-height: 1.6;
  `;
  
  document.body.appendChild(temp);
  const height = temp.offsetHeight;
  document.body.removeChild(temp);
  
  return height || estimateHeightByContent(element);
}

/**
 * 📐 Fallback height estimation based on content
 */
function estimateHeightByContent(element: HTMLElement): number {
  const tagName = element.tagName.toLowerCase();
  const textLength = element.textContent?.length || 0;
  const lineHeight = 19.2; // 12px * 1.6
  
  switch (tagName) {
    case 'h1': return 40;
    case 'h2': return 35;
    case 'h3': return 30;
    case 'h4':
    case 'h5':
    case 'h6': return 25;
    case 'p': 
      const lines = Math.ceil(textLength / 80); // ~80 chars per line
      return lines * lineHeight + 16; // + margin
    case 'ul':
    case 'ol':
      const items = element.querySelectorAll('li').length;
      return items * (lineHeight + 8) + 16; // + margins
    case 'table':
      const rows = element.querySelectorAll('tr').length;
      return rows * 32 + 16; // ~32px per row + margins
    case 'blockquote':
      const lines2 = Math.ceil(textLength / 70); // Blockquotes are slightly narrower
      return lines2 * lineHeight + 24; // + padding
    case 'hr': return 20;
    default: 
      const lines3 = Math.ceil(textLength / 80);
      return Math.max(lines3 * lineHeight, 20);
  }
}

/**
 * 🎯 Apply smart page breaks using hybrid approach
 */
export function applySmartPageBreaks(element: HTMLElement): HTMLStyleElement {
  console.log('🧠 Applying smart page breaks...');
  
  // STEP 1: CSS Page-Break Properties (80% of cases)
  const style = document.createElement('style');
  style.textContent = `
    .temp-pdf-content {
      background: #ffffff !important;
      color: #000000 !important;
      font-family: ${PDF_CONFIG.FONT_FAMILY} !important;
      font-size: ${PDF_CONFIG.FONT_SIZE}px !important;
      line-height: ${PDF_CONFIG.LINE_HEIGHT} !important;
      max-width: 100% !important;
      margin: 0 !important;
      width: ${PDF_CONFIG.A4_WIDTH}mm !important;
      padding: ${PDF_CONFIG.PADDING_TOP}mm ${PDF_CONFIG.PADDING_RIGHT}mm ${PDF_CONFIG.PADDING_BOTTOM}mm ${PDF_CONFIG.PADDING_LEFT}mm !important;
      
      /* Margem inferior para garantir espaço */
      margin-bottom: ${PDF_CONFIG.PADDING_BOTTOM}mm !important;
      
      /* Box-sizing para controlar melhor as dimensões */
      box-sizing: border-box !important;
    }
    
    /* 📄 SMART PAGE BREAKS - Basic CSS Rules */
    
    /* Headers should never be orphaned at bottom of page */
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
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
      break-after: avoid !important;
      break-inside: avoid !important;
      orphans: 3 !important;
      widows: 3 !important;
    }
    
    /* Major sections should start on new page */
    .temp-pdf-content h1 {
      font-size: 24px !important;
      font-weight: 700 !important;
      border-bottom: 2px solid #cccccc !important;
      padding-bottom: 0.5rem !important;
      margin-bottom: 1.5rem !important;
      page-break-before: auto !important;
      margin-top: 2rem !important;
    }
    
    /* Primeira página - margem superior menor */
    .temp-pdf-content h1:first-child {
      margin-top: 0 !important;
    }
    
    /* Páginas subsequentes - margem superior maior */
    .temp-pdf-content h1:not(:first-child) {
      margin-top: ${PDF_CONFIG.PADDING_TOP_SUBSEQUENT}mm !important;
      page-break-before: always !important;
    }
    
    .temp-pdf-content h2 {
      font-size: 20px !important;
      font-weight: 600 !important;
      margin-top: 2rem !important;
      page-break-before: auto !important;
    }
    
    .temp-pdf-content h3 {
      font-size: 16px !important;
      font-weight: 600 !important;
      margin-top: 1.5rem !important;
    }
    
    /* Tables should never break in the middle */
    .temp-pdf-content table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 1rem 0 !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    .temp-pdf-content th,
    .temp-pdf-content td {
      border: 1px solid #cccccc !important;
      padding: 0.5rem !important;
      text-align: left !important;
      color: #000000 !important;
      font-size: 11px !important;
      page-break-inside: avoid !important;
    }
    
    .temp-pdf-content th {
      background-color: #f5f5f5 !important;
      font-weight: 600 !important;
      color: #2d2d2d !important;
    }
    
    /* Lists should try to stay together */
    .temp-pdf-content ul,
    .temp-pdf-content ol {
      margin-bottom: 1rem !important;
      padding-left: 1.5rem !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    .temp-pdf-content li {
      color: #000000 !important;
      margin-bottom: 0.5rem !important;
      line-height: 1.6 !important;
      page-break-inside: avoid !important;
    }
    
    /* Blockquotes should stay together */
    .temp-pdf-content blockquote {
      border-left: 4px solid #cccccc !important;
      padding-left: 1rem !important;
      margin: 1rem 0 !important;
      color: #666666 !important;
      font-style: italic !important;
      background-color: #fafafa !important;
      padding: 0.75rem 1rem !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    /* Paragraphs with better orphan/widow control */
    .temp-pdf-content p {
      color: #000000 !important;
      margin-bottom: 1rem !important;
      line-height: 1.6 !important;
      text-align: justify !important;
      orphans: 2 !important;
      widows: 2 !important;
    }
    
    /* Text formatting */
    .temp-pdf-content strong {
      color: #000000 !important;
      font-weight: 700 !important;
    }
    
    .temp-pdf-content em {
      color: #2d2d2d !important;
      font-style: italic !important;
    }
    
    .temp-pdf-content ul li::marker {
      color: #666666 !important;
    }
    
    /* Horizontal rules */
    .temp-pdf-content hr {
      border: none !important;
      border-top: 1px solid #cccccc !important;
      margin: 1.5rem 0 !important;
      page-break-after: avoid !important;
    }
    
    /* Special classes for manual control */
    .pdf-keep-together {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    .pdf-new-page {
      page-break-before: always !important;
      break-before: page !important;
    }
    
    .pdf-avoid-break-after {
      page-break-after: avoid !important;
      break-after: avoid !important;
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
  
  // STEP 2: HTML Analysis for Advanced Cases (20% of cases)
  const sections = analyzeContentStructure(element);
  
  sections.forEach((section, index) => {
    const { element: el, type, level, estimatedHeight, nextElements, shouldKeepTogether } = section;
    
    // Apply smart classes based on analysis
    if (type === 'header') {
      // Check if this header + next few elements should stay together
      const nextContentHeight = nextElements
        .slice(0, 2) // First 2 elements after header
        .reduce((sum, nextEl) => sum + estimateElementHeight(nextEl), 0);
      
      if (nextContentHeight < PDF_CONFIG.ORPHAN_THRESHOLD) {
        el.classList.add('pdf-keep-together');
        nextElements.slice(0, 2).forEach(nextEl => {
          nextEl.classList.add('pdf-avoid-break-after');
        });
        console.log(`🔗 Keeping header "${el.textContent?.substring(0, 30)}..." with next content`);
      }
      
      // Major sections (H1, H2) might need new page for better layout
      if (level && level <= 2 && index > 0) {
        const prevSection = sections[index - 1];
        if (prevSection.estimatedHeight < PDF_CONFIG.WIDOW_THRESHOLD) {
          el.classList.add('pdf-new-page');
          console.log(`📄 New page for section "${el.textContent?.substring(0, 30)}..."`);
        }
      }
    }
    
    if (shouldKeepTogether) {
      el.classList.add('pdf-keep-together');
    }
    
    // Special handling for small elements that should be grouped
    if (estimatedHeight < PDF_CONFIG.MIN_SECTION_HEIGHT && nextElements.length > 0) {
      el.classList.add('pdf-avoid-break-after');
      console.log(`🪜 Grouping small element "${el.textContent?.substring(0, 20)}..." with next content`);
    }
  });
  
  // Apply class to element
  element.className = 'temp-pdf-content';
  
  // Apply inline styles for positioning
  element.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    width: ${PDF_CONFIG.A4_WIDTH}mm;
    padding: ${PDF_CONFIG.PADDING_TOP}mm ${PDF_CONFIG.PADDING_RIGHT}mm ${PDF_CONFIG.PADDING_BOTTOM}mm ${PDF_CONFIG.PADDING_LEFT}mm;
    background: #ffffff;
    color: #000000;
    font-family: ${PDF_CONFIG.FONT_FAMILY};
    font-size: ${PDF_CONFIG.FONT_SIZE}px;
    line-height: ${PDF_CONFIG.LINE_HEIGHT};
  `;
  
  console.log(`✅ Smart page breaks applied: ${sections.length} sections analyzed`);
  return style;
}

/**
 * 🎨 Apply PDF-specific styles to HTML element (LEGACY - use applySmartPageBreaks instead)
 */
export function applyPDFStyles(element: HTMLElement): HTMLStyleElement {
  console.warn('⚠️ Using legacy applyPDFStyles - consider upgrading to applySmartPageBreaks');
  return applySmartPageBreaks(element);
}

/**
 * 📄 Calculate PDF dimensions based on canvas
 */
export function calculatePDFDimensions(canvas: HTMLCanvasElement) {
  // Calcular largura considerando margens laterais
  const contentWidth = PDF_CONFIG.A4_WIDTH - (PDF_CONFIG.PADDING_LEFT + PDF_CONFIG.PADDING_RIGHT);
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  // Altura útil por página considerando margens
  const usableHeight = PDF_CONFIG.A4_HEIGHT - (PDF_CONFIG.PADDING_TOP + PDF_CONFIG.PADDING_BOTTOM);
  
  return {
    imgWidth,
    imgHeight,
    pageHeight: usableHeight,
    marginTop: PDF_CONFIG.PADDING_TOP,
    marginLeft: PDF_CONFIG.PADDING_LEFT,
    marginBottom: PDF_CONFIG.PADDING_BOTTOM,
    pagesNeeded: Math.ceil(imgHeight / usableHeight)
  };
}

/**
 * 📑 Add pages to PDF with proper pagination and margins
 */
export function addPagesToPDF(
  pdf: any, // jsPDF instance
  canvas: HTMLCanvasElement,
  dimensions: ReturnType<typeof calculatePDFDimensions>
) {
  const { imgWidth, imgHeight, pageHeight, marginTop, marginLeft } = dimensions;
  const imageData = canvas.toDataURL('image/png');
  
  console.log(`🔍 Debug PDF: imgWidth=${imgWidth}, imgHeight=${imgHeight}, pageHeight=${pageHeight}`);
  
  // Se o conteúdo cabe em uma página
  if (imgHeight <= pageHeight) {
    pdf.addImage(imageData, 'PNG', marginLeft, marginTop, imgWidth, imgHeight);
    console.log(`📄 PDF gerado com 1 página (conteúdo cabe em uma página)`);
    return;
  }
  
  // Múltiplas páginas - dividir o conteúdo
  let remainingHeight = imgHeight;
  let yOffset = 0;
  let pageNumber = 1;
  
  while (remainingHeight > 0) {
    const currentPageHeight = Math.min(remainingHeight, pageHeight);
    
    if (pageNumber > 1) {
      pdf.addPage();
    }
    
    // Calcular posição Y para esta página
    const yPosition = pageNumber === 1 ? marginTop : PDF_CONFIG.PADDING_TOP_SUBSEQUENT;
    
    // Usar clip para mostrar apenas a parte relevante do conteúdo
    // Primeira página: mostrar do topo até pageHeight
    // Páginas subsequentes: mostrar da posição yOffset até yOffset + pageHeight
    const sourceY = yOffset;
    const sourceHeight = currentPageHeight;
    
    // Converter para coordenadas do canvas
    const canvasSourceY = (sourceY / imgHeight) * canvas.height;
    const canvasSourceHeight = (sourceHeight / imgHeight) * canvas.height;
    
    // Criar imagem recortada para esta página
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvasSourceHeight;
      
      // Copiar a seção relevante do canvas original
      tempCtx.drawImage(
        canvas,
        0, canvasSourceY, canvas.width, canvasSourceHeight, // source
        0, 0, canvas.width, canvasSourceHeight // destination
      );
      
      const pageImageData = tempCanvas.toDataURL('image/png');
      
      // Adicionar ao PDF
      pdf.addImage(pageImageData, 'PNG', marginLeft, yPosition, imgWidth, sourceHeight);
    }
    
    yOffset += currentPageHeight;
    remainingHeight -= currentPageHeight;
    pageNumber++;
  }
  
  console.log(`📄 PDF gerado com ${pageNumber - 1} página(s) e margens aplicadas`);
  console.log(`📐 Dimensões: ${imgWidth}x${imgHeight}mm, altura por página: ${pageHeight}mm`);
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