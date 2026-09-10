'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/use-navigation';
import { benefitApi } from '@/lib/api/compensation';
import type { Benefit } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Edit, Gift, DollarSign, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function HRBenefitViewPage() {
  const params = useParams();
  const navigation = useNavigation();
  const [benefit, setBenefit] = useState<Benefit | null>(null);
  const [loading, setLoading] = useState(true);

  const benefitId = params.id as string;

  useEffect(() => {
    const fetchBenefit = async () => {
      try {
        setLoading(true);
        const response = await benefitApi.getBenefitById(benefitId);

        let fetchedBenefit: Benefit | null = null;
        if ('success' in response && 'data' in response) {
          fetchedBenefit = response.data as Benefit;
        } else if ('id' in response) {
          fetchedBenefit = response as Benefit;
        }

        if (fetchedBenefit) {
          setBenefit(fetchedBenefit);
        } else {
          toast.error('Failed to load benefit');
        }
      } catch (err) {
        console.error('Error fetching benefit:', err);
        toast.error('Failed to load benefit');
      } finally {
        setLoading(false);
      }
    };

    if (benefitId) {
      fetchBenefit();
    }
  }, [benefitId]);

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

  if (!benefit) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Gift className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="text-lg font-semibold">Benefit not found</h3>
        <p className="text-muted-foreground text-sm">
          The benefit you are looking for does not exist
        </p>
        <Button
          onClick={() => navigation.push('/dashboard/hr/compensation/benefits')}
          className="mt-4 cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Benefits
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
            <h1 className="text-3xl font-bold">Benefit Details</h1>
            <p className="text-muted-foreground mt-1">View benefit information</p>
          </div>
        </div>
        <Button
          onClick={() => navigation.push(`/dashboard/hr/compensation/benefits/${benefitId}/edit`)}
          className="cursor-pointer"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Basic Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Gift className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Benefit Name</p>
                <p className="text-xl font-bold">{benefit.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="text-muted-foreground mt-1 h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Description</p>
                <p className="text-sm">{benefit.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Type</p>
                <Badge variant="default">{benefit.type.replace(/_/g, ' ')}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Category</p>
                <Badge variant="outline">{benefit.category.replace(/_/g, ' ')}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Status</p>
                <Badge variant={benefit.isActive ? 'default' : 'secondary'}>
                  {benefit.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {benefit.cost && (
              <div className="flex items-center gap-3">
                <DollarSign className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Company Cost</p>
                  <p className="text-xl font-bold">{formatCurrency(benefit.cost)}</p>
                </div>
              </div>
            )}
            {benefit.employeeContribution && (
              <div className="flex items-center gap-3">
                <DollarSign className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Employee Contribution</p>
                  <p className="font-medium">{formatCurrency(benefit.employeeContribution)}</p>
                </div>
              </div>
            )}
            {benefit.employeeContributionPercentage && (
              <div className="flex items-center gap-3">
                <DollarSign className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Employee Contribution %</p>
                  <p className="font-medium">{benefit.employeeContributionPercentage}%</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Users className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Enrollment</p>
                <Badge variant={benefit.requiresEnrollment ? 'default' : 'secondary'}>
                  {benefit.requiresEnrollment ? 'Required' : 'Automatic'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Information */}
      {(benefit.provider || benefit.contactInfo) && (
        <Card>
          <CardHeader>
            <CardTitle>Provider Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {benefit.provider && (
                <div>
                  <p className="text-muted-foreground text-sm">Provider</p>
                  <p className="font-medium">{benefit.provider}</p>
                </div>
              )}
              {benefit.contactInfo && (
                <div>
                  <p className="text-muted-foreground text-sm">Contact Information</p>
                  <p className="font-medium">{benefit.contactInfo}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dates */}
      {(benefit.effectiveDate || benefit.endDate) && (
        <Card>
          <CardHeader>
            <CardTitle>Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {benefit.effectiveDate && (
                <div>
                  <p className="text-muted-foreground text-sm">Effective Date</p>
                  <p className="font-medium">{formatDate(benefit.effectiveDate)}</p>
                </div>
              )}
              {benefit.endDate && (
                <div>
                  <p className="text-muted-foreground text-sm">End Date</p>
                  <p className="font-medium">{formatDate(benefit.endDate)}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-sm">Created At</p>
                <p className="font-medium">{formatDate(benefit.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Eligibility Criteria */}
      {benefit.eligibilityCriteria && benefit.eligibilityCriteria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Eligibility Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {benefit.eligibilityCriteria.map((criterion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <FileText className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{criterion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Required Documents */}
      {benefit.documentsRequired && benefit.documentsRequired.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {benefit.documentsRequired.map((doc, index) => (
                <li key={index} className="flex items-start gap-2">
                  <FileText className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{doc}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {benefit.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{benefit.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Approval Information */}
      {benefit.approvedBy && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-sm">Approved By</p>
                <p className="font-medium">{benefit.approvedBy}</p>
              </div>
              {benefit.approvedAt && (
                <div>
                  <p className="text-muted-foreground text-sm">Approved At</p>
                  <p className="font-medium">{formatDate(benefit.approvedAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
