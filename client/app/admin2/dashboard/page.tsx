'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { api, Verification, getUserName } from '@/lib/api';
import { Shield, Search } from 'lucide-react';

export default function Admin2Dashboard() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [populatedHistory, setPopulatedHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [comment, setComment] = useState('');
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin2') {
      router.push('/login');
      return;
    }

    fetchVerifications();
  }, []);

  useEffect(() => {
    if (selectedVerification) {
      setLoadingHistory(true);
      const populateHistory = async () => {
        const updatedHistory = await Promise.all(
          selectedVerification.history.map(async (entry) => {
            let actionByName = entry.actionBy;
            if (typeof entry.actionBy === 'string' && entry.actionBy.match(/^[0-9a-fA-F]{24}$/)) {
              actionByName = await getUserName(entry.actionBy);
            }
            return { ...entry, actionBy: actionByName };
          })
        );
        setPopulatedHistory(updatedHistory);
        setLoadingHistory(false);
      };
      populateHistory();
    } else {
      setPopulatedHistory([]);
    }
  }, [selectedVerification]);

  const fetchVerifications = async () => {
    try {
      const params = new URLSearchParams();
      if (searchText) params.append('searchText', searchText);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/verification?${params.toString()}`);
      setVerifications(response.data);
    } catch (error) {
      console.error('Failed to fetch verifications:', error);
    } finally {
      setLoading(false);
    }
  };



  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleVerify = async (verificationId: string, result: 'verified' | 'flagged'): Promise<void> => {
    setLoadingVerification(true);
    try {
      await api.post(`/verification/${verificationId}/verify`, { result, comment });
      setSelectedVerification(null);
      setComment('');
      fetchVerifications();
    } catch (error) {
      console.error('Failed to verify:', error);
    } finally {
      setLoadingVerification(false);
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
                      <p><strong>Father's Name:</strong> {selectedVerification.fatherName || 'N/A'}</p>
                      <p><strong>Aadhaar:</strong> {selectedVerification.aadharNumber || 'N/A'}</p>
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
                  <h3 className="font-semibold mb-2">Purpose of Stay</h3>
                  <p className="text-sm">{selectedVerification.purposeOfStay || 'N/A'}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Previous Address</h3>
                  <p className="text-sm">{selectedVerification.previousAddress || 'N/A'}</p>
                </div>

                {(selectedVerification.tenantPhoto?.length || selectedVerification.aadharPhoto?.length || selectedVerification.familyPhoto?.length) && (
                  <div>
                    <h3 className="font-semibold mb-2">Photos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedVerification.tenantPhoto?.map((photo, idx) => (
                        <div key={idx}>
                          <p className="text-sm font-medium">Tenant Photo</p>
                          <img src={`http://localhost:4000/landlord/image/${selectedVerification._id}/tenant/${idx}`} alt="Tenant" className="w-full h-32 object-cover rounded" />
                        </div>
                      ))}
                      {selectedVerification.aadharPhoto?.map((photo, idx) => (
                        <div key={idx}>
                          <p className="text-sm font-medium">Aadhaar Photo</p>
                          <img src={`http://localhost:4000/landlord/image/${selectedVerification._id}/aadhar/${idx}`} alt="Aadhaar" className="w-full h-32 object-cover rounded" />
                        </div>
                      ))}
                      {selectedVerification.familyPhoto?.map((photo, idx) => (
                        <div key={idx}>
                          <p className="text-sm font-medium">Family Photo</p>
                          <img src={`http://localhost:4000/landlord/image/${selectedVerification._id}/family/${idx}`} alt="Family" className="w-full h-32 object-cover rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedVerification.history && selectedVerification.history.length > 0) && (
                  <div>
                    <h3 className="font-semibold mb-2">Previous Comments</h3>
                    {loadingHistory ? (
                      <p className="text-sm text-gray-500">Loading comments...</p>
                    ) : (
                      <div className="space-y-2">
                        {populatedHistory.map((entry, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded text-sm">
                            <p><strong>{entry.actionBy}:</strong> {entry.comment || 'No comment'}</p>
                            <p className="text-gray-500 text-xs">{new Date(entry.at).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
                    disabled={loadingVerification}
                  >
                    {loadingVerification ? 'Verifying...' : 'Verify as Clear'}
                  </Button>
                  <Button
                    onClick={() => handleVerify(selectedVerification._id, 'flagged')}
                    variant="destructive"
                    className="flex-1"
                    disabled={loadingVerification}
                  >
                    {loadingVerification ? 'Flagging...' : 'Flag for Review'}
                  </Button>
                  <Button
                    onClick={() => setSelectedVerification(null)}
                    variant="outline"
                    disabled={loadingVerification}
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
                      <Button onClick={fetchVerifications} variant="outline">
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </div>
                  </div>
                </div>
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
