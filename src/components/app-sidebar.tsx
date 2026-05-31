import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import HeroBrand from "./hero-brand";
import { Settings } from "lucide-react";
import { useLocation } from "react-router-dom";

// This is sample data.
type NavItem = { title: string; url: string; isActive?: boolean };
type NavGroup = { title: string; url?: string; items: NavItem[] };

const data: { navMain: NavGroup[] } = {
  navMain: [
    {
      title: "Quick Links",
      url: "#",
      items: [
        {
          title: "Students",
          url: "/students",
        },
        {
          title: "Courses",
          url: "/courses",
        },
      ],
    },
    {
      title: "Financials",
      url: "#",
      items: [
        {
          title: "Fee Reports",
          url: "/fee-reports",
        },
        {
          title: "Pending Installments",
          url: "/pending-installments",
        },
        {
          title: "Pending Registeration Fees",
          url: "/pending-registeration",
        },
      ],
    },
    {
      title: "Courses",
      url: "#",
      items: [
        {
          title: "Batches",
          url: "/batches",
        },
        {
          title: "Year Promotion",
          url: "/promotions",
        },
        {
          title: "Time Table",
          url: "/time-table",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const modulePath = location.pathname.split("/")[1];
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <HeroBrand />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <React.Fragment key={item.title}>
            <Separator />
            <SidebarGroup>
              <SidebarGroupLabel className="tracking-wide font-semibold">
                {item.title.toUpperCase()}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {item.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={`/${modulePath}` === item.url}
                      >
                        <a href={item.url}>{item.title}</a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </React.Fragment>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="flex justify-end group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              isActive={location.pathname === "/settings"}
              className="h-9 w-9 justify-center p-0"
              aria-label="Settings"
            >
              <a href="/settings">
                <Settings />
                <span className="sr-only">Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
