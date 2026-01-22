import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores'
import { solucoesApi } from '@/services/api'
import type { Solucao } from '@/types'

export function SolucoesPage() {
    const { token } = useAuthStore()
    const [solucoes, setSolucoes] = useState<Solucao[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
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

    // Load solucoes from backend
    const loadSolucoes = async () => {
        try {
            const data = await solucoesApi.list(undefined, token)
            setSolucoes(data)
        } catch (error) {
            console.error('Erro ao carregar soluções:', error)
        }
    }

    useEffect(() => {
        loadSolucoes()
    }, [token])

    const filteredSolucoes = solucoes.filter((s) =>
        s.nome.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Placeholder - municipalities count would need separate API call
    const getMunicipiosCount = (_solucaoId: string) => {
        return 0
    }

    const handleOpenModal = () => {
        setFormData({
            nome: '',
            descricao: '',
            url: '',
            status: 'ativo'
        })
        setFormErrors({})
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setFormErrors({})
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

    const handleCloseEditModal = () => {
        setShowEditModal(false)
        setSelectedSolucao(null)
        setFormErrors({})
    }

    const handleOpenDeleteModal = (solucao: Solucao) => {
        setSelectedSolucao(solucao)
        setShowDeleteModal(true)
    }

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false)
        setSelectedSolucao(null)
    }

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        try {
            await solucoesApi.create({
                nome: formData.nome,
                descricao: formData.descricao,
                categoria: 'educacao',
                url: formData.url || undefined,
                status: formData.status,
            }, token)
            await loadSolucoes()
            handleCloseModal()
        } catch (error) {
            console.error('Erro ao criar solução:', error)
            alert('Erro ao criar solução')
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm() || !selectedSolucao) return

        setIsLoading(true)
        try {
            await solucoesApi.update(selectedSolucao.id, {
                nome: formData.nome,
                descricao: formData.descricao,
                url: formData.url || undefined,
                status: formData.status,
            }, token)
            await loadSolucoes()
            handleCloseEditModal()
        } catch (error) {
            console.error('Erro ao atualizar solução:', error)
            alert('Erro ao atualizar solução')
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!selectedSolucao) return

        setIsLoading(true)
        try {
            await solucoesApi.delete(selectedSolucao.id, token)
            await loadSolucoes()
            handleCloseDeleteModal()
        } catch (error) {
            console.error('Erro ao excluir solução:', error)
            alert('Erro ao excluir solução')
        } finally {
            setIsLoading(false)
        }
    }

    // Estatísticas
    const totalSolucoes = solucoes.length
    const solucoesAtivas = solucoes.filter(s => s.status === 'ativo').length
    const solucoesInativas = solucoes.filter(s => s.status === 'inativo').length

    return (
        <div className="animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 fw-bold text-dark mb-1">Soluções Educacionais</h1>
                    <p className="text-muted mb-0">Gerencie as plataformas educacionais disponíveis para os municípios</p>
                </div>
                <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={handleOpenModal}
                >
                    <i className="bi bi-plus-lg"></i>
                    Nova Solução
                </button>
            </div>

            {/* Stats */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-lg-4">
                    <div className="card border-0 shadow-sm bg-primary text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-mortarboard" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{totalSolucoes}</p>
                                    <p className="small mb-0 opacity-75">Total de Soluções</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-4">
                    <div className="card border-0 shadow-sm bg-success text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-check-circle" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{solucoesAtivas}</p>
                                    <p className="small mb-0 opacity-75">Ativas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-4">
                    <div className="card border-0 shadow-sm bg-secondary text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-pause-circle" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{solucoesInativas}</p>
                                    <p className="small mb-0 opacity-75">Inativas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Filter */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row">
                        <div className="col-12 col-md-6 col-lg-4">
                            <div className="input-group">
                                <span className="input-group-text bg-white">
                                    <i className="bi bi-search text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar solução..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Solutions Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="border-0">Solução</th>
                                    <th className="border-0">Municípios</th>
                                    <th className="border-0">Status</th>
                                    <th className="border-0 text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSolucoes.map((solucao) => (
                                    <tr key={solucao.id}>
                                        <td className="align-middle">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="d-flex align-items-center justify-content-center rounded bg-primary bg-opacity-10"
                                                    style={{ width: 40, height: 40 }}>
                                                    <i className="bi bi-mortarboard text-primary"></i>
                                                </div>
                                                <div>
                                                    <p className="fw-medium mb-0">{solucao.nome}</p>
                                                    <p className="text-muted small mb-0 text-truncate" style={{ maxWidth: 300 }}>
                                                        {solucao.descricao}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="align-middle">
                                            <span className="badge bg-info">{getMunicipiosCount(solucao.id)} municípios</span>
                                        </td>
                                        <td className="align-middle">
                                            <span className={`badge ${solucao.status === 'ativo' ? 'bg-success' : 'bg-secondary'}`}>
                                                {solucao.status}
                                            </span>
                                        </td>
                                        <td className="align-middle text-end">
                                            <div className="btn-group btn-group-sm">
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

            {filteredSolucoes.length === 0 && (
                <div className="text-center py-5">
                    <i className="bi bi-inbox text-muted" style={{ fontSize: 48 }}></i>
                    <p className="text-muted mt-3">Nenhuma solução encontrada</p>
                </div>
            )}

            {/* Modal Nova Solução */}
            {showModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1} role="dialog">
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-mortarboard me-2"></i>
                                        Nova Solução Educacional
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={handleCloseModal}
                                    ></button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body p-4">
                                        <div className="row g-4">
                                            {/* Nome */}
                                            <div className="col-12">
                                                <label htmlFor="nome" className="form-label fw-medium">
                                                    Nome da Solução <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="nome"
                                                    className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`}
                                                    placeholder="Ex: Portal do Aluno"
                                                    value={formData.nome}
                                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                />
                                                {formErrors.nome && (
                                                    <div className="invalid-feedback">{formErrors.nome}</div>
                                                )}
                                            </div>

                                            {/* Descrição */}
                                            <div className="col-12">
                                                <label htmlFor="descricao" className="form-label fw-medium">
                                                    Descrição <span className="text-danger">*</span>
                                                </label>
                                                <textarea
                                                    id="descricao"
                                                    rows={3}
                                                    className={`form-control ${formErrors.descricao ? 'is-invalid' : ''}`}
                                                    placeholder="Descreva as funcionalidades da solução educacional..."
                                                    value={formData.descricao}
                                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                                />
                                                {formErrors.descricao && (
                                                    <div className="invalid-feedback">{formErrors.descricao}</div>
                                                )}
                                            </div>

                                            {/* Status */}
                                            <div className="col-md-6">
                                                <label htmlFor="status" className="form-label fw-medium">
                                                    Status
                                                </label>
                                                <select
                                                    id="status"
                                                    className="form-select form-select-lg"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })}
                                                >
                                                    <option value="ativo">Ativo</option>
                                                    <option value="inativo">Inativo</option>
                                                </select>
                                            </div>

                                            {/* URL */}
                                            <div className="col-md-6">
                                                <label htmlFor="url" className="form-label fw-medium">
                                                    URL de Acesso
                                                </label>
                                                <div className="input-group input-group-lg">
                                                    <span className="input-group-text">
                                                        <i className="bi bi-link-45deg"></i>
                                                    </span>
                                                    <input
                                                        type="url"
                                                        id="url"
                                                        className="form-control"
                                                        placeholder="https://..."
                                                        value={formData.url}
                                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                                    />
                                                </div>
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
                                                    Cadastrar Solução
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

            {/* Modal Editar Solução */}
            {showEditModal && selectedSolucao && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1} role="dialog">
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
                                        onClick={handleCloseEditModal}
                                    ></button>
                                </div>
                                <form onSubmit={handleEditSubmit}>
                                    <div className="modal-body p-4">
                                        <div className="row g-4">
                                            {/* Nome */}
                                            <div className="col-12">
                                                <label htmlFor="edit-nome" className="form-label fw-medium">
                                                    Nome da Solução <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="edit-nome"
                                                    className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`}
                                                    placeholder="Ex: Portal do Aluno"
                                                    value={formData.nome}
                                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                />
                                                {formErrors.nome && (
                                                    <div className="invalid-feedback">{formErrors.nome}</div>
                                                )}
                                            </div>

                                            {/* Descrição */}
                                            <div className="col-12">
                                                <label htmlFor="edit-descricao" className="form-label fw-medium">
                                                    Descrição <span className="text-danger">*</span>
                                                </label>
                                                <textarea
                                                    id="edit-descricao"
                                                    rows={3}
                                                    className={`form-control ${formErrors.descricao ? 'is-invalid' : ''}`}
                                                    placeholder="Descreva as funcionalidades da solução educacional..."
                                                    value={formData.descricao}
                                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                                />
                                                {formErrors.descricao && (
                                                    <div className="invalid-feedback">{formErrors.descricao}</div>
                                                )}
                                            </div>

                                            {/* Status */}
                                            <div className="col-md-6">
                                                <label htmlFor="edit-status" className="form-label fw-medium">
                                                    Status
                                                </label>
                                                <select
                                                    id="edit-status"
                                                    className="form-select form-select-lg"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })}
                                                >
                                                    <option value="ativo">Ativo</option>
                                                    <option value="inativo">Inativo</option>
                                                </select>
                                            </div>

                                            {/* URL */}
                                            <div className="col-md-6">
                                                <label htmlFor="edit-url" className="form-label fw-medium">
                                                    URL de Acesso
                                                </label>
                                                <div className="input-group input-group-lg">
                                                    <span className="input-group-text">
                                                        <i className="bi bi-link-45deg"></i>
                                                    </span>
                                                    <input
                                                        type="url"
                                                        id="edit-url"
                                                        className="form-control"
                                                        placeholder="https://..."
                                                        value={formData.url}
                                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={handleCloseEditModal}
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
                                                    Salvar Alterações
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

            {/* Modal Confirmar Exclusão */}
            {showDeleteModal && selectedSolucao && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1} role="dialog">
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
                                        onClick={handleCloseDeleteModal}
                                    ></button>
                                </div>
                                <div className="modal-body p-4 text-center">
                                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-4"
                                        style={{ width: 80, height: 80 }}>
                                        <i className="bi bi-trash text-danger" style={{ fontSize: 36 }}></i>
                                    </div>
                                    <h5 className="mb-2">Excluir "{selectedSolucao.nome}"?</h5>
                                    <p className="text-muted mb-0">
                                        Esta ação não pode ser desfeita. A solução será removida de todos os municípios vinculados.
                                    </p>
                                </div>
                                <div className="modal-footer bg-light justify-content-center">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary px-4"
                                        onClick={handleCloseDeleteModal}
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
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Excluindo...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-trash me-2"></i>
                                                Sim, Excluir
                                            </>
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
