'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  UserPlus,
  Briefcase,
  DollarSign,
  FileText,
  Shield,
  ClipboardList,
  UserCog,
  Bell,
  Tag,
  Clock,
  Fingerprint,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
  { name: 'User Management', href: '/dashboard/admin/users', icon: Shield },
  { name: 'Employees', href: '/dashboard/admin/employees', icon: Users },
  { name: 'Departments', href: '/dashboard/admin/departments', icon: Building2 },
  { name: 'Leave Types', href: '/dashboard/admin/leave-types', icon: Tag },
  { name: 'Leave Requests', href: '/dashboard/admin/leave-requests', icon: Calendar },
  { name: 'Attendance', href: '/dashboard/admin/attendance', icon: Clock },
  {
    name: 'Fingerprint Management',
    href: '/dashboard/admin/attendance/fingerprints',
    icon: Fingerprint,
  },
  { name: 'Recruitment', href: '/dashboard/admin/recruitment', icon: UserPlus },
  { name: 'Onboarding', href: '/dashboard/admin/onboarding', icon: Briefcase },
  { name: 'Compensation', href: '/dashboard/admin/compensation', icon: DollarSign },
  { name: 'Reports', href: '/dashboard/admin/reports', icon: FileText },
  { name: 'Audit Logs', href: '/dashboard/admin/audit', icon: ClipboardList },
  { name: 'My Profile', href: '/dashboard/admin/profile', icon: UserCog },
  { name: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle?: () => void;
}

export function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
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
              <span className="text-lg font-semibold whitespace-nowrap">Admin Portal</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            // Check for exact match first
            if (pathname === item.href) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'bg-primary text-primary-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                </Link>
              );
            }

            // For child paths, check if current path starts with this href
            // But exclude parent paths when we're on a more specific child
            const isActive =
              item.href !== '/dashboard/admin' &&
              pathname.startsWith(item.href + '/') &&
              // Make sure we don't highlight parent when on a more specific child
              // by checking if there's a more specific match in navigation
              !navigation.some(
                (otherItem) =>
                  otherItem.href !== item.href &&
                  otherItem.href.startsWith(item.href + '/') &&
                  pathname.startsWith(otherItem.href)
              );

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
