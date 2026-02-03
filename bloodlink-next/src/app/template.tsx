'use client';

import { motion } from 'framer-motion';
import { useSafeAnimation, DURATION } from '@/lib/animations/constraints';
import { EASING } from '@/lib/animations/presets';

export default function Template({ children }: { children: React.ReactNode }) {
    const { shouldAnimate } = useSafeAnimation();

    if (!shouldAnimate) {
        return <>{children}</>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
                duration: DURATION.SLOW,
                ease: EASING.MEDICAL
            }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
}
