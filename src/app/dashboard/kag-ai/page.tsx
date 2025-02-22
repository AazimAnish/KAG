"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User } from '@/types/auth';
import { styles } from '@/utils/constants';
import { OutfitRecommender } from '@/components/wardrobe/OutfitRecommender';
import { Loader2 } from 'lucide-react';

export default function KagAIPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

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
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      router.push('/signin');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#347928] mb-4" />
        <p className="text-sm text-gray-500">Loading KAG-AI...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${styles.darkBg}`}>
      <main className="container mx-auto px-4 pt-12">
        <h1 className={`text-3xl font-bold mb-8 ${styles.primaryText}`}>KAG-AI Outfit Recommender</h1>
        <OutfitRecommender userId={user?.id || ''} />
      </main>
    </div>
  );
}