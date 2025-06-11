"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { 
  Home, 
  FileText, 
  CheckSquare, 
  BarChart2, 
  Users,
  ChevronDown,
  Menu,
  X,
  FileCheck,
  Shield
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  disabled?: boolean;
  adminOnly?: boolean;
  submenu?: {
    label: string;
    href: string;
  }[];
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
    submenu: [
      { label: "Lista de Clientes", href: "/clientes" },
      { label: "Clientes Arquivados", href: "/clientes/arquivados" },
    ],
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
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

  // Carregar estado do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-expanded");
    if (saved !== null) {
      setIsExpanded(JSON.parse(saved));
    }
  }, []);

  // Salvar estado no localStorage
  useEffect(() => {
    localStorage.setItem("sidebar-expanded", JSON.stringify(isExpanded));
  }, [isExpanded]);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setExpandedSubmenu(null);
    }
  };

  const toggleSubmenu = (label: string) => {
    if (!isExpanded) return;
    setExpandedSubmenu(expandedSubmenu === label ? null : label);
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={toggleSidebar}
        className="absolute top-1/2 -translate-y-1/2 z-40 bg-[#2A1B45] hover:bg-[#3A2B55] text-seasalt p-2 rounded-r-md transition-colors"
        style={{ left: isExpanded ? "200px" : "72px" }}
        animate={{ left: isExpanded ? "200px" : "72px" }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {isExpanded ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </motion.button>

      {/* Sidebar */}
      <motion.aside
        className="bg-eerie-black border-r border-accent/20 z-30 flex flex-col"
        animate={{ width: isExpanded ? "200px" : "72px" }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center border-b border-accent/20 px-4">
          <div className="w-10 h-10 bg-sgbus-green rounded-lg flex items-center justify-center">
            <span className="text-night font-bold text-lg">V</span>
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-3"
              >
                <h1 className="text-seasalt font-semibold text-lg">Vortex Vault</h1>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4">
          {filteredMenuItems.map((item) => (
            <div key={item.label}>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div>
                      {item.disabled ? (
                        <div className="flex items-center px-4 py-3 text-seasalt/50 cursor-not-allowed">
                          <item.icon className="h-5 w-5 min-w-[20px]" />
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="ml-3 text-sm"
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className={`flex items-center px-4 py-3 transition-colors ${
                            isActive(item.href)
                              ? "text-seasalt font-semibold bg-white/5 border-r-2 border-sgbus-green"
                              : "text-seasalt/70 hover:text-seasalt hover:bg-white/5"
                          } ${
                            item.adminOnly 
                              ? "border-l-2 border-orange-400 bg-orange-500/10" 
                              : ""
                          }`}
                          onClick={() => {
                            if (item.submenu && isExpanded) {
                              toggleSubmenu(item.label);
                            }
                          }}
                        >
                          <item.icon className={`h-5 w-5 min-w-[20px] ${
                            item.adminOnly ? "text-orange-400" : ""
                          }`} />
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="ml-3 flex-1 flex items-center justify-between"
                              >
                                <span className={`text-sm ${
                                  item.adminOnly ? "text-orange-400 font-medium" : ""
                                }`}>
                                  {item.label}
                                  {item.adminOnly && (
                                    <span className="ml-1 text-xs opacity-75">ADMIN</span>
                                  )}
                                </span>
                                {item.submenu && (
                                  <ChevronDown
                                    className={`h-4 w-4 text-sgbus-green transition-transform ${
                                      expandedSubmenu === item.label ? "rotate-180" : ""
                                    }`}
                                  />
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Link>
                      )}
                    </div>
                  </Tooltip.Trigger>
                  {!isExpanded && (
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="right"
                        className="bg-[#2A1B45] text-seasalt px-2 py-1 rounded text-sm"
                        sideOffset={8}
                      >
                        {item.label}
                        {item.disabled && " (Coming Soon)"}
                        {item.adminOnly && " (Admin Only)"}
                        <Tooltip.Arrow className="fill-[#2A1B45]" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  )}
                </Tooltip.Root>
              </Tooltip.Provider>

              {/* Submenu */}
              {item.submenu && isExpanded && (
                <AnimatePresence>
                  {expandedSubmenu === item.label && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-[#2A1B45] rounded-md p-2 ml-12 mt-2 mr-4">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`block px-3 py-2 text-sm rounded transition-colors ${
                              pathname === subItem.href
                                ? "text-seasalt bg-white/10"
                                : "text-seasalt/70 hover:text-seasalt hover:bg-white/5"
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </nav>
      </motion.aside>
    </>
  );
} 