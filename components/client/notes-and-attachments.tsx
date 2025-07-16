"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Plus,
  Download,
  Eye,
  Paperclip,
  MessageSquare,
  Calendar,
  User,
  Loader2,
  AlertCircle
} from "lucide-react";
import { formatFileSize } from "@/lib/supabase/client";
import { useDebounce } from "use-debounce";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  sizeBytes: number;
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

interface NotesAndAttachmentsProps {
  clientId: string;
}

export default function NotesAndAttachments({ clientId }: NotesAndAttachmentsProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notesRes, attachmentsRes] = await Promise.all([
        fetch(`/api/clients/${clientId}/notes`),
        fetch(`/api/clients/${clientId}/attachments`)
      ]);

      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData.notes || []);
      }

      if (attachmentsRes.ok) {
        const attachmentsData = await attachmentsRes.json();
        setAttachments(attachmentsData.attachments || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Criar nova nota
  const handleCreateNote = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newNote }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotes([data.note, ...notes]);
        setNewNote("");
      }
    } catch (error) {
      console.error('Erro ao criar nota:', error);
    }
  };

  // Editar nota
  const handleEditNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editContent }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(notes.map(note => 
          note.id === noteId ? data.note : note
        ));
        setEditingNote(null);
        setEditContent("");
      }
    } catch (error) {
      console.error('Erro ao editar nota:', error);
    }
  };

  // Deletar nota
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta nota?')) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotes(notes.filter(note => note.id !== noteId));
      }
    } catch (error) {
      console.error('Erro ao deletar nota:', error);
    }
  };

  // Upload de arquivos
  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`/api/clients/${clientId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAttachments([...data.attachments, ...attachments]);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao fazer upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload dos arquivos');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Deletar anexo
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Tem certeza que deseja deletar este anexo?')) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAttachments(attachments.filter(att => att.id !== attachmentId));
      }
    } catch (error) {
      console.error('Erro ao deletar anexo:', error);
    }
  };

  // Filtrar notas por busca
  const filteredNotes = notes.filter(note =>
    note.content.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('text')) return '📄';
    return '📎';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sgbus-green" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Seção de Notas */}
      <div className="bg-eerie-black rounded-xl border border-seasalt/10">
        <div className="p-4 border-b border-seasalt/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-sgbus-green" />
              <h3 className="text-lg font-semibold text-seasalt">Notas</h3>
              <span className="px-2 py-1 bg-sgbus-green/20 text-sgbus-green text-sm rounded-full">
                {notes.length}
              </span>
            </div>
          </div>

          {/* Busca nas notas */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar nas notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
            />
          </div>

          {/* Nova nota */}
          <div className="space-y-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Adicionar nova nota..."
              rows={3}
              className="w-full px-4 py-2.5 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20 resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleCreateNote}
                disabled={!newNote.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-3 h-3" />
                Adicionar Nota
              </button>
            </div>
          </div>
        </div>

        {/* Lista de notas */}
        <div className="p-4">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-periwinkle">
              {searchTerm ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-night rounded-lg border border-seasalt/10 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-sgbus-green/20 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-sgbus-green" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-seasalt">
                            {note.user.firstName} {note.user.lastName}
                          </p>
                          <p className="text-[10px] text-periwinkle">
                            {formatDate(note.createdAt)}
                            {note.updatedAt !== note.createdAt && ' (editado)'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingNote(note.id);
                            setEditContent(note.content);
                          }}
                          className="p-0.5 text-periwinkle hover:text-sgbus-green transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 text-periwinkle hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {editingNote === note.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 bg-eerie-black border border-seasalt/20 rounded-lg text-seasalt focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20 resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingNote(null);
                              setEditContent("");
                            }}
                            className="px-3 py-1 text-periwinkle hover:text-seasalt transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleEditNote(note.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-sgbus-green text-night rounded hover:bg-sgbus-green/90 transition-colors"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-seasalt whitespace-pre-wrap">{note.content}</p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Anexos */}
      <div className="bg-eerie-black rounded-xl border border-seasalt/10">
        <div className="p-4 border-b border-seasalt/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Paperclip className="w-5 h-5 text-sgbus-green" />
              <h3 className="text-lg font-semibold text-seasalt">Anexos</h3>
              <span className="px-2 py-1 bg-sgbus-green/20 text-sgbus-green text-sm rounded-full">
                {attachments.length}
              </span>
            </div>
          </div>

          {/* Upload de arquivos */}
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              {uploading ? 'Enviando...' : 'Enviar Arquivos'}
            </button>
            <p className="text-xs text-periwinkle">
              Tipos permitidos: PDF, DOC, DOCX, JPG, PNG, TXT • Máx 25MB por arquivo • 30MB total
            </p>
          </div>
        </div>

        {/* Lista de anexos */}
        <div className="p-4">
          {attachments.length === 0 ? (
            <div className="text-center py-8 text-periwinkle">
              Nenhum anexo ainda
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {attachments.map((attachment) => (
                  <motion.div
                    key={attachment.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-night rounded-lg border border-seasalt/10 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon(attachment.fileType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-seasalt truncate">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-periwinkle">
                            {formatFileSize(attachment.sizeBytes)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-periwinkle hover:text-sgbus-green transition-colors"
                        >
                          <Download className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          className="p-1 text-periwinkle hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-periwinkle">
                      <p>Enviado em {formatDate(attachment.createdAt)}</p>
                      <p>por {attachment.user.firstName} {attachment.user.lastName}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 