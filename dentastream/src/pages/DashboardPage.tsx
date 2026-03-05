import './Page.css'

export function DashboardPage() {
  return (
    <div className="page-root">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">
        Overview of today&apos;s clinical workflow and appointments.
      </p>
      <div className="grid-2">
        <section className="card">
          <h2>Today&apos;s Appointments</h2>
          <p>Show schedule summary, chair utilization, and booking stats here.</p>
        </section>
        <section className="card">
          <h2>Real-Time Queue</h2>
          <p>Display who is waiting, in treatment, or finished.</p>
        </section>
      </div>
    </div>
  )
}
