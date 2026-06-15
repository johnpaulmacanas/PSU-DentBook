import { Route, Routes, Navigate } from 'react-router-dom'
import { Layout } from './layouts/admin/Layout'
import { PatientLayout } from './layouts/patient/PatientLayout'
import { DoctorLayout } from './layouts/doctor/DoctorLayout'
import { LoginPage } from './pages/shared/LoginPage'
import { WelcomePage } from './pages/shared/WelcomePage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { AppointmentsPage } from './pages/admin/AppointmentsPage'
import { PatientsPage } from './pages/admin/PatientsPage'
import { ChatPage } from './pages/admin/ChatPage'
import { SettingsPage } from './pages/shared/SettingsPage'
import { PatientDashboardPage } from './pages/patient/PatientDashboardPage'
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage'
import { PatientAppointmentsPage } from './pages/patient/PatientAppointmentsPage'
import { PatientProfilePage } from './pages/patient/PatientProfilePage'
import { PatientChatPage } from './pages/patient/PatientChatPage'
import { DoctorAppointmentsPage } from './pages/doctor/DoctorAppointmentsPage'
import { DoctorPatientsPage } from './pages/doctor/DoctorPatientsPage'
import { DoctorChatPage } from './pages/doctor/DoctorChatPage'

function App() {
  // TODO: replace with real auth/role logic
  const isAuthenticated = true

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />

      {/* Admin UI (existing) */}
      <Route element={<Layout />}>
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/appointments" element={<AppointmentsPage />} />
        <Route path="/admin/patients" element={<PatientsPage />} />
        <Route path="/admin/chat" element={<ChatPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>

      {/* Patient UI */}
      <Route element={<PatientLayout />}>
        <Route path="/patient" element={<PatientDashboardPage />} />
        <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
        <Route path="/patient/profile" element={<PatientProfilePage />} />
        <Route path="/patient/chat" element={<PatientChatPage />} />
      </Route>

      {/* Doctor UI */}
      <Route element={<DoctorLayout />}>
        <Route path="/doctor" element={<DoctorDashboardPage />} />
        <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
        <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
        <Route path="/doctor/chat" element={<DoctorChatPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
