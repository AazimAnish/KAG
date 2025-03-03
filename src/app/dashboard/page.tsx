"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User } from '@/types/auth';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { styles } from '@/utils/constants';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast()

  useEffect(() => {
    const checkUser = async () => {
      try {
        // First try to get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // If no session or session error, try to get user as fallback
        if (!session || sessionError) {
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
          
          if (authError || !authUser) {
            router.push('/signin');
            return;
          }
        }

        // Get the user from the session or direct auth call
        const authUser = session?.user || (await supabase.auth.getUser()).data.user;
        
        if (!authUser) {
          router.push('/signin');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError) {
          // Handle specific Supabase error codes
          if (profileError.code === 'PGRST116') { // No rows found
            router.push('/profile-setup');
            return;
          }
          throw new Error(profileError.message);
        }

        const userData: User = {
          id: profile.id,
          email: authUser.email!,
          name: profile.name,
          avatar_url: profile.avatar_url,
          gender: profile.gender,
          bodyType: profile.body_type,
          measurements: profile.measurements,
        };

        setUser(userData);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        toast({
          title: "Authentication Error",
          description: "Please try refreshing the page or sign in again.",
          variant: "destructive"
        });
        router.push('/signin');
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          router.push('/signin');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          checkUser();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className={`min-h-screen ${styles.darkBg} flex items-center justify-center`}>
        <div className={`${styles.primaryText} text-xl`}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${styles.darkBg}`}>
      <DashboardHeader user={user} />
      <DashboardContent user={user} />
    </div>
  );
}