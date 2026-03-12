import '../shared/Page.css'

export function PatientProfilePage() {
  return (
    <div className="page-root">
      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">Keep your contact details and preferences up to date.</p>
      <section className="card">
        <h2>Personal Information</h2>
        <p>Form fields for name, contact, insurance, and medical notes.</p>
      </section>
    </div>
  )
}
