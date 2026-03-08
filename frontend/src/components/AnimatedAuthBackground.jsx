import React, { memo } from 'react';
import { motion } from 'framer-motion';

const AnimatedAuthBackground = memo(() => {
    return (
        <>
            {/* Absolute positioning structure */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">

                {/* 1. Base Gradient Layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#D9D3CA] via-[#EAE5DF] to-[#C9C2B7]" />

                {/* 2. Lightweight texture layer (local-only, no external image fetch) */}
                <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.5),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.28),transparent_45%)]" />

                {/* 3. Gradient Mesh / Color orbs */}
                <motion.div
                    animate={{
                        x: [0, 50, -50, 0],
                        y: [0, -50, 50, 0],
                        scale: [1, 1.1, 0.9, 1],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                    className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-rose-200/30 rounded-full blur-[100px] mix-blend-multiply will-change-transform"
                />

                <motion.div
                    animate={{
                        x: [0, -70, 40, 0],
                        y: [0, 60, -40, 0],
                        scale: [1, 1.2, 0.8, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                    className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[80%] bg-amber-100/50 rounded-full blur-[120px] mix-blend-multiply will-change-transform"
                />

                {/* 4. Glass/Frosting Final Layer */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D9D3CA]/30 to-[#C9C2B7]/80 backdrop-blur-[2px]" />
            </div>
        </>
    );
});

AnimatedAuthBackground.displayName = 'AnimatedAuthBackground';

export default AnimatedAuthBackground;
