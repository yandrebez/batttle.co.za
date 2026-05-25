'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check maintenance mode
    const checkMaintenance = async () => {
      try {
        const response = await fetch('/api/maintenance/check');
        const { maintenanceMode } = await response.json();

        // If maintenance mode is ON and user is not on /admin
        if (maintenanceMode && pathname !== '/admin' && !pathname.startsWith('/api')) {
          // Redirect to home (which shows maintenance page)
          router.replace('/');
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      }
    };

    checkMaintenance();
  }, [pathname, router]);

  return <>{children}</>;
}

