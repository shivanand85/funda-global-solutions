import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ServiceCard({ service }) {
  return (
    <motion.div
      whileHover={{
        y: -10,
        scale: 1.02,
      }}
      transition={{
        duration: 0.3,
      }}
      className="
        group
        relative
        overflow-hidden

        h-full

        rounded-3xl

        bg-slate-900/80
        backdrop-blur-xl

        border
        border-cyan-400/20

        p-8

        flex
        flex-col

        transition-all
        duration-500

        hover:border-cyan-400
        hover:shadow-[0_0_40px_rgba(34,211,238,.25)]
      "
    >
      {/* Top Glow */}

      <div
        className="
          absolute
          top-0
          left-0
          w-full
          h-1

          bg-gradient-to-r
          from-cyan-400
          via-sky-500
          to-cyan-400

          scale-x-0
          origin-left

          group-hover:scale-x-100

          transition-transform
          duration-500
        "
      />

      {/* Icon */}

      <div
        className="
          w-20
          h-20

          rounded-2xl

          bg-cyan-500/10

          border
          border-cyan-400/20

          flex
          items-center
          justify-center

          text-cyan-400
          text-5xl

          mb-6

          group-hover:bg-cyan-500/20
          group-hover:rotate-6

          transition-all
          duration-500
        "
      >
        {service.icon}
      </div>

      {/* Title */}

      <h3
        className="
          text-2xl
          font-bold

          text-white

          mb-4
        "
      >
        {service.title}
      </h3>

      {/* Description */}

      <p
        className="
          text-slate-300

          leading-7

          mb-6

          flex-grow
        "
      >
        {service.shortDescription}
      </p>

      {/* Features */}

      <ul className="space-y-3 mb-8">
        {service.features.map((feature, index) => (
          <li
            key={index}
            className="
              flex
              items-center

              text-slate-300
            "
          >
            <span
              className="
                w-6
                h-6

                rounded-full

                bg-cyan-500/10

                flex
                items-center
                justify-center

                text-cyan-400

                mr-3

                text-xs
                font-bold
              "
            >
              ✓
            </span>

            {feature}
          </li>
        ))}
      </ul>

    </motion.div>
  );
}