'use client'

import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { ApprovalStatus, ModerationAction } from '@prisma/client'
import { useToast, toast } from '@/components/ui/toast'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Filter,
  Loader2,
  Eye,
  UserCheck,
  UserX,
  UserMinus,
  Calendar,
  CreditCard,
  Mail,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Unlock
} from 'lucide-react'

interface User {
  id: string
  clerkId: string
  email: string
  firstName: string | null
  lastName: string | null
  profileImageUrl: string | null
  approvalStatus: ApprovalStatus
  creditBalance: number
  createdAt: string
  approvedAt: string | null
  approvedBy: string | null
  rejectedAt: string | null
  rejectedBy: string | null
  rejectionReason: string | null
  version: number
}

interface ModerationLog {
  id: string
  action: ModerationAction
  previousStatus: ApprovalStatus
  newStatus: ApprovalStatus
  reason: string | null
  createdAt: string
  User: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  }
  Moderator: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  }
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

export default function ModeratePage() {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  const { addToast } = useToast()
  
  const [users, setUsers] = useState<User[]>([])
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([])
  const [usersPagination, setUsersPagination] = useState<PaginationInfo>({
    page: 1, limit: 20, totalCount: 0, totalPages: 0
  })
  const [logsPagination, setLogsPagination] = useState<PaginationInfo>({
    page: 1, limit: 20, totalCount: 0, totalPages: 0
  })
  
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'ALL'>('PENDING')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [moderatingUserId, setModeratingUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users')

  // Verificar se é admin
  const isAdmin = user?.publicMetadata?.role === 'ADMIN' || 
                 user?.publicMetadata?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (isLoaded && userId && isAdmin) {
      loadUsers()
      loadModerationLogs()
    }
  }, [isLoaded, userId, isAdmin, statusFilter, searchTerm, usersPagination.page])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: usersPagination.page.toString(),
        limit: usersPagination.limit.toString(),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Erro ao carregar usuários')

      const data = await response.json()
      setUsers(data.users)
      setUsersPagination(data.pagination)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      addToast(toast.error('Erro ao carregar usuários', 'Tente novamente em alguns momentos'))
    } finally {
      setLoading(false)
    }
  }

  const loadModerationLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: logsPagination.page.toString(),
        limit: logsPagination.limit.toString()
      })

      const response = await fetch(`/api/admin/moderation-log?${params}`)
      if (!response.ok) throw new Error('Erro ao carregar logs')

      const data = await response.json()
      setModerationLogs(data.logs)
      setLogsPagination(data.pagination)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
      addToast(toast.error('Erro ao carregar histórico', 'Verifique sua conexão'))
    }
  }

  const moderateUser = async (userId: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'UNSUSPEND_TO_APPROVED' | 'UNSUSPEND_TO_PENDING', reason?: string) => {
    const targetUser = users.find(u => u.id === userId)
    if (!targetUser) return

    setModeratingUserId(userId)
    
    try {
      // Usar clerkId para a chamada à API, pois a rota espera o clerkId
      const response = await fetch(`/api/admin/users/${targetUser.clerkId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason,
          version: targetUser.version
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na moderação')
      }

      const result = await response.json()
      
      // Notificação de sucesso com ação específica
      const actionMessages = {
        APPROVE: 'Usuário aprovado com sucesso! 100 créditos foram concedidos.',
        REJECT: 'Usuário rejeitado. O acesso foi bloqueado.',
        SUSPEND: 'Usuário suspenso. O acesso foi temporariamente bloqueado.',
        UNSUSPEND_TO_APPROVED: 'Suspensão removida! Usuário aprovado e 100 créditos concedidos.',
        UNSUSPEND_TO_PENDING: 'Suspensão removida! Usuário retornado para análise pendente.'
      }
      
      addToast(toast.success(
        actionMessages[action],
        `${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})`
      ))
      
      // Atualizar a lista
      setUsers(users.map(u => u.id === userId ? result.user : u))
      setSelectedUser(null)
      setRejectionReason('')
      
      // Recarregar logs
      loadModerationLogs()

    } catch (error) {
      console.error('Erro na moderação:', error)
      addToast(toast.error(
        'Erro na moderação', 
        error instanceof Error ? error.message : 'Erro desconhecido'
      ))
    } finally {
      setModeratingUserId(null)
    }
  }

  const getStatusBadgeConfig = (status: ApprovalStatus) => {
    switch (status) {
      case 'PENDING': 
        return { 
          icon: Clock, 
          colors: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          label: 'Pendente'
        }
      case 'APPROVED': 
        return { 
          icon: CheckCircle, 
          colors: 'bg-green-500/10 text-green-400 border-green-500/20',
          label: 'Aprovado'
        }
      case 'REJECTED': 
        return { 
          icon: XCircle, 
          colors: 'bg-red-500/10 text-red-400 border-red-500/20',
          label: 'Rejeitado'
        }
      case 'SUSPENDED': 
        return { 
          icon: AlertTriangle, 
          colors: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
          label: 'Suspenso'
        }
      default: 
        return { 
          icon: Clock, 
          colors: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
          label: status
        }
    }
  }

  const getActionBadgeConfig = (action: ModerationAction) => {
    switch (action) {
      case 'APPROVE': 
        return { 
          icon: UserCheck, 
          colors: 'bg-green-500/10 text-green-400 border-green-500/20',
          label: 'Aprovado'
        }
      case 'REJECT': 
        return { 
          icon: UserX, 
          colors: 'bg-red-500/10 text-red-400 border-red-500/20',
          label: 'Rejeitado'
        }
      case 'SUSPEND': 
        return { 
          icon: UserMinus, 
          colors: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
          label: 'Suspenso'
        }
      case 'UNSUSPEND': 
        return { 
          icon: UserCheck, 
          colors: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          label: 'Reabilitado'
        }
      case 'UNSUSPEND_TO_APPROVED': 
        return { 
          icon: UserCheck, 
          colors: 'bg-green-500/10 text-green-400 border-green-500/20',
          label: 'Dessuspendido → Aprovado'
        }
      case 'UNSUSPEND_TO_PENDING': 
        return { 
          icon: RotateCcw, 
          colors: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          label: 'Dessuspendido → Pendente'
        }
      case 'RESET_TO_PENDING': 
        return { 
          icon: RotateCcw, 
          colors: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          label: 'Reset Pendente'
        }
      default: 
        return { 
          icon: Eye, 
          colors: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
          label: action
        }
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
           style={{ backgroundColor: 'var(--night, #0e0f0f)' }}>
        <div className="flex items-center gap-3" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--sgbus-green, #6be94c)' }} />
          <span>Carregando painel administrativo...</span>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
           style={{ backgroundColor: 'var(--night, #0e0f0f)' }}>
        <div className="text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#ff6b6b' }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
            Acesso Negado
          </h2>
          <p style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            Login necessário para acessar o painel administrativo
          </p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
           style={{ backgroundColor: 'var(--night, #0e0f0f)' }}>
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4" style={{ color: '#ff6b6b' }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
            Acesso Restrito
          </h2>
          <p style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            Apenas administradores podem acessar esta área
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--night, #0e0f0f)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
            <Users className="inline-block w-8 h-8 mr-3" style={{ color: 'var(--sgbus-green, #6be94c)' }} />
            Moderação de Usuários
          </h1>
          <p style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
            Gerencie aprovações e monitore atividades de moderação
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6" style={{ borderColor: 'rgba(249, 251, 252, 0.1)' }}>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === 'users'
                ? 'border-b-2 border-solid'
                : 'hover:opacity-80'
            }`}
            style={{
              borderColor: activeTab === 'users' ? 'var(--sgbus-green, #6be94c)' : 'transparent',
              color: activeTab === 'users' ? 'var(--sgbus-green, #6be94c)' : 'var(--periwinkle, #cfc6fe)'
            }}
          >
            <Users className="inline-block w-4 h-4 mr-2" />
            Usuários ({usersPagination.totalCount})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === 'logs'
                ? 'border-b-2 border-solid'
                : 'hover:opacity-80'
            }`}
            style={{
              borderColor: activeTab === 'logs' ? 'var(--sgbus-green, #6be94c)' : 'transparent',
              color: activeTab === 'logs' ? 'var(--sgbus-green, #6be94c)' : 'var(--periwinkle, #cfc6fe)'
            }}
          >
            <Eye className="inline-block w-4 h-4 mr-2" />
            Histórico de Moderação
          </button>
        </div>

        {activeTab === 'users' && (
          <>
            {/* Filtros */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2" 
                       style={{ color: 'var(--seasalt, #f9fbfc)' }}>
                  <Filter className="inline-block w-4 h-4 mr-2" />
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | 'ALL')}
                  className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: 'var(--eerie-black, #171818)',
                    borderColor: 'rgba(249, 251, 252, 0.2)',
                    color: 'var(--seasalt, #f9fbfc)',
                    boxShadow: 'inset 0 0 0 2px transparent'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--sgbus-green, #6be94c)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(107, 233, 76, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(249, 251, 252, 0.2)'
                    e.target.style.boxShadow = 'inset 0 0 0 2px transparent'
                  }}
                >
                  <option value="ALL">Todos</option>
                  <option value="PENDING">Pendentes</option>
                  <option value="APPROVED">Aprovados</option>
                  <option value="REJECTED">Rejeitados</option>
                  <option value="SUSPENDED">Suspensos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" 
                       style={{ color: 'var(--seasalt, #f9fbfc)' }}>
                  <Search className="inline-block w-4 h-4 mr-2" />
                  Buscar
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Email, nome..."
                  className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: 'var(--eerie-black, #171818)',
                    borderColor: 'rgba(249, 251, 252, 0.2)',
                    color: 'var(--seasalt, #f9fbfc)',
                    boxShadow: 'inset 0 0 0 2px transparent'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--sgbus-green, #6be94c)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(107, 233, 76, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(249, 251, 252, 0.2)'
                    e.target.style.boxShadow = 'inset 0 0 0 2px transparent'
                  }}
                />
              </div>
            </div>

            {/* Lista de Usuários */}
            <div className="rounded-xl border shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl" 
                 style={{ 
                   backgroundColor: 'var(--eerie-black, #171818)',
                   borderColor: 'rgba(249, 251, 252, 0.1)'
                 }}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" style={{ color: 'var(--sgbus-green, #6be94c)' }} />
                  <span style={{ color: 'var(--periwinkle, #cfc6fe)' }}>Carregando usuários...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr style={{ borderColor: 'rgba(249, 251, 252, 0.1)' }}>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider border-b" 
                            style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                          Usuário
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider border-b" 
                            style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider border-b" 
                            style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                          Créditos
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider border-b" 
                            style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                          Data de Registro
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider border-b" 
                            style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, index) => {
                        const statusConfig = getStatusBadgeConfig(user.approvalStatus)
                        const StatusIcon = statusConfig.icon
                        
                        return (
                          <tr key={user.id} 
                              className="transition-colors duration-200 hover:bg-opacity-50"
                              style={{ 
                                borderColor: 'rgba(249, 251, 252, 0.05)',
                                backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(249, 251, 252, 0.02)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(107, 233, 76, 0.05)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'rgba(249, 251, 252, 0.02)'
                              }}>
                            <td className="px-6 py-4 border-b" style={{ borderColor: 'rgba(249, 251, 252, 0.05)' }}>
                              <div className="flex items-center">
                                {user.profileImageUrl ? (
                                  <img
                                    className="h-10 w-10 rounded-full mr-4 border-2"
                                    src={user.profileImageUrl}
                                    alt=""
                                    style={{ borderColor: 'var(--sgbus-green, #6be94c)' }}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full mr-4 flex items-center justify-center border-2"
                                       style={{ 
                                         backgroundColor: 'var(--sgbus-green, #6be94c)',
                                         borderColor: 'var(--sgbus-green, #6be94c)',
                                         color: 'var(--night, #0e0f0f)'
                                       }}>
                                    {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-medium" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-sm flex items-center" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                                    <Mail className="w-3 h-3 mr-1" />
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 border-b" style={{ borderColor: 'rgba(249, 251, 252, 0.05)' }}>
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${statusConfig.colors}`}>
                                <StatusIcon className="w-3 h-3 mr-2" />
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 border-b" style={{ borderColor: 'rgba(249, 251, 252, 0.05)' }}>
                              <div className="flex items-center" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
                                <CreditCard className="w-4 h-4 mr-2" style={{ color: 'var(--sgbus-green, #6be94c)' }} />
                                <span className="font-semibold">{user.creditBalance}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 border-b" style={{ borderColor: 'rgba(249, 251, 252, 0.05)' }}>
                              <div className="flex items-center text-sm" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                              </div>
                            </td>
                            <td className="px-6 py-4 border-b" style={{ borderColor: 'rgba(249, 251, 252, 0.05)' }}>
                              {user.approvalStatus === 'PENDING' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => moderateUser(user.id, 'APPROVE')}
                                    disabled={moderatingUserId === user.id}
                                    className="px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 flex items-center"
                                    style={{ 
                                      backgroundColor: 'var(--sgbus-green, #6be94c)',
                                      color: 'var(--night, #0e0f0f)'
                                    }}
                                  >
                                    {moderatingUserId === user.id ? (
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                    )}
                                    Aprovar
                                  </button>
                                  <button
                                    onClick={() => setSelectedUser(user)}
                                    disabled={moderatingUserId === user.id}
                                    className="px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 flex items-center border"
                                    style={{ 
                                      borderColor: '#ff6b6b',
                                      color: '#ff6b6b',
                                      backgroundColor: 'transparent'
                                    }}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Rejeitar
                                  </button>
                                </div>
                              )}
                              {user.approvalStatus === 'APPROVED' && (
                                <button
                                  onClick={() => moderateUser(user.id, 'SUSPEND')}
                                  disabled={moderatingUserId === user.id}
                                  className="px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 flex items-center border"
                                  style={{ 
                                    borderColor: '#ff8c00',
                                    color: '#ff8c00',
                                    backgroundColor: 'transparent'
                                  }}
                                >
                                  {moderatingUserId === user.id ? (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  ) : (
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                  )}
                                  Suspender
                                </button>
                              )}
                              {user.approvalStatus === 'SUSPENDED' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => moderateUser(user.id, 'UNSUSPEND_TO_APPROVED')}
                                    disabled={moderatingUserId === user.id}
                                    className="px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 flex items-center"
                                    style={{ 
                                      backgroundColor: 'var(--sgbus-green, #6be94c)',
                                      color: 'var(--night, #0e0f0f)'
                                    }}
                                  >
                                    {moderatingUserId === user.id ? (
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                      <Unlock className="w-3 h-3 mr-1" />
                                    )}
                                    Aprovar
                                  </button>
                                  <button
                                    onClick={() => moderateUser(user.id, 'UNSUSPEND_TO_PENDING')}
                                    disabled={moderatingUserId === user.id}
                                    className="px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 flex items-center border"
                                    style={{ 
                                      borderColor: 'var(--periwinkle, #cfc6fe)',
                                      color: 'var(--periwinkle, #cfc6fe)',
                                      backgroundColor: 'transparent'
                                    }}
                                  >
                                    {moderatingUserId === user.id ? (
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                      <RotateCcw className="w-3 h-3 mr-1" />
                                    )}
                                    Pendente
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Paginação */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                Mostrando {(usersPagination.page - 1) * usersPagination.limit + 1} até{' '}
                {Math.min(usersPagination.page * usersPagination.limit, usersPagination.totalCount)} de{' '}
                {usersPagination.totalCount} usuários
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setUsersPagination({...usersPagination, page: usersPagination.page - 1})}
                  disabled={usersPagination.page === 1}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 flex items-center border"
                  style={{ 
                    borderColor: 'var(--periwinkle, #cfc6fe)',
                    color: 'var(--periwinkle, #cfc6fe)',
                    backgroundColor: 'transparent'
                  }}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </button>
                <button
                  onClick={() => setUsersPagination({...usersPagination, page: usersPagination.page + 1})}
                  disabled={usersPagination.page === usersPagination.totalPages}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 flex items-center border"
                  style={{ 
                    borderColor: 'var(--periwinkle, #cfc6fe)',
                    color: 'var(--periwinkle, #cfc6fe)',
                    backgroundColor: 'transparent'
                  }}
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'logs' && (
          <>
            {/* Histórico de Moderação */}
            <div className="rounded-xl border shadow-lg overflow-hidden" 
                 style={{ 
                   backgroundColor: 'var(--eerie-black, #171818)',
                   borderColor: 'rgba(249, 251, 252, 0.1)'
                 }}>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr style={{ borderColor: 'rgba(249, 251, 252, 0.1)' }}>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider border-b" 
                          style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                        Data
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider border-b" 
                          style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                        Ação
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider border-b" 
                          style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                        Usuário
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider border-b" 
                          style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                        Moderador
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider border-b" 
                          style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                        Motivo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {moderationLogs.map((log, index) => {
                      const actionConfig = getActionBadgeConfig(log.action)
                      const ActionIcon = actionConfig.icon
                      
                      return (
                        <tr key={log.id} 
                            className="transition-colors duration-200"
                            style={{ 
                              borderColor: 'rgba(249, 251, 252, 0.05)',
                              backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(249, 251, 252, 0.02)'
                            }}>
                          <td className="px-6 py-4 border-b" style={{ borderColor: 'rgba(249, 251, 252, 0.05)' }}>
                            <div className="text-sm flex items-center" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                              <Calendar className="w-4 h-4 mr-2" />
                              {new Date(log.createdAt).toLocaleString('pt-BR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 border-b" style={{ borderColor: 'rgba(249, 251, 252, 0.05)' }}>
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${actionConfig.colors}`}>
                              <ActionIcon className="w-3 h-3 mr-2" />
                              {actionConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 border-b" style={{ borderColor: 'rgba(249, 251, 252, 0.05)' }}>
                            <div className="text-sm font-medium" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
                              {log.User.firstName} {log.User.lastName}
                            </div>
                            <div className="text-xs flex items-center" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                              <Mail className="w-3 h-3 mr-1" />
                              {log.User.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 border-b" style={{ borderColor: 'rgba(249, 251, 252, 0.05)' }}>
                            <div className="text-sm font-medium" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
                              {log.Moderator.firstName} {log.Moderator.lastName}
                            </div>
                            <div className="text-xs flex items-center" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                              <Mail className="w-3 h-3 mr-1" />
                              {log.Moderator.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 border-b text-sm" style={{ 
                            borderColor: 'rgba(249, 251, 252, 0.05)',
                            color: 'var(--periwinkle, #cfc6fe)'
                          }}>
                            {log.reason || '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Modal de Rejeição */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="max-w-md w-full mx-4 rounded-xl shadow-2xl border transition-all duration-300" 
                 style={{ 
                   backgroundColor: 'var(--eerie-black, #171818)',
                   borderColor: 'rgba(249, 251, 252, 0.1)'
                 }}>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <XCircle className="w-6 h-6 mr-3" style={{ color: '#ff6b6b' }} />
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--seasalt, #f9fbfc)' }}>
                    Rejeitar Usuário
                  </h3>
                </div>
                
                <div className="mb-4 p-3 rounded-lg" 
                     style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)' }}>
                  <p className="text-sm" style={{ color: 'var(--periwinkle, #cfc6fe)' }}>
                    <strong style={{ color: 'var(--seasalt, #f9fbfc)' }}>
                      {selectedUser.firstName} {selectedUser.lastName}
                    </strong>
                    <br />
                    {selectedUser.email}
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" 
                         style={{ color: 'var(--seasalt, #f9fbfc)' }}>
                    Motivo da rejeição *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 resize-none"
                    style={{ 
                      backgroundColor: 'var(--night, #0e0f0f)',
                      borderColor: 'rgba(249, 251, 252, 0.2)',
                      color: 'var(--seasalt, #f9fbfc)'
                    }}
                    placeholder="Descreva o motivo da rejeição de forma clara e respeitosa..."
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--sgbus-green, #6be94c)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(107, 233, 76, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(249, 251, 252, 0.2)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedUser(null)
                      setRejectionReason('')
                    }}
                    className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-50 border"
                    style={{ 
                      borderColor: 'var(--periwinkle, #cfc6fe)',
                      color: 'var(--periwinkle, #cfc6fe)',
                      backgroundColor: 'transparent'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => moderateUser(selectedUser.id, 'REJECT', rejectionReason)}
                    disabled={!rejectionReason.trim() || moderatingUserId === selectedUser.id}
                    className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 flex items-center justify-center"
                    style={{ 
                      backgroundColor: '#ff6b6b',
                      color: 'white'
                    }}
                  >
                    {moderatingUserId === selectedUser.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Confirmar Rejeição
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSS Variables inline para garantir compatibilidade */}
        <style jsx>{`
          :root {
            --night: #0e0f0f;
            --eerie-black: #171818;
            --sgbus-green: #6be94c;
            --seasalt: #f9fbfc;
            --periwinkle: #cfc6fe;
          }
        `}</style>
      </div>
    </div>
  )
} 