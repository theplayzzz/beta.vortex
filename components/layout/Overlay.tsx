"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "../../contexts/SidebarContext";

export default function Overlay() {
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, visibility: "hidden" }}
          animate={{ opacity: 1, visibility: "visible" }}
          exit={{ opacity: 0, visibility: "hidden" }}
          transition={{ 
            opacity: { duration: 0.3, ease: "easeInOut" },
            visibility: { duration: 0.3, ease: "easeInOut" }
          }}
          className="fixed inset-0 bg-black/60"
          style={{ zIndex: 1050 }}
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        />
      )}
    </AnimatePresence>
  );
}