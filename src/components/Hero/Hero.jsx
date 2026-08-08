import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./Hero.css";

import AnimatedNetwork from "./AnimatedNetwork";
import FloatingParticle from "./FloatingParticle";

export default function Hero() {
  return (
    <section
        className="
        relative
        overflow-hidden
        bg-slate-950
        min-h-screen
        flex
        items-center

        pt-20
        pb-16
        "
        >

      {/* Background */}

      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950" />

      {/* Left Glow */}

      <div className="absolute -left-40 top-0 w-[500px] h-[500px] rounded-full bg-cyan-500/20 blur-[170px]" />

      {/* Right Glow */}

      <div className="absolute -right-40 bottom-0 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[170px]" />

      {/* Floating Particles */}

      <FloatingParticle size={10} left="8%" top="10%" delay={0} duration={10} />
      <FloatingParticle size={8} left="18%" top="75%" delay={2} duration={12} />
      <FloatingParticle size={12} left="35%" top="25%" delay={3} duration={11} />
      <FloatingParticle size={10} left="82%" top="20%" delay={1} duration={9} />
      <FloatingParticle size={8} left="92%" top="70%" delay={5} duration={13} />
      <FloatingParticle size={6} left="60%" top="90%" delay={4} duration={8} />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6">

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT */}

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >

            <p className="mt-2 uppercase tracking-[0.4em] text-cyan-400 font-semibold">

              Engineering • AI • Innovation

            </p>

            <h1 className="mt-6 font-black leading-tight text-white">

              <span className="block text-5xl sm:text-6xl lg:text-7xl">

                Engineering

              </span>

              <span className="block text-5xl sm:text-6xl lg:text-7xl text-cyan-400">

                Simulation

              </span>

              <span className="block text-4xl sm:text-5xl lg:text-6xl">

                & AI Solutions

              </span>

            </h1>

            <p className="mt-8 text-slate-300 text-lg lg:text-xl leading-8 max-w-xl mx-auto lg:mx-0">

              Delivering professional CFD, FEA, CAD,
              Artificial Intelligence, IEEE Projects,
              Engineering Software Development,
              Digital Twins, Automation and Technical
              Consulting for academia and industry.

            </p>

            {/* Feature List */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">

              <div>

                <h4 className="text-cyan-400 font-bold">

                  Accurate

                </h4>

                <p className="text-gray-400">

                  Engineering Validation

                </p>

              </div>

              <div>

                <h4 className="text-cyan-400 font-bold">

                  Faster

                </h4>

                <p className="text-gray-400">

                  Quick Turnaround

                </p>

              </div>

              <div>

                <h4 className="text-cyan-400 font-bold">

                  Reliable

                </h4>

                <p className="text-gray-400">

                  Professional Support

                </p>

              </div>

            </div>

                {/* Buttons */}

                <div className="flex flex-col sm:flex-row gap-5 mt-12 justify-center lg:justify-start">

                  {/* Get Free Consultation */}

                  <Link
                    to="/contact"
                    className="
                      bg-cyan-500
                      hover:bg-cyan-600

                      text-white

                      px-8
                      py-4

                      rounded-2xl

                      font-semibold

                      transition

                      flex
                      items-center
                      justify-center

                      gap-2
                    "
                  >
                    Get Free Consultation

                    <ArrowRight size={20} />
                  </Link>


                  {/* Explore Our Expertise */}

                  <a
                    href="#expertise"
                    className="
                      border
                      border-cyan-400

                      text-cyan-300

                      hover:bg-cyan-500
                      hover:text-white

                      px-8
                      py-4

                      rounded-2xl

                      font-semibold

                      transition

                      flex
                      items-center
                      justify-center
                    "
                  >
                    Explore Our Expertise
                  </a>

                </div>

          </motion.div>

          {/* RIGHT */}

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9 }}
            className="
                flex
                justify-center

                mt-4
                sm:mt-6
                md:mt-10
                lg:mt-0
                "
          >

            <AnimatedNetwork />

          </motion.div>

        </div>

      </div>

    </section>
  );
}