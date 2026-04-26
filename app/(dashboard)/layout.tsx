"use client";

import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      {/* 
          Main content area:
          - No margin-left on mobile (sidebar is overlay)
          - margin-left-64 on lg screens (sidebar is fixed/persistent)
          - padding-top-16 on mobile to account for fixed mobile header
      */}
      <main className="lg:ml-64 p-4 md:p-8 min-h-screen pt-20 lg:pt-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
