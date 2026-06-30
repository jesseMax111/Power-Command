import { Link, useLocation } from "wouter";
import { useAuth, useUser } from "@clerk/react";
import { LayoutDashboard, FileText, Users, LogOut, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/users", label: "Users", icon: Users },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useAuth();
  const { user } = useUser();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="w-60 flex flex-col bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-bold text-sidebar-foreground leading-tight">PowerPulse</div>
            <div className="text-xs text-muted-foreground">Admin Panel</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary uppercase shrink-0">
              {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "A"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-sidebar-foreground truncate">
                {user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Admin"}
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
