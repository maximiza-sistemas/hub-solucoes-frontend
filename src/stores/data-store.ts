import { create } from 'zustand'
import type { Municipio, Solucao, User, Aluno, Escola } from '@/types'
import { municipiosApi, solucoesApi, usuariosApi, alunosApi, escolasApi } from '@/services/api'
import { useAuthStore } from './auth-store'

// Data Store - fetches from PostgreSQL via API
interface DataState {
    // Data
    municipios: Municipio[]
    solucoes: Solucao[]
    usuarios: User[]
    alunos: Aluno[]
    escolas: Escola[]

    // Loading states
    isLoading: boolean
    error: string | null

    // Fetch methods
    fetchMunicipios: () => Promise<void>
    fetchSolucoes: (municipioId?: string) => Promise<void>
    fetchUsuarios: (municipioId?: string) => Promise<void>
    fetchAlunos: (municipioId?: string) => Promise<void>
    fetchEscolas: (municipioId?: string) => Promise<void>

    // Municipios CRUD
    addMunicipio: (data: Partial<Municipio>) => Promise<Municipio>
    updateMunicipio: (id: string, data: Partial<Municipio>) => Promise<void>
    deleteMunicipio: (id: string) => Promise<void>

    // Soluções CRUD
    addSolucao: (data: Partial<Solucao>) => Promise<Solucao>
    updateSolucao: (id: string, data: Partial<Solucao>) => Promise<void>
    deleteSolucao: (id: string) => Promise<void>
    getSolucoesByMunicipio: (municipioId: string) => Solucao[]

    // Usuários CRUD
    addUsuario: (data: Partial<User> & { senha?: string }) => Promise<User>
    updateUsuario: (id: string, data: Partial<User>) => Promise<void>
    deleteUsuario: (id: string) => Promise<void>
    getUsuariosByMunicipio: (municipioId: string) => User[]

    // Alunos CRUD
    addAluno: (data: Partial<Aluno>) => Promise<Aluno>
    updateAluno: (id: string, data: Partial<Aluno>) => Promise<void>
    deleteAluno: (id: string) => Promise<void>
    getAlunosByMunicipio: (municipioId: string) => Aluno[]

    // Escolas CRUD
    addEscola: (data: Partial<Escola>) => Promise<Escola>
    updateEscola: (id: string, data: Partial<Escola>) => Promise<void>
    deleteEscola: (id: string) => Promise<void>
    getEscolasByMunicipio: (municipioId: string) => Escola[]

    // Helpers
    getMunicipioById: (id: string) => Municipio | undefined
    clearError: () => void
}

export const useDataStore = create<DataState>((set, get) => ({
    municipios: [],
    solucoes: [],
    usuarios: [],
    alunos: [],
    escolas: [],
    isLoading: false,
    error: null,

    // Fetch methods
    fetchMunicipios: async () => {
        const token = useAuthStore.getState().token
        set({ isLoading: true, error: null })
        try {
            const municipios = await municipiosApi.list(token)
            set({ municipios, isLoading: false })
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false })
        }
    },

    fetchSolucoes: async (municipioId?: string) => {
        const token = useAuthStore.getState().token
        set({ isLoading: true, error: null })
        try {
            const solucoes = await solucoesApi.list(municipioId, token)
            set({ solucoes, isLoading: false })
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false })
        }
    },

    fetchUsuarios: async (municipioId?: string) => {
        const token = useAuthStore.getState().token
        set({ isLoading: true, error: null })
        try {
            const usuarios = await usuariosApi.list(municipioId, token)
            set({ usuarios, isLoading: false })
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false })
        }
    },

    fetchAlunos: async (municipioId?: string) => {
        const token = useAuthStore.getState().token
        set({ isLoading: true, error: null })
        try {
            const alunos = await alunosApi.list(municipioId, token)
            set({ alunos, isLoading: false })
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false })
        }
    },

    fetchEscolas: async (municipioId?: string) => {
        const token = useAuthStore.getState().token
        set({ isLoading: true, error: null })
        try {
            const escolas = await escolasApi.list(municipioId, token)
            set({ escolas, isLoading: false })
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false })
        }
    },

    // Municipios CRUD
    addMunicipio: async (data) => {
        const token = useAuthStore.getState().token
        const municipio = await municipiosApi.create(data, token)
        set((state) => ({ municipios: [...state.municipios, municipio] }))
        return municipio
    },

    updateMunicipio: async (id, data) => {
        const token = useAuthStore.getState().token
        const updated = await municipiosApi.update(id, data, token)
        set((state) => ({
            municipios: state.municipios.map((m) => (m.id === id ? updated : m)),
        }))
    },

    deleteMunicipio: async (id) => {
        const token = useAuthStore.getState().token
        await municipiosApi.delete(id, token)
        set((state) => ({
            municipios: state.municipios.filter((m) => m.id !== id),
        }))
    },

    // Soluções CRUD
    addSolucao: async (data) => {
        const token = useAuthStore.getState().token
        const solucao = await solucoesApi.create(data, token)
        set((state) => ({ solucoes: [...state.solucoes, solucao] }))
        return solucao
    },

    updateSolucao: async (id, data) => {
        const token = useAuthStore.getState().token
        const updated = await solucoesApi.update(id, data, token)
        set((state) => ({
            solucoes: state.solucoes.map((s) => (s.id === id ? updated : s)),
        }))
    },

    deleteSolucao: async (id) => {
        const token = useAuthStore.getState().token
        await solucoesApi.delete(id, token)
        set((state) => ({
            solucoes: state.solucoes.filter((s) => s.id !== id),
        }))
    },

    getSolucoesByMunicipio: (municipioId) => {
        return get().solucoes.filter((s) => s.municipioId === municipioId)
    },

    // Usuários CRUD
    addUsuario: async (data) => {
        const token = useAuthStore.getState().token
        const usuario = await usuariosApi.create(data, token)
        set((state) => ({ usuarios: [...state.usuarios, usuario] }))
        return usuario
    },

    updateUsuario: async (id, data) => {
        const token = useAuthStore.getState().token
        const updated = await usuariosApi.update(id, data, token)
        set((state) => ({
            usuarios: state.usuarios.map((u) => (u.id === id ? updated : u)),
        }))
    },

    deleteUsuario: async (id) => {
        const token = useAuthStore.getState().token
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
        const token = useAuthStore.getState().token
        const aluno = await alunosApi.create(data, token)
        set((state) => ({ alunos: [...state.alunos, aluno] }))
        return aluno
    },

    updateAluno: async (id, data) => {
        const token = useAuthStore.getState().token
        const updated = await alunosApi.update(id, data, token)
        set((state) => ({
            alunos: state.alunos.map((a) => (a.id === id ? updated : a)),
        }))
    },

    deleteAluno: async (id) => {
        const token = useAuthStore.getState().token
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
        const token = useAuthStore.getState().token
        const escola = await escolasApi.create(data, token)
        set((state) => ({ escolas: [...state.escolas, escola] }))
        return escola
    },

    updateEscola: async (id, data) => {
        const token = useAuthStore.getState().token
        const updated = await escolasApi.update(id, data, token)
        set((state) => ({
            escolas: state.escolas.map((e) => (e.id === id ? updated : e)),
        }))
    },

    deleteEscola: async (id) => {
        const token = useAuthStore.getState().token
        await escolasApi.delete(id, token)
        set((state) => ({
            escolas: state.escolas.filter((e) => e.id !== id),
        }))
    },

    getEscolasByMunicipio: (municipioId) => {
        return get().escolas.filter((e) => e.municipioId === municipioId)
    },

    // Helpers
    getMunicipioById: (id) => {
        return get().municipios.find((m) => m.id === id)
    },

    clearError: () => set({ error: null }),
}))
