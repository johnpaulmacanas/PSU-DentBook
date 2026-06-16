import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ClinicSettingsService } from '../../services/ClinicSettingsService';

const DEFAULT_SETTINGS: Record<string, string> = {
  clinic_name: 'DentaStream Dental Clinic',
  open_time: '08:00',
  close_time: '18:00',
  slot_duration_minutes: '30',
};

const NOTIFICATION_PREFS = [
  { key: 'notify_reminder', label: 'Send reminder before appointment', defaultChecked: true },
  { key: 'notify_cancel', label: 'Notify on cancellation', defaultChecked: true },
  { key: 'notify_digest', label: 'Daily schedule digest', defaultChecked: false },
  { key: 'notify_supply', label: 'Low supply alerts', defaultChecked: false },
];

/** Settings page — admin can read and write; doctor/patient see read-only clinic info. */
export function SettingsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await ClinicSettingsService.getAll();
      if (data) setSettings(prev => ({ ...prev, ...data }));
      setLoading(false);
    })();
  }, []);

  function updateField(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setNotice(null);
    const { error } = await ClinicSettingsService.upsertMany(settings);
    setSaving(false);
    if (error) { setNotice(`Error: ${error}`); return; }
    setNotice('Settings saved successfully.');
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-dark-5">Loading settings…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Settings</h1>
        <p className="mt-1 text-sm text-dark-5">
          {isAdmin ? 'Configure clinic hours, roles, and notification rules.' : 'View clinic configuration.'}
        </p>
      </div>

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-light/20 text-green'}`}>
          {notice}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Clinic configuration */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-dark">Clinic Configuration</h2>
          <div className="space-y-4">
            {[
              { key: 'clinic_name', label: 'Clinic Name', type: 'text' },
              { key: 'open_time', label: 'Clinic Hours (Open)', type: 'time' },
              { key: 'close_time', label: 'Clinic Hours (Close)', type: 'time' },
              { key: 'slot_duration_minutes', label: 'Slot Duration (minutes)', type: 'number' },
            ].map(field => (
              <div key={field.key}>
                <label className="mb-1.5 block text-xs font-medium text-dark-5">{field.label}</label>
                <input
                  type={field.type}
                  value={settings[field.key] ?? ''}
                  onChange={e => updateField(field.key, e.target.value)}
                  readOnly={!isAdmin}
                  className={[
                    'w-full rounded-lg border border-stroke bg-gray-1 px-3.5 py-2.5 text-sm text-dark outline-none transition-colors focus:border-primary',
                    !isAdmin ? 'cursor-default opacity-70' : '',
                  ].join(' ')}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notification rules */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-dark">Notification Rules</h2>
          <div className="space-y-4">
            {NOTIFICATION_PREFS.map(item => (
              <label key={item.key} className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm text-dark">{item.label}</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    defaultChecked={settings[item.key] === 'true' || (!settings[item.key] && item.defaultChecked)}
                    onChange={e => updateField(item.key, String(e.target.checked))}
                    disabled={!isAdmin}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-9 rounded-full bg-gray-3 transition-colors peer-checked:bg-primary" />
                  <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
