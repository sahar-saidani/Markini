import { Outlet, Link, useLocation } from "react-router";
import { LayoutDashboard, Sparkles, GitBranch, Settings, LogOut, Store } from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import { useAuth } from "../lib/auth";
import { useMarketingWorkflow } from "../lib/marketingWorkflow";
import { toast } from "sonner";

export function Layout() {
  const location = useLocation();
  const { session, logout } = useAuth();
  const { resetWorkflow } = useMarketingWorkflow();

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/ecommerce-dashboard", icon: Store, label: "E-commerce" },
    { path: "/generate?entry=manual", matchPath: "/generate", icon: Sparkles, label: "Markini" },
    { path: "/pipeline", icon: GitBranch, label: "Pipeline" },
    { path: "/settings", icon: Settings, label: "Parametres" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-200 bg-gradient-to-b from-white to-[#FAFBFF] backdrop-blur-xl">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
          <img src="/brand-logo.jpg" alt="Logo" className="h-10 w-10 rounded-lg object-cover shadow-lg shadow-slate-200/80" />
          <div>
            <h1 className="font-bold text-slate-900">Markini</h1>
          </div>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const currentPath = item.matchPath ?? item.path;
            const isActive = location.pathname === currentPath || (currentPath === "/dashboard" && location.pathname === "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (currentPath === "/generate") {
                    resetWorkflow();
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 transition-all",
                  isActive
                    ? "bg-gradient-to-r from-[#F3F1FF] to-[#F4FAFF] text-[#4F46B8] shadow-lg shadow-[#E1DCFF]/50 border border-[#DDD7FF]"
                    : "text-slate-600 hover:bg-white/80 hover:text-[#4F46B8] hover:border hover:border-[#D7D0FF]",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">{session?.user?.username}</p>
          <p className="mb-3 text-xs text-slate-500">{session?.user?.email || "Session locale"}</p>
          <Button
            type="button"
            variant="outline"
            className="w-full border-[#D7D0FF] text-[#4F46B8] hover:bg-[#F2EEFF] hover:text-[#4338CA]"
            onClick={() => {
              void logout()
                .then(() => toast.success("Session fermee."))
                .catch((error) => toast.error(error instanceof Error ? error.message : "Deconnexion impossible."));
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Se deconnecter
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F3F6FF] to-transparent pointer-events-none" />
      </aside>

      <main className="ml-64 min-h-screen bg-transparent">
        <Outlet />
      </main>
    </div>
  );
}
