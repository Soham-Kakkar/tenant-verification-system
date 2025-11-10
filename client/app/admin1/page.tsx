'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, Verification, User, Notification } from '@/lib/api';
import { Shield, Bell, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function Admin1Dashboard() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin1') {
      router.push('/login');
      return;
    }

    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const response = await api.get('/verification');
      setVerifications(response.data);
    } catch (error) {
      console.error('Failed to fetch verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelegate = async (verificationId: string, assigneeId: string) => {
    try {
      await api.post(`/verification/${verificationId}/delegate`, { assigneeId });
      fetchVerifications();
    } catch (error) {
      console.error('Failed to delegate:', error);
    }
  };

  const handleVerify = async (verificationId: string, result: 'verified' | 'flagged', comment?: string) => {
    try {
      await api.post(`/verification/${verificationId}/verify`, { result, comment });
      fetchVerifications();
    } catch (error) {
      console.error('Failed to verify:', error);
    }
  };

  if (loading) {
    return <div className=" flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className=" bg-gray-50">
      <div className='flex w-full justify-center'>
        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Station Lead Dashboard</h1>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Verification Requests</CardTitle>
              <CardDescription>
                Manage tenant verification requests for your station
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Father's Name</TableHead>
                    <TableHead>Aadhaar</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Landlord</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifications.map((verification) => (
                    <TableRow key={verification._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{verification.tenantName}</div>
                          <div className="text-sm text-gray-500">{verification.tenantPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{verification.fatherName || 'N/A'}</TableCell>
                      <TableCell>{verification.aadharNumber || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate" title={verification.purposeOfStay}>
                        {verification.purposeOfStay || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{verification.landlordName}</div>
                          <div className="text-sm text-gray-500">{verification.landlordPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(verification.status)}>
                          {verification.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {verification.assignedTo?.name || 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {verification.status === 'submitted' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleVerify(verification._id, 'verified')}
                              >
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleVerify(verification._id, 'flagged')}
                              >
                                Flag
                              </Button>
                              <Select onValueChange={(assigneeId) => handleDelegate(verification._id, assigneeId)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Delegate" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="verifier1">Officer Smith</SelectItem>
                                  <SelectItem value="verifier2">Officer Johnson</SelectItem>
                                </SelectContent>
                              </Select>
                            </>
                          )}
                          {verification.status === 'assigned' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedVerification(verification)}
                            >
                              View Details
                            </Button>
                          )}
                          {(verification.tenantPhoto?.length || verification.aadharPhoto?.length || verification.familyPhoto?.length) && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">View Photos</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Verification Photos</DialogTitle>
                                  <DialogDescription>
                                    Photos uploaded for {verification.tenantName}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {verification.tenantPhoto?.map((photo, idx) => (
                                    <div key={idx}>
                                      <p className="text-sm font-medium">Tenant Photo</p>
                                      <img src={`http://localhost:4000${photo.url}`} alt="Tenant" className="w-full h-32 object-cover rounded" />
                                    </div>
                                  ))}
                                  {verification.aadharPhoto?.map((photo, idx) => (
                                    <div key={idx}>
                                      <p className="text-sm font-medium">Aadhaar Photo</p>
                                      <img src={`http://localhost:4000${photo.url}`} alt="Aadhaar" className="w-full h-32 object-cover rounded" />
                                    </div>
                                  ))}
                                  {verification.familyPhoto?.map((photo, idx) => (
                                    <div key={idx}>
                                      <p className="text-sm font-medium">Family Photo</p>
                                      <img src={`http://localhost:4000${photo.url}`} alt="Family" className="w-full h-32 object-cover rounded" />
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
