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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function WardrobePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'upload'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    console.log('Checking user authentication...');
    const startTime = Date.now();
    
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

      if (authUser) {
        console.log(`User found in ${Date.now() - startTime}ms:`, authUser.id);
        setUser({
          id: profile.id,
          email: authUser.email!,
          name: profile.name,
          avatar_url: profile.avatar_url,
          gender: profile.gender,
          bodyType: profile.body_type,
          measurements: profile.measurements,
        });
        setLoading(false);
        loadWardrobeItems(authUser.id);
      }
    } catch (error) {
      console.error('Failed to check user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to authenticate user"
      });
    }
  };

  const loadWardrobeItems = async (userId: string) => {
    console.log('Starting to fetch wardrobe items...');
    const startTime = Date.now();
    
    try {
      setLoading(true);
      console.log(`Fetching items for user: ${userId}`);
      
      const { data, error, count } = await supabase
        .from('wardrobe_items')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log(`Successfully fetched ${count} items in ${Date.now() - startTime}ms`);
      console.log('First item:', data?.[0]);
      
      // Assuming you want to set items state with the fetched data
      // setItems(data || []);
    } catch (error) {
      console.error('Failed to load wardrobe items:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load wardrobe items"
      });
    } finally {
      setLoading(false);
      console.log(`Total load time: ${Date.now() - startTime}ms`);
    }
  };

  const authListener = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      router.push('/signin');
    }
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#347928] mb-4" />
        <p className="text-sm text-gray-500">Loading your wardrobe...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${styles.darkBg}`}>
      <main className="container mx-auto px-4 pt-12">
        <WardrobeNav
          view={view}
          onViewChange={setView}
          onToggleFilters={() => setShowFilters(!showFilters)}
          showFilters={showFilters}
        />
        
        {view === 'upload' ? (
          <WardrobeUpload 
            userId={user?.id || ''} 
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