"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BarChart3, Settings, LogOut, User, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const adminNavItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const techNavItems = [
  { href: "/", label: "My Dashboard", icon: Wrench },
  { href: "/profile", label: "My Profile", icon: User },
];

export const Sidebar = ({ userRole, onLinkClick }: { userRole: string, onLinkClick?: () => void }) => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = userRole === 'admin' || userRole === 'manager' ? adminNavItems : techNavItems;

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 bg-card text-card-foreground">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <img src="/xpress-logo.png" alt="Xpress Diesel Logo" className="h-8 w-8" />
          <span className="">Xpress Diesel</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};