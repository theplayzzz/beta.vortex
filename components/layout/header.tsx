"use client";

import { Bell } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import GlobalSearch from "@/components/global-search";

export default function Header() {
  return (
    <header className="h-16 bg-background border-b border-accent/20 z-20 flex items-center justify-between px-6">
      {/* Left Section - Empty for now */}
      <div className="flex items-center">
        {/* Breadcrumbs ou outros elementos podem ser adicionados aqui */}
      </div>

      {/* Center Section - Global Search */}
      <div className="flex-1 flex justify-center">
        <GlobalSearch className="w-[360px]" />
      </div>

      {/* Right Section - Notifications & User Menu */}
      <div className="flex items-center space-x-4">
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