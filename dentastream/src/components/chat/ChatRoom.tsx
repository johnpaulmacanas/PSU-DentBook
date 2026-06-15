import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { ChatService } from '../../services/ChatService';
import type { ChatChannel } from '../../types';

interface ChatRoomProps {
  title?: string;
  subtitle?: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Real-time chat UI shared by the admin, doctor and patient chat pages.
 * Channels + messages come from {@link ChatService}; live updates and the
 * subscription lifecycle are handled by the {@link useChat} hook.
 */
export function ChatRoom({
  title = 'Real-Time Chat',
  subtitle = 'Coordinate between dentists, staff, and patients.',
}: ChatRoomProps) {
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, loading: msgLoading, error, send } = useChat(
    activeChannel?.id ?? null,
    user?.id ?? null,
  );

  // Load the channels the current user belongs to
  useEffect(() => {
    let cancelled = false;
    ChatService.getMyChannels().then(({ data }) => {
      if (cancelled) return;
      setChannels(data ?? []);
      setActiveChannel(prev => prev ?? (data && data.length ? data[0] : null));
      setChannelsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Auto-scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await send(text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">{title}</h1>
        <p className="mt-1 text-sm text-dark-5">{subtitle}</p>
      </div>

      <div className="flex h-[calc(100vh-13rem)] min-h-[400px] overflow-hidden rounded-xl border border-stroke bg-white shadow-sm">
        {/* Channel list */}
        <aside className="flex w-64 shrink-0 flex-col border-r border-stroke">
          <div className="border-b border-stroke p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-dark-5">Channels</p>
          </div>
          <ul className="flex-1 divide-y divide-stroke overflow-y-auto">
            {channelsLoading && (
              <li className="px-4 py-3.5 text-sm text-dark-5">Loading channels…</li>
            )}
            {!channelsLoading && channels.length === 0 && (
              <li className="px-4 py-3.5 text-sm text-dark-5">
                No channels yet. An admin needs to add you to one.
              </li>
            )}
            {channels.map(ch => (
              <li key={ch.id}>
                <button
                  onClick={() => setActiveChannel(ch)}
                  className={[
                    'w-full px-4 py-3.5 text-left transition-colors hover:bg-gray-1',
                    activeChannel?.id === ch.id ? 'bg-primary/5' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {ch.name[0]?.toUpperCase() ?? '#'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-dark">{ch.name}</p>
                      {ch.description && (
                        <p className="truncate text-xs text-dark-5">{ch.description}</p>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Message thread */}
        <div className="flex min-w-0 flex-1 flex-col">
          {activeChannel ? (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 border-b border-stroke px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {activeChannel.name[0]?.toUpperCase() ?? '#'}
                </div>
                <div>
                  <p className="font-semibold text-dark">{activeChannel.name}</p>
                  <p className="text-xs text-green">Active</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {msgLoading && (
                  <p className="text-center text-sm text-dark-5">Loading messages…</p>
                )}
                {!msgLoading && messages.length === 0 && (
                  <p className="text-center text-sm text-dark-5">No messages yet. Say hello 👋</p>
                )}
                {messages.map(msg => {
                  const self = msg.sender_id === user?.id;
                  const senderName = msg.sender?.full_name ?? 'Unknown';
                  return (
                    <div key={msg.id} className={['flex gap-3', self ? 'flex-row-reverse' : ''].join(' ')}>
                      {!self && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-2 text-xs font-bold text-dark-4">
                          {senderName[0]?.toUpperCase() ?? '?'}
                        </div>
                      )}
                      <div className={['flex max-w-[70%] flex-col gap-1', self ? 'items-end' : 'items-start'].join(' ')}>
                        {!self && (
                          <span className="text-xs font-medium text-dark-5">{senderName}</span>
                        )}
                        <div className={[
                          'rounded-2xl px-4 py-2.5 text-sm',
                          self
                            ? 'rounded-tr-sm bg-primary text-white'
                            : 'rounded-tl-sm bg-gray-2 text-dark',
                        ].join(' ')}>
                          {msg.content}
                        </div>
                        <span className="text-xs text-dark-6">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {error && (
                <p className="border-t border-stroke bg-red-50 px-5 py-2 text-xs text-red-600">{error}</p>
              )}

              {/* Composer */}
              <div className="border-t border-stroke p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={`Message ${activeChannel.name}...`}
                    className="flex-1 rounded-full border border-stroke bg-gray-1 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                  />
                  <button
                    onClick={() => void handleSend()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90"
                    aria-label="Send"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-dark-5">
              {channelsLoading ? 'Loading…' : 'Select a channel to start chatting.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
