import { useState } from 'react'
import { useAuthStore } from '@/stores'

export function PerfilPage() {
    const { user } = useAuthStore()
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        nome: user?.nome || '',
        email: user?.email || '',
        telefone: user?.telefone || '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // TODO: Implement profile update API call
        console.log('Updating profile:', formData)
        setIsEditing(false)
    }

    return (
        <div className="container-fluid py-4">
            <div className="row">
                <div className="col-12 mb-4">
                    <h1 className="h3 mb-1">Meu Perfil</h1>
                    <p className="text-muted">Gerencie suas informações pessoais</p>
                </div>
            </div>

            <div className="row">
                {/* Profile Card */}
                <div className="col-lg-4 mb-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center py-5">
                            <div
                                className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white mx-auto mb-3"
                                style={{ width: 100, height: 100, fontSize: 36 }}
                            >
                                {user?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                            </div>
                            <h4 className="mb-1">{user?.nome}</h4>
                            <p className="text-muted mb-3">{user?.email}</p>
                            <span className={`badge ${user?.perfil === 'admin' ? 'bg-primary' : 'bg-info'} px-3 py-2`}>
                                <i className="bi bi-shield-check me-1"></i>
                                {user?.perfil === 'admin' ? 'Administrador' : 'Gestor Municipal'}
                            </span>

                            <hr className="my-4" />

                            <div className="d-flex justify-content-center gap-2">
                                <div className="text-center px-3">
                                    <div className="h4 mb-0 text-primary">
                                        {user?.municipioId ? '1' : '—'}
                                    </div>
                                    <small className="text-muted">Município</small>
                                </div>
                                <div className="border-start"></div>
                                <div className="text-center px-3">
                                    <div className="h4 mb-0 text-success">Ativo</div>
                                    <small className="text-muted">Status</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
                            <h5 className="mb-0">
                                <i className="bi bi-person-lines-fill me-2 text-primary"></i>
                                Informações Pessoais
                            </h5>
                            {!isEditing && (
                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <i className="bi bi-pencil me-1"></i>
                                    Editar
                                </button>
                            )}
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label text-muted small">Nome Completo</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.nome}
                                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                            />
                                        ) : (
                                            <p className="mb-0 fw-medium">{user?.nome}</p>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted small">E-mail</label>
                                        {isEditing ? (
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        ) : (
                                            <p className="mb-0 fw-medium">{user?.email}</p>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted small">Perfil</label>
                                        <p className="mb-0 fw-medium">
                                            {user?.perfil === 'admin' ? 'Administrador' : 'Gestor Municipal'}
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted small">Telefone</label>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                className="form-control"
                                                value={formData.telefone}
                                                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                                placeholder="(00) 00000-0000"
                                            />
                                        ) : (
                                            <p className="mb-0 fw-medium">{user?.telefone || 'Não informado'}</p>
                                        )}
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="d-flex gap-2 mt-4">
                                        <button type="submit" className="btn btn-primary">
                                            <i className="bi bi-check-lg me-1"></i>
                                            Salvar Alterações
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setIsEditing(false)}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="card border-0 shadow-sm mt-4">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0">
                                <i className="bi bi-shield-lock me-2 text-primary"></i>
                                Segurança
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1">Alterar Senha</h6>
                                    <p className="text-muted small mb-0">
                                        Recomendamos alterar sua senha periodicamente
                                    </p>
                                </div>
                                <button className="btn btn-outline-primary btn-sm">
                                    <i className="bi bi-key me-1"></i>
                                    Alterar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
