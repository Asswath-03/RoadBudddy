import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Settings, Wrench, Cpu, ArrowRight } from "lucide-react";

/* ── Decorative spinning gear ── */
const SpinGear = ({ size = 48, className = "" }: { size?: number; className?: string }) => (
    <motion.div
        className={className}
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        style={{ width: size, height: size, color: "rgba(59,130,246,0.18)" }}
    >
        <Settings size={size} strokeWidth={1.2} />
    </motion.div>
);

/* ── Inline SVG vehicles ── */

const VintageCarSVG = () => (
    <svg viewBox="0 0 260 140" width="100%" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round"
            d="M12,88 Q10,74 20,66 L42,54 Q60,42 82,32 Q108,22 134,20 Q160,20 180,28 Q200,36 214,50 L232,58 Q246,66 246,80 L246,92 Q244,102 230,104 L26,104 Q12,102 12,88 Z" />
        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
            d="M54,54 Q64,34 86,24 Q112,14 140,16 Q164,18 182,30 Q194,40 198,54 Z" />
        <rect x="50" y="100" width="174" height="6" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="58" cy="118" r="18" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="58" cy="118" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="196" cy="118" r="18" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="196" cy="118" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="238" cy="74" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="9" y="70" width="5" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="126" y1="52" x2="126" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
        <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M196,54 Q210,58 220,72 Q226,86 220,106" />
        <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M56,54 Q36,60 22,80 Q14,96 22,108" />
    </svg>
);

const ModernCarSVG = () => (
    <svg viewBox="0 0 260 130" width="100%" aria-hidden="true">
        <path fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"
            d="M8,76 Q8,62 22,56 L52,48 Q72,34 96,24 Q122,16 150,16 Q176,16 196,24 Q214,32 226,48 L244,56 Q254,62 254,76 L254,88 Q252,98 238,100 L22,100 Q8,98 8,76 Z" />
        <path fill="currentColor" opacity="0.28" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
            d="M52,48 Q64,28 90,20 Q118,12 148,14 Q172,14 192,24 Q206,32 214,46 L196,46 Q185,34 162,30 Q138,26 114,28 Q92,30 72,44 Z" />
        <circle cx="62" cy="108" r="20" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="62" cy="108" r="9" fill="currentColor" opacity="0.5" stroke="currentColor" strokeWidth="2" />
        <circle cx="196" cy="108" r="20" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="196" cy="108" r="9" fill="currentColor" opacity="0.5" stroke="currentColor" strokeWidth="2" />
        <line x1="236" y1="56" x2="252" y2="62" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="8" y1="66" x2="8" y2="80" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        <rect x="40" y="97" width="182" height="5" rx="2.5" fill="currentColor" opacity="0.4" />
    </svg>
);

const VintageMotoCycleSVG = () => (
    <svg viewBox="0 0 220 140" width="100%" aria-hidden="true">
        <circle cx="54" cy="106" r="26" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="54" cy="106" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="166" cy="106" r="26" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="166" cy="106" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="54" y1="80" x2="166" y2="80" stroke="currentColor" strokeWidth="2.5" />
        <line x1="80" y1="80" x2="54" y2="46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="140" y1="78" x2="166" y2="96" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
            d="M90,55 Q105,44 122,44 Q138,44 148,52 L145,72 L96,72 Z" />
        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            d="M54,46 L38,34 M54,46 L36,50" />
        <path fill="none" stroke="currentColor" strokeWidth="2"
            d="M34,72 Q22,80 22,96 Q22,110 38,118" />
        <path fill="none" stroke="currentColor" strokeWidth="2"
            d="M148,72 Q162,76 172,90 Q178,102 170,116" />
        <rect x="105" y="66" width="22" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="34" cy="52" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            d="M140,74 Q150,80 166,82" />
    </svg>
);

const ModernMotoCycleSVG = () => (
    <svg viewBox="0 0 220 140" width="100%" aria-hidden="true">
        <circle cx="52" cy="106" r="25" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="52" cy="106" r="10" fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="2" />
        <circle cx="168" cy="106" r="25" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="168" cy="106" r="10" fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="2" />
        <path fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"
            d="M38,80 Q34,60 44,48 Q56,34 78,30 L112,28 Q136,28 152,40 L172,60 Q178,72 172,84 L148,82 Q136,68 114,64 Q90,60 70,68 Q54,74 48,84 Z" />
        <path fill="currentColor" opacity="0.35" stroke="currentColor" strokeWidth="1.5"
            d="M44,52 Q50,36 66,30 L98,28 L96,46 Q78,46 62,54 Z" />
        <line x1="50" y1="60" x2="64" y2="38" stroke="currentColor" strokeWidth="2.5" />
        <line x1="58" y1="60" x2="72" y2="38" stroke="currentColor" strokeWidth="2.5" />
        <line x1="148" y1="68" x2="168" y2="93" stroke="currentColor" strokeWidth="2.5" />
        <path fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"
            d="M148,84 Q160,88 170,86 L180,86" />
        <path fill="currentColor" stroke="currentColor" strokeWidth="1"
            d="M26,54 Q24,46 32,44 L44,44 L38,58 Z" />
    </svg>
);

/* ── Tool panels ── */
const VintageToolsPanel = () => (
    <div className="flex flex-col items-center gap-5">
        <div className="relative">
            <Wrench size={64} strokeWidth={1.4} />
            <motion.div className="absolute -top-2 -right-2"
                animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
                <Settings size={22} strokeWidth={1.4} />
            </motion.div>
        </div>
        <div className="flex gap-6 items-center">
            {[28, 20, 36].map((s, i) => (
                <Wrench key={i} size={s} strokeWidth={1.4} style={{ transform: `rotate(${i * 30 - 20}deg)` }} />
            ))}
        </div>
    </div>
);

const ModernToolsPanel = () => (
    <div className="flex flex-col items-center gap-5">
        <div className="relative">
            <Cpu size={64} strokeWidth={1.6} />
            <motion.div className="absolute -top-2 -right-2"
                animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                <Settings size={22} strokeWidth={1.6} />
            </motion.div>
        </div>
        <div className="flex gap-6 items-center">
            <Wrench size={28} strokeWidth={1.6} />
            <Cpu size={32} strokeWidth={1.6} />
            <Settings size={24} strokeWidth={1.6} />
        </div>
    </div>
);

/* ── Card data ── */
const CARDS = [
    {
        title: "Vehicle",
        vintageLabel: "Classic Automobile",
        modernLabel: "Modern Sedan",
        VintageComp: VintageCarSVG,
        ModernComp: ModernCarSVG,
    },
    {
        title: "Motorcycle",
        vintageLabel: "Vintage Rider",
        modernLabel: "Sport Bike",
        VintageComp: VintageMotoCycleSVG,
        ModernComp: ModernMotoCycleSVG,
    },
    {
        title: "Tools",
        vintageLabel: "Old Workshop",
        modernLabel: "Smart Diagnostics",
        VintageComp: VintageToolsPanel,
        ModernComp: ModernToolsPanel,
    },
];

/* ── Main Section ── */
const VehicleEvolution = () => {
    const [modern, setModern] = useState(false);
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { margin: "-120px", once: false });

    // Auto-loop when in view
    useEffect(() => {
        if (!isInView) { setModern(false); return; }
        const t0 = setTimeout(() => setModern(true), 1000);
        const id = setInterval(() => setModern(p => !p), 4500);
        return () => { clearTimeout(t0); clearInterval(id); };
    }, [isInView]);

    const era = modern ? "Modern Era" : "Vintage Era";
    const eraColor = modern ? "#2563EB" : "#92400E";

    return (
        <section
            ref={sectionRef}
            className="relative py-24 overflow-hidden"
            style={{ background: "linear-gradient(160deg, #0F172A 0%, #1E293B 100%)" }}
        >
            {/* Decorative gears */}
            <SpinGear size={80} className="absolute top-8 left-8 pointer-events-none" />
            <SpinGear size={56} className="absolute bottom-10 right-10 pointer-events-none" />
            <SpinGear size={40} className="absolute top-20 right-[20%] pointer-events-none" />

            {/* Era badge */}
            <div className="flex justify-center mb-4">
                <motion.span
                    key={era}
                    initial={{ opacity: 0, y: -8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
                    style={{ backgroundColor: `${eraColor}22`, color: eraColor, border: `1px solid ${eraColor}55` }}
                >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: eraColor }} />
                    {era}
                </motion.span>
            </div>

            {/* Heading */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-14 px-4"
            >
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
                    From Classic Roads to{" "}
                    <span className="text-blue-400">Modern Rescue</span>
                </h2>
                <p className="text-slate-400 text-base max-w-xl mx-auto">
                    RoadBuddy connects you with nearby mechanics anytime, anywhere&nbsp;—
                    carrying the spirit of the vintage workshop into the digital age.
                </p>
            </motion.div>

            {/* Transformation cards */}
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {CARDS.map(({ title, vintageLabel, modernLabel, VintageComp, ModernComp }, idx) => {
                        const isHovered = hoveredCard === idx;
                        const showModern = modern;
                        const label = showModern ? modernLabel : vintageLabel;

                        return (
                            <motion.div
                                key={title}
                                initial={{ opacity: 0, y: 32 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{ duration: 0.55, delay: idx * 0.1 }}
                                onMouseEnter={() => setHoveredCard(idx)}
                                onMouseLeave={() => setHoveredCard(null)}
                                className="relative rounded-2xl cursor-pointer overflow-hidden"
                                style={{
                                    background: "rgba(30,41,59,0.85)",
                                    border: `1px solid ${showModern ? "rgba(59,130,246,0.3)" : "rgba(146,64,14,0.3)"}`,
                                    boxShadow: isHovered
                                        ? `0 0 32px ${showModern ? "rgba(59,130,246,0.2)" : "rgba(146,64,14,0.15)"}`
                                        : "none",
                                    transition: "box-shadow 0.3s ease, border-color 0.4s ease",
                                }}
                            >
                                {/* Top label bar */}
                                <div className="flex items-center justify-between px-5 pt-5 pb-2">
                                    <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">{title}</span>
                                    <motion.span
                                        key={label}
                                        initial={{ opacity: 0, x: 6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.35 }}
                                        className="text-xs font-medium flex items-center gap-1"
                                        style={{ color: showModern ? "#60A5FA" : "#D97706" }}
                                    >
                                        {label} <ArrowRight size={10} />
                                    </motion.span>
                                </div>

                                {/* Vehicle illustration area */}
                                <div className="relative h-44 flex items-center justify-center px-6 py-4">
                                    {/* Vintage layer */}
                                    <motion.div
                                        className="absolute inset-0 flex items-center justify-center px-6 py-4"
                                        animate={{
                                            opacity: showModern ? 0 : 1,
                                            scale: showModern ? 0.88 : 1,
                                            filter: showModern ? "blur(4px)" : "blur(0px)",
                                        }}
                                        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                                        style={{ color: "#D97706" }}
                                    >
                                        {/* Paper texture overlay */}
                                        <div className="absolute inset-0 opacity-5"
                                            style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "4px 4px" }} />
                                        <div style={{ filter: "grayscale(0.4) sepia(0.5) brightness(0.85)", width: "100%", maxWidth: 220 }}>
                                            <VintageComp />
                                        </div>
                                    </motion.div>

                                    {/* Modern layer */}
                                    <motion.div
                                        className="absolute inset-0 flex items-center justify-center px-6 py-4"
                                        animate={{
                                            opacity: showModern ? 1 : 0,
                                            scale: showModern ? 1 : 1.08,
                                            filter: showModern ? "blur(0px)" : "blur(4px)",
                                        }}
                                        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                                        style={{ color: "#3B82F6" }}
                                    >
                                        <div style={{ width: "100%", maxWidth: 220 }}>
                                            <ModernComp />
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Era divider shimmer line */}
                                <motion.div
                                    className="h-px mx-5 mb-4 rounded-full"
                                    animate={{
                                        background: showModern
                                            ? "linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)"
                                            : "linear-gradient(90deg, transparent, rgba(146,64,14,0.4), transparent)"
                                    }}
                                    transition={{ duration: 0.5 }}
                                />

                                {/* Footer text */}
                                <div className="px-5 pb-5">
                                    <motion.p
                                        key={label + "-desc"}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4 }}
                                        className="text-xs text-slate-500 text-center"
                                    >
                                        {showModern
                                            ? "Powered by RoadBuddy's live mechanic network"
                                            : "A legacy of trusted roadside craftsmanship"}
                                    </motion.p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Manual toggle control */}
                <div className="flex justify-center mt-10 gap-3">
                    <button
                        onClick={() => setModern(false)}
                        className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300"
                        style={{
                            background: !modern ? "rgba(146,64,14,0.25)" : "rgba(255,255,255,0.05)",
                            color: !modern ? "#D97706" : "#64748B",
                            border: `1px solid ${!modern ? "rgba(146,64,14,0.5)" : "rgba(255,255,255,0.1)"}`,
                        }}
                    >
                        ✦ Vintage Era
                    </button>
                    <button
                        onClick={() => setModern(true)}
                        className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300"
                        style={{
                            background: modern ? "rgba(37,99,235,0.25)" : "rgba(255,255,255,0.05)",
                            color: modern ? "#60A5FA" : "#64748B",
                            border: `1px solid ${modern ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)"}`,
                        }}
                    >
                        ⚡ Modern Era
                    </button>
                </div>

                {/* Mechanic spark accent row */}
                <div className="flex justify-center gap-4 mt-6 opacity-40">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ scaleY: [1, 1.8, 1], opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, delay: i * 0.18, repeat: Infinity, ease: "easeInOut" }}
                            className="w-0.5 rounded-full"
                            style={{ height: 12, background: modern ? "#3B82F6" : "#D97706" }}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default VehicleEvolution;
