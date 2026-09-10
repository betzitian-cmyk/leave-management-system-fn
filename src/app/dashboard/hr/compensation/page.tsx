'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '@/hooks/use-navigation';
import { salaryApi, benefitApi, bonusApi } from '@/lib/api/compensation';
import type { Salary, Benefit, Bonus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DollarSign, Gift, Award } from 'lucide-react';

export default function HRCompensationPage() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('salaries');
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salariesRes, benefitsRes, bonusesRes] = await Promise.all([
        salaryApi.getAllSalaries(),
        benefitApi.getAllBenefits(),
        bonusApi.getAllBonuses(),
      ]);

      // Handle salaries
      if ('success' in salariesRes && salariesRes.success && 'data' in salariesRes) {
        const data = salariesRes.data as Salary[] | { data: Salary[] };
        if (Array.isArray(data)) {
          setSalaries(data);
        } else if ('data' in data && Array.isArray(data.data)) {
          setSalaries(data.data);
        } else {
          setSalaries([]);
        }
      } else if (Array.isArray(salariesRes)) {
        setSalaries(salariesRes);
      } else {
        setSalaries([]);
      }

      // Handle benefits
      if ('success' in benefitsRes && benefitsRes.success && 'data' in benefitsRes) {
        const data = benefitsRes.data as Benefit[] | { data: Benefit[] };
        if (Array.isArray(data)) {
          setBenefits(data);
        } else if ('data' in data && Array.isArray(data.data)) {
          setBenefits(data.data);
        } else {
          setBenefits([]);
        }
      } else if (Array.isArray(benefitsRes)) {
        setBenefits(benefitsRes);
      } else {
        setBenefits([]);
      }

      // Handle bonuses
      if ('success' in bonusesRes && bonusesRes.success && 'data' in bonusesRes) {
        const data = bonusesRes.data as Bonus[] | { data: Bonus[] };
        if (Array.isArray(data)) {
          setBonuses(data);
        } else if ('data' in data && Array.isArray(data.data)) {
          setBonuses(data.data);
        } else {
          setBonuses([]);
        }
      } else if (Array.isArray(bonusesRes)) {
        setBonuses(bonusesRes);
      } else {
        setBonuses([]);
      }
    } catch (err) {
      console.error('Error fetching compensation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      totalSalaries: salaries.length,
      activeSalaries: salaries.filter((s) => s.isActive).length,
      totalBenefits: benefits.length,
      activeBenefits: benefits.filter((b) => b.isActive).length,
      totalBonuses: bonuses.length,
      pendingBonuses: bonuses.filter((b) => b.status === 'PENDING').length,
    };
  }, [salaries, benefits, bonuses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compensation Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage salaries, benefits, and bonuses for employees
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Salaries</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSalaries}</div>
            <p className="text-muted-foreground text-xs">
              {stats.activeSalaries} active salary records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Benefits</CardTitle>
            <Gift className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBenefits}</div>
            <p className="text-muted-foreground text-xs">
              {stats.activeBenefits} active benefits available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bonuses</CardTitle>
            <Award className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBonuses}</div>
            <p className="text-muted-foreground text-xs">{stats.pendingBonuses} pending approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="salaries">Salaries</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
        </TabsList>
        <TabsContent value="salaries" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Salaries</h3>
                      <p className="text-muted-foreground text-sm">
                        Manage employee salary records and compensation
                      </p>
                    </div>
                    <Button
                      onClick={() => navigation.push('/dashboard/hr/compensation/salaries')}
                      className="cursor-pointer"
                    >
                      View All Salaries →
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="benefits" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Benefits</h3>
                      <p className="text-muted-foreground text-sm">
                        Manage employee benefits and enrollments
                      </p>
                    </div>
                    <Button
                      onClick={() => navigation.push('/dashboard/hr/compensation/benefits')}
                      className="cursor-pointer"
                    >
                      View All Benefits →
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bonuses" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Bonuses</h3>
                      <p className="text-muted-foreground text-sm">
                        Manage employee bonuses and rewards
                      </p>
                    </div>
                    <Button
                      onClick={() => navigation.push('/dashboard/hr/compensation/bonuses')}
                      className="cursor-pointer"
                    >
                      View All Bonuses →
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
