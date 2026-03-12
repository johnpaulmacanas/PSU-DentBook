import '../shared/Page.css'

export function PatientChatPage() {
  return (
    <div className="page-root">
      <h1 className="page-title">Messages</h1>
      <p className="page-subtitle">Secure messaging with your dentist and clinic staff.</p>
      <section className="card">
        <h2>Conversation List</h2>
        <p>List of threads like "Front Desk" or a specific provider.</p>
      </section>
    </div>
  )
}
