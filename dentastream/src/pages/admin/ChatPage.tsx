import { useState } from 'react'

const CHANNELS = [
  { id: 1, name: 'Front Desk', lastMsg: 'Next patient ready at Room 2.', time: '10:42', unread: 2 },
  { id: 2, name: 'Operatory 1', lastMsg: 'Can I get suction assist?', time: '10:35', unread: 0 },
  { id: 3, name: 'Operatory 2', lastMsg: 'Patient is numb, proceeding.', time: '10:20', unread: 0 },
  { id: 4, name: 'Lab Channel', lastMsg: 'Impression ready for pickup.', time: '09:58', unread: 1 },
  { id: 5, name: 'Dr. Reyes', lastMsg: "I'll be 5 mins late for my 11am.", time: 'Yesterday', unread: 0 },
]

type Message = { from: string; text: string; time: string; self: boolean }

const THREAD: Record<number, Message[]> = {
  1: [
    { from: 'Receptionist', text: 'Patient Juan dela Cruz checked in.', time: '10:01', self: false },
    { from: 'Nurse Ana', text: 'Directing to Room 1.', time: '10:03', self: false },
    { from: 'You', text: 'Thanks, will be right there.', time: '10:05', self: true },
    { from: 'Receptionist', text: 'Next patient ready at Room 2.', time: '10:42', self: false },
  ],
  2: [
    { from: 'Dr. Lim', text: 'Can I get suction assist?', time: '10:35', self: false },
  ],
  3: [
    { from: 'Dr. Tan', text: 'Patient is numb, proceeding.', time: '10:20', self: false },
  ],
  4: [
    { from: 'Lab Tech', text: 'Impression ready for pickup.', time: '09:58', self: false },
  ],
  5: [
    { from: 'Dr. Reyes', text: "I'll be 5 mins late for my 11am.", time: 'Yesterday', self: false },
  ],
}

export function ChatPage() {
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0])
  const [input, setInput] = useState('')

  const messages = THREAD[activeChannel.id] ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Real-Time Chat</h1>
        <p className="mt-1 text-sm text-dark-5">Coordinate between dentists, staff, and patients.</p>
      </div>

      <div className="flex h-[calc(100vh-13rem)] min-h-[400px] overflow-hidden rounded-xl border border-stroke bg-white shadow-sm">
        {/* Channel list */}
        <aside className="w-64 shrink-0 border-r border-stroke flex flex-col">
          <div className="border-b border-stroke p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-dark-5">Channels</p>
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-stroke">
            {CHANNELS.map(ch => (
              <li key={ch.id}>
                <button
                  onClick={() => setActiveChannel(ch)}
                  className={[
                    'w-full text-left px-4 py-3.5 transition-colors hover:bg-gray-1',
                    activeChannel.id === ch.id ? 'bg-primary/5' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {ch.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-dark">{ch.name}</p>
                        <p className="truncate text-xs text-dark-5">{ch.lastMsg}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-dark-5">{ch.time}</p>
                      {ch.unread > 0 && (
                        <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                          {ch.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Message thread */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Thread header */}
          <div className="flex items-center gap-3 border-b border-stroke px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {activeChannel.name[0]}
            </div>
            <div>
              <p className="font-semibold text-dark">{activeChannel.name}</p>
              <p className="text-xs text-green">Active</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={['flex gap-3', msg.self ? 'flex-row-reverse' : ''].join(' ')}>
                {!msg.self && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-2 text-xs font-bold text-dark-4">
                    {msg.from[0]}
                  </div>
                )}
                <div className={['max-w-[70%]', msg.self ? 'items-end' : 'items-start', 'flex flex-col gap-1'].join(' ')}>
                  {!msg.self && (
                    <span className="text-xs font-medium text-dark-5">{msg.from}</span>
                  )}
                  <div className={[
                    'rounded-2xl px-4 py-2.5 text-sm',
                    msg.self
                      ? 'rounded-tr-sm bg-primary text-white'
                      : 'rounded-tl-sm bg-gray-2 text-dark',
                  ].join(' ')}>
                    {msg.text}
                  </div>
                  <span className="text-xs text-dark-6">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-stroke p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Message ${activeChannel.name}...`}
                className="flex-1 rounded-full border border-stroke bg-gray-1 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                onKeyDown={e => e.key === 'Enter' && setInput('')}
              />
              <button
                onClick={() => setInput('')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                aria-label="Send"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
