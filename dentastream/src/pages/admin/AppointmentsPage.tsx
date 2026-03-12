import '../shared/Page.css'

export function AppointmentsPage() {
  return (
    <div className="page-root">
      <h1 className="page-title">Appointments</h1>
      <p className="page-subtitle">Manage bookings, reschedules, and chair assignments.</p>
      <section className="card">
        <h2>Calendar View</h2>
        <p>Integrate a day/week/month calendar component here.</p>
      </section>
      <section className="card">
        <h2>Upcoming Visits</h2>
        <p>List upcoming appointments with status and quick actions.</p>
      </section>
    </div>
  )
}
