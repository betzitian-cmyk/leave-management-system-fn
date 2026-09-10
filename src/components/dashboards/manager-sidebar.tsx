'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  BarChart3,
  UserCog,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard/manager', icon: LayoutDashboard },
  { name: 'My Leaves', href: '/dashboard/manager/leaves', icon: Calendar },
  { name: 'Team Leaves', href: '/dashboard/manager/team-leaves', icon: ClipboardList },
  { name: 'Team Members', href: '/dashboard/manager/team', icon: Users },
  { name: 'Team Calendar', href: '/dashboard/manager/calendar', icon: Calendar },
  { name: 'Performance', href: '/dashboard/manager/performance', icon: BarChart3 },
  { name: 'My Profile', href: '/dashboard/manager/profile', icon: UserCog },
  { name: 'Notifications', href: '/dashboard/manager/notifications', icon: Bell },
];

interface ManagerSidebarProps {
  isCollapsed: boolean;
  onToggle?: () => void;
}

export function ManagerSidebar({ isCollapsed, onToggle }: ManagerSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-40 cursor-pointer bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'bg-card flex h-full flex-col border-r transition-all duration-300',
          'lg:relative lg:z-auto',
          'fixed inset-y-0 z-50 lg:inset-y-auto',
          isCollapsed ? 'w-16' : 'w-64',
          'lg:translate-x-0',
          isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded">
              <span className="text-sm font-bold">LMS</span>
            </div>
            {!isCollapsed && (
              <span className="text-lg font-semibold whitespace-nowrap">Manager Portal</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard/manager' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
