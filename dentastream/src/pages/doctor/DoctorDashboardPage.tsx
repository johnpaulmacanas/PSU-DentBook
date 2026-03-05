import '../shared/Page.css'

export function DoctorDashboardPage() {
  return (
    <div className="page-root">
      <h1 className="page-title">Doctor Dashboard</h1>
      <p className="page-subtitle">Focus on today&apos;s chair schedule and active cases.</p>
      <div className="grid-2">
        <section className="card">
          <h2>Today&apos;s Schedule</h2>
          <p>Show your personal appointment list and chair assignments.</p>
        </section>
        <section className="card">
          <h2>Active Patients</h2>
          <p>Highlight patients currently in treatment or waiting.</p>
        </section>
      </div>
    </div>
  )
}
