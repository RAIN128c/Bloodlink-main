import { Variants } from 'framer-motion';
import { DURATION, DELAY } from './constraints';

// Professional, grounded easing (no excessive bounce)
export const EASING = {
    DEFAULT: [0.25, 0.1, 0.25, 1.0], // ease (default)
    MEDICAL: [0.16, 1, 0.3, 1],      // easeOutExpo-ish (Fast start, smooth end)
    ALERT: [0.36, 0.07, 0.19, 0.97], // Gentle attention
} as const;

export const VARIANTS: Record<string, any> = {
    fadeIn: {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: DURATION.MEDIUM, ease: EASING.MEDICAL }
        }
    },
    slideUp: {
        hidden: { opacity: 0, y: 15 }, // Subtle 15px movement
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: DURATION.SLOW, ease: EASING.MEDICAL }
        }
    },
    staggerContainer: {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: DELAY.STAGGER,
                delayChildren: 0.05
            }
        }
    },
    // Flash Highlight for Sorting (Yellow -> Transparent)
    highlight: {
        highlight: {
            backgroundColor: ["rgba(253, 224, 71, 0.3)", "rgba(0,0,0,0)"], // yellow-300/30 -> transparent
            transition: { duration: 0.6, ease: "easeOut" }
        }
    },
    // Error Shake (Rollback)
    shake: {
        x: [0, -10, 10, -5, 5, 0] as any,
        transition: { duration: 0.4 }
    }
};
