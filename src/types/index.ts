// User Types
export type UserRole = 'admin' | 'gestor' | 'usuario'

export interface User {
    id: string
    nome: string
    email: string
    cpf: string
    telefone?: string
    perfil: UserRole
    municipioId?: string
    status: 'ativo' | 'inativo'
    avatar?: string
    createdAt: string
    updatedAt: string
}

// Municipality Types
export interface Municipio {
    id: string
    nome: string
    estado: string
    codigoIBGE?: string
    logo?: string
    status: 'ativo' | 'inativo'
    totalUsuarios: number
    totalAlunos: number
    totalSolucoes: number
    createdAt: string
    updatedAt: string
}

// Solution Types
export type SolucaoCategoria =
    | 'educacao'
    | 'saude'
    | 'financeiro'
    | 'administrativo'
    | 'social'
    | 'outros'

export interface Solucao {
    id: string
    nome: string
    descricao: string
    categoria?: SolucaoCategoria
    url?: string
    icone?: string
    municipioId?: string
    status: 'ativo' | 'inativo'
    createdAt: string
    updatedAt: string
}

export interface MunicipioSolucao {
    id: string
    municipioId: string
    solucaoId: string
    dataVinculo: string
}

// Student Types
export interface Aluno {
    id: string
    nome: string
    dataNascimento: string
    cpf?: string
    matricula: string
    escola: string
    serie: string
    turma: string
    responsavelNome: string
    responsavelContato: string
    municipioId: string
    status: 'ativo' | 'inativo'
    createdAt: string
    updatedAt: string
}

// School Types
export interface Escola {
    id: string
    nome: string
    codigo: string
    endereco: string
    telefone?: string
    email?: string
    diretor?: string
    tipoEnsino: 'infantil' | 'fundamental' | 'medio' | 'integral'
    turno: 'matutino' | 'vespertino' | 'noturno' | 'integral'
    totalAlunos: number
    municipioId: string
    status: 'ativo' | 'inativo'
    createdAt: string
    updatedAt: string
}

// Auth Types
export interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
}

export interface LoginCredentials {
    email: string
    senha: string
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean
    data?: T
    message?: string
    error?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

// Dashboard Types
export interface DashboardStats {
    totalUsuarios: number
    totalAlunos: number
    totalSolucoes: number
    totalMunicipios?: number
    crescimentoUsuarios: number
    crescimentoAlunos: number
}

export interface ChartData {
    name: string
    value: number
}

// Form Types
export interface MunicipioFormData {
    nome: string
    estado: string
    codigoIBGE?: string
    logo?: File | null
    status: 'ativo' | 'inativo'
}

export interface SolucaoFormData {
    nome: string
    descricao: string
    categoria: SolucaoCategoria
    url?: string
    icone?: string
    status: 'ativo' | 'inativo'
}

export interface UsuarioFormData {
    nome: string
    email: string
    cpf: string
    telefone?: string
    perfil: UserRole
    municipioId?: string
    status: 'ativo' | 'inativo'
    senha?: string
}

export interface AlunoFormData {
    nome: string
    dataNascimento: string
    cpf?: string
    matricula: string
    escola: string
    serie: string
    turma: string
    responsavelNome: string
    responsavelContato: string
    municipioId: string
    status: 'ativo' | 'inativo'
}
