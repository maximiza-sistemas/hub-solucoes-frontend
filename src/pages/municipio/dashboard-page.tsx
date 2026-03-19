import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore } from '@/stores'
import { PageLoading } from '@/components/ui'

export function MunicipioDashboardPage() {
    const { municipioId } = useParams()
    const navigate = useNavigate()
    const {
        municipios,
        solucoes,
        alunos,
        escolas,
        fetchMunicipios,
        fetchSolucoes,
        fetchAlunos,
        fetchEscolas,
    } = useDataStore()

    const munId = Number(municipioId)
    const [initialLoading, setInitialLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetchMunicipios(),
            fetchSolucoes(munId),
            fetchAlunos(munId),
            fetchEscolas(munId),
        ]).finally(() => setInitialLoading(false))
    }, [munId, fetchMunicipios, fetchSolucoes, fetchAlunos, fetchEscolas])

    if (initialLoading) return <PageLoading />

    const municipio = municipios.find((m) => m.id === munId)
    const municipioAlunos = alunos
    const municipioEscolas = escolas

    if (!municipio) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ height: '50vh' }}>
                <div className="text-center">
                    <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: 48 }}></i>
                    <p className="text-muted mt-3">Município não encontrado</p>
                    <button className="btn btn-primary mt-2" onClick={() => navigate('/admin/municipios')}>
                        Voltar aos Municípios
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/admin/municipios')}>
                            <i className="bi bi-arrow-left"></i>
                        </button>
                        <h1 className="h3 fw-bold text-dark mb-0">{municipio.nome}</h1>
                        <span className={`badge ${municipio.ativo ? 'bg-success' : 'bg-secondary'}`}>
                            {municipio.ativo ? 'ativo' : 'inativo'}
                        </span>
                    </div>
                    <p className="text-muted mb-0">Ambiente de Gestão Educacional</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-4">
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm h-100" style={{ cursor: 'pointer' }} onClick={() => navigate(`/municipio/${municipioId}/solucoes`)}>
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted small mb-1">Soluções Ativas</p>
                                    <h3 className="h2 fw-bold mb-0 text-primary">{solucoes.length}</h3>
                                </div>
                                <div className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10" style={{ width: 48, height: 48 }}>
                                    <i className="bi bi-lightbulb text-primary" style={{ fontSize: 24 }}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm h-100" style={{ cursor: 'pointer' }} onClick={() => navigate(`/municipio/${municipioId}/usuarios`)}>
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted small mb-1">Usuários</p>
                                    <h3 className="h2 fw-bold mb-0 text-success">{municipio.totalUsuarios}</h3>
                                </div>
                                <div className="d-flex align-items-center justify-content-center rounded-3 bg-success bg-opacity-10" style={{ width: 48, height: 48 }}>
                                    <i className="bi bi-people text-success" style={{ fontSize: 24 }}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm h-100" style={{ cursor: 'pointer' }} onClick={() => navigate(`/municipio/${municipioId}/alunos`)}>
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted small mb-1">Alunos Cadastrados</p>
                                    <h3 className="h2 fw-bold mb-0 text-info">{municipioAlunos.length}</h3>
                                </div>
                                <div className="d-flex align-items-center justify-content-center rounded-3 bg-info bg-opacity-10" style={{ width: 48, height: 48 }}>
                                    <i className="bi bi-mortarboard text-info" style={{ fontSize: 24 }}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm h-100" style={{ cursor: 'pointer' }} onClick={() => navigate(`/municipio/${municipioId}/escolas`)}>
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted small mb-1">Escolas</p>
                                    <h3 className="h2 fw-bold mb-0 text-warning">{municipioEscolas.length}</h3>
                                </div>
                                <div className="d-flex align-items-center justify-content-center rounded-3 bg-warning bg-opacity-10" style={{ width: 48, height: 48 }}>
                                    <i className="bi bi-building text-warning" style={{ fontSize: 24 }}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Soluções */}
                <div className="col-12 col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
                            <h5 className="mb-0 fw-semibold"><i className="bi bi-lightbulb me-2 text-primary"></i>Soluções Educacionais</h5>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/municipio/${municipioId}/solucoes`)}>Ver todas</button>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                {solucoes.slice(0, 4).map((solucao) => (
                                    <div key={solucao.id} className="col-12 col-md-6">
                                        <div className="p-3 rounded-3 border d-flex align-items-center gap-3" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#3b82f6' }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#dee2e6' }}>
                                            <div className="d-flex align-items-center justify-content-center rounded bg-primary bg-opacity-10" style={{ width: 40, height: 40 }}>
                                                <i className="bi bi-mortarboard text-primary"></i>
                                            </div>
                                            <div className="flex-grow-1">
                                                <p className="fw-medium mb-0">{solucao.nome}</p>
                                                <p className="text-muted small mb-0">{solucao.descricao?.substring(0, 50) || 'Sem descrição'}...</p>
                                            </div>
                                            {solucao.link && (
                                                <a href={solucao.link} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-link">
                                                    <i className="bi bi-box-arrow-up-right"></i>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {solucoes.length === 0 && (
                                    <div className="col-12 text-center py-4">
                                        <p className="text-muted mb-0">Nenhuma solução cadastrada</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Últimos Alunos */}
                <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
                            <h5 className="mb-0 fw-semibold"><i className="bi bi-mortarboard me-2 text-info"></i>Últimos Alunos</h5>
                            <button className="btn btn-sm btn-outline-info" onClick={() => navigate(`/municipio/${municipioId}/alunos`)}>Ver todos</button>
                        </div>
                        <div className="card-body p-0">
                            {municipioAlunos.slice(0, 5).map((aluno) => (
                                <div key={aluno.id} className="d-flex align-items-center gap-3 p-3 border-bottom">
                                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-info bg-opacity-10 text-info" style={{ width: 40, height: 40, fontSize: 14 }}>
                                        {aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                    </div>
                                    <div className="flex-grow-1">
                                        <p className="fw-medium mb-0">{aluno.nome}</p>
                                        <p className="text-muted small mb-0">Matrícula: {aluno.matricula}</p>
                                    </div>
                                </div>
                            ))}
                            {municipioAlunos.length === 0 && (
                                <div className="text-center py-4">
                                    <p className="text-muted mb-0">Nenhum aluno cadastrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
