import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore } from '@/stores'
import { Pagination, PageLoading } from '@/components/ui'
import type { Regiao } from '@/types'

export function MunicipioRegioesPage() {
    const { municipioId } = useParams()
    const navigate = useNavigate()
    const { municipios, regioes, pagination, fetchMunicipios, fetchRegioes, addRegiao, updateRegiao, deleteRegiao } = useDataStore()

    const munId = municipioId ? Number(municipioId) : undefined
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [searchTerm, setSearchTerm] = useState('')
    const [municipioFilter, setMunicipioFilter] = useState(munId ? String(munId) : '')

    const [appliedFilters, setAppliedFilters] = useState({
        searchTerm: '',
        municipioFilter: munId ? String(munId) : ''
    })

    useEffect(() => {
        Promise.all([fetchMunicipios(), refetchRegioes()]).finally(() => setInitialLoading(false))
    }, [])

    const [initialLoading, setInitialLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedRegiao, setSelectedRegiao] = useState<Regiao | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({ nome: '', municipioId: munId ? String(munId) : '' })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    const regioesPagination = pagination.regioes || { page: 0, size: pageSize, totalElements: 0, totalPages: 0 }

    const refetchRegioes = () =>
        fetchRegioes({
            municipioId: munId || (appliedFilters.municipioFilter ? Number(appliedFilters.municipioFilter) : undefined),
            page: currentPage,
            size: pageSize,
            nome: appliedFilters.searchTerm || undefined,
        })

    useEffect(() => {
        if (!initialLoading) refetchRegioes()
    }, [munId, currentPage, pageSize, appliedFilters])

    const handleApplyFilters = () => {
        setCurrentPage(0)
        setAppliedFilters({ searchTerm, municipioFilter })
    }

    const handleClearFilters = () => {
        setSearchTerm('')
        const initialMun = munId ? String(munId) : ''
        setMunicipioFilter(initialMun)
        setCurrentPage(0)
        setAppliedFilters({ searchTerm: '', municipioFilter: initialMun })
    }

    const municipio = munId ? municipios.find((m) => m.id === munId) : undefined

    const getMunicipioNome = (mId: number) => municipios.find(m => m.id === mId)?.nome || '-'

    const validateForm = () => {
        const errors: Record<string, string> = {}
        if (!formData.nome || formData.nome.length < 2) errors.nome = 'Nome deve ter no mínimo 2 caracteres'
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return
        setIsLoading(true)
        try {
            await addRegiao({ nome: formData.nome, municipioId: formData.municipioId ? Number(formData.municipioId) : munId })
            await refetchRegioes()
            setShowAddModal(false)
        } catch (error) { console.error('Erro:', error) }
        finally { setIsLoading(false) }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm() || !selectedRegiao) return
        setIsLoading(true)
        try {
            await updateRegiao(selectedRegiao.id, { nome: formData.nome })
            await refetchRegioes()
            setShowEditModal(false); setSelectedRegiao(null)
        } catch (error) { console.error('Erro:', error) }
        finally { setIsLoading(false) }
    }

    const handleConfirmDelete = async () => {
        if (!selectedRegiao) return
        setIsLoading(true)
        try {
            await deleteRegiao(selectedRegiao.id)
            await refetchRegioes()
            setShowDeleteModal(false); setSelectedRegiao(null)
        } catch (error) { console.error('Erro:', error) }
        finally { setIsLoading(false) }
    }

    if (initialLoading) return <PageLoading />

    if (munId && !municipio) {
        return <div className="d-flex align-items-center justify-content-center" style={{ height: '50vh' }}><div className="text-center"><i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: 48 }}></i><p className="text-muted mt-3">Município não encontrado</p></div></div>
    }

    return (
        <div className="animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        {municipioId && <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/municipio/${municipioId}/dashboard`)}><i className="bi bi-arrow-left"></i></button>}
                        <h1 className="h3 fw-bold text-dark mb-0">Regiões</h1>
                    </div>
                    {municipio && <p className="text-muted mb-0">{municipio.nome} - {municipio.uf}</p>}
                </div>
                <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => { setFormData({ nome: '', municipioId: munId ? String(munId) : '' }); setFormErrors({}); setShowAddModal(true) }}>
                    <i className="bi bi-plus-lg"></i>Nova Região
                </button>
            </div>

            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body py-3">
                    <div className="row g-3 align-items-end">
                        <div className={`col-12 ${!munId ? 'col-lg-6' : ''}`}>
                            <label className="form-label text-muted small mb-1">Busca</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                                <input type="text" className="form-control" placeholder="Buscar região..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        {!munId && (
                            <div className="col-12 col-lg-6">
                                <label className="form-label text-muted small mb-1">Município</label>
                                <select className="form-select" value={municipioFilter} onChange={e => setMunicipioFilter(e.target.value)}>
                                    <option value="">Todos os municípios</option>
                                    {(municipios || []).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="col-12">
                            <div className="d-flex justify-content-end align-items-center gap-2">
                                <button className="btn btn-primary px-4" onClick={handleApplyFilters}>
                                    <i className="bi bi-search me-2"></i>Aplicar Filtros
                                </button>
                                <button className="btn btn-outline-secondary px-4" onClick={handleClearFilters}>
                                    <i className="bi bi-arrow-counterclockwise me-2"></i>Limpar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {regioes.length > 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr><th className="border-0">Nome</th><th className="border-0">Município</th><th className="border-0 text-end">Ações</th></tr>
                                </thead>
                                <tbody>
                                    {regioes.map((regiao) => (
                                        <tr key={regiao.id}>
                                            <td className="align-middle">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="d-flex align-items-center justify-content-center rounded bg-primary bg-opacity-10" style={{ width: 40, height: 40 }}>
                                                        <i className="bi bi-geo-alt text-primary"></i>
                                                    </div>
                                                    <p className="fw-medium mb-0">{regiao.nome}</p>
                                                </div>
                                            </td>
                                            <td className="align-middle"><span className="text-muted">{regiao.municipio || getMunicipioNome(regiao.municipioId)}</span></td>
                                            <td className="align-middle text-end">
                                                <div className="btn-group btn-group-sm">
                                                    <button className="btn btn-outline-primary" onClick={() => { setSelectedRegiao(regiao); setFormData({ nome: regiao.nome, municipioId: regiao.municipioId ? String(regiao.municipioId) : munId ? String(munId) : '' }); setFormErrors({}); setShowEditModal(true) }}><i className="bi bi-pencil"></i></button>
                                                    <button className="btn btn-outline-danger" onClick={() => { setSelectedRegiao(regiao); setShowDeleteModal(true) }}><i className="bi bi-trash"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {regioesPagination.totalPages > 0 && (
                        <div className="card-footer bg-white border-top">
                            <Pagination
                                currentPage={currentPage}
                                pageSize={pageSize}
                                totalElements={regioesPagination.totalElements}
                                totalPages={regioesPagination.totalPages}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(size) => { setCurrentPage(0); setPageSize(size) }}
                                label="regiões"
                                isLoading={isLoading}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-5">
                    <i className="bi bi-geo-alt text-muted" style={{ fontSize: 48 }}></i>
                    <p className="text-muted mt-3">Nenhuma região cadastrada</p>
                    <button className="btn btn-primary mt-2" onClick={() => { setFormData({ nome: '', municipioId: munId ? String(munId) : '' }); setFormErrors({}); setShowAddModal(true) }}>
                        <i className="bi bi-plus-lg me-2"></i>Cadastrar Região
                    </button>
                </div>
            )}

            {/* Modal Nova */}
            {showAddModal && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-primary text-white"><h5 className="modal-title"><i className="bi bi-plus-circle me-2"></i>Nova Região</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button></div>
                    <form onSubmit={handleAddSubmit}><div className="modal-body p-4">
                        <div className="mb-3">
                            <label className="form-label fw-medium">Município <span className="text-danger">*</span></label>
                            <select className="form-select" value={formData.municipioId} onChange={(e) => setFormData({ ...formData, municipioId: e.target.value })} disabled={!!munId} required>
                                <option value="">Selecione um município</option>
                                {municipios.map(m => <option key={m.id} value={m.id}>{m.nome} - {m.uf}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label fw-medium">Nome <span className="text-danger">*</span></label>
                            <input type="text" className={`form-control ${formErrors.nome ? 'is-invalid' : ''}`} placeholder="Nome da região" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                            {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                        </div>
                    </div>
                        <div className="modal-footer bg-light">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Cadastrar</>}</button>
                        </div></form>
                </div></div></div><div className="modal-backdrop fade show"></div></>
            )}

            {/* Modal Editar */}
            {showEditModal && selectedRegiao && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-primary text-white"><h5 className="modal-title"><i className="bi bi-pencil me-2"></i>Editar Região</h5><button type="button" className="btn-close btn-close-white" onClick={() => { setShowEditModal(false); setSelectedRegiao(null) }}></button></div>
                    <form onSubmit={handleEditSubmit}><div className="modal-body p-4">
                        <div className="mb-3">
                            <label className="form-label fw-medium">Município <span className="text-danger">*</span></label>
                            <select className="form-select" value={formData.municipioId} onChange={(e) => setFormData({ ...formData, municipioId: e.target.value })} disabled={!!munId} required>
                                <option value="">Selecione um município</option>
                                {municipios.map(m => <option key={m.id} value={m.id}>{m.nome} - {m.uf}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label fw-medium">Nome <span className="text-danger">*</span></label>
                            <input type="text" className={`form-control ${formErrors.nome ? 'is-invalid' : ''}`} value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                            {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                        </div>
                    </div>
                        <div className="modal-footer bg-light">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowEditModal(false); setSelectedRegiao(null) }}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Salvar</>}</button>
                        </div></form>
                </div></div></div><div className="modal-backdrop fade show"></div></>
            )}

            {/* Modal Excluir */}
            {showDeleteModal && selectedRegiao && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-danger text-white"><h5 className="modal-title"><i className="bi bi-exclamation-triangle me-2"></i>Confirmar Exclusão</h5><button type="button" className="btn-close btn-close-white" onClick={() => { setShowDeleteModal(false); setSelectedRegiao(null) }}></button></div>
                    <div className="modal-body p-4 text-center">
                        <div className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-4" style={{ width: 80, height: 80 }}><i className="bi bi-trash text-danger" style={{ fontSize: 36 }}></i></div>
                        <h5 className="mb-2">Excluir "{selectedRegiao.nome}"?</h5>
                        <p className="text-muted mb-0">Esta ação não pode ser desfeita.</p>
                    </div>
                    <div className="modal-footer bg-light justify-content-center">
                        <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setShowDeleteModal(false); setSelectedRegiao(null) }}>Cancelar</button>
                        <button type="button" className="btn btn-danger px-4" onClick={handleConfirmDelete} disabled={isLoading}>{isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Excluindo...</> : <><i className="bi bi-trash me-2"></i>Sim, Excluir</>}</button>
                    </div>
                </div></div></div><div className="modal-backdrop fade show"></div></>
            )}
        </div>
    )
}
