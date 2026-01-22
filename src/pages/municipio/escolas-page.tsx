import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore } from '@/stores'
import type { Escola } from '@/types'

export function MunicipioEscolasPage() {
    const { municipioId } = useParams()
    const navigate = useNavigate()
    const {
        municipios,
        fetchMunicipios,
        fetchEscolas,
        getEscolasByMunicipio,
        addEscola,
        updateEscola,
        deleteEscola
    } = useDataStore()

    // Fetch data on mount
    useEffect(() => {
        fetchMunicipios()
        fetchEscolas(municipioId)
    }, [municipioId, fetchMunicipios, fetchEscolas])

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedEscola, setSelectedEscola] = useState<Escola | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterTipo, setFilterTipo] = useState('')

    // Form state
    const [formData, setFormData] = useState({
        nome: '',
        codigo: '',
        endereco: '',
        telefone: '',
        email: '',
        diretor: '',
        tipoEnsino: 'fundamental' as 'infantil' | 'fundamental' | 'medio' | 'integral',
        turno: 'matutino' as 'matutino' | 'vespertino' | 'noturno' | 'integral',
        totalAlunos: 0,
        status: 'ativo' as 'ativo' | 'inativo'
    })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    const municipio = municipios.find((m) => m.id === municipioId)
    const escolasDoMunicipio = getEscolasByMunicipio(municipioId || '')

    // Filtros
    const filteredEscolas = escolasDoMunicipio.filter(escola => {
        const matchSearch = escola.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            escola.codigo.toLowerCase().includes(searchTerm.toLowerCase())
        const matchTipo = !filterTipo || escola.tipoEnsino === filterTipo
        return matchSearch && matchTipo
    })

    const validateForm = () => {
        const errors: Record<string, string> = {}
        if (!formData.nome || formData.nome.length < 3) {
            errors.nome = 'Nome deve ter no mínimo 3 caracteres'
        }
        if (!formData.codigo || formData.codigo.length < 2) {
            errors.codigo = 'Código é obrigatório'
        }
        if (!formData.endereco || formData.endereco.length < 5) {
            errors.endereco = 'Endereço é obrigatório'
        }
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const resetForm = () => {
        setFormData({
            nome: '',
            codigo: '',
            endereco: '',
            telefone: '',
            email: '',
            diretor: '',
            tipoEnsino: 'fundamental',
            turno: 'matutino',
            totalAlunos: 0,
            status: 'ativo'
        })
        setFormErrors({})
    }

    const handleOpenAddModal = () => {
        resetForm()
        setShowAddModal(true)
    }

    const handleOpenEditModal = (escola: Escola) => {
        setSelectedEscola(escola)
        setFormData({
            nome: escola.nome,
            codigo: escola.codigo,
            endereco: escola.endereco,
            telefone: escola.telefone || '',
            email: escola.email || '',
            diretor: escola.diretor || '',
            tipoEnsino: escola.tipoEnsino,
            turno: escola.turno,
            totalAlunos: escola.totalAlunos,
            status: escola.status
        })
        setFormErrors({})
        setShowEditModal(true)
    }

    const handleOpenDeleteModal = (escola: Escola) => {
        setSelectedEscola(escola)
        setShowDeleteModal(true)
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm() || !municipioId) return

        setIsLoading(true)
        try {
            await addEscola({
                nome: formData.nome,
                codigo: formData.codigo,
                endereco: formData.endereco,
                telefone: formData.telefone || undefined,
                email: formData.email || undefined,
                diretor: formData.diretor || undefined,
                tipoEnsino: formData.tipoEnsino,
                turno: formData.turno,
                municipioId: municipioId,
                status: formData.status,
            })
            setShowAddModal(false)
            await fetchEscolas(municipioId)
        } catch (error) {
            console.error('Erro ao cadastrar escola:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm() || !selectedEscola) return

        setIsLoading(true)
        try {
            await updateEscola(selectedEscola.id, {
                nome: formData.nome,
                codigo: formData.codigo,
                endereco: formData.endereco,
                telefone: formData.telefone || undefined,
                email: formData.email || undefined,
                diretor: formData.diretor || undefined,
                tipoEnsino: formData.tipoEnsino,
                turno: formData.turno,
                status: formData.status,
            })
            setShowEditModal(false)
            setSelectedEscola(null)
            await fetchEscolas(municipioId)
        } catch (error) {
            console.error('Erro ao atualizar escola:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!selectedEscola) return

        setIsLoading(true)
        try {
            await deleteEscola(selectedEscola.id)
            setShowDeleteModal(false)
            setSelectedEscola(null)
            await fetchEscolas(municipioId)
        } catch (error) {
            console.error('Erro ao excluir escola:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const tipoEnsinoLabels = {
        infantil: 'Educação Infantil',
        fundamental: 'Ensino Fundamental',
        medio: 'Ensino Médio',
        integral: 'Tempo Integral'
    }

    const turnoLabels = {
        matutino: 'Matutino',
        vespertino: 'Vespertino',
        noturno: 'Noturno',
        integral: 'Integral'
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

    const totalAlunos = escolasDoMunicipio.reduce((acc, e) => acc + (e.totalAlunos || 0), 0)
    const escolasAtivas = escolasDoMunicipio.filter(e => e.status === 'ativo').length

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
                        <h1 className="h3 fw-bold text-dark mb-0">Escolas</h1>
                    </div>
                    <p className="text-muted mb-0">{municipio.nome} - {municipio.estado}</p>
                </div>
                <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={handleOpenAddModal}
                >
                    <i className="bi bi-plus-lg"></i>
                    Nova Escola
                </button>
            </div>

            {/* Stats */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm bg-primary text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-building" style={{ fontSize: 32 }}></i>
                                <div>
                                    <p className="h3 fw-bold mb-0">{escolasDoMunicipio.length}</p>
                                    <p className="small mb-0 opacity-75">Total de Escolas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm bg-success text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-check-circle" style={{ fontSize: 32 }}></i>
                                <div>
                                    <p className="h3 fw-bold mb-0">{escolasAtivas}</p>
                                    <p className="small mb-0 opacity-75">Escolas Ativas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm bg-info text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-person-badge" style={{ fontSize: 32 }}></i>
                                <div>
                                    <p className="h3 fw-bold mb-0">{totalAlunos.toLocaleString()}</p>
                                    <p className="small mb-0 opacity-75">Total de Alunos</p>
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
                        <div className="col-md-6">
                            <div className="input-group">
                                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar por nome ou código..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <select
                                className="form-select"
                                value={filterTipo}
                                onChange={(e) => setFilterTipo(e.target.value)}
                            >
                                <option value="">Todos os tipos</option>
                                <option value="infantil">Educação Infantil</option>
                                <option value="fundamental">Ensino Fundamental</option>
                                <option value="medio">Ensino Médio</option>
                                <option value="integral">Tempo Integral</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schools Table */}
            {filteredEscolas.length > 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="border-0">Escola</th>
                                        <th className="border-0">Tipo</th>
                                        <th className="border-0">Turno</th>
                                        <th className="border-0">Alunos</th>
                                        <th className="border-0">Status</th>
                                        <th className="border-0 text-end">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEscolas.map((escola) => (
                                        <tr key={escola.id}>
                                            <td className="align-middle">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="d-flex align-items-center justify-content-center rounded bg-primary bg-opacity-10"
                                                        style={{ width: 44, height: 44 }}>
                                                        <i className="bi bi-building text-primary" style={{ fontSize: 20 }}></i>
                                                    </div>
                                                    <div>
                                                        <p className="fw-medium mb-0">{escola.nome}</p>
                                                        <p className="text-muted small mb-0">Código: {escola.codigo}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="align-middle">
                                                <span className="badge bg-light text-dark">
                                                    {tipoEnsinoLabels[escola.tipoEnsino]}
                                                </span>
                                            </td>
                                            <td className="align-middle">
                                                <span className="text-muted small">{turnoLabels[escola.turno]}</span>
                                            </td>
                                            <td className="align-middle">
                                                <span className="fw-medium">{escola.totalAlunos}</span>
                                            </td>
                                            <td className="align-middle">
                                                <span className={`badge ${escola.status === 'ativo' ? 'bg-success' : 'bg-secondary'}`}>
                                                    {escola.status}
                                                </span>
                                            </td>
                                            <td className="align-middle text-end">
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => handleOpenEditModal(escola)}
                                                        title="Editar"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger"
                                                        onClick={() => handleOpenDeleteModal(escola)}
                                                        title="Excluir"
                                                    >
                                                        <i className="bi bi-trash"></i>
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
            ) : (
                <div className="text-center py-5">
                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mx-auto mb-4"
                        style={{ width: 100, height: 100 }}>
                        <i className="bi bi-building text-primary" style={{ fontSize: 48 }}></i>
                    </div>
                    <h5 className="text-muted">Nenhuma escola encontrada</h5>
                    <p className="text-muted mb-4">Cadastre a primeira escola deste município.</p>
                    <button className="btn btn-primary" onClick={handleOpenAddModal}>
                        <i className="bi bi-plus-lg me-2"></i>
                        Cadastrar Escola
                    </button>
                </div>
            )}

            {/* Modal Nova Escola */}
            {showAddModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-plus-circle me-2"></i>
                                        Nova Escola
                                    </h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
                                </div>
                                <form onSubmit={handleAddSubmit}>
                                    <div className="modal-body p-4">
                                        <div className="row g-3">
                                            <div className="col-md-8">
                                                <label className="form-label fw-medium">Nome da Escola <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${formErrors.nome ? 'is-invalid' : ''}`}
                                                    placeholder="Ex: EMEF Maria Montessori"
                                                    value={formData.nome}
                                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                />
                                                {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-medium">Código <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${formErrors.codigo ? 'is-invalid' : ''}`}
                                                    placeholder="Ex: SP001"
                                                    value={formData.codigo}
                                                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                                />
                                                {formErrors.codigo && <div className="invalid-feedback">{formErrors.codigo}</div>}
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-medium">Endereço <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${formErrors.endereco ? 'is-invalid' : ''}`}
                                                    placeholder="Rua, número, bairro"
                                                    value={formData.endereco}
                                                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                                />
                                                {formErrors.endereco && <div className="invalid-feedback">{formErrors.endereco}</div>}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">Telefone</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="(00) 0000-0000"
                                                    value={formData.telefone}
                                                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">E-mail</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    placeholder="escola@exemplo.gov.br"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">Diretor(a)</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Nome do diretor"
                                                    value={formData.diretor}
                                                    onChange={(e) => setFormData({ ...formData, diretor: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">Total de Alunos</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    min="0"
                                                    value={formData.totalAlunos}
                                                    onChange={(e) => setFormData({ ...formData, totalAlunos: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-medium">Tipo de Ensino</label>
                                                <select
                                                    className="form-select"
                                                    value={formData.tipoEnsino}
                                                    onChange={(e) => setFormData({ ...formData, tipoEnsino: e.target.value as any })}
                                                >
                                                    <option value="infantil">Educação Infantil</option>
                                                    <option value="fundamental">Ensino Fundamental</option>
                                                    <option value="medio">Ensino Médio</option>
                                                    <option value="integral">Tempo Integral</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-medium">Turno</label>
                                                <select
                                                    className="form-select"
                                                    value={formData.turno}
                                                    onChange={(e) => setFormData({ ...formData, turno: e.target.value as any })}
                                                >
                                                    <option value="matutino">Matutino</option>
                                                    <option value="vespertino">Vespertino</option>
                                                    <option value="noturno">Noturno</option>
                                                    <option value="integral">Integral</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-medium">Status</label>
                                                <select
                                                    className="form-select"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                                >
                                                    <option value="ativo">Ativo</option>
                                                    <option value="inativo">Inativo</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
                                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                            {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Cadastrar</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* Modal Editar Escola */}
            {showEditModal && selectedEscola && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title"><i className="bi bi-pencil me-2"></i>Editar Escola</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => { setShowEditModal(false); setSelectedEscola(null) }}></button>
                                </div>
                                <form onSubmit={handleEditSubmit}>
                                    <div className="modal-body p-4">
                                        <div className="row g-3">
                                            <div className="col-md-8">
                                                <label className="form-label fw-medium">Nome da Escola <span className="text-danger">*</span></label>
                                                <input type="text" className={`form-control ${formErrors.nome ? 'is-invalid' : ''}`} value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                                                {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-medium">Código <span className="text-danger">*</span></label>
                                                <input type="text" className={`form-control ${formErrors.codigo ? 'is-invalid' : ''}`} value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} />
                                                {formErrors.codigo && <div className="invalid-feedback">{formErrors.codigo}</div>}
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-medium">Endereço <span className="text-danger">*</span></label>
                                                <input type="text" className={`form-control ${formErrors.endereco ? 'is-invalid' : ''}`} value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} />
                                                {formErrors.endereco && <div className="invalid-feedback">{formErrors.endereco}</div>}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">Telefone</label>
                                                <input type="text" className="form-control" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">E-mail</label>
                                                <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">Diretor(a)</label>
                                                <input type="text" className="form-control" value={formData.diretor} onChange={(e) => setFormData({ ...formData, diretor: e.target.value })} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">Total de Alunos</label>
                                                <input type="number" className="form-control" min="0" value={formData.totalAlunos} onChange={(e) => setFormData({ ...formData, totalAlunos: parseInt(e.target.value) || 0 })} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-medium">Tipo de Ensino</label>
                                                <select className="form-select" value={formData.tipoEnsino} onChange={(e) => setFormData({ ...formData, tipoEnsino: e.target.value as any })}>
                                                    <option value="infantil">Educação Infantil</option>
                                                    <option value="fundamental">Ensino Fundamental</option>
                                                    <option value="medio">Ensino Médio</option>
                                                    <option value="integral">Tempo Integral</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-medium">Turno</label>
                                                <select className="form-select" value={formData.turno} onChange={(e) => setFormData({ ...formData, turno: e.target.value as any })}>
                                                    <option value="matutino">Matutino</option>
                                                    <option value="vespertino">Vespertino</option>
                                                    <option value="noturno">Noturno</option>
                                                    <option value="integral">Integral</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-medium">Status</label>
                                                <select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                                                    <option value="ativo">Ativo</option>
                                                    <option value="inativo">Inativo</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowEditModal(false); setSelectedEscola(null) }}>Cancelar</button>
                                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                            {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Salvar</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* Modal Confirmar Exclusão */}
            {showDeleteModal && selectedEscola && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-danger text-white">
                                    <h5 className="modal-title"><i className="bi bi-exclamation-triangle me-2"></i>Confirmar Exclusão</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => { setShowDeleteModal(false); setSelectedEscola(null) }}></button>
                                </div>
                                <div className="modal-body p-4 text-center">
                                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-4" style={{ width: 80, height: 80 }}>
                                        <i className="bi bi-trash text-danger" style={{ fontSize: 36 }}></i>
                                    </div>
                                    <h5 className="mb-2">Excluir "{selectedEscola.nome}"?</h5>
                                    <p className="text-muted mb-0">Esta ação não pode ser desfeita. A escola e todos os dados relacionados serão removidos.</p>
                                </div>
                                <div className="modal-footer bg-light justify-content-center">
                                    <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setShowDeleteModal(false); setSelectedEscola(null) }}>Cancelar</button>
                                    <button type="button" className="btn btn-danger px-4" onClick={handleConfirmDelete} disabled={isLoading}>
                                        {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Excluindo...</> : <><i className="bi bi-trash me-2"></i>Sim, Excluir</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </div>
    )
}
