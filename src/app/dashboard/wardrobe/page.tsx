"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User } from '@/types/auth';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { WardrobeUpload } from '@/components/wardrobe/WardrobeUpload';
import { WardrobeGrid } from '@/components/wardrobe/WardrobeGrid';
import { WardrobeNav } from '@/components/wardrobe/WardrobeNav';
import { styles } from '@/utils/constants';

export default function WardrobePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'upload'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          router.push('/signin');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError) throw profileError;

        setUser({
          id: profile.id,
          email: authUser.email!,
          name: profile.name,
          avatar_url: profile.avatar_url,
          gender: profile.gender,
          bodyType: profile.body_type,
          measurements: profile.measurements,
        });
      } catch (error) {
        console.error('Error:', error);
        router.push('/signin');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
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
      <main className="container mx-auto px-4 pt-24">
        <WardrobeNav
          view={view}
          onViewChange={setView}
          onToggleFilters={() => setShowFilters(!showFilters)}
          showFilters={showFilters}
        />
        
        {view === 'upload' ? (
          <WardrobeUpload 
            userId={user?.id} 
            onSuccess={() => setView('grid')}
          />
        ) : (
          <WardrobeGrid 
            userId={user?.id} 
            showFilters={showFilters}
          />
        )}
      </main>
    </div>
  );
} 