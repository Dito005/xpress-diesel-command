"use client";

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

export default function Header({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getPageTitle = () => {
    const path = pathname.split('/').pop();
    switch (path) {
      case 'reports':
        return 'Reports & Analytics';
      case 'settings':
        return 'Shop Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-10">
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <Sidebar userRole={userRole} onLinkClick={() => setIsSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
      <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
    </header>
  );
}