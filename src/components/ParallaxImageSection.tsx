import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface ParallaxImageSectionProps {
  title: string;
  description: string;
  imageUrl: string;
  align?: "left" | "right";
}

const ParallaxImageSection = ({
  title,
  description,
  imageUrl,
  align = "left",
}: ParallaxImageSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "22%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.06, 1.18]);

  return (
    <section
      ref={sectionRef}
      className="relative isolate my-10 h-[52vh] min-h-[360px] overflow-hidden rounded-[28px] border border-white/15 shadow-[0_18px_80px_rgba(3,8,19,0.45)]"
    >
      <motion.img
        src={imageUrl}
        alt={title}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
        style={{ y, scale }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,202,119,0.28),transparent_45%)]" />

      <div
        className={`relative z-10 flex h-full items-end p-8 md:p-12 ${align === "right" ? "justify-end" : "justify-start"}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-lg rounded-2xl border border-white/20 bg-black/35 p-6 backdrop-blur-md"
        >
          <h3 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-white/85 md:text-base">{description}</p>
        </motion.div>
      </div>
    </section>
  );
};

export default ParallaxImageSection;
