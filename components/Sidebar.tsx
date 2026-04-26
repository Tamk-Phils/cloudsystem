"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Database, 
  RefreshCcw, 
  History, 
  Settings, 
  ShieldCheck,
  LogOut,
  School
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "School System", href: "/school", icon: School },
  { name: "Backups", href: "/backups", icon: Database },
  { name: "Recovery", href: "/recovery", icon: RefreshCcw },
  { name: "System Logs", href: "/logs", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen w-64 bg-background border-r border-white/[0.05] fixed left-0 top-0 z-50">
      <div className="p-8 flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
          <ShieldCheck className="text-primary w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold font-outfit tracking-tight">
          UniBackup
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive 
                  ? "text-primary bg-primary/5 font-medium" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.02]"
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
              )}
              <item.icon className={cn("w-4.5 h-4.5 transition-colors", isActive ? "text-primary" : "group-hover:text-foreground")} />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/[0.05]">
        <button className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all text-sm">
          <LogOut className="w-4.5 h-4.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
