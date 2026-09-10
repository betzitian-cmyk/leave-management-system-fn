'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { bonusApi } from '@/lib/api/compensation';
import type { Bonus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  Edit,
  Award,
  User,
  Building2,
  FileText,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BonusViewPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [bonus, setBonus] = useState<Bonus | null>(null);
  const [loading, setLoading] = useState(true);

  const bonusId = params.id as string;

  useEffect(() => {
    const fetchBonus = async () => {
      try {
        setLoading(true);
        const response = await bonusApi.getBonusById(bonusId);

        let fetchedBonus: Bonus | null = null;
        if ('success' in response && 'data' in response) {
          fetchedBonus = response.data as Bonus;
        } else if ('id' in response) {
          fetchedBonus = response as Bonus;
        }

        if (fetchedBonus) {
          setBonus(fetchedBonus);
        } else {
          toast.error('Failed to load bonus');
        }
      } catch (err) {
        console.error('Error fetching bonus:', err);
        toast.error('Failed to load bonus');
      } finally {
        setLoading(false);
      }
    };

    if (bonusId) {
      fetchBonus();
    }
  }, [bonusId]);

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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { variant: 'default' | 'secondary' | 'outline'; className?: string }
    > = {
      PENDING: { variant: 'secondary' },
      APPROVED: {
        variant: 'outline',
        className: 'border-blue-500 text-blue-700 dark:text-blue-400',
      },
      PAID: {
        variant: 'outline',
        className: 'border-green-500 text-green-700 dark:text-green-400',
      },
      CANCELLED: { variant: 'secondary' },
      REJECTED: { variant: 'outline', className: 'border-red-500 text-red-700 dark:text-red-400' },
    };

    const config = statusMap[status] || { variant: 'secondary' as const };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!bonus) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Award className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="text-lg font-semibold">Bonus not found</h3>
        <p className="text-muted-foreground text-sm">
          The bonus you are looking for does not exist
        </p>
        <Button
          onClick={() => navigation.push('/dashboard/admin/compensation')}
          className="mt-4 cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Compensation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigation.push('/dashboard/admin/compensation')}
            className="cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bonus Details</h1>
            <p className="text-muted-foreground">
              View bonus information for {bonus.employee.firstName} {bonus.employee.lastName}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigation.push(`/dashboard/admin/compensation/bonuses/${bonusId}/edit`)}
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
                  {bonus.employee.firstName} {bonus.employee.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Email</p>
                <p className="font-medium">{bonus.employee.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Position</p>
                <p className="font-medium">{bonus.employee.position}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Department</p>
                <p className="font-medium">{bonus.employee.department.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bonus Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Award className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Title</p>
                <p className="text-xl font-bold">{bonus.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Type</p>
                <Badge variant="default">{bonus.type.replace('_', ' ')}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(bonus.amount)}</p>
              </div>
            </div>
            {bonus.percentage && (
              <div className="flex items-center gap-3">
                <FileText className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Percentage of Base</p>
                  <p className="font-medium">{bonus.percentage}%</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <FileText className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Status</p>
                {getStatusBadge(bonus.status)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{bonus.description}</p>
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-sm">Effective Date</p>
              <p className="font-medium">{formatDate(bonus.effectiveDate)}</p>
            </div>
            {bonus.paymentDate && (
              <div>
                <p className="text-muted-foreground text-sm">Payment Date</p>
                <p className="font-medium">{formatDate(bonus.paymentDate)}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-sm">Created At</p>
              <p className="font-medium">{formatDate(bonus.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Information */}
      {(bonus.isTaxable || bonus.taxAmount || bonus.netAmount) && (
        <Card>
          <CardHeader>
            <CardTitle>Tax Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-sm">Taxable</p>
                <Badge variant={bonus.isTaxable ? 'default' : 'secondary'}>
                  {bonus.isTaxable ? 'Yes' : 'No'}
                </Badge>
              </div>
              {bonus.taxAmount && (
                <div>
                  <p className="text-muted-foreground text-sm">Tax Amount</p>
                  <p className="font-medium">{formatCurrency(bonus.taxAmount)}</p>
                </div>
              )}
              {bonus.netAmount && (
                <div>
                  <p className="text-muted-foreground text-sm">Net Amount</p>
                  <p className="font-medium">{formatCurrency(bonus.netAmount)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Criteria and Notes */}
      {(bonus.criteria || bonus.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bonus.criteria && (
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Performance Criteria</p>
                <p className="text-sm whitespace-pre-wrap">{bonus.criteria}</p>
              </div>
            )}
            {bonus.notes && (
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{bonus.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Information */}
      {(bonus.paymentMethod || bonus.referenceNumber) && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {bonus.paymentMethod && (
                <div>
                  <p className="text-muted-foreground text-sm">Payment Method</p>
                  <p className="font-medium">{bonus.paymentMethod}</p>
                </div>
              )}
              {bonus.referenceNumber && (
                <div>
                  <p className="text-muted-foreground text-sm">Reference Number</p>
                  <p className="font-medium">{bonus.referenceNumber}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval/Rejection Information */}
      {(bonus.approvedBy || bonus.rejectedBy) && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {bonus.approvedBy && (
                <>
                  <div>
                    <p className="text-muted-foreground text-sm">Approved By</p>
                    <p className="font-medium">{bonus.approvedBy}</p>
                  </div>
                  {bonus.approvedAt && (
                    <div>
                      <p className="text-muted-foreground text-sm">Approved At</p>
                      <p className="font-medium">{formatDate(bonus.approvedAt)}</p>
                    </div>
                  )}
                </>
              )}
              {bonus.rejectedBy && (
                <>
                  <div>
                    <p className="text-muted-foreground text-sm">Rejected By</p>
                    <p className="font-medium">{bonus.rejectedBy}</p>
                  </div>
                  {bonus.rejectedAt && (
                    <div>
                      <p className="text-muted-foreground text-sm">Rejected At</p>
                      <p className="font-medium">{formatDate(bonus.rejectedAt)}</p>
                    </div>
                  )}
                  {bonus.rejectionReason && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-sm">Rejection Reason</p>
                      <p className="text-sm">{bonus.rejectionReason}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
