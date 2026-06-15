import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  DashboardIcon, CalendarIcon, UsersIcon, UserIcon, ChatIcon,
  SettingsIcon, InboxIcon, ReceiptIcon, ToothIcon, PlusIcon,
  MenuIcon, BellIcon, LogoutIcon,
} from './icons';

/**
 * Icons are pure SVG components — we verify:
 *  1. They render an <svg> element.
 *  2. The className prop is forwarded to the <svg>.
 *  3. They carry the correct accessibility attributes (no role needed — they
 *     are decorative; the parent button/link provides the label).
 */

const ALL_ICONS = [
  { name: 'DashboardIcon', Component: DashboardIcon },
  { name: 'CalendarIcon',  Component: CalendarIcon  },
  { name: 'UsersIcon',     Component: UsersIcon     },
  { name: 'UserIcon',      Component: UserIcon      },
  { name: 'ChatIcon',      Component: ChatIcon      },
  { name: 'SettingsIcon',  Component: SettingsIcon  },
  { name: 'InboxIcon',     Component: InboxIcon     },
  { name: 'ReceiptIcon',   Component: ReceiptIcon   },
  { name: 'ToothIcon',     Component: ToothIcon     },
  { name: 'PlusIcon',      Component: PlusIcon      },
  { name: 'MenuIcon',      Component: MenuIcon      },
  { name: 'BellIcon',      Component: BellIcon      },
  { name: 'LogoutIcon',    Component: LogoutIcon    },
] as const;

describe('SVG icon components', () => {
  it.each(ALL_ICONS)('$name renders an <svg> element', ({ Component }) => {
    const { container } = render(<Component />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it.each(ALL_ICONS)('$name forwards className to the <svg>', ({ Component }) => {
    const cls = 'h-5 w-5 test-sentinel';
    const { container } = render(<Component className={cls} />);
    const svg = container.querySelector('svg');
    // SVG elements expose className as SVGAnimatedString in jsdom;
    // getAttribute('class') returns the plain string.
    expect(svg?.getAttribute('class')).toContain('test-sentinel');
  });

  it.each(ALL_ICONS)('$name uses stroke for drawing (Feather-style)', ({ Component }) => {
    const { container } = render(<Component />);
    const svg = container.querySelector('svg');
    // Feather icons use stroke not fill.
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
    expect(svg?.getAttribute('fill')).toBe('none');
  });

  it.each(ALL_ICONS)('$name has a viewBox', ({ Component }) => {
    const { container } = render(<Component />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('renders all 13 icons without throwing', () => {
    // Smoke test: mount every icon at once.
    const { container } = render(
      <div>
        {ALL_ICONS.map(({ name, Component }) => (
          <Component key={name} />
        ))}
      </div>,
    );
    expect(container.querySelectorAll('svg')).toHaveLength(ALL_ICONS.length);
  });
});
