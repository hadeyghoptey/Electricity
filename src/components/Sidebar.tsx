"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Home,
  Building2,
  Settings,
  FileText,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/primary", label: "Primary House", icon: Home },
  { href: "/secondary", label: "Secondary House", icon: Building2 },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r border-border bg-card shrink-0">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Electricity</h1>
            <p className="text-[11px] text-muted-foreground -mt-0.5">Bill Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1 h-4 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>System Active</span>
          <span className="ml-auto">v1.0</span>
        </div>
      </div>
    </aside>
  );
}
