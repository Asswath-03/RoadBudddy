import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { MapPin, User, Wrench, CheckCircle, Navigation } from "lucide-react";

const stages = [
  { label: "Request Sent", icon: MapPin, color: "hsl(var(--primary))" },
  { label: "Mechanic Accepted", icon: Wrench, color: "hsl(var(--warning))" },
  { label: "En Route", icon: Navigation, color: "hsl(25, 95%, 55%)" },
  { label: "Arrived!", icon: CheckCircle, color: "hsl(var(--success))" },
];

const LiveDispatch = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [currentStage, setCurrentStage] = useState(-1);
  const [eta, setEta] = useState(12);
  const [mechanicPos, setMechanicPos] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    stages.forEach((_, i) => {
      timers.push(setTimeout(() => setCurrentStage(i), 1200 * (i + 1)));
    });
    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  // Animate mechanic moving & ETA countdown
  useEffect(() => {
    if (currentStage < 2) return;
    const interval = setInterval(() => {
      setMechanicPos((p) => Math.min(p + 2, 100));
      setEta((e) => Math.max(e - 1, 0));
    }, 300);
    return () => clearInterval(interval);
  }, [currentStage]);

  return (
    <section className="py-24 relative overflow-hidden section-glow-primary">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Live Assistance <span className="text-gradient-primary">in Action</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Watch how our dispatch system works in real-time.
          </p>
        </motion.div>

        <div ref={ref} className="max-w-3xl mx-auto">
          {/* Map mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative glass rounded-2xl p-6 md:p-8 depth-shadow overflow-hidden"
          >
            {/* Map grid background */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }} />

            {/* Map content area */}
            <div className="relative h-48 md:h-64 mb-6">
              {/* User location - pulsing dot */}
              <motion.div
                className="absolute left-[15%] top-1/2 -translate-y-1/2"
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-primary" />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary"
                    animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-medium text-primary whitespace-nowrap bg-primary/10 px-2 py-0.5 rounded-full">
                    <User className="w-3 h-3 inline mr-1" />You
                  </span>
                </div>
              </motion.div>

              {/* Route line */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <motion.path
                  d="M 15 50 Q 40 30 55 50 T 85 50"
                  fill="none"
                  stroke="hsl(25, 95%, 55%)"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  pathLength={1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={currentStage >= 1 ? { pathLength: 1, opacity: 0.6 } : {}}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  vectorEffect="non-scaling-stroke"
                  style={{
                    transform: "translate(0, 0)",
                  }}
                />
              </svg>

              {/* Mechanic marker */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${15 + (mechanicPos * 0.7)}%` }}
                initial={{ scale: 0, y: -20 }}
                animate={currentStage >= 1 ? { scale: 1, y: 0 } : {}}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <div className="relative">
                  <div className="w-5 h-5 rounded-full bg-warning border-2 border-warning-foreground flex items-center justify-center">
                    <Wrench className="w-3 h-3 text-warning-foreground" />
                  </div>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-medium text-warning whitespace-nowrap bg-warning/10 px-2 py-0.5 rounded-full">
                    Mechanic
                  </span>
                </div>
              </motion.div>

              {/* Destination marker */}
              <motion.div
                className="absolute right-[15%] top-1/2 -translate-y-1/2"
                initial={{ scale: 0, y: -20 }}
                animate={isInView ? { scale: 1, y: 0 } : {}}
                transition={{ delay: 0.8, type: "spring" }}
              >
                <div className="w-4 h-4 rounded-full bg-success border-2 border-success-foreground" />
              </motion.div>

              {/* ETA badge */}
              {currentStage >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-4 right-4 glass px-4 py-2 rounded-lg"
                >
                  <p className="text-xs text-muted-foreground">ETA</p>
                  <p className="text-2xl font-display font-bold text-primary">{eta} min</p>
                </motion.div>
              )}

              {/* Success overlay */}
              {currentStage >= 3 && mechanicPos >= 100 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm rounded-xl"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      <CheckCircle className="w-16 h-16 text-success mx-auto mb-2" />
                    </motion.div>
                    <p className="text-lg font-display font-bold text-success">Help Has Arrived!</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Stage indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stages.map((stage, i) => (
                <motion.div
                  key={stage.label}
                  initial={{ opacity: 0.3 }}
                  animate={currentStage >= i ? { opacity: 1 } : { opacity: 0.3 }}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-500 ${
                    currentStage >= i
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/30 bg-transparent"
                  }`}
                >
                  <stage.icon className="w-4 h-4 shrink-0" style={{ color: currentStage >= i ? stage.color : "hsl(var(--muted-foreground))" }} />
                  <span className={`text-xs font-medium ${currentStage >= i ? "text-foreground" : "text-muted-foreground"}`}>
                    {stage.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LiveDispatch;
