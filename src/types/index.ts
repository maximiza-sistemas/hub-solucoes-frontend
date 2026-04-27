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
    imageMunicipioUrl: string | null
    imageEducacaoUrl: string | null
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
    turma?: string
    serie?: string
    turmaId: number
    escolaId: number
    municipio?: string
    municipioId?: number
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
    totalTurmas: number
    totalAlunos: number
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
    totalAlunos: number
}

export interface MunicipioDashboard {
    municipioId: number | string
    municipioNome: string
    totalAlunos: number
    totalEscolas: number
    totalUsuarios: number
    totalSolucoes: number
}

export interface ChartData {
    name: string
    value: number
}

export interface Role {
    id: number
    nome: string
    descricao?: string
    descricaoPtBr?: string
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

// Import Types
export interface ImportError {
    linha: number
    aluno: string
    motivo: string
}

export interface ImportResult {
    totalLinhas: number
    sucesso: number
    erros: number
    falhas: ImportError[]
}

export type ImportJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface AlunoImportadoResumo {
    linha: number
    nome: string
    cpf?: string
    email?: string
}

export interface ImportJobProgress {
    id: string
    fileName: string
    status: ImportJobStatus
    totalLinhas: number
    processadas: number
    sucesso: number
    erros: number
    existentes: number
    percentual: number
    tempoDecorridoMs: number
    tempoEstimadoRestanteMs: number | null
    cadastrados: AlunoImportadoResumo[]
    linhasExistentes: AlunoImportadoResumo[]
    falhas: ImportError[]
    erroFatal?: string | null
}
