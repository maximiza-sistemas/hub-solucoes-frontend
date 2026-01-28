import { useState } from 'react'
import { useAuthStore } from '@/stores'

export function ConfiguracoesPage() {
    const { user } = useAuthStore()
    const [notifications, setNotifications] = useState({
        email: true,
        sistema: true,
        relatorios: false,
    })

    return (
        <div className="container-fluid py-4">
            <div className="row">
                <div className="col-12 mb-4">
                    <h1 className="h3 mb-1">Configurações</h1>
                    <p className="text-muted">Personalize sua experiência no sistema</p>
                </div>
            </div>

            <div className="row">
                <div className="col-lg-8">
                    {/* Notifications */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0">
                                <i className="bi bi-bell me-2 text-primary"></i>
                                Notificações
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                <div>
                                    <h6 className="mb-1">Notificações por E-mail</h6>
                                    <p className="text-muted small mb-0">
                                        Receber atualizações importantes por e-mail
                                    </p>
                                </div>
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        checked={notifications.email}
                                        onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                                        style={{ width: 48, height: 24 }}
                                    />
                                </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                <div>
                                    <h6 className="mb-1">Notificações do Sistema</h6>
                                    <p className="text-muted small mb-0">
                                        Alertas e avisos dentro da plataforma
                                    </p>
                                </div>
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        checked={notifications.sistema}
                                        onChange={(e) => setNotifications({ ...notifications, sistema: e.target.checked })}
                                        style={{ width: 48, height: 24 }}
                                    />
                                </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center py-3">
                                <div>
                                    <h6 className="mb-1">Relatórios Semanais</h6>
                                    <p className="text-muted small mb-0">
                                        Resumo semanal de atividades por e-mail
                                    </p>
                                </div>
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        checked={notifications.relatorios}
                                        onChange={(e) => setNotifications({ ...notifications, relatorios: e.target.checked })}
                                        style={{ width: 48, height: 24 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0">
                                <i className="bi bi-palette me-2 text-primary"></i>
                                Aparência
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center py-3">
                                <div>
                                    <h6 className="mb-1">Tema</h6>
                                    <p className="text-muted small mb-0">
                                        Escolha entre modo claro ou escuro
                                    </p>
                                </div>
                                <select className="form-select" style={{ width: 150 }}>
                                    <option value="light">Claro</option>
                                    <option value="dark" disabled>Escuro (em breve)</option>
                                    <option value="auto" disabled>Automático</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Privacy */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0">
                                <i className="bi bi-shield-lock me-2 text-primary"></i>
                                Privacidade e Dados
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                <div>
                                    <h6 className="mb-1">Exportar Meus Dados</h6>
                                    <p className="text-muted small mb-0">
                                        Baixar uma cópia dos seus dados pessoais
                                    </p>
                                </div>
                                <button className="btn btn-outline-primary btn-sm">
                                    <i className="bi bi-download me-1"></i>
                                    Exportar
                                </button>
                            </div>
                            <div className="d-flex justify-content-between align-items-center py-3">
                                <div>
                                    <h6 className="mb-1 text-danger">Excluir Conta</h6>
                                    <p className="text-muted small mb-0">
                                        Esta ação é irreversível
                                    </p>
                                </div>
                                <button className="btn btn-outline-danger btn-sm" disabled>
                                    <i className="bi bi-trash me-1"></i>
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm bg-light">
                        <div className="card-body">
                            <h6 className="mb-3">
                                <i className="bi bi-info-circle me-2 text-primary"></i>
                                Informações da Conta
                            </h6>
                            <div className="mb-3">
                                <small className="text-muted d-block">Usuário</small>
                                <span className="fw-medium">{user?.nome}</span>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted d-block">E-mail</small>
                                <span className="fw-medium">{user?.email}</span>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted d-block">Perfil</small>
                                <span className="badge bg-primary">
                                    {user?.perfil === 'admin' ? 'Administrador' : 'Gestor'}
                                </span>
                            </div>
                            <hr />
                            <p className="text-muted small mb-0">
                                <i className="bi bi-question-circle me-1"></i>
                                Precisa de ajuda? Entre em contato com o suporte.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
