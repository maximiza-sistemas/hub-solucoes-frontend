import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores'
import { usuariosApi } from '@/services/api'

export function TrocarSenhaInicialPage() {
    const navigate = useNavigate()
    const { user, accessToken, updateUser, logout } = useAuthStore()

    const [senhaAtual, setSenhaAtual] = useState('')
    const [novaSenha, setNovaSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [showAtual, setShowAtual] = useState(false)
    const [showNova, setShowNova] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)

    const validate = () => {
        const e: Record<string, string> = {}
        if (!senhaAtual) e.senhaAtual = 'Informe a senha atual (a senha padrão recebida)'
        if (!novaSenha || novaSenha.length < 6) e.novaSenha = 'A nova senha deve ter no mínimo 6 caracteres'
        if (novaSenha === senhaAtual && novaSenha) e.novaSenha = 'A nova senha deve ser diferente da senha atual'
        if (novaSenha !== confirmarSenha) e.confirmarSenha = 'As senhas não coincidem'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault()
        if (!validate() || !user) return
        setIsLoading(true)
        try {
            await usuariosApi.alterarSenha(user.id, { senhaAtual, novaSenha }, accessToken)
            updateUser({ primeiroAcesso: false })
            toast.success('Senha alterada com sucesso!')

            if (user.role === 'SUPERADMIN' || user.role === 'ADMIN') {
                navigate('/admin/dashboard')
            } else if (user.municipioId) {
                navigate(`/municipio/${user.municipioId}/dashboard`)
            } else {
                navigate('/admin/dashboard')
            }
        } catch (err) {
            const message = (err as Error).message || 'Erro ao alterar senha'
            toast.error(message)
            if (message.toLowerCase().includes('atual')) {
                setErrors({ senhaAtual: 'Senha atual incorreta' })
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleSair = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center"
            style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #00a8e8 100%)' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
                        <div className="card shadow-lg border-0 animate-fadeIn"
                            style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                            <div className="card-body p-4 p-md-5">
                                <div className="text-center mb-4">
                                    <img
                                        src="/logo-maximiza.png"
                                        alt="MAXIMIZA Soluções Educacionais"
                                        className="mb-3"
                                        style={{ maxHeight: 60, width: 'auto' }}
                                    />
                                    <h5 className="fw-semibold mb-1">Defina sua nova senha</h5>
                                    <p className="text-muted small mb-0">
                                        Olá, <strong>{user?.nome}</strong>. Por segurança, você precisa
                                        substituir a senha padrão antes de continuar.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label fw-medium">Senha atual</label>
                                        <div className="input-group">
                                            <input
                                                type={showAtual ? 'text' : 'password'}
                                                className={`form-control form-control-lg ${errors.senhaAtual ? 'is-invalid' : ''}`}
                                                placeholder="Senha padrão recebida"
                                                value={senhaAtual}
                                                onChange={(e) => setSenhaAtual(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => setShowAtual(!showAtual)}
                                            >
                                                <i className={`bi ${showAtual ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                            {errors.senhaAtual && (
                                                <div className="invalid-feedback">{errors.senhaAtual}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-medium">Nova senha</label>
                                        <div className="input-group">
                                            <input
                                                type={showNova ? 'text' : 'password'}
                                                className={`form-control form-control-lg ${errors.novaSenha ? 'is-invalid' : ''}`}
                                                placeholder="Mínimo de 6 caracteres"
                                                value={novaSenha}
                                                onChange={(e) => setNovaSenha(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => setShowNova(!showNova)}
                                            >
                                                <i className={`bi ${showNova ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                            {errors.novaSenha && (
                                                <div className="invalid-feedback">{errors.novaSenha}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-medium">Confirmar nova senha</label>
                                        <input
                                            type={showNova ? 'text' : 'password'}
                                            className={`form-control form-control-lg ${errors.confirmarSenha ? 'is-invalid' : ''}`}
                                            placeholder="Repita a nova senha"
                                            value={confirmarSenha}
                                            onChange={(e) => setConfirmarSenha(e.target.value)}
                                        />
                                        {errors.confirmarSenha && (
                                            <div className="invalid-feedback d-block">{errors.confirmarSenha}</div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-lg w-100 mb-2"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Salvando...
                                            </>
                                        ) : (
                                            'Alterar senha e continuar'
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-link w-100 text-muted small"
                                        onClick={handleSair}
                                        disabled={isLoading}
                                    >
                                        Sair e voltar ao login
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="text-center mt-4">
                            <p className="small text-white-50 mb-0">
                                © 2026 MAXIMIZA Soluções Educacionais
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}