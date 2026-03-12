import { NavLink, Outlet } from 'react-router-dom'
import '../shared/Layout.css'

export function PatientLayout() {
  return (
    <div className="layout-root">
      <aside className="layout-sidebar">
        <div className="layout-brand">DentaStream Patient</div>
        <nav className="layout-nav">
          <NavLink to="/patient" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Home
          </NavLink>
          <NavLink to="/patient/appointments" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            My Appointments
          </NavLink>
          <NavLink to="/patient/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Profile
          </NavLink>
          <NavLink to="/patient/chat" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Chat
          </NavLink>
        </nav>
      </aside>
      <div className="layout-main">
        <header className="layout-header">
          <div className="layout-header-title">Patient Portal</div>
          <div className="layout-header-meta">View visits and messages</div>
        </header>
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
