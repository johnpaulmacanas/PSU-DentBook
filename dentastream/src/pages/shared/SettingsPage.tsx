export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Settings</h1>
        <p className="mt-1 text-sm text-dark-5">Configure clinic hours, roles, and notification rules.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Clinic configuration */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-dark">Clinic Configuration</h2>
          <div className="space-y-4">
            {[
              { label: 'Clinic Name', value: 'DentaStream Dental Clinic', type: 'text' },
              { label: 'Clinic Hours (Open)', value: '08:00', type: 'time' },
              { label: 'Clinic Hours (Close)', value: '18:00', type: 'time' },
              { label: 'Slot Duration (minutes)', value: '30', type: 'number' },
            ].map(field => (
              <div key={field.label}>
                <label className="mb-1.5 block text-xs font-medium text-dark-5">{field.label}</label>
                <input
                  type={field.type}
                  defaultValue={field.value}
                  className="w-full rounded-lg border border-stroke bg-gray-1 px-3.5 py-2.5 text-sm text-dark outline-none transition-colors focus:border-primary"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notification rules */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-dark">Notification Rules</h2>
          <div className="space-y-4">
            {[
              { label: 'Send reminder before appointment', checked: true },
              { label: 'Notify on cancellation', checked: true },
              { label: 'Daily schedule digest', checked: false },
              { label: 'Low supply alerts', checked: false },
            ].map(item => (
              <label key={item.label} className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm text-dark">{item.label}</span>
                <div className="relative">
                  <input type="checkbox" defaultChecked={item.checked} className="peer sr-only" />
                  <div className="h-5 w-9 rounded-full bg-gray-3 transition-colors peer-checked:bg-primary" />
                  <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  )
}
