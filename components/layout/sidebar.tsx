"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useSidebar } from "../../contexts/SidebarContext";
import { 
  Home, 
  FileText, 
  CheckSquare, 
  BarChart2, 
  Users,
  Menu,
  X,
  FileCheck,
  Shield
} from "lucide-react";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  disabled?: boolean;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  {
    icon: Home,
    label: "Home",
    href: "/",
  },
  {
    icon: Users,
    label: "Clientes",
    href: "/clientes",
  },
  {
    icon: FileText,
    label: "Planejamentos",
    href: "/planejamentos",
  },
  {
    icon: FileCheck,
    label: "Propostas",
    href: "/propostas",
  },
  {
    icon: Shield,
    label: "Aprovação",
    href: "/admin/moderate",
    adminOnly: true,
  },
  {
    icon: BarChart2,
    label: "Vendas",
    href: "/vendas",
    disabled: true,
  },
];

export default function Sidebar() {
  const { isOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { user } = useUser();

  // Verificar se é admin
  const isAdmin = user?.publicMetadata?.role === 'ADMIN' || 
                 user?.publicMetadata?.role === 'SUPER_ADMIN';

  // Filtrar itens do menu baseado no role do usuário
  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly) {
      return isAdmin;
    }
    return true;
  });



  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>

      {/* Sidebar */}
      <motion.aside
        className="fixed top-0 left-0 h-full bg-eerie-black flex flex-col"
        style={{ 
          width: "280px",
          zIndex: 1100,
          boxShadow: isOpen ? "0 0 40px rgba(0,0,0,0.5)" : "none"
        }}
        animate={{ 
          x: isOpen ? 0 : "-100%" 
        }}
        transition={{ 
          duration: 0.3, 
          ease: [0.25, 0.8, 0.25, 1] // cubic-bezier equivalente
        }}
      >
        {/* Header with Close Button */}
        <div className="flex items-center justify-between border-b border-accent/20 px-6" style={{ height: "70px" }}>
          <span className="text-seasalt font-semibold text-xl">Menu</span>
          <button
            onClick={toggleSidebar}
            className="p-2 text-periwinkle hover:text-seasalt transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-6 py-4 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <div key={item.label}>
                      {item.disabled ? (
                        <div className="flex items-center my-2 rounded-lg text-seasalt/50 cursor-not-allowed opacity-50" style={{ padding: "0.875rem 1rem" }}>
                          <item.icon className="h-5 w-5 flex-shrink-0" style={{ marginRight: "1.25rem" }} />
                          <span className="whitespace-nowrap">{item.label}</span>
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className={`flex items-center my-2 rounded-lg transition-all duration-200 ${
                            isActive(item.href)
                              ? "bg-sgbus-green text-night font-medium"
                              : item.adminOnly
                              ? "bg-sgbus-green/10 text-sgbus-green border border-sgbus-green hover:bg-sgbus-green/20"
                              : "text-periwinkle hover:bg-periwinkle/10 hover:text-seasalt"
                          }`}
                          style={{ 
                            padding: "0.875rem 1rem"
                          }}
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" style={{ marginRight: "1.25rem" }} />
                          <span className="whitespace-nowrap">
                            {item.label}
                            {item.adminOnly && " ADMIN"}
                          </span>
                        </Link>
                      )}
            </div>
          ))}
        </nav>
      </motion.aside>
    </>
  );
} 