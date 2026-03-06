import { useState, useEffect } from 'react'
import { useDataStore, useAuthStore } from '@/stores'
import { Pagination } from '@/components/ui'
import { usuariosApi } from '@/services/api'
import type { Usuario, Role } from '@/types'

export function UsuariosPage() {
    const {
        usuarios,
        municipios,
        roles,
        pagination,
        fetchUsuarios,
        fetchMunicipios,
        fetchRoles,
        addUsuario,
        updateUsuario,
        deleteUsuario,
        addRole,
        updateRole,
        deleteRole
    } = useDataStore()
    const { accessToken, user } = useAuthStore()
    const isSuperAdmin = user?.role === 'SUPERADMIN'

    const [nomeTerm, setNomeTerm] = useState('')
    const [debouncedNome, setDebouncedNome] = useState('')
    const [emailTerm, setEmailTerm] = useState('')
    const [debouncedEmail, setDebouncedEmail] = useState('')
    const [ativoFilter, setAtivoFilter] = useState('')
    const [municipioFilter, setMunicipioFilter] = useState('')
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [activeTab, setActiveTab] = useState<'usuarios' | 'papeis'>('usuarios')

    const [showModal, setShowModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [roleSearch, setRoleSearch] = useState('')
    const [debouncedRoleSearch, setDebouncedRoleSearch] = useState('')
    const [showRoleModal, setShowRoleModal] = useState(false)
    const [showRoleDeleteModal, setShowRoleDeleteModal] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [roleForm, setRoleForm] = useState({ descricao: '' })
    const [roleErrors, setRoleErrors] = useState<Record<string, string>>({})
    const [isRoleLoading, setIsRoleLoading] = useState(false)
    const [rolePage, setRolePage] = useState(0)
    const [rolePageSize, setRolePageSize] = useState(10)

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        tipoUsuarioId: '',
        municipioId: '',
        password: '',
    })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        fetchMunicipios()
    }, [fetchMunicipios])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedNome(nomeTerm)
            setDebouncedEmail(emailTerm)
        }, 400)
        return () => clearTimeout(timer)
    }, [nomeTerm, emailTerm])

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedRoleSearch(roleSearch), 400)
        return () => clearTimeout(timer)
    }, [roleSearch])

    useEffect(() => {
        setCurrentPage(0)
    }, [debouncedNome, debouncedEmail, ativoFilter, municipioFilter, pageSize])

    const usuariosPagination = pagination.usuarios || { page: 0, size: pageSize, totalElements: 0, totalPages: 0 }

    const refetchUsuarios = (page = currentPage, overrides?: { nome?: string; email?: string; ativo?: string; municipio?: string }) => {
        const nomeParam = overrides?.nome !== undefined ? overrides.nome : debouncedNome
        const emailParam = overrides?.email !== undefined ? overrides.email : debouncedEmail
        const ativoParam = overrides?.ativo !== undefined ? overrides.ativo : ativoFilter
        const municipioParam = overrides?.municipio !== undefined ? overrides.municipio : municipioFilter

        return fetchUsuarios({
            page,
            size: pageSize,
            nome: nomeParam || undefined,
            email: emailParam || undefined,
            ativo: ativoParam === '' ? undefined : ativoParam,
            municipioId: municipioParam ? Number(municipioParam) : undefined,
        })
    }

    useEffect(() => {
        refetchUsuarios()
    }, [currentPage, debouncedNome, debouncedEmail, ativoFilter, municipioFilter, pageSize])

    const rolesPagination = pagination.roles || { page: 0, size: rolePageSize, totalElements: 0, totalPages: 0 }

    const refetchRoles = (page = rolePage, size = rolePageSize, search = debouncedRoleSearch) => {
        return fetchRoles({
            page,
            size,
            descricao: search || undefined
        })
    }

    useEffect(() => {
        setRolePage(0)
    }, [debouncedRoleSearch, rolePageSize])

    useEffect(() => {
        refetchRoles(rolePage, rolePageSize, debouncedRoleSearch)
    }, [rolePage, debouncedRoleSearch, rolePageSize])

    const getMunicipioNome = (municipioId?: number) => {
        if (!municipioId) return '-'
        return municipios.find(m => m.id === municipioId)?.nome || '-'
    }

    const getTipoBadge = (tipo: string) => {
        const badges: Record<string, string> = {
            'ADMIN': 'bg-danger',
            'SUPERADMIN': 'bg-danger',
            'GESTOR': 'bg-primary',
        }
        return badges[tipo] || 'bg-secondary'
    }

    const resetForm = () => {
        setFormData({ nome: '', email: '', tipoUsuarioId: '', municipioId: '', password: '' })
        setFormErrors({})
    }

    const handleOpenModal = () => { resetForm(); setShowModal(true) }
    const handleCloseModal = () => { setShowModal(false); resetForm() }

    const handleOpenEditModal = (usuario: Usuario) => {
        setSelectedUsuario(usuario)
        // Try to find the role ID that matches the user's role string
        const matchingRole = roles.find(r => r.nome === usuario.tipoUsuario || r.descricao === usuario.tipoUsuario)

        setFormData({
            nome: usuario.nome,
            email: usuario.email,
            tipoUsuarioId: matchingRole ? String(matchingRole.id) : '',
            municipioId: usuario.municipioId ? String(usuario.municipioId) : '',
            password: '',
        })
        setFormErrors({})
        setShowEditModal(true)
    }

    const handleOpenDeleteModal = (usuario: Usuario) => {
        setSelectedUsuario(usuario)
        setShowDeleteModal(true)
    }

    const validateForm = () => {
        const errors: Record<string, string> = {}
        if (!formData.nome || formData.nome.length < 3) errors.nome = 'Nome deve ter no mínimo 3 caracteres'
        if (!formData.email || !formData.email.includes('@')) errors.email = 'Email inválido'
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        try {
            await addUsuario({
                nome: formData.nome,
                email: formData.email,
                tipoUsuarioId: formData.tipoUsuarioId ? Number(formData.tipoUsuarioId) : undefined,
                municipioId: formData.municipioId ? Number(formData.municipioId) : undefined,
                password: formData.password || undefined,
            })
            await refetchUsuarios()
            handleCloseModal()
        } catch (error) {
            console.error('Erro ao criar usuário:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm() || !selectedUsuario) return

        setIsLoading(true)
        try {
            await updateUsuario(selectedUsuario.id, {
                nome: formData.nome,
                email: formData.email,
                tipoUsuarioId: formData.tipoUsuarioId ? Number(formData.tipoUsuarioId) : undefined,
                municipioId: formData.municipioId ? Number(formData.municipioId) : undefined,
            })
            await refetchUsuarios()
            setShowEditModal(false)
            setSelectedUsuario(null)
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!selectedUsuario) return
        setIsLoading(true)
        try {
            await deleteUsuario(selectedUsuario.id)
            await refetchUsuarios()
            setShowDeleteModal(false)
            setSelectedUsuario(null)
        } catch (error) {
            console.error('Erro ao excluir usuário:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleAtivo = async (usuario: Usuario) => {
        try {
            if (usuario.ativo) {
                await usuariosApi.inativar(usuario.id, accessToken)
            } else {
                await usuariosApi.ativar(usuario.id, accessToken)
            }
            await refetchUsuarios()
        } catch (error) {
            console.error('Erro ao alterar status:', error)
        }
    }

    const validateRoleForm = () => {
        const errors: Record<string, string> = {}
        if (!roleForm.descricao || roleForm.descricao.trim().length < 3) errors.descricao = 'Descrição deve ter no mínimo 3 caracteres'
        setRoleErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleOpenRoleModal = () => {
        setSelectedRole(null)
        setRoleForm({ descricao: '' })
        setRoleErrors({})
        setShowRoleModal(true)
    }

    const handleOpenRoleEdit = (role: Role) => {
        setSelectedRole(role)
        setRoleForm({ descricao: role.descricao || role.nome })
        setRoleErrors({})
        setShowRoleModal(true)
    }

    const handleRoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateRoleForm()) return
        setIsRoleLoading(true)
        try {
            if (selectedRole) {
                await updateRole(selectedRole.id, { descricao: roleForm.descricao })
            } else {
                await addRole({ descricao: roleForm.descricao })
            }
            await fetchRoles({ descricao: debouncedRoleSearch || undefined })
            setShowRoleModal(false)
            setSelectedRole(null)
        } catch (error) {
            console.error('Erro ao salvar papel:', error)
        } finally {
            setIsRoleLoading(false)
        }
    }

    const handleOpenRoleDeleteModal = (role: Role) => {
        setSelectedRole(role)
        setShowRoleDeleteModal(true)
    }

    const handleConfirmRoleDelete = async () => {
        if (!selectedRole) return
        setIsRoleLoading(true)
        try {
            await deleteRole(selectedRole.id)
            await fetchRoles({ descricao: debouncedRoleSearch || undefined })
            setShowRoleDeleteModal(false)
            setSelectedRole(null)
        } catch (error) {
            console.error('Erro ao excluir papel:', error)
        } finally {
            setIsRoleLoading(false)
        }
    }

    const totalUsuarios = usuariosPagination.totalElements
    const usuariosAtivos = usuarios.filter(u => u.ativo).length

    return (
        <div className="animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h1 className="h3 fw-bold text-dark mb-1">{activeTab === 'usuarios' ? 'Usuários' : 'Papéis'}</h1>
                    <p className="text-muted mb-0">{activeTab === 'usuarios' ? 'Gerencie os usuários do sistema' : 'Gerencie os papéis e permissões'}</p>
                </div>
                {activeTab === 'usuarios' ? (
                    <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenModal}>
                        <i className="bi bi-plus-lg"></i>Novo Usuário
                    </button>
                ) : (
                    <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenRoleModal}>
                        <i className="bi bi-plus-lg"></i>Novo Papel
                    </button>
                )}
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => setActiveTab('usuarios')}>Usuários</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'papeis' ? 'active' : ''}`} onClick={() => setActiveTab('papeis')}>Papéis</button>
                </li>
            </ul>

            {activeTab === 'usuarios' ? (
                <>
                    {/* Stats */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <div className="card border-0 shadow-sm bg-primary text-white">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <i className="bi bi-people" style={{ fontSize: 28 }}></i>
                                        <div>
                                            <p className="h4 fw-bold mb-0">{totalUsuarios}</p>
                                            <p className="small mb-0 opacity-75">Total</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-md-6">
                            <div className="card border-0 shadow-sm bg-success text-white">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <i className="bi bi-check-circle" style={{ fontSize: 28 }}></i>
                                        <div>
                                            <p className="h4 fw-bold mb-0">{usuariosAtivos}</p>
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
                                <div className="col-6 col-lg-2">
                                    <label className="form-label text-muted small mb-1">Município</label>
                                    <select className="form-select" value={municipioFilter} onChange={(e) => setMunicipioFilter(e.target.value)}>
                                        <option value="">Todos</option>
                                        {municipios.map(m => (
                                            <option key={m.id} value={m.id}>{m.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 d-flex justify-content-end">
                                    <label className="form-label text-muted small mb-1">&nbsp;</label>
                                    <div className="d-flex justify-content-end gap-2">
                                        <button className="btn btn-primary" onClick={() => { setCurrentPage(0); setDebouncedNome(nomeTerm); setDebouncedEmail(emailTerm); refetchUsuarios(0, { nome: nomeTerm, email: emailTerm, ativo: ativoFilter, municipio: municipioFilter }) }}>
                                            <i className="bi bi-search me-1"></i>Aplicar
                                        </button>
                                        <button className="btn btn-outline-secondary" onClick={() => {
                                            setNomeTerm('')
                                            setEmailTerm('')
                                            setDebouncedNome('')
                                            setDebouncedEmail('')
                                            setAtivoFilter('')
                                            setMunicipioFilter('')
                                            setCurrentPage(0)
                                            refetchUsuarios(0, { nome: '', email: '', ativo: '', municipio: '' })
                                        }}>
                                            <i className="bi bi-arrow-counterclockwise"></i> Limpar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="border-0">Usuário</th>
                                            <th className="border-0">Tipo</th>
                                            <th className="border-0">Município</th>
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
                                                    <span className={`badge ${getTipoBadge(usuario.tipoUsuario)}`}>{usuario.tipoUsuario}</span>
                                                </td>
                                                <td className="align-middle">{usuario.municipio || getMunicipioNome(usuario.municipioId)}</td>
                                                <td className="align-middle">
                                                    {isSuperAdmin ? (
                                                        <div className="form-check form-switch mb-0">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                role="switch"
                                                                checked={usuario.ativo}
                                                                onChange={() => handleToggleAtivo(usuario)}
                                                                title={usuario.ativo ? 'Inativar' : 'Ativar'}
                                                            />
                                                            <label className={`form-check-label small ${usuario.ativo ? 'text-success' : 'text-muted'}`}>
                                                                {usuario.ativo ? 'ativo' : 'inativo'}
                                                            </label>
                                                        </div>
                                                    ) : (
                                                        <span className={`badge ${usuario.ativo ? 'bg-success' : 'bg-secondary'}`}>
                                                            {usuario.ativo ? 'ativo' : 'inativo'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="align-middle text-end">
                                                    <div className="btn-group btn-group-sm">
                                                        <button className="btn btn-outline-primary" onClick={() => handleOpenEditModal(usuario)}><i className="bi bi-pencil"></i></button>
                                                        <button className="btn btn-outline-danger" onClick={() => handleOpenDeleteModal(usuario)}><i className="bi bi-trash"></i></button>
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

                    {usuarios.length === 0 && (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox text-muted" style={{ fontSize: 48 }}></i>
                            <p className="text-muted mt-3">Nenhum usuário encontrado</p>
                        </div>
                    )}

                    {/* Modal Novo Usuário */}
                    {showModal && (
                        <>
                            <div className="modal fade show d-block" tabIndex={-1}>
                                <div className="modal-dialog modal-dialog-centered modal-lg">
                                    <div className="modal-content border-0 shadow">
                                        <div className="modal-header bg-primary text-white">
                                            <h5 className="modal-title"><i className="bi bi-person-plus me-2"></i>Novo Usuário</h5>
                                            <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
                                        </div>
                                        <form onSubmit={handleSubmit}>
                                            <div className="modal-body p-4">
                                                <div className="row g-4">
                                                    <div className="col-12">
                                                        <label className="form-label fw-medium">Nome <span className="text-danger">*</span></label>
                                                        <input type="text" className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`} value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                                                        {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Email <span className="text-danger">*</span></label>
                                                        <input type="email" className={`form-control ${formErrors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                                        {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Senha</label>
                                                        <input type="password" className="form-control" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Tipo de Usuário</label>
                                                        <select className="form-select" value={formData.tipoUsuarioId} onChange={(e) => setFormData({ ...formData, tipoUsuarioId: e.target.value })}>
                                                            <option value="">Selecione</option>
                                                            {roles.map(r => (
                                                                <option key={r.id} value={r.id}>{r.descricao || r.nome}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Município</label>
                                                        <select className="form-select" value={formData.municipioId} onChange={(e) => setFormData({ ...formData, municipioId: e.target.value })}>
                                                            <option value="">Nenhum</option>
                                                            {municipios.map(m => (
                                                                <option key={m.id} value={m.id}>{m.nome}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="modal-footer bg-light">
                                                <button type="button" className="btn btn-outline-secondary" onClick={handleCloseModal}>Cancelar</button>
                                                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                                    {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Cadastrar</>}
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
                    {showEditModal && selectedUsuario && (
                        <>
                            <div className="modal fade show d-block" tabIndex={-1}>
                                <div className="modal-dialog modal-dialog-centered modal-lg">
                                    <div className="modal-content border-0 shadow">
                                        <div className="modal-header bg-primary text-white">
                                            <h5 className="modal-title"><i className="bi bi-pencil me-2"></i>Editar Usuário</h5>
                                            <button type="button" className="btn-close btn-close-white" onClick={() => { setShowEditModal(false); setSelectedUsuario(null) }}></button>
                                        </div>
                                        <form onSubmit={handleEditSubmit}>
                                            <div className="modal-body p-4">
                                                <div className="row g-4">
                                                    <div className="col-12">
                                                        <label className="form-label fw-medium">Nome <span className="text-danger">*</span></label>
                                                        <input type="text" className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`} value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                                                        {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Email <span className="text-danger">*</span></label>
                                                        <input type="email" className={`form-control ${formErrors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                                        {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Tipo de Usuário</label>
                                                        <select className="form-select" value={formData.tipoUsuarioId} onChange={(e) => setFormData({ ...formData, tipoUsuarioId: e.target.value })}>
                                                            <option value="">Selecione</option>
                                                            {roles.map(r => (
                                                                <option key={r.id} value={r.id}>{r.descricao || r.nome}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-medium">Município</label>
                                                        <select className="form-select" value={formData.municipioId} onChange={(e) => setFormData({ ...formData, municipioId: e.target.value })}>
                                                            <option value="">Nenhum</option>
                                                            {municipios.map(m => (
                                                                <option key={m.id} value={m.id}>{m.nome}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="modal-footer bg-light">
                                                <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowEditModal(false); setSelectedUsuario(null) }}>Cancelar</button>
                                                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                                    {isLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Salvar</>}
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
                    {showDeleteModal && selectedUsuario && (
                        <>
                            <div className="modal fade show d-block" tabIndex={-1}>
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content border-0 shadow">
                                        <div className="modal-header bg-danger text-white">
                                            <h5 className="modal-title"><i className="bi bi-exclamation-triangle me-2"></i>Confirmar Exclusão</h5>
                                            <button type="button" className="btn-close btn-close-white" onClick={() => { setShowDeleteModal(false); setSelectedUsuario(null) }}></button>
                                        </div>
                                        <div className="modal-body p-4 text-center">
                                            <div className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-4" style={{ width: 80, height: 80 }}>
                                                <i className="bi bi-trash text-danger" style={{ fontSize: 36 }}></i>
                                            </div>
                                            <h5 className="mb-2">Excluir "{selectedUsuario.nome}"?</h5>
                                            <p className="text-muted mb-0">Esta ação não pode ser desfeita.</p>
                                        </div>
                                        <div className="modal-footer bg-light justify-content-center">
                                            <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setShowDeleteModal(false); setSelectedUsuario(null) }}>Cancelar</button>
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
                </>
            ) : (
                <>
                    {/* Filters for Roles */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body py-3">
                            <div className="row gy-3 gx-3 align-items-end">
                                <div className="col-12 col-lg-8">
                                    <label className="form-label text-muted small mb-1">Descrição</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white border-end-0">
                                            <i className="bi bi-search text-muted"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0 rounded-start-0"
                                            placeholder="Buscar por descrição ou nome..."
                                            value={roleSearch}
                                            onChange={(e) => setRoleSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-12 col-lg-4">
                                    <div className="d-flex justify-content-end gap-2">
                                        <button
                                            className="btn btn-primary d-flex align-items-center gap-2"
                                            onClick={() => { setDebouncedRoleSearch(roleSearch); fetchRoles({ descricao: roleSearch || undefined }) }}
                                        >
                                            <i className="bi bi-search"></i>Aplicar
                                        </button>
                                        <button
                                            className="btn btn-outline-secondary d-flex align-items-center gap-2"
                                            onClick={() => { setRoleSearch(''); setDebouncedRoleSearch(''); fetchRoles({ descricao: undefined }) }}
                                        >
                                            <i className="bi bi-arrow-counterclockwise"></i>Limpar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="border-0 ps-4">Papel / Descrição</th>
                                            <th className="border-0 text-end pe-4">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roles.map((role) => (
                                            <tr key={role.id}>
                                                <td className="align-middle ps-4">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="d-flex align-items-center justify-content-center rounded-circle bg-info bg-opacity-10 text-info" style={{ width: 40, height: 40, fontSize: 18 }}>
                                                            <i className="bi bi-shield-check"></i>
                                                        </div>
                                                        <div>
                                                            <p className="fw-medium mb-0">{role.descricao || role.nome}</p>
                                                            <p className="text-muted small mb-0">ID: #{role.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="align-middle text-end pe-4">
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            className="btn btn-outline-primary"
                                                            onClick={() => handleOpenRoleEdit(role)}
                                                            title="Editar Papel"
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-danger"
                                                            onClick={() => handleOpenRoleDeleteModal(role)}
                                                            title="Excluir Papel"
                                                        >
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
                        <div className="card-footer bg-white border-top py-3">
                            <Pagination
                                currentPage={rolePage}
                                pageSize={rolePageSize}
                                totalElements={rolesPagination.totalElements}
                                totalPages={rolesPagination.totalPages}
                                onPageChange={setRolePage}
                                onPageSizeChange={setRolePageSize}
                                label="papéis"
                                isLoading={isRoleLoading}
                            />
                        </div>
                    </div>

                    {roles.length === 0 && (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox text-muted" style={{ fontSize: 48 }}></i>
                            <p className="text-muted mt-3">Nenhum papel cadastrado</p>
                        </div>
                    )}

                    {showRoleModal && (
                        <>
                            <div className="modal fade show d-block" tabIndex={-1}>
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content border-0 shadow">
                                        <div className="modal-header bg-primary text-white">
                                            <h5 className="modal-title"><i className="bi bi-shield-lock me-2"></i>{selectedRole ? 'Editar Papel' : 'Novo Papel'}</h5>
                                            <button type="button" className="btn-close btn-close-white" onClick={() => { setShowRoleModal(false); setSelectedRole(null) }}></button>
                                        </div>
                                        <form onSubmit={handleRoleSubmit}>
                                            <div className="modal-body p-4">
                                                <label className="form-label fw-medium">Descrição <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${roleErrors.descricao ? 'is-invalid' : ''}`}
                                                    value={roleForm.descricao}
                                                    onChange={(e) => setRoleForm({ descricao: e.target.value })}
                                                />
                                                {roleErrors.descricao && <div className="invalid-feedback">{roleErrors.descricao}</div>}
                                            </div>
                                            <div className="modal-footer bg-light">
                                                <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowRoleModal(false); setSelectedRole(null) }}>Cancelar</button>
                                                <button type="submit" className="btn btn-primary" disabled={isRoleLoading}>
                                                    {isRoleLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : <><i className="bi bi-check-lg me-2"></i>Salvar</>}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-backdrop fade show"></div>
                        </>
                    )}

                    {showRoleDeleteModal && selectedRole && (
                        <>
                            <div className="modal fade show d-block" tabIndex={-1}>
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content border-0 shadow">
                                        <div className="modal-header bg-danger text-white">
                                            <h5 className="modal-title"><i className="bi bi-exclamation-triangle me-2"></i>Confirmar Exclusão</h5>
                                            <button type="button" className="btn-close btn-close-white" onClick={() => { setShowRoleDeleteModal(false); setSelectedRole(null) }}></button>
                                        </div>
                                        <div className="modal-body p-4 text-center">
                                            <div className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-4" style={{ width: 80, height: 80 }}>
                                                <i className="bi bi-trash text-danger" style={{ fontSize: 36 }}></i>
                                            </div>
                                            <h5 className="mb-2">Excluir "{selectedRole.descricao || selectedRole.nome}"?</h5>
                                            <p className="text-muted mb-0">Esta ação não pode ser desfeita.</p>
                                        </div>
                                        <div className="modal-footer bg-light justify-content-center">
                                            <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setShowRoleDeleteModal(false); setSelectedRole(null) }}>Cancelar</button>
                                            <button type="button" className="btn btn-danger px-4" onClick={handleConfirmRoleDelete} disabled={isRoleLoading}>
                                                {isRoleLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Excluindo...</> : <><i className="bi bi-trash me-2"></i>Sim, Excluir</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-backdrop fade show"></div>
                        </>
                    )}
                </>
            )}
        </div>
    )
}
