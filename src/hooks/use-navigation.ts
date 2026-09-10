'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import NProgress from 'nprogress';

export function useNavigation() {
  const router = useRouter();

  const push = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      const currentPath = window.location.pathname;
      if (href !== currentPath) {
        NProgress.start();
      }
      router.push(href, options);
    },
    [router]
  );

  const replace = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      const currentPath = window.location.pathname;
      if (href !== currentPath) {
        NProgress.start();
      }
      router.replace(href, options);
    },
    [router]
  );

  const back = useCallback(() => {
    NProgress.start();
    router.back();
  }, [router]);

  const forward = useCallback(() => {
    NProgress.start();
    router.forward();
  }, [router]);

  const refresh = useCallback(() => {
    NProgress.start();
    router.refresh();
  }, [router]);

  return {
    push,
    replace,
    back,
    forward,
    refresh,
  };
}
