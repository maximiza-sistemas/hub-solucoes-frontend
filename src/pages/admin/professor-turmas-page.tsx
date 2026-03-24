import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores'
import { Pagination, PageLoading, TableLoading } from '@/components/ui'
import { professoresApi, municipiosApi, escolasApi, turmasApi } from '@/services/api'
import type { Usuario, Turma, Municipio, Escola, PageResponse } from '@/types'
import { toast } from 'sonner'

export function ProfessorTurmasPage() {
    const { accessToken } = useAuthStore()

    const [municipios, setMunicipios] = useState<Municipio[]>([])
    const [professores, setProfessores] = useState<Usuario[]>([])
    const [escolas, setEscolas] = useState<Escola[]>([])

    const [turmas, setTurmas] = useState<Turma[]>([])

    const [filterMunicipioId, setFilterMunicipioId] = useState('')
    const [filterProfessorId, setFilterProfessorId] = useState('')
    const [filterEscolaId, setFilterEscolaId] = useState('')
    const [filterTurmaId, setFilterTurmaId] = useState('')

    const [appliedProfessorId, setAppliedProfessorId] = useState<number | null>(null)
    const [appliedMunicipioId, setAppliedMunicipioId] = useState('')
    const [appliedEscolaId, setAppliedEscolaId] = useState('')
    const [appliedTurmaId, setAppliedTurmaId] = useState('')

    const [activeTab, setActiveTab] = useState<'disponiveis' | 'vinculadas'>('disponiveis')

    const [linkedTurmas, setLinkedTurmas] = useState<Turma[]>([])
    const [linkedPagination, setLinkedPagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
    const [linkedPage, setLinkedPage] = useState(0)
    const [linkedPageSize, setLinkedPageSize] = useState(10)

    const [availableTurmas, setAvailableTurmas] = useState<Turma[]>([])
    const [availablePagination, setAvailablePagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
    const [availablePage, setAvailablePage] = useState(0)
    const [availablePageSize, setAvailablePageSize] = useState(10)

    const [initialLoading, setInitialLoading] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)

    useEffect(() => {
        municipiosApi.list(accessToken)
            .then(r => setMunicipios(r.content))
            .finally(() => setInitialLoading(false))
    }, [])

    // Cascading: municipio -> professores + escolas
    useEffect(() => {
        if (filterMunicipioId) {
            const munId = Number(filterMunicipioId)
            professoresApi.listProfessoresByMunicipio(munId, accessToken).then(r => setProfessores(r.content))
            escolasApi.list(accessToken, { municipioId: munId }).then(r => setEscolas(r.content))
        } else {
            setProfessores([])
            setEscolas([])
            setFilterProfessorId('')
            setFilterEscolaId('')
        }
    }, [filterMunicipioId])

    // Cascading: escola -> turmas
    useEffect(() => {
        if (filterEscolaId) {
            turmasApi.list(accessToken, { escolaId: Number(filterEscolaId), size: 1000 }).then(r => setTurmas(r.content))
        } else {
            setTurmas([])
            setFilterTurmaId('')
        }
    }, [filterEscolaId])

    useEffect(() => {
        if (appliedProfessorId) loadLinkedTurmas()
    }, [linkedPage, linkedPageSize])

    useEffect(() => {
        if (appliedProfessorId) loadAvailableTurmas()
    }, [availablePage, availablePageSize])

    const loadLinkedTurmas = async (professorId = appliedProfessorId) => {
        if (!professorId) return
        setIsFetching(true)
        try {
            const response = await professoresApi.getTurmas(professorId, accessToken, {
                page: linkedPage,
                size: linkedPageSize,
            }) as PageResponse<Turma>
            setLinkedTurmas(response.content)
            setLinkedPagination({ page: response.page, size: response.size, totalElements: response.totalElements, totalPages: response.totalPages })
        } catch (error) {
            console.error('Erro ao carregar turmas vinculadas:', error)
        } finally {
            setIsFetching(false)
        }
    }

    const loadAvailableTurmas = async (professorId = appliedProfessorId, municipioId = appliedMunicipioId, escolaId = appliedEscolaId, turmaId = appliedTurmaId) => {
        if (!professorId) return
        setIsFetching(true)
        try {
            const response = await professoresApi.getAvailableTurmas(professorId, accessToken, {
                page: availablePage,
                size: availablePageSize,
                municipioId: municipioId ? Number(municipioId) : undefined,
                escolaId: escolaId ? Number(escolaId) : undefined,
                turmaId: turmaId ? Number(turmaId) : undefined,
            }) as PageResponse<Turma>
            setAvailableTurmas(response.content)
            setAvailablePagination({ page: response.page, size: response.size, totalElements: response.totalElements, totalPages: response.totalPages })
        } catch (error) {
            console.error('Erro ao carregar turmas disponíveis:', error)
        } finally {
            setIsFetching(false)
        }
    }

    const handleAplicar = () => {
        if (!filterProfessorId) {
            toast.error('Selecione um professor')
            return
        }
        const professorId = Number(filterProfessorId)
        setAppliedProfessorId(professorId)
        setAppliedMunicipioId(filterMunicipioId)
        setAppliedEscolaId(filterEscolaId)
        setAppliedTurmaId(filterTurmaId)
        setLinkedPage(0)
        setAvailablePage(0)

        const loadData = async () => {
            setIsFetching(true)
            try {
                const [linked, available] = await Promise.all([
                    professoresApi.getTurmas(professorId, accessToken, { page: 0, size: linkedPageSize }) as Promise<PageResponse<Turma>>,
                    professoresApi.getAvailableTurmas(professorId, accessToken, {
                        page: 0,
                        size: availablePageSize,
                        municipioId: filterMunicipioId ? Number(filterMunicipioId) : undefined,
                        escolaId: filterEscolaId ? Number(filterEscolaId) : undefined,
                        turmaId: filterTurmaId ? Number(filterTurmaId) : undefined,
                    }) as Promise<PageResponse<Turma>>,
                ])
                setLinkedTurmas(linked.content)
                setLinkedPagination({ page: linked.page, size: linked.size, totalElements: linked.totalElements, totalPages: linked.totalPages })
                setAvailableTurmas(available.content)
                setAvailablePagination({ page: available.page, size: available.size, totalElements: available.totalElements, totalPages: available.totalPages })
            } catch (error) {
                console.error('Erro ao aplicar filtros:', error)
            } finally {
                setIsFetching(false)
            }
        }
        loadData()
    }

    const handleLimpar = () => {
        setFilterMunicipioId('')
        setFilterProfessorId('')
        setFilterEscolaId('')
        setFilterTurmaId('')
        setAppliedProfessorId(null)
        setAppliedMunicipioId('')
        setAppliedEscolaId('')
        setAppliedTurmaId('')
        setLinkedTurmas([])
        setAvailableTurmas([])
        setLinkedPagination({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
        setAvailablePagination({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
        setLinkedPage(0)
        setAvailablePage(0)
    }

    const handleAddTurma = async (turmaId: number) => {
        if (!appliedProfessorId) return
        setIsLoading(true)
        try {
            await professoresApi.addTurma(appliedProfessorId, turmaId, accessToken)
            toast.success('Turma vinculada com sucesso')
            await Promise.all([loadLinkedTurmas(), loadAvailableTurmas()])
        } catch (error) {
            toast.error('Erro ao vincular turma')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemoveTurma = async (turmaId: number) => {
        if (!appliedProfessorId) return
        setIsLoading(true)
        try {
            await professoresApi.removeTurma(appliedProfessorId, turmaId, accessToken)
            toast.success('Turma desvinculada com sucesso')
            await Promise.all([loadLinkedTurmas(), loadAvailableTurmas()])
        } catch (error) {
            toast.error('Erro ao desvincular turma')
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
                    <h1 className="h3 fw-bold text-dark mb-1">Professor Turmas</h1>
                    <p className="text-muted mb-0">Vincule professores a turmas</p>
                </div>
            </div>

            {/* Filtro */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body py-3">
                    <div className="row gy-3 gx-3 align-items-end">
                        <div className="col-12 col-lg">
                            <label className="form-label text-muted small mb-1">Municipio</label>
                            <select
                                className="form-select"
                                value={filterMunicipioId}
                                onChange={(e) => { setFilterMunicipioId(e.target.value); setFilterProfessorId(''); setFilterEscolaId(''); setFilterTurmaId('') }}
                            >
                                <option value="">Selecione um municipio...</option>
                                {municipios.map(m => (
                                    <option key={m.id} value={m.id}>{m.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-lg">
                            <label className="form-label text-muted small mb-1">Professor</label>
                            <select
                                className="form-select"
                                value={filterProfessorId}
                                onChange={(e) => setFilterProfessorId(e.target.value)}
                                disabled={!filterMunicipioId}
                            >
                                <option value="">Selecione um professor...</option>
                                {professores.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome} ({p.email})</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-lg">
                            <label className="form-label text-muted small mb-1">Escola</label>
                            <select
                                className="form-select"
                                value={filterEscolaId}
                                onChange={(e) => { setFilterEscolaId(e.target.value); setFilterTurmaId('') }}
                                disabled={!filterMunicipioId}
                            >
                                <option value="">Todas</option>
                                {escolas.map(e => (
                                    <option key={e.id} value={e.id}>{e.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-lg">
                            <label className="form-label text-muted small mb-1">Turma</label>
                            <select
                                className="form-select"
                                value={filterTurmaId}
                                onChange={(e) => setFilterTurmaId(e.target.value)}
                                disabled={!filterEscolaId}
                            >
                                <option value="">Todas</option>
                                {turmas.map(t => (
                                    <option key={t.id} value={t.id}>{t.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-lg-auto">
                            <div className="d-flex gap-2">
                                <button className="btn btn-primary" onClick={handleAplicar}>
                                    <i className="bi bi-search me-1"></i>Aplicar
                                </button>
                                <button className="btn btn-outline-secondary" onClick={handleLimpar}>
                                    <i className="bi bi-arrow-counterclockwise"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {appliedProfessorId && (
                <>
                    {/* Tabs */}
                    <ul className="nav nav-tabs mb-4">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'disponiveis' ? 'active' : ''}`}
                                onClick={() => setActiveTab('disponiveis')}
                            >
                                Turmas Disponiveis
                                <span className="badge bg-secondary ms-2">{availablePagination.totalElements}</span>
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'vinculadas' ? 'active' : ''}`}
                                onClick={() => setActiveTab('vinculadas')}
                            >
                                Turmas do Professor
                                <span className="badge bg-primary ms-2">{linkedPagination.totalElements}</span>
                            </button>
                        </li>
                    </ul>

                    {activeTab === 'disponiveis' ? (
                        <TableLoading isLoading={isFetching}>
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="border-0">Turma</th>
                                                <th className="border-0">Turno</th>
                                                <th className="border-0">Serie</th>
                                                <th className="border-0 text-end">Acoes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {availableTurmas.map((turma) => (
                                                <tr key={turma.id}>
                                                    <td className="align-middle">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="d-flex align-items-center justify-content-center rounded-circle bg-secondary bg-opacity-10 text-secondary" style={{ width: 40, height: 40, fontSize: 18 }}>
                                                                <i className="bi bi-journal-text"></i>
                                                            </div>
                                                            <div>
                                                                <p className="fw-medium mb-0">{turma.nome}</p>
                                                                {turma.escola && <p className="text-muted small mb-0">{turma.escola}</p>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="align-middle">{turma.turno}</td>
                                                    <td className="align-middle">{turma.serie}</td>
                                                    <td className="align-middle text-end">
                                                        <button
                                                            className="btn btn-outline-success btn-sm"
                                                            onClick={() => handleAddTurma(turma.id)}
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
                                        label="turmas"
                                        isLoading={isLoading}
                                    />
                                </div>
                            )}
                            {availableTurmas.length === 0 && (
                                <div className="text-center py-5">
                                    <i className="bi bi-inbox text-muted" style={{ fontSize: 48 }}></i>
                                    <p className="text-muted mt-3">Nenhuma turma disponivel</p>
                                </div>
                            )}
                        </div>
                        </TableLoading>
                    ) : (
                        <TableLoading isLoading={isFetching}>
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="border-0">Turma</th>
                                                <th className="border-0">Turno</th>
                                                <th className="border-0">Serie</th>
                                                <th className="border-0 text-end">Acoes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {linkedTurmas.map((turma) => (
                                                <tr key={turma.id}>
                                                    <td className="align-middle">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary" style={{ width: 40, height: 40, fontSize: 18 }}>
                                                                <i className="bi bi-journal-text"></i>
                                                            </div>
                                                            <div>
                                                                <p className="fw-medium mb-0">{turma.nome}</p>
                                                                {turma.escola && <p className="text-muted small mb-0">{turma.escola}</p>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="align-middle">{turma.turno}</td>
                                                    <td className="align-middle">{turma.serie}</td>
                                                    <td className="align-middle text-end">
                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => handleRemoveTurma(turma.id)}
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
                                        label="turmas"
                                        isLoading={isLoading}
                                    />
                                </div>
                            )}
                            {linkedTurmas.length === 0 && (
                                <div className="text-center py-5">
                                    <i className="bi bi-inbox text-muted" style={{ fontSize: 48 }}></i>
                                    <p className="text-muted mt-3">Nenhuma turma vinculada</p>
                                </div>
                            )}
                        </div>
                        </TableLoading>
                    )}
                </>
            )}
        </div>
    )
}
