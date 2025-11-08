'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Shield, ArrowLeft } from 'lucide-react';

interface LogEntry {
  _id: string;
  landlordName: string;
  landlordPhone: string;
  tenantName: string;
  tenantPhone?: string;
  address: string;
  status: 'verified' | 'flagged';
  regionId: { name: string };
  stationId: { name: string };
  updatedAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin0' && user.role !== 'superAdmin') {
      router.push('/login');
      return;
    }

    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/verification/logs');
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'verified'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return <div className=" flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className=" bg-gray-50">
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Verification Logs</h1>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">Complete log of verified and flagged tenant verification requests</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Verification History</CardTitle>
              <CardDescription>
                All completed verification requests with their final status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>Police Station</TableHead>
                    <TableHead>Landlord Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Tenant Name</TableHead>
                    <TableHead>Tenant Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-medium">
                        {log.regionId?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.stationId?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{log.landlordName}</TableCell>
                      <TableCell className="max-w-xs truncate" title={log.address}>
                        {log.address}
                      </TableCell>
                      <TableCell>{log.tenantName}</TableCell>
                      <TableCell>{log.tenantPhone || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(log.status)}>
                          {log.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(log.updatedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {logs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No verification logs found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
