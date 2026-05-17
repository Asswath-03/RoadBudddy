import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { MapPin, Wrench, MessageSquare, Navigation, Star, Clock } from "lucide-react";

/* ─────────────── Phone Frame ─────────────── */
const PhoneFrame = ({ children }: { children: React.ReactNode }) => (
    <div style={{
        width: 196, height: 400, background: "#0F172A", borderRadius: 40, padding: 10,
        boxShadow: "0 30px 70px rgba(0,0,0,0.13), 0 0 0 1px rgba(255,255,255,0.08) inset", position: "relative"
    }}>
        <div style={{ position: "absolute", right: -3, top: 90, width: 3, height: 36, background: "#1E293B", borderRadius: "0 3px 3px 0" }} />
        <div style={{ position: "absolute", left: -3, top: 80, width: 3, height: 26, background: "#1E293B", borderRadius: "3px 0 0 3px" }} />
        <div style={{ position: "absolute", left: -3, top: 114, width: 3, height: 26, background: "#1E293B", borderRadius: "3px 0 0 3px" }} />
        <div style={{ borderRadius: 30, overflow: "hidden", height: "100%", background: "#fff", display: "flex", flexDirection: "column", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 56, height: 18, background: "#0F172A", borderRadius: "0 0 12px 12px", zIndex: 20 }} />
            <div style={{ paddingTop: 18, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {children}
            </div>
        </div>
    </div>
);

/* ─────────────── Screen 1: Request Help ─────────────── */
const Screen1 = () => (
    <div className="flex flex-col h-full bg-white overflow-hidden">
        <div className="bg-blue-600 px-3 pt-1 pb-2.5 shrink-0">
            <p className="text-white text-[11px] font-bold">🚗 Request Help</p>
        </div>
        <div className="flex-1 p-2.5 space-y-2.5 overflow-hidden">
            <div>
                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">Vehicle</p>
                <div className="flex gap-1.5">
                    {["Car", "Bike", "Truck"].map((v, i) => (
                        <span key={v} className={`text-[9px] px-2 py-1 rounded-full font-medium ${i === 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{v}</span>
                    ))}
                </div>
            </div>
            <div>
                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">Issue</p>
                <div className="grid grid-cols-2 gap-1.5">
                    {[["🔧", "Flat Tyre", true], ["⚡", "Battery", false], ["⛽", "Fuel", false], ["🔥", "Engine", false]].map(([icon, label, active]) => (
                        <div key={label as string} className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-[9px] font-medium ${active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"}`}>
                            <span>{icon}</span><span>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-2.5 py-2">
                <MapPin size={11} className="text-blue-600 shrink-0" />
                <span className="text-[9px] text-slate-600 truncate">MG Road, Bengaluru</span>
            </div>
            <button className="w-full bg-blue-600 text-white text-[10px] font-bold py-2.5 rounded-xl shadow-sm">
                Send Help Request →
            </button>
            <div className="flex items-center justify-center gap-1 text-[9px] text-green-600">
                <Clock size={9} /><span>Avg. response: 12 min</span>
            </div>
        </div>
    </div>
);

/* ─────────────── Screen 2: AI Chat ─────────────── */
const Screen2 = () => (
    <div className="flex flex-col h-full bg-white overflow-hidden">
        <div className="bg-blue-600 px-3 pt-1 pb-2.5 shrink-0 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <MessageSquare size={11} className="text-white" />
            </div>
            <div>
                <p className="text-white text-[10px] font-bold">RoadBuddy AI</p>
                <p className="text-blue-200 text-[8px]">● Online</p>
            </div>
        </div>
        <div className="flex-1 bg-slate-50 p-2.5 space-y-2 overflow-hidden">
            <div className="flex gap-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-600 shrink-0 flex items-center justify-center">
                    <span className="text-[6px] text-white font-bold">RB</span>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none px-2.5 py-2 shadow-sm max-w-[80%]">
                    <p className="text-[9px] text-slate-700">Hi! I'm your roadside assistant. What issue are you facing?</p>
                </div>
            </div>
            <div className="flex justify-end">
                <div className="bg-blue-600 rounded-2xl rounded-tr-none px-2.5 py-2 max-w-[72%]">
                    <p className="text-[9px] text-white">My car battery is dead and won't start.</p>
                </div>
            </div>
            <div className="flex gap-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-600 shrink-0 flex items-center justify-center">
                    <span className="text-[6px] text-white font-bold">RB</span>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none px-2.5 py-2 shadow-sm max-w-[82%]">
                    <p className="text-[9px] text-slate-700">Got it! Finding nearest mechanic with battery tools. ETA ~10 min 🔧</p>
                </div>
            </div>
            <div className="flex gap-1.5 flex-wrap pt-1">
                <span className="text-[8px] border border-blue-400 text-blue-600 px-2 py-0.5 rounded-full">Jump Start</span>
                <span className="text-[8px] border border-blue-400 text-blue-600 px-2 py-0.5 rounded-full">New Battery</span>
            </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-2 bg-white border-t border-slate-100 shrink-0">
            <div className="flex-1 bg-slate-100 rounded-xl px-2.5 py-1.5 text-[8px] text-slate-400">Type your issue...</div>
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <Navigation size={10} className="text-white" />
            </div>
        </div>
    </div>
);

/* ─────────────── Screen 3: Nearby Mechanics ─────────────── */
const Screen3 = () => (
    <div className="flex flex-col h-full bg-white overflow-hidden">
        <div className="bg-blue-600 px-3 pt-1 pb-2.5 shrink-0">
            <p className="text-white text-[10px] font-bold">📍 Nearby Services</p>
            <p className="text-blue-200 text-[8px]">5 helpers within 1 km</p>
        </div>
        {/* Map — pins clustered tightly around user */}
        <div className="h-24 relative bg-slate-100 shrink-0 overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(203,213,225,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(203,213,225,0.7) 1px,transparent 1px)", backgroundSize: "14px 14px" }} />
            {/* User pin — center */}
            <div className="absolute" style={{ left: "46%", top: "42%" }}>
                <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-50" />
            </div>
            {/* Very nearby service pins — clustered tight */}
            {[
                { x: "56%", y: "28%", color: "bg-green-500", icon: "🔧" },
                { x: "32%", y: "36%", color: "bg-orange-500", icon: "⛽" },
                { x: "60%", y: "58%", color: "bg-green-500", icon: "🔧" },
                { x: "30%", y: "62%", color: "bg-purple-500", icon: "⚡" },
                { x: "54%", y: "72%", color: "bg-blue-400", icon: "🚛" },
            ].map((p, i) => (
                <div key={i} className="absolute flex items-center justify-center" style={{ left: p.x, top: p.y, width: 18, height: 18, borderRadius: "50%" }}>
                    <span style={{ fontSize: 10 }}>{p.icon}</span>
                </div>
            ))}
            {/* Tight radius circle */}
            <div className="absolute" style={{ left: "26%", top: "14%", width: 90, height: 90, borderRadius: "50%", border: "1.5px dashed rgba(37,99,235,0.3)" }} />
        </div>
        {/* Nearby service list */}
        <div className="flex-1 p-1.5 space-y-1 overflow-hidden">
            {[
                { icon: "🔧", name: "Ravi Mechanics", type: "Car Repair", dist: "200 m", eta: "2 min", color: "text-green-600", bg: "bg-green-50  border-green-200", a: true },
                { icon: "⛽", name: "QuickFuel Delivery", type: "Fuel Emergency", dist: "350 m", eta: "4 min", color: "text-orange-600", bg: "bg-orange-50 border-orange-200", a: false },
                { icon: "⚡", name: "BatteryPro", type: "Battery / Jumpstart", dist: "500 m", eta: "6 min", color: "text-purple-600", bg: "bg-purple-50 border-purple-200", a: false },
                { icon: "🚛", name: "TowEasy", type: "Towing Service", dist: "750 m", eta: "9 min", color: "text-blue-600", bg: "bg-blue-50   border-blue-200", a: false },
            ].map(m => (
                <div key={m.name} className={`flex items-center gap-2 px-2 py-1.5 rounded-xl border ${m.a ? m.bg : "bg-slate-50 border-slate-200"}`}>
                    <span style={{ fontSize: 14 }}>{m.icon}</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-slate-800 truncate">{m.name}</p>
                        <p className={`text-[8px] font-medium ${m.a ? m.color : "text-slate-400"}`}>{m.type}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className={`text-[8px] font-bold ${m.a ? m.color : "text-slate-500"}`}>{m.dist}</p>
                        <p className="text-[7px] text-slate-400">{m.eta}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

/* ─────────────── Screen 4: Tracking ─────────────── */
const Screen4 = () => (
    <div className="flex flex-col h-full bg-white overflow-hidden">
        <div className="bg-blue-600 px-3 pt-1 pb-2.5 shrink-0 flex items-center justify-between">
            <div>
                <p className="text-white text-[10px] font-bold">Track Your Help</p>
                <p className="text-blue-200 text-[8px]">Live tracking active</p>
            </div>
            <span className="text-[7px] bg-green-400 text-slate-900 px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
        </div>
        <div className="px-3 py-2.5 bg-slate-50 shrink-0 space-y-1.5">
            {[{ l: "Confirmed", d: true }, { l: "En Route", d: true, a: true }, { l: "Arrived", d: false }, { l: "Complete", d: false }].map(s => (
                <div key={s.l} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[8px] ${s.d ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"}`}>{s.d ? "✓" : ""}</div>
                    <span className={`text-[9px] font-medium ${(s as any).a ? "text-blue-600" : s.d ? "text-slate-700" : "text-slate-400"}`}>{s.l}</span>
                    {(s as any).a && <span className="ml-auto text-[7px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">In Progress</span>}
                </div>
            ))}
        </div>
        <div className="mx-2.5 mt-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100 shrink-0">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Wrench size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-800">Ravi Mechanics</p>
                    <div className="flex items-center gap-0.5">
                        <Star size={8} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[8px] text-slate-500">4.8 · Hero Splendor</span>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-blue-600">8 min</p>
                    <p className="text-[7px] text-slate-400">ETA</p>
                </div>
            </div>
        </div>
        <div className="flex-1 mx-2.5 mt-2 mb-1 rounded-2xl overflow-hidden relative bg-slate-100">
            <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(203,213,225,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(203,213,225,0.6) 1px,transparent 1px)", backgroundSize: "14px 14px" }} />
            <div className="absolute" style={{ left: "60%", top: "32%" }}>
                <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white shadow-md flex items-center justify-center">
                    <Navigation size={10} className="text-white" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-50" />
            </div>
            <div className="absolute" style={{ left: "28%", top: "62%" }}>
                <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-md" />
            </div>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M63,35 Q48,50 31,64" stroke="#3B82F6" strokeWidth="2.5" fill="none" strokeDasharray="5,3" strokeLinecap="round" />
            </svg>
        </div>
    </div>
);

/* ─────────────── Screen data ─────────────── */
const SCREENS = [
    { Screen: Screen1, color: "#2563EB", label: "Request Help Instantly", desc: "Select your vehicle issue and send a help request in seconds." },
    { Screen: Screen2, color: "#7C3AED", label: "Smart Roadside Assistant", desc: "Get instant help and guidance from our AI assistant." },
    { Screen: Screen3, color: "#059669", label: "Find Nearby Mechanics", desc: "RoadBuddy detects nearby mechanics and service providers." },
    { Screen: Screen4, color: "#0284C7", label: "Track Your Help", desc: "Monitor mechanic arrival and service updates in real time." },
];

/* ─────────────── AppShowcase ─────────────── */
const AppShowcase = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
    const [emblaRef] = useEmblaCarousel({ loop: true, align: "center", dragFree: true });

    // Track which phone is active (hovered / tapped)
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    // Spotlight effect: active phone zooms up, others dim & shrink
    const getScale = (idx: number) => {
        if (hoveredIdx === null) return 1;
        return hoveredIdx === idx ? 1.10 : 0.92;
    };
    const getOpacity = (idx: number) => {
        if (hoveredIdx === null) return 1;
        return hoveredIdx === idx ? 1 : 0.58;
    };

    return (
        <section ref={sectionRef} className="py-24 overflow-hidden" style={{ background: "linear-gradient(180deg, #F1F5F9 0%, #F8FAFC 100%)" }}>
            {/* Heading */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="text-center mb-16 px-4"
            >
                <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-4">
                    App Preview
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
                    See RoadBuddy{" "}
                    <span className="text-blue-600">in Action</span>
                </h2>
                <p className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed">
                    Experience how RoadBuddy connects you with nearby mechanics and roadside assistance in seconds.
                </p>
            </motion.div>

            {/* Desktop: 4 phones — spotlight zoom on hover */}
            <div className="hidden md:flex justify-center items-end gap-8 px-4">
                {SCREENS.map(({ Screen, color, label, desc }, idx) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 56 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.65, delay: 0.1 + idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col items-center gap-5"
                    >
                        {/* Phone with spotlight zoom */}
                        <motion.div
                            animate={{
                                y: hoveredIdx === null ? [0, -10, 0] : hoveredIdx === idx ? -6 : 0,
                                scale: getScale(idx),
                                opacity: getOpacity(idx),
                            }}
                            transition={{
                                y: {
                                    duration: 3.8,
                                    delay: idx * 0.5,
                                    repeat: hoveredIdx === null ? Infinity : 0,
                                    ease: "easeInOut",
                                },
                                scale: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                                opacity: { duration: 0.2 },
                            }}
                            whileTap={{ scale: getScale(idx) * 0.97 }}
                            onHoverStart={() => setHoveredIdx(idx)}
                            onHoverEnd={() => setHoveredIdx(null)}
                            style={{
                                cursor: "pointer",
                                borderRadius: 40,
                                filter: hoveredIdx === idx
                                    ? `drop-shadow(0 24px 48px ${color}55)`
                                    : "none",
                            }}
                        >
                            <PhoneFrame>
                                <Screen />
                            </PhoneFrame>
                        </motion.div>

                        {/* Label fades with phone */}
                        <motion.div
                            className="text-center"
                            style={{ maxWidth: 180 }}
                            animate={{ opacity: getOpacity(idx) }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ background: color }} />
                            <p className="text-sm font-bold text-slate-800">{label}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-snug">{desc}</p>
                        </motion.div>
                    </motion.div>
                ))}
            </div>

            {/* Mobile: Embla swipe carousel — whileTap zooms the touched phone */}
            <div className="md:hidden">
                <div ref={emblaRef} className="overflow-hidden px-4">
                    <div className="flex gap-6 pl-[calc(50vw-98px)]">
                        {SCREENS.map(({ Screen, color, label, desc }) => (
                            <div key={label} className="flex-none flex flex-col items-center gap-5" style={{ width: 196 }}>
                                <motion.div
                                    style={{ borderRadius: 40, cursor: "pointer" }}
                                    whileTap={{ scale: 1.08 }}
                                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <PhoneFrame>
                                        <Screen />
                                    </PhoneFrame>
                                </motion.div>
                                <div className="text-center" style={{ maxWidth: 180 }}>
                                    <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ background: color }} />
                                    <p className="text-sm font-bold text-slate-800">{label}</p>
                                    <p className="text-xs text-slate-500 mt-1 leading-snug">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-center text-xs text-slate-400 mt-6">← Swipe to explore →</p>
            </div>

            {/* Bottom CTA */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.65 }}
                className="flex justify-center mt-14"
            >
                <a href="/request-help"
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                    style={{ background: "linear-gradient(135deg, #2563EB, #3B82F6)", boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }}>
                    Try RoadBuddy Now
                    <span>→</span>
                </a>
            </motion.div>
        </section>
    );
};

export default AppShowcase;
