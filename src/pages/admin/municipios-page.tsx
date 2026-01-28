import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataStore } from '@/stores'

export function MunicipiosPage() {
    const {
        municipios,
        usuarios,
        alunos,
        escolas,
        fetchMunicipios,
        fetchSolucoes,
        fetchUsuarios,
        fetchAlunos,
        fetchEscolas,
        getSolucoesByMunicipio,
        updateMunicipio,
        deleteMunicipio
    } = useDataStore()
    const navigate = useNavigate()

    // Fetch data on mount
    useEffect(() => {
        fetchMunicipios()
        fetchSolucoes()
        fetchUsuarios()
        fetchAlunos()
        fetchEscolas()
    }, [fetchMunicipios, fetchSolucoes, fetchUsuarios, fetchAlunos, fetchEscolas])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('todos')

    // Dropdown state
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedMunicipio, setSelectedMunicipio] = useState<typeof municipios[0] | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Edit form state
    const [editForm, setEditForm] = useState({
        nome: '',
        estado: '',
        codigoIBGE: '',
        status: 'ativo' as 'ativo' | 'inativo'
    })

    const estados = [
        { value: 'AC', label: 'Acre' }, { value: 'AL', label: 'Alagoas' },
        { value: 'AP', label: 'Amapá' }, { value: 'AM', label: 'Amazonas' },
        { value: 'BA', label: 'Bahia' }, { value: 'CE', label: 'Ceará' },
        { value: 'DF', label: 'Distrito Federal' }, { value: 'ES', label: 'Espírito Santo' },
        { value: 'GO', label: 'Goiás' }, { value: 'MA', label: 'Maranhão' },
        { value: 'MT', label: 'Mato Grosso' }, { value: 'MS', label: 'Mato Grosso do Sul' },
        { value: 'MG', label: 'Minas Gerais' }, { value: 'PA', label: 'Pará' },
        { value: 'PB', label: 'Paraíba' }, { value: 'PR', label: 'Paraná' },
        { value: 'PE', label: 'Pernambuco' }, { value: 'PI', label: 'Piauí' },
        { value: 'RJ', label: 'Rio de Janeiro' }, { value: 'RN', label: 'Rio Grande do Norte' },
        { value: 'RS', label: 'Rio Grande do Sul' }, { value: 'RO', label: 'Rondônia' },
        { value: 'RR', label: 'Roraima' }, { value: 'SC', label: 'Santa Catarina' },
        { value: 'SP', label: 'São Paulo' }, { value: 'SE', label: 'Sergipe' },
        { value: 'TO', label: 'Tocantins' },
    ]

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredMunicipios = municipios.filter((m) => {
        const matchesSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.estado.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'todos' || m.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getMunicipioStats = (municipioId: string) => {
        const userCount = usuarios.filter(u => u.municipioId === municipioId).length
        const alunoCount = alunos.filter(a => a.municipioId === municipioId).length
        const escolaCount = escolas.filter(e => e.municipioId === municipioId).length
        const solucaoCount = getSolucoesByMunicipio(municipioId).length
        return { userCount, alunoCount, escolaCount, solucaoCount }
    }

    const handleMunicipioClick = (municipioId: string) => {
        navigate(`/municipio/${municipioId}/dashboard`)
    }

    const toggleDropdown = (e: React.MouseEvent, municipioId: string) => {
        e.stopPropagation()
        setOpenDropdownId(openDropdownId === municipioId ? null : municipioId)
    }

    const handleEditClick = (e: React.MouseEvent, municipio: typeof municipios[0]) => {
        e.stopPropagation()
        setOpenDropdownId(null)
        setSelectedMunicipio(municipio)
        setEditForm({
            nome: municipio.nome,
            estado: municipio.estado,
            codigoIBGE: municipio.codigoIBGE || '',
            status: municipio.status
        })
        setShowEditModal(true)
    }

    const handleDeleteClick = (e: React.MouseEvent, municipio: typeof municipios[0]) => {
        e.stopPropagation()
        setOpenDropdownId(null)
        setSelectedMunicipio(municipio)
        setShowDeleteModal(true)
    }

    const handleSaveEdit = async () => {
        if (!selectedMunicipio) return
        setIsLoading(true)
        try {
            await updateMunicipio(selectedMunicipio.id, {
                nome: editForm.nome,
                estado: editForm.estado,
                codigoIBGE: editForm.codigoIBGE || undefined,
                status: editForm.status
            })
            await fetchMunicipios()
            setShowEditModal(false)
            setSelectedMunicipio(null)
        } catch (error) {
            console.error('Erro ao salvar:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!selectedMunicipio) return
        setIsLoading(true)
        try {
            await deleteMunicipio(selectedMunicipio.id)
            await fetchMunicipios()
            setShowDeleteModal(false)
            setSelectedMunicipio(null)
        } catch (error) {
            console.error('Erro ao excluir:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 fw-bold text-dark mb-1">Municípios</h1>
                    <p className="text-muted mb-0">Selecione um município para acessar seu ambiente de gestão</p>
                </div>
                <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={() => navigate('/admin/municipios/novo')}
                >
                    <i className="bi bi-plus-lg"></i>
                    Novo Município
                </button>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-12 col-md-6 col-lg-4">
                            <div className="input-group">
                                <span className="input-group-text bg-white">
                                    <i className="bi bi-search text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar município..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-12 col-md-6 col-lg-3">
                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="todos">Todos os status</option>
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm bg-primary text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-building" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{municipios.length}</p>
                                    <p className="small mb-0 opacity-75">Total de Municípios</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm bg-success text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-check-circle" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{municipios.filter(m => m.status === 'ativo').length}</p>
                                    <p className="small mb-0 opacity-75">Ativos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm bg-info text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-mortarboard" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{alunos.length.toLocaleString()}</p>
                                    <p className="small mb-0 opacity-75">Total de Alunos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm bg-warning text-dark">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-people" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{usuarios.filter(u => u.municipioId).length}</p>
                                    <p className="small mb-0">Usuários Ativos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Municipalities Grid */}
            <div className="row g-4" ref={dropdownRef}>
                {filteredMunicipios.map((municipio) => {
                    const stats = getMunicipioStats(municipio.id)
                    const isDropdownOpen = openDropdownId === municipio.id
                    return (
                        <div key={municipio.id} className="col-12 col-md-6 col-xl-4">
                            <div
                                className="card border-0 shadow-sm h-100 card-hover"
                                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                                onClick={() => handleMunicipioClick(municipio.id)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)'
                                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)'
                                }}
                            >
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10"
                                                style={{ width: 56, height: 56 }}>
                                                <i className="bi bi-building text-primary" style={{ fontSize: 24 }}></i>
                                            </div>
                                            <div>
                                                <h5 className="fw-bold mb-0">{municipio.nome}</h5>
                                                <span className="text-muted">{municipio.estado}</span>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className={`badge ${municipio.status === 'ativo' ? 'bg-success' : 'bg-secondary'}`}>
                                                {municipio.status}
                                            </span>
                                            {/* Custom controlled dropdown */}
                                            <div className="position-relative">
                                                <button
                                                    className="btn btn-sm btn-light"
                                                    onClick={(e) => toggleDropdown(e, municipio.id)}
                                                >
                                                    <i className="bi bi-three-dots-vertical"></i>
                                                </button>
                                                {isDropdownOpen && (
                                                    <div
                                                        className="position-absolute end-0 mt-1 py-1 bg-white rounded shadow-lg border"
                                                        style={{ minWidth: 150, zIndex: 1000 }}
                                                    >
                                                        <button
                                                            className="dropdown-item d-flex align-items-center gap-2 px-3 py-2"
                                                            onClick={(e) => handleEditClick(e, municipio)}
                                                        >
                                                            <i className="bi bi-pencil text-primary"></i>
                                                            Editar
                                                        </button>
                                                        <hr className="dropdown-divider my-1" />
                                                        <button
                                                            className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger"
                                                            onClick={(e) => handleDeleteClick(e, municipio)}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                            Excluir
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row text-center border-top pt-3 g-0">
                                        <div className="col-3 border-end">
                                            <p className="h5 fw-bold text-primary mb-0">{stats.solucaoCount}</p>
                                            <p className="text-muted small mb-0">Soluções</p>
                                        </div>
                                        <div className="col-3 border-end">
                                            <p className="h5 fw-bold text-warning mb-0">{stats.escolaCount}</p>
                                            <p className="text-muted small mb-0">Escolas</p>
                                        </div>
                                        <div className="col-3 border-end">
                                            <p className="h5 fw-bold text-success mb-0">{stats.userCount}</p>
                                            <p className="text-muted small mb-0">Usuários</p>
                                        </div>
                                        <div className="col-3">
                                            <p className="h5 fw-bold text-info mb-0">{stats.alunoCount}</p>
                                            <p className="text-muted small mb-0">Alunos</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-footer bg-light border-0 d-flex justify-content-between align-items-center py-2">
                                    <small className="text-muted">
                                        <i className="bi bi-calendar3 me-1"></i>
                                        Desde {new Date(municipio.createdAt).toLocaleDateString('pt-BR')}
                                    </small>
                                    <span className="text-primary fw-medium small">
                                        Acessar <i className="bi bi-arrow-right"></i>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {filteredMunicipios.length === 0 && (
                <div className="text-center py-5">
                    <i className="bi bi-inbox text-muted" style={{ fontSize: 48 }}></i>
                    <p className="text-muted mt-3">Nenhum município encontrado</p>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedMunicipio && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-pencil me-2"></i>
                                        Editar Município
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => setShowEditModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="row g-4">
                                        <div className="col-12">
                                            <label className="form-label fw-medium">
                                                Nome do Município <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg"
                                                value={editForm.nome}
                                                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-medium">
                                                Estado <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className="form-select form-select-lg"
                                                value={editForm.estado}
                                                onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                                            >
                                                <option value="">Selecione</option>
                                                {estados.map(e => (
                                                    <option key={e.value} value={e.value}>{e.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-medium">Status</label>
                                            <select
                                                className="form-select form-select-lg"
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'ativo' | 'inativo' })}
                                            >
                                                <option value="ativo">Ativo</option>
                                                <option value="inativo">Inativo</option>
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-medium">Código IBGE</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Ex: 3550308"
                                                value={editForm.codigoIBGE}
                                                onChange={(e) => setEditForm({ ...editForm, codigoIBGE: e.target.value })}
                                            />
                                            <div className="form-text">Opcional</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleSaveEdit}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</>
                                        ) : (
                                            <><i className="bi bi-check-lg me-2"></i>Salvar Alterações</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedMunicipio && (
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
                                        onClick={() => setShowDeleteModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body p-4 text-center">
                                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-4"
                                        style={{ width: 80, height: 80 }}>
                                        <i className="bi bi-trash text-danger" style={{ fontSize: 36 }}></i>
                                    </div>
                                    <h5 className="mb-2">Excluir {selectedMunicipio.nome}?</h5>
                                    <p className="text-muted mb-0">
                                        Esta ação não pode ser desfeita. Todos os dados vinculados a este município serão removidos.
                                    </p>
                                </div>
                                <div className="modal-footer bg-light justify-content-center">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary px-4"
                                        onClick={() => setShowDeleteModal(false)}
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
