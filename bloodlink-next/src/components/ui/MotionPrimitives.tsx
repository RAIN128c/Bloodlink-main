'use client';

import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { VARIANTS } from '@/lib/animations/presets';
import { useSafeAnimation } from '@/lib/animations/constraints';
import { ReactNode } from 'react';

interface BaseProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
}

export function FadeIn({ children, className, ...props }: BaseProps) {
    const { shouldAnimate } = useSafeAnimation();

    if (!shouldAnimate) return <div className={className}>{children}</div>;

    return (
        <motion.div
            variants={VARIANTS.fadeIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function SlideIn({ children, className, ...props }: BaseProps) {
    const { shouldAnimate } = useSafeAnimation();

    if (!shouldAnimate) return <div className={className}>{children}</div>;

    return (
        <motion.div
            variants={VARIANTS.slideUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function StaggerContainer({ children, className, ...props }: BaseProps) {
    // Note: Staggering is usually fine even for reduced motion (just faster), 
    // but we respect the hook preference if stricter compliance is needed.
    return (
        <motion.div
            variants={VARIANTS.staggerContainer}
            initial="hidden"
            animate="visible"
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

// Optimization: Pre-configured AnimatePresence for lists
export function ListAnimatePresence({ children }: { children: ReactNode }) {
    return (
        <AnimatePresence initial={false} mode="popLayout">
            {children}
        </AnimatePresence>
    );
}
