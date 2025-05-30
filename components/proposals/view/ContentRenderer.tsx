'use client';

import { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import { Eye, Code, FileText } from 'lucide-react';

interface ContentRendererProps {
  htmlContent?: string | null;
  markdownContent?: string | null;
}

export function ContentRenderer({ htmlContent, markdownContent }: ContentRendererProps) {
  const [viewMode, setViewMode] = useState<'html' | 'markdown'>('html');

  const sanitizedHTML = useMemo(() => {
    if (!htmlContent) return '';
    return DOMPurify.sanitize(htmlContent, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'p', 'ul', 'ol', 'li', 
        'strong', 'em', 'br', 'div', 'span',
        'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'blockquote', 'a', 'img'
      ],
      ALLOWED_ATTR: ['class', 'style', 'href', 'src', 'alt', 'title']
    });
  }, [htmlContent]);

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
      {/* Toggle entre HTML e Markdown */}
      {htmlContent && markdownContent && (
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
      <div className="bg-white rounded-lg border border-accent/20 overflow-hidden">
        {viewMode === 'html' && htmlContent ? (
          <div 
            className="prose prose-lg max-w-none p-8"
            dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
            style={{
              color: '#1f2937',
              lineHeight: '1.7',
            }}
          />
        ) : markdownContent ? (
          <div className="prose prose-lg max-w-none p-8 text-gray-700">
            <ReactMarkdown>
              {markdownContent}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Conteúdo não disponível neste formato
          </div>
        )}
      </div>
    </div>
  );
} 