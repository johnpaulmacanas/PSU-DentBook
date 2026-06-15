import { useAuth } from '../../context/AuthContext';
import { AppShell, ROLE_ACCENTS, type NavItem } from '../../components/layout/AppShell';
import { DashboardIcon, CalendarIcon, UsersIcon, ChatIcon } from '../../components/layout/icons';

const NAV: NavItem[] = [
  { title: 'Overview', to: '/doctor', end: true, Icon: DashboardIcon },
  { title: 'Chair Schedule', to: '/doctor/appointments', Icon: CalendarIcon },
  { title: 'My Patients', to: '/doctor/patients', Icon: UsersIcon },
  { title: 'Team Chat', to: '/doctor/chat', Icon: ChatIcon },
];

export function DoctorLayout() {
  const { profile } = useAuth();
  const name = profile?.full_name ?? 'Doctor';
  return (
    <AppShell
      navItems={NAV}
      accent={ROLE_ACCENTS.doctor}
      brand="Clinical Workspace"
      roleLabel="Doctor"
      userName={name}
      userInitial={(name[0] ?? 'D').toUpperCase()}
    />
  );
}
