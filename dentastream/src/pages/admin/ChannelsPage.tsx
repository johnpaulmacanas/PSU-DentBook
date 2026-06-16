import { useCallback, useEffect, useState } from 'react';
import { ChatService } from '../../services/ChatService';
import { ProfileService } from '../../services/ProfileService';
import { Field, controlClass } from '../../components/ui/Field';
import { useAuth } from '../../context/AuthContext';
import type { ChatChannel, Profile } from '../../types';

/**
 * Admin chat-channel management: create a channel and add members. Without this,
 * the chat surface is empty (channels + members are admin-managed via RLS).
 */
export function ChannelsPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Create-channel form.
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Add-member form.
  const [activeChannel, setActiveChannel] = useState<string>('');
  const [memberId, setMemberId] = useState<string>('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [channelsRes, profilesRes] = await Promise.all([
      ChatService.getMyChannels(),
      ProfileService.listAll(),
    ]);
    if (channelsRes.error) { setError(channelsRes.error); setLoading(false); return; }
    if (profilesRes.error) { setError(profilesRes.error); setLoading(false); return; }
    setChannels(channelsRes.data ?? []);
    setProfiles(profilesRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createChannel() {
    if (!user || !name.trim()) { setError('Channel name is required.'); return; }
    setCreating(true);
    setError(null);
    setNotice(null);
    const { data, error } = await ChatService.createChannel(name, description, user.id);
    setCreating(false);
    if (error) { setError(error); return; }
    setName('');
    setDescription('');
    // Auto-add the creating admin so the channel is immediately visible/usable.
    if (data) await ChatService.joinChannel(data.id, user.id);
    setNotice('Channel created.');
    await load();
  }

  async function addMember() {
    if (!activeChannel || !memberId) { setError('Pick a channel and a member.'); return; }
    setAdding(true);
    setError(null);
    setNotice(null);
    const { error } = await ChatService.joinChannel(activeChannel, memberId);
    setAdding(false);
    if (error) { setError(error); return; }
    setNotice('Member added.');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Chat Channels</h1>
        <p className="mt-1 text-sm text-dark-5">Create channels and add members so staff and patients can message.</p>
      </div>

      {notice && <p className="rounded-lg bg-green-light/20 px-3 py-2 text-sm text-green">{notice}</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Create channel */}
        <section className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-dark">Create Channel</h2>
          <div className="flex flex-col gap-4">
            <Field label="Name" required>
              <input className={controlClass} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Front Desk" />
            </Field>
            <Field label="Description">
              <input className={controlClass} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
            </Field>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void createChannel()}
                disabled={creating}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {creating ? 'Creating…' : 'Create Channel'}
              </button>
            </div>
          </div>
        </section>

        {/* Add member */}
        <section className="rounded-xl border border-stroke bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-dark">Add Member</h2>
          <div className="flex flex-col gap-4">
            <Field label="Channel" required>
              <select className={controlClass} value={activeChannel} onChange={e => setActiveChannel(e.target.value)}>
                <option value="">Select a channel…</option>
                {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Member" required>
              <select className={controlClass} value={memberId} onChange={e => setMemberId(e.target.value)}>
                <option value="">Select a person…</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void addMember()}
                disabled={adding}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {adding ? 'Adding…' : 'Add to Channel'}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Existing channels */}
      <section className="rounded-xl border border-stroke bg-white shadow-sm">
        <div className="border-b border-stroke px-5 py-4">
          <h2 className="font-semibold text-dark">Channels</h2>
        </div>
        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">Loading…</p>
        ) : channels.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-dark-5">No channels yet. Create one above.</p>
        ) : (
          <ul className="divide-y divide-stroke">
            {channels.map(c => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-dark">{c.name}</p>
                  {c.description && <p className="text-xs text-dark-5">{c.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
