'use client';

import { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Eye, Code, FileText } from 'lucide-react';

interface ContentRendererProps {
  htmlContent?: string | null;
  markdownContent?: string | null;
}

export function ContentRenderer({ htmlContent, markdownContent }: ContentRendererProps) {
  // 🔥 PRIORIDADE: HTML PROCESSADO PRIMEIRO
  const contentToRender = htmlContent || markdownContent;
  const renderMode = htmlContent ? 'html' : 'markdown';
  const [viewMode, setViewMode] = useState<'html' | 'markdown'>('html'); // Sempre começar com visualização normal

  const sanitizedHTML = useMemo(() => {
    if (!contentToRender) return '';
    
    // Se é HTML processado, usar diretamente
    if (renderMode === 'html' && htmlContent) {
      const sanitized = DOMPurify.sanitize(htmlContent, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
          'p', 'ul', 'ol', 'li', 
          'strong', 'em', 'br', 'div', 'span',
          'table', 'thead', 'tbody', 'tr', 'td', 'th',
          'blockquote', 'a', 'img', 'hr'
        ],
        ALLOWED_ATTR: ['class', 'style', 'href', 'src', 'alt', 'title']
      });

      console.log('🎨 ContentRenderer - HTML sanitizado:', {
        original: htmlContent.substring(0, 100),
        sanitized: sanitized.substring(0, 100),
        hasMarkdownSyntax: sanitized.includes('#') || sanitized.includes('**'),
        startsWithHTML: sanitized.startsWith('<')
      });

      return sanitized;
    }
    
    return '';
  }, [contentToRender, renderMode, htmlContent]);

  // Se não há conteúdo
  if (!htmlContent && !markdownContent) {
    return (
      <div className="bg-white rounded-lg p-8 border border-accent/20 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Conteúdo não disponível</h3>
        <p className="text-gray-600">
          Esta proposta ainda não possui conteúdo gerado pela IA.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle entre Visualização Normal e Markdown */}
      {(htmlContent || markdownContent) && (
        <div className="flex items-center gap-2 p-1 bg-eerie-black rounded-lg border border-accent/20 w-fit">
          <button
            onClick={() => setViewMode('html')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'html'
                ? 'bg-sgbus-green text-night'
                : 'text-seasalt/70 hover:text-seasalt'
            }`}
          >
            <Eye className="h-4 w-4" />
            Visualização
          </button>
          <button
            onClick={() => setViewMode('markdown')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'markdown'
                ? 'bg-sgbus-green text-night'
                : 'text-seasalt/70 hover:text-seasalt'
            }`}
          >
            <Code className="h-4 w-4" />
            Markdown
          </button>
        </div>
      )}

      {/* Conteúdo Renderizado */}
      {viewMode === 'html' ? (
        // 🎨 VISUALIZAÇÃO NORMAL: Fundo branco, texto preto, HTML formatado
        <div className="bg-white rounded-lg border border-accent/20 overflow-hidden shadow-lg">
          {htmlContent && sanitizedHTML ? (
            <div 
              className="proposal-content-normal prose prose-lg max-w-none p-8"
              dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
            />
          ) : markdownContent ? (
            // Fallback: renderizar markdown como HTML se não há HTML processado
            <div className="proposal-content-normal prose prose-lg max-w-none p-8">
              <div dangerouslySetInnerHTML={{ 
                __html: markdownContent
                  .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                  .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                  .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/---/g, '<hr>')
                  .split('\n\n')
                  .map(p => p.trim() ? `<p>${p.replace(/\n/g, '<br>')}</p>` : '')
                  .join('')
              }} />
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="error-container">
                <h3>⚠️ Conteúdo em formato inesperado</h3>
                <p>Exibindo conteúdo original:</p>
                <div className="original-content">{contentToRender}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // 🌙 VISUALIZAÇÃO MARKDOWN: Fundo dark, código markdown bruto
        <div className="bg-gray-900 rounded-lg border border-accent/20 overflow-hidden shadow-lg">
          <div className="p-6">
            {/* Header do código */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Código Markdown</span>
              </div>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>
            
            {/* Conteúdo markdown bruto */}
            <pre className="text-sm text-gray-300 font-mono leading-relaxed overflow-x-auto">
              <code className="language-markdown">
                {markdownContent || htmlContent || 'Conteúdo não disponível'}
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 