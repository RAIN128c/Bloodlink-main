import { useReducedMotion } from 'framer-motion';

// Medical Grade Duration Constraints (ms)
export const DURATION = {
    FAST: 0.15,    // Micro-interactions (Hover, Click)
    MEDIUM: 0.25,  // Feedback (Alerts, Success)
    SLOW: 0.3,     // Transitions (Page load, Modal) - Max 300ms
    // Deliberately avoiding anything > 300ms to prevent "waiting" feel
} as const;

export const DELAY = {
    STAGGER: 0.03, // Very fast stagger for lists (30ms)
    NONE: 0,
} as const;

// Hook to check if we should run animations
export function useSafeAnimation() {
    const shouldReduceMotion = useReducedMotion();

    return {
        // If reduced motion is requested, use 0 duration to make it instant
        duration: (d: number) => shouldReduceMotion ? 0 : d,
        shouldAnimate: !shouldReduceMotion,
    };
}
