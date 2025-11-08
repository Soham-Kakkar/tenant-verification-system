'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api, Verification } from '@/lib/api';
import { Shield } from 'lucide-react';

export default function Admin2Dashboard() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [comment, setComment] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin2') {
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

  const handleVerify = async (verificationId: string, result: 'verified' | 'flagged') => {
    try {
      await api.post(`/verification/${verificationId}/verify`, { result, comment });
      setSelectedVerification(null);
      setComment('');
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
        <h1 className="text-2xl font-bold text-gray-900">Verification Officer Dashboard</h1>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {selectedVerification ? (
            <Card>
              <CardHeader>
                <CardTitle>Verify Request</CardTitle>
                <CardDescription>
                  Review and verify the tenant verification request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Tenant Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {selectedVerification.tenantName}</p>
                      <p><strong>Phone:</strong> {selectedVerification.tenantPhone}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Landlord Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {selectedVerification.landlordName}</p>
                      <p><strong>Phone:</strong> {selectedVerification.landlordPhone}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Property Address</h3>
                  <p className="text-sm">{selectedVerification.address}</p>
                </div>

                <div>
                  <Label htmlFor="comment">Comments (Optional)</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add any comments about the verification"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => handleVerify(selectedVerification._id, 'verified')}
                    className="flex-1"
                  >
                    Verify as Clear
                  </Button>
                  <Button
                    onClick={() => handleVerify(selectedVerification._id, 'flagged')}
                    variant="destructive"
                    className="flex-1"
                  >
                    Flag for Review
                  </Button>
                  <Button
                    onClick={() => setSelectedVerification(null)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>My Assigned Requests</CardTitle>
                <CardDescription>
                  Verification requests assigned to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Landlord</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifications
                      .filter(v => v.status === 'assigned' && v.assignedTo)
                      .map((verification) => (
                      <TableRow key={verification._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{verification.tenantName}</div>
                            <div className="text-sm text-gray-500">{verification.tenantPhone}</div>
                          </div>
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
                          <Button
                            size="sm"
                            onClick={() => setSelectedVerification(verification)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
