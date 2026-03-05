import '../shared/Page.css'

export function ChatPage() {
  return (
    <div className="page-root">
      <h1 className="page-title">Real-Time Chat</h1>
      <p className="page-subtitle">Coordinate between dentists, staff, and patients.</p>
      <div className="grid-2">
        <section className="card">
          <h2>Conversations</h2>
          <p>List of active chats or channels (Front Desk, Operatory 1, etc.).</p>
        </section>
        <section className="card">
          <h2>Message Thread</h2>
          <p>Hook this area to WebSocket / Socket.IO for live messaging.</p>
        </section>
      </div>
    </div>
  )
}
