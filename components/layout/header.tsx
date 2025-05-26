"use client";

import { useState } from "react";
import { Search, Bell } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useDebounce } from "@/lib/hooks/use-debounce";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // TODO: Implementar lógica de busca quando necessário
  // useEffect(() => {
  //   if (debouncedSearch) {
  //     // Executar busca
  //   }
  // }, [debouncedSearch]);

  return (
    <header className="h-16 bg-background border-b border-accent/20 z-20 flex items-center justify-between px-6">
      {/* Left Section - Empty for now */}
      <div className="flex items-center">
        {/* Breadcrumbs ou outros elementos podem ser adicionados aqui */}
      </div>

      {/* Center Section - Search Bar */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-[360px]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[#A39FAF]" />
          </div>
          <input
            type="text"
            placeholder="Buscar clientes, projetos, tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[40px] bg-[#2A1B45] text-seasalt placeholder-[#A39FAF] pl-12 pr-4 rounded-full border-none outline-none focus:ring-2 focus:ring-sgbus-green/50 transition-all"
          />
        </div>
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