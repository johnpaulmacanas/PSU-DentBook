import { useState } from 'react'
import './Page.css'

const CONVERSATIONS = [
  { id: 1, name: 'Front Desk',    preview: 'Chair 2 patient arrived',   time: '9:02 AM', unread: 2 },
  { id: 2, name: 'Dr. Santos',    preview: "Okay, I'll cover Chair 2",  time: '8:55 AM', unread: 0 },
  { id: 3, name: 'Operatory 1',   preview: 'Patient is ready',          time: '8:40 AM', unread: 1 },
  { id: 4, name: 'Dr. Lim',       preview: 'Root canal supplies ready', time: 'Yesterday', unread: 0 },
  { id: 5, name: 'Sterilization', preview: 'Instruments processed',     time: 'Yesterday', unread: 0 },
]

const THREADS: Record<number, { me: boolean; text: string; time: string }[]> = {
  1: [
    { me: false, text: 'Good morning! Chair 2 patient just arrived.', time: '9:00 AM' },
    { me: true,  text: 'Thanks! Please ask them to fill the form.',   time: '9:01 AM' },
    { me: false, text: 'Chair 2 patient arrived and is filling form.', time: '9:02 AM' },
  ],
  2: [
    { me: true,  text: 'Dr. Santos, can you cover Chair 2 at 9:30?',  time: '8:50 AM' },
    { me: false, text: "Okay, I'll cover Chair 2.",                    time: '8:55 AM' },
  ],
  3: [
    { me: false, text: 'Patient for 9 AM is ready in Chair 1.',       time: '8:40 AM' },
    { me: true,  text: 'On my way. Thank you!',                        time: '8:41 AM' },
  ],
  4: [
    { me: false, text: 'Root canal supplies are prepped and ready.',   time: 'Yesterday' },
    { me: true,  text: 'Perfect, see you at 11 AM.',                   time: 'Yesterday' },
  ],
  5: [
    { me: false, text: 'All instruments have been processed.',         time: 'Yesterday' },
    { me: true,  text: 'Thank you!',                                   time: 'Yesterday' },
  ],
}

function initials(name: string) {
  return name.split(' ').filter(w => w).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function ChatPage() {
  const [activeId, setActiveId] = useState(1)
  const [draft, setDraft] = useState('')
  const active = CONVERSATIONS.find(c => c.id === activeId)!
  const thread = THREADS[activeId] ?? []

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Real-Time Chat</h1>
          <p className="page-subtitle">Coordinate between dentists, staff, and patients.</p>
        </div>
        <span className="badge badge-green">● Connected</span>
      </div>

      <div className="chat-layout">
        {/* Conversation list */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div className="card-header">
            <h2 className="card-title">Conversations</h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {CONVERSATIONS.map(c => (
              <div
                key={c.id}
                className={`conversation-item${activeId === c.id ? ' active' : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                <div
                  className="patient-avatar"
                  style={{ width: 38, height: 38, fontSize: '0.75rem', flexShrink: 0, background: activeId === c.id ? '#166534' : undefined, color: activeId === c.id ? '#dcfce7' : undefined }}
                >
                  {initials(c.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="conversation-name">{c.name}</span>
                    <span className="conversation-time">{c.time}</span>
                  </div>
                  <div className="conversation-preview">{c.preview}</div>
                </div>
                {c.unread > 0 && (
                  <span className="badge badge-green" style={{ minWidth: 20, justifyContent: 'center', flexShrink: 0 }}>{c.unread}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="card chat-thread">
          <div className="card-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="patient-avatar" style={{ background: '#166534', color: '#dcfce7', fontSize: '0.75rem' }}>
                {initials(active.name)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{active.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>● Online</div>
              </div>
            </div>
          </div>

          <div className="chat-messages" style={{ marginTop: '0.75rem' }}>
            {thread.map((msg, i) => (
              <div key={i} className={`chat-bubble${msg.me ? ' me' : ''}`}>
                {!msg.me && (
                  <div className="patient-avatar" style={{ width: 28, height: 28, fontSize: '0.65rem', flexShrink: 0, marginBottom: 4 }}>
                    {initials(active.name)}
                  </div>
                )}
                <div>
                  <div className="chat-bubble-content">{msg.text}</div>
                </div>
                <span className="chat-bubble-time">{msg.time}</span>
              </div>
            ))}
          </div>

          <div className="chat-input-row">
            <input
              className="chat-input"
              type="text"
              placeholder="Type a message…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setDraft('') }}
            />
            <button className="btn btn-primary" onClick={() => setDraft('')}>Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}
