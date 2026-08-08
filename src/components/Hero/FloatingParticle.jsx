import { motion } from "framer-motion";

export default function FloatingParticle({
  size = 8,
  left = "50%",
  top = "50%",
  delay = 0,
  duration = 10,
}) {
  return (
    <motion.div
      className="absolute rounded-full bg-cyan-400/30 blur-[2px] pointer-events-none"
      style={{
        width: size,
        height: size,
        left,
        top,
      }}
      animate={{
        y: [0, -40, 0],
        x: [0, 20, -20, 0],
        opacity: [0.2, 0.8, 0.2],
        scale: [1, 1.4, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}