import { MESSENGER_URL, FB_PAGE_URL } from '../../lib/clinic';

/**
 * Patient chat page — redirects to the clinic's Facebook Page Messenger.
 * The legacy Facebook Chat Plugin is deprecated; m.me links are the current
 * recommended approach for patient-facing Messenger integration.
 */
export function PatientChatPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Chat with Us</h1>
        <p className="mt-1 text-sm text-dark-5">
          Reach DentaStream Dental Clinic directly through Facebook Messenger.
        </p>
      </div>

      <div className="mx-auto mt-4 max-w-md rounded-2xl border border-stroke bg-white p-8 text-center shadow-sm">
        {/* Messenger icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-blue-600">
            <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.877 1.434 5.449 3.678 7.129V22l3.455-1.897A11.36 11.36 0 0012 20.486c5.523 0 10-4.145 10-9.243S17.523 2 12 2z" fill="currentColor"/>
            <path d="M13.097 14.153l-2.547-2.718L6 14.153l4.987-5.306 2.612 2.718L18 8.847l-4.903 5.306z" fill="white"/>
          </svg>
        </div>

        <h2 className="text-lg font-bold text-dark">Message Us on Messenger</h2>
        <p className="mt-2 text-sm text-dark-5">
          Our clinic staff typically responds within 30 minutes during business hours
          (Mon–Sat, 8 AM – 5 PM).
        </p>

        <a
          href={MESSENGER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.877 1.434 5.449 3.678 7.129V22l3.455-1.897A11.36 11.36 0 0012 20.486c5.523 0 10-4.145 10-9.243S17.523 2 12 2z" fill="currentColor"/>
            <path d="M13.097 14.153l-2.547-2.718L6 14.153l4.987-5.306 2.612 2.718L18 8.847l-4.903 5.306z" fill="white"/>
          </svg>
          Open Messenger
        </a>

        <div className="mt-6 rounded-lg bg-gray-1 px-4 py-3">
          <p className="text-xs text-dark-5">
            You can also message us directly on Facebook at{' '}
            <a
              href={FB_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              facebook.com/DentaStream
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
