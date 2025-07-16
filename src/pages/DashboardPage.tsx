import { useSession } from '@/components/SessionProvider';
import { AdminDashboard } from '@/components/AdminDashboard';
import { TechnicianDashboard } from '@/components/TechnicianDashboard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

export const DashboardPage = () => {
  const { userRole, isLoading } = useSession();

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><LoadingSkeleton /></div>;
  }

  // Admins and managers see the main dashboard
  if (userRole === 'admin' || userRole === 'manager') {
    return <AdminDashboard />;
  }

  // Techs and road techs see their specific dashboard
  if (userRole === 'tech' || userRole === 'road') {
    return <TechnicianDashboard />;
  }

  // Fallback for other roles or unassigned users
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome!</h1>
        <p className="text-muted-foreground">
          Your role is currently '{userRole}'. A dashboard for your role is coming soon.
        </p>
        {userRole === 'unassigned' && (
          <p className="text-sm text-yellow-500 mt-2">Please contact an administrator to have your role assigned.</p>
        )}
      </div>
    </div>
  );
};