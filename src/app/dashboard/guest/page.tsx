'use client';

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail, CheckCircle2 } from 'lucide-react';

export default function GuestDashboardPage() {
  const { user, userStatus } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome, {user?.firstName}!</h2>
        <p className="text-muted-foreground">Your account is currently in guest mode</p>
      </div>

      {/* Status Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your account is pending employee profile creation. Please contact HR to get full access to
          the leave management system.
        </AlertDescription>
      </Alert>

      {/* Account Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Your current account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Email</span>
              <span className="text-sm font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Role</span>
              <Badge variant="outline">{user?.role}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Email Verified</span>
              {userStatus?.emailVerified ? (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="destructive">Not Verified</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Employee Profile</span>
              <Badge variant={userStatus?.hasEmployeeProfile ? 'default' : 'secondary'}>
                {userStatus?.hasEmployeeProfile ? 'Created' : 'Pending'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>What you need to do</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Account Created</p>
                <p className="text-muted-foreground text-xs">Your account has been registered</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              {userStatus?.emailVerified ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
              ) : (
                <Mail className="text-muted-foreground mt-0.5 h-5 w-5" />
              )}
              <div>
                <p className="text-sm font-medium">Email Verification</p>
                <p className="text-muted-foreground text-xs">
                  {userStatus?.emailVerified
                    ? 'Your email is verified'
                    : 'Please verify your email address'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Awaiting HR Action</p>
                <p className="text-muted-foreground text-xs">
                  HR will create your employee profile and assign you to a department
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Once HR creates your employee profile, you will:
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
            <li>Be assigned to a department</li>
            <li>Get your position and manager information</li>
            <li>Receive access to the full leave management system</li>
            <li>Be able to submit and manage leave requests</li>
            <li>Access company documents and policies</li>
          </ul>
          <p className="text-muted-foreground mt-4 text-sm">
            You will receive an email notification once your employee profile is created.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
