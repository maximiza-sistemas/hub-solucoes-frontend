import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore, useAuthStore, useUsuarioImportJobStore } from '@/stores'
import { Pagination, PageLoading, TableLoading } from '@/components/ui'
import { UsuarioImportModal } from '@/components/usuario-import-modal'
import type { Usuario } from '@/types'

export function MunicipioUsuariosPage() {
    const { municipioId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const isSuperAdmin = user?.role === 'SUPERADMIN'
    const {
        municipios,
        usuarios,
        pagination,
        fetchMunicipios,
        fetchUsuarios,
        fetchRoles,
        addUsuario,
        updateUsuario,
        deleteUsuario,
        roles,
    } = useDataStore()

    const munId = Number(municipioId)

    const [nomeTerm, setNomeTerm] = useState('')
    const [debouncedNome, setDebouncedNome] = useState('')
    const [emailTerm, setEmailTerm] = useState('')
    const [debouncedEmail, setDebouncedEmail] = useState('')
    const [ativoFilter, setAtivoFilter] = useState('')
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(10)

    const [showAddModal, setShowAddModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const [initialLoading, setInitialLoading] = useState(true)
    const [isFetching, setIsFetching] = useState(false)

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        password: '',
        tipoUsuarioId: '',
    })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        Promise.all([
            fetchMunicipios(),
            fetchRoles(),
            fetchUsuarios({ municipioId: munId, page: 0, size: pageSize }),
        ]).finally(() => setInitialLoading(false))
    }, [])

    const municipio = municipios.find((m) => m.id === munId)
    const usuariosPagination = pagination.usuarios || { page: 0, size: pageSize, totalElements: 0, totalPages: 0 }

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedNome(nomeTerm)
            setDebouncedEmail(emailTerm)
        }, 400)
        return () => clearTimeout(timer)
    }, [nomeTerm, emailTerm])

    useEffect(() => {
        setCurrentPage(0)
    }, [debouncedNome, debouncedEmail, ativoFilter, pageSize, munId])

    const refetchUsuarios = async (page = currentPage, overrides?: { nome?: string; email?: string; ativo?: string }) => {
        const nomeParam = overrides?.nome !== undefined ? overrides.nome : debouncedNome
        const emailParam = overrides?.email !== undefined ? overrides.email : debouncedEmail
        const ativoParam = overrides?.ativo !== undefined ? overrides.ativo : ativoFilter

        setIsFetching(true)
        try {
            return await fetchUsuarios({
                municipioId: munId,
                page,
                size: pageSize,
                nome: nomeParam || undefined,
                email: emailParam || undefined,
                ativo: ativoParam === '' ? undefined : ativoParam,
            })
        } finally {
            setIsFetching(false)
        }
    }

    useEffect(() => {
        if (!initialLoading) refetchUsuarios()
    }, [munId, currentPage, debouncedNome, debouncedEmail, ativoFilter, pageSize])

    const importLastCompletedAt = useUsuarioImportJobStore(s => s.lastCompletedAt)
    useEffect(() => {
        if (importLastCompletedAt && !initialLoading) {
            refetchUsuarios()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [importLastCompletedAt])

    const tipoUsuarioBadge = (tipo: string) => {
        switch (tipo) {
            case 'ADMIN': case 'SUPERADMIN': return 'bg-danger'
            case 'GESTOR': return 'bg-info'
            default: return 'bg-secondary'
        }
    }

    const isSuperAdminRole = (role: { nome?: string; descricao?: string }) => {
        const normalized = `${role.nome || ''} ${role.descricao || ''}`.toUpperCase()
        return normalized.includes('SUPERADMIN')
    }

    const availableRolesForCreate = isSuperAdmin ? roles : roles.filter((role) => !isSuperAdminRole(role))

    const validateForm = (isAdd: boolean) => {
        const errors: Record<string, string> = {}
        if (!formData.nome || formData.nome.length < 3) errors.nome = 'Nome deve ter no mínimo 3 caracteres'
        if (!formData.email || !formData.email.includes('@')) errors.email = 'Email inválido'
        if (isAdd && (!formData.password || formData.password.length < 6)) errors.password = 'Senha deve ter no mínimo 6 caracteres'
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleOpenAddModal = () => {
        setFormData({ nome: '', email: '', password: '', tipoUsuarioId: '' })
        setFormErrors({})
        setShowAddModal(true)
    }

    const handleOpenEditModal = (usuario: Usuario) => {
        setSelectedUsuario(usuario)
        setFormData({
            nome: usuario.nome,
            email: usuario.email,
            password: '',
            tipoUsuarioId: '',
        })
        setFormErrors({})
        setShowEditModal(true)
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm(true)) return

        const selectedRole = formData.tipoUsuarioId
            ? roles.find((role) => role.id === Number(formData.tipoUsuarioId))
            : undefined

        if (!isSuperAdmin && selectedRole && isSuperAdminRole(selectedRole)) {
            setFormErrors((prev) => ({
                ...prev,
                tipoUsuarioId: 'Somente SUPERADMIN pode cadastrar usuário SUPERADMIN'
            }))
            return
        }

        setIsLoading(true)
        try {
            await addUsuario({
                nome: formData.nome,
                email: formData.email,
                password: formData.password,
                tipoUsuarioId: formData.tipoUsuarioId ? Number(formData.tipoUsuarioId) : undefined,
                municipioId: munId,
            })
            await refetchUsuarios()
            setShowAddModal(false)
        } catch (error) { console.error('Erro:', error) }
        finally { setIsLoading(false) }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm(false) || !selectedUsuario) return
        setIsLoading(true)
        try {
            await updateUsuario(selectedUsuario.id, {
                nome: formData.nome,
                email: formData.email,
            })
            await refetchUsuarios()
            setShowEditModal(false)
            setSelectedUsuario(null)
        } catch (error) { console.error('Erro:', error) }
        finally { setIsLoading(false) }
    }

    const handleConfirmDelete = async () => {
        if (!selectedUsuario) return
        setIsLoading(true)
        try {
            await deleteUsuario(selectedUsuario.id)
            await refetchUsuarios()
            setShowDeleteModal(false)
            setSelectedUsuario(null)
        } catch (error) { console.error('Erro:', error) }
        finally { setIsLoading(false) }
    }

    if (initialLoading) return <PageLoading />

    if (!municipio) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ height: '50vh' }}>
                <div className="text-center">
                    <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: 48 }}></i>
                    <p className="text-muted mt-3">Município não encontrado</p>
                </div>
            </div>
        )
    }

    const usuariosAtivos = usuarios.filter(u => u.ativo).length

    return (
        <div className="animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/municipio/${municipioId}/dashboard`)}>
                            <i className="bi bi-arrow-left"></i>
                        </button>
                        <h1 className="h3 fw-bold text-dark mb-0">Usuários</h1>
                    </div>
                    <p className="text-muted mb-0">{municipio.nome} - {municipio.uf}</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={() => setShowImportModal(true)}>
                        <i className="bi bi-file-earmark-excel"></i>Importar Usuários
                    </button>
                    <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
                        <i className="bi bi-plus-lg"></i>Novo Usuário
                    </button>
                </div>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                    <div className="card border-0 shadow-sm bg-primary text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-people" style={{ fontSize: 32 }}></i>
                                <div>
                                    <p className="h3 fw-bold mb-0">{usuariosPagination.totalElements}</p>
                                    <p className="small mb-0 opacity-75">Total</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm bg-success text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-check-circle" style={{ fontSize: 32 }}></i>
                                <div>
                                    <p className="h3 fw-bold mb-0">{usuariosAtivos}</p>
                                    <p className="small mb-0 opacity-75">Ativos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body py-3">
                    <div className="row gy-3 gx-3 align-items-end">
                        <div className="col-12 col-lg-5">
                            <label className="form-label text-muted small mb-1">Nome</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                                <input type="text" className="form-control border-start-0 rounded-start-0" placeholder="Buscar por nome..." value={nomeTerm} onChange={(e) => setNomeTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="col-12 col-lg-3">
                            <label className="form-label text-muted small mb-1">Email</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0"><i className="bi bi-envelope text-muted"></i></span>
                                <input type="text" className="form-control border-start-0 rounded-start-0" placeholder="Buscar por email..." value={emailTerm} onChange={(e) => setEmailTerm(e.target.value)} />
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
                        <div className="col-12 col-lg-2">
                            <label className="form-label text-muted small mb-1">&nbsp;</label>
                            <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                                <button className="btn btn-primary" onClick={() => { setCurrentPage(0); setDebouncedNome(nomeTerm); setDebouncedEmail(emailTerm); refetchUsuarios(0, { nome: nomeTerm, email: emailTerm, ativo: ativoFilter }) }}>
                                    <i className="bi bi-search me-1"></i>Aplicar
                                </button>
                                <button className="btn btn-outline-secondary" onClick={() => {
                                    setNomeTerm('')
                                    setEmailTerm('')
                                    setDebouncedNome('')
                                    setDebouncedEmail('')
                                    setAtivoFilter('')
                                    setCurrentPage(0)
                                    refetchUsuarios(0, { nome: '', email: '', ativo: '' })
                                }}>
                                    <i className="bi bi-arrow-counterclockwise"></i> Limpar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            {usuarios.length > 0 ? (
                <TableLoading isLoading={isFetching}>
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="border-0">Usuário</th>
                                        <th className="border-0">Tipo</th>
                                        <th className="border-0">Status</th>
                                        <th className="border-0 text-end">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.map((usuario) => (
                                        <tr key={usuario.id}>
                                            <td className="align-middle">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary" style={{ width: 40, height: 40, fontSize: 14 }}>
                                                        {usuario.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="fw-medium mb-0">{usuario.nome}</p>
                                                        <p className="text-muted small mb-0">{usuario.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="align-middle">
                                                <span className={`badge ${tipoUsuarioBadge(usuario.tipoUsuario)}`}>{usuario.tipoUsuario}</span>
                                            </td>
                                            <td className="align-middle">
                                                <span className={`badge ${usuario.ativo ? 'bg-success' : 'bg-secondary'}`}>{usuario.ativo ? 'ativo' : 'inativo'}</span>
                                            </td>
                                            <td className="align-middle text-end">
                                                <div className="btn-group btn-group-sm">
                                                    <button className="btn btn-outline-primary" onClick={() => handleOpenEditModal(usuario)} title="Editar"><i className="bi bi-pencil"></i></button>
                                                    <button className="btn btn-outline-danger" onClick={() => { setSelectedUsuario(usuario); setShowDeleteModal(true) }} title="Excluir"><i className="bi bi-trash"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {usuariosPagination.totalPages > 0 && (
                        <div className="card-footer bg-white border-top">
                            <Pagination
                                currentPage={currentPage}
                                pageSize={pageSize}
                                totalElements={usuariosPagination.totalElements}
                                totalPages={usuariosPagination.totalPages}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(size) => { setCurrentPage(0); setPageSize(size) }}
                                label="usuários"
                                isLoading={isLoading}
                            />
                        </div>
                    )}
                </div>
                </TableLoading>
            ) : (
                <div className="text-center py-5">
                    <i className="bi bi-inbox text-muted" style={{ fontSize: 48 }}></i>
                    <p className="text-muted mt-3">Nenhum usuário encontrado</p>
                    <button className="btn btn-primary mt-2" onClick={handleOpenAddModal}>
                        <i className="bi bi-plus-lg me-2"></i>Cadastrar Usuário
                    </button>
                </div>
            )}

            {/* Modal Novo Usuário */}
            {showAddModal && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title"><i className="bi bi-person-plus me-2"></i>Novo Usuário</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
                    </div>
                    <form onSubmit={handleAddSubmit}><div className="modal-body p-4"><div className="row g-4">
                        <div className="col-12">
                            <label className="form-label fw-medium">Nome Completo <span className="text-danger">*</span></label>
                            <input type="text" className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`} placeholder="Digite o nome completo" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                            {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-medium">Email <span className="text-danger">*</span></label>
                            <input type="email" className={`form-control ${formErrors.email ? 'is-invalid' : ''}`} placeholder="email@exemplo.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-medium">Senha <span className="text-danger">*</span></label>
                            <input type="password" className={`form-control ${formErrors.password ? 'is-invalid' : ''}`} placeholder="Mínimo 6 caracteres" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                            {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-medium">Tipo de Usuário</label>
                            <select
                                className={`form-select ${formErrors.tipoUsuarioId ? 'is-invalid' : ''}`}
                                value={formData.tipoUsuarioId}
                                onChange={(e) => {
                                    setFormData({ ...formData, tipoUsuarioId: e.target.value })
                                    setFormErrors((prev) => ({ ...prev, tipoUsuarioId: '' }))
                                }}
                            >
                                <option value="">Selecione</option>
                                {availableRolesForCreate.map(role => <option key={role.id} value={role.id}>{role.descricaoPtBr || role.descricao || role.nome}</option>)}
                            </select>
                            {formErrors.tipoUsuarioId && <div className="invalid-feedback">{formErrors.tipoUsuarioId}</div>}
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
            {showEditModal && selectedUsuario && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title"><i className="bi bi-pencil me-2"></i>Editar Usuário</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => { setShowEditModal(false); setSelectedUsuario(null) }}></button>
                    </div>
                    <form onSubmit={handleEditSubmit}><div className="modal-body p-4"><div className="row g-4">
                        <div className="col-12">
                            <label className="form-label fw-medium">Nome Completo <span className="text-danger">*</span></label>
                            <input type="text" className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`} value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                            {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-medium">Email <span className="text-danger">*</span></label>
                            <input type="email" className={`form-control ${formErrors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                        </div>
                    </div></div>
                        <div className="modal-footer bg-light">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowEditModal(false); setSelectedUsuario(null) }}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Salvar</>}
                            </button>
                        </div></form>
                </div></div></div><div className="modal-backdrop fade show"></div></>
            )}

            {/* Modal Excluir */}
            {showDeleteModal && selectedUsuario && (
                <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered"><div className="modal-content border-0 shadow">
                    <div className="modal-header bg-danger text-white">
                        <h5 className="modal-title"><i className="bi bi-exclamation-triangle me-2"></i>Confirmar Exclusão</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => { setShowDeleteModal(false); setSelectedUsuario(null) }}></button>
                    </div>
                    <div className="modal-body p-4 text-center">
                        <div className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-4" style={{ width: 80, height: 80 }}>
                            <i className="bi bi-trash text-danger" style={{ fontSize: 36 }}></i>
                        </div>
                        <h5 className="mb-2">Excluir "{selectedUsuario.nome}"?</h5>
                        <p className="text-muted mb-0">Esta ação não pode ser desfeita. O usuário perderá acesso ao sistema.</p>
                    </div>
                    <div className="modal-footer bg-light justify-content-center">
                        <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setShowDeleteModal(false); setSelectedUsuario(null) }}>Cancelar</button>
                        <button type="button" className="btn btn-danger px-4" onClick={handleConfirmDelete} disabled={isLoading}>
                            {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Excluindo...</> : <><i className="bi bi-trash me-2"></i>Sim, Excluir</>}
                        </button>
                    </div>
                </div></div></div><div className="modal-backdrop fade show"></div></>
            )}

            <UsuarioImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
        </div>
    )
}
