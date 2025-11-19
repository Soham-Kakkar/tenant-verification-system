'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock } from 'lucide-react';

const landlordSchema = Joi.object({
  landlordName: Joi.string().required(),
  landlordPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  address: Joi.string().required(),
});

const tenantSchema = Joi.object({
  tenantName: Joi.string().required(),
  tenantPhones: Joi.array().items(Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)).min(1).required(),
  fatherName: Joi.string().optional(),
  aadharNumber: Joi.string().pattern(/^\d{12}$/).optional(),
  purposeOfStay: Joi.string().optional(),
  previousAddress: Joi.string().optional(),
  familyMembers: Joi.number().integer().min(1).optional(),
  stationId: Joi.string().required(),
});

type LandlordData = {
  landlordName: string;
  landlordPhone: string;
  address: string;
};

type TenantData = {
  tenantName: string;
  tenantPhones: string[];
  fatherName?: string;
  aadharNumber?: string;
  purposeOfStay?: string;
  previousAddress?: string;
  familyMembers?: number;
  stationId: string;
};

type Step = 'landlord' | 'otp' | 'tenant' | 'success';

export default function LandlordForm() {
  const [currentStep, setCurrentStep] = useState<Step>('landlord');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationId, setVerificationId] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [files, setFiles] = useState<{ tenantPhoto?: File; aadharPhoto?: File; familyPhoto?: File }>({});
  const [fileErrors, setFileErrors] = useState<string>('');
  const [landlordData, setLandlordData] = useState<LandlordData | null>(null);

  const landlordForm = useForm<LandlordData>({
    resolver: joiResolver(landlordSchema),
  });

  const tenantForm = useForm<TenantData>({
    resolver: joiResolver(tenantSchema),
    defaultValues: {
      tenantPhones: [''],
      fatherName: '',
      aadharNumber: '',
      purposeOfStay: '',
      previousAddress: '',
    },
  });

  const landlordOnSubmit = async (data: LandlordData) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/landlord/register', data);
      setVerificationId(response.data.verificationId);
      setLandlordData(data);
      setCurrentStep('otp');
    } catch (error: any) {
      console.error('Landlord registration failed:', error);
      // Set error in form or alert
      landlordForm.setError('root', { message: error.response?.data?.error || 'Landlord registration failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tenantOnSubmit = async (data: TenantData) => {
    setIsSubmitting(true);
    setFileErrors('');

    // Validate file sizes
    const totalSize = Object.values(files).reduce((sum, file) => sum + (file?.size || 0), 0);
    if (totalSize > 6 * 1024 * 1024) {
      setFileErrors('Total file size exceeds 6MB limit');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      // Add landlord data
      formData.append('landlordName', landlordData!.landlordName);
      formData.append('landlordPhone', landlordData!.landlordPhone);
      // Add tenant data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(item => formData.append(key, item));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      if (files.tenantPhoto) formData.append('tenantPhoto', files.tenantPhoto);
      if (files.aadharPhoto) formData.append('aadharPhoto', files.aadharPhoto);
      if (files.familyPhoto) formData.append('familyPhoto', files.familyPhoto);

      await api.patch(`/landlord/${verificationId}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCurrentStep('success');
    } catch (error: any) {
      console.error('Tenant submission failed:', error);
      setFileErrors(error.response?.data?.error || 'Tenant submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    setIsSubmitting(true);
    setOtpError('');
    try {
      await api.post('/landlord/verify-otp', { verificationId, otp });
      setCurrentStep('tenant');
    } catch (error: any) {
      setOtpError(error.response?.data?.error || 'OTP verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentStep === 'otp') {
    return <OtpVerification onVerify={verifyOtp} isSubmitting={isSubmitting} error={otpError} />;
  }

  if (currentStep === 'tenant') {
    return (
      <div className=" bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => setCurrentStep('landlord')}>← Back to Landlord Details</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tenant Details</CardTitle>
              <CardDescription>
                Please fill out the tenant's information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={tenantForm.handleSubmit(tenantOnSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tenantName">Tenant (Kirayedar) Name *</Label>
                    <Input
                      id="tenantName"
                      {...tenantForm.register('tenantName')}
                      placeholder="Kirayedar Ka Naam"
                    />
                    {tenantForm.formState.errors.tenantName && (
                      <p className="text-sm text-red-600 mt-1">{tenantForm.formState.errors.tenantName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="familyMembers">Number of Family Members</Label>
                    <Input
                      id="familyMembers"
                      type="number"
                      {...tenantForm.register('familyMembers', { valueAsNumber: true })}
                      placeholder="e.g., 4"
                      min={1}
                    />
                    {tenantForm.formState.errors.familyMembers && (
                      <p className="text-sm text-red-600 mt-1">{tenantForm.formState.errors.familyMembers.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenantPhones">Tenant Phone Numbers *</Label>
                  <div className="space-y-2">
                    {((tenantForm.watch('tenantPhones') || []) as string[]).map((phone, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={phone}
                          onChange={(e) => {
                            const phones = (tenantForm.watch('tenantPhones') || []) as string[];
                            const newPhones = [...phones];
                            newPhones[index] = e.target.value;
                            tenantForm.setValue('tenantPhones', newPhones);
                          }}
                          placeholder={`Phone ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const phones = (tenantForm.watch('tenantPhones') || []) as string[];
                            const newPhones = phones.filter((_, i) => i !== index);
                            tenantForm.setValue('tenantPhones', newPhones.length > 0 ? newPhones : ['']);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const phones = (tenantForm.watch('tenantPhones') || []) as string[];
                        tenantForm.setValue('tenantPhones', [...phones, '']);
                      }}
                      className="w-full"
                    >
                      Add Phone Number
                    </Button>
                  </div>
                  {tenantForm.formState.errors.tenantPhones && (
                    <p className="text-sm text-red-600 mt-1">{(tenantForm.formState.errors.tenantPhones as any).message}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fatherName">Tenant Father Name</Label>
                    <Input
                      id="fatherName"
                      {...tenantForm.register('fatherName')}
                      placeholder="Enter father's full name"
                    />
                    {tenantForm.formState.errors.fatherName && (
                      <p className="text-sm text-red-600 mt-1">{tenantForm.formState.errors.fatherName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="aadharNumber">Aadhaar Number</Label>
                    <Input
                      id="aadharNumber"
                      {...tenantForm.register('aadharNumber')}
                      placeholder="123456789012"
                      maxLength={12}
                    />
                    {tenantForm.formState.errors.aadharNumber && (
                      <p className="text-sm text-red-600 mt-1">{tenantForm.formState.errors.aadharNumber.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="purposeOfStay">Purpose of Stay (Max 500 characters)</Label>
                  <Textarea
                    id="purposeOfStay"
                    {...tenantForm.register('purposeOfStay')}
                    placeholder="Enter purpose of stay"
                    rows={2}
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {tenantForm.watch('purposeOfStay')?.length || 0}/500 characters
                  </div>
                  {tenantForm.formState.errors.purposeOfStay && (
                    <p className="text-sm text-red-600 mt-1">{tenantForm.formState.errors.purposeOfStay.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="previousAddress">Previous Address (Max 500 characters)</Label>
                  <Textarea
                    id="previousAddress"
                    {...tenantForm.register('previousAddress')}
                    placeholder="Kirayedar ka poorana address"
                    rows={2}
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {tenantForm.watch('previousAddress')?.length || 0}/500 characters
                  </div>
                  {tenantForm.formState.errors.previousAddress && (
                    <p className="text-sm text-red-600 mt-1">{tenantForm.formState.errors.previousAddress.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="stationId">Police Station *</Label>
                  <Select onValueChange={(value) => tenantForm.setValue('stationId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select police station" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Central Police Station">Central Police Station</SelectItem>
                      <SelectItem value="North Police Station">North Police Station</SelectItem>
                      <SelectItem value="South Police Station">South Police Station</SelectItem>
                      <SelectItem value="East Police Station">East Police Station</SelectItem>
                      <SelectItem value="West Police Station">West Police Station</SelectItem>
                    </SelectContent>
                  </Select>
                  {tenantForm.formState.errors.stationId && (
                    <p className="text-sm text-red-600 mt-1">{tenantForm.formState.errors.stationId.message}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <Label>Upload Photos (Max 2MB each)</Label>

                  <div>
                    <Label htmlFor="tenantPhoto">Tenant Photograph *</Label>
                    <Input
                      id="tenantPhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 2 * 1024 * 1024) {
                          alert('Tenant photo must be less than 2MB');
                          return;
                        }
                        setFiles(prev => ({ ...prev, tenantPhoto: file }));
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="aadharPhoto">Aadhaar Photograph *</Label>
                    <Input
                      id="aadharPhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 2 * 1024 * 1024) {
                          alert('Aadhaar photo must be less than 2MB');
                          return;
                        }
                        setFiles(prev => ({ ...prev, aadharPhoto: file }));
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="familyPhoto">Family Photograph *</Label>
                    <Input
                      id="familyPhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 2 * 1024 * 1024) {
                          alert('Family photo must be less than 2MB');
                          return;
                        }
                        setFiles(prev => ({ ...prev, familyPhoto: file }));
                      }}
                    />
                  </div>

                  {fileErrors && (
                    <Alert variant="destructive">
                      <AlertDescription>{fileErrors}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentStep === 'success') {
    return (
      <div className=" bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Request Submitted
            </CardTitle>
            <CardDescription>
              Your tenant verification request has been submitted successfully.
              Police officers will review it shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Landlord form
  return (
    <div className=" bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost">← Back to Home</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Landlord Details</CardTitle>
            <CardDescription>
              Please provide your details to start the verification process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={landlordForm.handleSubmit(landlordOnSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="landlordName">Landlord (Makan Malik) Name *</Label>
                  <Input
                    id="landlordName"
                    {...landlordForm.register('landlordName')}
                    placeholder="Makan Malik Ka Naam"
                  />
                  {landlordForm.formState.errors.landlordName && (
                    <p className="text-sm text-red-600 mt-1">{landlordForm.formState.errors.landlordName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="landlordPhone">Landlord Phone *</Label>
                  <Input
                    id="landlordPhone"
                    {...landlordForm.register('landlordPhone')}
                    placeholder="+1234567890"
                  />
                  {landlordForm.formState.errors.landlordPhone && (
                    <p className="text-sm text-red-600 mt-1">{landlordForm.formState.errors.landlordPhone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address of Property * (Max 500 characters)</Label>
                <Textarea
                  id="address"
                  {...landlordForm.register('address')}
                  placeholder="Rent pe diye jane wale makan ka address"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {landlordForm.watch('address')?.length || 0}/500 characters
                </div>
                {landlordForm.formState.errors.address && (
                  <p className="text-sm text-red-600 mt-1">{landlordForm.formState.errors.address.message}</p>
                )}
              </div>

              {landlordForm.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>{landlordForm.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Continue to Verification'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OtpVerification({ onVerify, isSubmitting, error }: {
  onVerify: (otp: string) => void;
  isSubmitting: boolean;
  error: string;
}) {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      onVerify(otp);
    }
  };

  return (
    <div className=" bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Clock className="h-6 w-6" />
            Verify Your Phone
          </CardTitle>
          <CardDescription>
            We've sent a 6-digit OTP to your phone number. Please enter it below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || otp.length !== 6}>
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
