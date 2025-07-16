import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, BarChart2, Settings, LogOut } from "lucide-react";
import type { UserRole } from "./SessionProvider";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "tech", "road", "parts", "unassigned"] },
  { href: "/reports", label: "Reports", icon: BarChart2, roles: ["admin", "manager"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

interface SidebarProps {
  userRole: UserRole;
  onLinkClick?: () => void;
}

export const Sidebar = ({ userRole, onLinkClick }: SidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ variant: "destructive", title: "Logout failed", description: error.message });
    } else {
      navigate('/login');
    }
  };

  const filteredNavItems = navItems.filter(item => userRole && item.roles.includes(userRole));

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground border-r">
      <div className="p-4 border-b flex items-center gap-2">
        <img src="/xpress-logo.png" alt="Xpress Diesel Logo" className="h-8 w-8" />
        <h1 className="text-xl font-bold text-primary">Xpress Diesel</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/"}
            onClick={onLinkClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive && "bg-accent text-primary"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t mt-auto">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};