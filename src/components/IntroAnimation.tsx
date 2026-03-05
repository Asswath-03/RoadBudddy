import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench } from "lucide-react";
import logoImg from "@/assets/logo.png";

/* ─────────────────────────────────────────
   Spark particle — bursts out from center
───────────────────────────────────────── */
interface SparkProps {
    angle: number; // degrees
    delay: number;
    color: string;
    distance: number;
    size: number;
}

const Spark = ({ angle, delay, color, distance, size }: SparkProps) => {
    const rad = (angle * Math.PI) / 180;
    const tx = Math.cos(rad) * distance;
    const ty = Math.sin(rad) * distance;

    return (
        <motion.div
            className="absolute rounded-full"
            style={{
                width: size,
                height: size,
                backgroundColor: color,
                top: "50%",
                left: "50%",
                marginTop: -size / 2,
                marginLeft: -size / 2,
                boxShadow: `0 0 ${size * 2}px ${color}`,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
                x: [0, tx * 0.6, tx],
                y: [0, ty * 0.6, ty],
                opacity: [0, 1, 0],
                scale: [0, 1.4, 0],
            }}
            transition={{
                duration: 0.9,
                delay,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.4, 1],
            }}
        />
    );
};

/* ─────────────────────────────────────────
   Main intro component
───────────────────────────────────────── */
interface IntroAnimationProps {
    onComplete: () => void;
}

const SPARKS: SparkProps[] = [
    { angle: 30, delay: 0.45, color: "#3B82F6", distance: 72, size: 5 },
    { angle: 95, delay: 0.5, color: "#60A5FA", distance: 64, size: 4 },
    { angle: 155, delay: 0.42, color: "#2563EB", distance: 78, size: 6 },
    { angle: 215, delay: 0.55, color: "#93C5FD", distance: 62, size: 4 },
    { angle: 270, delay: 0.48, color: "#3B82F6", distance: 70, size: 5 },
    { angle: 330, delay: 0.52, color: "#DBEAFE", distance: 68, size: 3 },
    { angle: 65, delay: 0.58, color: "#1D4ED8", distance: 58, size: 4 },
    { angle: 185, delay: 0.44, color: "#60A5FA", distance: 76, size: 5 },
];

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
    const [exiting, setExiting] = useState(false);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        // Begin exit at 2.4 s
        const exitTimer = setTimeout(() => setExiting(true), 2400);
        // Signal parent after exit animation (0.65 s)
        const doneTimer = setTimeout(() => onCompleteRef.current(), 3050);
        return () => {
            clearTimeout(exitTimer);
            clearTimeout(doneTimer);
        };
    }, []);

    return (
        <AnimatePresence>
            {!exiting && (
                <motion.div
                    key="intro"
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
                    style={{
                        background:
                            "linear-gradient(145deg, #EFF6FF 0%, #F8FAFC 45%, #EEF2FF 100%)",
                    }}
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        scale: 1.04,
                        transition: { duration: 0.65, ease: [0.4, 0, 0.2, 1] },
                    }}
                >
                    {/* Ambient glow pulse */}
                    <motion.div
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            width: 340,
                            height: 340,
                            background:
                                "radial-gradient(circle, rgba(37,99,235,0.13) 0%, rgba(99,102,241,0.06) 55%, transparent 75%)",
                        }}
                        animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Secondary outer glow ring */}
                    <motion.div
                        className="absolute rounded-full border pointer-events-none"
                        style={{
                            width: 180,
                            height: 180,
                            borderColor: "rgba(59,130,246,0.18)",
                        }}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1.6, opacity: [0, 0.5, 0] }}
                        transition={{ duration: 1.8, delay: 0.5, ease: "easeOut" }}
                    />

                    {/* ── Logo + tool cluster ── */}
                    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>

                        {/* Spark particles */}
                        {SPARKS.map((s, i) => (
                            <Spark key={i} {...s} />
                        ))}

                        {/* Wrench icon – top-right, rotates in */}
                        <motion.div
                            className="absolute"
                            style={{ top: -10, right: -14, color: "#2563EB" }}
                            initial={{ rotate: -50, scale: 0, opacity: 0 }}
                            animate={{ rotate: 22, scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Wrench size={26} strokeWidth={2.2} />
                        </motion.div>

                        {/* Mini gear dot – bottom-left */}
                        <motion.div
                            className="absolute rounded-full border-2"
                            style={{
                                width: 16,
                                height: 16,
                                bottom: 0,
                                left: -8,
                                borderColor: "#3B82F6",
                                backgroundColor: "rgba(59,130,246,0.1)",
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, rotate: 360 }}
                            transition={{
                                scale: { duration: 0.4, delay: 0.6 },
                                opacity: { duration: 0.4, delay: 0.6 },
                                rotate: { duration: 2.2, delay: 0.6, ease: "linear", repeat: Infinity },
                            }}
                        />

                        {/* Mini gear dot – top-left */}
                        <motion.div
                            className="absolute rounded-full border-2"
                            style={{
                                width: 10,
                                height: 10,
                                top: 4,
                                left: -6,
                                borderColor: "#93C5FD",
                                backgroundColor: "rgba(147,197,253,0.15)",
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, rotate: -360 }}
                            transition={{
                                scale: { duration: 0.35, delay: 0.72 },
                                opacity: { duration: 0.35, delay: 0.72 },
                                rotate: { duration: 1.6, delay: 0.72, ease: "linear", repeat: Infinity },
                            }}
                        />

                        {/* Logo */}
                        <motion.img
                            src={logoImg}
                            alt="RoadBuddy Logo"
                            style={{ width: 100, height: 100, borderRadius: "50%" }}
                            initial={{ scale: 0.45, filter: "blur(14px)", opacity: 0 }}
                            animate={{ scale: 1, filter: "blur(0px)", opacity: 1 }}
                            transition={{
                                duration: 0.85,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        />
                    </div>

                    {/* Brand name */}
                    <motion.div
                        className="mt-7 text-center"
                        initial={{ opacity: 0, y: 22 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <p
                            className="text-[2rem] font-extrabold tracking-tight leading-none"
                            style={{
                                fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif",
                                color: "#0F172A",
                            }}
                        >
                            Road
                            <span style={{ color: "#1D4ED8" }}>Buddy</span>
                        </p>
                    </motion.div>

                    {/* Tagline */}
                    <motion.p
                        className="mt-2 text-sm font-medium"
                        style={{ color: "#64748B" }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 1.15, ease: "easeOut" }}
                    >
                        Help on the road, when you need it most.
                    </motion.p>

                    {/* Progress bar */}
                    <motion.div
                        className="mt-9 rounded-full overflow-hidden"
                        style={{
                            width: 110,
                            height: 3,
                            backgroundColor: "rgba(59,130,246,0.15)",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.0 }}
                    >
                        <motion.div
                            className="h-full rounded-full"
                            style={{
                                background: "linear-gradient(90deg, #3B82F6, #1D4ED8)",
                                boxShadow: "0 0 8px rgba(37,99,235,0.5)",
                            }}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2.0, delay: 1.0, ease: [0.4, 0, 0.6, 1] }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default IntroAnimation;
