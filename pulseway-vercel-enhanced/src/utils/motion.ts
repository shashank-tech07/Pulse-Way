import type { Transition, Variants } from 'motion/react';

/**
 * Shared PulseWay Motion & Scroll Choreography Tokens
 * Calibrated for calm, clinical precision — transform & opacity composited,
 * strictly zero layout shift and automatic reduced-motion compliance.
 */

export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
export const EASE_SMOOTH = [0.25, 0.1, 0.25, 1] as const;

export const TRANSITION_FAST: Transition = {
  duration: 0.24,
  ease: EASE_OUT_EXPO,
};

export const TRANSITION_BASE: Transition = {
  duration: 0.48,
  ease: EASE_OUT_EXPO,
};

export const TRANSITION_SLOW: Transition = {
  duration: 0.68,
  ease: EASE_OUT_EXPO,
};

export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.85,
};

export const SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 240,
  damping: 28,
  mass: 0.9,
};

export const VIEWPORT_ONCE = {
  once: true,
  amount: 0.12,
} as const;

/** Page / tab cross-fade & micro-rise transition */
export const pageTabVariants: Variants = {
  initial: {
    opacity: 0,
    y: 14,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      ease: EASE_OUT_EXPO,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.22,
      ease: EASE_SMOOTH,
    },
  },
};

/** Scroll-triggered section entrance with subtle blur-to-clear */
export const sectionRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 22,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.56,
      ease: EASE_OUT_EXPO,
    },
  },
};

/** Text / headline blur-to-clear reveal */
export const textRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
    filter: 'blur(5px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.52,
      ease: EASE_OUT_EXPO,
    },
  },
};

/** Parent container for staggered children */
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.065,
      delayChildren: 0.04,
    },
  },
};

/** Child item for staggered lists & card grids */
export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.46,
      ease: EASE_OUT_EXPO,
    },
  },
};

/** Smooth image frame reveal (scale settle without layout shift) */
export const imageRevealVariants: Variants = {
  hidden: {
    opacity: 0.65,
    scale: 1.06,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.85,
      ease: EASE_OUT_EXPO,
    },
  },
};

/** Smooth accordion / inline disclosure expand-collapse */
export const disclosureVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0,
    y: -6,
  },
  visible: {
    opacity: 1,
    height: 'auto',
    y: 0,
    transition: {
      height: { duration: 0.32, ease: EASE_OUT_EXPO },
      opacity: { duration: 0.24, delay: 0.05 },
      y: { duration: 0.3, ease: EASE_OUT_EXPO },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    y: -4,
    transition: {
      height: { duration: 0.24, ease: EASE_SMOOTH },
      opacity: { duration: 0.16 },
    },
  },
};

/** Interactive card hover & tap micro-physics */
export const cardInteraction = {
  whileHover: {
    y: -3,
    transition: { duration: 0.22, ease: EASE_OUT_EXPO },
  },
  whileTap: {
    scale: 0.992,
    transition: { duration: 0.12 },
  },
} as const;

/** Interactive button hover & tap micro-physics */
export const buttonInteraction = {
  whileHover: {
    scale: 1.018,
    transition: { duration: 0.18, ease: EASE_OUT_EXPO },
  },
  whileTap: {
    scale: 0.972,
    transition: { duration: 0.1 },
  },
} as const;
