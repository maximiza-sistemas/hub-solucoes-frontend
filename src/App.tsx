import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'

// Layout
import { MainLayout } from '@/components/layout'

// Landing Page
import { LandingPage } from '@/pages/landing'

// Auth Pages
import { LoginPage } from '@/pages/auth'

// Admin Pages
import {
  MunicipiosPage,
  MunicipioFormPage,
  SolucoesPage,
  SolucaoFormPage,
  UsuariosPage,
  DashboardPage,
  PerfilPage,
  ConfiguracoesPage,
  GestorEscolasPage,
} from '@/pages/admin'

// Municipio Pages
import {
  MunicipioDashboardPage,
  MunicipioSolucoesPage,
  MunicipioAlunosPage,
  MunicipioUsuariosPage,
  MunicipioEscolasPage,
  MunicipioRegioesPage,
  MunicipioGruposPage,
  MunicipioTurmasPage,
} from '@/pages/municipio'

// Auth Guard
import { useAuthStore } from '@/stores'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN' && user?.role !== 'GESTOR') {
    return <Navigate to={`/municipio/${user?.municipioId}/solucoes`} replace />
  }

  return <>{children}</>
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()

  if (user?.role !== 'SUPERADMIN') {
    const redirectTo = user?.role === 'ADMIN'
      ? '/admin/dashboard'
      : `/municipio/${user?.municipioId}/solucoes`
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <DashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/municipios"
            element={
              <SuperAdminRoute>
                <MunicipiosPage />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin/municipios/novo"
            element={
              <SuperAdminRoute>
                <MunicipioFormPage />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin/municipios/:id/editar"
            element={
              <SuperAdminRoute>
                <MunicipioFormPage />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin/solucoes"
            element={
              <SuperAdminRoute>
                <SolucoesPage />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin/solucoes/nova"
            element={
              <SuperAdminRoute>
                <SolucaoFormPage />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin/solucoes/:id/editar"
            element={
              <SuperAdminRoute>
                <SolucaoFormPage />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <AdminRoute>
                <UsuariosPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/perfil"
            element={
              <PerfilPage />
            }
          />
          <Route
            path="/admin/configuracoes"
            element={
              <ConfiguracoesPage />
            }
          />

          <Route
            path="/admin/escolas"
            element={
              <AdminRoute>
                <MunicipioEscolasPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/turmas"
            element={
              <AdminRoute>
                <MunicipioTurmasPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/alunos"
            element={
              <AdminRoute>
                <MunicipioAlunosPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/grupos"
            element={
              <AdminRoute>
                <MunicipioGruposPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/regioes"
            element={
              <AdminRoute>
                <MunicipioRegioesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/gestor-escolas"
            element={
              <AdminRoute>
                <GestorEscolasPage />
              </AdminRoute>
            }
          />

          {/* Municipio Routes */}
          <Route path="/municipio/:municipioId/dashboard" element={<MunicipioDashboardPage />} />
          <Route path="/municipio/:municipioId/solucoes" element={<MunicipioSolucoesPage />} />
          <Route path="/municipio/:municipioId/usuarios" element={<MunicipioUsuariosPage />} />
          <Route path="/municipio/:municipioId/alunos" element={<MunicipioAlunosPage />} />
          <Route path="/municipio/:municipioId/escolas" element={<MunicipioEscolasPage />} />
          <Route path="/municipio/:municipioId/regioes" element={<MunicipioRegioesPage />} />
          <Route path="/municipio/:municipioId/grupos" element={<MunicipioGruposPage />} />
          <Route path="/municipio/:municipioId/turmas" element={<MunicipioTurmasPage />} />
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
