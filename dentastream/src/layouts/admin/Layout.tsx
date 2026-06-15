import { NavLink, Outlet } from 'react-router-dom'
import '../shared/Layout.css'

export function Layout() {
  return (
    <div className="layout-root">
      <aside className="layout-sidebar">
        <div className="layout-brand">DentaStream</div>
        <nav className="layout-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/appointments" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Appointments
          </NavLink>
          <NavLink to="/admin/patients" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Patients
          </NavLink>
          <NavLink to="/admin/chat" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Chat
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Settings
          </NavLink>
        </nav>
      </aside>
      <div className="layout-main">
        <header className="layout-header">
          <div className="layout-header-title">Clinical Workflow Automation</div>
          <div className="layout-header-meta">DentaStream</div>
        </header>
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
