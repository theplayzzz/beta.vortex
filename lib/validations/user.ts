import { z } from 'zod'

// Schema base para User
export const UserSchema = z.object({
  id: z.string().cuid(),
  clerkId: z.string(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  profileImageUrl: z.string().url().nullable(),
  creditBalance: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Schema para criação de usuário (sem campos auto-gerados)
export const CreateUserSchema = z.object({
  clerkId: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().url().optional(),
  creditBalance: z.number().int().min(0).default(0),
})

// Schema para atualização de usuário (todos os campos opcionais exceto ID)
export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  profileImageUrl: z.string().url().nullable().optional(),
  creditBalance: z.number().int().min(0).optional(),
})

// Schema para sincronização com Clerk
export const ClerkUserSyncSchema = z.object({
  clerkId: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().url().optional(),
})

// Tipos TypeScript derivados dos schemas
export type User = z.infer<typeof UserSchema>
export type CreateUser = z.infer<typeof CreateUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
export type ClerkUserSync = z.infer<typeof ClerkUserSyncSchema> 