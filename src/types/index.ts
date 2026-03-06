// Auth Types
export interface LoginCredentials {
    email: string
    password: string
}

export interface AuthResponse {
    userId: number
    nome: string
    email: string
    role: string
    municipio: string
    accessToken: string
    refreshToken: string
}

export interface AuthUser {
    id: number
    nome: string
    email: string
    role: string
    municipio: string
    municipioId?: number
}

export interface RegisterData {
    nome: string
    email: string
    password: string
    municipioId?: number
}

// Municipality Types
export interface Municipio {
    id: number
    nome: string
    uf: string
    slug: string
    ativo: boolean
    totalUsuarios: number
    totalAlunos: number
    totalSolucoes: number
    totalEscolas: number
    totalTurmas: number
}

// Solution Types
export interface Solucao {
    id: number
    nome: string
    descricao: string
    link?: string
    municipioId?: number
    municipio?: string
    ativo: boolean
}

// Student Types
export interface Aluno {
    id: number
    nome: string
    dataNascimento: string
    cpf?: string
    matricula: string
    turmaId: number
    escolaId: number
    municipioId: number
    municipio?: string
}

// School Types
export interface Escola {
    id: number
    nome: string
    grupoId?: number
    regiaoId?: number
    grupo?: string
    regiao?: string
    municipio?: string
    municipioId: number
}

// User Types
export interface Usuario {
    id: number
    nome: string
    email: string
    tipoUsuario: string
    municipioId?: number
    municipio?: string
    ativo: boolean
}

// New Entity Types
export interface Regiao {
    id: number
    nome: string
    municipioId: number
    municipio?: string
}

export interface Grupo {
    id: number
    nome: string
    municipioId: number
    municipio?: string
}

export interface Turma {
    id: number
    nome: string
    turno: string
    serie: string
    escolaId: number
    escola?: string
    municipioId: number
    municipio?: string
}

export interface Role {
    id: number
    nome: string
    descricao?: string
}

// Pagination
export interface PageResponse<T> {
    content: T[]
    page: number
    size: number
    totalElements: number
    totalPages: number
}

// Form Types
export interface MunicipioFormData {
    nome: string
    uf: string
    slug?: string
}

export interface SolucaoFormData {
    nome: string
    descricao: string
    link?: string
}

export interface UsuarioFormData {
    nome: string
    email: string
    password?: string
    tipoUsuarioId?: number
    municipioId?: number
}

export interface AlunoFormData {
    nome: string
    dataNascimento: string
    cpf?: string
    matricula: string
    turmaId: number
    escolaId: number
}

export interface EscolaFormData {
    nome: string
    grupoId?: number
    regiaoId?: number
}

export interface RegiaoFormData {
    nome: string
}

export interface GrupoFormData {
    nome: string
}

export interface TurmaFormData {
    nome: string
    turno: string
    serie: string
    escolaId: number
}

export interface MunicipioSolucao {
    id: number
    municipioId: number
    solucaoId: number
    dataVinculo: string
}
