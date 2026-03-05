import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/appointments': 'Appointments',
  '/patients': 'Patients',
  '/chat': 'Chat',
  '/settings': 'Settings',
}

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconTooth() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C9 2 6 4 6 7c0 2 1 3.5 1 5.5C7 16 8 22 10 22c1 0 1.5-2 2-4 .5 2 1 4 2 4 2 0 3-6 3-9.5 0-2 1-3.5 1-5.5 0-3-3-5-6-5z" />
    </svg>
  )
}

const navItems = [
  { to: '/', end: true, label: 'Dashboard', Icon: IconDashboard },
  { to: '/appointments', end: false, label: 'Appointments', Icon: IconCalendar },
  { to: '/patients', end: false, label: 'Patients', Icon: IconUsers },
  { to: '/chat', end: false, label: 'Chat', Icon: IconChat },
  { to: '/settings', end: false, label: 'Settings', Icon: IconSettings },
]

export function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation()
  const pageTitle = routeTitles[pathname] ?? 'DentaStream'

  return (
    <div className="layout-root">
      <aside className="layout-sidebar">
        <div className="layout-brand">
          <span className="layout-brand-icon"><IconTooth /></span>
          <span>DentaStream</span>
        </div>
        <nav className="layout-nav">
          {navItems.map(({ to, end, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <span className="nav-icon"><Icon /></span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="layout-sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">DR</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Dr. Reyes</div>
              <div className="sidebar-user-role">Admin</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="layout-main">
        <header className="layout-header">
          <div className="layout-header-left">
            <h1 className="layout-page-title">{pageTitle}</h1>
          </div>
          <div className="layout-header-right">
            <div className="header-search">
              <span className="header-search-icon"><IconSearch /></span>
              <input className="header-search-input" type="search" placeholder="Search patients, appointments…" aria-label="Search patients and appointments" />
            </div>
            <button className="header-icon-btn" aria-label="Notifications">
              <IconBell />
              <span className="header-badge">3</span>
            </button>
            <div className="header-avatar">DR</div>
          </div>
        </header>
        <main className="layout-content">{children}</main>
      </div>
    </div>
  )
}
