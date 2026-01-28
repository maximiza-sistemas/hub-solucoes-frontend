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
} from '@/pages/admin'

// Municipio Pages
import {
  MunicipioDashboardPage,
  MunicipioSolucoesPage,
  MunicipioAlunosPage,
  MunicipioUsuariosPage,
  MunicipioEscolasPage,
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

  if (user?.perfil !== 'admin') {
    return <Navigate to={`/municipio/${user?.municipioId}/solucoes`} replace />
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
              <AdminRoute>
                <MunicipiosPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/municipios/novo"
            element={
              <AdminRoute>
                <MunicipioFormPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/municipios/:id/editar"
            element={
              <AdminRoute>
                <MunicipioFormPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/solucoes"
            element={
              <AdminRoute>
                <SolucoesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/solucoes/nova"
            element={
              <AdminRoute>
                <SolucaoFormPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/solucoes/:id/editar"
            element={
              <AdminRoute>
                <SolucaoFormPage />
              </AdminRoute>
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

          {/* Municipio Routes */}
          <Route path="/municipio/:municipioId/dashboard" element={<MunicipioDashboardPage />} />
          <Route path="/municipio/:municipioId/solucoes" element={<MunicipioSolucoesPage />} />
          <Route path="/municipio/:municipioId/usuarios" element={<MunicipioUsuariosPage />} />
          <Route path="/municipio/:municipioId/alunos" element={<MunicipioAlunosPage />} />
          <Route path="/municipio/:municipioId/escolas" element={<MunicipioEscolasPage />} />
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
