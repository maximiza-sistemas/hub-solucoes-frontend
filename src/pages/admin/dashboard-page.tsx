import { useEffect } from 'react'
import { useDataStore } from '@/stores'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
    const {
        municipios,
        solucoes,
        usuarios,
        alunos,
        fetchMunicipios,
        fetchSolucoes,
        fetchUsuarios,
        fetchAlunos
    } = useDataStore()
    const navigate = useNavigate()

    // Fetch data on mount
    useEffect(() => {
        fetchMunicipios()
        fetchSolucoes()
        fetchUsuarios()
        fetchAlunos()
    }, [fetchMunicipios, fetchSolucoes, fetchUsuarios, fetchAlunos])

    const stats = [
        {
            label: 'Municípios',
            value: municipios.length,
            icon: 'bi-building',
            color: 'primary',
            path: '/admin/municipios'
        },
        {
            label: 'Soluções',
            value: solucoes.length,
            icon: 'bi-lightbulb',
            color: 'success',
            path: '/admin/solucoes'
        },
        {
            label: 'Usuários',
            value: usuarios.length,
            icon: 'bi-people',
            color: 'info',
            path: '/admin/usuarios'
        },
        {
            label: 'Alunos',
            value: alunos.length,
            icon: 'bi-mortarboard',
            color: 'warning',
            path: '#'
        },
    ]

    const recentMunicipios = municipios.slice(0, 4)

    return (
        <div className="animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 fw-bold text-dark mb-1">Dashboard</h1>
                    <p className="text-muted mb-0">Visão geral do sistema</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="col-12 col-sm-6 col-xl-3">
                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(stat.path)}
                        >
                            <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className="text-muted small mb-1">{stat.label}</p>
                                        <h3 className="h2 fw-bold mb-0">{stat.value}</h3>
                                    </div>
                                    <div className={`d-flex align-items-center justify-content-center rounded-3 bg-${stat.color} bg-opacity-10`}
                                        style={{ width: 48, height: 48 }}>
                                        <i className={`bi ${stat.icon} text-${stat.color}`} style={{ fontSize: 24 }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                {/* Recent Municipalities - CARDS */}
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
                            <h5 className="mb-0 fw-semibold">
                                <i className="bi bi-building me-2 text-primary"></i>
                                Últimos Municípios
                            </h5>
                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => navigate('/admin/municipios')}
                            >
                                Ver todos
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                {recentMunicipios.map((m) => {
                                    const userCount = usuarios.filter(u => u.municipioId === m.id).length
                                    const alunoCount = alunos.filter(a => a.municipioId === m.id).length

                                    return (
                                        <div key={m.id} className="col-12 col-md-6">
                                            <div
                                                className="card border h-100"
                                                style={{
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    borderRadius: '12px'
                                                }}
                                                onClick={() => navigate(`/municipio/${m.id}/dashboard`)}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-4px)'
                                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
                                                    e.currentTarget.style.borderColor = '#0d6efd'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)'
                                                    e.currentTarget.style.boxShadow = 'none'
                                                    e.currentTarget.style.borderColor = '#dee2e6'
                                                }}
                                            >
                                                <div className="card-body p-3">
                                                    <div className="d-flex align-items-start justify-content-between mb-3">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10"
                                                                style={{ width: 48, height: 48 }}>
                                                                <i className="bi bi-building text-primary" style={{ fontSize: 22 }}></i>
                                                            </div>
                                                            <div>
                                                                <h6 className="fw-bold mb-0">{m.nome}</h6>
                                                                <small className="text-muted">{m.estado}</small>
                                                            </div>
                                                        </div>
                                                        <span className={`badge ${m.status === 'ativo' ? 'bg-success' : 'bg-secondary'}`}>
                                                            {m.status}
                                                        </span>
                                                    </div>

                                                    <div className="row text-center g-0 pt-2 border-top">
                                                        <div className="col-4">
                                                            <p className="h6 fw-bold text-success mb-0">{userCount}</p>
                                                            <small className="text-muted">Usuários</small>
                                                        </div>
                                                        <div className="col-4 border-start border-end">
                                                            <p className="h6 fw-bold text-info mb-0">{alunoCount}</p>
                                                            <small className="text-muted">Alunos</small>
                                                        </div>
                                                        <div className="col-4">
                                                            <p className="h6 fw-bold text-primary mb-0">
                                                                <i className="bi bi-arrow-right"></i>
                                                            </p>
                                                            <small className="text-muted">Acessar</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                {recentMunicipios.length === 0 && (
                                    <div className="col-12 text-center py-4">
                                        <i className="bi bi-building text-muted" style={{ fontSize: 48 }}></i>
                                        <p className="text-muted mt-3 mb-0">Nenhum município cadastrado</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Solutions Summary */}
                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
                            <h5 className="mb-0 fw-semibold">
                                <i className="bi bi-lightbulb me-2 text-success"></i>
                                Soluções Educacionais
                            </h5>
                            <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => navigate('/admin/solucoes')}
                            >
                                Ver todas
                            </button>
                        </div>
                        <div className="card-body p-0">
                            {solucoes.slice(0, 5).map((solucao) => (
                                <div
                                    key={solucao.id}
                                    className="d-flex align-items-center gap-3 p-3 border-bottom"
                                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div className="d-flex align-items-center justify-content-center rounded bg-success bg-opacity-10"
                                        style={{ width: 40, height: 40 }}>
                                        <i className="bi bi-mortarboard text-success"></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <p className="mb-0 fw-medium">{solucao.nome}</p>
                                        <small className="text-muted">{solucao.descricao?.substring(0, 30) || 'Sem descrição'}...</small>
                                    </div>
                                    <span className={`badge ${solucao.status === 'ativo' ? 'bg-success' : 'bg-secondary'}`}>
                                        {solucao.status}
                                    </span>
                                </div>
                            ))}
                            {solucoes.length === 0 && (
                                <div className="text-center py-4">
                                    <p className="text-muted mb-0">Nenhuma solução cadastrada</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
