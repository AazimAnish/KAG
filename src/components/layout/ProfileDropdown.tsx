"use client";

import { User } from "@/types/auth";
import { styles } from "@/utils/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { User as UserIcon, Settings, LogOut } from 'lucide-react';
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ProfileDropdownProps {
  user: User | null;
  onLogout?: () => Promise<void>;
}

export const ProfileDropdown = ({ user, onLogout }: ProfileDropdownProps) => {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';

  const handleLogout = async () => {
    try {
      // First, clear any existing sessions - use global scope to clear all sessions
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();

      // Clear cookies via document.cookie (browser-only)
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }

      // Force a hard refresh to clear client-side cache
      window.location.href = '/signin';
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: force clear everything
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/signin';
    }
  };

  const handleProfile = () => {
    router.push('/dashboard');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="h-8 w-8 border-2 border-primary/30 hover:border-primary/50 transition-colors">
          {user.avatar_url ? (
            <AvatarImage src={user.avatar_url} alt={user.name || 'User'} />
          ) : (
            <AvatarFallback className={`${styles.glassmorph} text-foreground`}>
              {user.name?.charAt(0) || user.email?.charAt(0)}
            </AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={`${styles.glassmorph} border-primary/30`}>
        <div className="px-2 py-1.5 text-sm text-foreground/70">
          {user.email}
        </div>
        <DropdownMenuSeparator className="bg-primary/20" />
        <DropdownMenuItem 
          onClick={handleProfile}
          className="text-foreground cursor-pointer hover:bg-primary/20 gap-2"
        >
          <UserIcon className="w-4 h-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSettings}
          className="text-foreground cursor-pointer hover:bg-primary/20 gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-primary/20" />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-foreground cursor-pointer hover:bg-primary/20 gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};