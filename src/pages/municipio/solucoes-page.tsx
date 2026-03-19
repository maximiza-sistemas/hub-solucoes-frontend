import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore, useAuthStore } from '@/stores'
import { Pagination, PageLoading } from '@/components/ui'
import { solucoesApi } from '@/services/api'
import type { Solucao, PageResponse } from '@/types'

export function MunicipioSolucoesPage() {
    const { municipioId } = useParams()
    const navigate = useNavigate()
    const { accessToken } = useAuthStore()
    const { municipios, fetchMunicipios, addSolucao, updateSolucao, deleteSolucao } = useDataStore()
    const munId = Number(municipioId)

    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedSolucao, setSelectedSolucao] = useState<Solucao | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [solucoes, setSolucoes] = useState<Solucao[]>([])
    const [pagination, setPagination] = useState<PageResponse<Solucao> | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [ativoFilter, setAtivoFilter] = useState('')

    const [initialLoading, setInitialLoading] = useState(true)

    const [formData, setFormData] = useState({ nome: '', descricao: '', link: '' })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    const loadSolucoes = async (page = currentPage, options?: { nome?: string; ativo?: string }) => {
        try {
            const nomeParam = options?.nome !== undefined ? options.nome : debouncedSearch
            const ativoParam = options?.ativo !== undefined ? options.ativo : ativoFilter
            const data = await solucoesApi.list(accessToken, {
                municipioId: munId,
                page,
                size: pageSize,
                nome: nomeParam || undefined,
                ativo: ativoParam === '' ? undefined : ativoParam,
            })
            setSolucoes(data.content)
            setPagination(data)
        } catch (error) {
            console.error('Erro ao carregar soluções:', error)
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
    }, [debouncedSearch, munId, pageSize, ativoFilter])

    useEffect(() => {
        if (!initialLoading) loadSolucoes(currentPage, { nome: debouncedSearch })
    }, [accessToken, munId, currentPage, debouncedSearch, pageSize, ativoFilter])

    const municipio = municipios.find((m) => m.id === munId)

    const validateForm = () => {
        const errors: Record<string, string> = {}
        if (!formData.nome || formData.nome.length < 3) errors.nome = 'Nome deve ter no mínimo 3 caracteres'
        if (!formData.descricao || formData.descricao.length < 10) errors.descricao = 'Descrição deve ter no mínimo 10 caracteres'
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleOpenAddModal = () => { setFormData({ nome: '', descricao: '', link: '' }); setFormErrors({}); setShowAddModal(true) }

    const handleOpenEditModal = (solucao: Solucao) => {
        setSelectedSolucao(solucao)
        setFormData({ nome: solucao.nome, descricao: solucao.descricao, link: solucao.link || '' })
        setFormErrors({})
        setShowEditModal(true)
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return
        setIsLoading(true)
        try {
            await addSolucao({ nome: formData.nome, descricao: formData.descricao, link: formData.link || undefined, municipioId: munId })
            await loadSolucoes()
            setShowAddModal(false)
        } catch (error) { console.error('Erro:', error) }
        finally { setIsLoading(false) }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm() || !selectedSolucao) return
        setIsLoading(true)
        try {
            await updateSolucao(selectedSolucao.id, { nome: formData.nome, descricao: formData.descricao, link: formData.link || undefined })
            await loadSolucoes()
            setShowEditModal(false); setSelectedSolucao(null)
        } catch (error) { console.error('Erro:', error) }
        finally { setIsLoading(false) }
    }

    const handleConfirmDelete = async () => {
        if (!selectedSolucao) return
        setIsLoading(true)
        try {
            await deleteSolucao(selectedSolucao.id)
            await loadSolucoes()
            setShowDeleteModal(false); setSelectedSolucao(null)
        } catch (error) { console.error('Erro:', error) }
        finally { setIsLoading(false) }
    }

    if (initialLoading) return <PageLoading />

    if (!municipio) {
        return <div className="d-flex align-items-center justify-content-center" style={{ height: '50vh' }}><div className="text-center"><i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: 48 }}></i><p className="text-muted mt-3">Município não encontrado</p></div></div>
    }

    const solucoesAtivas = solucoes.filter(s => s.ativo).length

    return (
        <div className="animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/municipio/${municipioId}/dashboard`)}><i className="bi bi-arrow-left"></i></button>
                        <h1 className="h3 fw-bold text-dark mb-0">Soluções Educacionais</h1>
                    </div>
                    <p className="text-muted mb-0">{municipio.nome} - {municipio.uf}</p>
                </div>
                <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddModal}><i className="bi bi-plus-lg"></i>Nova Solução</button>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-md-6"><div className="card border-0 shadow-sm bg-primary text-white"><div className="card-body py-3"><div className="d-flex align-items-center gap-3"><i className="bi bi-mortarboard" style={{ fontSize: 32 }}></i><div><p className="h3 fw-bold mb-0">{pagination?.totalElements || 0}</p><p className="small mb-0 opacity-75">Total</p></div></div></div></div></div>
                <div className="col-md-6"><div className="card border-0 shadow-sm bg-success text-white"><div className="card-body py-3"><div className="d-flex align-items-center gap-3"><i className="bi bi-check-circle" style={{ fontSize: 32 }}></i><div><p className="h3 fw-bold mb-0">{solucoesAtivas}</p><p className="small mb-0 opacity-75">Ativas</p></div></div></div></div></div>
            </div>

            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body py-3">
                    <div className="row gy-3 gx-3 align-items-end">
                        <div className="col-12 col-lg-6">
                            <label className="form-label text-muted small mb-1">Busca</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0"><i className="bi bi-search"></i></span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 rounded-start-0"
                                    placeholder="Buscar solução..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-6 col-lg-4">
                            <label className="form-label text-muted small mb-1">Status</label>
                            <select className="form-select" value={ativoFilter} onChange={(e) => setAtivoFilter(e.target.value)}>
                                <option value="">Todos</option>
                                <option value="true">Ativos</option>
                                <option value="false">Inativos</option>
                            </select>
                        </div>
                        <div className="col-12 col-lg-2">
                            <label className="form-label text-muted small mb-1">&nbsp;</label>
                            <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                                <button className="btn btn-primary" onClick={() => { setCurrentPage(0); loadSolucoes(0, { nome: searchTerm, ativo: ativoFilter }) }}>
                                    <i className="bi bi-search me-1"></i>Aplicar
                                </button>
                                <button className="btn btn-outline-secondary" onClick={() => {
                                    setSearchTerm('')
                                    setAtivoFilter('')
                                    setCurrentPage(0)
                                    setDebouncedSearch('')
                                    loadSolucoes(0, { nome: '', ativo: '' })
                                }}>
                                    <i className="bi bi-arrow-counterclockwise"></i> Limpar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {solucoes.length > 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr><th className="border-0">Solução</th><th className="border-0">Município</th><th className="border-0">Status</th><th className="border-0 text-end">Ações</th></tr>
                                </thead>
                                <tbody>
                                    {solucoes.map((solucao) => (
                                        <tr key={solucao.id}>
                                            <td className="align-middle">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="d-flex align-items-center justify-content-center rounded bg-primary bg-opacity-10" style={{ width: 44, height: 44 }}><i className="bi bi-mortarboard text-primary" style={{ fontSize: 20 }}></i></div>
                                                    <div>
                                                        <p className="fw-medium mb-0">{solucao.nome}</p>
                                                        {solucao.link && <a href={solucao.link} target="_blank" rel="noopener noreferrer" className="text-muted small text-decoration-none"><i className="bi bi-link-45deg me-1"></i>{solucao.link.replace('https://', '').substring(0, 30)}...</a>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="align-middle"><span className="text-muted">{solucao.municipio || '-'}</span></td>
                                            <td className="align-middle"><span className={`badge ${solucao.ativo ? 'bg-success' : 'bg-secondary'}`}>{solucao.ativo ? 'ativo' : 'inativo'}</span></td>
                                            <td className="align-middle text-end">
                                                <div className="btn-group btn-group-sm">
                                                    {solucao.link && <a href={solucao.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline-success" title="Acessar"><i className="bi bi-box-arrow-up-right"></i></a>}
                                                    <button className="btn btn-outline-primary" onClick={() => handleOpenEditModal(solucao)}><i className="bi bi-pencil"></i></button>
                                                    <button className="btn btn-outline-danger" onClick={() => { setSelectedSolucao(solucao); setShowDeleteModal(true) }}><i className="bi bi-trash"></i></button>
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
            ) : (
                <div className="text-center py-5">
                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mx-auto mb-4" style={{ width: 100, height: 100 }}><i className="bi bi-mortarboard text-primary" style={{ fontSize: 48 }}></i></div>
                    <h5 className="text-muted">Nenhuma solução cadastrada</h5>
                    <button className="btn btn-primary mt-3" onClick={handleOpenAddModal}><i className="bi bi-plus-lg me-2"></i>Cadastrar Primeira Solução</button>
                </div>
            )}

            {/* Modal Nova Solução */}
            {showAddModal && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-primary text-white"><h5 className="modal-title"><i className="bi bi-plus-circle me-2"></i>Nova Solução</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button></div>
                    <form onSubmit={handleAddSubmit}><div className="modal-body p-4"><div className="row g-4">
                        <div className="col-12"><label className="form-label fw-medium">Nome <span className="text-danger">*</span></label><input type="text" className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`} value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />{formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}</div>
                        <div className="col-12"><label className="form-label fw-medium">Descrição <span className="text-danger">*</span></label><textarea className={`form-control ${formErrors.descricao ? 'is-invalid' : ''}`} rows={3} value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}></textarea>{formErrors.descricao && <div className="invalid-feedback">{formErrors.descricao}</div>}</div>
                        <div className="col-12"><label className="form-label fw-medium">URL de Acesso</label><div className="input-group"><span className="input-group-text"><i className="bi bi-link-45deg"></i></span><input type="url" className="form-control" placeholder="https://..." value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} /></div></div>
                    </div></div>
                        <div className="modal-footer bg-light"><button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Cadastrar</>}</button></div>
                    </form></div></div></div><div className="modal-backdrop fade show"></div></>
            )}

            {/* Modal Editar */}
            {showEditModal && selectedSolucao && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-primary text-white"><h5 className="modal-title"><i className="bi bi-pencil me-2"></i>Editar Solução</h5><button type="button" className="btn-close btn-close-white" onClick={() => { setShowEditModal(false); setSelectedSolucao(null) }}></button></div>
                    <form onSubmit={handleEditSubmit}><div className="modal-body p-4"><div className="row g-4">
                        <div className="col-12"><label className="form-label fw-medium">Nome <span className="text-danger">*</span></label><input type="text" className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`} value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />{formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}</div>
                        <div className="col-12"><label className="form-label fw-medium">Descrição <span className="text-danger">*</span></label><textarea className={`form-control ${formErrors.descricao ? 'is-invalid' : ''}`} rows={3} value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}></textarea>{formErrors.descricao && <div className="invalid-feedback">{formErrors.descricao}</div>}</div>
                        <div className="col-12"><label className="form-label fw-medium">URL de Acesso</label><div className="input-group"><span className="input-group-text"><i className="bi bi-link-45deg"></i></span><input type="url" className="form-control" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} /></div></div>
                    </div></div>
                        <div className="modal-footer bg-light"><button type="button" className="btn btn-outline-secondary" onClick={() => { setShowEditModal(false); setSelectedSolucao(null) }}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Salvar</>}</button></div>
                    </form></div></div></div><div className="modal-backdrop fade show"></div></>
            )}

            {/* Modal Excluir */}
            {showDeleteModal && selectedSolucao && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-danger text-white"><h5 className="modal-title"><i className="bi bi-exclamation-triangle me-2"></i>Confirmar Exclusão</h5><button type="button" className="btn-close btn-close-white" onClick={() => { setShowDeleteModal(false); setSelectedSolucao(null) }}></button></div>
                    <div className="modal-body p-4 text-center"><div className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-4" style={{ width: 80, height: 80 }}><i className="bi bi-trash text-danger" style={{ fontSize: 36 }}></i></div><h5 className="mb-2">Excluir "{selectedSolucao.nome}"?</h5><p className="text-muted mb-0">Esta ação não pode ser desfeita.</p></div>
                    <div className="modal-footer bg-light justify-content-center"><button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setShowDeleteModal(false); setSelectedSolucao(null) }}>Cancelar</button><button type="button" className="btn btn-danger px-4" onClick={handleConfirmDelete} disabled={isLoading}>{isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Excluindo...</> : <><i className="bi bi-trash me-2"></i>Sim, Excluir</>}</button></div>
                </div></div></div><div className="modal-backdrop fade show"></div></>
            )}
        </div>
    )
}
