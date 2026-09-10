'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { AdminSidebar } from '@/components/dashboards/admin-sidebar';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Menu } from 'lucide-react';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="bg-background flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

        {/* Main Content */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <header className="bg-card border-b">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-9 w-9 cursor-pointer p-0"
                >
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
                <h1 className="text-xl font-semibold">Admin Dashboard</h1>
              </div>

              <div className="flex items-center space-x-4">
                <ThemeToggle />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 cursor-pointer rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profilePicture} alt={user?.firstName} />
                        <AvatarFallback>{user?.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm leading-none font-medium">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-muted-foreground text-xs leading-none">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/admin/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="min-h-0 flex-1">
            <div className="h-full overflow-auto p-6">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
