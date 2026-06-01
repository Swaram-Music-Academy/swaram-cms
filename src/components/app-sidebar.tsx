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

/**
 * RBAC foundation note:
 * Keep sidebar items grouped by app module and attach an optional permission key.
 * Once roles/permissions are implemented, filter `item.items` using these keys
 * before rendering. For now, all authenticated users can see all items.
 */
type PermissionKey =
  | "dashboard:view"
  | "students:manage"
  | "courses:manage"
  | "batches:manage"
  | "promotions:manage"
  | "timetable:view"
  | "fees:reports:view"
  | "fees:pending:view"
  | "expenses:manage"
  | "settings:manage";

type NavItem = {
  title: string;
  url: string;
  permission: PermissionKey;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        permission: "dashboard:view",
      },
    ],
  },
  {
    title: "Academy",
    items: [
      {
        title: "Students",
        url: "/students",
        permission: "students:manage",
      },
      {
        title: "Courses",
        url: "/courses",
        permission: "courses:manage",
      },
      {
        title: "Batches",
        url: "/batches",
        permission: "batches:manage",
      },
      {
        title: "Time Table",
        url: "/time-table",
        permission: "timetable:view",
      },
      {
        title: "Year Promotion",
        url: "/promotions",
        permission: "promotions:manage",
      },
    ],
  },
  {
    title: "Financials",
    items: [
      {
        title: "Fee Reports",
        url: "/fee-reports",
        permission: "fees:reports:view",
      },
      {
        title: "Expenses",
        url: "/expenses",
        permission: "expenses:manage",
      },
      {
        title: "Pending Installments",
        url: "/pending-installments",
        permission: "fees:pending:view",
      },
      {
        title: "Pending Registration Fees",
        url: "/pending-registeration",
        permission: "fees:pending:view",
      },
    ],
  },
];

const settingsNavItem: NavItem = {
  title: "Settings",
  url: "/settings",
  permission: "settings:manage",
};

const isItemActive = (pathname: string, itemUrl: string) => {
  if (itemUrl === "/") return pathname === "/";
  return pathname === itemUrl || pathname.startsWith(`${itemUrl}/`);
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <HeroBrand />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <React.Fragment key={group.title}>
            <Separator />
            <SidebarGroup>
              <SidebarGroupLabel className="tracking-wide font-semibold">
                {group.title.toUpperCase()}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isItemActive(location.pathname, item.url)}
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
              tooltip={settingsNavItem.title}
              isActive={isItemActive(location.pathname, settingsNavItem.url)}
              className="h-9 w-9 justify-center p-0"
              aria-label={settingsNavItem.title}
            >
              <a href={settingsNavItem.url}>
                <Settings />
                <span className="sr-only">{settingsNavItem.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
