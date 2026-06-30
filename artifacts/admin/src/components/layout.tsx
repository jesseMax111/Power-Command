import { Link, useLocation } from "wouter";
import { useAuth, useUser } from "@clerk/react";
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  Zap,
  Map,
  Bell,
  MapPin,
  User,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const userNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/map", label: "Live Map", icon: Map },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/saved-locations", label: "Saved Locations", icon: MapPin },
  { href: "/profile", label: "Profile", icon: User },
];

const reportNav = [
  { href: "/report/outage", label: "Power Outage", icon: Zap, color: "text-red-400" },
  { href: "/report/restoration", label: "Power Restored", icon: Zap, color: "text-green-400" },
  { href: "/report/transformer", label: "Transformer Fault", icon: AlertTriangle, color: "text-amber-400" },
];

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useAuth();
  const { user } = useUser();
  const [reportOpen, setReportOpen] = useState(() =>
    location.startsWith("/report/") && !location.match(/^\/report\/\d+/)
  );
  const [adminOpen, setAdminOpen] = useState(() => location.startsWith("/admin"));

  const isActive = (href: string) =>
    href === "/dashboard" ? location === "/dashboard" || location === "/"
    : href === "/admin" ? location === "/admin"
    : location.startsWith(href);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-bold text-sidebar-foreground leading-tight">PowerPulse</div>
            <div className="text-xs text-muted-foreground">Community Reports</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {/* User navigation */}
          {userNav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                isActive(href)
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </div>
            </Link>
          ))}

          {/* Report submenu */}
          <div>
            <button
              onClick={() => setReportOpen((o) => !o)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.startsWith("/report/") && !location.match(/^\/report\/\d+$/)
                  ? "bg-primary/20 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Submit Report</span>
              {reportOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {reportOpen && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                {reportNav.map(({ href, label, color }) => (
                  <Link key={href} href={href}>
                    <div className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                      isActive(href)
                        ? "bg-primary text-primary-foreground"
                        : `text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`
                    )}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        color === "text-red-400" ? "bg-red-400" :
                        color === "text-green-400" ? "bg-green-400" : "bg-amber-400"
                      }`} />
                      {label}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="pt-3 pb-1">
            <div className="px-3 flex items-center gap-2">
              <div className="flex-1 h-px bg-sidebar-border" />
              <button
                onClick={() => setAdminOpen((o) => !o)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Shield className="w-3 h-3" />
                Admin
                {adminOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              <div className="flex-1 h-px bg-sidebar-border" />
            </div>
          </div>

          {/* Admin navigation */}
          {adminOpen && adminNav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                isActive(href)
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </div>
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary uppercase shrink-0">
              {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "U"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-sidebar-foreground truncate">
                {user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress ?? "User"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user?.emailAddresses?.[0]?.emailAddress}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
