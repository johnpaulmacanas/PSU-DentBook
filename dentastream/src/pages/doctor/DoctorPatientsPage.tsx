import '../shared/Page.css'

export function DoctorPatientsPage() {
  return (
    <div className="page-root">
      <h1 className="page-title">My Patients</h1>
      <p className="page-subtitle">Quick access to charts and treatment history.</p>
      <section className="card">
        <h2>Assigned Patients</h2>
        <p>Show a list of patients you are primary dentist for.</p>
      </section>
    </div>
  )
}
