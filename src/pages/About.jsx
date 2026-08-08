import { motion } from "framer-motion";
import {
  Target,
  Eye,
  Lightbulb,
  Award,
  Users,
  Rocket,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function About() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950" />

      {/* Left Glow */}

      <div
        className="
        absolute
        -left-40
        top-20
        w-[500px]
        h-[500px]
        rounded-full
        bg-cyan-500/10
        blur-[150px]
        "
      />

      {/* Right Glow */}

      <div
        className="
        absolute
        -right-40
        top-[40%]
        w-[500px]
        h-[500px]
        rounded-full
        bg-blue-500/10
        blur-[150px]
        "
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">

        {/* ===================================================
            HERO
        =================================================== */}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >

          <p
            className="
            uppercase
            tracking-[0.35em]
            text-cyan-400
            font-semibold
            text-sm
            "
          >
            Engineering • AI • Innovation
          </p>

          <h1
            className="
            mt-5
            text-5xl
            sm:text-6xl
            lg:text-7xl
            font-black
            text-white
            "
          >
            About
            <span className="text-cyan-400"> Funda Global Solutions</span>
          </h1>

          <p
            className="
            mt-6
            text-lg
            sm:text-xl
            text-slate-300
            leading-8
            max-w-3xl
            mx-auto
            "
          >
            Engineering solutions driven by simulation,
            technology, innovation and practical problem solving.
          </p>

        </motion.div>


        {/* ===================================================
            COMPANY INTRODUCTION
        =================================================== */}

        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="
          mt-20
          grid
          lg:grid-cols-2
          gap-12
          items-center
          "
        >

          {/* LEFT */}

          <div>

            <p
              className="
              text-cyan-400
              uppercase
              tracking-[0.25em]
              text-sm
              font-semibold
              "
            >
              Who We Are
            </p>

            <h2
              className="
              mt-4
              text-4xl
              sm:text-5xl
              font-black
              text-white
              "
            >
              Engineering Ideas Into
              <span className="text-cyan-400">
                {" "}Practical Solutions
              </span>
            </h2>

            <p
              className="
              mt-6
              text-slate-300
              leading-8
              text-lg
              "
            >
              Funda Global Solutions provides engineering,
              simulation, software and technology-focused
              solutions for students, researchers, academics
              and industry professionals.
            </p>

            <p
              className="
              mt-5
              text-slate-400
              leading-8
              "
            >
              Our work combines engineering fundamentals with
              modern computational tools to help clients
              analyse problems, develop solutions, validate
              designs and turn technical ideas into practical
              outcomes.
            </p>

            <p
              className="
              mt-5
              text-slate-400
              leading-8
              "
            >
              From CFD and FEA to CAD, MATLAB, Python,
              artificial intelligence and engineering software
              development, we aim to provide technically
              focused and reliable support.
            </p>

          </div>


          {/* RIGHT — COMPANY CARD */}

          <div
            className="
            relative
            rounded-3xl
            border
            border-cyan-400/20
            bg-slate-900/70
            backdrop-blur-xl
            p-8
            sm:p-10
            overflow-hidden
            "
          >

            {/* Glow */}

            <div
              className="
              absolute
              -right-20
              -top-20
              w-60
              h-60
              rounded-full
              bg-cyan-500/10
              blur-3xl
              "
            />

            <div className="relative">

              <div
                className="
                w-20
                h-20
                rounded-2xl
                bg-gradient-to-br
                from-cyan-400
                to-blue-600
                flex
                items-center
                justify-center
                shadow-[0_0_40px_rgba(34,211,238,.25)]
                "
              >

                <span className="text-white text-3xl font-black">
                  FGS
                </span>

              </div>

              <h3
                className="
                mt-8
                text-3xl
                font-bold
                text-white
                "
              >
                Funda Global Solutions
              </h3>

              <p
                className="
                mt-3
                text-cyan-400
                font-medium
                tracking-wide
                "
              >
                Engineering • AI • Simulation
              </p>

              <div className="mt-8 space-y-4">

                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className="text-cyan-400"
                    size={21}
                  />

                  <span className="text-slate-300">
                    Engineering Analysis
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className="text-cyan-400"
                    size={21}
                  />

                  <span className="text-slate-300">
                    Simulation & Design
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className="text-cyan-400"
                    size={21}
                  />

                  <span className="text-slate-300">
                    AI & Software Solutions
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className="text-cyan-400"
                    size={21}
                  />

                  <span className="text-slate-300">
                    Technical Consulting
                  </span>
                </div>

              </div>

            </div>

          </div>

        </motion.section>


        {/* ===================================================
            MISSION / VISION
        =================================================== */}

        <section className="mt-24 grid md:grid-cols-2 gap-8">

          {/* Mission */}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="
            rounded-3xl
            border
            border-cyan-400/20
            bg-slate-900/70
            backdrop-blur-xl
            p-8
            "
          >

            <div
              className="
              w-14
              h-14
              rounded-xl
              bg-cyan-500/10
              border
              border-cyan-400/20
              flex
              items-center
              justify-center
              text-cyan-400
              "
            >
              <Target size={28} />
            </div>

            <h2 className="mt-6 text-3xl font-bold text-white">
              Our Mission
            </h2>

            <p className="mt-4 text-slate-400 leading-8">
              To provide accessible, practical and technically
              focused engineering and technology solutions that
              help individuals and organisations solve complex
              problems with confidence.
            </p>

          </motion.div>


          {/* Vision */}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="
            rounded-3xl
            border
            border-cyan-400/20
            bg-slate-900/70
            backdrop-blur-xl
            p-8
            "
          >

            <div
              className="
              w-14
              h-14
              rounded-xl
              bg-cyan-500/10
              border
              border-cyan-400/20
              flex
              items-center
              justify-center
              text-cyan-400
              "
            >
              <Eye size={28} />
            </div>

            <h2 className="mt-6 text-3xl font-bold text-white">
              Our Vision
            </h2>

            <p className="mt-4 text-slate-400 leading-8">
              To build a trusted engineering and technology
              platform that connects engineering expertise,
              digital tools and innovation to create meaningful
              solutions for academia and industry.
            </p>

          </motion.div>

        </section>


        {/* ===================================================
            WHAT WE DO
        =================================================== */}

        <section className="mt-24">

          <div className="text-center">

            <p
              className="
              text-cyan-400
              uppercase
              tracking-[0.3em]
              text-sm
              font-semibold
              "
            >
              What We Do
            </p>

            <h2
              className="
              mt-4
              text-4xl
              sm:text-5xl
              font-black
              text-white
              "
            >
              Our Core Capabilities
            </h2>

            <p
              className="
              mt-4
              text-slate-400
              max-w-2xl
              mx-auto
              leading-7
              "
            >
              We combine engineering knowledge with
              computational tools and modern technologies.
            </p>

          </div>


          <div
            className="
            mt-12
            grid
            sm:grid-cols-2
            lg:grid-cols-4
            gap-6
            "
          >

            {[
              {
                icon: <Award size={28} />,
                title: "Engineering",
                text: "Engineering analysis, design and technical problem solving.",
              },
              {
                icon: <Rocket size={28} />,
                title: "Simulation",
                text: "CFD, FEA and computational engineering analysis.",
              },
              {
                icon: <Lightbulb size={28} />,
                title: "AI & Software",
                text: "Python, MATLAB, AI and engineering software solutions.",
              },
              {
                icon: <Users size={28} />,
                title: "Consulting",
                text: "Technical guidance for academic and industry projects.",
              },
            ].map((item, index) => (

              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                className="
                rounded-2xl
                border
                border-cyan-400/20
                bg-slate-900/60
                p-6
                hover:border-cyan-400/50
                hover:-translate-y-1
                transition-all
                duration-300
                "
              >

                <div className="text-cyan-400">
                  {item.icon}
                </div>

                <h3 className="mt-5 text-xl font-bold text-white">
                  {item.title}
                </h3>

                <p className="mt-3 text-slate-400 leading-7">
                  {item.text}
                </p>

              </motion.div>

            ))}

          </div>

        </section>


        {/* ===================================================
            WHY FGS
        =================================================== */}

        <section className="mt-24">

          <div
            className="
            rounded-3xl
            border
            border-cyan-400/20
            bg-gradient-to-br
            from-slate-900/90
            to-cyan-950/40
            p-8
            sm:p-12
            "
          >

            <div className="grid lg:grid-cols-2 gap-12 items-center">

              <div>

                <p
                  className="
                  text-cyan-400
                  uppercase
                  tracking-[0.3em]
                  text-sm
                  font-semibold
                  "
                >
                  Why FGS
                </p>

                <h2
                  className="
                  mt-4
                  text-4xl
                  sm:text-5xl
                  font-black
                  text-white
                  "
                >
                  Practical.
                  <br />
                  Technical.
                  <br />
                  <span className="text-cyan-400">
                    Reliable.
                  </span>
                </h2>

              </div>


              <div className="space-y-5">

                {[
                  "Engineering-focused approach",
                  "Modern simulation and computational tools",
                  "Clear and practical technical solutions",
                  "Support for academic and industry requirements",
                  "Professional communication and project support",
                ].map((item, index) => (

                  <div
                    key={index}
                    className="flex items-start gap-4"
                  >

                    <CheckCircle2
                      className="text-cyan-400 mt-1 shrink-0"
                      size={22}
                    />

                    <p className="text-slate-300 text-lg">
                      {item}
                    </p>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            CTA
        =================================================== */}

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="
          mt-24
          text-center
          "
        >

          <p
            className="
            text-cyan-400
            uppercase
            tracking-[0.3em]
            text-sm
            font-semibold
            "
          >
            Let's Build Something
          </p>

          <h2
            className="
            mt-4
            text-4xl
            sm:text-5xl
            font-black
            text-white
            "
          >
            Have an Engineering Challenge?
          </h2>

          <p
            className="
            mt-4
            text-slate-400
            max-w-2xl
            mx-auto
            leading-7
            "
          >
            Tell us about your project and let's explore
            how Funda Global Solutions can help.
          </p>

          <a
            href="/contact"
            className="
            mt-8
            inline-flex
            items-center
            gap-2
            bg-cyan-500
            hover:bg-cyan-400
            text-white
            font-semibold
            px-8
            py-4
            rounded-xl
            transition-all
            duration-300
            "
          >
            Contact Us
            <ArrowRight size={20} />
          </a>

        </motion.section>

      </div>

    </main>
  );
}