import { NavLink, Outlet } from 'react-router-dom'
import '../shared/Layout.css'

export function DoctorLayout() {
  return (
    <div className="layout-root">
      <aside className="layout-sidebar">
        <div className="layout-brand">DentaStream Doctor</div>
        <nav className="layout-nav">
          <NavLink to="/doctor" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Overview
          </NavLink>
          <NavLink to="/doctor/appointments" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Chair Schedule
          </NavLink>
          <NavLink to="/doctor/patients" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            My Patients
          </NavLink>
          <NavLink to="/doctor/chat" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Team Chat
          </NavLink>
        </nav>
      </aside>
      <div className="layout-main">
        <header className="layout-header">
          <div className="layout-header-title">Clinical Workspace</div>
          <div className="layout-header-meta">Today&apos;s cases and tasks</div>
        </header>
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
