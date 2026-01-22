import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore } from '@/stores'
import { generateId } from '@/lib/utils'
import type { Solucao } from '@/types'

export function MunicipioSolucoesPage() {
    const { municipioId } = useParams()
    const navigate = useNavigate()
    const { municipios, getSolucoesByMunicipio, addSolucao, updateSolucao, deleteSolucao } = useDataStore()

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedSolucao, setSelectedSolucao] = useState<Solucao | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        url: '',
        status: 'ativo' as 'ativo' | 'inativo'
    })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    const municipio = municipios.find((m) => m.id === municipioId)
    const solucoes = getSolucoesByMunicipio(municipioId || '')

    const validateForm = () => {
        const errors: Record<string, string> = {}
        if (!formData.nome || formData.nome.length < 3) {
            errors.nome = 'Nome deve ter no mínimo 3 caracteres'
        }
        if (!formData.descricao || formData.descricao.length < 10) {
            errors.descricao = 'Descrição deve ter no mínimo 10 caracteres'
        }
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleOpenAddModal = () => {
        setFormData({
            nome: '',
            descricao: '',
            url: '',
            status: 'ativo'
        })
        setFormErrors({})
        setShowAddModal(true)
    }

    const handleOpenEditModal = (solucao: Solucao) => {
        setSelectedSolucao(solucao)
        setFormData({
            nome: solucao.nome,
            descricao: solucao.descricao,
            url: solucao.url || '',
            status: solucao.status
        })
        setFormErrors({})
        setShowEditModal(true)
    }

    const handleOpenDeleteModal = (solucao: Solucao) => {
        setSelectedSolucao(solucao)
        setShowDeleteModal(true)
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm() || !municipioId) return

        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 500))

        addSolucao({
            id: generateId(),
            nome: formData.nome,
            descricao: formData.descricao,
            url: formData.url || undefined,
            status: formData.status,
            municipioId: municipioId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        setIsLoading(false)
        setShowAddModal(false)
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm() || !selectedSolucao) return

        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 500))

        updateSolucao(selectedSolucao.id, {
            nome: formData.nome,
            descricao: formData.descricao,
            url: formData.url || undefined,
            status: formData.status,
        })

        setIsLoading(false)
        setShowEditModal(false)
        setSelectedSolucao(null)
    }

    const handleConfirmDelete = async () => {
        if (!selectedSolucao) return

        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 500))

        deleteSolucao(selectedSolucao.id)

        setIsLoading(false)
        setShowDeleteModal(false)
        setSelectedSolucao(null)
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

    const solucoesAtivas = solucoes.filter(s => s.status === 'ativo').length
    const solucoesInativas = solucoes.filter(s => s.status === 'inativo').length

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
                        <h1 className="h3 fw-bold text-dark mb-0">Soluções Educacionais</h1>
                    </div>
                    <p className="text-muted mb-0">{municipio.nome} - {municipio.estado}</p>
                </div>
                <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={handleOpenAddModal}
                >
                    <i className="bi bi-plus-lg"></i>
                    Nova Solução
                </button>
            </div>

            {/* Stats */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm bg-primary text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-mortarboard" style={{ fontSize: 32 }}></i>
                                <div>
                                    <p className="h3 fw-bold mb-0">{solucoes.length}</p>
                                    <p className="small mb-0 opacity-75">Total de Soluções</p>
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
                                    <p className="h3 fw-bold mb-0">{solucoesAtivas}</p>
                                    <p className="small mb-0 opacity-75">Ativas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm bg-secondary text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-pause-circle" style={{ fontSize: 32 }}></i>
                                <div>
                                    <p className="h3 fw-bold mb-0">{solucoesInativas}</p>
                                    <p className="small mb-0 opacity-75">Inativas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Solutions Table */}
            {solucoes.length > 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="border-0">Solução</th>
                                        <th className="border-0">Descrição</th>
                                        <th className="border-0">Status</th>
                                        <th className="border-0 text-end">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {solucoes.map((solucao) => (
                                        <tr key={solucao.id}>
                                            <td className="align-middle">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="d-flex align-items-center justify-content-center rounded bg-primary bg-opacity-10"
                                                        style={{ width: 44, height: 44 }}>
                                                        <i className="bi bi-mortarboard text-primary" style={{ fontSize: 20 }}></i>
                                                    </div>
                                                    <div>
                                                        <p className="fw-medium mb-0">{solucao.nome}</p>
                                                        {solucao.url && (
                                                            <a href={solucao.url} target="_blank" rel="noopener noreferrer"
                                                                className="text-muted small text-decoration-none">
                                                                <i className="bi bi-link-45deg me-1"></i>
                                                                {solucao.url.replace('https://', '').substring(0, 30)}...
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="align-middle">
                                                <p className="text-muted small mb-0" style={{ maxWidth: 300 }}>
                                                    {solucao.descricao.length > 80
                                                        ? `${solucao.descricao.substring(0, 80)}...`
                                                        : solucao.descricao}
                                                </p>
                                            </td>
                                            <td className="align-middle">
                                                <span className={`badge ${solucao.status === 'ativo' ? 'bg-success' : 'bg-secondary'}`}>
                                                    {solucao.status}
                                                </span>
                                            </td>
                                            <td className="align-middle text-end">
                                                <div className="btn-group btn-group-sm">
                                                    {solucao.url && (
                                                        <a href={solucao.url} target="_blank" rel="noopener noreferrer"
                                                            className="btn btn-outline-success" title="Acessar">
                                                            <i className="bi bi-box-arrow-up-right"></i>
                                                        </a>
                                                    )}
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => handleOpenEditModal(solucao)}
                                                        title="Editar"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger"
                                                        onClick={() => handleOpenDeleteModal(solucao)}
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
                        <i className="bi bi-mortarboard text-primary" style={{ fontSize: 48 }}></i>
                    </div>
                    <h5 className="text-muted">Nenhuma solução cadastrada</h5>
                    <p className="text-muted mb-4">Este município ainda não possui soluções educacionais.</p>
                    <button
                        className="btn btn-primary"
                        onClick={handleOpenAddModal}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        Cadastrar Primeira Solução
                    </button>
                </div>
            )}

            {/* Modal Nova Solução */}
            {showAddModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-plus-circle me-2"></i>
                                        Nova Solução Educacional
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => setShowAddModal(false)}
                                    ></button>
                                </div>
                                <form onSubmit={handleAddSubmit}>
                                    <div className="modal-body p-4">
                                        <p className="text-muted mb-4">
                                            A solução será cadastrada para o município <strong>{municipio.nome}</strong>.
                                        </p>
                                        <div className="row g-4">
                                            <div className="col-12">
                                                <label className="form-label fw-medium">
                                                    Nome da Solução <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`}
                                                    placeholder="Ex: Portal do Aluno, Diário Digital..."
                                                    value={formData.nome}
                                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                />
                                                {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-medium">
                                                    Descrição <span className="text-danger">*</span>
                                                </label>
                                                <textarea
                                                    className={`form-control ${formErrors.descricao ? 'is-invalid' : ''}`}
                                                    rows={3}
                                                    placeholder="Descreva a solução educacional..."
                                                    value={formData.descricao}
                                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                                ></textarea>
                                                {formErrors.descricao && <div className="invalid-feedback">{formErrors.descricao}</div>}
                                            </div>
                                            <div className="col-md-8">
                                                <label className="form-label fw-medium">URL de Acesso</label>
                                                <div className="input-group">
                                                    <span className="input-group-text"><i className="bi bi-link-45deg"></i></span>
                                                    <input
                                                        type="url"
                                                        className="form-control"
                                                        placeholder="https://exemplo.com"
                                                        value={formData.url}
                                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-medium">Status</label>
                                                <select
                                                    className="form-select"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })}
                                                >
                                                    <option value="ativo">Ativo</option>
                                                    <option value="inativo">Inativo</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddModal(false)}>
                                            Cancelar
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                            {isLoading ? (
                                                <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</>
                                            ) : (
                                                <><i className="bi bi-check-lg me-2"></i>Cadastrar Solução</>
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

            {/* Modal Editar Solução */}
            {showEditModal && selectedSolucao && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-pencil me-2"></i>
                                        Editar Solução
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => { setShowEditModal(false); setSelectedSolucao(null) }}
                                    ></button>
                                </div>
                                <form onSubmit={handleEditSubmit}>
                                    <div className="modal-body p-4">
                                        <div className="row g-4">
                                            <div className="col-12">
                                                <label className="form-label fw-medium">
                                                    Nome da Solução <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`}
                                                    value={formData.nome}
                                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                />
                                                {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-medium">
                                                    Descrição <span className="text-danger">*</span>
                                                </label>
                                                <textarea
                                                    className={`form-control ${formErrors.descricao ? 'is-invalid' : ''}`}
                                                    rows={3}
                                                    value={formData.descricao}
                                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                                ></textarea>
                                                {formErrors.descricao && <div className="invalid-feedback">{formErrors.descricao}</div>}
                                            </div>
                                            <div className="col-md-8">
                                                <label className="form-label fw-medium">URL de Acesso</label>
                                                <div className="input-group">
                                                    <span className="input-group-text"><i className="bi bi-link-45deg"></i></span>
                                                    <input
                                                        type="url"
                                                        className="form-control"
                                                        value={formData.url}
                                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-medium">Status</label>
                                                <select
                                                    className="form-select"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })}
                                                >
                                                    <option value="ativo">Ativo</option>
                                                    <option value="inativo">Inativo</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowEditModal(false); setSelectedSolucao(null) }}>
                                            Cancelar
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                            {isLoading ? (
                                                <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</>
                                            ) : (
                                                <><i className="bi bi-check-lg me-2"></i>Salvar Alterações</>
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

            {/* Modal Confirmar Exclusão */}
            {showDeleteModal && selectedSolucao && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-danger text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        Confirmar Exclusão
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => { setShowDeleteModal(false); setSelectedSolucao(null) }}
                                    ></button>
                                </div>
                                <div className="modal-body p-4 text-center">
                                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-4"
                                        style={{ width: 80, height: 80 }}>
                                        <i className="bi bi-trash text-danger" style={{ fontSize: 36 }}></i>
                                    </div>
                                    <h5 className="mb-2">Excluir "{selectedSolucao.nome}"?</h5>
                                    <p className="text-muted mb-0">
                                        Esta ação não pode ser desfeita. A solução será permanentemente removida.
                                    </p>
                                </div>
                                <div className="modal-footer bg-light justify-content-center">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary px-4"
                                        onClick={() => { setShowDeleteModal(false); setSelectedSolucao(null) }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-danger px-4"
                                        onClick={handleConfirmDelete}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span>Excluindo...</>
                                        ) : (
                                            <><i className="bi bi-trash me-2"></i>Sim, Excluir</>
                                        )}
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
