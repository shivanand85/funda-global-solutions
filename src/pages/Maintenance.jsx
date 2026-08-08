import { motion } from "framer-motion";
import { Wrench, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Maintenance({ title }) {
  return (
    <main
      className="
        relative
        min-h-screen
        w-full
        overflow-hidden
        bg-slate-950
        flex
        items-center
        justify-center
      "
    >

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-cyan-950
        "
      />

      {/* =====================================================
          BACKGROUND GLOW
      ===================================================== */}

      <div
        className="
          absolute
          -left-40
          top-10
          w-[450px]
          h-[450px]
          rounded-full
          bg-cyan-500/10
          blur-[150px]
          pointer-events-none
        "
      />

      <div
        className="
          absolute
          -right-40
          bottom-0
          w-[450px]
          h-[450px]
          rounded-full
          bg-blue-500/10
          blur-[150px]
          pointer-events-none
        "
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 30,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
        }}
        className="
          relative
          z-10
          w-full
          max-w-4xl
          px-6
          py-20
          text-center
        "
      >

        {/* ===================================================
            ICON
        =================================================== */}

        <motion.div
          animate={{
            rotate: [0, 5, -5, 0],
            y: [0, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
            mx-auto

            w-24
            h-24

            sm:w-28
            sm:h-28

            rounded-3xl

            bg-cyan-500/10

            border
            border-cyan-400/30

            flex
            items-center
            justify-center

            text-cyan-400

            shadow-[0_0_50px_rgba(34,211,238,.15)]
          "
        >
          <Wrench
            size={44}
            strokeWidth={2}
          />
        </motion.div>


        {/* ===================================================
            BRAND
        =================================================== */}

        <p
          className="
            mt-10

            uppercase
            tracking-[0.35em]

            text-cyan-400

            font-semibold

            text-sm
            sm:text-base
          "
        >
          Funda Global Solutions
        </p>


        {/* ===================================================
            PAGE TITLE
        =================================================== */}

        <h1
          className="
            mt-5

            text-5xl
            sm:text-6xl
            lg:text-7xl

            font-black

            text-white

            leading-tight
          "
        >
          {title}
        </h1>


        {/* ===================================================
            COMING SOON
        =================================================== */}

        <h2
          className="
            mt-4

            text-3xl
            sm:text-4xl
            lg:text-5xl

            font-bold

            text-cyan-400
          "
        >
          Coming Soon
        </h2>


        {/* ===================================================
            DESCRIPTION
        =================================================== */}

        <p
          className="
            mt-7

            text-base
            sm:text-lg
            lg:text-xl

            text-slate-300

            leading-8

            max-w-3xl
            mx-auto
          "
        >
          We are currently working on this section to bring
          you something useful, professional and valuable.
        </p>

        <p
          className="
            mt-3

            text-sm
            sm:text-base

            text-slate-400
          "
        >
          Please check back soon.
        </p>


        {/* ===================================================
            BUTTON
        =================================================== */}

        <Link
          to="/"
          className="
            mt-9

            inline-flex
            items-center
            justify-center
            gap-3

            bg-cyan-500
            hover:bg-cyan-400

            text-white

            font-semibold

            px-8
            py-4

            rounded-xl

            transition-all
            duration-300

            hover:scale-[1.02]

            shadow-[0_10px_30px_rgba(34,211,238,.15)]
          "
        >
          Back to Home

          <ArrowRight size={20} />
        </Link>

      </motion.div>

    </main>
  );
}