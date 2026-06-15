"use client";

import Sidebar from "@/components/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const isLoginPage = pathname === "/login";

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace("/login");
    }
  }, [user, loading, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading screen while session resolves
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">Verifying session...</span>
        </div>
      </div>
    );
  }

  // Don't render the protected layout until authenticated
  if (!user) return null;

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
