import { create } from 'zustand'
import type { Municipio, Solucao, Usuario, Aluno, Escola, Regiao, Grupo, Turma, Role } from '@/types'
import { municipiosApi, solucoesApi, usuariosApi, alunosApi, escolasApi, regioesApi, gruposApi, turmasApi, rolesApi } from '@/services/api'
import { useAuthStore } from './auth-store'

type QueryParams = Record<string, string | number | undefined>
type FetchArg = number | QueryParams | undefined

interface PaginationMeta {
    page: number
    size: number
    totalElements: number
    totalPages: number
}

const normalizeFetchParams = (arg?: FetchArg): QueryParams | undefined => {
    if (typeof arg === 'number') {
        return { municipioId: arg }
    }
    return arg
}

interface DataState {
    // Data
    municipios: Municipio[]
    solucoes: Solucao[]
    usuarios: Usuario[]
    alunos: Aluno[]
    escolas: Escola[]
    regioes: Regiao[]
    grupos: Grupo[]
    turmas: Turma[]
    roles: Role[]
    pagination: Record<string, PaginationMeta>

    // Loading states
    isLoading: boolean
    error: string | null

    // Fetch methods
    fetchMunicipios: () => Promise<void>
    fetchSolucoes: (params?: FetchArg) => Promise<void>
    fetchUsuarios: (params?: FetchArg) => Promise<void>
    fetchAlunos: (params?: FetchArg) => Promise<void>
    fetchEscolas: (params?: FetchArg) => Promise<void>
    fetchRegioes: (params?: FetchArg) => Promise<void>
    fetchGrupos: (params?: FetchArg) => Promise<void>
    fetchTurmas: (params?: FetchArg) => Promise<void>
    fetchRoles: (params?: FetchArg) => Promise<void>

    // Municipios CRUD
    addMunicipio: (data: Partial<Municipio>) => Promise<Municipio>
    updateMunicipio: (id: number, data: Partial<Municipio>) => Promise<void>
    deleteMunicipio: (id: number) => Promise<void>
    ativarMunicipio: (id: number) => Promise<void>
    inativarMunicipio: (id: number) => Promise<void>
    uploadImageMunicipio: (id: number, file: File) => Promise<Municipio>
    uploadImageEducacao: (id: number, file: File) => Promise<Municipio>
    deleteImageMunicipio: (id: number) => Promise<void>
    deleteImageEducacao: (id: number) => Promise<void>

    // Soluções CRUD
    addSolucao: (data: Partial<Solucao>) => Promise<Solucao>
    updateSolucao: (id: number, data: Partial<Solucao>) => Promise<void>
    deleteSolucao: (id: number) => Promise<void>
    ativarSolucao: (id: number) => Promise<void>
    inativarSolucao: (id: number) => Promise<void>
    getSolucoesByMunicipio: (municipioId: number) => Solucao[]

    // Usuários CRUD
    addUsuario: (data: Partial<Usuario> & { password?: string; tipoUsuarioId?: number }) => Promise<Usuario>
    updateUsuario: (id: number, data: Partial<Usuario> & { tipoUsuarioId?: number }) => Promise<void>
    deleteUsuario: (id: number) => Promise<void>
    getUsuariosByMunicipio: (municipioId: number) => Usuario[]

    // Alunos CRUD
    addAluno: (data: Partial<Aluno>) => Promise<Aluno>
    updateAluno: (id: number, data: Partial<Aluno>) => Promise<void>
    deleteAluno: (id: number) => Promise<void>
    getAlunosByMunicipio: (municipioId: number) => Aluno[]

    // Escolas CRUD
    addEscola: (data: Partial<Escola>) => Promise<Escola>
    updateEscola: (id: number, data: Partial<Escola>) => Promise<void>
    deleteEscola: (id: number) => Promise<void>
    getEscolasByMunicipio: (municipioId: number) => Escola[]

    // Regioes CRUD
    addRegiao: (data: Partial<Regiao>) => Promise<Regiao>
    updateRegiao: (id: number, data: Partial<Regiao>) => Promise<void>
    deleteRegiao: (id: number) => Promise<void>

    // Grupos CRUD
    addGrupo: (data: Partial<Grupo>) => Promise<Grupo>
    updateGrupo: (id: number, data: Partial<Grupo>) => Promise<void>
    deleteGrupo: (id: number) => Promise<void>

    // Turmas CRUD
    addTurma: (data: Partial<Turma>) => Promise<Turma>
    updateTurma: (id: number, data: Partial<Turma>) => Promise<void>
    deleteTurma: (id: number) => Promise<void>

    // Roles CRUD
    addRole: (data: Partial<Role>) => Promise<Role>
    updateRole: (id: number, data: Partial<Role>) => Promise<Role>
    deleteRole: (id: number) => Promise<void>

    // Helpers
    getMunicipioById: (id: number) => Municipio | undefined
    clearError: () => void
}

export const useDataStore = create<DataState>((set, get) => ({
    municipios: [],
    solucoes: [],
    usuarios: [],
    alunos: [],
    escolas: [],
    regioes: [],
    grupos: [],
    turmas: [],
    roles: [],
    pagination: {},
    isLoading: false,
    error: null,

    // Fetch methods
    fetchMunicipios: async () => {
        const token = useAuthStore.getState().accessToken
        set({ isLoading: true, error: null })
        try {
            const response = await municipiosApi.list(token)
            set({ municipios: response.content, isLoading: false })
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false })
        }
    },

    fetchSolucoes: async (arg?: FetchArg) => {
        const token = useAuthStore.getState().accessToken
        set({ isLoading: true, error: null })
        try {
            const params = normalizeFetchParams(arg)
            const hasPageConfig = params && (params.page !== undefined || params.size !== undefined)
            const response = await solucoesApi.list(token, { ...(hasPageConfig ? {} : { size: 1000 }), ...params })
            set((state) => ({
                solucoes: response.content,
                pagination: {
                    ...state.pagination,
                    solucoes: {
                        page: response.page,
                        size: response.size,
                        totalElements: response.totalElements,
                        totalPages: response.totalPages,
                    },
                },
                isLoading: false,
            }))
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false })
        }
    },

    fetchUsuarios: async (arg?: FetchArg) => {
        const token = useAuthStore.getState().accessToken
        set({ isLoading: true, error: null })
        try {
            const params = normalizeFetchParams(arg)
            const hasPageConfig = params && (params.page !== undefined || params.size !== undefined)
            const response = await usuariosApi.list(token, { ...(hasPageConfig ? {} : { size: 1000 }), ...params })
            set((state) => ({
                usuarios: response.content,
                pagination: {
                    ...state.pagination,
                    usuarios: {
                        page: response.page,
                        size: response.size,
                        totalElements: response.totalElements,
                        totalPages: response.totalPages,
                    },
                },
                isLoading: false,
            }))
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false })
        }
    },

    fetchAlunos: async (arg?: FetchArg) => {
        const token = useAuthStore.getState().accessToken
        set({ isLoading: true, error: null })
        try {
            const params = normalizeFetchParams(arg)
            const hasPageConfig = params && (params.page !== undefined || params.size !== undefined)
            const response = await alunosApi.list(token, { ...(hasPageConfig ? {} : { size: 1000 }), ...params })
            set((state) => ({
                alunos: response.content,
                pagination: {
                    ...state.pagination,
                    alunos: {
                        page: response.page,
                        size: response.size,
                        totalElements: response.totalElements,
                        totalPages: response.totalPages,
                    },
                },
                isLoading: false,
            }))
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false })
        }
    },

    fetchEscolas: async (arg?: FetchArg) => {
        const token = useAuthStore.getState().accessToken
        set({ isLoading: true, error: null })
        try {
            const params = normalizeFetchParams(arg)
            const hasPageConfig = params && (params.page !== undefined || params.size !== undefined)
            const response = await escolasApi.list(token, { ...(hasPageConfig ? {} : { size: 1000 }), ...params })

            const content = Array.isArray(response?.content) ? response.content : Array.isArray(response) ? response : []
            const paginationMeta = response?.totalPages !== undefined ? {
                page: response.page,
                size: response.size,
                totalElements: response.totalElements,
                totalPages: response.totalPages,
            } : undefined

            set((state) => ({
                escolas: content,
                pagination: paginationMeta ? {
                    ...state.pagination,
                    escolas: paginationMeta,
                } : state.pagination,
                isLoading: false,
            }))
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false })
        }
    },

    fetchRegioes: async (arg?: FetchArg) => {
        const token = useAuthStore.getState().accessToken
        set({ isLoading: true, error: null })
        try {
            const params = normalizeFetchParams(arg)
            const hasPageConfig = params && (params.page !== undefined || params.size !== undefined)
            const response = await regioesApi.list(token, { ...(hasPageConfig ? {} : { size: 1000 }), ...params })
            set((state) => ({
                regioes: response.content,
                pagination: {
                    ...state.pagination,
                    regioes: {
                        page: response.page,
                        size: response.size,
                        totalElements: response.totalElements,
                        totalPages: response.totalPages,
                    },
                },
                isLoading: false,
            }))
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false })
        }
    },

    fetchGrupos: async (arg?: FetchArg) => {
        const token = useAuthStore.getState().accessToken
        set({ isLoading: true, error: null })
        try {
            const params = normalizeFetchParams(arg)
            const hasPageConfig = params && (params.page !== undefined || params.size !== undefined)
            const response = await gruposApi.list(token, { ...(hasPageConfig ? {} : { size: 1000 }), ...params })
            set((state) => ({
                grupos: response.content,
                pagination: {
                    ...state.pagination,
                    grupos: {
                        page: response.page,
                        size: response.size,
                        totalElements: response.totalElements,
                        totalPages: response.totalPages,
                    },
                },
                isLoading: false,
            }))
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false })
        }
    },

    fetchTurmas: async (arg?: FetchArg) => {
        const token = useAuthStore.getState().accessToken
        set({ isLoading: true, error: null })
        try {
            const params = normalizeFetchParams(arg)
            const hasPageConfig = params && (params.page !== undefined || params.size !== undefined)
            const response = await turmasApi.list(token, { ...(hasPageConfig ? {} : { size: 1000 }), ...params })

            const content = Array.isArray(response?.content) ? response.content : Array.isArray(response) ? response : []
            const paginationMeta = response?.totalPages !== undefined ? {
                page: response.page,
                size: response.size,
                totalElements: response.totalElements,
                totalPages: response.totalPages,
            } : undefined

            set((state) => ({
                turmas: content,
                pagination: paginationMeta ? {
                    ...state.pagination,
                    turmas: paginationMeta,
                } : state.pagination,
                isLoading: false,
            }))
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false })
        }
    },

    fetchRoles: async (arg?: FetchArg) => {
        const token = useAuthStore.getState().accessToken
        try {
            const params = normalizeFetchParams(arg)
            const response = await rolesApi.list(token, params)
            set({ roles: response.content })
        } catch (error) {
            console.error('Erro ao buscar roles:', error)
        }
    },

    // Municipios CRUD
    addMunicipio: async (data) => {
        const token = useAuthStore.getState().accessToken
        const municipio = await municipiosApi.create(data, token)
        set((state) => ({ municipios: [...state.municipios, municipio] }))
        return municipio
    },

    updateMunicipio: async (id, data) => {
        const token = useAuthStore.getState().accessToken
        const updated = await municipiosApi.update(id, data, token)
        set((state) => ({
            municipios: state.municipios.map((m) => (m.id === id ? updated : m)),
        }))
    },

    deleteMunicipio: async (id) => {
        const token = useAuthStore.getState().accessToken
        await municipiosApi.delete(id, token)
        set((state) => ({
            municipios: state.municipios.filter((m) => m.id !== id),
        }))
    },

    ativarMunicipio: async (id) => {
        const token = useAuthStore.getState().accessToken
        await municipiosApi.ativar(id, token)
        set((state) => ({
            municipios: state.municipios.map((m) => (m.id === id ? { ...m, ativo: true } : m)),
        }))
    },

    inativarMunicipio: async (id) => {
        const token = useAuthStore.getState().accessToken
        await municipiosApi.inativar(id, token)
        set((state) => ({
            municipios: state.municipios.map((m) => (m.id === id ? { ...m, ativo: false } : m)),
        }))
    },

    uploadImageMunicipio: async (id, file) => {
        const token = useAuthStore.getState().accessToken
        const updated = await municipiosApi.uploadImageMunicipio(id, file, token)
        set((state) => ({
            municipios: state.municipios.map((m) => (m.id === id ? updated : m)),
        }))
        return updated
    },

    uploadImageEducacao: async (id, file) => {
        const token = useAuthStore.getState().accessToken
        const updated = await municipiosApi.uploadImageEducacao(id, file, token)
        set((state) => ({
            municipios: state.municipios.map((m) => (m.id === id ? updated : m)),
        }))
        return updated
    },

    deleteImageMunicipio: async (id) => {
        const token = useAuthStore.getState().accessToken
        await municipiosApi.deleteImageMunicipio(id, token)
        set((state) => ({
            municipios: state.municipios.map((m) => (m.id === id ? { ...m, imageMunicipioUrl: null } : m)),
        }))
    },

    deleteImageEducacao: async (id) => {
        const token = useAuthStore.getState().accessToken
        await municipiosApi.deleteImageEducacao(id, token)
        set((state) => ({
            municipios: state.municipios.map((m) => (m.id === id ? { ...m, imageEducacaoUrl: null } : m)),
        }))
    },

    // Soluções CRUD
    addSolucao: async (data) => {
        const token = useAuthStore.getState().accessToken
        const solucao = await solucoesApi.create(data, token)
        set((state) => ({ solucoes: [...state.solucoes, solucao] }))
        return solucao
    },

    updateSolucao: async (id, data) => {
        const token = useAuthStore.getState().accessToken
        const updated = await solucoesApi.update(id, data, token)
        set((state) => ({
            solucoes: state.solucoes.map((s) => (s.id === id ? updated : s)),
        }))
    },

    deleteSolucao: async (id) => {
        const token = useAuthStore.getState().accessToken
        await solucoesApi.delete(id, token)
        set((state) => ({
            solucoes: state.solucoes.filter((s) => s.id !== id),
        }))
    },

    ativarSolucao: async (id) => {
        const token = useAuthStore.getState().accessToken
        const updated = await solucoesApi.ativar(id, token)
        set((state) => ({
            solucoes: state.solucoes.map((s) => (s.id === id ? updated : s)),
        }))
    },

    inativarSolucao: async (id) => {
        const token = useAuthStore.getState().accessToken
        const updated = await solucoesApi.inativar(id, token)
        set((state) => ({
            solucoes: state.solucoes.map((s) => (s.id === id ? updated : s)),
        }))
    },

    getSolucoesByMunicipio: (municipioId) => {
        return get().solucoes.filter((s) => s.municipioId === municipioId)
    },

    // Usuários CRUD
    addUsuario: async (data) => {
        const token = useAuthStore.getState().accessToken
        const usuario = await usuariosApi.create(data, token)
        set((state) => ({ usuarios: [...state.usuarios, usuario] }))
        return usuario
    },

    updateUsuario: async (id, data) => {
        const token = useAuthStore.getState().accessToken
        const updated = await usuariosApi.update(id, data, token)
        set((state) => ({
            usuarios: state.usuarios.map((u) => (u.id === id ? updated : u)),
        }))
    },

    deleteUsuario: async (id) => {
        const token = useAuthStore.getState().accessToken
        await usuariosApi.delete(id, token)
        set((state) => ({
            usuarios: state.usuarios.filter((u) => u.id !== id),
        }))
    },

    getUsuariosByMunicipio: (municipioId) => {
        return get().usuarios.filter((u) => u.municipioId === municipioId)
    },

    // Alunos CRUD
    addAluno: async (data) => {
        const token = useAuthStore.getState().accessToken
        const aluno = await alunosApi.create(data, token)
        set((state) => ({ alunos: [...state.alunos, aluno] }))
        return aluno
    },

    updateAluno: async (id, data) => {
        const token = useAuthStore.getState().accessToken
        const updated = await alunosApi.update(id, data, token)
        set((state) => ({
            alunos: state.alunos.map((a) => (a.id === id ? updated : a)),
        }))
    },

    deleteAluno: async (id) => {
        const token = useAuthStore.getState().accessToken
        await alunosApi.delete(id, token)
        set((state) => ({
            alunos: state.alunos.filter((a) => a.id !== id),
        }))
    },

    getAlunosByMunicipio: (municipioId) => {
        return get().alunos.filter((a) => a.municipioId === municipioId)
    },

    // Escolas CRUD
    addEscola: async (data) => {
        const token = useAuthStore.getState().accessToken
        const escola = await escolasApi.create(data, token)
        set((state) => ({ escolas: [...state.escolas, escola] }))
        return escola
    },

    updateEscola: async (id, data) => {
        const token = useAuthStore.getState().accessToken
        const updated = await escolasApi.update(id, data, token)
        set((state) => ({
            escolas: state.escolas.map((e) => (e.id === id ? updated : e)),
        }))
    },

    deleteEscola: async (id) => {
        const token = useAuthStore.getState().accessToken
        await escolasApi.delete(id, token)
        set((state) => ({
            escolas: state.escolas.filter((e) => e.id !== id),
        }))
    },

    getEscolasByMunicipio: (municipioId) => {
        return get().escolas.filter((e) => e.municipioId === municipioId)
    },

    // Regioes CRUD
    addRegiao: async (data) => {
        const token = useAuthStore.getState().accessToken
        const regiao = await regioesApi.create(data, token)
        set((state) => ({ regioes: [...state.regioes, regiao] }))
        return regiao
    },

    updateRegiao: async (id, data) => {
        const token = useAuthStore.getState().accessToken
        const updated = await regioesApi.update(id, data, token)
        set((state) => ({
            regioes: state.regioes.map((r) => (r.id === id ? updated : r)),
        }))
    },

    deleteRegiao: async (id) => {
        const token = useAuthStore.getState().accessToken
        await regioesApi.delete(id, token)
        set((state) => ({
            regioes: state.regioes.filter((r) => r.id !== id),
        }))
    },

    // Grupos CRUD
    addGrupo: async (data) => {
        const token = useAuthStore.getState().accessToken
        const grupo = await gruposApi.create(data, token)
        set((state) => ({ grupos: [...state.grupos, grupo] }))
        return grupo
    },

    updateGrupo: async (id, data) => {
        const token = useAuthStore.getState().accessToken
        const updated = await gruposApi.update(id, data, token)
        set((state) => ({
            grupos: state.grupos.map((g) => (g.id === id ? updated : g)),
        }))
    },

    deleteGrupo: async (id) => {
        const token = useAuthStore.getState().accessToken
        await gruposApi.delete(id, token)
        set((state) => ({
            grupos: state.grupos.filter((g) => g.id !== id),
        }))
    },

    // Turmas CRUD
    addTurma: async (data) => {
        const token = useAuthStore.getState().accessToken
        const turma = await turmasApi.create(data, token)
        set((state) => ({ turmas: [...state.turmas, turma] }))
        return turma
    },

    updateTurma: async (id, data) => {
        const token = useAuthStore.getState().accessToken
        const updated = await turmasApi.update(id, data, token)
        set((state) => ({
            turmas: state.turmas.map((t) => (t.id === id ? updated : t)),
        }))
    },

    deleteTurma: async (id) => {
        const token = useAuthStore.getState().accessToken
        await turmasApi.delete(id, token)
        set((state) => ({
            turmas: state.turmas.filter((t) => t.id !== id),
        }))
    },

    // Roles CRUD
    addRole: async (data) => {
        const token = useAuthStore.getState().accessToken
        const role = await rolesApi.create(data, token)
        set((state) => ({ roles: [...state.roles, role] }))
        return role
    },

    updateRole: async (id, data) => {
        const token = useAuthStore.getState().accessToken
        const updated = await rolesApi.update(id, data, token)
        set((state) => ({
            roles: state.roles.map((r) => (r.id === id ? updated : r)),
        }))
        return updated
    },

    deleteRole: async (id) => {
        const token = useAuthStore.getState().accessToken
        await rolesApi.delete(id, token)
        set((state) => ({
            roles: state.roles.filter((r) => r.id !== id),
        }))
    },

    // Helpers
    getMunicipioById: (id) => {
        return get().municipios.find((m) => m.id === id)
    },

    clearError: () => set({ error: null }),
}))
