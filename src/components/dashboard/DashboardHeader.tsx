import { User } from '@/types/auth';
import { styles } from '@/utils/constants';
import { ProfileDropdown } from '@/components/layout/ProfileDropdown';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface DashboardHeaderProps {
  user: User | null;
}

export const DashboardHeader = ({ user }: DashboardHeaderProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  return (
    <header className={`fixed w-full z-50 ${styles.glassmorph} py-4`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <h1 className={`text-2xl font-bold ${styles.primaryText}`}>
          Dashboard
        </h1>
        {user && (
          <ProfileDropdown 
            user={user} 
            onLogout={handleLogout}
          />
        )}
      </div>
    </header>
  );
}; 