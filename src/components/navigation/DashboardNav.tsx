"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut, Shirt } from 'lucide-react';
import { styles } from '@/utils/constants';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export const DashboardNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  
  const isActive = (path: string) => pathname.startsWith(path);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  return (
    <nav className={`fixed top-0 w-full z-50 ${styles.glassmorph} border-b border-[#347928]/20`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className={styles.primaryText}>
              <span className="text-xl font-bold">KAG</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/dashboard/wardrobe">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${styles.glassmorph} hover:bg-[#347928]/20 ${
                    isActive('/dashboard/wardrobe') ? 'bg-[#347928]/20' : ''
                  }`}
                >
                  <Shirt className="h-5 w-5 text-[#FFFDEC]" />
                  <span className={`ml-2 ${styles.secondaryText}`}>Wardrobe</span>
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${styles.glassmorph} hover:bg-[#347928]/20 ${
                    pathname === '/dashboard' ? 'bg-[#347928]/20' : ''
                  }`}
                >
                  <User className="h-5 w-5 text-[#FFFDEC]" />
                  <span className={`ml-2 ${styles.secondaryText}`}>Profile</span>
                </Button>
              </Link>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={`${styles.glassmorph} hover:bg-[#347928]/20`}
          >
            <LogOut className="h-5 w-5 text-[#FFFDEC]" />
            <span className={`ml-2 ${styles.secondaryText}`}>Sign Out</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}; 