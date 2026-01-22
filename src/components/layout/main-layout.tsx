import { Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { useAuthStore } from '@/stores'

export function MainLayout() {
    const { isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return (
        <div className="d-flex min-vh-100">
            <Sidebar />
            <div className="main-content flex-grow-1">
                <Header />
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
