import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, useDataStore } from '@/stores'

export function Header() {
    const { user, logout } = useAuthStore()
    const { municipios } = useDataStore()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    // Route name mapping for better readability
    const routeNames: Record<string, string> = {
        'admin': 'Administração',
        'dashboard': 'Dashboard',
        'municipios': 'Municípios',
        'solucoes': 'Soluções',
        'usuarios': 'Usuários',
        'perfil': 'Meu Perfil',
        'configuracoes': 'Configurações',
        'municipio': 'Município',
        'alunos': 'Alunos',
        'escolas': 'Escolas',
        'professores': 'Professores',
        'turmas': 'Turmas'
    }

    // Check if a string is a UUID
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

    // Get breadcrumb from path with friendly names
    const getBreadcrumbs = () => {
        const pathParts = location.pathname.split('/').filter(Boolean)
        const breadcrumbs: { label: string; path: string; isActive: boolean }[] = []

        let currentPath = ''
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i]
            currentPath += `/${part}`

            // Check if it's a UUID (likely a municipio ID)
            if (isUUID(part)) {
                const municipio = municipios.find(m => m.id === part)
                breadcrumbs.push({
                    label: municipio?.nome || 'Município',
                    path: currentPath,
                    isActive: i === pathParts.length - 1
                })
            } else {
                breadcrumbs.push({
                    label: routeNames[part] || part.charAt(0).toUpperCase() + part.slice(1),
                    path: currentPath,
                    isActive: i === pathParts.length - 1
                })
            }
        }

        return breadcrumbs
    }

    const breadcrumbs = getBreadcrumbs()

    return (
        <header className="main-header">
            <div className="d-flex align-items-center gap-3">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0 small">
                        <li className="breadcrumb-item">
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/dashboard'); }} className="text-muted text-decoration-none">
                                <i className="bi bi-house"></i>
                            </a>
                        </li>
                        {breadcrumbs.map((item, index) => (
                            <li
                                key={index}
                                className={`breadcrumb-item ${item.isActive ? 'active fw-medium' : ''}`}
                                aria-current={item.isActive ? 'page' : undefined}
                            >
                                {item.isActive ? (
                                    item.label
                                ) : (
                                    <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                                        className="text-decoration-none"
                                    >
                                        {item.label}
                                    </a>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>

            <div className="d-flex align-items-center gap-3">
                {/* Search */}
                <div className="input-group" style={{ width: 250 }}>
                    <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                        type="text"
                        className="form-control bg-light border-start-0"
                        placeholder="Buscar..."
                    />
                </div>

                {/* Notifications */}
                <button className="btn btn-light position-relative">
                    <i className="bi bi-bell"></i>
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: 10 }}>
                        3
                    </span>
                </button>

                {/* User Menu */}
                <div className="dropdown">
                    <button
                        className="btn btn-light dropdown-toggle d-flex align-items-center gap-2"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white"
                            style={{ width: 32, height: 32, fontSize: 12 }}>
                            {user?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="text-start d-none d-md-block">
                            <div className="small fw-medium">{user?.nome}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>{user?.perfil}</div>
                        </div>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0" style={{ minWidth: 220 }}>
                        <li className="px-3 py-2 border-bottom">
                            <div className="d-flex align-items-center gap-2">
                                <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white"
                                    style={{ width: 40, height: 40, fontSize: 14 }}>
                                    {user?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                </div>
                                <div>
                                    <div className="fw-semibold">{user?.nome}</div>
                                    <div className="text-muted small">{user?.email}</div>
                                </div>
                            </div>
                        </li>
                        <li><a className="dropdown-item py-2" href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/perfil'); }}><i className="bi bi-person me-2 text-primary"></i>Meu Perfil</a></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                            <button className="dropdown-item py-2 text-danger" onClick={handleLogout}>
                                <i className="bi bi-box-arrow-right me-2"></i>Sair da Conta
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    )
}
