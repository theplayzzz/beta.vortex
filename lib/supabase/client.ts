import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Usamos Clerk para autenticação
  },
})

// Configurações para upload de arquivos
export const STORAGE_BUCKET = 'client-attachments'

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'text/plain',
] as const

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB por arquivo
export const MAX_TOTAL_SIZE = 30 * 1024 * 1024 // 30MB total por cliente

export type AllowedFileType = typeof ALLOWED_FILE_TYPES[number]

// Helper para validar tipo de arquivo
export function isAllowedFileType(type: string): type is AllowedFileType {
  return ALLOWED_FILE_TYPES.includes(type as AllowedFileType)
}

// Helper para formatar tamanho de arquivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper para gerar nome único de arquivo
export function generateUniqueFileName(originalName: string, userId: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, "")
  
  return `${userId}/${timestamp}-${randomString}-${nameWithoutExtension}.${extension}`
} 