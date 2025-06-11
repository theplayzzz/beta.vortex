import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Função helper para sanitização segura
const safeSanitize = (html: string, options: any) => {
  if (typeof window !== 'undefined' && DOMPurify) {
    return DOMPurify.sanitize(html, options);
  }
  // Fallback básico para server-side rendering
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

/**
 * Configuração personalizada do marked
 */
marked.setOptions({
  breaks: true,           // Quebras de linha automáticas
  gfm: true,             // GitHub Flavored Markdown
  pedantic: false,       // Não seguir pedantemente o original
  silent: false,         // Mostrar erros
});

// Configurar renderer personalizado 
const renderer = new marked.Renderer();

// Customizar headers sem classes (usar estilos nativos)
renderer.heading = function(token: any) {
  const { text, depth } = token;
  return `<h${depth}>${text}</h${depth}>`;
};

// Customizar parágrafos sem classes
renderer.paragraph = function(token: any) {
  const { text } = token;
  return `<p>${text}</p>`;
};

// Customizar listas sem classes
renderer.list = function(token: any) {
  const { items, ordered } = token;
  const tag = ordered ? 'ol' : 'ul';
  const body = items.map((item: any) => `<li>${item.text}</li>`).join('');
  return `<${tag}>${body}</${tag}>`;
};

// Customizar strong/bold sem classes
renderer.strong = function(token: any) {
  const { text } = token;
  return `<strong>${text}</strong>`;
};

// Aplicar renderer personalizado
marked.setOptions({ renderer });

/**
 * Converte markdown para HTML com configurações específicas para propostas
 */
export function convertMarkdownToHtml(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    console.warn('❌ Markdown inválido fornecido para conversão');
    return '<p class="error">Conteúdo da proposta não disponível.</p>';
  }

  try {
    // 🔥 LIMPEZA RIGOROSA DO INPUT
    let cleanMarkdown = markdown
      .trim()
      .replace(/^\s*```markdown\s*/i, '')  // Remove wrapper de código markdown
      .replace(/\s*```\s*$/, '')           // Remove closing de código
      .replace(/^<pre><code[^>]*>/i, '')   // Remove pre/code abertura
      .replace(/<\/code><\/pre>$/i, '')    // Remove pre/code fechamento
      .replace(/^```\s*$/gm, '')           // Remove linhas só com ```
      .trim();

    console.log('🧹 Markdown limpo:', {
      original: markdown.substring(0, 100),
      cleaned: cleanMarkdown.substring(0, 100),
      removedWrappers: markdown !== cleanMarkdown,
      originalLength: markdown.length,
      cleanedLength: cleanMarkdown.length
    });
    
    // 🔥 VERIFICAR SE É REALMENTE MARKDOWN
    const looksLikeMarkdown = cleanMarkdown.includes('#') || 
                             cleanMarkdown.includes('**') || 
                             cleanMarkdown.includes('##') ||
                             cleanMarkdown.includes('---');
    
         if (!looksLikeMarkdown) {
       console.warn('⚠️ Conteúdo não parece ser markdown válido');
       return `<div class="proposal-content"><p>${safeSanitize(cleanMarkdown, {})}</p></div>`;
     }
    
    // 🔥 CONVERTER COM MARKED
    const rawHtml = marked.parse(cleanMarkdown) as string;
    
    // 🔥 VERIFICAR SE CONVERSÃO FOI BEM-SUCEDIDA
    // Verificar se ainda há sintaxe markdown não convertida
    if (rawHtml.includes('**') || rawHtml.includes('```') || rawHtml.includes('<code')) {
      console.error('❌ Conversão falhou - ainda contém sintaxe markdown:', {
        containsBold: rawHtml.includes('**'),
        containsCode: rawHtml.includes('```'),
        containsCodeTag: rawHtml.includes('<code'),
        preview: rawHtml.substring(0, 200)
      });
      // Fallback: tentar conversão manual básica
      return convertMarkdownManually(cleanMarkdown);
    }
    
              // 🔥 SANITIZAR HTML DE FORMA SEGURA
     const sanitizedHtml = String(safeSanitize(rawHtml, {
       ALLOWED_TAGS: [
         'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
         'p', 'ul', 'ol', 'li', 
         'strong', 'em', 'b', 'i',
         'br', 'div', 'span',
         'table', 'thead', 'tbody', 'tr', 'td', 'th',
         'blockquote', 'a', 'hr'
       ],
       ALLOWED_ATTR: ['class', 'href', 'target', 'rel']
     }));

     console.log('✅ Conversão bem-sucedida:', {
       markdownLength: cleanMarkdown.length,
       htmlLength: sanitizedHtml.length,
       startsWithHeader: sanitizedHtml.startsWith('<h1') || sanitizedHtml.startsWith('<h2'),
       containsMarkdownSyntax: sanitizedHtml.includes('#') || sanitizedHtml.includes('**'),
       preview: sanitizedHtml.substring(0, 150) + '...'
     });

     return sanitizedHtml;
    
  } catch (error) {
    console.error('❌ Erro ao converter markdown:', error);
    // Fallback para conversão manual
    return convertMarkdownManually(markdown);
  }
}

/**
 * Conversão manual básica como fallback
 */
function convertMarkdownManually(markdown: string): string {
  console.log('🔧 Usando conversão manual de fallback');
  
  try {
    let html = markdown
      // Headers (ordem importante: ### antes de ##)
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      
      // Bold - múltiplas passadas para garantir conversão completa
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Segunda passada
      
      // Italic (após bold para evitar conflitos)
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Line breaks
      .replace(/---/g, '<hr>')
      
      // Listas simples
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
      
      // Paragraphs (split by double newlines)
      .split('\n\n')
      .map(paragraph => {
        paragraph = paragraph.trim();
        if (!paragraph) return '';
        
        // Skip if already has HTML tags
        if (paragraph.includes('<h') || paragraph.includes('<hr') || paragraph.includes('<ul')) {
          return paragraph;
        }
        
        // Processar bold dentro de parágrafos novamente
        paragraph = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
      })
      .join('\n');

    console.log('✅ Conversão manual concluída:', {
      originalLength: markdown.length,
      htmlLength: html.length,
      preview: html.substring(0, 150) + '...'
    });

         return String(safeSanitize(html, {
       ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'hr'],
       ALLOWED_ATTR: []
     }));
    
  } catch (error) {
    console.error('❌ Erro na conversão manual:', error);
    return `
      <div class="error-container">
        <h3>⚠️ Erro na conversão do conteúdo</h3>
        <p>Exibindo conteúdo original:</p>
                 <div class="original-content">${String(safeSanitize(markdown, {}))}</div>
      </div>
    `;
  }
}

/**
 * Sanitiza HTML para exibição segura (remove scripts, etc.)
 */
export function sanitizeHtml(html: string): string {
  // Remove scripts e tags perigosas
  return String(safeSanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'ul', 'ol', 'li', 
      'strong', 'em', 'b', 'i',
      'br', 'div', 'span',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'blockquote', 'a', 'hr'
    ],
    ALLOWED_ATTR: ['class', 'href', 'target', 'rel']
  }));
}

/**
 * Extrai primeiro parágrafo do markdown como preview
 */
export function extractMarkdownPreview(markdown: string, maxLength: number = 200): string {
  if (!markdown) return '';
  
  // Remove headers e pega primeiro parágrafo
  const firstParagraph = markdown
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .split('\n')
    .find(line => line.trim().length > 0) || '';
    
  return firstParagraph.length > maxLength 
    ? firstParagraph.substring(0, maxLength) + '...'
    : firstParagraph;
} 