import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore } from '@/stores'
import { generateId } from '@/lib/utils'
import type { User } from '@/types'

export function MunicipioUsuariosPage() {
    const { municipioId } = useParams()
    const navigate = useNavigate()
    const { municipios, getUsuariosByMunicipio, addUsuario, updateUsuario, deleteUsuario } = useDataStore()
    const [searchTerm, setSearchTerm] = useState('')
    const [perfilFilter, setPerfilFilter] = useState<string>('todos')

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedUsuario, setSelectedUsuario] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        perfil: 'usuario' as 'admin' | 'gestor' | 'usuario',
        status: 'ativo' as 'ativo' | 'inativo'
    })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    const municipio = municipios.find((m) => m.id === municipioId)
    const usuarios = getUsuariosByMunicipio(municipioId || '')

    const perfis = [...new Set(usuarios.map(u => u.perfil))]

    const filteredUsuarios = usuarios.filter((u) => {
        const matchesSearch = u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesPerfil = perfilFilter === 'todos' || u.perfil === perfilFilter
        return matchesSearch && matchesPerfil
    })

    const validateForm = () => {
        const errors: Record<string, string> = {}
        if (!formData.nome || formData.nome.length < 3) {
            errors.nome = 'Nome deve ter no mínimo 3 caracteres'
        }
        if (!formData.email || !formData.email.includes('@')) {
            errors.email = 'Email inválido'
        }
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleOpenAddModal = () => {
        setFormData({
            nome: '',
            email: '',
            telefone: '',
            perfil: 'usuario',
            status: 'ativo'
        })
        setFormErrors({})
        setShowAddModal(true)
    }

    const handleOpenEditModal = (usuario: User) => {
        setSelectedUsuario(usuario)
        setFormData({
            nome: usuario.nome,
            email: usuario.email,
            telefone: usuario.telefone || '',
            perfil: usuario.perfil,
            status: usuario.status
        })
        setFormErrors({})
        setShowEditModal(true)
    }

    const handleOpenDeleteModal = (usuario: User) => {
        setSelectedUsuario(usuario)
        setShowDeleteModal(true)
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm() || !municipioId) return

        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 500))

        addUsuario({
            id: generateId(),
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone || undefined,
            perfil: formData.perfil,
            status: formData.status,
            municipioId: municipioId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })

        setIsLoading(false)
        setShowAddModal(false)
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm() || !selectedUsuario) return

        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 500))

        updateUsuario(selectedUsuario.id, {
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone || undefined,
            perfil: formData.perfil,
            status: formData.status,
        })

        setIsLoading(false)
        setShowEditModal(false)
        setSelectedUsuario(null)
    }

    const handleConfirmDelete = async () => {
        if (!selectedUsuario) return

        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 500))

        deleteUsuario(selectedUsuario.id)

        setIsLoading(false)
        setShowDeleteModal(false)
        setSelectedUsuario(null)
    }

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

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => navigate(`/municipio/${municipioId}/dashboard`)}
                        >
                            <i className="bi bi-arrow-left"></i>
                        </button>
                        <h1 className="h3 fw-bold text-dark mb-0">Usuários</h1>
                    </div>
                    <p className="text-muted mb-0">{municipio.nome} - {municipio.estado}</p>
                </div>
                <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={handleOpenAddModal}
                >
                    <i className="bi bi-plus-lg"></i>
                    Novo Usuário
                </button>
            </div>

            {/* Stats */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm bg-primary text-white">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-people" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{usuarios.length}</p>
                                    <p className="small mb-0 opacity-75">Total</p>
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
                                    <p className="h4 fw-bold mb-0">{usuarios.filter(u => u.status === 'ativo').length}</p>
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
                                <i className="bi bi-shield-check" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{usuarios.filter(u => u.perfil === 'gestor').length}</p>
                                    <p className="small mb-0 opacity-75">Gestores</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm bg-warning text-dark">
                        <div className="card-body py-3">
                            <div className="d-flex align-items-center gap-3">
                                <i className="bi bi-person-badge" style={{ fontSize: 28 }}></i>
                                <div>
                                    <p className="h4 fw-bold mb-0">{perfis.length}</p>
                                    <p className="small mb-0">Perfis</p>
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
                                    placeholder="Buscar usuário ou email..."
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
                                    <th className="border-0">Telefone</th>
                                    <th className="border-0">Status</th>
                                    <th className="border-0 text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsuarios.map((usuario) => (
                                    <tr key={usuario.id}>
                                        <td className="align-middle">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary"
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
                                            <span className={`badge ${usuario.perfil === 'admin' ? 'bg-danger' :
                                                    usuario.perfil === 'gestor' ? 'bg-info' : 'bg-secondary'
                                                }`}>
                                                {usuario.perfil}
                                            </span>
                                        </td>
                                        <td className="align-middle">{usuario.telefone || '-'}</td>
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
            {showAddModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
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
                                        onClick={() => setShowAddModal(false)}
                                    ></button>
                                </div>
                                <form onSubmit={handleAddSubmit}>
                                    <div className="modal-body p-4">
                                        <div className="row g-4">
                                            <div className="col-12">
                                                <label className="form-label fw-medium">
                                                    Nome Completo <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`}
                                                    placeholder="Digite o nome completo"
                                                    value={formData.nome}
                                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                />
                                                {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">
                                                    Email <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                                                    placeholder="email@exemplo.com"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                                {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">Telefone</label>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    placeholder="(00) 00000-0000"
                                                    value={formData.telefone}
                                                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">Perfil</label>
                                                <select
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
                                                <label className="form-label fw-medium">Status</label>
                                                <select
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
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAddModal(false)}>
                                            Cancelar
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                            {isLoading ? (
                                                <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</>
                                            ) : (
                                                <><i className="bi bi-check-lg me-2"></i>Cadastrar Usuário</>
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
                    <div className="modal fade show d-block" tabIndex={-1}>
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
                                        onClick={() => { setShowEditModal(false); setSelectedUsuario(null) }}
                                    ></button>
                                </div>
                                <form onSubmit={handleEditSubmit}>
                                    <div className="modal-body p-4">
                                        <div className="row g-4">
                                            <div className="col-12">
                                                <label className="form-label fw-medium">
                                                    Nome Completo <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-control form-control-lg ${formErrors.nome ? 'is-invalid' : ''}`}
                                                    value={formData.nome}
                                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                />
                                                {formErrors.nome && <div className="invalid-feedback">{formErrors.nome}</div>}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">
                                                    Email <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                                {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">Telefone</label>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    value={formData.telefone}
                                                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-medium">Perfil</label>
                                                <select
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
                                                <label className="form-label fw-medium">Status</label>
                                                <select
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
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowEditModal(false); setSelectedUsuario(null) }}>
                                            Cancelar
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                            {isLoading ? (
                                                <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</>
                                            ) : (
                                                <><i className="bi bi-check-lg me-2"></i>Salvar Alterações</>
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
                                        onClick={() => { setShowDeleteModal(false); setSelectedUsuario(null) }}
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
                                        onClick={() => { setShowDeleteModal(false); setSelectedUsuario(null) }}
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
