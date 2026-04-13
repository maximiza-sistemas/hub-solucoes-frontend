import type {
    AuthResponse,
    Municipio,
    Solucao,
    Usuario,
    Aluno,
    Escola,
    Regiao,
    Grupo,
    Turma,
    Role,
    PageResponse,
    ImportJobProgress,
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    token?: string | null
    params?: Record<string, string | number | undefined>
}

let isRefreshing = false
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, token, params } = options

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const config: RequestInit = {
        method,
        headers,
    }

    if (body) {
        config.body = JSON.stringify(body)
    }

    let url = `${API_BASE_URL}${endpoint}`
    if (params) {
        const searchParams = new URLSearchParams()
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.set(key, String(value))
            }
        }
        const qs = searchParams.toString()
        if (qs) url += `?${qs}`
    }

    const response = await fetch(url, config)

    if ((response.status === 401 || response.status === 403) && token) {
        // Try refreshing the token
        const { useAuthStore } = await import('@/stores/auth-store')
        const refreshToken = useAuthStore.getState().refreshToken

        if (refreshToken && !isRefreshing) {
            isRefreshing = true
            refreshPromise = authApi.refresh(refreshToken)

            try {
                const tokens = await refreshPromise
                useAuthStore.getState().updateTokens(tokens.accessToken, tokens.refreshToken)
                isRefreshing = false
                refreshPromise = null

                // Retry original request with new token
                headers['Authorization'] = `Bearer ${tokens.accessToken}`
                const retryConfig: RequestInit = { method, headers }
                if (body) retryConfig.body = JSON.stringify(body)
                const retryResponse = await fetch(url, retryConfig)
                if (!retryResponse.ok) {
                    const error = await retryResponse.json().catch(() => ({ error: 'Erro desconhecido' }))
                    throw new Error(error.message || error.error || 'Erro na requisição')
                }
                return retryResponse.json()
            } catch {
                isRefreshing = false
                refreshPromise = null
                useAuthStore.getState().logout()
                throw new Error('Sessão expirada. Faça login novamente.')
            }
        } else if (isRefreshing && refreshPromise) {
            // Wait for the refresh to complete, then retry
            try {
                const tokens = await refreshPromise
                headers['Authorization'] = `Bearer ${tokens.accessToken}`
                const retryConfig: RequestInit = { method, headers }
                if (body) retryConfig.body = JSON.stringify(body)
                const retryResponse = await fetch(url, retryConfig)
                if (!retryResponse.ok) {
                    const error = await retryResponse.json().catch(() => ({ error: 'Erro desconhecido' }))
                    throw new Error(error.message || error.error || 'Erro na requisição')
                }
                return retryResponse.json()
            } catch {
                throw new Error('Sessão expirada. Faça login novamente.')
            }
        }
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(error.message || error.error || 'Erro na requisição')
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as T
    }

    return response.json()
}

async function uploadFile<T>(endpoint: string, file: File, fieldName: string, token?: string | null, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
    const formData = new FormData()
    formData.append(fieldName, file)

    const headers: HeadersInit = {}
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, { method, headers, body: formData })

    if ((response.status === 401 || response.status === 403) && token) {
        const { useAuthStore } = await import('@/stores/auth-store')
        const refreshToken = useAuthStore.getState().refreshToken

        if (refreshToken && !isRefreshing) {
            isRefreshing = true
            refreshPromise = authApi.refresh(refreshToken)

            try {
                const tokens = await refreshPromise
                useAuthStore.getState().updateTokens(tokens.accessToken, tokens.refreshToken)
                isRefreshing = false
                refreshPromise = null

                headers['Authorization'] = `Bearer ${tokens.accessToken}`
                const retryResponse = await fetch(url, { method, headers, body: formData })
                if (!retryResponse.ok) {
                    const error = await retryResponse.json().catch(() => ({ error: 'Erro desconhecido' }))
                    throw new Error(error.message || error.error || 'Erro na requisição')
                }
                return retryResponse.json()
            } catch {
                isRefreshing = false
                refreshPromise = null
                useAuthStore.getState().logout()
                throw new Error('Sessão expirada. Faça login novamente.')
            }
        } else if (isRefreshing && refreshPromise) {
            try {
                const tokens = await refreshPromise
                headers['Authorization'] = `Bearer ${tokens.accessToken}`
                const retryResponse = await fetch(url, { method, headers, body: formData })
                if (!retryResponse.ok) {
                    const error = await retryResponse.json().catch(() => ({ error: 'Erro desconhecido' }))
                    throw new Error(error.message || error.error || 'Erro na requisição')
                }
                return retryResponse.json()
            } catch {
                throw new Error('Sessão expirada. Faça login novamente.')
            }
        }
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(error.message || error.error || 'Erro na requisição')
    }

    return response.json()
}

// Auth API
export const authApi = {
    login: (email: string, password: string) =>
        request<AuthResponse>('/auth/login', {
            method: 'POST',
            body: { email, password },
        }),

    register: (data: { nome: string; email: string; password: string; municipioId?: number }) =>
        request<AuthResponse>('/auth/register', {
            method: 'POST',
            body: data,
        }),

    refresh: (refreshToken: string) =>
        request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
            method: 'POST',
            body: { refreshToken },
        }),
}

// Municipios API
export const municipiosApi = {
    list: (token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Municipio>>('/municipios', { token, params: { ...params } }),

    get: (id: number, token?: string | null) =>
        request<Municipio>(`/municipios/${id}`, { token }),

    create: (data: Partial<Municipio>, token?: string | null) =>
        request<Municipio>('/municipios', { method: 'POST', body: data, token }),

    update: (id: number, data: Partial<Municipio>, token?: string | null) =>
        request<Municipio>(`/municipios/${id}`, { method: 'PUT', body: data, token }),

    delete: (id: number, token?: string | null) =>
        request<void>(`/municipios/${id}`, { method: 'DELETE', token }),

    ativar: (id: number, token?: string | null) =>
        request<void>(`/municipios/${id}/ativar`, { method: 'GET', token }),

    inativar: (id: number, token?: string | null) =>
        request<void>(`/municipios/${id}/inativar`, { method: 'GET', token }),

    uploadImageMunicipio: (id: number, file: File, token?: string | null) =>
        uploadFile<Municipio>(`/municipios/${id}/image-municipio`, file, 'file', token, 'PUT'),

    uploadImageEducacao: (id: number, file: File, token?: string | null) =>
        uploadFile<Municipio>(`/municipios/${id}/image-educacao`, file, 'file', token, 'PUT'),

    deleteImageMunicipio: (id: number, token?: string | null) =>
        request<void>(`/municipios/${id}/image-municipio`, { method: 'DELETE', token }),

    deleteImageEducacao: (id: number, token?: string | null) =>
        request<void>(`/municipios/${id}/image-educacao`, { method: 'DELETE', token }),
}

// Usuarios API
export const usuariosApi = {
    list: (token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Usuario>>('/usuarios', { token, params: { ...params } }),

    get: (id: number, token?: string | null) =>
        request<Usuario>(`/usuarios/${id}`, { token }),

    create: (data: Partial<Usuario> & { password?: string; tipoUsuarioId?: number }, token?: string | null) =>
        request<Usuario>('/usuarios', { method: 'POST', body: data, token }),

    update: (id: number, data: Partial<Usuario> & { tipoUsuarioId?: number }, token?: string | null) =>
        request<Usuario>(`/usuarios/${id}`, { method: 'PUT', body: data, token }),

    delete: (id: number, token?: string | null) =>
        request<void>(`/usuarios/${id}`, { method: 'DELETE', token }),

    ativar: (id: number, token?: string | null) =>
        request<void>(`/usuarios/${id}/ativar`, { method: 'GET', token }),

    inativar: (id: number, token?: string | null) =>
        request<void>(`/usuarios/${id}/inativar`, { method: 'GET', token }),

    alterarSenha: (id: number, data: { senhaAtual: string; novaSenha: string }, token?: string | null) =>
        request<void>(`/usuarios/${id}/alterar-senha`, { method: 'PUT', body: data, token }),

    resetSenha: (id: number, data: { novaSenha: string }, token?: string | null) =>
        request<void>(`/usuarios/${id}/reset-senha`, { method: 'PUT', body: data, token }),
}

// Solucoes API
export const solucoesApi = {
    list: (token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Solucao>>('/solucoes', { token, params: { ...params } }),

    get: (id: number, token?: string | null) =>
        request<Solucao>(`/solucoes/${id}`, { token }),

    create: (data: Partial<Solucao>, token?: string | null) =>
        request<Solucao>('/solucoes', { method: 'POST', body: data, token }),

    update: (id: number, data: Partial<Solucao>, token?: string | null) =>
        request<Solucao>(`/solucoes/${id}`, { method: 'PUT', body: data, token }),

    delete: (id: number, token?: string | null) =>
        request<void>(`/solucoes/${id}`, { method: 'DELETE', token }),

    ativar: (id: number, token?: string | null) =>
        request<Solucao>(`/solucoes/${id}/ativar`, { method: 'GET', token }),

    inativar: (id: number, token?: string | null) =>
        request<Solucao>(`/solucoes/${id}/inativar`, { method: 'GET', token }),
}

// Escolas API
export const escolasApi = {
    list: (token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Escola>>('/escolas', { token, params: { ...params } }),

    get: (id: number, token?: string | null) =>
        request<Escola>(`/escolas/${id}`, { token }),

    create: (data: Partial<Escola>, token?: string | null) =>
        request<Escola>('/escolas', { method: 'POST', body: data, token }),

    update: (id: number, data: Partial<Escola>, token?: string | null) =>
        request<Escola>(`/escolas/${id}`, { method: 'PUT', body: data, token }),

    delete: (id: number, token?: string | null) =>
        request<void>(`/escolas/${id}`, { method: 'DELETE', token }),
}

// Alunos API
export const alunosApi = {
    list: (token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Aluno>>('/alunos', { token, params: { ...params } }),

    get: (id: number, token?: string | null) =>
        request<Aluno>(`/alunos/${id}`, { token }),

    create: (data: Partial<Aluno>, token?: string | null) =>
        request<Aluno>('/alunos', { method: 'POST', body: data, token }),

    update: (id: number, data: Partial<Aluno>, token?: string | null) =>
        request<Aluno>(`/alunos/${id}`, { method: 'PUT', body: data, token }),

    delete: (id: number, token?: string | null) =>
        request<void>(`/alunos/${id}`, { method: 'DELETE', token }),

    startImport: (file: File, token?: string | null) =>
        uploadFile<{ jobId: string }>('/alunos/import', file, 'file', token),

    getImportProgress: (jobId: string, token?: string | null) =>
        request<ImportJobProgress>(`/alunos/import/${jobId}`, { token }),

    getActiveImport: (token?: string | null) =>
        request<ImportJobProgress | undefined>('/alunos/import/active', { token }),

    cancelImport: (jobId: string, token?: string | null) =>
        request<ImportJobProgress>(`/alunos/import/${jobId}/cancel`, { method: 'POST', token }),
}

// Regioes API
export const regioesApi = {
    list: (token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Regiao>>('/regioes', { token, params: { ...params } }),

    get: (id: number, token?: string | null) =>
        request<Regiao>(`/regioes/${id}`, { token }),

    create: (data: Partial<Regiao>, token?: string | null) =>
        request<Regiao>('/regioes', { method: 'POST', body: data, token }),

    update: (id: number, data: Partial<Regiao>, token?: string | null) =>
        request<Regiao>(`/regioes/${id}`, { method: 'PUT', body: data, token }),

    delete: (id: number, token?: string | null) =>
        request<void>(`/regioes/${id}`, { method: 'DELETE', token }),
}

// Grupos API
export const gruposApi = {
    list: (token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Grupo>>('/grupos', { token, params: { ...params } }),

    get: (id: number, token?: string | null) =>
        request<Grupo>(`/grupos/${id}`, { token }),

    create: (data: Partial<Grupo>, token?: string | null) =>
        request<Grupo>('/grupos', { method: 'POST', body: data, token }),

    update: (id: number, data: Partial<Grupo>, token?: string | null) =>
        request<Grupo>(`/grupos/${id}`, { method: 'PUT', body: data, token }),

    delete: (id: number, token?: string | null) =>
        request<void>(`/grupos/${id}`, { method: 'DELETE', token }),
}

// Turmas API
export const turmasApi = {
    list: (token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Turma>>('/turmas', { token, params: { ...params } }),

    get: (id: number, token?: string | null) =>
        request<Turma>(`/turmas/${id}`, { token }),

    create: (data: Partial<Turma>, token?: string | null) =>
        request<Turma>('/turmas', { method: 'POST', body: data, token }),

    update: (id: number, data: Partial<Turma>, token?: string | null) =>
        request<Turma>(`/turmas/${id}`, { method: 'PUT', body: data, token }),

    delete: (id: number, token?: string | null) =>
        request<void>(`/turmas/${id}`, { method: 'DELETE', token }),
}

// Roles API
export const rolesApi = {
    list: (token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Role>>('/roles', { token, params: { ...params } }),
    get: (id: number, token?: string | null) =>
        request<Role>(`/roles/${id}`, { token }),
    create: (data: Partial<Role>, token?: string | null) =>
        request<Role>('/roles', { method: 'POST', body: data, token }),
    update: (id: number, data: Partial<Role>, token?: string | null) =>
        request<Role>(`/roles/${id}`, { method: 'PUT', body: data, token }),
    delete: (id: number, token?: string | null) =>
        request<void>(`/roles/${id}`, { method: 'DELETE', token }),
}

// Gestores API
export const gestoresApi = {
    listGestores: (token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Usuario>>('/usuarios/gestores', { token, params: { ...params } }),

    listGestoresByMunicipio: (municipioId: number, token?: string | null) =>
        request<PageResponse<Usuario>>('/usuarios/gestores', { token, params: { municipioId } }),

    getSchools: (gestorId: number, token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Escola>>(`/gestores/${gestorId}/escolas`, { token, params }),

    getAvailableSchools: (gestorId: number, token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Escola>>(`/gestores/${gestorId}/escolas-disponiveis`, { token, params }),

    addSchool: (gestorId: number, escolaId: number, token?: string | null) =>
        request<Escola>(`/gestores/${gestorId}/escolas/${escolaId}`, { method: 'POST', token }),

    removeSchool: (gestorId: number, escolaId: number, token?: string | null) =>
        request<void>(`/gestores/${gestorId}/escolas/${escolaId}`, { method: 'DELETE', token }),
}

// Professores API
export const professoresApi = {
    listProfessores: (token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Usuario>>('/usuarios/professores', { token, params: { ...params } }),

    listProfessoresByMunicipio: (municipioId: number, token?: string | null) =>
        request<PageResponse<Usuario>>('/usuarios/professores', { token, params: { municipioId } }),

    getTurmas: (professorId: number, token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Turma>>(`/professores/${professorId}/turmas`, { token, params }),

    getAvailableTurmas: (professorId: number, token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<Turma>>(`/professores/${professorId}/turmas-disponiveis`, { token, params }),

    addTurma: (professorId: number, turmaId: number, token?: string | null) =>
        request<Turma>(`/professores/${professorId}/turmas/${turmaId}`, { method: 'POST', token }),

    removeTurma: (professorId: number, turmaId: number, token?: string | null) =>
        request<void>(`/professores/${professorId}/turmas/${turmaId}`, { method: 'DELETE', token }),
}

// Enums API
export const enumsApi = {
    turnos: (token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<string>>('/enums/turnos', { token, params: { ...params } }),

    series: (token?: string | null, params?: Record<string, string | number | undefined>) =>
        request<PageResponse<string>>('/enums/series', { token, params: { ...params } }),
}
