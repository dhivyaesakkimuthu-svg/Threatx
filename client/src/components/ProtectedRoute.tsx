import type { ReactNode } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import type { UserRole } from '../services/api';

interface ProtectedRouteProps {
  children?: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-center">
            <h2 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
              THREATX SOC GATEWAY
            </h2>
            <p className="text-xs text-[#667085] mt-0.5">Verifying authentication session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] mb-4 text-[#DC2626]">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-lg font-bold text-[#172033]">Access Restricted</h2>
        <p className="text-xs text-[#667085] max-w-md mt-1.5">
          Your account role (<span className="text-[#2563EB] font-mono font-bold uppercase">{user.role}</span>) does not have authorization to access this section.
        </p>
        <p className="text-[11px] font-mono text-[#98A2B3] mt-1">
          Required roles: [{allowedRoles.join(', ')}]
        </p>
        <a
          href="/"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-gray-900 text-xs font-semibold transition-all shadow-sm"
        >
          <ArrowLeft size={14} /> Return to Dashboard
        </a>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
