'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

NProgress.configure({
  minimum: 0.3,
  easing: 'ease',
  speed: 500,
  showSpinner: false,
});

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;

      if (link && link.href) {
        try {
          const linkUrl = new URL(link.href);
          const currentUrl = new URL(window.location.href);

          if (
            linkUrl.origin === currentUrl.origin &&
            linkUrl.pathname !== currentUrl.pathname &&
            !link.target &&
            !link.download &&
            !e.metaKey &&
            !e.ctrlKey &&
            !e.shiftKey &&
            e.button === 0
          ) {
            NProgress.start();
          }
        } catch (error) {
          console.error('Invalid URL in link:', error);
        }
      }
    };

    const handleBeforeUnload = () => {
      NProgress.start();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    const handleFormSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (form && form.action && form.method !== 'GET') {
        try {
          const formUrl = new URL(form.action, window.location.origin);
          const currentUrl = new URL(window.location.href);

          if (formUrl.pathname !== currentUrl.pathname) {
            NProgress.start();
          }
        } catch (error) {
          console.error('Invalid URL in form:', error);
        }
      }
    };

    const handlePopState = () => {
      NProgress.start();
    };

    document.addEventListener('click', handleLinkClick, true);
    document.addEventListener('submit', handleFormSubmit, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      document.removeEventListener('submit', handleFormSubmit, true);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null;
}

export function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
