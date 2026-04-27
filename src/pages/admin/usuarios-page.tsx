import { useState, useEffect } from 'react'
import { useDataStore, useAuthStore, useUsuarioImportJobStore } from '@/stores'
import { Pagination, PageLoading, TableLoading } from '@/components/ui'
import { UsuarioImportModal } from '@/components/usuario-import-modal'
import { usuariosApi } from '@/services/api'
import { toast } from 'sonner'
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
    const showMunicipioFilter = isSuperAdmin
    const isGestor = user?.role === 'GESTOR'

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
    const [showImportModal, setShowImportModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [roleSearch, setRoleSearch] = useState('')
    const [debouncedRoleSearch, setDebouncedRoleSearch] = useState('')
    const [showRoleModal, setShowRoleModal] = useState(false)
    const [showRoleDeleteModal, setShowRoleDeleteModal] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [roleForm, setRoleForm] = useState({ descricao: '', descricaoPtBr: '' })
    const [roleErrors, setRoleErrors] = useState<Record<string, string>>({})
    const [isRoleLoading, setIsRoleLoading] = useState(false)
    const [rolePage, setRolePage] = useState(0)
    const [rolePageSize, setRolePageSize] = useState(10)

    const [initialLoading, setInitialLoading] = useState(true)
    const [isFetching, setIsFetching] = useState(false)

    const [showPassword, setShowPassword] = useState(false)
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
    const [resetPasswordForm, setResetPasswordForm] = useState({ novaSenha: '', confirmarSenha: '' })
    const [resetPasswordErrors, setResetPasswordErrors] = useState<Record<string, string>>({})
    const [isResettingPassword, setIsResettingPassword] = useState(false)

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        tipoUsuarioId: '',
        municipioId: '',
        password: '',
    })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        Promise.all([fetchMunicipios(), fetchRoles(), fetchUsuarios({ page: 0, size: pageSize })]).finally(() => setInitialLoading(false))
    }, [])

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

    const refetchUsuarios = async (page = currentPage, overrides?: { nome?: string; email?: string; ativo?: string; municipio?: string }) => {
        const nomeParam = overrides?.nome !== undefined ? overrides.nome : debouncedNome
        const emailParam = overrides?.email !== undefined ? overrides.email : debouncedEmail
        const ativoParam = overrides?.ativo !== undefined ? overrides.ativo : ativoFilter
        const municipioParam = overrides?.municipio !== undefined ? overrides.municipio : municipioFilter

        setIsFetching(true)
        try {
            return await fetchUsuarios({
                page,
                size: pageSize,
                nome: nomeParam || undefined,
                email: emailParam || undefined,
                ativo: ativoParam === '' ? undefined : ativoParam,
                municipioId: showMunicipioFilter && municipioParam ? Number(municipioParam) : undefined,
            })
        } finally {
            setIsFetching(false)
        }
    }

    useEffect(() => {
        if (!initialLoading) refetchUsuarios()
    }, [currentPage, debouncedNome, debouncedEmail, ativoFilter, municipioFilter, pageSize])

    const importLastCompletedAt = useUsuarioImportJobStore(s => s.lastCompletedAt)
    useEffect(() => {
        if (importLastCompletedAt && !initialLoading) {
            refetchUsuarios()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [importLastCompletedAt])

    const rolesPagination = pagination.roles || { page: 0, size: rolePageSize, totalElements: 0, totalPages: 0 }

    const refetchRoles = async (page = rolePage, size = rolePageSize, search = debouncedRoleSearch) => {
        setIsFetching(true)
        try {
            return await fetchRoles({
                page,
                size,
                descricao: search || undefined
            })
        } finally {
            setIsFetching(false)
        }
    }

    useEffect(() => {
        setRolePage(0)
    }, [debouncedRoleSearch, rolePageSize])

    useEffect(() => {
        if (!initialLoading) refetchRoles(rolePage, rolePageSize, debouncedRoleSearch)
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

    const isSuperAdminRole = (role: Role) => {
        const normalized = `${role.nome || ''} ${role.descricao || ''}`.toUpperCase()
        return normalized.includes('SUPERADMIN')
    }

    const availableRolesForCreate = isSuperAdmin ? roles : roles.filter((role) => !isSuperAdminRole(role))

    const resetForm = () => {
        setFormData({ nome: '', email: '', tipoUsuarioId: '', municipioId: '', password: '' })
        setFormErrors({})
        setShowPassword(false)
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
                tipoUsuarioId: formData.tipoUsuarioId ? Number(formData.tipoUsuarioId) : undefined,
                municipioId: isSuperAdmin && formData.municipioId ? Number(formData.municipioId) : undefined,
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
                municipioId: isSuperAdmin && formData.municipioId ? Number(formData.municipioId) : undefined,
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

    const handleOpenResetPasswordModal = (usuario: Usuario) => {
        setSelectedUsuario(usuario)
        setResetPasswordForm({ novaSenha: '', confirmarSenha: '' })
        setResetPasswordErrors({})
        setShowResetPasswordModal(true)
    }

    const validateResetPasswordForm = () => {
        const errors: Record<string, string> = {}
        if (!resetPasswordForm.novaSenha || resetPasswordForm.novaSenha.length < 6) errors.novaSenha = 'Senha deve ter no mínimo 6 caracteres'
        if (resetPasswordForm.novaSenha !== resetPasswordForm.confirmarSenha) errors.confirmarSenha = 'As senhas não coincidem'
        setResetPasswordErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleResetPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateResetPasswordForm() || !selectedUsuario) return
        setIsResettingPassword(true)
        try {
            await usuariosApi.resetSenha(selectedUsuario.id, { novaSenha: resetPasswordForm.novaSenha }, accessToken)
            toast.success('Senha resetada com sucesso!')
            setShowResetPasswordModal(false)
            setSelectedUsuario(null)
        } catch (error: any) {
            toast.error(error.message || 'Erro ao resetar senha')
        } finally {
            setIsResettingPassword(false)
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
        setRoleForm({ descricao: '', descricaoPtBr: '' })
        setRoleErrors({})
        setShowRoleModal(true)
    }

    const handleOpenRoleEdit = (role: Role) => {
        setSelectedRole(role)
        setRoleForm({
            descricao: role.descricao || role.nome,
            descricaoPtBr: role.descricaoPtBr || '',
        })
        setRoleErrors({})
        setShowRoleModal(true)
    }

    const handleRoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateRoleForm()) return
        setIsRoleLoading(true)
        try {
            const payload = {
                descricao: roleForm.descricao,
                descricaoPtBr: roleForm.descricaoPtBr || undefined,
            }
            if (selectedRole) {
                await updateRole(selectedRole.id, payload)
            } else {
                await addRole(payload)
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

    if (initialLoading) return <PageLoading />

    return (
        <div className="animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h1 className="h3 fw-bold text-dark mb-1">{activeTab === 'usuarios' ? 'Usuários' : 'Perfis'}</h1>
                    <p className="text-muted mb-0">{activeTab === 'usuarios' ? 'Gerencie os usuários do sistema' : 'Gerencie os perfis e permissões'}</p>
                </div>
                {!isGestor && (activeTab === 'usuarios' ? (
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={() => setShowImportModal(true)}>
                            <i className="bi bi-file-earmark-excel"></i>Importar Usuários
                        </button>
                        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenModal}>
                            <i className="bi bi-plus-lg"></i>Novo Usuário
                        </button>
                    </div>
                ) : (
                    <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenRoleModal}>
                        <i className="bi bi-plus-lg"></i>Novo Perfil
                    </button>
                ))}
            </div>

            {!isGestor && (
                <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => setActiveTab('usuarios')}>Usuários</button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === 'papeis' ? 'active' : ''}`} onClick={() => setActiveTab('papeis')}>Perfis</button>
                    </li>
                </ul>
            )}

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
                                <div className={`col-12 ${showMunicipioFilter ? 'col-lg-5' : 'col-lg-6'}`}>
                                    <label className="form-label text-muted small mb-1">Nome</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                                        <input type="text" className="form-control border-start-0 rounded-start-0" placeholder="Buscar por nome..." value={nomeTerm} onChange={(e) => setNomeTerm(e.target.value)} />
                                    </div>
                                </div>
                                <div className={`col-12 ${showMunicipioFilter ? 'col-lg-3' : 'col-lg-4'}`}>
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
                                {showMunicipioFilter && (
                                    <div className="col-6 col-lg-2">
                                        <label className="form-label text-muted small mb-1">Município</label>
                                        <select className="form-select" value={municipioFilter} onChange={(e) => setMunicipioFilter(e.target.value)}>
                                            <option value="">Todos</option>
                                            {municipios.map(m => (
                                                <option key={m.id} value={m.id}>{m.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="col-12 d-flex justify-content-end">
                                    <label className="form-label text-muted small mb-1">&nbsp;</label>
                                    <div className="d-flex justify-content-end gap-2">
                                        <button className="btn btn-primary" onClick={() => { setCurrentPage(0); setDebouncedNome(nomeTerm); setDebouncedEmail(emailTerm); refetchUsuarios(0, { nome: nomeTerm, email: emailTerm, ativo: ativoFilter, municipio: showMunicipioFilter ? municipioFilter : '' }) }}>
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
                    <TableLoading isLoading={isFetching}>
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
                                            {!isGestor && <th className="border-0 text-end">Ações</th>}
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
                                                {!isGestor && (
                                                    <td className="align-middle text-end">
                                                        <div className="btn-group btn-group-sm">
                                                            <button className="btn btn-outline-primary" onClick={() => handleOpenEditModal(usuario)} title="Editar"><i className="bi bi-pencil"></i></button>
                                                            {isSuperAdmin && (
                                                                <button className="btn btn-outline-warning" onClick={() => handleOpenResetPasswordModal(usuario)} title="Resetar Senha"><i className="bi bi-key"></i></button>
                                                            )}
                                                            <button className="btn btn-outline-danger" onClick={() => handleOpenDeleteModal(usuario)} title="Excluir"><i className="bi bi-trash"></i></button>
                                                        </div>
                                                    </td>
                                                )}
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
                                                        <div className="input-group">
                                                            <input type={showPassword ? 'text' : 'password'} className="form-control" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                                                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                                            </button>
                                                        </div>
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
                                                            {availableRolesForCreate.map(r => (
                                                                <option key={r.id} value={r.id}>{r.descricaoPtBr || r.descricao || r.nome}</option>
                                                            ))}
                                                        </select>
                                                        {formErrors.tipoUsuarioId && <div className="invalid-feedback">{formErrors.tipoUsuarioId}</div>}
                                                    </div>
                                                    {isSuperAdmin && (
                                                        <div className="col-md-6">
                                                            <label className="form-label fw-medium">Município</label>
                                                            <select className="form-select" value={formData.municipioId} onChange={(e) => setFormData({ ...formData, municipioId: e.target.value })}>
                                                                <option value="">Nenhum</option>
                                                                {municipios.map(m => (
                                                                    <option key={m.id} value={m.id}>{m.nome}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
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
                                                                <option key={r.id} value={r.id}>{r.descricaoPtBr || r.descricao || r.nome}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    {isSuperAdmin && (
                                                        <div className="col-md-6">
                                                            <label className="form-label fw-medium">Município</label>
                                                            <select className="form-select" value={formData.municipioId} onChange={(e) => setFormData({ ...formData, municipioId: e.target.value })}>
                                                                <option value="">Nenhum</option>
                                                                {municipios.map(m => (
                                                                    <option key={m.id} value={m.id}>{m.nome}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
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

                    {/* Modal Resetar Senha */}
                    {showResetPasswordModal && selectedUsuario && (
                        <>
                            <div className="modal fade show d-block" tabIndex={-1}>
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content border-0 shadow">
                                        <div className="modal-header bg-warning text-dark">
                                            <h5 className="modal-title"><i className="bi bi-key me-2"></i>Resetar Senha</h5>
                                            <button type="button" className="btn-close" onClick={() => { setShowResetPasswordModal(false); setSelectedUsuario(null) }}></button>
                                        </div>
                                        <form onSubmit={handleResetPasswordSubmit}>
                                            <div className="modal-body p-4">
                                                <p className="text-muted mb-3">Definir nova senha para <strong>{selectedUsuario.nome}</strong></p>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Nova Senha</label>
                                                    <input
                                                        type="password"
                                                        className={`form-control ${resetPasswordErrors.novaSenha ? 'is-invalid' : ''}`}
                                                        value={resetPasswordForm.novaSenha}
                                                        onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, novaSenha: e.target.value })}
                                                    />
                                                    {resetPasswordErrors.novaSenha && <div className="invalid-feedback">{resetPasswordErrors.novaSenha}</div>}
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Confirmar Nova Senha</label>
                                                    <input
                                                        type="password"
                                                        className={`form-control ${resetPasswordErrors.confirmarSenha ? 'is-invalid' : ''}`}
                                                        value={resetPasswordForm.confirmarSenha}
                                                        onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmarSenha: e.target.value })}
                                                    />
                                                    {resetPasswordErrors.confirmarSenha && <div className="invalid-feedback">{resetPasswordErrors.confirmarSenha}</div>}
                                                </div>
                                            </div>
                                            <div className="modal-footer bg-light">
                                                <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowResetPasswordModal(false); setSelectedUsuario(null) }}>Cancelar</button>
                                                <button type="submit" className="btn btn-warning" disabled={isResettingPassword}>
                                                    {isResettingPassword ? <><span className="spinner-border spinner-border-sm me-2"></span>Resetando...</> : <><i className="bi bi-key me-2"></i>Resetar Senha</>}
                                                </button>
                                            </div>
                                        </form>
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

                    <TableLoading isLoading={isFetching}>
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
                                                            <p className="fw-medium mb-0">{role.descricaoPtBr || role.descricao || role.nome}</p>
                                                            <p className="text-muted small mb-0">
                                                                {role.descricaoPtBr && <span className="me-2"><code>{role.descricao}</code></span>}
                                                                ID: #{role.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="align-middle text-end pe-4">
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            className="btn btn-outline-primary"
                                                            onClick={() => handleOpenRoleEdit(role)}
                                                            title="Editar Perfil"
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
                                label="perfis"
                                isLoading={isRoleLoading}
                            />
                        </div>
                    </div>
                    </TableLoading>

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
                                            <h5 className="modal-title"><i className="bi bi-shield-lock me-2"></i>{selectedRole ? 'Editar Perfil' : 'Novo Perfil'}</h5>
                                            <button type="button" className="btn-close btn-close-white" onClick={() => { setShowRoleModal(false); setSelectedRole(null) }}></button>
                                        </div>
                                        <form onSubmit={handleRoleSubmit}>
                                            <div className="modal-body p-4">
                                                <div className="mb-3">
                                                    <label className="form-label fw-medium">Código <span className="text-danger">*</span></label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${roleErrors.descricao ? 'is-invalid' : ''}`}
                                                        value={roleForm.descricao}
                                                        onChange={(e) => setRoleForm({ ...roleForm, descricao: e.target.value })}
                                                        placeholder="ADMIN, GESTOR, PROFESSOR..."
                                                    />
                                                    {roleErrors.descricao && <div className="invalid-feedback">{roleErrors.descricao}</div>}
                                                    <div className="form-text">Identificador técnico do perfil (usado em autorização).</div>
                                                </div>
                                                <div>
                                                    <label className="form-label fw-medium">Descrição (pt-BR)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={roleForm.descricaoPtBr}
                                                        onChange={(e) => setRoleForm({ ...roleForm, descricaoPtBr: e.target.value })}
                                                        placeholder="Administrador do Município"
                                                        maxLength={255}
                                                    />
                                                    <div className="form-text">Nome exibido nas telas.</div>
                                                </div>
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

            <UsuarioImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
        </div>
    )
}
