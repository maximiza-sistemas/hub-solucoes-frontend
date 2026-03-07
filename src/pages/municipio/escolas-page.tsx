import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore } from '@/stores'
import { Pagination } from '@/components/ui'
import type { Escola } from '@/types'

export function MunicipioEscolasPage() {
    const { municipioId } = useParams()
    const navigate = useNavigate()
    const {
        municipios,
        escolas,
        pagination,
        fetchMunicipios,
        fetchEscolas,
        addEscola,
        updateEscola,
        deleteEscola,
        fetchGrupos,
        fetchRegioes,
        grupos,
        regioes,
    } = useDataStore()

    const munId = municipioId ? Number(municipioId) : undefined
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [debouncedSearch, setDebouncedSearch] = useState('')

    useEffect(() => {
        fetchMunicipios()
    }, [fetchMunicipios])

    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedEscola, setSelectedEscola] = useState<Escola | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [grupoFilter, setGrupoFilter] = useState('')
    const [regiaoFilter, setRegiaoFilter] = useState('')
    const [municipioFilter, setMunicipioFilter] = useState('')

    const [formData, setFormData] = useState({ nome: '', grupoId: '', regiaoId: '', municipioId: munId ? String(munId) : '' })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    const formMunicipioId = formData.municipioId ? Number(formData.municipioId) : munId

    useEffect(() => {
        const targetMunId = formMunicipioId || munId
        if (targetMunId) {
            fetchGrupos(targetMunId)
            fetchRegioes(targetMunId)
        }
    }, [formMunicipioId, munId, fetchGrupos, fetchRegioes])

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400)
        return () => clearTimeout(timer)
    }, [searchTerm])

    useEffect(() => {
        setCurrentPage(0)
    }, [debouncedSearch, pageSize, munId, grupoFilter, regiaoFilter, municipioFilter])

    const escolasPagination = pagination.escolas || { page: 0, size: pageSize, totalElements: 0, totalPages: 0 }

    const refetchEscolas = () => {
        const municipioParam = municipioFilter ? Number(municipioFilter) : munId
        fetchEscolas({
            municipioId: municipioParam,
            page: currentPage,
            size: pageSize,
            nome: debouncedSearch || undefined,
            grupoId: grupoFilter ? Number(grupoFilter) : undefined,
            regiaoId: regiaoFilter ? Number(regiaoFilter) : undefined,
        })
    }

    useEffect(() => {
        refetchEscolas()
    }, [munId, currentPage, pageSize, debouncedSearch])

    const municipio = munId ? municipios.find((m) => m.id === munId) : undefined

    const getMunicipioNome = (mId: number) => municipios.find(m => m.id === mId)?.nome || '-'

    const validateForm = () => {
        const errors: Record<string, string> = {}
        if (!formData.nome || formData.nome.length < 3) {
            errors.nome = 'Nome deve ter no mínimo 3 caracteres'
        }
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const resetForm = () => {
        setFormData({ nome: '', grupoId: '', regiaoId: '', municipioId: munId ? String(munId) : '' })
        setFormErrors({})
    }

    const handleOpenAddModal = () => { resetForm(); setShowAddModal(true) }

    const handleOpenEditModal = (escola: Escola) => {
        setSelectedEscola(escola)
        setFormData({
            nome: escola.nome,
            grupoId: escola.grupoId ? String(escola.grupoId) : '',
            regiaoId: escola.regiaoId ? String(escola.regiaoId) : '',
            municipioId: escola.municipioId ? String(escola.municipioId) : '',
        })
        setFormErrors({})
        setShowEditModal(true)
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return
        setIsLoading(true)
        try {
            await addEscola({
                nome: formData.nome,
                grupoId: formData.grupoId ? Number(formData.grupoId) : undefined,
                regiaoId: formData.regiaoId ? Number(formData.regiaoId) : undefined,
                municipioId: formData.municipioId ? Number(formData.municipioId) : munId,
            })
            await refetchEscolas()
            setShowAddModal(false)
        } catch (error) { console.error('Erro:', error) }
        finally { setIsLoading(false) }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm() || !selectedEscola) return
        setIsLoading(true)
        try {
            await updateEscola(selectedEscola.id, {
                nome: formData.nome,
                grupoId: formData.grupoId ? Number(formData.grupoId) : undefined,
                regiaoId: formData.regiaoId ? Number(formData.regiaoId) : undefined,
            })
            await refetchEscolas()
            setShowEditModal(false)
            setSelectedEscola(null)
        } catch (error) { console.error('Erro:', error) }
        finally { setIsLoading(false) }
    }

    const handleConfirmDelete = async () => {
        if (!selectedEscola) return
        setIsLoading(true)
        try {
            await deleteEscola(selectedEscola.id)
            await refetchEscolas()
            setShowDeleteModal(false)
            setSelectedEscola(null)
        } catch (error) { console.error('Erro:', error) }
        finally { setIsLoading(false) }
    }

    if (munId && !municipio) {
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
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        {municipioId && (
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/municipio/${municipioId}/dashboard`)}>
                                <i className="bi bi-arrow-left"></i>
                            </button>
                        )}
                        <h1 className="h3 fw-bold text-dark mb-0">Escolas</h1>
                    </div>
                    {municipio && <p className="text-muted mb-0">{municipio.nome} - {municipio.uf}</p>}
                </div>
                <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
                    <i className="bi bi-plus-lg"></i>Nova Escola
                </button>
            </div>

            {/* Filters */}
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
                                    placeholder="Buscar por nome..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-6 col-lg-2">
                            <label className="form-label text-muted small mb-1">Grupo</label>
                            <select className="form-select" value={grupoFilter} onChange={(e) => setGrupoFilter(e.target.value)}>
                                <option value="">Todos os grupos</option>
                                {grupos.map(g => (
                                    <option key={g.id} value={g.id}>{g.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-6 col-lg-2">
                            <label className="form-label text-muted small mb-1">Região</label>
                            <select className="form-select" value={regiaoFilter} onChange={(e) => setRegiaoFilter(e.target.value)}>
                                <option value="">Todas as regiões</option>
                                {regioes.map(r => (
                                    <option key={r.id} value={r.id}>{r.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-6 col-lg-2">
                            <label className="form-label text-muted small mb-1">Município</label>
                            <select className="form-select" value={municipioFilter} onChange={(e) => setMunicipioFilter(e.target.value)}>
                                <option value="">Todos os municípios</option>
                                {municipios.map(m => (
                                    <option key={m.id} value={m.id}>{m.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className='col-12 d-flex justify-content-end align-items-center gap-2'>
                            <label className="form-label text-muted small mb-1">&nbsp;</label>
                            <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                                <button className="btn btn-primary" onClick={() => { setCurrentPage(0); refetchEscolas() }}>
                                    <i className="bi bi-search me-1"></i>Aplicar
                                </button>
                                <button className="btn btn-outline-secondary" onClick={() => {
                                    setSearchTerm('')
                                    setGrupoFilter('')
                                    setRegiaoFilter('')
                                    setMunicipioFilter('')
                                    setCurrentPage(0)
                                    refetchEscolas()
                                }}>
                                    <i className="bi bi-arrow-counterclockwise"></i> Limpar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {escolas.length > 0 ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="border-0">Escola</th>
                                        <th className="border-0">Município</th>
                                        <th className="border-0">Grupo</th>
                                        <th className="border-0">Região</th>
                                        <th className="border-0 text-end">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {escolas.map((escola) => (
                                        <tr key={escola.id}>
                                            <td className="align-middle">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="d-flex align-items-center justify-content-center rounded bg-primary bg-opacity-10" style={{ width: 44, height: 44 }}>
                                                        <i className="bi bi-building text-primary" style={{ fontSize: 20 }}></i>
                                                    </div>
                                                    <p className="fw-medium mb-0">{escola.nome}</p>
                                                </div>
                                            </td>
                                            <td className="align-middle">
                                                <span className="text-muted">{escola.municipio || getMunicipioNome(escola.municipioId)}</span>
                                            </td>
                                            <td className="align-middle">
                                                <span className="text-muted">{escola.grupo || '-'}</span>
                                            </td>
                                            <td className="align-middle">
                                                <span className="text-muted">{escola.regiao || '-'}</span>
                                            </td>
                                            <td className="align-middle text-end">
                                                <div className="btn-group btn-group-sm">
                                                    <button className="btn btn-outline-primary" onClick={() => handleOpenEditModal(escola)} title="Editar">
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button className="btn btn-outline-danger" onClick={() => { setSelectedEscola(escola); setShowDeleteModal(true) }} title="Excluir">
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
                    {escolasPagination.totalPages > 0 && (
                        <div className="card-footer bg-white border-top">
                            <Pagination
                                currentPage={currentPage}
                                pageSize={pageSize}
                                totalElements={escolasPagination.totalElements}
                                totalPages={escolasPagination.totalPages}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(size) => { setCurrentPage(0); setPageSize(size) }}
                                label="escolas"
                                isLoading={isLoading}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-5">
                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mx-auto mb-4" style={{ width: 100, height: 100 }}>
                        <i className="bi bi-building text-primary" style={{ fontSize: 48 }}></i>
                    </div>
                    <h5 className="text-muted">Nenhuma escola encontrada</h5>
                    <button className="btn btn-primary mt-3" onClick={handleOpenAddModal}>
                        <i className="bi bi-plus-lg me-2"></i>Cadastrar Escola
                    </button>
                </div>
            )}

            {/* Modal Nova Escola */}
            {showAddModal && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title"><i className="bi bi-plus-circle me-2"></i>Nova Escola</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
                    </div>
                    <form onSubmit={handleAddSubmit}><div className="modal-body p-4"><div className="row g-4">
                        <div className="col-12">
                            <label className="form-label fw-medium">Nome da Escola <span className="text-danger">*</span></label>
                            <input type="text" className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`} placeholder="Ex: EMEF Maria Montessori" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                            {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                        </div>
                        <div className="col-12">
                            <label className="form-label fw-medium">Município <span className="text-danger">*</span></label>
                            <select className="form-select" value={formData.municipioId} onChange={(e) => setFormData({ ...formData, municipioId: e.target.value, grupoId: '', regiaoId: '' })} disabled={!!munId}>
                                <option value="">Selecione um município</option>
                                {municipios.map(m => <option key={m.id} value={m.id}>{m.nome} - {m.uf}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-medium">Grupo</label>
                            <select className="form-select" value={formData.grupoId} onChange={(e) => setFormData({ ...formData, grupoId: e.target.value })}>
                                <option value="">Nenhum</option>
                                {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-medium">Região</label>
                            <select className="form-select" value={formData.regiaoId} onChange={(e) => setFormData({ ...formData, regiaoId: e.target.value })}>
                                <option value="">Nenhuma</option>
                                {regioes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                            </select>
                        </div>
                    </div></div>
                        <div className="modal-footer bg-light">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Cadastrar</>}
                            </button>
                        </div></form>
                </div></div></div><div className="modal-backdrop fade show"></div></>
            )}

            {/* Modal Editar */}
            {showEditModal && selectedEscola && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title"><i className="bi bi-pencil me-2"></i>Editar Escola</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => { setShowEditModal(false); setSelectedEscola(null) }}></button>
                    </div>
                    <form onSubmit={handleEditSubmit}><div className="modal-body p-4"><div className="row g-4">
                        <div className="col-12">
                            <label className="form-label fw-medium">Nome da Escola <span className="text-danger">*</span></label>
                            <input type="text" className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`} value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                            {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                        </div>
                        <div className="col-12">
                            <label className="form-label fw-medium">Município <span className="text-danger">*</span></label>
                            <select className="form-select" value={formData.municipioId} onChange={(e) => setFormData({ ...formData, municipioId: e.target.value, grupoId: '', regiaoId: '' })} disabled={!!munId}>
                                <option value="">Selecione um município</option>
                                {municipios.map(m => <option key={m.id} value={m.id}>{m.nome} - {m.uf}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-medium">Grupo</label>
                            <select className="form-select" value={formData.grupoId} onChange={(e) => setFormData({ ...formData, grupoId: e.target.value })}>
                                <option value="">Nenhum</option>
                                {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-medium">Região</label>
                            <select className="form-select" value={formData.regiaoId} onChange={(e) => setFormData({ ...formData, regiaoId: e.target.value })}>
                                <option value="">Nenhuma</option>
                                {regioes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                            </select>
                        </div>
                    </div></div>
                        <div className="modal-footer bg-light">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowEditModal(false); setSelectedEscola(null) }}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Salvar</>}
                            </button>
                        </div></form>
                </div></div></div><div className="modal-backdrop fade show"></div></>
            )}

            {/* Modal Excluir */}
            {showDeleteModal && selectedEscola && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-danger text-white">
                        <h5 className="modal-title"><i className="bi bi-exclamation-triangle me-2"></i>Confirmar Exclusão</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => { setShowDeleteModal(false); setSelectedEscola(null) }}></button>
                    </div>
                    <div className="modal-body p-4 text-center">
                        <div className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-4" style={{ width: 80, height: 80 }}>
                            <i className="bi bi-trash text-danger" style={{ fontSize: 36 }}></i>
                        </div>
                        <h5 className="mb-2">Excluir "{selectedEscola.nome}"?</h5>
                        <p className="text-muted mb-0">Esta ação não pode ser desfeita.</p>
                    </div>
                    <div className="modal-footer bg-light justify-content-center">
                        <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setShowDeleteModal(false); setSelectedEscola(null) }}>Cancelar</button>
                        <button type="button" className="btn btn-danger px-4" onClick={handleConfirmDelete} disabled={isLoading}>
                            {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Excluindo...</> : <><i className="bi bi-trash me-2"></i>Sim, Excluir</>}
                        </button>
                    </div>
                </div></div></div><div className="modal-backdrop fade show"></div></>
            )}
        </div>
    )
}
