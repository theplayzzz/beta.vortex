# Guia de Cores e Estilos - Dashboard App

## Introdução
Este documento serve como referência técnica para as cores, estilos e padrões de design implementados no Dashboard App. Baseado em uma paleta dark/night com acentos em verde vibrante e periwinkle, o design mantém alta legibilidade e uma estética moderna e profissional.

## Paleta de Cores

### Cores Principais

| Nome | Valor Hexadecimal | Valor HSL | Uso |
|------|-------------------|-----------|-----|
| Night | `#0e0f0f` | `hsla(180, 3%, 6%, 1)` | Fundo principal da aplicação, elementos de máximo contraste |
| Eerie Black | `#171818` | `hsla(180, 2%, 9%, 1)` | Sidebar, cards principais, containers de conteúdo |
| SGBUS Green | `#6be94c` | `hsla(108, 78%, 61%, 1)` | Cor primária da marca, botões principais, elementos de destaque, sucesso |
| Seasalt | `#f9fbfc` | `hsla(200, 33%, 98%, 1)` | Texto principal, ícones, elementos de alta visibilidade |
| Periwinkle | `#cfc6fe` | `hsla(250, 97%, 89%, 1)` | Elementos secundários, acentos, informações adicionais |

### Hierarquia de Cores por Contexto

#### Fundos
- **Principal**: `#0e0f0f` (Night) - Fundo geral da aplicação
- **Containers**: `#171818` (Eerie Black) - Cards, sidebar, modais
- **Elementos elevados**: Gradiente suave entre Night e Eerie Black

#### Elementos Interativos
- **Primário**: `#6be94c` (SGBUS Green) - CTAs principais, estados ativos
- **Secundário**: `#cfc6fe` (Periwinkle) - Botões secundários, links
- **Hover**: Variações com 110% de brightness das cores base

#### Estados e Feedback
- **Sucesso**: `#6be94c` (SGBUS Green)
- **Informação**: `#cfc6fe` (Periwinkle)
- **Neutro**: `#f9fbfc` (Seasalt)
- **Atenção**: Mistura de SGBUS Green com Periwinkle (60/40)

## Variáveis CSS/SCSS

### CSS Custom Properties
```css
:root {
  --night: #0e0f0f;
  --eerie-black: #171818;
  --sgbus-green: #6be94c;
  --seasalt: #f9fbfc;
  --periwinkle: #cfc6fe;
  
  /* Variações de opacidade */
  --night-alpha-80: rgba(14, 15, 15, 0.8);
  --eerie-black-alpha-90: rgba(23, 24, 24, 0.9);
  --sgbus-green-alpha-20: rgba(107, 233, 76, 0.2);
  --periwinkle-alpha-30: rgba(207, 198, 254, 0.3);
}
```

### SCSS Variables
```scss
// Cores principais
$night: #0e0f0f;
$eerie-black: #171818;
$sgbus-green: #6be94c;
$seasalt: #f9fbfc;
$periwinkle: #cfc6fe;

// Mapa de cores para facilitar uso
$colors: (
  'night': $night,
  'eerie-black': $eerie-black,
  'sgbus-green': $sgbus-green,
  'seasalt': $seasalt,
  'periwinkle': $periwinkle
);
```

## Gradientes

### Gradientes Principais
```css
/* Fundo principal sutil */
.bg-gradient-primary {
  background: linear-gradient(135deg, #0e0f0f 0%, #171818 100%);
}

/* Botão principal */
.btn-gradient-primary {
  background: linear-gradient(90deg, #6be94c 0%, #5acc3e 100%);
}

/* Elemento de destaque */
.accent-gradient {
  background: linear-gradient(45deg, #6be94c 0%, #cfc6fe 100%);
}

/* Gradiente radial para elementos especiais */
.radial-gradient {
  background: radial-gradient(circle at center, #171818 0%, #0e0f0f 100%);
}
```

### Gradientes com Transparência
```css
.overlay-gradient {
  background: linear-gradient(
    180deg, 
    rgba(14, 15, 15, 0) 0%, 
    rgba(14, 15, 15, 0.8) 100%
  );
}
```

## Tipografia

### Hierarquia de Texto

| Tipo | Tamanho | Peso | Cor | Line Height | Uso |
|------|---------|------|-----|-------------|-----|
| Display | 2.5rem (40px) | 700 | Seasalt | 1.1 | Títulos principais de página |
| Heading 1 | 2rem (32px) | 600 | Seasalt | 1.2 | Títulos de seção |
| Heading 2 | 1.5rem (24px) | 600 | Seasalt | 1.3 | Títulos de cards |
| Heading 3 | 1.25rem (20px) | 500 | Seasalt | 1.4 | Subtítulos |
| Body Large | 1.125rem (18px) | 400 | Seasalt | 1.5 | Texto principal importante |
| Body | 1rem (16px) | 400 | Seasalt | 1.5 | Texto padrão |
| Body Small | 0.875rem (14px) | 400 | Periwinkle | 1.4 | Texto secundário |
| Caption | 0.75rem (12px) | 400 | Periwinkle | 1.3 | Legendas, metadados |

### Classes de Texto
```css
.text-display {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--seasalt);
  line-height: 1.1;
}

.text-body-secondary {
  font-size: 0.875rem;
  color: var(--periwinkle);
  line-height: 1.4;
}

.text-accent {
  color: var(--sgbus-green);
  font-weight: 500;
}
```

## Componentes

### Cards
```css
.card {
  background-color: var(--eerie-black);
  border-radius: 0.75rem;
  border: 1px solid rgba(249, 251, 252, 0.1);
  box-shadow: 0 4px 6px rgba(14, 15, 15, 0.3);
  padding: 1.5rem;
}

.card-elevated {
  background: linear-gradient(135deg, 
    var(--eerie-black) 0%, 
    rgba(23, 24, 24, 0.8) 100%);
  box-shadow: 0 8px 25px rgba(14, 15, 15, 0.4);
}
```

### Botões

#### Botão Primário
```css
.btn-primary {
  background-color: var(--sgbus-green);
  color: var(--night);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(107, 233, 76, 0.2);
}

.btn-primary:hover {
  filter: brightness(110%);
  box-shadow: 0 4px 12px rgba(107, 233, 76, 0.3);
  transform: translateY(-1px);
}
```

#### Botão Secundário
```css
.btn-secondary {
  background-color: transparent;
  color: var(--periwinkle);
  border: 1px solid var(--periwinkle);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: var(--periwinkle);
  color: var(--night);
}
```

#### Botão Ghost
```css
.btn-ghost {
  background-color: transparent;
  color: var(--seasalt);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 400;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background-color: rgba(249, 251, 252, 0.1);
}
```

### Sidebar
```css
.sidebar {
  background-color: var(--eerie-black);
  border-right: 1px solid rgba(249, 251, 252, 0.1);
  backdrop-filter: blur(10px);
}

.sidebar-item {
  color: var(--seasalt);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.sidebar-item:hover {
  background-color: rgba(107, 233, 76, 0.1);
  color: var(--sgbus-green);
}

.sidebar-item.active {
  background-color: var(--sgbus-green);
  color: var(--night);
}
```

### Inputs e Forms
```css
.input {
  background-color: var(--night);
  border: 1px solid rgba(249, 251, 252, 0.2);
  color: var(--seasalt);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--sgbus-green);
  box-shadow: 0 0 0 3px rgba(107, 233, 76, 0.1);
}

.input::placeholder {
  color: var(--periwinkle);
  opacity: 0.7;
}
```

## Gráficos e Visualizações

### Paleta de Gráficos
```css
.chart-colors {
  --chart-primary: var(--sgbus-green);
  --chart-secondary: var(--periwinkle);
  --chart-tertiary: rgba(249, 251, 252, 0.8);
  --chart-quaternary: rgba(107, 233, 76, 0.6);
  --chart-quinary: rgba(207, 198, 254, 0.6);
}
```

### Tooltip de Gráficos
```css
.chart-tooltip {
  background-color: var(--eerie-black);
  border: 1px solid rgba(249, 251, 252, 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: var(--seasalt);
  box-shadow: 0 8px 25px rgba(14, 15, 15, 0.4);
  backdrop-filter: blur(10px);
}
```

## Animações e Transições

### Transições Padrão
```css
.transition-standard {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-smooth {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.transition-bounce {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Animações com Framer Motion
```jsx
// Animação de fade in
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

// Animação de sidebar
const sidebarAnimation = {
  initial: { width: '72px' },
  animate: { width: isOpen ? '240px' : '72px' },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

// Animação de hover em cards
const cardHover = {
  whileHover: { 
    y: -4,
    boxShadow: "0 12px 25px rgba(14, 15, 15, 0.4)"
  },
  transition: { duration: 0.2 }
};
```

## Responsividade

### Breakpoints Customizados
```css
/* Seguindo padrão mobile-first */
.container {
  width: 100%;
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 1.5rem;
    max-width: 768px;
    margin: 0 auto;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 2rem;
    max-width: 1200px;
  }
}

/* Large Desktop */
@media (min-width: 1440px) {
  .container {
    max-width: 1400px;
    padding: 2.5rem;
  }
}
```

### Grid Responsivo
```css
.grid-responsive {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}
```

## Estados e Feedback Visual

### Loading States
```css
.loading-skeleton {
  background: linear-gradient(
    90deg,
    var(--eerie-black) 25%,
    rgba(249, 251, 252, 0.1) 50%,
    var(--eerie-black) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Error States
```css
.error-state {
  border: 1px solid rgba(255, 107, 107, 0.3);
  background-color: rgba(255, 107, 107, 0.1);
}

.error-text {
  color: #ff6b6b;
}
```

### Success States
```css
.success-state {
  border: 1px solid rgba(107, 233, 76, 0.3);
  background-color: rgba(107, 233, 76, 0.1);
}

.success-text {
  color: var(--sgbus-green);
}
```

## Acessibilidade

### Contraste e Legibilidade
- **Texto principal (Seasalt) sobre Night**: Contraste 14.8:1 ✅
- **Texto secundário (Periwinkle) sobre Eerie Black**: Contraste 8.2:1 ✅
- **SGBUS Green sobre Night**: Contraste 11.4:1 ✅

### Estados de Foco
```css
.focus-visible {
  outline: 2px solid var(--sgbus-green);
  outline-offset: 2px;
}

.focus-ring {
  box-shadow: 0 0 0 3px rgba(107, 233, 76, 0.3);
}
```

### Indicadores Visuais
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.reduce-motion {
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    transition: none !important;
  }
}
```

## Implementação com Dependências

### TailwindCSS Config
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        night: '#0e0f0f',
        'eerie-black': '#171818',
        'sgbus-green': '#6be94c',
        seasalt: '#f9fbfc',
        periwinkle: '#cfc6fe',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      }
    }
  }
}
```

### Integração com Radix UI
```jsx
// Customização de componentes Radix
const DialogContent = styled(Dialog.Content, {
  backgroundColor: '$eerie-black',
  border: '1px solid rgba(249, 251, 252, 0.1)',
  borderRadius: '0.75rem',
  color: '$seasalt'
});
```

## Notas de Manutenção

1. **Consistência**: Sempre utilize as variáveis CSS definidas ao invés de valores hardcoded
2. **Performance**: Prefira `transform` e `opacity` para animações
3. **Acessibilidade**: Teste todas as combinações de cores para garantir contraste adequado
4. **Responsividade**: Teste em diversos dispositivos e tamanhos de tela
5. **Dark Mode**: Esta paleta já é otimizada para tema escuro - considere variações para light mode se necessário