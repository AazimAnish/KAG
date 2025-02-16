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

interface ProfileDropdownProps {
  user: User | null;
  onLogout?: () => Promise<void>;
}

export const ProfileDropdown = ({ user, onLogout }: ProfileDropdownProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/signin');
    } catch (error) {
      console.error('Error logging out:', error);
      // Force clear the session if there's an error
      supabase.auth.signOut();
      router.push('/signin');
    }
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="h-8 w-8 border-2 border-[#347928]/30 hover:border-[#347928]/50 transition-colors">
          {user.avatar_url ? (
            <AvatarImage src={user.avatar_url} alt={user.name || 'User'} />
          ) : (
            <AvatarFallback className={`${styles.glassmorph} text-[#FFFDEC]`}>
              {user.name?.charAt(0) || user.email?.charAt(0)}
            </AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={`${styles.glassmorph} border-[#347928]/30`}>
        <div className="px-2 py-1.5 text-sm text-[#FFFDEC]/70">
          {user.email}
        </div>
        <DropdownMenuSeparator className="bg-[#347928]/20" />
        <DropdownMenuItem 
          onClick={handleProfile}
          className="text-[#FFFDEC] cursor-pointer hover:bg-[#347928]/20 gap-2"
        >
          <UserIcon className="w-4 h-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSettings}
          className="text-[#FFFDEC] cursor-pointer hover:bg-[#347928]/20 gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#347928]/20" />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-[#FFFDEC] cursor-pointer hover:bg-[#347928]/20 gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};