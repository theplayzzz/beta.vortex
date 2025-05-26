"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Users, 
  FileText, 
  Paperclip, 
  Building, 
  Calendar,
  ArrowRight,
  Loader2,
  X
} from "lucide-react";
import Link from "next/link";
import { useDebounce } from "use-debounce";

interface SearchResult {
  id: string;
  type: 'client' | 'note' | 'attachment';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  metadata?: {
    clientName?: string;
    createdAt?: string;
    richnessScore?: number;
    fileType?: string;
    sizeBytes?: number;
  };
}

interface GlobalSearchProps {
  className?: string;
}

export default function GlobalSearch({ className = "" }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Debounce da busca
  const [debouncedQuery] = useDebounce(query, 300);

  // Buscar resultados
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const searchGlobal = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error('Erro na busca global:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchGlobal();
  }, [debouncedQuery]);

  // Atalho de teclado Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery("");
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navegação por teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const result = results[selectedIndex];
        if (result) {
          window.location.href = result.url;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Users className="w-4 h-4 text-sgbus-green" />;
      case 'note':
        return <FileText className="w-4 h-4 text-yellow-400" />;
      case 'attachment':
        return <Paperclip className="w-4 h-4 text-periwinkle" />;
      default:
        return <Search className="w-4 h-4 text-seasalt" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-sgbus-green/30 text-sgbus-green">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className={`flex items-center gap-3 px-4 py-2 bg-night border border-seasalt/20 rounded-lg text-periwinkle hover:border-sgbus-green/50 transition-colors ${className}`}
      >
        <Search className="w-4 h-4" />
        <span className="text-sm">Buscar...</span>
        <div className="ml-auto flex items-center gap-1 text-xs">
          <kbd className="px-1.5 py-0.5 bg-seasalt/10 rounded text-seasalt">⌘</kbd>
          <kbd className="px-1.5 py-0.5 bg-seasalt/10 rounded text-seasalt">K</kbd>
        </div>
      </button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
          >
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="w-full max-w-2xl mx-4 bg-eerie-black border border-seasalt/10 rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-seasalt/10">
                <Search className="w-5 h-5 text-periwinkle" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar clientes, notas, anexos..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(-1);
                  }}
                  className="flex-1 bg-transparent text-seasalt placeholder-periwinkle focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setSelectedIndex(-1);
                    }}
                    className="p-1 hover:bg-seasalt/10 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-periwinkle" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-seasalt/10 rounded transition-colors"
                >
                  <kbd className="px-2 py-1 bg-seasalt/10 rounded text-xs text-seasalt">ESC</kbd>
                </button>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-sgbus-green" />
                  </div>
                ) : results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result, index) => (
                      <Link
                        key={result.id}
                        href={result.url}
                        onClick={() => setIsOpen(false)}
                        className={`block px-4 py-3 hover:bg-seasalt/5 transition-colors ${
                          index === selectedIndex ? 'bg-seasalt/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getResultIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-medium text-seasalt truncate">
                                {highlightMatch(result.title, query)}
                              </h3>
                              <ArrowRight className="w-3 h-3 text-periwinkle flex-shrink-0" />
                            </div>
                            
                            {result.subtitle && (
                              <p className="text-xs text-periwinkle mb-1">
                                {highlightMatch(result.subtitle, query)}
                              </p>
                            )}
                            
                            {result.description && (
                              <p className="text-xs text-seasalt/70 line-clamp-2">
                                {highlightMatch(result.description, query)}
                              </p>
                            )}
                            
                            {/* Metadata */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-periwinkle">
                              {result.metadata?.clientName && (
                                <span className="flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {result.metadata.clientName}
                                </span>
                              )}
                              {result.metadata?.createdAt && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(result.metadata.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                              {result.metadata?.richnessScore !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  result.metadata.richnessScore >= 80 ? 'bg-sgbus-green/20 text-sgbus-green' :
                                  result.metadata.richnessScore >= 50 ? 'bg-yellow-400/20 text-yellow-400' :
                                  'bg-red-400/20 text-red-400'
                                }`}>
                                  {result.metadata.richnessScore}%
                                </span>
                              )}
                              {result.metadata?.sizeBytes && (
                                <span>{formatFileSize(result.metadata.sizeBytes)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : query.trim().length >= 2 ? (
                  <div className="text-center py-8">
                    <Search className="w-8 h-8 text-periwinkle mx-auto mb-3" />
                    <p className="text-seasalt mb-1">Nenhum resultado encontrado</p>
                    <p className="text-xs text-periwinkle">
                      Tente usar termos diferentes ou verifique a ortografia
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-8 h-8 text-periwinkle mx-auto mb-3" />
                    <p className="text-seasalt mb-1">Comece a digitar para buscar</p>
                    <p className="text-xs text-periwinkle">
                      Busque por clientes, notas, anexos e muito mais
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {results.length > 0 && (
                <div className="px-4 py-3 border-t border-seasalt/10 bg-night/50">
                  <div className="flex items-center justify-between text-xs text-periwinkle">
                    <span>{results.length} resultado(s) encontrado(s)</span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-seasalt/10 rounded">↑↓</kbd>
                        navegar
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-seasalt/10 rounded">↵</kbd>
                        abrir
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 