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
  Shield,
  Headphones
} from "lucide-react";
import { getPermissionsForStatus, Modalidade } from "@/types/permissions";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  disabled?: boolean;
  adminOnly?: boolean;
  modalidade?: Modalidade;
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
    modalidade: 'clientes',
  },
  {
    icon: FileText,
    label: "Planejamentos",
    href: "/planejamentos",
    modalidade: 'planejamentos',
  },
  {
    icon: FileCheck,
    label: "Propostas",
    href: "/propostas",
    modalidade: 'propostas',
  },
  {
    icon: Shield,
    label: "Aprovação",
    href: "/admin/moderate",
    adminOnly: true,
  },
  {
    icon: Headphones,
    label: "Copiloto Spalla",
    href: "/coach/capture/pre-session",
    modalidade: 'vendas',
  },
];

export default function Sidebar() {
  const { isOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { user } = useUser();

  // Get user permissions
  const publicMetadata = user?.publicMetadata as any;
  const userStatus = publicMetadata?.approvalStatus || 'PENDING';
  const userRole = publicMetadata?.role || 'USER';
  const permissions = getPermissionsForStatus(userStatus, userRole);
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // PLAN-010: Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter(item => {
    // Admin items
    if (item.adminOnly) {
      return isAdmin;
    }
    
    // Check modalidade permissions
    if (item.modalidade) {
      switch (item.modalidade) {
        case 'vendas':
          return permissions.canAccessSales;
        case 'clientes':
          return permissions.canAccessClients;
        case 'planejamentos':
          return permissions.canAccessPlanning;
        case 'propostas':
          return permissions.canAccessProposals;
        default:
          return false;
      }
    }
    
    // Always show items without modalidade (like Home)
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
        initial={{ x: "-100%" }}
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
                  <item.icon className="h-5 w-5 flex-shrink-0 mr-5" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`sidebar-nav-item flex items-center my-2 rounded-lg ${
                    isActive(item.href)
                      ? "active bg-sgbus-green text-night font-medium"
                      : item.adminOnly
                      ? "admin bg-sgbus-green/10 text-sgbus-green"
                      : "text-periwinkle hover:bg-periwinkle/10"
                  }`}
                  style={{ 
                    padding: "0.875rem 1rem"
                  }}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0 mr-5" />
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