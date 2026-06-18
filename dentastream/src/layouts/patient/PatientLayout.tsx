import { useAuth } from '../../context/AuthContext';
import { AppShell, ROLE_ACCENTS, type NavItem } from '../../components/layout/AppShell';
import {
  DashboardIcon, CalendarIcon, PlusIcon, ReceiptIcon, UserIcon, ChatIcon,
} from '../../components/layout/icons';

const NAV: NavItem[] = [
  { title: 'Home', to: '/patient', end: true, Icon: DashboardIcon },
  { title: 'My Appointments', to: '/patient/appointments', Icon: CalendarIcon },
  { title: 'Request Appointment', to: '/patient/request', Icon: PlusIcon },
  { title: 'Billing', to: '/patient/billing', Icon: ReceiptIcon },
  { title: 'Profile', to: '/patient/profile', Icon: UserIcon },
  { title: 'Messages', to: '/patient/chat', Icon: ChatIcon },
];

const FB_PAGE_ID = import.meta.env.VITE_FB_PAGE_ID || 'DentaStreamClinic';

export function PatientLayout() {
  const { profile } = useAuth();
  const name = profile?.full_name ?? 'Patient';
  return (
    <>
      <AppShell
        navItems={NAV}
        accent={ROLE_ACCENTS.patient}
        brand="Patient Portal"
        roleLabel="Patient"
        userName={name}
        userInitial={(name[0] ?? 'P').toUpperCase()}
      />
      {/* Floating Messenger Button */}
      <a
        href={`https://m.me/${FB_PAGE_ID}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on Messenger"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:scale-105 hover:bg-blue-700"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
          <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.877 1.434 5.449 3.678 7.129V22l3.455-1.897A11.36 11.36 0 0012 20.486c5.523 0 10-4.145 10-9.243S17.523 2 12 2z" fill="currentColor"/>
          <path d="M13.097 14.153l-2.547-2.718L6 14.153l4.987-5.306 2.612 2.718L18 8.847l-4.903 5.306z" fill="white"/>
        </svg>
      </a>
    </>
  );
}
