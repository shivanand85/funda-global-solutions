import { motion } from "framer-motion";
import TechCard from "./TechCard";
import { technologies } from "./technologies";

export default function AnimatedNetwork() {
  return (
    <div
      className="
      relative
      mx-auto

      w-full
      max-w-[620px]

      aspect-square

      flex
      justify-center
      items-center
      "
    >

      {/* ============================
          Background Glow
      ============================ */}

      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.18, 0.35, 0.18],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
        absolute
        inset-0

        rounded-full

        bg-cyan-400/20

        blur-[120px]
        "
      />

      {/* ============================
          Outer Rings
      ============================ */}

      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
        absolute

        inset-6

        rounded-full

        border

        border-cyan-400/20
        "
      />

      <motion.div
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
        absolute

        inset-20

        rounded-full

        border

        border-cyan-400/15
        "
      />

      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
        absolute

        inset-32

        rounded-full

        border

        border-cyan-400/10
        "
      />

      {/* ============================
          Connection Lines
      ============================ */}

      <svg
        className="
        absolute
        inset-0

        w-full
        h-full
        "
        viewBox="0 0 100 100"
      >

        <g
          stroke="#22d3ee"
          strokeWidth=".35"
          opacity=".45"
        >

          <line x1="50" y1="50" x2="50" y2="10" />

          <line x1="50" y1="50" x2="18" y2="18" />

          <line x1="50" y1="50" x2="82" y2="18" />

          <line x1="50" y1="50" x2="10" y2="50" />

          <line x1="50" y1="50" x2="90" y2="50" />

          <line x1="50" y1="50" x2="18" y2="82" />

          <line x1="50" y1="50" x2="82" y2="82" />

          <line x1="50" y1="50" x2="50" y2="90" />

        </g>

      </svg>

            {/* ============================
          Center Circle
      ============================ */}

      <motion.div
        animate={{
          scale: [1, 1.04, 1],
          boxShadow: [
            "0 0 40px rgba(34,211,238,.30)",
            "0 0 80px rgba(34,211,238,.55)",
            "0 0 40px rgba(34,211,238,.30)",
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          z-30

          w-40
          h-40

          sm:w-48
          sm:h-48

          lg:w-56
          lg:h-56

          rounded-full

          bg-gradient-to-br
          from-cyan-500
          via-sky-500
          to-blue-700

          flex
          flex-col
          justify-center
          items-center

          text-center
        "
      >
        <div className="text-center leading-tight">

        <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold text-white">
          Our
        </h2>

        <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold text-white -mt-1">
          Expertise
        </h2>

        </div>
      </motion.div>

      {/* ============================
          Technology Cards
      ============================ */}

      {technologies.map((tech) => (
        <TechCard
          key={tech.id}
          tech={tech}
        />
      ))}

    </div>
  );
}