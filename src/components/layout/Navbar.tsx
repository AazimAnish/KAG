"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { styles } from '@/utils/constants';
import { ProfileDropdown } from './ProfileDropdown';
import { User } from '@/types/auth';
import Link from 'next/link';
import { supabase } from "@/lib/supabase/client";

export const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link 
    href={href} 
    className={`text-[#FFFDEC]/80 hover:text-[#347928] transition-colors duration-200`}
  >
    {children}
  </Link>
);

export const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, gender, body_type, avatar_url, measurements')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              email: session.user.email!,
              name: profile.name,
              avatar_url: profile.avatar_url,
              gender: profile.gender,
              bodyType: profile.body_type,
              measurements: profile.measurements,
            });
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-opacity-80 backdrop-blur-sm">
      <div className={`${styles.glassmorph} py-4`}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/" className={`text-2xl font-bold ${styles.primaryText}`}>
            KAG
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <ProfileDropdown user={user} />
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" className="text-[#FFFDEC]">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-[#347928] hover:bg-[#347928]/80 text-[#FFFDEC]">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
