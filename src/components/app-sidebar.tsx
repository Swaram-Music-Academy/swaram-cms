import * as React from "react";
import {
  Sidebar,
  SidebarContent,
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
    </Sidebar>
  );
}
