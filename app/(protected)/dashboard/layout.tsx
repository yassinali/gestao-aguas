"use client";

import type React from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { useSessionData } from "@/lib/hooks/useSessionData";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSessionData();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-neutral-medium">Loading…</div>
      </div>
    );
  }

  if (!session) {
    redirect("/auth/sign-in");
  }

  const userForHeader = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? undefined,
  };

  return (
    <div className="flex h-screen bg-neutral-light">
      <Sidebar userRole={session.user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={userForHeader} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
