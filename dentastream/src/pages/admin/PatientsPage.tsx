import '../shared/Page.css'

export function PatientsPage() {
  return (
    <div className="page-root">
      <h1 className="page-title">Patients</h1>
      <p className="page-subtitle">Search and manage patient records and visit history.</p>
      <section className="card">
        <h2>Patient List</h2>
        <p>Table of patients with filters for name, ID, and status.</p>
      </section>
      <section className="card">
        <h2>Selected Patient</h2>
        <p>Show demographics, past treatments, and attached files.</p>
      </section>
    </div>
  )
}
