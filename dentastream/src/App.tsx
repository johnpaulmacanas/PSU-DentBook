import { Route, Routes, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

// Layouts
import { Layout } from './layouts/admin/Layout'
import { PatientLayout } from './layouts/patient/PatientLayout'
import { DoctorLayout } from './layouts/doctor/DoctorLayout'

// Pages — Admin
import { DashboardPage } from './pages/admin/DashboardPage'
import { AppointmentsPage } from './pages/admin/AppointmentsPage'
import { RequestsPage } from './pages/admin/RequestsPage'
import { PatientsPage } from './pages/admin/PatientsPage'
import { StaffPage } from './pages/admin/StaffPage'
import { ChatPage } from './pages/admin/ChatPage'
import { ChannelsPage } from './pages/admin/ChannelsPage'
import { BillingPage } from './pages/admin/BillingPage'
import { ReportsPage } from './pages/admin/ReportsPage'
import { SettingsPage } from './pages/shared/SettingsPage'

// Pages — Patient
import { PatientDashboardPage } from './pages/patient/PatientDashboardPage'
import { PatientAppointmentsPage } from './pages/patient/PatientAppointmentsPage'
import { PatientRequestPage } from './pages/patient/PatientRequestPage'
import { PatientBillingPage } from './pages/patient/PatientBillingPage'
import { PatientProfilePage } from './pages/patient/PatientProfilePage'
import { PatientChatPage } from './pages/patient/PatientChatPage'

// Pages — Doctor
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage'
import { DoctorAppointmentsPage } from './pages/doctor/DoctorAppointmentsPage'
import { DoctorPatientsPage } from './pages/doctor/DoctorPatientsPage'
import { DoctorChatPage } from './pages/doctor/DoctorChatPage'

// Pages — Shared / auth
import { LoginPage } from './pages/shared/LoginPage'
import { SignUpPage } from './pages/shared/SignUpPage'

function AppRoutes() {
  const { role, loading } = useAuth()

  if (loading) return null

  // Redirect from unknown routes based on role
  const roleHome = role === 'doctor' ? '/doctor'
    : role === 'patient' ? '/patient'
    : '/'

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']}><Layout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/channels" element={<ChannelsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Patient */}
      <Route element={<ProtectedRoute allowedRoles={['patient']}><PatientLayout /></ProtectedRoute>}>
        <Route path="/patient" element={<PatientDashboardPage />} />
        <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
        <Route path="/patient/request" element={<PatientRequestPage />} />
        <Route path="/patient/billing" element={<PatientBillingPage />} />
        <Route path="/patient/profile" element={<PatientProfilePage />} />
        <Route path="/patient/chat" element={<PatientChatPage />} />
      </Route>

      {/* Doctor */}
      <Route element={<ProtectedRoute allowedRoles={['doctor']}><DoctorLayout /></ProtectedRoute>}>
        <Route path="/doctor" element={<DoctorDashboardPage />} />
        <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
        <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
        <Route path="/doctor/chat" element={<DoctorChatPage />} />
      </Route>

      <Route path="*" element={<Navigate to={roleHome} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
