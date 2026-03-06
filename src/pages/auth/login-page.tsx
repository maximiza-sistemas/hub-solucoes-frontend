import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores'
import { authApi, municipiosApi } from '@/services/api'
import type { AuthUser } from '@/types'

const loginSchema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
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
            const response = await authApi.login(data.email, data.password)

            const user: AuthUser = {
                id: response.userId,
                nome: response.nome,
                email: response.email,
                role: response.role,
                municipio: response.municipio,
            }

            // Resolve municipioId by fetching municipios and finding by name
            if (response.role !== 'SUPERADMIN' && response.municipio) {
                try {
                    const municipiosResponse = await municipiosApi.list(response.accessToken)
                    const mun = municipiosResponse.content.find(
                        (m) => m.nome === response.municipio
                    )
                    if (mun) {
                        user.municipioId = mun.id
                    }
                } catch {
                    // Continue without municipioId
                }
            }

            login(user, response.accessToken, response.refreshToken)

            if (response.role === 'SUPERADMIN') {
                navigate('/admin/municipios')
            } else if (user.municipioId) {
                navigate(`/municipio/${user.municipioId}/dashboard`)
            } else {
                navigate('/admin/municipios')
            }
        } catch (err) {
            const message = (err as Error).message
            if (message?.includes('401') || message?.includes('403') || message === 'Erro na requisição' || message === 'Erro desconhecido') {
                setError('E-mail ou senha incorretos')
            } else {
                setError(message || 'E-mail ou senha incorretos')
            }
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
                                                className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`}
                                                placeholder="••••••••"
                                                {...register('password')}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                            {errors.password && (
                                                <div className="invalid-feedback">{errors.password.message}</div>
                                            )}
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="alert alert-danger py-2 small" role="alert">
                                            {error}
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <div className="form-check">
                                            <input type="checkbox" className="form-check-input" id="rememberMe" />
                                            <label className="form-check-label small" htmlFor="rememberMe">
                                                Lembrar-me
                                            </label>
                                        </div>
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
                            </div>
                        </div>

                        {/* Footer */}
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
