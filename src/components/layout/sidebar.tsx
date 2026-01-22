import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores'

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const { user } = useAuthStore()

    const isAdmin = user?.perfil === 'admin'

    const adminMenuItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
        { path: '/admin/municipios', label: 'Municípios', icon: 'bi-building' },
        { path: '/admin/usuarios', label: 'Usuários', icon: 'bi-people' },
    ]

    const municipioMenuItems = [
        { path: `/municipio/${user?.municipioId}/dashboard`, label: 'Dashboard', icon: 'bi-speedometer2' },
        { path: `/municipio/${user?.municipioId}/solucoes`, label: 'Soluções', icon: 'bi-mortarboard' },
        { path: `/municipio/${user?.municipioId}/escolas`, label: 'Escolas', icon: 'bi-building' },
        { path: `/municipio/${user?.municipioId}/usuarios`, label: 'Usuários', icon: 'bi-people' },
        { path: `/municipio/${user?.municipioId}/alunos`, label: 'Alunos', icon: 'bi-person-badge' },
        { path: `/municipio/${user?.municipioId}/relatorios`, label: 'Relatórios', icon: 'bi-bar-chart' },
    ]

    const menuItems = isAdmin ? adminMenuItems : municipioMenuItems

    return (
        <div className={`sidebar d-flex flex-column ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Header com Logo MAXIMIZA */}
            <div className="sidebar-header">
                {!isCollapsed ? (
                    <img
                        src="/logo-maximiza.png"
                        alt="MAXIMIZA Soluções Educacionais"
                        className="sidebar-logo"
                        style={{ maxHeight: 40, width: 'auto' }}
                    />
                ) : (
                    <div className="d-flex align-items-center justify-content-center rounded"
                        style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #00a8e8 0%, #1e3a5f 100%)' }}>
                        <span className="fw-bold text-white" style={{ fontSize: 16 }}>M</span>
                    </div>
                )}
                <button
                    className="btn btn-link text-white ms-auto p-0"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
                </button>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav flex-grow-1">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `sidebar-nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <i className={`bi ${item.icon}`}></i>
                        {!isCollapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* User Info */}
            <div className="p-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="d-flex align-items-center gap-2">
                    <div className="d-flex align-items-center justify-content-center rounded-circle text-white"
                        style={{ width: 36, height: 36, fontSize: 14, background: 'linear-gradient(135deg, #00a8e8 0%, #1e3a5f 100%)' }}>
                        {user?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    {!isCollapsed && (
                        <div className="text-white small overflow-hidden">
                            <div className="fw-medium text-truncate" style={{ maxWidth: 150 }}>{user?.nome}</div>
                            <div className="text-white-50 small">{user?.perfil}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
