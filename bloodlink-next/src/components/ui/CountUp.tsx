'use client';

import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useSafeAnimation } from '@/lib/animations/constraints';
import { cn } from '@/lib/utils';

interface CountUpProps {
    value: number;
    className?: string;
    prefix?: string;
    suffix?: string;
}

export function CountUp({ value, className, prefix = '', suffix = '' }: CountUpProps) {
    const { shouldAnimate } = useSafeAnimation();
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });

    // Spring config for "Mechanical" feel (not too bouncy)
    const spring = useSpring(0, {
        mass: 1,
        stiffness: 75,
        damping: 15, // Critical damping to avoid oscillation
        restSpeed: 0.5
    });

    const display = useTransform(spring, (current) =>
        `${prefix}${Math.floor(current).toLocaleString()}${suffix}`
    );

    useEffect(() => {
        if (shouldAnimate && isInView) {
            spring.set(value);
        } else if (!shouldAnimate) {
            // Immediate set if reduced motion
            spring.jump(value);
        }
    }, [spring, value, isInView, shouldAnimate]);

    return (
        <span className={cn("inline-block tabular-nums", className)}>
            <motion.span ref={ref}>{display}</motion.span>
        </span>
    );
}
