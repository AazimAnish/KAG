"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shirt, ShoppingBag, Home } from 'lucide-react';
import { styles } from '@/utils/constants';
import { ProfileDropdown } from '../layout/ProfileDropdown';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase/client';
import { User } from '@/types/auth';

const NavItem = ({ href, children, isActive }: { href: string; children: React.ReactNode; isActive: boolean }) => (
    <Link href={href}>
        <motion.div
            className={`
        relative px-4 py-2 
        rounded-full 
        transition-all duration-200
        hover:bg-[#347928]/20
        ${isActive ? 'bg-[#347928]/20' : 'bg-transparent'}
      `}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
        >
            {children}
        </motion.div>
    </Link>
);

export const DockNav = () => {
    const [user, setUser] = useState<User | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
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
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 flex justify-between items-center z-50 p-4 bg-transparent">
            <Link href="/" className={`text-2xl font-bold ${styles.primaryText} ml-4 hover:opacity-80 transition-opacity`}>
                KAG
            </Link>

            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="inline-flex"
            >
                <div className={`
          ${styles.glassmorph} 
          px-6 py-2 
          rounded-full 
          flex items-center gap-4
          backdrop-blur-md
          border border-[#347928]/20
          shadow-lg
        `}>
                    <NavItem href="/" isActive={pathname === '/'}>
                        <Home className="w-5 h-5 text-[#FFFDEC]" />
                    </NavItem>

                    <div className="w-px h-6 bg-[#347928]/20" />

                    <NavItem href="/dashboard/wardrobe" isActive={pathname.includes('/wardrobe')}>
                        <Shirt className="w-5 h-5 text-[#FFFDEC]" />
                    </NavItem>

                    <NavItem href="/store" isActive={pathname.includes('/store')}>
                        <ShoppingBag className="w-5 h-5 text-[#FFFDEC]" />
                    </NavItem>

                    <div className="w-px h-6 bg-[#347928]/20" />

                    {user ? (
                        <ProfileDropdown user={user} />
                    ) : (
                        <div className="flex gap-2">
                            <Link href="/signin">
                                <Button
                                    variant="ghost"
                                    className="text-[#FFFDEC] hover:bg-[#347928]/20"
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
                        </div>
                    )}
                </div>
            </motion.nav>

            <div className="w-[68px]" />
        </div>
    );
}; 