import React from 'react';
import { motion, AnimatePresence, PanInfo, Variants } from 'motion/react';
import { useNavigation } from '../context/NavigationContext';

interface PageTransitionViewProps {
  children: React.ReactNode;
  pageKey: string;
}

export const PageTransitionView: React.FC<PageTransitionViewProps> = ({ children, pageKey }) => {
  const { direction, canSwipe, nextTab, prevTab } = useNavigation();

  // Page slide variants with typed iOS spring & easing
  const variants: Variants = {
    enter: (dir: number) => ({
      x: dir === 0 ? 0 : dir > 0 ? -40 : 40, // RTL: dir > 0 means moving forward (towards left)
      opacity: 0,
      scale: 0.985,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 380, damping: 32, mass: 0.8 },
        opacity: { duration: 0.25, ease: "easeOut" },
        scale: { duration: 0.28, ease: "easeOut" },
      },
    },
    exit: (dir: number) => ({
      x: dir === 0 ? 0 : dir > 0 ? 40 : -40,
      opacity: 0,
      scale: 0.985,
      transition: {
        x: { type: "spring", stiffness: 380, damping: 32, mass: 0.8 },
        opacity: { duration: 0.2, ease: "easeIn" },
        scale: { duration: 0.2, ease: "easeIn" },
      },
    }),
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!canSwipe) return;

    const threshold = 55;
    const velocityThreshold = 400;

    // In Arabic RTL:
    // Dragging left (negative offset) -> user moves finger left -> advance to next tab
    if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      nextTab();
    } 
    // Dragging right (positive offset) -> user moves finger right -> return to previous tab
    else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      prevTab();
    }
  };

  return (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <motion.div
        key={pageKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        drag={canSwipe ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
        className="w-full flex-1 touch-pan-y will-change-transform focus:outline-none"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
