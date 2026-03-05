import './Page.css'

export function SettingsPage() {
  return (
    <div className="page-root">
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Configure clinic hours, roles, and notification rules.</p>
      <section className="card">
        <h2>Clinic Configuration</h2>
        <p>Set booking rules, time slots, and conflict policies.</p>
      </section>
    </div>
  )
}
