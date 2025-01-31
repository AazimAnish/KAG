"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { styles } from '@/utils/constants';
import { ProfileDropdown } from './ProfileDropdown';
import { User } from '@/types/auth';
import Link from 'next/link';
import { supabase } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link 
    href={href} 
    className={`text-[#FFFDEC] hover:text-[#347928] transition-colors`}
  >
    {children}
  </Link>
);

export const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Initial user check
    getUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            id: session.user.id,
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
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          name: profile.name,
          avatar_url: profile.avatar_url,
          gender: profile.gender,
          bodyType: profile.body_type,
          measurements: profile.measurements,
        });
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#1A1A19]/80 backdrop-blur-lg' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - now always links to home */}
          <Link href="/" className="flex items-center">
            <span className={`font-cinzel text-2xl ${styles.primaryText}`}>KAG</span>
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/dashboard/wardrobe">Wardrobe</NavLink>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className={`${styles.glassmorph} hover:bg-[#347928]/20 text-[#FFFDEC]`}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </Button>
                <ProfileDropdown user={user} onLogout={handleSignOut} />
              </>
            ) : (
              <>
                <NavLink href="/#features">Features</NavLink>
                <NavLink href="/#pricing">Pricing</NavLink>
                <NavLink href="/#about">About</NavLink>
                <Link href="/signin">
                  <Button 
                    className={`${styles.glassmorph} hover:bg-[#347928]/20 text-[#FFFDEC]`}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button 
                    className="bg-[#347928] hover:bg-[#347928]/80 text-[#FFFDEC]"
                  >
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
