import { Shield, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PoliceWelcomeProps {
  admin: string;
}
export function PoliceWelcome({admin}: PoliceWelcomeProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className=" bg-linear-to-br from-blue-50 via-white to-blue-50 relative">
      <div className="absolute inset-0 bg-[url('/logo.jpeg')] bg-no-repeat bg-center bg-cover opacity-3"></div>
      <div className="relative z-10  flex items-center justify-center p-4">
        <div className="max-w-6xl w-full space-y-12">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Image
                  src="/logo.jpeg"
                  alt="Police Department Logo"
                  width={120}
                  height={120}
                  className="rounded-full shadow-lg border-4 border-white"
                />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Welcome, {admin}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Secure police department platform for tenant background verification.
              Connecting landlords and law enforcement for safer communities.
            </p>
          </div>

          <div className="grid md:grid-cols-1 gap-8 max-w-2xl mx-auto">
            {/* <Card className="hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  Makan Malik Portal
                </CardTitle>
                <CardDescription className="text-base">
                  Submit tenant verification requests with secure OTP verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/landlord">
                  <Button className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700">
                    Verify My Tenant
                  </Button>
                </Link>
              </CardContent>
            </Card> */}

            <Card className="hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  {admin} Portal
                </CardTitle>
                <CardDescription className="text-base">
                  Secure portal for {admin} officers to manage verification requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login">
                  <Button className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700">
                    {admin} Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
