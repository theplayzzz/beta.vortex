import { z } from 'zod'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/supabase/client'

// Schema para ClientNote
export const ClientNoteSchema = z.object({
  id: z.string().cuid(),
  content: z.string().min(1, 'Conteúdo da nota é obrigatório'),
  clientId: z.string().cuid(),
  userId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Schema para criação de nota
export const CreateClientNoteSchema = z.object({
  content: z.string().min(1, 'Conteúdo da nota é obrigatório').max(10000, 'Nota muito longa'),
  clientId: z.string().cuid(),
})

// Schema para atualização de nota
export const UpdateClientNoteSchema = z.object({
  content: z.string().min(1, 'Conteúdo da nota é obrigatório').max(10000, 'Nota muito longa'),
})

// Schema para ClientAttachment
export const ClientAttachmentSchema = z.object({
  id: z.string().cuid(),
  fileName: z.string().min(1, 'Nome do arquivo é obrigatório'),
  fileUrl: z.string().url('URL inválida'),
  fileType: z.string().refine(
    (type) => ALLOWED_FILE_TYPES.includes(type as any),
    'Tipo de arquivo não permitido'
  ),
  sizeBytes: z.number().int().min(1).max(MAX_FILE_SIZE, 'Arquivo muito grande'),
  clientId: z.string().cuid(),
  userId: z.string().cuid(),
  createdAt: z.date(),
})

// Schema para upload de arquivo (apenas para validação client-side)
export const UploadFileSchema = z.object({
  clientId: z.string().cuid(),
})

// Schema para validação de múltiplos arquivos (apenas para validação client-side)
export const MultipleFilesSchema = z.object({
  clientId: z.string().cuid(),
})

// Tipos TypeScript derivados
export type ClientNote = z.infer<typeof ClientNoteSchema>
export type CreateClientNote = z.infer<typeof CreateClientNoteSchema>
export type UpdateClientNote = z.infer<typeof UpdateClientNoteSchema>
export type ClientAttachment = z.infer<typeof ClientAttachmentSchema>
export type UploadFile = z.infer<typeof UploadFileSchema>
export type MultipleFiles = z.infer<typeof MultipleFilesSchema> 