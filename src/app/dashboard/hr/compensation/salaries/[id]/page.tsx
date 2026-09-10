'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { salaryApi } from '@/lib/api/compensation';
import type { Salary } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  Edit,
  DollarSign,
  Calendar,
  User,
  Building2,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export default function HRSalaryViewPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [salary, setSalary] = useState<Salary | null>(null);
  const [loading, setLoading] = useState(true);

  const salaryId = params.id as string;

  useEffect(() => {
    const fetchSalary = async () => {
      try {
        setLoading(true);
        const response = await salaryApi.getSalaryById(salaryId);

        let fetchedSalary: Salary | null = null;
        if ('success' in response && 'data' in response) {
          fetchedSalary = response.data as Salary;
        } else if ('id' in response) {
          fetchedSalary = response as Salary;
        }

        if (fetchedSalary) {
          setSalary(fetchedSalary);
        } else {
          toast.error('Failed to load salary record');
        }
      } catch (err) {
        console.error('Error fetching salary:', err);
        toast.error('Failed to load salary record');
      } finally {
        setLoading(false);
      }
    };

    if (salaryId) {
      fetchSalary();
    }
  }, [salaryId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!salary) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <DollarSign className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="text-lg font-semibold">Salary record not found</h3>
        <p className="text-muted-foreground text-sm">
          The salary record you are looking for does not exist
        </p>
        <Button
          onClick={() => navigation.push('/dashboard/hr/compensation/salaries')}
          className="mt-4 cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Salaries
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigation.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Salary Details</h1>
            <p className="text-muted-foreground mt-1">
              View salary information for {salary.employee.firstName} {salary.employee.lastName}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigation.push(`/dashboard/hr/compensation/salaries/${salaryId}/edit`)}
          className="cursor-pointer"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Employee Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Name</p>
                <p className="font-medium">
                  {salary.employee.firstName} {salary.employee.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Email</p>
                <p className="font-medium">{salary.employee.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Position</p>
                <p className="font-medium">{salary.employee.position}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Department</p>
                <p className="font-medium">{salary.employee.department.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <DollarSign className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Type</p>
                <Badge variant="default">{salary.type.replace('_', ' ')}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(salary.amount)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Pay Frequency</p>
                <p className="font-medium">{salary.payFrequency.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Status</p>
                <Badge variant={salary.isActive ? 'default' : 'secondary'}>
                  {salary.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-sm">Effective Date</p>
              <p className="font-medium">{formatDate(salary.effectiveDate)}</p>
            </div>
            {salary.endDate && (
              <div>
                <p className="text-muted-foreground text-sm">End Date</p>
                <p className="font-medium">{formatDate(salary.endDate)}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-sm">Created At</p>
              <p className="font-medium">{formatDate(salary.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Changes */}
      {(salary.previousAmount || salary.percentageIncrease) && (
        <Card>
          <CardHeader>
            <CardTitle>Salary Changes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {salary.previousAmount && (
                <div>
                  <p className="text-muted-foreground text-sm">Previous Amount</p>
                  <p className="font-medium">{formatCurrency(salary.previousAmount)}</p>
                </div>
              )}
              {salary.percentageIncrease && (
                <div>
                  <p className="text-muted-foreground text-sm">Percentage Increase</p>
                  <p className="font-medium">{salary.percentageIncrease}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reason and Notes */}
      {(salary.reason || salary.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {salary.reason && (
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Reason</p>
                <p className="text-sm">{salary.reason}</p>
              </div>
            )}
            {salary.notes && (
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{salary.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approval Information */}
      {salary.approvedBy && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-sm">Approved By</p>
                <p className="font-medium">{salary.approvedBy}</p>
              </div>
              {salary.approvedAt && (
                <div>
                  <p className="text-muted-foreground text-sm">Approved At</p>
                  <p className="font-medium">{formatDate(salary.approvedAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
