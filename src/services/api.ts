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
import { ApiError, type ApiErrorBody } from '@/lib/api-error'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID ?? 'HUB'

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    token?: string | null
    params?: Record<string, string | number | undefined>
}

let isRefreshing = false
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null

/** Lê o corpo do erro uma única vez e o transforma num ApiError com status e campos. */
async function readError(response: Response): Promise<ApiError> {
    const body: ApiErrorBody = await response.json().catch(() => ({}))
    return new ApiError(response.status, body)
}

/**
 * O backend não configura um AuthenticationEntryPoint, então o Spring Security cai no
 * Http403ForbiddenEntryPoint: token expirado devolve 403 com corpo VAZIO, não 401.
 * Por isso não dá para restringir a renovação ao 401.
 *
 * Um 403 legítimo (TenantAccessDenied, @PreAuthorize) sempre vem do GlobalExceptionHandler
 * com corpo preenchido — é o que distingue os dois casos. Sem essa distinção, um erro de
 * permissão deslogava o operador em vez de mostrar a mensagem.
 */
function shouldAttemptRefresh(error: ApiError): boolean {
    if (error.status === 401) return true
    return error.status === 403 && !error.body.message && !error.body.error
}

const sessaoExpirada = () => new ApiError(401, { message: 'Sessão expirada. Faça login novamente.' })

/** Renova os tokens. Devolve null quando não há refresh token — aí o erro original sobe. */
async function tryRefreshTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
    const { useAuthStore } = await import('@/stores/auth-store')
    const refreshToken = useAuthStore.getState().refreshToken

    if (!refreshToken) return null

    if (isRefreshing && refreshPromise) {
        // Já há uma renovação em voo: pega carona nela em vez de disparar outra.
        try {
            return await refreshPromise
        } catch {
            throw sessaoExpirada()
        }
    }

    isRefreshing = true
    refreshPromise = authApi.refresh(refreshToken)

    try {
        const tokens = await refreshPromise
        useAuthStore.getState().updateTokens(tokens.accessToken, tokens.refreshToken)
        return tokens
    } catch {
        useAuthStore.getState().logout()
        throw sessaoExpirada()
    } finally {
        isRefreshing = false
        refreshPromise = null
    }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, token, params } = options

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-Client-Id': CLIENT_ID,
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

    if (response.ok) {
        // Handle 204 No Content
        if (response.status === 204) {
            return undefined as T
        }
        return response.json()
    }

    const apiError = await readError(response)

    if (token && shouldAttemptRefresh(apiError)) {
        const tokens = await tryRefreshTokens()

        if (tokens) {
            headers['Authorization'] = `Bearer ${tokens.accessToken}`
            const retryConfig: RequestInit = { method, headers }
            if (body) retryConfig.body = JSON.stringify(body)

            const retryResponse = await fetch(url, retryConfig)
            if (!retryResponse.ok) {
                throw await readError(retryResponse)
            }
            if (retryResponse.status === 204) {
                return undefined as T
            }
            return retryResponse.json()
        }
    }

    throw apiError
}

async function uploadFile<T>(endpoint: string, file: File, fieldName: string, token?: string | null, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
    const formData = new FormData()
    formData.append(fieldName, file)

    const headers: HeadersInit = {
        'X-Client-Id': CLIENT_ID,
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, { method, headers, body: formData })

    if (response.ok) {
        return response.json()
    }

    const apiError = await readError(response)

    if (token && shouldAttemptRefresh(apiError)) {
        const tokens = await tryRefreshTokens()

        if (tokens) {
            headers['Authorization'] = `Bearer ${tokens.accessToken}`
            const retryResponse = await fetch(url, { method, headers, body: formData })
            if (!retryResponse.ok) {
                throw await readError(retryResponse)
            }
            return retryResponse.json()
        }
    }

    throw apiError
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

    dashboard: (municipioId: string | number, token?: string | null) =>
        request<import('@/types').MunicipioDashboard>(
            `/municipios/dashboard?municipioId=${municipioId}`,
            { token }
        ),
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

    startImport: (file: File, municipioId?: number | null, token?: string | null) => {
        const path = municipioId != null
            ? `/usuarios/import?municipioId=${municipioId}`
            : '/usuarios/import'
        return uploadFile<{ jobId: string }>(path, file, 'file', token)
    },

    getImportProgress: (jobId: string, token?: string | null) =>
        request<ImportJobProgress>(`/usuarios/import/${jobId}`, { token }),

    getActiveImport: (token?: string | null, municipioId?: number | null) => {
        const path = municipioId != null
            ? `/usuarios/import/active?municipioId=${municipioId}`
            : '/usuarios/import/active'
        return request<ImportJobProgress | undefined>(path, { token })
    },

    cancelImport: (jobId: string, token?: string | null) =>
        request<ImportJobProgress>(`/usuarios/import/${jobId}/cancel`, { method: 'POST', token }),
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

    startImport: (file: File, municipioId?: number | null, token?: string | null) => {
        const path = municipioId != null
            ? `/alunos/import?municipioId=${municipioId}`
            : '/alunos/import'
        return uploadFile<{ jobId: string }>(path, file, 'file', token)
    },

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
