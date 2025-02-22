"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, ShoppingBag, Home, Store, User2, Wand2 } from 'lucide-react';
import { styles } from '@/utils/constants';
import { ProfileDropdown } from '../layout/ProfileDropdown';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase/client';
import { User } from '@/types/auth';

interface NavItemProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
}

const NavItem = ({ href, icon, label, isActive }: NavItemProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Link href={href}>
            <motion.div
                className="relative flex flex-col items-center"
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
            >
                <motion.div
                    className={`
                        relative px-4 py-2 
                        rounded-full 
                        transition-colors
                        ${isActive ? 'bg-[#347928]/20' : 'hover:bg-[#347928]/20'}
                    `}
                    whileHover={{ scale: 1.4 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {icon}
                </motion.div>
                
                <AnimatePresence>
                    {isHovered && (
                        <motion.span
                            className="absolute top-full mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.div>
        </Link>
    );
};

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

    const navItems: NavItemProps[] = [
        { href: '/', icon: <Home className="w-5 h-5 text-[#FFFDEC]" />, label: 'Home', isActive: pathname === '/' },
        { href: '/dashboard/wardrobe', icon: <Shirt className="w-5 h-5 text-[#FFFDEC]" />, label: 'Wardrobe', isActive: pathname.includes('/wardrobe') },
        { href: '/store', icon: <Store className="w-5 h-5 text-[#FFFDEC]" />, label: 'Store', isActive: pathname.includes('/store') },
        { href: '/dashboard/kag-ai', icon: <Wand2 className="w-5 h-5 text-[#FFFDEC]" />, label: 'KAG-AI', isActive: pathname.includes('/kag-ai') },
        { href: '/cart', icon: <ShoppingBag className="w-5 h-5 text-[#FFFDEC]" />, label: 'Cart', isActive: pathname.includes('/cart') },
    ];

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
                    {navItems.map((item, index) => (
                        <div key={item.href} className="flex items-center">
                            <NavItem {...item} />
                            {index < navItems.length - 1 && (
                                <div className="w-px h-6 bg-[#347928]/20" />
                            )}
                        </div>
                    ))}

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