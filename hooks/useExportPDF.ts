'use client';

import { useCallback } from 'react';
import { useToast, toast } from '@/components/ui/toast';
import DOMPurify from 'dompurify';
import {
  PDF_CONFIG,
  generatePDFFilename,
  applySmartPageBreaks,
  calculatePDFDimensions,
  addPagesToPDF,
  cleanupPDFElements,
  createGenerationTimeout,
  validateHTMLContent,
  PDFGenerationMonitor,
  classifyPDFError
} from '@/lib/proposals/pdfGenerator';

interface ExportPDFOptions {
  proposal: {
    id: string;
    title: string;
    proposalHtml: string | null;
    proposalMarkdown: string | null;
  };
}

export function useExportPDF() {
  const { addToast } = useToast();

  const exportToPDF = useCallback(async ({ proposal }: ExportPDFOptions) => {
    const monitor = new PDFGenerationMonitor();
    let tempDiv: HTMLElement | null = null;
    let style: HTMLStyleElement | null = null;

    try {
      monitor.start();
      
      // 🔄 Loading state
      addToast(toast.info(
        'Gerando PDF',
        'Preparando documento para download...'
      ));

      // 🔍 Content Processing Pipeline - FOCO NO HTML
      const validatedHTML = validateHTMLContent(proposal.proposalHtml);
      monitor.step('Content validation');

      // 📚 Dynamic import management
      const [jsPDF, html2canvas] = await Promise.all([
        import('jspdf').then(mod => mod.jsPDF),
        import('html2canvas').then(mod => mod.default)
      ]);
      monitor.step('Dependencies loaded');

      // 🧹 HTML content validation & sanitization
      const sanitizedHTML = DOMPurify.sanitize(validatedHTML, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'ul', 'ol', 'li', 
          'strong', 'em', 'b', 'i',
          'br', 'div', 'span',
          'table', 'thead', 'tbody', 'tr', 'td', 'th',
          'blockquote', 'a', 'hr'
        ],
        ALLOWED_ATTR: ['class', 'href', 'target', 'rel']
      });

      if (!sanitizedHTML.trim()) {
        throw new Error('Conteúdo HTML inválido após sanitização');
      }
      monitor.step('HTML sanitization');

      // 🎨 HTML Rendering for PDF - Criar elemento temporário invisível
      tempDiv = document.createElement('div');
      tempDiv.innerHTML = sanitizedHTML;
      
      // 🧠 Apply Smart Page Breaks (CSS + HTML Analysis)
      style = applySmartPageBreaks(tempDiv);
      document.head.appendChild(style);
      document.body.appendChild(tempDiv);
      monitor.step('Smart page breaks applied');

      // ⏱️ Timeout handler
      const timeoutPromise = createGenerationTimeout();

      try {
        // 🖼️ Canvas Generation com configurações otimizadas
        const canvas = await Promise.race([
          html2canvas(tempDiv, {
            ...PDF_CONFIG.CANVAS_CONFIG,
            width: tempDiv.scrollWidth,
            height: tempDiv.scrollHeight,
          }),
          timeoutPromise
        ]);
        monitor.step('Canvas generation');

        // 📄 PDF Assembly - Dimensões A4
        const pdf = new jsPDF('p', 'mm', 'a4');
        const dimensions = calculatePDFDimensions(canvas);
        
        // 📑 Add pages with proper pagination
        addPagesToPDF(pdf, canvas, dimensions);
        monitor.step('PDF assembly');

        // 📁 File Naming Strategy
        const fileName = generatePDFFilename(proposal.title);

        // 💾 Fazer download
        pdf.save(fileName);
        monitor.step('Download initiated');

        // ✅ Success feedback
        addToast(toast.success(
          'PDF exportado',
          'Download iniciado com quebras de página inteligentes!'
        ));

      } catch (canvasError) {
        monitor.step('Primary generation failed');
        
        // 🔄 Retry com configurações simplificadas
        console.warn('Primeira tentativa falhou, tentando configurações simplificadas...', canvasError);
        
        try {
          const canvas = await html2canvas(tempDiv, PDF_CONFIG.CANVAS_CONFIG_SIMPLE);
          
          const pdf = new jsPDF('p', 'mm', 'a4');
          const dimensions = calculatePDFDimensions(canvas);
          addPagesToPDF(pdf, canvas, dimensions);

          const fileName = generatePDFFilename(proposal.title);
          pdf.save(fileName);

          addToast(toast.success(
            'PDF exportado',
            'Download iniciado (qualidade reduzida mas com quebras inteligentes)'
          ));
          monitor.step('Fallback generation succeeded');

        } catch (retryError) {
          console.error('Retry também falhou:', retryError);
          monitor.step('Fallback generation failed');
          
          // 🖨️ Fallback para window.print()
          addToast(toast.info(
            'Fallback ativado',
            'Abrindo janela de impressão...'
          ));
          
          setTimeout(() => {
            window.print();
          }, 500);
        }
      }

    } catch (error: any) {
      console.error('Erro ao exportar PDF:', error);
      
      // ❌ Error handling com mensagens específicas
      const { userMessage } = classifyPDFError(error);

      addToast(toast.error(
        'Erro ao exportar PDF',
        userMessage
      ));
    } finally {
      // 🧹 Memory cleanup - Limpeza obrigatória de elementos DOM temporários
      cleanupPDFElements([tempDiv, style]);
      monitor.finish();
    }
  }, [addToast]);

  return { exportToPDF };
} 