import whyChooseUs from "../../data/whyChooseUs";
import FeatureItem from "./FeatureItem";

import {
  Cpu,
  BrainCircuit,
  Cog,
  Rocket,
} from "lucide-react";

export default function WhyChooseUs() {
  return (
    <section className="py-24 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* LEFT */}

          <div>

            <p className="uppercase tracking-[4px] text-cyan-600 font-semibold">
              Why Choose Us
            </p>

            <h2 className="text-5xl font-bold text-slate-900 mt-4 leading-tight">
              Engineering Excellence
              <br />
              Backed by Innovation
            </h2>

            <p className="mt-6 text-xl text-gray-600 leading-8">
              Funda Global Solutions delivers engineering simulation,
              artificial intelligence and product development services
              with a strong focus on innovation, quality and practical
              industrial solutions.
            </p>

            {/* Illustration */}

            <div className="mt-12">

              <div className="rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-700 p-10 shadow-2xl">

                <div className="grid grid-cols-2 gap-6">

                  <div className="bg-white/20 rounded-2xl p-6 text-center backdrop-blur">

                    <Cpu
                      size={48}
                      className="mx-auto text-white"
                    />

                    <p className="mt-3 text-white font-semibold">
                      Simulation
                    </p>

                  </div>

                  <div className="bg-white/20 rounded-2xl p-6 text-center backdrop-blur">

                    <BrainCircuit
                      size={48}
                      className="mx-auto text-white"
                    />

                    <p className="mt-3 text-white font-semibold">
                      AI
                    </p>

                  </div>

                  <div className="bg-white/20 rounded-2xl p-6 text-center backdrop-blur">

                    <Cog
                      size={48}
                      className="mx-auto text-white"
                    />

                    <p className="mt-3 text-white font-semibold">
                      CAD
                    </p>

                  </div>

                  <div className="bg-white/20 rounded-2xl p-6 text-center backdrop-blur">

                    <Rocket
                      size={48}
                      className="mx-auto text-white"
                    />

                    <p className="mt-3 text-white font-semibold">
                      Innovation
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* RIGHT */}

          <div className="space-y-10">

            {whyChooseUs.map((feature) => (
              <FeatureItem
                key={feature.id}
                feature={feature}
              />
            ))}

          </div>

        </div>

        {/* Statistics */}

        <div className="mt-24 border-t pt-16">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 text-center">

            <div>

              <h3 className="text-5xl font-bold text-cyan-600">
                50+
              </h3>

              <p className="mt-3 text-gray-600">
                Engineering Projects
              </p>

            </div>

            <div>

              <h3 className="text-5xl font-bold text-cyan-600">
                15+
              </h3>

              <p className="mt-3 text-gray-600">
                Software Technologies
              </p>

            </div>

            <div>

              <h3 className="text-5xl font-bold text-cyan-600">
                100+
              </h3>

              <p className="mt-3 text-gray-600">
                Students Trained
              </p>

            </div>

            <div>

              <h3 className="text-5xl font-bold text-cyan-600">
                24/7
              </h3>

              <p className="mt-3 text-gray-600">
                Technical Support
              </p>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}