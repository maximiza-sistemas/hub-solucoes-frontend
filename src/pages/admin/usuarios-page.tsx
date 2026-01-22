import { useState, useEffect } from 'react'
import { useDataStore } from '@/stores'

export function UsuariosPage() {
    const {
        usuarios,
        municipios,
        fetchUsuarios,
        fetchMunicipios,
        addUsuario,
        updateUsuario,
        deleteUsuario
    } = useDataStore()

    const [searchTerm, setSearchTerm] = useState('')
    const [perfilFilter, setPerfilFilter] = useState<string>('todos')

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedUsuario, setSelectedUsuario] = useState<typeof usuarios[0] | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        cpf: '',
        telefone: '',
        perfil: 'usuario' as 'admin' | 'gestor' | 'usuario',
        municipioId: '',
        status: 'ativo' as 'ativo' | 'inativo',
        senha: ''
    })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    // Fetch data on mount
    useEffect(() => {
        fetchUsuarios()
        fetchMunicipios()
    }, [fetchUsuarios, fetchMunicipios])

    const filteredUsuarios = usuarios.filter((u) => {
        const matchesSearch = u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesPerfil = perfilFilter === 'todos' || u.perfil === perfilFilter
        return matchesSearch && matchesPerfil
    })

    const getMunicipioNome = (municipioId?: string) => {
        if (!municipioId) return '-'
        return municipios.find(m => m.id === municipioId)?.nome || '-'
    }

    const getPerfilBadge = (perfil: string) => {
        const badges: Record<string, string> = {
            'admin': 'bg-danger',
            'gestor': 'bg-primary',
            'usuario': 'bg-secondary'
        }
        return badges[perfil] || 'bg-secondary'
    }

    const resetForm = () => {
        setFormData({
            nome: '',
            email: '',
            cpf: '',
            telefone: '',
            perfil: 'usuario',
            municipioId: '',
            status: 'ativo',
            senha: ''
        })
        setFormErrors({})
    }

    const handleOpenModal = () => {
        resetForm()
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        resetForm()
    }

    const handleOpenEditModal = (usuario: typeof usuarios[0]) => {
        setSelectedUsuario(usuario)
        setFormData({
            nome: usuario.nome,
            email: usuario.email,
            cpf: usuario.cpf || '',
            telefone: usuario.telefone || '',
            perfil: usuario.perfil as 'admin' | 'gestor' | 'usuario',
            municipioId: usuario.municipioId || '',
            status: usuario.status as 'ativo' | 'inativo',
            senha: ''
        })
        setFormErrors({})
        setShowEditModal(true)
    }

    const handleCloseEditModal = () => {
        setShowEditModal(false)
        setSelectedUsuario(null)
        resetForm()
    }

    const handleOpenDeleteModal = (usuario: typeof usuarios[0]) => {
        setSelectedUsuario(usuario)
        setShowDeleteModal(true)
    }

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false)
        setSelectedUsuario(null)
    }

    const validateForm = (isEdit = false) => {
        const errors: Record<string, string> = {}
        if (!formData.nome || formData.nome.length < 3) {
            errors.nome = 'Nome deve ter no mínimo 3 caracteres'
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Email inválido'
        }
        if (!isEdit && (!formData.senha || formData.senha.length < 6)) {
            errors.senha = 'Senha deve ter no mínimo 6 caracteres'
        }
        if (formData.cpf && formData.cpf.length < 11) {
            errors.cpf = 'CPF deve ter 11 dígitos'
        }
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const formatCPF = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11)
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
        if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
    }

    const formatTelefone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11)
        if (digits.length <= 2) return digits
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        try {
            await addUsuario({
                nome: formData.nome,
                email: formData.email,
                cpf: formData.cpf.replace(/\D/g, '') || undefined,
                telefone: formData.telefone.replace(/\D/g, '') || undefined,
                perfil: formData.perfil,
                municipioId: formData.municipioId || undefined,
                status: formData.status,
                senha: formData.senha
            })
            await fetchUsuarios()
            handleCloseModal()
        } catch (error) {
            console.error('Erro ao criar usuário:', error)
            setFormErrors({ submit: (error as Error).message || 'Erro ao criar usuário' })
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm(true) || !selectedUsuario) return

        setIsLoading(true)
        try {
            await updateUsuario(selectedUsuario.id, {
                nome: formData.nome,
                email: formData.email,
                cpf: formData.cpf.replace(/\D/g, '') || undefined,
                telefone: formData.telefone.replace(/\D/g, '') || undefined,
                perfil: formData.perfil,
                municipioId: formData.municipioId || undefined,
                status: formData.status,
                ...(formData.senha && { senha: formData.senha })
            })
            await fetchUsuarios()
            handleCloseEditModal()
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error)
            setFormErrors({ submit: (error as Error).message || 'Erro ao atualizar usuário' })
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!selectedUsuario) return

        setIsLoading(true)
        try {
            await deleteUsuario(selectedUsuario.id)
            await fetchUsuarios()
            handleCloseDeleteModal()
        } catch (error) {
            console.error('Erro ao excluir usuário:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 fw-bold text-dark mb-1">Usuários</h1>
                    <p className="text-muted mb-0">Gerencie os usuários do sistema</p>
                </div>
                <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={handleOpenModal}
                >
                    <i className="bi bi-plus-lg"></i>
                    Novo Usuário
                </button>
            </div>

            {/* Stats */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="d-flex align-items-center justify-content-center rounded bg-primary bg-opacity-10"
                                    style={{ width: 40, height: 40 }}>
                                    <i className="bi bi-people text-primary"></i>
                                </div>
                                <div>
                                    <p className="h5 fw-bold mb-0">{usuarios.length}</p>
                                    <p className="text-muted small mb-0">Total</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="d-flex align-items-center justify-content-center rounded bg-danger bg-opacity-10"
                                    style={{ width: 40, height: 40 }}>
                                    <i className="bi bi-shield-check text-danger"></i>
                                </div>
                                <div>
                                    <p className="h5 fw-bold mb-0">{usuarios.filter(u => u.perfil === 'admin').length}</p>
                                    <p className="text-muted small mb-0">Admins</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="d-flex align-items-center justify-content-center rounded bg-success bg-opacity-10"
                                    style={{ width: 40, height: 40 }}>
                                    <i className="bi bi-person-check text-success"></i>
                                </div>
                                <div>
                                    <p className="h5 fw-bold mb-0">{usuarios.filter(u => u.status === 'ativo').length}</p>
                                    <p className="text-muted small mb-0">Ativos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="d-flex align-items-center justify-content-center rounded bg-warning bg-opacity-10"
                                    style={{ width: 40, height: 40 }}>
                                    <i className="bi bi-briefcase text-warning"></i>
                                </div>
                                <div>
                                    <p className="h5 fw-bold mb-0">{usuarios.filter(u => u.perfil === 'gestor').length}</p>
                                    <p className="text-muted small mb-0">Gestores</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
                                    placeholder="Buscar usuário..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-12 col-md-6 col-lg-3">
                            <select
                                className="form-select"
                                value={perfilFilter}
                                onChange={(e) => setPerfilFilter(e.target.value)}
                            >
                                <option value="todos">Todos os perfis</option>
                                <option value="admin">Admin</option>
                                <option value="gestor">Gestor</option>
                                <option value="usuario">Usuário</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="border-0">Usuário</th>
                                    <th className="border-0">Perfil</th>
                                    <th className="border-0">Município</th>
                                    <th className="border-0">Status</th>
                                    <th className="border-0 text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsuarios.map((usuario) => (
                                    <tr key={usuario.id}>
                                        <td className="align-middle">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white"
                                                    style={{ width: 40, height: 40, fontSize: 14 }}>
                                                    {usuario.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="fw-medium mb-0">{usuario.nome}</p>
                                                    <p className="text-muted small mb-0">{usuario.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="align-middle">
                                            <span className={`badge ${getPerfilBadge(usuario.perfil)}`}>
                                                {usuario.perfil}
                                            </span>
                                        </td>
                                        <td className="align-middle">{getMunicipioNome(usuario.municipioId)}</td>
                                        <td className="align-middle">
                                            <span className={`badge ${usuario.status === 'ativo' ? 'bg-success' : 'bg-secondary'}`}>
                                                {usuario.status}
                                            </span>
                                        </td>
                                        <td className="align-middle text-end">
                                            <div className="btn-group btn-group-sm">
                                                <button
                                                    className="btn btn-outline-primary"
                                                    onClick={() => handleOpenEditModal(usuario)}
                                                    title="Editar"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button
                                                    className="btn btn-outline-danger"
                                                    onClick={() => handleOpenDeleteModal(usuario)}
                                                    title="Excluir"
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
            </div>

            {filteredUsuarios.length === 0 && (
                <div className="text-center py-5">
                    <i className="bi bi-inbox text-muted" style={{ fontSize: 48 }}></i>
                    <p className="text-muted mt-3">Nenhum usuário encontrado</p>
                </div>
            )}

            {/* Modal Novo Usuário */}
            {showModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1} role="dialog">
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-person-plus me-2"></i>
                                        Novo Usuário
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={handleCloseModal}
                                    ></button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body p-4">
                                        {formErrors.submit && (
                                            <div className="alert alert-danger">{formErrors.submit}</div>
                                        )}
                                        <div className="row g-4">
                                            {/* Nome */}
                                            <div className="col-12">
                                                <label htmlFor="nome" className="form-label fw-medium">
                                                    Nome Completo <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="nome"
                                                    className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`}
                                                    placeholder="Ex: João da Silva"
                                                    value={formData.nome}
                                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                />
                                                {formErrors.nome && (
                                                    <div className="invalid-feedback">{formErrors.nome}</div>
                                                )}
                                            </div>

                                            {/* Email e Senha */}
                                            <div className="col-md-6">
                                                <label htmlFor="email" className="form-label fw-medium">
                                                    Email <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                                                    placeholder="email@exemplo.com"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                                {formErrors.email && (
                                                    <div className="invalid-feedback">{formErrors.email}</div>
                                                )}
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="senha" className="form-label fw-medium">
                                                    Senha <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="password"
                                                    id="senha"
                                                    className={`form-control ${formErrors.senha ? 'is-invalid' : ''}`}
                                                    placeholder="Mínimo 6 caracteres"
                                                    value={formData.senha}
                                                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                                />
                                                {formErrors.senha && (
                                                    <div className="invalid-feedback">{formErrors.senha}</div>
                                                )}
                                            </div>

                                            {/* CPF e Telefone */}
                                            <div className="col-md-6">
                                                <label htmlFor="cpf" className="form-label fw-medium">CPF</label>
                                                <input
                                                    type="text"
                                                    id="cpf"
                                                    className={`form-control ${formErrors.cpf ? 'is-invalid' : ''}`}
                                                    placeholder="000.000.000-00"
                                                    value={formData.cpf}
                                                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                                                />
                                                {formErrors.cpf && (
                                                    <div className="invalid-feedback">{formErrors.cpf}</div>
                                                )}
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="telefone" className="form-label fw-medium">Telefone</label>
                                                <input
                                                    type="text"
                                                    id="telefone"
                                                    className="form-control"
                                                    placeholder="(00) 00000-0000"
                                                    value={formData.telefone}
                                                    onChange={(e) => setFormData({ ...formData, telefone: formatTelefone(e.target.value) })}
                                                />
                                            </div>

                                            {/* Perfil e Município */}
                                            <div className="col-md-6">
                                                <label htmlFor="perfil" className="form-label fw-medium">Perfil</label>
                                                <select
                                                    id="perfil"
                                                    className="form-select"
                                                    value={formData.perfil}
                                                    onChange={(e) => setFormData({ ...formData, perfil: e.target.value as 'admin' | 'gestor' | 'usuario' })}
                                                >
                                                    <option value="usuario">Usuário</option>
                                                    <option value="gestor">Gestor</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="municipioId" className="form-label fw-medium">Município</label>
                                                <select
                                                    id="municipioId"
                                                    className="form-select"
                                                    value={formData.municipioId}
                                                    onChange={(e) => setFormData({ ...formData, municipioId: e.target.value })}
                                                >
                                                    <option value="">Selecione um município</option>
                                                    {municipios.map(m => (
                                                        <option key={m.id} value={m.id}>{m.nome} - {m.estado}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Status */}
                                            <div className="col-md-6">
                                                <label htmlFor="status" className="form-label fw-medium">Status</label>
                                                <select
                                                    id="status"
                                                    className="form-select"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })}
                                                >
                                                    <option value="ativo">Ativo</option>
                                                    <option value="inativo">Inativo</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={handleCloseModal}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Salvando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-lg me-2"></i>
                                                    Cadastrar Usuário
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* Modal Editar Usuário */}
            {showEditModal && selectedUsuario && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1} role="dialog">
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-pencil me-2"></i>
                                        Editar Usuário
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={handleCloseEditModal}
                                    ></button>
                                </div>
                                <form onSubmit={handleEditSubmit}>
                                    <div className="modal-body p-4">
                                        {formErrors.submit && (
                                            <div className="alert alert-danger">{formErrors.submit}</div>
                                        )}
                                        <div className="row g-4">
                                            {/* Nome */}
                                            <div className="col-12">
                                                <label htmlFor="edit-nome" className="form-label fw-medium">
                                                    Nome Completo <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="edit-nome"
                                                    className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`}
                                                    value={formData.nome}
                                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                />
                                                {formErrors.nome && (
                                                    <div className="invalid-feedback">{formErrors.nome}</div>
                                                )}
                                            </div>

                                            {/* Email e Senha */}
                                            <div className="col-md-6">
                                                <label htmlFor="edit-email" className="form-label fw-medium">
                                                    Email <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    id="edit-email"
                                                    className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                                {formErrors.email && (
                                                    <div className="invalid-feedback">{formErrors.email}</div>
                                                )}
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="edit-senha" className="form-label fw-medium">
                                                    Nova Senha <small className="text-muted">(deixe vazio para manter)</small>
                                                </label>
                                                <input
                                                    type="password"
                                                    id="edit-senha"
                                                    className="form-control"
                                                    placeholder="••••••"
                                                    value={formData.senha}
                                                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                                />
                                            </div>

                                            {/* CPF e Telefone */}
                                            <div className="col-md-6">
                                                <label htmlFor="edit-cpf" className="form-label fw-medium">CPF</label>
                                                <input
                                                    type="text"
                                                    id="edit-cpf"
                                                    className={`form-control ${formErrors.cpf ? 'is-invalid' : ''}`}
                                                    placeholder="000.000.000-00"
                                                    value={formData.cpf}
                                                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                                                />
                                                {formErrors.cpf && (
                                                    <div className="invalid-feedback">{formErrors.cpf}</div>
                                                )}
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="edit-telefone" className="form-label fw-medium">Telefone</label>
                                                <input
                                                    type="text"
                                                    id="edit-telefone"
                                                    className="form-control"
                                                    placeholder="(00) 00000-0000"
                                                    value={formData.telefone}
                                                    onChange={(e) => setFormData({ ...formData, telefone: formatTelefone(e.target.value) })}
                                                />
                                            </div>

                                            {/* Perfil e Município */}
                                            <div className="col-md-6">
                                                <label htmlFor="edit-perfil" className="form-label fw-medium">Perfil</label>
                                                <select
                                                    id="edit-perfil"
                                                    className="form-select"
                                                    value={formData.perfil}
                                                    onChange={(e) => setFormData({ ...formData, perfil: e.target.value as 'admin' | 'gestor' | 'usuario' })}
                                                >
                                                    <option value="usuario">Usuário</option>
                                                    <option value="gestor">Gestor</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="edit-municipioId" className="form-label fw-medium">Município</label>
                                                <select
                                                    id="edit-municipioId"
                                                    className="form-select"
                                                    value={formData.municipioId}
                                                    onChange={(e) => setFormData({ ...formData, municipioId: e.target.value })}
                                                >
                                                    <option value="">Selecione um município</option>
                                                    {municipios.map(m => (
                                                        <option key={m.id} value={m.id}>{m.nome} - {m.estado}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Status */}
                                            <div className="col-md-6">
                                                <label htmlFor="edit-status" className="form-label fw-medium">Status</label>
                                                <select
                                                    id="edit-status"
                                                    className="form-select"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })}
                                                >
                                                    <option value="ativo">Ativo</option>
                                                    <option value="inativo">Inativo</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={handleCloseEditModal}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Salvando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-lg me-2"></i>
                                                    Salvar Alterações
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* Modal Confirmar Exclusão */}
            {showDeleteModal && selectedUsuario && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1} role="dialog">
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
                                        onClick={handleCloseDeleteModal}
                                    ></button>
                                </div>
                                <div className="modal-body p-4 text-center">
                                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mx-auto mb-4"
                                        style={{ width: 80, height: 80 }}>
                                        <i className="bi bi-trash text-danger" style={{ fontSize: 36 }}></i>
                                    </div>
                                    <h5 className="mb-2">Excluir "{selectedUsuario.nome}"?</h5>
                                    <p className="text-muted mb-0">
                                        Esta ação não pode ser desfeita. O usuário perderá acesso ao sistema.
                                    </p>
                                </div>
                                <div className="modal-footer bg-light justify-content-center">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary px-4"
                                        onClick={handleCloseDeleteModal}
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
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Excluindo...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-trash me-2"></i>
                                                Sim, Excluir
                                            </>
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

