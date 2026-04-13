import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore, useImportJobStore } from '@/stores'
import { Pagination, PageLoading, TableLoading } from '@/components/ui'
import { escolasApi, turmasApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth-store'
import type { Aluno, Escola, Turma } from '@/types'
import { formatDateBR } from '@/lib/utils'
import { AlunoImportModal } from '@/components/aluno-import-modal'
import { downloadAlunoTemplate } from '@/lib/aluno-template'

function parseDateToInput(dateStr: string): string {
    if (!dateStr) return ''
    // Try dd/MM/yyyy format first
    const brParts = dateStr.split('/')
    if (brParts.length === 3 && brParts[0].length <= 2) {
        return `${brParts[2]}-${brParts[1]}-${brParts[0]}`
    }
    // Already yyyy-MM-dd
    if (dateStr.includes('-')) return dateStr
    return ''
}

export function MunicipioAlunosPage() {
    const { municipioId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const isSuperAdmin = user?.role === 'SUPERADMIN'
    const {
        municipios,
        alunos,
        pagination,
        escolas,
        turmas,
        fetchMunicipios,
        fetchAlunos,
        fetchEscolas,
        fetchTurmas,
        addAluno,
        updateAluno,
        deleteAluno,
    } = useDataStore()

    const munId = municipioId ? Number(municipioId) : undefined
    const showMunicipioFilter = isSuperAdmin && !munId

    const [nomeTerm, setNomeTerm] = useState('')
    const [matriculaTerm, setMatriculaTerm] = useState('')
    const [cpfTerm, setCpfTerm] = useState('')
    const [turmaFilter, setTurmaFilter] = useState('')
    const [escolaFilter, setEscolaFilter] = useState('')
    const [municipioFilter, setMunicipioFilter] = useState(munId ? String(munId) : '')

    const [appliedFilters, setAppliedFilters] = useState({
        nome: '',
        matricula: '',
        cpf: '',
        turmaId: '',
        escolaId: '',
        municipioId: munId ? String(munId) : ''
    })
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        nome: '',
        dataNascimento: '',
        cpf: '',
        matricula: '',
        turmaId: '',
        escolaId: '',
        municipioId: munId ? String(munId) : '',
    })
    const [initialLoading, setInitialLoading] = useState(true)
    const [isFetching, setIsFetching] = useState(false)
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})
    const [formEscolas, setFormEscolas] = useState<Escola[]>([])
    const [formTurmas, setFormTurmas] = useState<Turma[]>([])

    useEffect(() => {
        const token = useAuthStore.getState().accessToken
        const params: Record<string, any> = { size: 1000 }
        if (isSuperAdmin) {
            const targetMunId = formData.municipioId ? Number(formData.municipioId) : munId
            if (!targetMunId) { setFormEscolas([]); setFormTurmas([]); return }
            params.municipioId = targetMunId
        }
        escolasApi.list(token, params)
            .then(res => {
                const content = Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : []
                setFormEscolas(content)
            })
            .catch(console.error)
        turmasApi.list(token, params)
            .then(res => {
                const content = Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : []
                setFormTurmas(content)
            })
            .catch(console.error)
    }, [formData.municipioId, munId, isSuperAdmin])

    useEffect(() => {
        Promise.all([
            fetchMunicipios(),
            fetchEscolas(munId),
            fetchTurmas(munId),
            fetchAlunos({ municipioId: munId, page: 0, size: pageSize }),
        ]).finally(() => setInitialLoading(false))
    }, [])

    const municipio = munId ? municipios.find((m) => m.id === munId) : undefined
    const alunosPagination = pagination.alunos || { page: 0, size: pageSize, totalElements: 0, totalPages: 0 }

    const refetchAlunos = async () => {
        setIsFetching(true)
        try {
            return await fetchAlunos({
                municipioId: munId || (isSuperAdmin && appliedFilters.municipioId ? Number(appliedFilters.municipioId) : undefined),
                page: currentPage,
                size: pageSize,
                nome: appliedFilters.nome || undefined,
                matricula: appliedFilters.matricula || undefined,
                cpf: appliedFilters.cpf || undefined,
                turmaId: appliedFilters.turmaId ? Number(appliedFilters.turmaId) : undefined,
                escolaId: appliedFilters.escolaId ? Number(appliedFilters.escolaId) : undefined,
            })
        } finally {
            setIsFetching(false)
        }
    }

    useEffect(() => {
        if (!initialLoading) refetchAlunos()
    }, [munId, currentPage, pageSize, appliedFilters])

    const importLastCompletedAt = useImportJobStore(s => s.lastCompletedAt)
    useEffect(() => {
        if (importLastCompletedAt && !initialLoading) {
            refetchAlunos()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [importLastCompletedAt])

    const handleApplyFilters = () => {
        setCurrentPage(0)
        setAppliedFilters({
            nome: nomeTerm,
            matricula: matriculaTerm,
            cpf: cpfTerm,
            turmaId: turmaFilter,
            escolaId: escolaFilter,
            municipioId: showMunicipioFilter ? municipioFilter : ''
        })
    }

    const handleClearFilters = () => {
        setNomeTerm('')
        setMatriculaTerm('')
        setCpfTerm('')
        setTurmaFilter('')
        setEscolaFilter('')
        const initialMun = munId ? String(munId) : ''
        setMunicipioFilter(initialMun)
        setCurrentPage(0)
        setAppliedFilters({
            nome: '',
            matricula: '',
            cpf: '',
            turmaId: '',
            escolaId: '',
            municipioId: initialMun
        })
    }

    const validateForm = () => {
        const errors: Record<string, string> = {}
        if (!formData.nome || formData.nome.length < 3) errors.nome = 'Nome deve ter no mínimo 3 caracteres'
        if (!formData.escolaId) errors.escolaId = 'Escola é obrigatória'
        if (!formData.turmaId) errors.turmaId = 'Turma é obrigatória'
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const resetForm = () => {
        setFormData({ nome: '', dataNascimento: '', cpf: '', matricula: '', turmaId: '', escolaId: '', municipioId: munId ? String(munId) : '' })
        setFormErrors({})
        setError(null)
    }

    const handleOpenAddModal = () => { resetForm(); setShowAddModal(true) }

    const handleOpenEditModal = (aluno: Aluno) => {
        setSelectedAluno(aluno)
        // Derive municipioId from municipio name or fallback to route param
        const mun = municipios.find(m => m.nome === aluno.municipio)
        const alunoMunicipioId = mun ? String(mun.id) : munId ? String(munId) : ''
        setFormData({
            nome: aluno.nome,
            dataNascimento: parseDateToInput(aluno.dataNascimento || ''),
            cpf: aluno.cpf || '',
            matricula: aluno.matricula,
            turmaId: aluno.turmaId ? String(aluno.turmaId) : '',
            escolaId: aluno.escolaId ? String(aluno.escolaId) : '',
            municipioId: alunoMunicipioId,
        })
        setFormErrors({})
        setError(null)
        // Pre-load escolas and turmas for the aluno's municipality
        if (alunoMunicipioId) {
            const token = useAuthStore.getState().accessToken
            escolasApi.list(token, { municipioId: Number(alunoMunicipioId), size: 1000 })
                .then(res => {
                    const content = Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : []
                    setFormEscolas(content)
                })
                .catch(console.error)
            turmasApi.list(token, { municipioId: Number(alunoMunicipioId), size: 1000 })
                .then(res => {
                    const content = Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : []
                    setFormTurmas(content)
                })
                .catch(console.error)
        }
        setShowEditModal(true)
    }

    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .slice(0, 14)
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return
        setIsLoading(true)
        setError(null)
        try {
            await addAluno({
                nome: formData.nome,
                dataNascimento: formData.dataNascimento ? formatDateBR(formData.dataNascimento) : '',
                cpf: formData.cpf || undefined,
                matricula: formData.matricula,
                turmaId: Number(formData.turmaId),
                escolaId: Number(formData.escolaId),
                municipioId: formData.municipioId ? Number(formData.municipioId) : munId,
            })
            await refetchAlunos()
            setShowAddModal(false)
        } catch (err) {
            setError((err as Error).message || 'Erro ao cadastrar aluno')
        } finally { setIsLoading(false) }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm() || !selectedAluno) return
        setIsLoading(true)
        setError(null)
        try {
            await updateAluno(selectedAluno.id, {
                nome: formData.nome,
                dataNascimento: formData.dataNascimento ? formatDateBR(formData.dataNascimento) : '',
                cpf: formData.cpf || undefined,
                matricula: formData.matricula,
                turmaId: Number(formData.turmaId),
                escolaId: Number(formData.escolaId),
                municipioId: formData.municipioId ? Number(formData.municipioId) : munId,
            })
            await refetchAlunos()
            setShowEditModal(false)
            setSelectedAluno(null)
        } catch (err) {
            setError((err as Error).message || 'Erro ao atualizar aluno')
        } finally { setIsLoading(false) }
    }

    const handleConfirmDelete = async () => {
        if (!selectedAluno) return
        setIsLoading(true)
        try {
            await deleteAluno(selectedAluno.id)
            await refetchAlunos()
            setShowDeleteModal(false)
            setSelectedAluno(null)
        } catch (error) { console.error('Erro:', error) }
        finally { setIsLoading(false) }
    }

    if (initialLoading) return <PageLoading />

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

    const formFields = (
        <div className="row g-3">
            {error && (
                <div className="col-12">
                    <div className="alert alert-danger d-flex align-items-center mb-0">
                        <i className="bi bi-exclamation-triangle me-2"></i>{error}
                    </div>
                </div>
            )}
            <div className="col-md-8">
                <label className="form-label fw-medium">Nome Completo <span className="text-danger">*</span></label>
                <input type="text" className={`form-control ${formErrors.nome ? 'is-invalid' : ''}`} placeholder="Nome completo do aluno" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
            </div>
            <div className="col-md-4">
                <label className="form-label fw-medium">Data de Nascimento</label>
                <input type="date" className="form-control" value={formData.dataNascimento} onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })} />
            </div>
            <div className="col-md-6">
                <label className="form-label fw-medium">CPF</label>
                <input type="text" className="form-control" placeholder="000.000.000-00" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })} />
            </div>
            <div className="col-md-6">
                <label className="form-label fw-medium">Matrícula</label>
                <input type="text" className={`form-control ${formErrors.matricula ? 'is-invalid' : ''}`} placeholder="Número de matrícula" value={formData.matricula} onChange={(e) => setFormData({ ...formData, matricula: e.target.value })} />
                {formErrors.matricula && <div className="invalid-feedback">{formErrors.matricula}</div>}
            </div>
            {isSuperAdmin && (
                <div className="col-md-12">
                    <label className="form-label fw-medium">Município <span className="text-danger">*</span></label>
                    <select className="form-select" value={formData.municipioId} onChange={(e) => setFormData({ ...formData, municipioId: e.target.value, escolaId: '', turmaId: '' })} disabled={!!munId} required>
                        <option value="">Selecione um município</option>
                        {municipios.map(m => <option key={m.id} value={m.id}>{m.nome} - {m.uf}</option>)}
                    </select>
                </div>
            )}
            <div className="col-md-6">
                <label className="form-label fw-medium">Escola <span className="text-danger">*</span></label>
                <select className={`form-select ${formErrors.escolaId ? 'is-invalid' : ''}`} value={formData.escolaId} onChange={(e) => setFormData({ ...formData, escolaId: e.target.value, turmaId: '' })}>
                    <option value="">Selecione uma escola</option>
                    {formEscolas.map(escola => <option key={escola.id} value={escola.id}>{escola.nome}</option>)}
                </select>
                {formErrors.escolaId && <div className="invalid-feedback">{formErrors.escolaId}</div>}
            </div>
            <div className="col-md-6">
                <label className="form-label fw-medium">Turma <span className="text-danger">*</span></label>
                <select className={`form-select ${formErrors.turmaId ? 'is-invalid' : ''}`} value={formData.turmaId} onChange={(e) => setFormData({ ...formData, turmaId: e.target.value })}>
                    <option value="">Selecione uma turma</option>
                    {(formData.escolaId ? formTurmas.filter(t => String(t.escolaId) === formData.escolaId) : formTurmas).map(turma => <option key={turma.id} value={turma.id}>{turma.nome} - {turma.serie}</option>)}
                </select>
                {formErrors.turmaId && <div className="invalid-feedback">{formErrors.turmaId}</div>}
            </div>
        </div>
    )

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
                        <h1 className="h3 fw-bold text-dark mb-0">Alunos</h1>
                    </div>
                    {municipio && <p className="text-muted mb-0">{municipio.nome} - {municipio.uf}</p>}
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-success d-flex align-items-center gap-2" onClick={downloadAlunoTemplate}>
                        <i className="bi bi-download"></i>Template
                    </button>
                    <button className="btn btn-success d-flex align-items-center gap-2" onClick={() => setShowImportModal(true)}>
                        <i className="bi bi-file-earmark-excel"></i>Importar Alunos
                    </button>
                    <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
                        <i className="bi bi-plus-lg"></i>Novo Aluno
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body py-3">
                    <div className="row gy-3 gx-3 align-items-end">
                        <div className="col-12 col-lg-4">
                            <label className="form-label text-muted small mb-1">Nome</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                                <input type="text" className="form-control border-start-0 rounded-start-0" placeholder="Buscar por nome..." value={nomeTerm} onChange={(e) => setNomeTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="col-12 col-lg-2">
                            <label className="form-label text-muted small mb-1">Matrícula</label>
                            <input type="text" className="form-control" placeholder="EX: 123" value={matriculaTerm} onChange={e => setMatriculaTerm(e.target.value)} />
                        </div>
                        <div className="col-12 col-lg-2">
                            <label className="form-label text-muted small mb-1">CPF</label>
                            <input type="text" className="form-control" placeholder="000.000.000-00" value={cpfTerm} onChange={e => setCpfTerm(formatCPF(e.target.value))} />
                        </div>
                        {showMunicipioFilter && (
                            <div className="col-12 col-lg-4">
                                <label className="form-label text-muted small mb-1">Município</label>
                                <select className="form-select" value={municipioFilter} onChange={e => setMunicipioFilter(e.target.value)}>
                                    <option value="">Todos os municípios</option>
                                    {(municipios || []).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                </select>
                            </div>
                        )}
                        <div className={`col-12 ${showMunicipioFilter ? 'col-lg-3' : 'col-lg-2'}`}>
                            <label className="form-label text-muted small mb-1">Escola</label>
                            <select className="form-select" value={escolaFilter} onChange={e => { setEscolaFilter(e.target.value); setTurmaFilter('') }}>
                                <option value="">Todas</option>
                                {(escolas || []).map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                            </select>
                        </div>
                        <div className={`col-12 ${showMunicipioFilter ? 'col-lg-3' : 'col-lg-2'}`}>
                            <label className="form-label text-muted small mb-1">Turma</label>
                            <select className="form-select" value={turmaFilter} onChange={e => setTurmaFilter(e.target.value)} disabled={!escolaFilter}>
                                <option value="">{escolaFilter ? 'Todas' : 'Selecione uma escola'}</option>
                                {(turmas || []).filter(t => escolaFilter ? String(t.escolaId) === escolaFilter : true).map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                            </select>
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
            </div>

            {/* Table */}
            {alunos.length > 0 ? (
                <TableLoading isLoading={isFetching}>
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="border-0">Aluno</th>
                                        <th className="border-0">CPF</th>
                                        <th className="border-0">Matrícula</th>
                                        <th className="border-0">Turma / Série</th>
                                        <th className="border-0">Município</th>
                                        <th className="border-0 text-end">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alunos.map((aluno) => (
                                        <tr key={aluno.id}>
                                            <td className="align-middle">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-info bg-opacity-10 text-info" style={{ width: 40, height: 40, fontSize: 14 }}>
                                                        {aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                    </div>
                                                    <p className="fw-medium mb-0">{aluno.nome}</p>
                                                </div>
                                            </td>
                                            <td className="align-middle">
                                                <span className="text-muted">{aluno.cpf || '-'}</span>
                                            </td>
                                            <td className="align-middle">
                                                <code className="bg-light px-2 py-1 rounded">{aluno.matricula}</code>
                                            </td>
                                            <td className="align-middle">{aluno.turma ? `${aluno.turma} - ${aluno.serie}` : '-'}</td>
                                            <td className="align-middle">
                                                <span className="text-muted">{aluno.municipio || '-'}</span>
                                            </td>
                                            <td className="align-middle text-end">
                                                <div className="btn-group btn-group-sm">
                                                    <button className="btn btn-outline-primary" onClick={() => handleOpenEditModal(aluno)}><i className="bi bi-pencil"></i></button>
                                                    <button className="btn btn-outline-danger" onClick={() => { setSelectedAluno(aluno); setShowDeleteModal(true) }}><i className="bi bi-trash"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {alunosPagination.totalPages > 0 && (
                        <div className="card-footer bg-white border-top">
                            <Pagination
                                currentPage={currentPage}
                                pageSize={pageSize}
                                totalElements={alunosPagination.totalElements}
                                totalPages={alunosPagination.totalPages}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(size) => { setCurrentPage(0); setPageSize(size) }}
                                label="alunos"
                                isLoading={isLoading}
                            />
                        </div>
                    )}
                </div>
                </TableLoading>
            ) : (
                <div className="text-center py-5">
                    <i className="bi bi-inbox text-muted" style={{ fontSize: 48 }}></i>
                    <p className="text-muted mt-3">Nenhum aluno encontrado</p>
                    <button className="btn btn-primary mt-2" onClick={handleOpenAddModal}>
                        <i className="bi bi-plus-lg me-2"></i>Cadastrar Aluno
                    </button>
                </div>
            )}

            {/* Modal Novo Aluno */}
            {showAddModal && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title"><i className="bi bi-person-plus me-2"></i>Novo Aluno</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
                    </div>
                    <form onSubmit={handleAddSubmit}>
                        <div className="modal-body p-4">{formFields}</div>
                        <div className="modal-footer bg-light">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Cadastrar</>}
                            </button>
                        </div>
                    </form>
                </div></div></div><div className="modal-backdrop fade show"></div></>
            )}

            {/* Modal Editar Aluno */}
            {showEditModal && selectedAluno && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title"><i className="bi bi-pencil me-2"></i>Editar Aluno</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => { setShowEditModal(false); setSelectedAluno(null) }}></button>
                    </div>
                    <form onSubmit={handleEditSubmit}>
                        <div className="modal-body p-4">{formFields}</div>
                        <div className="modal-footer bg-light">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowEditModal(false); setSelectedAluno(null) }}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Salvar</>}
                            </button>
                        </div>
                    </form>
                </div></div></div><div className="modal-backdrop fade show"></div></>
            )}

            {/* Modal Importar */}
            <AlunoImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
            />

            {/* Modal Excluir */}
            {showDeleteModal && selectedAluno && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-danger text-white">
                        <h5 className="modal-title"><i className="bi bi-exclamation-triangle me-2"></i>Confirmar Exclusão</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => { setShowDeleteModal(false); setSelectedAluno(null) }}></button>
                    </div>
                    <div className="modal-body p-4 text-center">
                        <div className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-4" style={{ width: 80, height: 80 }}>
                            <i className="bi bi-trash text-danger" style={{ fontSize: 36 }}></i>
                        </div>
                        <h5 className="mb-2">Excluir "{selectedAluno.nome}"?</h5>
                        <p className="text-muted mb-0">Esta ação não pode ser desfeita.</p>
                    </div>
                    <div className="modal-footer bg-light justify-content-center">
                        <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setShowDeleteModal(false); setSelectedAluno(null) }}>Cancelar</button>
                        <button type="button" className="btn btn-danger px-4" onClick={handleConfirmDelete} disabled={isLoading}>
                            {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Excluindo...</> : <><i className="bi bi-trash me-2"></i>Sim, Excluir</>}
                        </button>
                    </div>
                </div></div></div><div className="modal-backdrop fade show"></div></>
            )}
        </div>
    )
}
