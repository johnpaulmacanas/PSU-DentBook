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

export function PatientLayout() {
  const { profile } = useAuth();
  const name = profile?.full_name ?? 'Patient';
  return (
    <AppShell
      navItems={NAV}
      accent={ROLE_ACCENTS.patient}
      brand="Patient Portal"
      roleLabel="Patient"
      userName={name}
      userInitial={(name[0] ?? 'P').toUpperCase()}
    />
  );
}
