import { useState, useEffect } from 'react'
import { useAuthStore, useDataStore } from '@/stores'
import { Pagination, PageLoading, TableLoading } from '@/components/ui'
import { solucoesApi } from '@/services/api'
import type { Solucao, PageResponse } from '@/types'

export function SolucoesPage() {
    const { accessToken, user } = useAuthStore()
    const { municipios, fetchMunicipios } = useDataStore()
    const isSuperAdmin = user?.role === 'SUPERADMIN'
    const [solucoes, setSolucoes] = useState<Solucao[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(0)
    const [pagination, setPagination] = useState<PageResponse<Solucao> | null>(null)
    const [pageSize, setPageSize] = useState(10)
    const [ativoFilter, setAtivoFilter] = useState('')
    const [municipioFilter, setMunicipioFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedSolucao, setSelectedSolucao] = useState<Solucao | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const [initialLoading, setInitialLoading] = useState(true)
    const [isFetching, setIsFetching] = useState(false)

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        link: '',
        municipioId: '',
    })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    const loadSolucoes = async (page = currentPage, options?: { nome?: string; ativo?: string; municipio?: string }) => {
        setIsFetching(true)
        try {
            const nomeParam = options?.nome !== undefined ? options.nome : debouncedSearch
            const ativoParam = options?.ativo !== undefined ? options.ativo : ativoFilter
            const municipioParam = options?.municipio !== undefined ? options.municipio : municipioFilter
            const data = await solucoesApi.list(accessToken, {
                page,
                size: pageSize,
                nome: nomeParam || undefined,
                ativo: ativoParam === '' ? undefined : ativoParam,
                municipioId: municipioParam ? Number(municipioParam) : undefined,
            })
            setSolucoes(data.content)
            setPagination(data)
        } catch (error) {
            console.error('Erro ao carregar soluções:', error)
        } finally {
            setIsFetching(false)
        }
    }

    useEffect(() => {
        Promise.all([fetchMunicipios(), loadSolucoes(0)]).finally(() => setInitialLoading(false))
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400)
        return () => clearTimeout(timer)
    }, [searchTerm])

    useEffect(() => {
        setCurrentPage(0)
    }, [debouncedSearch, pageSize, ativoFilter, municipioFilter])

    useEffect(() => {
        if (!initialLoading) loadSolucoes(currentPage)
    }, [accessToken, currentPage, debouncedSearch, pageSize, ativoFilter, municipioFilter])

    const handleOpenModal = () => {
        setFormData({ nome: '', descricao: '', link: '', municipioId: '' })
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
            link: solucao.link || '',
            municipioId: solucao.municipioId ? String(solucao.municipioId) : '',
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
        if (!formData.nome || formData.nome.length < 3) errors.nome = 'Nome deve ter no mínimo 3 caracteres'
        if (!formData.descricao || formData.descricao.length < 10) errors.descricao = 'Descrição deve ter no mínimo 10 caracteres'
        if (isSuperAdmin && !formData.municipioId) errors.municipioId = 'Selecione um município'
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
                link: formData.link || undefined,
                municipioId: isSuperAdmin ? Number(formData.municipioId) : undefined,
            }, accessToken)
            await loadSolucoes()
            handleCloseModal()
        } catch (error) {
            console.error('Erro ao criar solução:', error)
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
                link: formData.link || undefined,
                municipioId: isSuperAdmin ? Number(formData.municipioId) : undefined,
            }, accessToken)
            await loadSolucoes()
            handleCloseEditModal()
        } catch (error) {
            console.error('Erro ao atualizar solução:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!selectedSolucao) return

        setIsLoading(true)
        try {
            await solucoesApi.delete(selectedSolucao.id, accessToken)
            await loadSolucoes()
            handleCloseDeleteModal()
        } catch (error) {
            console.error('Erro ao excluir solução:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleAtivo = async (solucao: Solucao) => {
        try {
            if (solucao.ativo) {
                await solucoesApi.inativar(solucao.id, accessToken)
            } else {
                await solucoesApi.ativar(solucao.id, accessToken)
            }
            await loadSolucoes()
        } catch (error) {
            console.error('Erro ao alterar status:', error)
        }
    }

    const totalSolucoes = pagination?.totalElements || 0
    const solucoesAtivas = solucoes.filter(s => s.ativo).length

    if (initialLoading) return <PageLoading />

    return (
        <div className="animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 fw-bold text-dark mb-1">Soluções Educacionais</h1>
                    <p className="text-muted mb-0">Gerencie as plataformas educacionais disponíveis para os municípios</p>
                </div>
                <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenModal}>
                    <i className="bi bi-plus-lg"></i>
                    Nova Solução
                </button>
            </div>

            {/* Stats */}
            <div className="row g-3 mb-4">
                <div className="col-6">
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
                <div className="col-6">
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
            </div>

            {/* Filtros */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body py-3">
                    <div className="row gy-3 gx-3 align-items-end">
                        <div className="col-12 col-lg-6">
                            <label className="form-label text-muted small mb-1">Busca</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                                <input type="text" className="form-control border-start-0 rounded-start-0" placeholder="Buscar solução..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="col-6 col-lg-2">
                            <label className="form-label text-muted small mb-1">Status</label>
                            <select className="form-select" value={ativoFilter} onChange={(e) => setAtivoFilter(e.target.value)}>
                                <option value="">Todos</option>
                                <option value="true">Ativos</option>
                                <option value="false">Inativos</option>
                            </select>
                        </div>
                        <div className="col-6 col-lg-2">
                            <label className="form-label text-muted small mb-1">Município</label>
                            <select className="form-select" value={municipioFilter} onChange={(e) => setMunicipioFilter(e.target.value)}>
                                <option value="">Todos</option>
                                {municipios.map(m => (
                                    <option key={m.id} value={m.id}>{m.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-lg-2">
                            <label className="form-label text-muted small mb-1">&nbsp;</label>
                            <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                                <button className="btn btn-primary" onClick={() => { setCurrentPage(0); loadSolucoes(0, { nome: searchTerm, ativo: ativoFilter, municipio: municipioFilter }) }}>
                                    <i className="bi bi-search me-1"></i>Aplicar
                                </button>
                                <button className="btn btn-outline-secondary" onClick={() => {
                                    setSearchTerm('')
                                    setDebouncedSearch('')
                                    setAtivoFilter('')
                                    setMunicipioFilter('')
                                    setCurrentPage(0)
                                    loadSolucoes(0, { nome: '', ativo: '', municipio: '' })
                                }}>
                                    <i className="bi bi-arrow-counterclockwise"></i> Limpar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <TableLoading isLoading={isFetching}>
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="border-0">Solução</th>
                                    <th className="border-0">Município</th>
                                    <th className="border-0">Status</th>
                                    <th className="border-0 text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {solucoes.map((solucao) => (
                                    <tr key={solucao.id}>
                                        <td className="align-middle">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="d-flex align-items-center justify-content-center rounded bg-primary bg-opacity-10" style={{ width: 40, height: 40 }}>
                                                    <i className="bi bi-mortarboard text-primary"></i>
                                                </div>
                                                <div>
                                                    <p className="fw-medium mb-0">{solucao.nome}</p>
                                                    <p className="text-muted small mb-0 text-truncate" style={{ maxWidth: 300 }}>{solucao.descricao}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="align-middle">
                                            <span className="text-muted">{solucao.municipio || '-'}</span>
                                        </td>
                                        <td className="align-middle">
                                            {isSuperAdmin ? (
                                                <div className="form-check form-switch mb-0">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        role="switch"
                                                        checked={solucao.ativo}
                                                        onChange={() => handleToggleAtivo(solucao)}
                                                        title={solucao.ativo ? 'Inativar' : 'Ativar'}
                                                    />
                                                    <label className={`form-check-label small ${solucao.ativo ? 'text-success' : 'text-muted'}`}>
                                                        {solucao.ativo ? 'ativo' : 'inativo'}
                                                    </label>
                                                </div>
                                            ) : (
                                                <span className={`badge ${solucao.ativo ? 'bg-success' : 'bg-secondary'}`}>
                                                    {solucao.ativo ? 'ativo' : 'inativo'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="align-middle text-end">
                                            <div className="btn-group btn-group-sm">
                                                <button className="btn btn-outline-primary" onClick={() => handleOpenEditModal(solucao)} title="Editar"><i className="bi bi-pencil"></i></button>
                                                <button className="btn btn-outline-danger" onClick={() => handleOpenDeleteModal(solucao)} title="Excluir"><i className="bi bi-trash"></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {pagination && pagination.totalPages > 0 && (
                    <div className="card-footer bg-white border-top">
                        <Pagination
                            currentPage={currentPage}
                            pageSize={pageSize}
                            totalElements={pagination.totalElements}
                            totalPages={pagination.totalPages}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(size) => { setCurrentPage(0); setPageSize(size) }}
                            label="soluções"
                            isLoading={isLoading}
                        />
                    </div>
                )}
            </div>
            </TableLoading>

            {solucoes.length === 0 && (
                <div className="text-center py-5">
                    <i className="bi bi-inbox text-muted" style={{ fontSize: 48 }}></i>
                    <p className="text-muted mt-3">Nenhuma solução encontrada</p>
                </div>
            )}

            {/* Modal Nova Solução */}
            {showModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title"><i className="bi bi-mortarboard me-2"></i>Nova Solução Educacional</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body p-4">
                                        <div className="row g-4">
                                            <div className="col-12">
                                                <label className="form-label fw-medium">Nome da Solução <span className="text-danger">*</span></label>
                                                <input type="text" className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`} placeholder="Ex: Portal do Aluno" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                                                {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                                            </div>
                                            {isSuperAdmin && (
                                                <div className="col-12">
                                                    <label className="form-label fw-medium">Município <span className="text-danger">*</span></label>
                                                    <select className={`form-select form-select-lg ${formErrors.municipioId ? 'is-invalid' : ''}`} value={formData.municipioId} onChange={(e) => setFormData({ ...formData, municipioId: e.target.value })}>
                                                        <option value="">Selecione um município</option>
                                                        {municipios.map(m => (
                                                            <option key={m.id} value={m.id}>{m.nome}</option>
                                                        ))}
                                                    </select>
                                                    {formErrors.municipioId && <div className="invalid-feedback">{formErrors.municipioId}</div>}
                                                </div>
                                            )}
                                            <div className="col-12">
                                                <label className="form-label fw-medium">Descrição <span className="text-danger">*</span></label>
                                                <textarea rows={3} className={`form-control ${formErrors.descricao ? 'is-invalid' : ''}`} placeholder="Descreva as funcionalidades..." value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} />
                                                {formErrors.descricao && <div className="invalid-feedback">{formErrors.descricao}</div>}
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-medium">URL de Acesso</label>
                                                <div className="input-group input-group-lg">
                                                    <span className="input-group-text"><i className="bi bi-link-45deg"></i></span>
                                                    <input type="url" className="form-control" placeholder="https://..." value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button type="button" className="btn btn-outline-secondary" onClick={handleCloseModal}>Cancelar</button>
                                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                            {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Cadastrar Solução</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* Modal Editar */}
            {showEditModal && selectedSolucao && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title"><i className="bi bi-pencil me-2"></i>Editar Solução</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={handleCloseEditModal}></button>
                                </div>
                                <form onSubmit={handleEditSubmit}>
                                    <div className="modal-body p-4">
                                        <div className="row g-4">
                                            <div className="col-12">
                                                <label className="form-label fw-medium">Nome <span className="text-danger">*</span></label>
                                                <input type="text" className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`} value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                                                {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                                            </div>
                                            {isSuperAdmin && (
                                                <div className="col-12">
                                                    <label className="form-label fw-medium">Município <span className="text-danger">*</span></label>
                                                    <select className={`form-select form-select-lg ${formErrors.municipioId ? 'is-invalid' : ''}`} value={formData.municipioId} onChange={(e) => setFormData({ ...formData, municipioId: e.target.value })}>
                                                        <option value="">Selecione um município</option>
                                                        {municipios.map(m => (
                                                            <option key={m.id} value={m.id}>{m.nome}</option>
                                                        ))}
                                                    </select>
                                                    {formErrors.municipioId && <div className="invalid-feedback">{formErrors.municipioId}</div>}
                                                </div>
                                            )}
                                            <div className="col-12">
                                                <label className="form-label fw-medium">Descrição <span className="text-danger">*</span></label>
                                                <textarea rows={3} className={`form-control ${formErrors.descricao ? 'is-invalid' : ''}`} value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} />
                                                {formErrors.descricao && <div className="invalid-feedback">{formErrors.descricao}</div>}
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-medium">URL de Acesso</label>
                                                <div className="input-group input-group-lg">
                                                    <span className="input-group-text"><i className="bi bi-link-45deg"></i></span>
                                                    <input type="url" className="form-control" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button type="button" className="btn btn-outline-secondary" onClick={handleCloseEditModal}>Cancelar</button>
                                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                            {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Salvar Alterações</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* Modal Excluir */}
            {showDeleteModal && selectedSolucao && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-danger text-white">
                                    <h5 className="modal-title"><i className="bi bi-exclamation-triangle me-2"></i>Confirmar Exclusão</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={handleCloseDeleteModal}></button>
                                </div>
                                <div className="modal-body p-4 text-center">
                                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-4" style={{ width: 80, height: 80 }}>
                                        <i className="bi bi-trash text-danger" style={{ fontSize: 36 }}></i>
                                    </div>
                                    <h5 className="mb-2">Excluir "{selectedSolucao.nome}"?</h5>
                                    <p className="text-muted mb-0">Esta ação não pode ser desfeita.</p>
                                </div>
                                <div className="modal-footer bg-light justify-content-center">
                                    <button type="button" className="btn btn-outline-secondary px-4" onClick={handleCloseDeleteModal}>Cancelar</button>
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
