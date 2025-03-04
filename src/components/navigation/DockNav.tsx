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
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "next-themes";

interface NavItemProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
}

const NavItem = ({ href, icon, label, isActive }: NavItemProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Wait until mounted to ensure we have access to theme
    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && theme === 'dark';

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
                        ${isActive 
                            ? 'bg-primary/20 dark:bg-primary/20' 
                            : 'hover:bg-primary/20 dark:hover:bg-primary/20'
                        }
                    `}
                    whileHover={{ scale: 1.4 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {icon}
                </motion.div>
                
                <AnimatePresence>
                    {isHovered && (
                        <motion.span
                            className={`
                                absolute top-full mt-2 px-2 py-1 
                                bg-secondary/90 dark:bg-muted 
                                text-secondary-foreground dark:text-foreground
                                text-xs rounded whitespace-nowrap
                            `}
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
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Wait until mounted to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && theme === 'dark';

    useEffect(() => {
        const checkAuthState = async () => {
            try {
                setIsLoading(true);
                // First check current session
                const { data: { session } } = await supabase.auth.getSession();
                
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
            } catch (error) {
                console.error('Auth check error:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthState();

        // Setup auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    checkAuthState();
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const navItems: NavItemProps[] = [
        { 
            href: '/', 
            icon: <Home className="w-5 h-5 text-foreground" />, 
            label: 'Home', 
            isActive: pathname === '/' 
        },
        { 
            href: '/dashboard/wardrobe', 
            icon: <Shirt className="w-5 h-5 text-foreground" />, 
            label: 'Wardrobe', 
            isActive: pathname.includes('/wardrobe') 
        },
        { 
            href: '/store', 
            icon: <Store className="w-5 h-5 text-foreground" />, 
            label: 'Store', 
            isActive: pathname.includes('/store') 
        },
        { 
            href: '/dashboard/kag-ai', 
            icon: <Wand2 className="w-5 h-5 text-foreground" />, 
            label: 'KAG-AI', 
            isActive: pathname.includes('/kag-ai') 
        },
        { 
            href: '/cart', 
            icon: <ShoppingBag className="w-5 h-5 text-foreground" />, 
            label: 'Cart', 
            isActive: pathname.includes('/cart') 
        },
    ];

    return (
        <div className="fixed top-0 left-0 right-0 flex justify-between items-center z-50 p-4 bg-transparent">
            <Link href="/" className={`text-2xl font-bold ${styles.primaryText} ml-4 hover:opacity-80 transition-opacity`}>
                KAG
            </Link>

            <div className="absolute right-4">
                <ThemeToggle />
            </div>

            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="inline-flex mx-auto"
            >
                <div className={`
                    ${styles.glassmorph} 
                    px-6 py-2 
                    rounded-full 
                    flex items-center gap-4
                    backdrop-blur-md
                    border border-primary/30
                    shadow-lg
                `}>
                    {navItems.map((item, index) => (
                        <div key={item.href} className="flex items-center">
                            <NavItem {...item} />
                            {index < navItems.length - 1 && (
                                <div className="w-px h-6 bg-primary/20" />
                            )}
                        </div>
                    ))}

                    {isLoading ? (
                        <div className="h-8 w-8 flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 text-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    ) : user ? (
                        <ProfileDropdown user={user} />
                    ) : (
                        <div className="flex gap-2">
                            <Link href="/signin">
                                <Button
                                    variant="ghost"
                                    className="text-foreground hover:bg-primary/20"
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
                        </div>
                    )}
                </div>
            </motion.nav>

            <div className="w-[68px]" />
        </div>
    );
};