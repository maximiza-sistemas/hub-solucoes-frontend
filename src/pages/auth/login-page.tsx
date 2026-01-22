import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores'
import { authApi } from '@/services/api'

const loginSchema = z.object({
    email: z.string().email('E-mail inválido'),
    senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { login } = useAuthStore()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true)
        setError('')

        try {
            const response = await authApi.login(data.email, data.senha)
            login(response.user, response.token)

            if (response.user.perfil === 'admin') {
                navigate('/admin/municipios')
            } else {
                navigate(`/municipio/${response.user.municipioId}/solucoes`)
            }
        } catch (err) {
            setError((err as Error).message || 'E-mail ou senha incorretos')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center"
            style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #00a8e8 100%)' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
                        <div className="card shadow-lg border-0 animate-fadeIn"
                            style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                            <div className="card-body p-4 p-md-5">
                                {/* Logo MAXIMIZA */}
                                <div className="text-center mb-4">
                                    <img
                                        src="/logo-maximiza.png"
                                        alt="MAXIMIZA Soluções Educacionais"
                                        className="mb-3"
                                        style={{ maxHeight: 60, width: 'auto' }}
                                    />
                                    <p className="text-muted small mb-0">
                                        Ecossistema de Gestão Educacional
                                    </p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <div className="mb-3">
                                        <label className="form-label fw-medium">E-mail</label>
                                        <input
                                            type="email"
                                            className={`form-control form-control-lg ${errors.email ? 'is-invalid' : ''}`}
                                            placeholder="seu@email.gov.br"
                                            {...register('email')}
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback">{errors.email.message}</div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-medium">Senha</label>
                                        <div className="input-group">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className={`form-control form-control-lg ${errors.senha ? 'is-invalid' : ''}`}
                                                placeholder="••••••••"
                                                {...register('senha')}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                            {errors.senha && (
                                                <div className="invalid-feedback">{errors.senha.message}</div>
                                            )}
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="alert alert-danger py-2 small" role="alert">
                                            {error}
                                        </div>
                                    )}

                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <div className="form-check">
                                            <input type="checkbox" className="form-check-input" id="rememberMe" />
                                            <label className="form-check-label small" htmlFor="rememberMe">
                                                Lembrar-me
                                            </label>
                                        </div>
                                        <a href="#" className="small text-decoration-none" style={{ color: '#00a8e8' }}>
                                            Esqueceu a senha?
                                        </a>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-lg w-100"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Entrando...
                                            </>
                                        ) : (
                                            'Entrar'
                                        )}
                                    </button>
                                </form>

                                {/* Demo credentials */}
                                <div className="mt-4 p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fc 100%)' }}>
                                    <p className="small fw-medium mb-2" style={{ color: '#1e3a5f' }}>
                                        <i className="bi bi-info-circle me-1"></i>
                                        Credenciais de demonstração:
                                    </p>
                                    <div className="small" style={{ color: '#64748b' }}>
                                        <p className="mb-1"><strong>Admin:</strong> admin@maximiza.com / admin123</p>
                                        <p className="mb-0"><strong>Gestor:</strong> gestor@saoluis.ma.gov.br / admin123</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-4">
                            <p className="small text-white-50 mb-0">
                                © 2024 MAXIMIZA Soluções Educacionais
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
