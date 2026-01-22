import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores'

export function Header() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    // Get breadcrumb from path
    const getBreadcrumb = () => {
        const pathParts = location.pathname.split('/').filter(Boolean)
        return pathParts.map(part => {
            return part.charAt(0).toUpperCase() + part.slice(1)
        }).join(' > ')
    }

    return (
        <header className="main-header">
            <div className="d-flex align-items-center gap-3">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0 small">
                        <li className="breadcrumb-item">
                            <i className="bi bi-house"></i>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">
                            {getBreadcrumb() || 'Home'}
                        </li>
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
                    <ul className="dropdown-menu dropdown-menu-end">
                        <li><a className="dropdown-item" href="#"><i className="bi bi-person me-2"></i>Meu Perfil</a></li>
                        <li><a className="dropdown-item" href="#"><i className="bi bi-gear me-2"></i>Configurações</a></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                            <button className="dropdown-item text-danger" onClick={handleLogout}>
                                <i className="bi bi-box-arrow-right me-2"></i>Sair
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    )
}
