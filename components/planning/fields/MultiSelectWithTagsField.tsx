import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Check } from 'lucide-react';

interface MultiSelectWithTagsFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  onBlur: () => void;
  options: string[];
  placeholder?: string;
  allowCustomTags?: boolean;
  hasError?: boolean;
}

export function MultiSelectWithTagsField({ 
  value = [], 
  onChange, 
  onBlur, 
  options, 
  placeholder = "Digite para buscar ou adicionar...",
  allowCustomTags = true,
  hasError = false
}: MultiSelectWithTagsFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calcular posição do dropdown baseado no espaço disponível
  const calculateDropdownPosition = () => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 200; // Altura estimada do dropdown
    
    // Se não há espaço suficiente embaixo, mas há espaço em cima
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }
  };

  // Calcular posição quando abrir dropdown
  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition();
      
      // Recalcular se a janela redimensionar ou scrollar
      const handleResize = () => calculateDropdownPosition();
      const handleScroll = () => {
        // Fechar dropdown se scroll for muito grande
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          // Se o container saiu muito da view, fechar dropdown
          if (rect.top < -100 || rect.bottom > window.innerHeight + 100) {
            closeDropdown();
          }
        }
      };
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);

  // Calcular posição absoluta do dropdown
  const getDropdownStyle = () => {
    if (!containerRef.current) return {};
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calcular largura baseada no conteúdo das tags ou mínimo de 300px
    let dropdownWidth = 300; // Largura mínima padrão
    
    if (tagsContainerRef.current && value.length > 0) {
      // Se há tags, usar largura do container das tags + um pouco mais
      const tagsRect = tagsContainerRef.current.getBoundingClientRect();
      dropdownWidth = Math.max(300, tagsRect.width + 50); // +50px para margem
    } else {
      // Se não há tags, usar largura baseada no campo mas limitada
      dropdownWidth = Math.min(400, containerRect.width * 0.8); // Máximo 80% do container
    }
    
    const topPosition = dropdownPosition === 'top' ? containerRect.top - 200 : containerRect.bottom + 2;
    
    return {
      position: 'fixed' as const,
      left: `${containerRect.left}px`,
      width: `${dropdownWidth}px`,       // Largura calculada baseada nas tags
      top: `${topPosition}px`,
      zIndex: 9999,
      backgroundColor: '#0e0f0f',
      border: '1px solid rgba(249, 251, 252, 0.2)',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      pointerEvents: 'auto' as const,
      maxHeight: '200px',
      overflowY: 'auto' as const,
      borderRadius: '0.5rem',
      minWidth: 'auto',
      maxWidth: 'none',
      boxSizing: 'border-box' as const
    };
  };

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setCustomTag('');
        onBlur();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  // Filtrar opções baseado na busca
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !value.includes(option)
  );

  // Adicionar tag selecionada
  const addTag = (tag: string) => {
    if (!value.includes(tag)) {
      onChange([...value, tag]);
    }
    setSearchTerm('');
    setCustomTag('');
    inputRef.current?.focus();
  };

  // Remover tag
  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  // Adicionar tag personalizada
  const addCustomTag = () => {
    const tag = customTag.trim();
    if (tag && !value.includes(tag) && !options.includes(tag)) {
      addTag(tag);
    }
  };

  // Lidar com teclas
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (customTag.trim()) {
        addCustomTag();
      } else if (filteredOptions.length === 1) {
        addTag(filteredOptions[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      setSearchTerm('');
      setCustomTag('');
    } else if (e.key === 'Backspace' && !searchTerm && !customTag && value.length > 0) {
      // Remover última tag se input estiver vazio
      e.preventDefault();
      removeTag(value[value.length - 1]);
    }
  };

  // Fechar dropdown e limpar estados
  const closeDropdown = () => {
    setIsOpen(false);
    setSearchTerm('');
    setCustomTag('');
    onBlur();
  };

  return (
    <div ref={containerRef} className="relative dropdown-container">
      {/* Campo principal com tags */}
      <div 
        className={`w-full min-h-[48px] px-4 py-3 bg-night rounded-lg text-seasalt cursor-text transition-all duration-200 ${
          hasError 
            ? 'border border-red-500/60 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 shadow-red-500/20' 
            : 'border border-seasalt/20 focus-within:border-sgbus-green focus-within:ring-2 focus-within:ring-sgbus-green/20'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        {/* Tags selecionadas */}
        <div ref={tagsContainerRef} className="flex flex-wrap gap-2 mb-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 bg-sgbus-green/20 text-sgbus-green text-sm rounded-full border border-sgbus-green/30"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="ml-2 hover:bg-sgbus-green/10 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {/* Input de busca */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm || customTag}
          onChange={(e) => {
            const value = e.target.value;
            setSearchTerm(value);
            setCustomTag(value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="w-full bg-transparent border-none outline-none text-seasalt placeholder-periwinkle"
        />
      </div>

      {/* Dropdown com opções */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          {/* Overlay para capturar cliques fora e bloquear interação com elementos atrás */}
          <div 
            className="fixed inset-0"
            style={{
              zIndex: 9998,
              backgroundColor: 'rgba(0, 0, 0, 0.001)', // Background quase invisível mas sólido
              pointerEvents: 'auto',
              cursor: 'default'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeDropdown();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          
          {/* Dropdown */}
          <div 
            ref={dropdownRef}
            className="multiselect-dropdown"
            style={getDropdownStyle()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* Opções filtradas */}
            {filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addTag(option);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="w-full px-4 py-2 text-left text-seasalt hover:bg-eerie-black transition-colors flex items-center justify-between group border-none outline-none cursor-pointer"
                style={{
                  backgroundColor: 'transparent',
                  pointerEvents: 'auto',
                  zIndex: 10000
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a1b23';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span className="truncate">{option}</span>
                <Check className="w-4 h-4 text-sgbus-green opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}

            {/* Opção para adicionar tag personalizada */}
            {allowCustomTags && customTag.trim() && !options.includes(customTag.trim()) && !value.includes(customTag.trim()) && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addCustomTag();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                }}
                className="w-full px-4 py-2 text-left text-periwinkle hover:bg-eerie-black transition-colors flex items-center gap-2 border-t border-seasalt/10 group border-none outline-none cursor-pointer"
                style={{
                  backgroundColor: 'transparent',
                  pointerEvents: 'auto',
                  zIndex: 10000,
                  borderTop: '1px solid rgba(249, 251, 252, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a1b23';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Plus className="w-4 h-4 text-sgbus-green" />
                <span className="truncate">Adicionar &quot;{customTag.trim()}&quot;</span>
              </button>
            )}

            {/* Mensagem quando não há opções */}
            {filteredOptions.length === 0 && (!allowCustomTags || !customTag.trim()) && (
              <div 
                className="px-4 py-2 text-periwinkle text-sm italic"
                style={{
                  backgroundColor: 'transparent',
                  pointerEvents: 'none'
                }}
              >
                Nenhuma opção encontrada
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
} 