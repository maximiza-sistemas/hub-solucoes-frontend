import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore } from '@/stores'

export function MunicipioAlunosPage() {
    const { municipioId } = useParams()
    const navigate = useNavigate()
    const { municipios, alunos, escolas, addAluno, fetchAlunos, fetchEscolas } = useDataStore()

    const [searchTerm, setSearchTerm] = useState('')
    const [escolaFilter, setEscolaFilter] = useState<string>('todas')

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        nome: '',
        dataNascimento: '',
        cpf: '',
        matricula: '',
        escolaId: '',
        escola: '',
        serie: '',
        turma: '',
        responsavelNome: '',
        responsavelContato: '',
        status: 'ativo' as 'ativo' | 'inativo'
    })

    // Fetch data
    useEffect(() => {
        if (municipioId) {
            fetchAlunos(municipioId)
            fetchEscolas(municipioId)
        }
    }, [municipioId, fetchAlunos, fetchEscolas])

    const municipio = municipios.find((m) => m.id === municipioId)
    const municipioAlunos = alunos.filter((a) => a.municipioId === municipioId)
    const municipioEscolas = escolas.filter((e) => e.municipioId === municipioId)

    const escolasFromAlunos = [...new Set(municipioAlunos.map(a => a.escola))]

    const filteredAlunos = municipioAlunos.filter((a) => {
        const matchesSearch = a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.matricula.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesEscola = escolaFilter === 'todas' || a.escola === escolaFilter
        return matchesSearch && matchesEscola
    })

    const series = [
        '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano',
        '6º Ano', '7º Ano', '8º Ano', '9º Ano',
        '1º EM', '2º EM', '3º EM'
    ]

    const turmas = ['A', 'B', 'C', 'D', 'E']

    const handleOpenModal = () => {
        setFormData({
            nome: '',
            dataNascimento: '',
            cpf: '',
            matricula: '',
            escolaId: '',
            escola: '',
            serie: '',
            turma: '',
            responsavelNome: '',
            responsavelContato: '',
            status: 'ativo'
        })
        setError(null)
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setError(null)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        if (name === 'escolaId') {
            const selectedEscola = municipioEscolas.find(e => e.id === value)
            setFormData(prev => ({
                ...prev,
                escolaId: value,
                escola: selectedEscola?.nome || ''
            }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .slice(0, 14)
    }

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .slice(0, 15)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validação: se há escolas cadastradas, escolaId é obrigatório
        const escolaValida = municipioEscolas.length > 0 ? formData.escolaId : formData.escola
        if (!formData.nome || !formData.matricula || !escolaValida || !formData.serie || !formData.turma) {
            setError('Preencha todos os campos obrigatórios')
            return
        }

        if (!municipioId) return

        setIsLoading(true)
        setError(null)

        try {
            await addAluno({
                nome: formData.nome,
                dataNascimento: formData.dataNascimento || undefined,
                cpf: formData.cpf || undefined,
                matricula: formData.matricula,
                escolaId: formData.escolaId || undefined,
                escola: formData.escola,
                serie: formData.serie,
                turma: formData.turma,
                responsavelNome: formData.responsavelNome || undefined,
                responsavelContato: formData.responsavelContato || undefined,
                municipioId: municipioId,
                status: formData.status
            })

            await fetchAlunos(municipioId)
            handleCloseModal()
        } catch (err) {
            setError((err as Error).message || 'Erro ao cadastrar aluno')
        } finally {
            setIsLoading(false)
        }
    }

    if (!municipio) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ height: '50vh' }}>
                <div className="text-center">
                    <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: 48 }}></i>
                    <p className="text-muted mt-3">Município não encontrado</p>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => navigate(`/municipio/${municipioId}/dashboard`)}
                        >
                            <i className="bi bi-arrow-left"></i>
                        </button>
                        <h1 className="h3 fw-bold text-dark mb-0">Alunos</h1>
                    </div>
                    <p className="text-muted mb-0">{municipio.nome} - {municipio.estado}</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary">
                        <i className="bi bi-upload me-2"></i>
                        Importar Planilha
                    </button>
                    <button className="btn btn-primary" onClick={handleOpenModal}>
                        <i className="bi bi-plus-lg me-2"></i>
                        Novo Aluno
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm bg-info text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-mortarboard" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{municipioAlunos.length}</p>
                                    <p className="small mb-0 opacity-75">Total de Alunos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm bg-success text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-check-circle" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{municipioAlunos.filter(a => a.status === 'ativo').length}</p>
                                    <p className="small mb-0 opacity-75">Ativos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm bg-primary text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-building" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{municipioEscolas.length || escolasFromAlunos.length}</p>
                                    <p className="small mb-0 opacity-75">Escolas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm bg-warning text-dark">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-book" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{new Set(municipioAlunos.map(a => a.serie)).size}</p>
                                    <p className="small mb-0">Séries</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-12 col-md-6 col-lg-4">
                            <div className="input-group">
                                <span className="input-group-text bg-white">
                                    <i className="bi bi-search text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar aluno ou matrícula..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-12 col-md-6 col-lg-3">
                            <select
                                className="form-select"
                                value={escolaFilter}
                                onChange={(e) => setEscolaFilter(e.target.value)}
                            >
                                <option value="todas">Todas as escolas</option>
                                {escolasFromAlunos.map(escola => (
                                    <option key={escola} value={escola}>{escola}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="border-0">Aluno</th>
                                    <th className="border-0">Matrícula</th>
                                    <th className="border-0">Escola</th>
                                    <th className="border-0">Série/Turma</th>
                                    <th className="border-0">Status</th>
                                    <th className="border-0 text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAlunos.map((aluno) => (
                                    <tr key={aluno.id}>
                                        <td className="align-middle">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="d-flex align-items-center justify-content-center rounded-circle bg-info bg-opacity-10 text-info"
                                                    style={{ width: 40, height: 40, fontSize: 14 }}>
                                                    {aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="fw-medium mb-0">{aluno.nome}</p>
                                                    <p className="text-muted small mb-0">{aluno.responsavelNome}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="align-middle">
                                            <code className="bg-light px-2 py-1 rounded">{aluno.matricula}</code>
                                        </td>
                                        <td className="align-middle">{aluno.escola}</td>
                                        <td className="align-middle">{aluno.serie} - {aluno.turma}</td>
                                        <td className="align-middle">
                                            <span className={`badge ${aluno.status === 'ativo' ? 'bg-success' : 'bg-secondary'}`}>
                                                {aluno.status}
                                            </span>
                                        </td>
                                        <td className="align-middle text-end">
                                            <div className="btn-group btn-group-sm">
                                                <button className="btn btn-outline-primary">
                                                    <i className="bi bi-eye"></i>
                                                </button>
                                                <button className="btn btn-outline-secondary">
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {filteredAlunos.length === 0 && (
                <div className="text-center py-5">
                    <i className="bi bi-inbox text-muted" style={{ fontSize: 48 }}></i>
                    <p className="text-muted mt-3">Nenhum aluno encontrado</p>
                </div>
            )}

            {/* Create Student Modal */}
            {showModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-person-plus me-2"></i>
                                        Novo Aluno
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={handleCloseModal}
                                    ></button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body p-4">
                                        {error && (
                                            <div className="alert alert-danger d-flex align-items-center mb-4">
                                                <i className="bi bi-exclamation-triangle me-2"></i>
                                                {error}
                                            </div>
                                        )}

                                        {/* Personal Info */}
                                        <h6 className="text-muted mb-3">
                                            <i className="bi bi-person me-2"></i>
                                            Dados Pessoais
                                        </h6>
                                        <div className="row g-3 mb-4">
                                            <div className="col-md-8">
                                                <label className="form-label fw-medium">
                                                    Nome Completo <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="nome"
                                                    value={formData.nome}
                                                    onChange={handleInputChange}
                                                    placeholder="Nome completo do aluno"
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-medium">
                                                    Data de Nascimento
                                                </label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    name="dataNascimento"
                                                    value={formData.dataNascimento}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">CPF</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="cpf"
                                                    value={formData.cpf}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                                                    placeholder="000.000.000-00"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">
                                                    Matrícula <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="matricula"
                                                    value={formData.matricula}
                                                    onChange={handleInputChange}
                                                    placeholder="Número de matrícula"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* School Info */}
                                        <h6 className="text-muted mb-3">
                                            <i className="bi bi-building me-2"></i>
                                            Dados Escolares
                                        </h6>
                                        <div className="row g-3 mb-4">
                                            <div className="col-12">
                                                <label className="form-label fw-medium">
                                                    Escola <span className="text-danger">*</span>
                                                </label>
                                                {municipioEscolas.length > 0 ? (
                                                    <select
                                                        className="form-select"
                                                        name="escolaId"
                                                        value={formData.escolaId}
                                                        onChange={handleInputChange}
                                                        required
                                                    >
                                                        <option value="">Selecione uma escola</option>
                                                        {municipioEscolas.map(escola => (
                                                            <option key={escola.id} value={escola.id}>
                                                                {escola.nome}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="escola"
                                                        value={formData.escola}
                                                        onChange={handleInputChange}
                                                        placeholder="Nome da escola"
                                                        required
                                                    />
                                                )}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">
                                                    Série <span className="text-danger">*</span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    name="serie"
                                                    value={formData.serie}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">Selecione a série</option>
                                                    {series.map(serie => (
                                                        <option key={serie} value={serie}>{serie}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">
                                                    Turma <span className="text-danger">*</span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    name="turma"
                                                    value={formData.turma}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">Selecione a turma</option>
                                                    {turmas.map(turma => (
                                                        <option key={turma} value={turma}>{turma}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Guardian Info */}
                                        <h6 className="text-muted mb-3">
                                            <i className="bi bi-people me-2"></i>
                                            Dados do Responsável
                                        </h6>
                                        <div className="row g-3 mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">Nome do Responsável</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="responsavelNome"
                                                    value={formData.responsavelNome}
                                                    onChange={handleInputChange}
                                                    placeholder="Nome do responsável"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">Contato do Responsável</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="responsavelContato"
                                                    value={formData.responsavelContato}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        responsavelContato: formatPhone(e.target.value)
                                                    }))}
                                                    placeholder="(00) 00000-0000"
                                                />
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">Status</label>
                                                <select
                                                    className="form-select"
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="ativo">Ativo</option>
                                                    <option value="inativo">Inativo</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={handleCloseModal}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Salvando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-lg me-2"></i>
                                                    Cadastrar Aluno
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </div>
    )
}
