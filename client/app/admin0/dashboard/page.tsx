'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, Stats } from '@/lib/api';
import { Shield } from 'lucide-react';

export default function Admin0Dashboard() {
  const [stats, setStats] = useState<Stats['stats']>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin0') {
      router.push('/login');
      return;
    }

    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/verification/stats');
      if (response.status = 401) logout();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      if ((error as any).status = 401) logout();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const totalRequests = stats.reduce((sum, day) => sum + day.submitted + day.assigned + day.verified + day.flagged, 0);
  const totalVerified = stats.reduce((sum, day) => sum + day.verified, 0);
  const totalFlagged = stats.reduce((sum, day) => sum + day.flagged, 0);

  if (loading) {
    return <div className=" flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className=" bg-gray-50">
        <div className='flex w-full justify-center'>
        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Regional Supervisor Dashboard</h1>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRequests}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalVerified}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{totalFlagged}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Verification Logs</h2>
            <Button onClick={() => router.push('/logs')}>
              View All Logs
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Statistics</CardTitle>
              <CardDescription>
                Request statistics by date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.slice(0, 7).map((day) => (
                  <div key={day._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="font-medium">{new Date(day._id).toLocaleDateString()}</div>
                    <div className="flex gap-4">
                      <Badge variant="secondary">Submitted: {day.submitted}</Badge>
                      <Badge variant="secondary">Assigned: {day.assigned}</Badge>
                      <Badge className="bg-green-100 text-green-800">Verified: {day.verified}</Badge>
                      <Badge className="bg-red-100 text-red-800">Flagged: {day.flagged}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
