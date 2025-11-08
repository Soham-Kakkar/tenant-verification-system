import { Shield, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Tenant Verification System</h3>
                <p className="text-sm text-gray-400">Police Department</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Secure platform connecting landlords and law enforcement for tenant background verification.
              Ensuring safer communities through trusted partnerships.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/landlord" className="hover:text-white transition-colors">Landlord Portal</a></li>
              <li><a href="/login" className="hover:text-white transition-colors">Police Login</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="text-sm">Emergency: 100</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">phqjk@jkpolice.gov.in</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">J&K Police Headquarters</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Shield className="w-5 h-5 text-blue-400" />
            <p className="text-gray-400">
              © {currentYear} Police Department Tenant Verification System. All rights reserved.
            </p>
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-sm text-gray-500">
            This system is for official use only. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </footer>
  );
}
