// API Service for communicating with the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: unknown
    token?: string | null
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, token } = options

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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(error.error || error.message || 'Erro na requisição')
    }

    return response.json()
}

// Auth API
export const authApi = {
    login: (email: string, senha: string) =>
        request<{ token: string; user: import('@/types').User }>('/auth/login', {
            method: 'POST',
            body: { email, senha },
        }),

    me: (token: string) =>
        request<import('@/types').User>('/auth/me', { token }),
}

// Municipios API
export const municipiosApi = {
    list: (token?: string | null) =>
        request<import('@/types').Municipio[]>('/municipios', { token }),

    get: (id: string, token?: string | null) =>
        request<import('@/types').Municipio>(`/municipios/${id}`, { token }),

    create: (data: Partial<import('@/types').Municipio>, token?: string | null) =>
        request<import('@/types').Municipio>('/municipios', { method: 'POST', body: data, token }),

    update: (id: string, data: Partial<import('@/types').Municipio>, token?: string | null) =>
        request<import('@/types').Municipio>(`/municipios/${id}`, { method: 'PUT', body: data, token }),

    delete: (id: string, token?: string | null) =>
        request<{ message: string }>(`/municipios/${id}`, { method: 'DELETE', token }),
}

// Usuarios API
export const usuariosApi = {
    list: (municipioId?: string, token?: string | null) =>
        request<import('@/types').User[]>(`/usuarios${municipioId ? `?municipioId=${municipioId}` : ''}`, { token }),

    get: (id: string, token?: string | null) =>
        request<import('@/types').User>(`/usuarios/${id}`, { token }),

    create: (data: Partial<import('@/types').User> & { senha?: string }, token?: string | null) =>
        request<import('@/types').User>('/usuarios', { method: 'POST', body: data, token }),

    update: (id: string, data: Partial<import('@/types').User>, token?: string | null) =>
        request<import('@/types').User>(`/usuarios/${id}`, { method: 'PUT', body: data, token }),

    delete: (id: string, token?: string | null) =>
        request<{ message: string }>(`/usuarios/${id}`, { method: 'DELETE', token }),
}

// Solucoes API
export const solucoesApi = {
    list: (municipioId?: string, token?: string | null) =>
        request<import('@/types').Solucao[]>(`/solucoes${municipioId ? `?municipioId=${municipioId}` : ''}`, { token }),

    get: (id: string, token?: string | null) =>
        request<import('@/types').Solucao>(`/solucoes/${id}`, { token }),

    create: (data: Partial<import('@/types').Solucao>, token?: string | null) =>
        request<import('@/types').Solucao>('/solucoes', { method: 'POST', body: data, token }),

    update: (id: string, data: Partial<import('@/types').Solucao>, token?: string | null) =>
        request<import('@/types').Solucao>(`/solucoes/${id}`, { method: 'PUT', body: data, token }),

    delete: (id: string, token?: string | null) =>
        request<{ message: string }>(`/solucoes/${id}`, { method: 'DELETE', token }),
}

// Escolas API
export const escolasApi = {
    list: (municipioId?: string, token?: string | null) =>
        request<import('@/types').Escola[]>(`/escolas${municipioId ? `?municipioId=${municipioId}` : ''}`, { token }),

    get: (id: string, token?: string | null) =>
        request<import('@/types').Escola>(`/escolas/${id}`, { token }),

    create: (data: Partial<import('@/types').Escola>, token?: string | null) =>
        request<import('@/types').Escola>('/escolas', { method: 'POST', body: data, token }),

    update: (id: string, data: Partial<import('@/types').Escola>, token?: string | null) =>
        request<import('@/types').Escola>(`/escolas/${id}`, { method: 'PUT', body: data, token }),

    delete: (id: string, token?: string | null) =>
        request<{ message: string }>(`/escolas/${id}`, { method: 'DELETE', token }),
}

// Alunos API
export const alunosApi = {
    list: (municipioId?: string, token?: string | null) =>
        request<import('@/types').Aluno[]>(`/alunos${municipioId ? `?municipioId=${municipioId}` : ''}`, { token }),

    get: (id: string, token?: string | null) =>
        request<import('@/types').Aluno>(`/alunos/${id}`, { token }),

    create: (data: Partial<import('@/types').Aluno>, token?: string | null) =>
        request<import('@/types').Aluno>('/alunos', { method: 'POST', body: data, token }),

    update: (id: string, data: Partial<import('@/types').Aluno>, token?: string | null) =>
        request<import('@/types').Aluno>(`/alunos/${id}`, { method: 'PUT', body: data, token }),

    delete: (id: string, token?: string | null) =>
        request<{ message: string }>(`/alunos/${id}`, { method: 'DELETE', token }),
}

// Dashboard API
export const dashboardApi = {
    stats: (municipioId?: string, token?: string | null) =>
        request<import('@/types').DashboardStats>(`/dashboard/stats${municipioId ? `?municipioId=${municipioId}` : ''}`, { token }),

    charts: (municipioId?: string, token?: string | null) =>
        request<{ tipoEnsino: { name: string; value: number }[]; statusAlunos: { name: string; value: number }[] }>(
            `/dashboard/charts${municipioId ? `?municipioId=${municipioId}` : ''}`,
            { token }
        ),
}

// Health check
export const healthApi = {
    check: () => request<{ status: string; database: string; timestamp: string }>('/health'),
}
