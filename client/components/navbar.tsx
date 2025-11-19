'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Shield, Home, User, LogIn, LogOut, Settings, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChangePasswordDialog } from './change-password-dialog';

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <Image
                  src="/logo.jpeg"
                  alt="Police Department Logo"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-blue-600"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <Shield className="w-2 h-2 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900">Tenant Verification</h1>
                <p className="text-xs text-gray-600">Police Department</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>

            {!user && (
              <>
                <Link href="/landlord">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Landlord</span>
                  </Button>
                </Link>
              </>
            )}

            {user && (
              <>
                {user.role === 'superAdmin' && (
                  <Link href="/superadmin">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  </Link>
                )}
                <ChangePasswordDialog>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    <span className="hidden sm:inline">Password</span>
                  </Button>
                </ChangePasswordDialog>
                <Button onClick={logout} variant="outline" size="sm" className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
