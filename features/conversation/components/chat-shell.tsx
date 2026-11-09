"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSideBar from "./app-sidebar";

export default function ChatShell({ children }: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <AppSideBar />
            <SidebarInset className="min-h-svh overflow-hidden">
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}