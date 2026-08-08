import services from "../../data/services";
import ServiceCard from "./ServiceCard";
import { motion } from "framer-motion";

export default function Services() {
  return (
    <section className="bg-slate-950 py-24">

      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >

          <span
            className="
            inline-block
            px-4
            py-2
            rounded-full
            bg-cyan-500/10
            border
            border-cyan-400/30
            text-cyan-400
            text-sm
            uppercase
            tracking-[0.25em]
            "
          >
            Our Engineering Services
          </span>

          <h2
            className="
            mt-6
            text-4xl
            sm:text-5xl
            lg:text-6xl
            font-black
            text-white
            "
          >
            Solutions That Power Innovation
          </h2>

          <p
            className="
            mt-6
            max-w-3xl
            mx-auto
            text-slate-300
            text-lg
            leading-8
            "
          >
            From CFD simulations and structural analysis to
            Artificial Intelligence, CAD design, software
            development and technical consulting, we provide
            complete engineering solutions tailored for
            industries, researchers, startups and academic
            institutions.
          </p>

        </motion.div>

        {/* Services Grid */}

        <div
          className="
          grid
          gap-8
          md:grid-cols-2
          xl:grid-cols-3
          "
        >
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.08,
              }}
            >
              <ServiceCard service={service} />
            </motion.div>
          ))}
        </div>

      </div>

    </section>
  );
}