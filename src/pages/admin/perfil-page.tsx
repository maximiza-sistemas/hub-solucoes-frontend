import { useState } from 'react'
import { useAuthStore } from '@/stores'
import { usuariosApi } from '@/services/api'
import { toast } from 'sonner'

export function PerfilPage() {
    const { user, accessToken } = useAuthStore()
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        nome: user?.nome || '',
        email: user?.email || '',
    })

    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [passwordForm, setPasswordForm] = useState({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Updating profile:', formData)
        setIsEditing(false)
    }

    const validatePasswordForm = () => {
        const errors: Record<string, string> = {}
        if (!passwordForm.senhaAtual) errors.senhaAtual = 'Senha atual é obrigatória'
        if (!passwordForm.novaSenha || passwordForm.novaSenha.length < 6) errors.novaSenha = 'Nova senha deve ter no mínimo 6 caracteres'
        if (passwordForm.novaSenha !== passwordForm.confirmarSenha) errors.confirmarSenha = 'As senhas não coincidem'
        setPasswordErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validatePasswordForm() || !user) return
        setIsChangingPassword(true)
        try {
            await usuariosApi.alterarSenha(user.id, {
                senhaAtual: passwordForm.senhaAtual,
                novaSenha: passwordForm.novaSenha,
            }, accessToken)
            toast.success('Senha alterada com sucesso!')
            setShowPasswordModal(false)
            setPasswordForm({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
            setPasswordErrors({})
        } catch (error: any) {
            toast.error(error.message || 'Erro ao alterar senha')
        } finally {
            setIsChangingPassword(false)
        }
    }

    const handleOpenPasswordModal = () => {
        setPasswordForm({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
        setPasswordErrors({})
        setShowPasswordModal(true)
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
                            <span className={`badge ${isAdmin ? 'bg-primary' : 'bg-info'} px-3 py-2`}>
                                <i className="bi bi-shield-check me-1"></i>
                                {isAdmin ? 'Administrador' : 'Gestor Municipal'}
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
                                            {isAdmin ? 'Administrador' : 'Gestor Municipal'}
                                        </p>
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
                                </div>
                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={handleOpenPasswordModal}
                                >
                                    <i className="bi bi-key me-1"></i>
                                    Alterar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-key me-2"></i>
                                        Alterar Senha
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => setShowPasswordModal(false)}
                                    ></button>
                                </div>
                                <form onSubmit={handlePasswordSubmit}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label">Senha Atual</label>
                                            <input
                                                type="password"
                                                className={`form-control ${passwordErrors.senhaAtual ? 'is-invalid' : ''}`}
                                                value={passwordForm.senhaAtual}
                                                placeholder='Sua senha atual'
                                                onChange={(e) => setPasswordForm({ ...passwordForm, senhaAtual: e.target.value })}
                                            />
                                            {passwordErrors.senhaAtual && (
                                                <div className="invalid-feedback">{passwordErrors.senhaAtual}</div>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Nova Senha</label>
                                            <input
                                                type="password"
                                                className={`form-control ${passwordErrors.novaSenha ? 'is-invalid' : ''}`}
                                                placeholder='A nova senha'
                                                value={passwordForm.novaSenha}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, novaSenha: e.target.value })}
                                            />
                                            {passwordErrors.novaSenha && (
                                                <div className="invalid-feedback">{passwordErrors.novaSenha}</div>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Confirmar Nova Senha</label>
                                            <input
                                                type="password"
                                                className={`form-control ${passwordErrors.confirmarSenha ? 'is-invalid' : ''}`}
                                                value={passwordForm.confirmarSenha}
                                                placeholder='Confirme a nova senha'
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmarSenha: e.target.value })}
                                            />
                                            {passwordErrors.confirmarSenha && (
                                                <div className="invalid-feedback">{passwordErrors.confirmarSenha}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setShowPasswordModal(false)}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isChangingPassword}
                                        >
                                            {isChangingPassword ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Alterando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-lg me-1"></i>
                                                    Alterar Senha
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
        </div>
    )
}
