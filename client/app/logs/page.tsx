'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { Shield, ArrowLeft, Search } from 'lucide-react';

interface LogEntry {
  _id: string;
  landlordName: string;
  landlordPhone: string;
  tenantName: string;
  tenantPhone?: string;
  fatherName?: string;
  aadharNumber?: string;
  purposeOfStay?: string;
  previousAddress?: string;
  tenantPhoto?: Array<{ url: string; filename: string; size: number }>;
  aadharPhoto?: Array<{ url: string; filename: string; size: number }>;
  familyPhoto?: Array<{ url: string; filename: string; size: number }>;
  address: string;
  status: 'verified' | 'flagged';
  regionId: { name: string };
  stationId: { name: string };
  updatedAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user) {
      router.push('/login');
      return;
    }

    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (searchText) params.append('searchText', searchText);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/verification/logs?${params.toString()}`);
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
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="searchText">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="searchText"
                      placeholder="Search by name, phone, address..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div>
                    <Label htmlFor="startDate">From Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">To Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={fetchLogs} variant="outline">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>Police Station</TableHead>
                    <TableHead>Landlordcyb Name</TableHead>
                    <TableHead>Tenant Name</TableHead>
                    <TableHead>Father's Name</TableHead>
                    <TableHead>Aadhaar</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Previous Address</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Photos</TableHead>
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
                      <TableCell>{log.tenantName}</TableCell>
                      <TableCell>{log.fatherName || 'N/A'}</TableCell>
                      <TableCell>{log.aadharNumber || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate" title={log.purposeOfStay}>
                        {log.purposeOfStay || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={log.previousAddress}>
                        {log.previousAddress || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={log.address}>
                        {log.address}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(log.status)}>
                          {log.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(log.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {(log.tenantPhoto?.length || log.aadharPhoto?.length || log.familyPhoto?.length) ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">View</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Verification Photos</DialogTitle>
                                <DialogDescription>
                                  Photos for {log.tenantName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {log.tenantPhoto?.map((photo, idx) => (
                                  <div key={idx}>
                                    <p className="text-sm font-medium">Tenant Photo</p>
                                    <img src={`http://localhost:4000/landlord/image/${log._id}/tenant/${idx}`} alt="Tenant" className="w-full h-32 object-cover rounded" />
                                  </div>
                                ))}
                                {log.aadharPhoto?.map((photo, idx) => (
                                  <div key={idx}>
                                    <p className="text-sm font-medium">Aadhaar Photo</p>
                                    <img src={`http://localhost:4000/landlord/image/${log._id}/aadhar/${idx}`} alt="Aadhaar" className="w-full h-32 object-cover rounded" />
                                  </div>
                                ))}
                                {log.familyPhoto?.map((photo, idx) => (
                                  <div key={idx}>
                                    <p className="text-sm font-medium">Family Photo</p>
                                    <img src={`http://localhost:4000/landlord/image/${log._id}/family/${idx}`} alt="Family" className="w-full h-32 object-cover rounded" />
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          'None'
                        )}
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
