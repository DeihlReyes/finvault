"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { FAB } from "./fab";
import { OfflineBanner } from "./offline-banner";
import { DirectoryBreadcrumb } from "./directory-breadcrumb";

type User = { name: string; email: string; avatar: string };

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  return (
    <SidebarProvider className="p-2">
      <AppSidebar user={user} />
      <SidebarInset className="bg-secondary/5 rounded-lg">
        <header className="flex  items-center gap-2 h-12 px-4 border-b border-border shrink-0">
          <SidebarTrigger />
          <DirectoryBreadcrumb />
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>

        <FAB />
        <OfflineBanner />
      </SidebarInset>
    </SidebarProvider>
  );
}
