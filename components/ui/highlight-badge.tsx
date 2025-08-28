'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface HighlightBadgeProps {
  children: React.ReactNode;
  isHighlighted: boolean;
  onInteraction?: () => void;
  showBadge?: boolean;
  badgeText?: string;
}

export function HighlightBadge({
  children,
  isHighlighted,
  onInteraction,
  showBadge = true,
  badgeText = 'LIBERADO'
}: HighlightBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (isHighlighted) {
      // Show tooltip after a short delay
      const timer = setTimeout(() => setShowTooltip(true), 500);
      
      // Hide tooltip after 5 seconds
      const hideTimer = setTimeout(() => setShowTooltip(false), 5500);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [isHighlighted]);

  const handleClick = () => {
    if (onInteraction) {
      onInteraction();
    }
    setShowTooltip(false);
  };

  return (
    <div className="relative" onClick={handleClick}>
      <AnimatePresence>
        {isHighlighted && (
          <>
            {/* Subtle glowing border effect following design rules */}
            <motion.div
              className="absolute inset-0 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 rounded-lg border-2 border-sgbus-green/40 bg-sgbus-green/5" />
              <div className="absolute inset-[-1px] rounded-lg border border-sgbus-green/20 shadow-lg shadow-sgbus-green/10" />
            </motion.div>

            {/* Badge */}
            {showBadge && (
              <motion.div
                className="absolute -top-2 -right-2 z-10"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 10 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20 
                }}
              >
                <div className="bg-sgbus-green text-night px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-sgbus-green/20 border border-sgbus-green/30">
                  {badgeText}
                </div>
              </motion.div>
            )}

            {/* Tooltip */}
            {showTooltip && (
              <motion.div
                className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-eerie-black border border-sgbus-green/30 rounded-lg px-4 py-2 shadow-xl shadow-sgbus-green/10">
                  <p className="text-seasalt text-sm whitespace-nowrap">
                    Esta seção está liberada para você! ✨
                  </p>
                  <div className="absolute bottom-[-5px] left-1/2 transform -translate-x-1/2 w-0 h-0 
                    border-l-[5px] border-l-transparent
                    border-r-[5px] border-r-transparent
                    border-t-[5px] border-t-sgbus-green/30" />
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Original content */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
}