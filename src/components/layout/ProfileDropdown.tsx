"use client";

import { User } from "@/types/auth";
import { styles } from "@/utils/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface ProfileDropdownProps {
  user: User | null;
  onLogout?: () => Promise<void>;
}

export const ProfileDropdown = ({ user, onLogout }: ProfileDropdownProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    }
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="h-8 w-8 border-2 border-[#347928]/30">
          <AvatarFallback className={`${styles.glassmorph} text-[#FFFDEC]`}>
            {user.name?.charAt(0) || user.email?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={`${styles.glassmorph} border-[#347928]/30`}>
        <DropdownMenuItem 
          onClick={handleDashboard}
          className="text-[#FFFDEC] cursor-pointer hover:bg-[#347928]/20"
        >
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-[#FFFDEC] cursor-pointer hover:bg-[#347928]/20"
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};