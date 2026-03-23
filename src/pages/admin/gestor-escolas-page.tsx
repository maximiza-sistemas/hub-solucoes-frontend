import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores'
import { Navigate } from 'react-router-dom'
import { Pagination, PageLoading } from '@/components/ui'
import { gestoresApi, municipiosApi, escolasApi } from '@/services/api'
import type { Usuario, Escola, Municipio, PageResponse } from '@/types'
import { toast } from 'sonner'

export function GestorEscolasPage() {
    const { accessToken, user } = useAuthStore()

    if (user?.role === 'GESTOR') {
        return <Navigate to="/admin/dashboard" replace />
    }

    // Data for filter selects
    const [municipios, setMunicipios] = useState<Municipio[]>([])
    const [gestores, setGestores] = useState<Usuario[]>([])
    const [escolasFiltro, setEscolasFiltro] = useState<Escola[]>([])

    // Filter state (temporary, applied on "Aplicar")
    const [filterMunicipioId, setFilterMunicipioId] = useState('')
    const [filterGestorId, setFilterGestorId] = useState('')
    const [filterEscolaId, setFilterEscolaId] = useState('')

    // Applied filter
    const [appliedGestorId, setAppliedGestorId] = useState<number | null>(null)
    const [appliedMunicipioId, setAppliedMunicipioId] = useState('')
    const [appliedEscolaId, setAppliedEscolaId] = useState('')

    const [activeTab, setActiveTab] = useState<'disponiveis' | 'vinculadas'>('disponiveis')

    const [linkedSchools, setLinkedSchools] = useState<Escola[]>([])
    const [linkedPagination, setLinkedPagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
    const [linkedPage, setLinkedPage] = useState(0)
    const [linkedPageSize, setLinkedPageSize] = useState(10)

    const [availableSchools, setAvailableSchools] = useState<Escola[]>([])
    const [availablePagination, setAvailablePagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
    const [availablePage, setAvailablePage] = useState(0)
    const [availablePageSize, setAvailablePageSize] = useState(10)

    const [initialLoading, setInitialLoading] = useState(true)
    const [isLoading, setIsLoading] = useState(false)

    // Load municipios on mount
    useEffect(() => {
        municipiosApi.list(accessToken)
            .then(r => setMunicipios(r.content))
            .finally(() => setInitialLoading(false))
    }, [])

    // Cascading: municipio -> gestores + escolas
    useEffect(() => {
        if (filterMunicipioId) {
            const munId = Number(filterMunicipioId)
            gestoresApi.listGestoresByMunicipio(munId, accessToken).then(r => setGestores(r.content))
            escolasApi.list(accessToken, { municipioId: munId }).then(r => setEscolasFiltro(r.content))
        } else {
            setGestores([])
            setEscolasFiltro([])
            setFilterGestorId('')
            setFilterEscolaId('')
        }
    }, [filterMunicipioId])

    // Reload data when pagination changes
    useEffect(() => {
        if (appliedGestorId) loadLinkedSchools()
    }, [linkedPage, linkedPageSize])

    useEffect(() => {
        if (appliedGestorId) loadAvailableSchools()
    }, [availablePage, availablePageSize])

    const loadLinkedSchools = async (gestorId = appliedGestorId) => {
        if (!gestorId) return
        try {
            const response = await gestoresApi.getSchools(gestorId, accessToken, {
                page: linkedPage,
                size: linkedPageSize,
            }) as PageResponse<Escola>
            setLinkedSchools(response.content)
            setLinkedPagination({ page: response.page, size: response.size, totalElements: response.totalElements, totalPages: response.totalPages })
        } catch (error) {
            console.error('Erro ao carregar escolas vinculadas:', error)
        }
    }

    const loadAvailableSchools = async (gestorId = appliedGestorId, municipioId = appliedMunicipioId, escolaId = appliedEscolaId) => {
        if (!gestorId) return
        try {
            const escolaNome = escolaId ? escolasFiltro.find(e => e.id === Number(escolaId))?.nome : undefined
            const response = await gestoresApi.getAvailableSchools(gestorId, accessToken, {
                page: availablePage,
                size: availablePageSize,
                municipioId: municipioId ? Number(municipioId) : undefined,
                nome: escolaNome || undefined,
            }) as PageResponse<Escola>
            setAvailableSchools(response.content)
            setAvailablePagination({ page: response.page, size: response.size, totalElements: response.totalElements, totalPages: response.totalPages })
        } catch (error) {
            console.error('Erro ao carregar escolas disponíveis:', error)
        }
    }

    const handleAplicar = () => {
        if (!filterGestorId) {
            toast.error('Selecione um gestor')
            return
        }
        const gestorId = Number(filterGestorId)
        setAppliedGestorId(gestorId)
        setAppliedMunicipioId(filterMunicipioId)
        setAppliedEscolaId(filterEscolaId)
        setLinkedPage(0)
        setAvailablePage(0)

        const loadData = async () => {
            try {
                const escolaNome = filterEscolaId ? escolasFiltro.find(e => e.id === Number(filterEscolaId))?.nome : undefined
                const [linked, available] = await Promise.all([
                    gestoresApi.getSchools(gestorId, accessToken, { page: 0, size: linkedPageSize }) as Promise<PageResponse<Escola>>,
                    gestoresApi.getAvailableSchools(gestorId, accessToken, {
                        page: 0,
                        size: availablePageSize,
                        municipioId: filterMunicipioId ? Number(filterMunicipioId) : undefined,
                        nome: escolaNome || undefined,
                    }) as Promise<PageResponse<Escola>>,
                ])
                setLinkedSchools(linked.content)
                setLinkedPagination({ page: linked.page, size: linked.size, totalElements: linked.totalElements, totalPages: linked.totalPages })
                setAvailableSchools(available.content)
                setAvailablePagination({ page: available.page, size: available.size, totalElements: available.totalElements, totalPages: available.totalPages })
            } catch (error) {
                console.error('Erro ao aplicar filtros:', error)
            }
        }
        loadData()
    }

    const handleLimpar = () => {
        setFilterMunicipioId('')
        setFilterGestorId('')
        setFilterEscolaId('')
        setAppliedGestorId(null)
        setAppliedMunicipioId('')
        setAppliedEscolaId('')
        setLinkedSchools([])
        setAvailableSchools([])
        setLinkedPagination({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
        setAvailablePagination({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
        setLinkedPage(0)
        setAvailablePage(0)
    }

    const handleAddSchool = async (escolaId: number) => {
        if (!appliedGestorId) return
        setIsLoading(true)
        try {
            await gestoresApi.addSchool(appliedGestorId, escolaId, accessToken)
            toast.success('Escola vinculada com sucesso')
            await Promise.all([loadLinkedSchools(), loadAvailableSchools()])
        } catch (error) {
            toast.error('Erro ao vincular escola')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemoveSchool = async (escolaId: number) => {
        if (!appliedGestorId) return
        setIsLoading(true)
        try {
            await gestoresApi.removeSchool(appliedGestorId, escolaId, accessToken)
            toast.success('Escola desvinculada com sucesso')
            await Promise.all([loadLinkedSchools(), loadAvailableSchools()])
        } catch (error) {
            toast.error('Erro ao desvincular escola')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    if (initialLoading) return <PageLoading />

    return (
        <div className="animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h1 className="h3 fw-bold text-dark mb-1">Gestor Escolas</h1>
                    <p className="text-muted mb-0">Vincule gestores a escolas</p>
                </div>
            </div>

            {/* Filtro */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body py-3">
                    <div className="row gy-3 gx-3 align-items-end">
                        <div className="col-12 col-lg-3">
                            <label className="form-label text-muted small mb-1">Municipio</label>
                            <select
                                className="form-select"
                                value={filterMunicipioId}
                                onChange={(e) => { setFilterMunicipioId(e.target.value); setFilterGestorId(''); setFilterEscolaId('') }}
                            >
                                <option value="">Selecione um municipio...</option>
                                {municipios.map(m => (
                                    <option key={m.id} value={m.id}>{m.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-lg-4">
                            <label className="form-label text-muted small mb-1">Gestor</label>
                            <select
                                className="form-select"
                                value={filterGestorId}
                                onChange={(e) => setFilterGestorId(e.target.value)}
                                disabled={!filterMunicipioId}
                            >
                                <option value="">Selecione um gestor...</option>
                                {gestores.map(g => (
                                    <option key={g.id} value={g.id}>{g.nome} ({g.email})</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-lg-3">
                            <label className="form-label text-muted small mb-1">Escola</label>
                            <select
                                className="form-select"
                                value={filterEscolaId}
                                onChange={(e) => setFilterEscolaId(e.target.value)}
                                disabled={!filterMunicipioId}
                            >
                                <option value="">Todas</option>
                                {escolasFiltro.map(e => (
                                    <option key={e.id} value={e.id}>{e.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-lg-2">
                            <div className="d-flex gap-2">
                                <button className="btn btn-primary flex-fill" onClick={handleAplicar}>
                                    <i className="bi bi-search me-1"></i>Aplicar
                                </button>
                                <button className="btn btn-outline-secondary flex-fill" onClick={handleLimpar}>
                                    <i className="bi bi-arrow-counterclockwise"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {appliedGestorId && (
                <>
                    {/* Tabs */}
                    <ul className="nav nav-tabs mb-4">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'disponiveis' ? 'active' : ''}`}
                                onClick={() => setActiveTab('disponiveis')}
                            >
                                Escolas Disponiveis
                                <span className="badge bg-secondary ms-2">{availablePagination.totalElements}</span>
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'vinculadas' ? 'active' : ''}`}
                                onClick={() => setActiveTab('vinculadas')}
                            >
                                Escolas do Gestor
                                <span className="badge bg-primary ms-2">{linkedPagination.totalElements}</span>
                            </button>
                        </li>
                    </ul>

                    {activeTab === 'disponiveis' ? (
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="border-0">Escola</th>
                                                <th className="border-0 text-end">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {availableSchools.map((escola) => (
                                                <tr key={escola.id}>
                                                    <td className="align-middle">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="d-flex align-items-center justify-content-center rounded-circle bg-secondary bg-opacity-10 text-secondary" style={{ width: 40, height: 40, fontSize: 18 }}>
                                                                <i className="bi bi-building"></i>
                                                            </div>
                                                            <div>
                                                                <p className="fw-medium mb-0">{escola.nome}</p>
                                                                {escola.grupo && <p className="text-muted small mb-0">{escola.grupo}{escola.regiao ? ` - ${escola.regiao}` : ''}</p>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="align-middle text-end">
                                                        <button
                                                            className="btn btn-outline-success btn-sm"
                                                            onClick={() => handleAddSchool(escola.id)}
                                                            disabled={isLoading}
                                                            title="Vincular"
                                                        >
                                                            <i className="bi bi-plus-lg"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {availablePagination.totalPages > 0 && (
                                <div className="card-footer bg-white border-top">
                                    <Pagination
                                        currentPage={availablePage}
                                        pageSize={availablePageSize}
                                        totalElements={availablePagination.totalElements}
                                        totalPages={availablePagination.totalPages}
                                        onPageChange={setAvailablePage}
                                        onPageSizeChange={(size) => { setAvailablePage(0); setAvailablePageSize(size) }}
                                        label="escolas"
                                        isLoading={isLoading}
                                    />
                                </div>
                            )}
                            {availableSchools.length === 0 && (
                                <div className="text-center py-5">
                                    <i className="bi bi-inbox text-muted" style={{ fontSize: 48 }}></i>
                                    <p className="text-muted mt-3">Nenhuma escola disponivel</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="border-0">Escola</th>
                                                <th className="border-0 text-end">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {linkedSchools.map((escola) => (
                                                <tr key={escola.id}>
                                                    <td className="align-middle">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary" style={{ width: 40, height: 40, fontSize: 18 }}>
                                                                <i className="bi bi-building"></i>
                                                            </div>
                                                            <div>
                                                                <p className="fw-medium mb-0">{escola.nome}</p>
                                                                {escola.grupo && <p className="text-muted small mb-0">{escola.grupo}{escola.regiao ? ` - ${escola.regiao}` : ''}</p>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="align-middle text-end">
                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => handleRemoveSchool(escola.id)}
                                                            disabled={isLoading}
                                                            title="Desvincular"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {linkedPagination.totalPages > 0 && (
                                <div className="card-footer bg-white border-top">
                                    <Pagination
                                        currentPage={linkedPage}
                                        pageSize={linkedPageSize}
                                        totalElements={linkedPagination.totalElements}
                                        totalPages={linkedPagination.totalPages}
                                        onPageChange={setLinkedPage}
                                        onPageSizeChange={(size) => { setLinkedPage(0); setLinkedPageSize(size) }}
                                        label="escolas"
                                        isLoading={isLoading}
                                    />
                                </div>
                            )}
                            {linkedSchools.length === 0 && (
                                <div className="text-center py-5">
                                    <i className="bi bi-inbox text-muted" style={{ fontSize: 48 }}></i>
                                    <p className="text-muted mt-3">Nenhuma escola vinculada</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
