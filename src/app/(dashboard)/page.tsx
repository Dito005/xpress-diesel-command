import { createClient } from '@/lib/supabase/server';
import { AdminDashboard } from '@/components/AdminDashboard';
import { TechnicianDashboard } from '@/components/TechnicianDashboard';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: techProfile } = await supabase
    .from('techs')
    .select('role')
    .eq('id', user.id)
    .single();
  
  const userRole = techProfile?.role || 'unassigned';

  if (userRole === 'admin' || userRole === 'manager') {
    return <AdminDashboard userRole={userRole} />;
  }

  if (userRole === 'tech' || userRole === 'road') {
    return <TechnicianDashboard userRole={userRole} />;
  }

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
}