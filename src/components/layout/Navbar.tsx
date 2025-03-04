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
    className="text-foreground hover:text-primary transition-colors"
  >
    {children}
  </Link>
);

export const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    const checkAuthState = async () => {
      try {
        setIsLoading(true);
        // Check for active session
        const { data: { session } } = await supabase.auth.getSession();
        
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
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial auth check
    checkAuthState();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAuthState();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      // Use global scope to ensure complete sign-out
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force a hard refresh to clear client-side state
      window.location.href = '/signin';
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback for errors
      window.location.href = '/signin';
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'nav-blur' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - now always links to home */}
          <Link href="/" className="flex items-center">
            <span className="font-cinzel text-2xl text-primary">KAG</span>
          </Link>

          <div className="flex items-center gap-6">
            {isLoading ? (
              <div className="h-8 w-8 flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : user ? (
              <>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/dashboard/wardrobe">Wardrobe</NavLink>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="hover:bg-primary/20 text-foreground"
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
                    variant="ghost"
                    className="hover:bg-primary/20 text-foreground"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button 
                    className="bg-primary hover:bg-primary/80 text-primary-foreground"
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
