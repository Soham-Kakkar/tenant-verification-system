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

const schema = Joi.object({
  landlordName: Joi.string().required(),
  landlordPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  tenantName: Joi.string().required(),
  tenantPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  fatherName: Joi.string().optional(),
  aadharNumber: Joi.string().pattern(/^\d{12}$/).optional(),
  purposeOfStay: Joi.string().optional(),
  previousAddress: Joi.string().optional(),
  address: Joi.string().required(),
  stationId: Joi.string().required(),
});

type FormData = {
  landlordName: string;
  landlordPhone: string;
  tenantName: string;
  tenantPhone: string;
  fatherName?: string;
  aadharNumber?: string;
  purposeOfStay?: string;
  previousAddress?: string;
  address: string;
  stationId: string;
};

type Step = 'form' | 'otp' | 'success';

export default function LandlordForm() {
  const [currentStep, setCurrentStep] = useState<Step>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationId, setVerificationId] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [files, setFiles] = useState<{ tenantPhoto?: File; aadharPhoto?: File; familyPhoto?: File }>({});
  const [fileErrors, setFileErrors] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: joiResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
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
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      if (files.tenantPhoto) formData.append('tenantPhoto', files.tenantPhoto);
      if (files.aadharPhoto) formData.append('aadharPhoto', files.aadharPhoto);
      if (files.familyPhoto) formData.append('familyPhoto', files.familyPhoto);

      const response = await api.post('/landlord/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setVerificationId(response.data.verificationId);
      setCurrentStep('otp');
    } catch (error: any) {
      console.error('Submission failed:', error);
      setFileErrors(error.response?.data?.error || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    setIsSubmitting(true);
    setOtpError('');
    try {
      await api.post('/landlord/verify-otp', { verificationId, otp });
      setCurrentStep('success');
    } catch (error: any) {
      setOtpError(error.response?.data?.error || 'OTP verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentStep === 'otp') {
    return <OtpVerification onVerify={verifyOtp} isSubmitting={isSubmitting} error={otpError} />;
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
            <CardTitle>Tenant Verification Request</CardTitle>
            <CardDescription>
              Please fill out this form to verify your tenant's background.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="landlordName">Landlord (Makan Malik) Name *</Label>
                  <Input
                    id="landlordName"
                    {...register('landlordName')}
                    placeholder="Makan Malik Ka Naam"
                  />
                  {errors.landlordName && (
                    <p className="text-sm text-red-600 mt-1">{errors.landlordName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="landlordPhone">Landlord Phone *</Label>
                  <Input
                    id="landlordPhone"
                    {...register('landlordPhone')}
                    placeholder="+1234567890"
                  />
                  {errors.landlordPhone && (
                    <p className="text-sm text-red-600 mt-1">{errors.landlordPhone.message}</p>
                  )}
                </div>
              </div>
              <hr style={{
                margin:" 40px",
                background:" #00000017",
                display:" block",
                height:" 4px",
                borderRadius:" 99px",
              } }/>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenantName">Tenant (Kirayedar) Name *</Label>
                  <Input
                    id="tenantName"
                    {...register('tenantName')}
                    placeholder="Kirayedar Ka Naam"
                  />
                  {errors.tenantName && (
                    <p className="text-sm text-red-600 mt-1">{errors.tenantName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="tenantPhone">Tenant Phone *</Label>
                  <Input
                    id="tenantPhone"
                    {...register('tenantPhone')}
                    placeholder="+1234567890"
                  />
                  {errors.tenantPhone && (
                    <p className="text-sm text-red-600 mt-1">{errors.tenantPhone.message}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fatherName">Tenant Father Name *</Label>
                  <Input
                    id="fatherName"
                    {...register('fatherName')}
                    placeholder="Enter father's full name"
                  />
                  {errors.fatherName && (
                    <p className="text-sm text-red-600 mt-1">{errors.fatherName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="aadharNumber">Aadhaar Number *</Label>
                  <Input
                    id="aadharNumber"
                    {...register('aadharNumber')}
                    placeholder="123456789012"
                    maxLength={12}
                  />
                  {errors.aadharNumber && (
                    <p className="text-sm text-red-600 mt-1">{errors.aadharNumber.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="purposeOfStay">Purpose of Stay *</Label>
                <Textarea
                  id="purposeOfStay"
                  {...register('purposeOfStay')}
                  placeholder="Enter purpose of stay"
                  rows={2}
                />
                {errors.purposeOfStay && (
                  <p className="text-sm text-red-600 mt-1">{errors.purposeOfStay.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="previousAddress">Previous Address *</Label>
                <Textarea
                  id="previousAddress"
                  {...register('previousAddress')}
                  placeholder="Kirayedar ka poorana address"
                  rows={2}
                />
                {errors.previousAddress && (
                  <p className="text-sm text-red-600 mt-1">{errors.previousAddress.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address">Address of Property *</Label>
                <Textarea
                  id="address"
                  {...register('address')}
                  placeholder="Rent pe diye jane wale makan ka address"
                  rows={3}
                />
                {errors.address && (
                  <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="stationId">Police Station *</Label>
                <Select onValueChange={(value) => setValue('stationId', value)}>
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
                {errors.stationId && (
                  <p className="text-sm text-red-600 mt-1">{errors.stationId.message}</p>
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
