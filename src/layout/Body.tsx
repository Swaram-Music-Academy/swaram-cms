import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";
import { Theme, useTheme } from "@/providers/theme-provider";
import { User2Icon } from "lucide-react";
import { useSession } from "@/auth/SessionContext";

export default function Body({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const { theme, setTheme } = useTheme();
  const logout = async () => {
    await supabase.auth.signOut();
  };

  const { open } = useSidebar();
  return (
    <>
      <header className="select-none flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer" asChild>
            <Avatar className="ml-auto">
              <AvatarImage
                src={user?.avatar_url ? user.avatar_url : ""}
                alt="Profile Pic"
              />
              <AvatarFallback>
                <User2Icon className="text-gray-500 dark:text-neutral-500" />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 mr-4">
            <DropdownMenuLabel>{user?.name || "User"}</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Change Theme</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={(value) => setTheme(value as Theme)}
                  >
                    <DropdownMenuRadioItem value="light">
                      Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      System
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem
              onClick={logout}
              className="text-red-500 dark:text-red-300 hover:!text-red-500 dark:hover:!text-red-300 hover:!bg-red-50 dark:hover:!bg-red-400/10"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div
        className={`w-screen ${
          open ? "lg:w-[calc(100vw-16rem)]" : "lg-w-screen"
        }  p-6 h-full`}
      >
        {children}
      </div>
    </>
  );
}
