import { Mail, Phone, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ContactCTA() {
  return (
    <section className="py-24 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-6">

        <div className="rounded-3xl border border-cyan-500/30 bg-white/5 backdrop-blur-lg p-10 md:p-16 text-center shadow-2xl">

          <p className="uppercase tracking-[4px] text-cyan-400 font-semibold">
            Let's Work Together
          </p>

          <h2 className="text-5xl font-bold text-white mt-4">
            Ready to Start Your Engineering Project?
          </h2>

          <p className="mt-6 text-slate-300 text-xl max-w-3xl mx-auto leading-8">
            Whether you need CFD simulation, FEA analysis, CAD design,
            AI solutions or engineering consultation, we're here to help
            bring your ideas to life.
          </p>

          <div className="mt-10">
            <Link
              to="/contact"
              className="
                inline-flex
                items-center
                gap-2

                bg-cyan-500
                hover:bg-cyan-600

                text-white

                px-8
                py-4

                rounded-xl

                font-semibold

                transition
                duration-300
              "
            >
              Request Free Consultation

              <ArrowRight size={20} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">

            <a
              href="mailto:fundaglobalsolutions@gmail.com"
              className="flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 py-5 hover:border-cyan-500 transition"
            >
              <Mail className="text-cyan-400" />
              <span className="text-white">
                fundaglobalsolutions@gmail.com
              </span>
            </a>

            <a
              href="https://wa.me/919580630193"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 py-5 hover:border-cyan-500 transition"
            >
              <Phone className="text-cyan-400" />
              <span className="text-white">
                +91 9580630193
              </span>
            </a>

          </div>

        </div>

      </div>
    </section>
  );
}