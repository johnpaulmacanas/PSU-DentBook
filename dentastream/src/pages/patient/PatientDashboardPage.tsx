import '../shared/Page.css'

export function PatientDashboardPage() {
  return (
    <div className="page-root">
      <h1 className="page-title">Welcome to your patient portal</h1>
      <p className="page-subtitle">See your upcoming visits and messages from your dentist.</p>
      <div className="grid-2">
        <section className="card">
          <h2>Next Appointment</h2>
          <p>Show date, time, provider, and location details here.</p>
        </section>
        <section className="card">
          <h2>Recent Messages</h2>
          <p>List unread messages or instructions from the clinic.</p>
        </section>
      </div>
    </div>
  )
}
