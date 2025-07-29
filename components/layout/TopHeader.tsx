"use client";

import { Menu, Bell, Search } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import GlobalSearch from "@/components/global-search";
import { useSidebar } from "../../contexts/SidebarContext";

export default function TopHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="fixed top-0 left-0 right-0 bg-eerie-black border-b border-accent/20 flex items-center justify-between px-6" style={{ height: "70px", zIndex: 1000 }}>
      {/* Left Section - Logo and Hamburger Menu */}
      <div className="flex items-center gap-4">
        {/* Hamburger Menu Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-seasalt/70 hover:text-seasalt hover:bg-white/5 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sgbus-green rounded-lg flex items-center justify-center">
            <span className="text-night font-bold text-sm">V</span>
          </div>
          <h1 className="text-seasalt font-semibold text-lg">Vortex Vault</h1>
        </div>
      </div>

      {/* Center Section - Global Search (hidden on mobile, search icon shown instead) */}
      <div className="flex-1 flex justify-center">
        <div className="hidden md:block">
          <GlobalSearch className="w-[360px]" />
        </div>
      </div>

      {/* Right Section - Mobile Search Icon, Notifications & User Menu */}
      <div className="flex items-center space-x-4">
        {/* Mobile Search Icon (visible only on small screens) */}
        <button className="block md:hidden p-2 text-seasalt/70 hover:text-seasalt hover:bg-white/5 rounded-lg transition-colors">
          <Search className="h-5 w-5" />
        </button>

        {/* Notifications Button */}
        <button className="relative p-2 text-seasalt/70 hover:text-seasalt hover:bg-white/5 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          {/* Notification Badge - Hidden for now */}
          {/* <span className="absolute -top-1 -right-1 h-3 w-3 bg-sgbus-green rounded-full"></span> */}
        </button>

        {/* User Menu */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
              userButtonPopoverCard: "bg-eerie-black border border-accent/20",
              userButtonPopoverActionButton: "text-seasalt hover:bg-white/5",
              userButtonPopoverActionButtonText: "text-seasalt",
              userButtonPopoverFooter: "hidden",
            },
          }}
        />
      </div>
    </header>
  );
}