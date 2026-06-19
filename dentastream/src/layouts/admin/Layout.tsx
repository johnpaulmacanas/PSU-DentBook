import { useAuth } from '../../context/AuthContext';
import { AppShell, ROLE_ACCENTS, type NavItem } from '../../components/layout/AppShell';
import {
  DashboardIcon, CalendarIcon, InboxIcon, UsersIcon, UserIcon, SettingsIcon, CurrencyIcon, ChartIcon,
} from '../../components/layout/icons';

const NAV: NavItem[] = [
  { title: 'Dashboard', to: '/', end: true, Icon: DashboardIcon },
  { title: 'Appointments', to: '/appointments', Icon: CalendarIcon },
  { title: 'Requests', to: '/requests', Icon: InboxIcon },
  { title: 'Patients', to: '/patients', Icon: UsersIcon },
  { title: 'Billing', to: '/billing', Icon: CurrencyIcon },
  { title: 'Reports', to: '/reports', Icon: ChartIcon },
  { title: 'Staff', to: '/staff', Icon: UserIcon },
  { title: 'Settings', to: '/settings', Icon: SettingsIcon },
];

export function Layout() {
  const { profile } = useAuth();
  const name = profile?.full_name ?? 'Admin';
  return (
    <AppShell
      navItems={NAV}
      accent={ROLE_ACCENTS.admin}
      brand="Clinical Workflow"
      roleLabel="Admin"
      userName={name}
      userInitial={(name[0] ?? 'A').toUpperCase()}
    />
  );
}
