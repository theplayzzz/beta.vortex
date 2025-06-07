'use client'

import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { ApprovalStatus, ModerationAction } from '@prisma/client'
import { useToast, toast } from '@/components/ui/toast'

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
      addToast(toast.error('Erro ao carregar usuários'))
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
      addToast(toast.error('Erro ao carregar histórico'))
    }
  }

  const moderateUser = async (userId: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND', reason?: string) => {
    const targetUser = users.find(u => u.id === userId)
    if (!targetUser) return

    try {
      const response = await fetch(`/api/admin/users/${userId}/moderate`, {
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
      addToast(toast.success(result.message))
      
      // Atualizar a lista
      setUsers(users.map(u => u.id === userId ? result.user : u))
      setSelectedUser(null)
      setRejectionReason('')
      
      // Recarregar logs
      loadModerationLogs()

    } catch (error) {
      console.error('Erro na moderação:', error)
      addToast(toast.error(error instanceof Error ? error.message : 'Erro na moderação'))
    }
  }

  const getStatusBadgeColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'SUSPENDED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionBadgeColor = (action: ModerationAction) => {
    switch (action) {
      case 'APPROVE': return 'bg-green-100 text-green-800'
      case 'REJECT': return 'bg-red-100 text-red-800'
      case 'SUSPEND': return 'bg-orange-100 text-orange-800'
      case 'UNSUSPEND': return 'bg-blue-100 text-blue-800'
      case 'RESET_TO_PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isLoaded) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>
  }

  if (!userId) {
    return <div className="text-center text-red-600">Acesso negado - Login necessário</div>
  }

  if (!isAdmin) {
    return <div className="text-center text-red-600">Acesso negado - Apenas administradores</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Moderação de Usuários</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'users'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Usuários ({usersPagination.totalCount})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'logs'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Histórico de Moderação
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          {/* Filtros */}
          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | 'ALL')}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="ALL">Todos</option>
                <option value="PENDING">Pendentes</option>
                <option value="APPROVED">Aprovados</option>
                <option value="REJECTED">Rejeitados</option>
                <option value="SUSPENDED">Suspensos</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Email, nome..."
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          {/* Lista de Usuários */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créditos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.profileImageUrl && (
                          <img
                            className="h-10 w-10 rounded-full mr-4"
                            src={user.profileImageUrl}
                            alt=""
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.approvalStatus)}`}>
                        {user.approvalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.creditBalance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.approvalStatus === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => moderateUser(user.id, 'APPROVE')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Rejeitar
                          </button>
                        </div>
                      )}
                      {user.approvalStatus === 'APPROVED' && (
                        <button
                          onClick={() => moderateUser(user.id, 'SUSPEND')}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          Suspender
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-700">
              Mostrando {(usersPagination.page - 1) * usersPagination.limit + 1} até{' '}
              {Math.min(usersPagination.page * usersPagination.limit, usersPagination.totalCount)} de{' '}
              {usersPagination.totalCount} usuários
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setUsersPagination({...usersPagination, page: usersPagination.page - 1})}
                disabled={usersPagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setUsersPagination({...usersPagination, page: usersPagination.page + 1})}
                disabled={usersPagination.page === usersPagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'logs' && (
        <>
          {/* Histórico de Moderação */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Moderador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {moderationLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.User.firstName} {log.User.lastName}
                      <div className="text-xs text-gray-500">{log.User.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.Moderator.firstName} {log.Moderator.lastName}
                      <div className="text-xs text-gray-500">{log.Moderator.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.reason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de Rejeição */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">
              Rejeitar usuário: {selectedUser.email}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da rejeição *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Descreva o motivo da rejeição..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedUser(null)
                  setRejectionReason('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => moderateUser(selectedUser.id, 'REJECT', rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 