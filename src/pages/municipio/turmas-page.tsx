import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore } from '@/stores'
import { Pagination } from '@/components/ui'
import { enumsApi, escolasApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth-store'
import type { Turma, Escola } from '@/types'

export function MunicipioTurmasPage() {
    const { municipioId } = useParams()
    const navigate = useNavigate()
    const munId = municipioId ? Number(municipioId) : undefined

    const {
        municipios = [],
        turmas = [],
        escolas = [],
        fetchMunicipios,
        fetchTurmas,
        fetchEscolas,
        addTurma,
        updateTurma,
        deleteTurma,
        pagination = {},
    } = useDataStore()

    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [searchTerm, setSearchTerm] = useState('')
    const [turnoFilter, setTurnoFilter] = useState('')
    const [serieFilter, setSerieFilter] = useState('')
    const [escolaFilter, setEscolaFilter] = useState('')
    const [municipioFilter, setMunicipioFilter] = useState(munId ? String(munId) : '')

    const [appliedFilters, setAppliedFilters] = useState({
        searchTerm: '',
        turnoFilter: '',
        serieFilter: '',
        escolaFilter: '',
        municipioFilter: munId ? String(munId) : ''
    })


    const [turnos, setTurnos] = useState<string[]>([])
    const [series, setSeries] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null)

    // Form
    const [formData, setFormData] = useState({ nome: '', turno: '', serie: '', escolaId: '', municipioId: munId ? String(munId) : '' })
    const [formEscolas, setFormEscolas] = useState<Escola[]>([])
    const [escolaSearch, setEscolaSearch] = useState('')

    const [escolaDropdownOpen, setEscolaDropdownOpen] = useState(false)

    useEffect(() => {
        const targetMunId = formData.municipioId ? Number(formData.municipioId) : munId
        if (targetMunId) {
            const token = useAuthStore.getState().accessToken
            escolasApi.list(token, { municipioId: targetMunId, size: 1000 })
                .then(res => {
                    const content = Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : []
                    setFormEscolas(content)
                })
                .catch(console.error)
        } else {
            setFormEscolas([])
        }
    }, [formData.municipioId, munId])

    const filteredFormEscolas = formEscolas.filter(e =>
        e.nome.toLowerCase().includes(escolaSearch.toLowerCase())
    )

    const selectedEscolaName = formEscolas.find(e => String(e.id) === formData.escolaId)?.nome || ''

    useEffect(() => {
        fetchMunicipios()
        if (munId) fetchEscolas(munId)
        else if (municipioFilter) fetchEscolas(Number(municipioFilter))
        else fetchEscolas()

        const token = useAuthStore.getState().accessToken
        if (token) {
            enumsApi.turnos(token).then(res => setTurnos(Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : [])).catch(console.error)
            enumsApi.series(token).then(res => setSeries(Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : [])).catch(console.error)
        }
    }, [munId, municipioFilter])

    const refetchTurmas = (page = currentPage) => {
        fetchTurmas({
            municipioId: munId || (appliedFilters.municipioFilter ? Number(appliedFilters.municipioFilter) : undefined),
            page,
            size: pageSize,
            nome: appliedFilters.searchTerm || undefined,
            turno: appliedFilters.turnoFilter || undefined,
            serie: appliedFilters.serieFilter || undefined,
            escolaId: appliedFilters.escolaFilter || undefined,
        })
    }

    useEffect(() => {
        refetchTurmas()
    }, [munId, currentPage, pageSize, appliedFilters])

    const handleApplyFilters = () => {
        setCurrentPage(0)
        setAppliedFilters({
            searchTerm,
            turnoFilter,
            serieFilter,
            escolaFilter,
            municipioFilter
        })
    }

    const handleClearFilters = () => {
        setSearchTerm('')
        setTurnoFilter('')
        setSerieFilter('')
        setEscolaFilter('')
        const initialMun = munId ? String(munId) : ''
        setMunicipioFilter(initialMun)
        setCurrentPage(0)
        setAppliedFilters({
            searchTerm: '',
            turnoFilter: '',
            serieFilter: '',
            escolaFilter: '',
            municipioFilter: initialMun
        })
    }


    const turmasPagination = pagination.turmas || { page: 0, size: pageSize, totalElements: 0, totalPages: 0 }
    const municipio = municipios.find(m => m.id === (munId || Number(municipioFilter)))

    const validateForm = () => {
        const errors: Record<string, string> = {}
        if (!formData.nome) errors.nome = 'Obrigatório'
        if (!formData.turno) errors.turno = 'Obrigatório'
        if (!formData.serie) errors.serie = 'Obrigatório'
        if (!formData.escolaId) errors.escolaId = 'Obrigatório'
        return Object.keys(errors).length === 0
    }

    const resetForm = () => {
        setFormData({ nome: '', turno: '', serie: '', escolaId: '', municipioId: munId ? String(munId) : '' })
        setEscolaSearch('')
        setEscolaDropdownOpen(false)
    }

    const handleAddSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return
        setIsLoading(true)
        try {
            await addTurma({ ...formData, escolaId: Number(formData.escolaId), municipioId: munId || Number(municipioFilter) })
            refetchTurmas()
            setShowAddModal(false)
            resetForm()
        } catch (error) { console.error(error) }
        finally { setIsLoading(false) }
    }

    const handleEditSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!validateForm() || !selectedTurma) return
        setIsLoading(true)
        try {
            await updateTurma(selectedTurma.id, { ...formData, escolaId: Number(formData.escolaId) })
            refetchTurmas()
            setShowEditModal(false)
            resetForm()
        } catch (error) { console.error(error) }
        finally { setIsLoading(false) }
    }

    return (
        <div className="animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        {municipioId && <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/municipio/${municipioId}/dashboard`)}><i className="bi bi-arrow-left"></i></button>}
                        <h1 className="h3 fw-bold text-dark mb-0">Turmas</h1>
                    </div>
                    {municipio && <p className="text-muted mb-0">{municipio.nome} - {municipio.uf}</p>}
                </div>
                <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => { resetForm(); setShowAddModal(true) }}>
                    <i className="bi bi-plus-lg"></i>Nova Turma
                </button>
            </div>

            {/* Filtros */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body py-3">
                    <div className="row g-3 align-items-end">
                        <div className={`col-12 ${!munId ? 'col-lg-3' : 'col-lg-4'}`}>
                            <label className="form-label text-muted small mb-1">Busca</label>
                            <input type="text" className="form-control" placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        {!munId && (
                            <div className="col-12 col-lg-3">
                                <label className="form-label text-muted small mb-1">Município</label>
                                <select className="form-select" value={municipioFilter} onChange={e => setMunicipioFilter(e.target.value)}>
                                    <option value="">Todos os municípios</option>
                                    {(municipios || []).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="col-6 col-lg-2">
                            <label className="form-label text-muted small mb-1">Turno</label>
                            <select className="form-select" value={turnoFilter} onChange={e => setTurnoFilter(e.target.value)}>
                                <option value="">Todos</option>
                                {(turnos || []).map(t => {
                                    const val = typeof t === 'string' ? t : (t as any)?.descricao || (t as any)?.nome || String(t);
                                    const label = typeof val === 'string' && val.length > 0 ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : val;
                                    return <option key={val} value={val}>{label}</option>;
                                })}
                            </select>
                        </div>
                        <div className="col-6 col-lg-2">
                            <label className="form-label text-muted small mb-1">Série</label>
                            <select className="form-select" value={serieFilter} onChange={e => setSerieFilter(e.target.value)}>
                                <option value="">Todas</option>
                                {(series || []).map(s => {
                                    const val = typeof s === 'string' ? s : (s as any)?.descricao || (s as any)?.nome || String(s);
                                    return <option key={val} value={val}>{val}</option>;
                                })}
                            </select>
                        </div>
                        <div className="col-12 col-lg-2">
                            <label className="form-label text-muted small mb-1">Escola</label>
                            <select className="form-select" value={escolaFilter} onChange={e => setEscolaFilter(e.target.value)}>
                                <option value="">Todas</option>
                                {(escolas || []).map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="col-12 mt-3">
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

            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="px-4">Nome</th>
                                    <th>Turno</th>
                                    <th>Série</th>
                                    <th>Escola</th>
                                    {!munId && <th>Município</th>}
                                    <th className="text-end px-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(turmas || []).length > 0 ? turmas.filter(t => !!t).map((t) => (
                                    <tr key={t?.id || Math.random()}>
                                        <td className="px-4 align-middle">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="d-flex align-items-center justify-content-center rounded bg-warning bg-opacity-10" style={{ minWidth: 40, width: 40, height: 40 }}>
                                                    <i className="bi bi-people text-warning"></i>
                                                </div>
                                                <p className="fw-medium mb-0">{t?.nome || 'Sem nome'}</p>
                                            </div>
                                        </td>
                                        <td><span className="badge bg-light text-dark">{t?.turno || '-'}</span></td>
                                        <td>{t?.serie || '-'}</td>
                                        <td>{t?.escola || escolas.find(e => e.id === t?.escolaId)?.nome || '-'}</td>
                                        {!munId && <td>{t?.municipio || municipios.find(m => m.id === t?.municipioId)?.nome || '-'}</td>}
                                        <td className="text-end px-4">
                                            <div className="btn-group btn-group-sm">
                                                <button className="btn btn-outline-primary" onClick={() => {
                                                    setSelectedTurma(t)
                                                    setFormData({ nome: t.nome, turno: t.turno, serie: t.serie, escolaId: String(t.escolaId) || '', municipioId: t.municipioId ? String(t.municipioId) : munId ? String(munId) : '' })
                                                    setEscolaSearch('')
                                                    setEscolaDropdownOpen(false)
                                                    setShowEditModal(true)
                                                }}><i className="bi bi-pencil"></i></button>
                                                <button className="btn btn-outline-danger" onClick={() => { setSelectedTurma(t); setShowDeleteModal(true) }}><i className="bi bi-trash"></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={munId ? 5 : 7} className="text-center py-5 text-muted">Nenhuma turma encontrada</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {turmasPagination.totalPages > 0 && (
                    <div className="card-footer bg-white border-top">
                        <Pagination
                            currentPage={currentPage}
                            pageSize={pageSize}
                            totalElements={turmasPagination.totalElements}
                            totalPages={turmasPagination.totalPages}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                            label="turmas"
                        />
                    </div>
                )}
            </div>

            {/* Modals - Simplificados para garantir que não crashem */}
            {showAddModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow">
                            <div className="modal-header"><h5>Nova Turma</h5><button className="btn-close" onClick={() => setShowAddModal(false)}></button></div>
                            <form onSubmit={handleAddSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3"><label className="form-label">Nome</label><input className="form-control" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required /></div>
                                    <div className="mb-3"><label className="form-label">Turno</label><select className="form-select" value={formData.turno} onChange={e => setFormData({ ...formData, turno: e.target.value })} required><option value="">Selecione</option>{(turnos || []).map(t => {
                                        const val = typeof t === 'string' ? t : (t as any)?.descricao || (t as any)?.nome || String(t);
                                        const label = typeof val === 'string' && val.length > 0 ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : val;
                                        return <option key={val} value={val}>{label}</option>;
                                    })}</select></div>
                                    <div className="mb-3"><label className="form-label">Série</label><select className="form-select" value={formData.serie} onChange={e => setFormData({ ...formData, serie: e.target.value })} required><option value="">Selecione</option>{(series || []).map(s => {
                                        const val = typeof s === 'string' ? s : (s as any)?.descricao || (s as any)?.nome || String(s);
                                        return <option key={val} value={val}>{val}</option>;
                                    })}</select></div>
                                    <div className="mb-3">
                                        <label className="form-label">Município</label>
                                        <select className="form-select" value={formData.municipioId} onChange={e => setFormData({ ...formData, municipioId: e.target.value, escolaId: '' })} disabled={!!munId} required>
                                            <option value="">Selecione</option>
                                            {municipios.map(m => <option key={m.id} value={m.id}>{m.nome} - {m.uf}</option>)}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Escola</label>
                                        <div className="position-relative">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder={formData.municipioId ? "Pesquisar escola..." : "Selecione um município primeiro"}
                                                value={escolaDropdownOpen ? escolaSearch : selectedEscolaName || escolaSearch}
                                                onChange={e => { setEscolaSearch(e.target.value); setEscolaDropdownOpen(true); if (!e.target.value) setFormData({ ...formData, escolaId: '' }) }}
                                                onFocus={() => formData.municipioId && setEscolaDropdownOpen(true)}
                                                onBlur={() => setTimeout(() => setEscolaDropdownOpen(false), 200)}
                                                disabled={!formData.municipioId}
                                                required={!formData.escolaId}
                                            />
                                            {formData.escolaId && !escolaDropdownOpen && (
                                                <button type="button" className="btn btn-sm position-absolute end-0 top-50 translate-middle-y me-2 p-0 border-0 bg-transparent text-muted" onClick={() => { setFormData({ ...formData, escolaId: '' }); setEscolaSearch(''); setEscolaDropdownOpen(true) }}>
                                                    <i className="bi bi-x-lg"></i>
                                                </button>
                                            )}
                                            {escolaDropdownOpen && formData.municipioId && (
                                                <div className="border rounded shadow-sm bg-white position-absolute w-100 mt-1" style={{ maxHeight: 200, overflowY: 'auto', zIndex: 1060 }}>
                                                    {filteredFormEscolas.length > 0 ? filteredFormEscolas.map(e => (
                                                        <button type="button" key={e.id} className={`dropdown-item px-3 py-2 ${String(e.id) === formData.escolaId ? 'active' : ''}`}
                                                            onClick={() => { setFormData({ ...formData, escolaId: String(e.id) }); setEscolaSearch(''); setEscolaDropdownOpen(false) }}>
                                                            {e.nome}
                                                        </button>
                                                    )) : (
                                                        <div className="px-3 py-2 text-muted small">{formData.municipioId ? 'Nenhuma escola encontrada' : 'Selecione um município primeiro'}</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={isLoading}>Salvar</button></div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow">
                            <div className="modal-header"><h5>Editar Turma</h5><button className="btn-close" onClick={() => setShowEditModal(false)}></button></div>
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3"><label className="form-label">Nome</label><input className="form-control" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required /></div>
                                    <div className="mb-3"><label className="form-label">Turno</label><select className="form-select" value={formData.turno} onChange={e => setFormData({ ...formData, turno: e.target.value })} required><option value="">Selecione</option>{(turnos || []).map(t => {
                                        const val = typeof t === 'string' ? t : (t as any)?.descricao || (t as any)?.nome || String(t);
                                        const label = typeof val === 'string' && val.length > 0 ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : val;
                                        return <option key={val} value={val}>{label}</option>;
                                    })}</select></div>
                                    <div className="mb-3"><label className="form-label">Série</label><select className="form-select" value={formData.serie} onChange={e => setFormData({ ...formData, serie: e.target.value })} required><option value="">Selecione</option>{(series || []).map(s => {
                                        const val = typeof s === 'string' ? s : (s as any)?.descricao || (s as any)?.nome || String(s);
                                        return <option key={val} value={val}>{val}</option>;
                                    })}</select></div>
                                    <div className="mb-3">
                                        <label className="form-label">Município</label>
                                        <select className="form-select" value={formData.municipioId} onChange={e => setFormData({ ...formData, municipioId: e.target.value, escolaId: '' })} disabled={!!munId} required>
                                            <option value="">Selecione</option>
                                            {municipios.map(m => <option key={m.id} value={m.id}>{m.nome} - {m.uf}</option>)}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Escola</label>
                                        <div className="position-relative">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder={formData.municipioId ? "Pesquisar escola..." : "Selecione um município primeiro"}
                                                value={escolaDropdownOpen ? escolaSearch : selectedEscolaName || escolaSearch}
                                                onChange={e => { setEscolaSearch(e.target.value); setEscolaDropdownOpen(true); if (!e.target.value) setFormData({ ...formData, escolaId: '' }) }}
                                                onFocus={() => formData.municipioId && setEscolaDropdownOpen(true)}
                                                onBlur={() => setTimeout(() => setEscolaDropdownOpen(false), 200)}
                                                disabled={!formData.municipioId}
                                                required={!formData.escolaId}
                                            />
                                            {formData.escolaId && !escolaDropdownOpen && (
                                                <button type="button" className="btn btn-sm position-absolute end-0 top-50 translate-middle-y me-2 p-0 border-0 bg-transparent text-muted" onClick={() => { setFormData({ ...formData, escolaId: '' }); setEscolaSearch(''); setEscolaDropdownOpen(true) }}>
                                                    <i className="bi bi-x-lg"></i>
                                                </button>
                                            )}
                                            {escolaDropdownOpen && formData.municipioId && (
                                                <div className="border rounded shadow-sm bg-white position-absolute w-100 mt-1" style={{ maxHeight: 200, overflowY: 'auto', zIndex: 1060 }}>
                                                    {filteredFormEscolas.length > 0 ? filteredFormEscolas.map(e => (
                                                        <button type="button" key={e.id} className={`dropdown-item px-3 py-2 ${String(e.id) === formData.escolaId ? 'active' : ''}`}
                                                            onClick={() => { setFormData({ ...formData, escolaId: String(e.id) }); setEscolaSearch(''); setEscolaDropdownOpen(false) }}>
                                                            {e.nome}
                                                        </button>
                                                    )) : (
                                                        <div className="px-3 py-2 text-muted small">{formData.municipioId ? 'Nenhuma escola encontrada' : 'Selecione um município primeiro'}</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={isLoading}>Salvar</button></div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow">
                            <div className="modal-header"><h5>Excluir Turma</h5><button className="btn-close" onClick={() => setShowDeleteModal(false)}></button></div>
                            <div className="modal-body"><p>Tem certeza que deseja excluir a turma {selectedTurma?.nome}?</p></div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button><button type="button" className="btn btn-danger" disabled={isLoading} onClick={async () => {
                                if (!selectedTurma) return;
                                setIsLoading(true);
                                try {
                                    await deleteTurma(selectedTurma.id);
                                    refetchTurmas();
                                    setShowDeleteModal(false);
                                } catch (error) { console.error(error); } finally { setIsLoading(false); }
                            }}>Excluir</button></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
