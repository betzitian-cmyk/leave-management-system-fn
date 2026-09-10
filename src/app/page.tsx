'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigation } from '@/hooks/use-navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Redirect to role-specific dashboard
        const roleRedirects: Record<string, string> = {
          GUEST: '/dashboard/guest',
          EMPLOYEE: '/dashboard/employee',
          MANAGER: '/dashboard/manager',
          HR_MANAGER: '/dashboard/hr',
          ADMIN: '/dashboard/admin',
        };

        const redirect = roleRedirects[user.role] || '/login';
        navigation.push(redirect);
      } else {
        navigation.push('/login');
      }
    }
  }, [isAuthenticated, user, isLoading, navigation]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="text-primary h-12 w-12 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}
