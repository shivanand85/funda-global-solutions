import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300">

      <div className="max-w-7xl mx-auto px-6 py-16">

        <div className="grid lg:grid-cols-4 gap-12">

          {/* Company */}

          <div>

            <h3 className="text-3xl font-bold text-cyan-400">
              Funda Global Solutions
            </h3>

            <p className="mt-5 leading-8">
              Delivering professional engineering simulation,
              CAD, AI, software development and technical
              training solutions.
            </p>

          </div>

          {/* Services */}

          <div>

            <h4 className="text-white font-semibold text-xl mb-6">
              Services
            </h4>

            <ul className="space-y-3">
              <li>CFD Simulation</li>
              <li>FEA Analysis</li>
              <li>CAD Design</li>
              <li>AI & Machine Learning</li>
              <li>Software Development</li>
            </ul>

          </div>

          {/* Quick Links */}

          <div>

            <h4 className="text-white font-semibold text-xl mb-6">
              Quick Links
            </h4>

            <ul className="space-y-3">
              <li>Home</li>
              <li>About</li>
              <li>Services</li>
              <li>Training</li>
              <li>Portfolio</li>
              <li>Contact</li>
            </ul>

          </div>

          {/* Contact */}

          <div>

            <h4 className="text-white font-semibold text-xl mb-6">
              Contact
            </h4>

            <div className="space-y-5">

              <div className="flex gap-3">
                <Mail className="text-cyan-400 mt-1" size={20} />
                <span>fundaglobalsolutions@gmail.com</span>
              </div>

              <div className="flex gap-3">
                <Phone className="text-cyan-400 mt-1" size={20} />
                <span>+91 9580630193</span>
              </div>

              <div className="flex gap-3">
                <MapPin className="text-cyan-400 mt-1" size={20} />
                <span>Serving Clients Worldwide</span>
              </div>

            </div>

          </div>

        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-500">

          © {new Date().getFullYear()} Funda Global Solutions. All Rights Reserved.

        </div>

      </div>

    </footer>
  );
}