'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/theme-toggle';
import { authApi } from '@/lib/api/auth';
import { useNavigation } from '@/hooks/use-navigation';

export default function VerifyEmailPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = params.token as string;

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await authApi.verifyEmail(token);

        if (response.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigation.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.error || 'Email verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Email verification failed');
      }
    };

    verifyEmail();
  }, [params.token, navigation]);

  return (
    <div className="from-background to-muted flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            {status === 'loading' && <Loader2 className="text-primary h-8 w-8 animate-spin" />}
            {status === 'success' && (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            )}
            {status === 'error' && (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Verifying Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email address...'}
            {status === 'success' && 'You can now log in to your account'}
            {status === 'error' && 'There was a problem verifying your email'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {message && (
              <Alert variant={status === 'error' ? 'destructive' : 'default'}>
                <AlertDescription className="text-center">{message}</AlertDescription>
              </Alert>
            )}

            {status === 'success' && (
              <Button asChild className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
            )}

            {status === 'error' && (
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/resend-verification">Resend Verification Email</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Back to Login</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
