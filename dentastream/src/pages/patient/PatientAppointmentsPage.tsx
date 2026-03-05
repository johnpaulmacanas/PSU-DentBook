import '../shared/Page.css'

export function PatientAppointmentsPage() {
  return (
    <div className="page-root">
      <h1 className="page-title">My Appointments</h1>
      <p className="page-subtitle">View and manage your upcoming dental visits.</p>
      <section className="card">
        <h2>Upcoming Visits</h2>
        <p>Show a list of your scheduled appointments with status.</p>
      </section>
    </div>
  )
}
