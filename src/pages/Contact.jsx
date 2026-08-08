import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  MessageCircle,
  Phone,
  MapPin,
  ArrowRight,
  Send,
} from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const whatsappMessage = `
Hello Funda Global Solutions,

I would like to discuss an engineering project.

Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
Service Required: ${formData.service}

Project Details:
${formData.message}

Thank you.
    `.trim();

    const whatsappURL = `https://wa.me/919580630193?text=${encodeURIComponent(
      whatsappMessage
    )}`;

    window.open(whatsappURL, "_blank");
  };

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
        bottom-0
        w-[500px]
        h-[500px]
        rounded-full
        bg-blue-500/10
        blur-[150px]
        "
      />

      {/* =====================================================
          PAGE CONTENT
      ===================================================== */}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
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
            Let's Work
            <span className="text-cyan-400"> Together</span>
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
            Have an engineering project, simulation requirement,
            software development idea or research challenge?
            Tell us about it and let's discuss how we can help.
          </p>

        </motion.div>


        {/* ===================================================
            MAIN CONTACT AREA
        =================================================== */}

        <div
          className="
          mt-16
          grid
          lg:grid-cols-5
          gap-10
          items-stretch
          "
        >

          {/* =================================================
              LEFT CONTACT INFORMATION
          ================================================= */}

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2"
          >

            <div
              className="
              h-full
              rounded-3xl
              bg-slate-900/70
              border
              border-cyan-400/20
              backdrop-blur-xl
              p-8
              "
            >

              <p
                className="
                text-cyan-400
                uppercase
                tracking-[0.25em]
                text-sm
                font-semibold
                "
              >
                Contact Information
              </p>

              <h2
                className="
                mt-4
                text-3xl
                font-bold
                text-white
                "
              >
                Let's discuss your project
              </h2>

              <p
                className="
                mt-4
                text-slate-300
                leading-7
                "
              >
                Whether you need engineering simulation,
                CAD development, AI solutions, technical
                consulting or project support, feel free
                to contact us.
              </p>


              {/* WhatsApp */}

              <a
                href="https://wa.me/919580630193"
                target="_blank"
                rel="noopener noreferrer"
                className="
                mt-8
                flex
                items-center
                gap-4
                p-4
                rounded-2xl
                bg-cyan-500/10
                border
                border-cyan-400/20
                hover:border-cyan-400/60
                hover:bg-cyan-500/15
                transition-all
                duration-300
                "
              >

                <div
                  className="
                  w-12
                  h-12
                  rounded-xl
                  bg-cyan-500/20
                  flex
                  items-center
                  justify-center
                  text-cyan-400
                  "
                >
                  <MessageCircle size={25} />
                </div>

                <div>

                  <p className="text-sm text-slate-400">
                    WhatsApp
                  </p>

                  <p className="text-white font-semibold">
                    +91 9580630193
                  </p>

                </div>

              </a>


              {/* Email */}

              <a
                href="mailto:fundaglobalsolutions@gmail.com"
                className="
                mt-4
                flex
                items-center
                gap-4
                p-4
                rounded-2xl
                bg-cyan-500/10
                border
                border-cyan-400/20
                hover:border-cyan-400/60
                hover:bg-cyan-500/15
                transition-all
                duration-300
                "
              >

                <div
                  className="
                  w-12
                  h-12
                  rounded-xl
                  bg-cyan-500/20
                  flex
                  items-center
                  justify-center
                  text-cyan-400
                  "
                >
                  <Mail size={25} />
                </div>

                <div>

                  <p className="text-sm text-slate-400">
                    Email
                  </p>

                  <p className="text-white font-semibold break-all">
                    fundaglobalsolutions@gmail.com
                  </p>

                </div>

              </a>


              {/* Phone */}

              <div
                className="
                mt-4
                flex
                items-center
                gap-4
                p-4
                rounded-2xl
                bg-cyan-500/10
                border
                border-cyan-400/20
                "
              >

                <div
                  className="
                  w-12
                  h-12
                  rounded-xl
                  bg-cyan-500/20
                  flex
                  items-center
                  justify-center
                  text-cyan-400
                  "
                >
                  <Phone size={25} />
                </div>

                <div>

                  <p className="text-sm text-slate-400">
                    Phone / WhatsApp
                  </p>

                  <p className="text-white font-semibold">
                    +91 9580630193
                  </p>

                </div>

              </div>


              {/* Location */}

              <div
                className="
                mt-4
                flex
                items-center
                gap-4
                p-4
                rounded-2xl
                bg-cyan-500/10
                border
                border-cyan-400/20
                "
              >

                <div
                  className="
                  w-12
                  h-12
                  rounded-xl
                  bg-cyan-500/20
                  flex
                  items-center
                  justify-center
                  text-cyan-400
                  "
                >
                  <MapPin size={25} />
                </div>

                <div>

                  <p className="text-sm text-slate-400">
                    Service Availability
                  </p>

                  <p className="text-white font-semibold">
                    Online • Worldwide
                  </p>

                </div>

              </div>


              {/* WhatsApp CTA */}

              <a
                href="https://wa.me/919580630193"
                target="_blank"
                rel="noopener noreferrer"
                className="
                mt-8
                inline-flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-cyan-500
                hover:bg-cyan-400
                text-white
                font-semibold
                py-4
                transition-all
                duration-300
                "
              >

                Chat on WhatsApp

                <ArrowRight size={20} />

              </a>

            </div>

          </motion.div>


          {/* =================================================
              RIGHT CONTACT FORM
          ================================================= */}

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-3"
          >

            <div
              className="
              rounded-3xl
              bg-slate-900/80
              border
              border-cyan-400/20
              backdrop-blur-xl
              p-8
              sm:p-10
              "
            >

              <div className="mb-8">

                <p
                  className="
                  text-cyan-400
                  uppercase
                  tracking-[0.25em]
                  text-sm
                  font-semibold
                  "
                >
                  Project Enquiry
                </p>

                <h2
                  className="
                  mt-3
                  text-3xl
                  font-bold
                  text-white
                  "
                >
                  Tell us about your project
                </h2>

                <p className="mt-3 text-slate-400">
                  Submit the form and your enquiry will open
                  directly in WhatsApp.
                </p>

              </div>


              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >

                {/* Name + Email */}

                <div className="grid sm:grid-cols-2 gap-6">

                  <div>

                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Your Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your name"
                      className="
                      w-full
                      rounded-xl
                      bg-slate-950/70
                      border
                      border-slate-700
                      focus:border-cyan-400
                      focus:ring-1
                      focus:ring-cyan-400
                      text-white
                      placeholder:text-slate-500
                      px-4
                      py-3
                      outline-none
                      transition
                      "
                    />

                  </div>


                  <div>

                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email *
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className="
                      w-full
                      rounded-xl
                      bg-slate-950/70
                      border
                      border-slate-700
                      focus:border-cyan-400
                      focus:ring-1
                      focus:ring-cyan-400
                      text-white
                      placeholder:text-slate-500
                      px-4
                      py-3
                      outline-none
                      transition
                      "
                    />

                  </div>

                </div>


                {/* Phone + Service */}

                <div className="grid sm:grid-cols-2 gap-6">

                  <div>

                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Phone / WhatsApp *
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+91 XXXXX XXXXX"
                      className="
                      w-full
                      rounded-xl
                      bg-slate-950/70
                      border
                      border-slate-700
                      focus:border-cyan-400
                      focus:ring-1
                      focus:ring-cyan-400
                      text-white
                      placeholder:text-slate-500
                      px-4
                      py-3
                      outline-none
                      transition
                      "
                    />

                  </div>


                  <div>

                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Service Required *
                    </label>

                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      required
                      className="
                      w-full
                      rounded-xl
                      bg-slate-950/70
                      border
                      border-slate-700
                      focus:border-cyan-400
                      focus:ring-1
                      focus:ring-cyan-400
                      text-white
                      px-4
                      py-3
                      outline-none
                      transition
                      "
                    >

                      <option value="">
                        Select a service
                      </option>

                      <option value="CFD Simulation">
                        CFD Simulation
                      </option>

                      <option value="FEA / Structural Analysis">
                        FEA / Structural Analysis
                      </option>

                      <option value="CAD Design">
                        CAD Design
                      </option>

                      <option value="Artificial Intelligence">
                        Artificial Intelligence
                      </option>

                      <option value="Python / MATLAB Development">
                        Python / MATLAB Development
                      </option>

                      <option value="Engineering Software Development">
                        Engineering Software Development
                      </option>

                      <option value="IEEE / Academic Project">
                        IEEE / Academic Project
                      </option>

                      <option value="Technical Consulting">
                        Technical Consulting
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                  </div>

                </div>


                {/* Message */}

                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project Details *
                  </label>

                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Tell us about your project, requirements, software, deadline, budget, etc."
                    className="
                    w-full
                    rounded-xl
                    bg-slate-950/70
                    border
                    border-slate-700
                    focus:border-cyan-400
                    focus:ring-1
                    focus:ring-cyan-400
                    text-white
                    placeholder:text-slate-500
                    px-4
                    py-3
                    outline-none
                    resize-none
                    transition
                    "
                  />

                </div>


                {/* Submit */}

                <button
                  type="submit"
                  className="
                  w-full

                  flex
                  items-center
                  justify-center
                  gap-3

                  rounded-xl

                  bg-cyan-500
                  hover:bg-cyan-400

                  text-white
                  font-bold

                  py-4
                  px-6

                  transition-all
                  duration-300

                  hover:shadow-[0_0_30px_rgba(34,211,238,.3)]
                  "
                >

                  Send Enquiry on WhatsApp

                  <Send size={20} />

                </button>

                <p className="text-center text-xs text-slate-500">
                  Your enquiry will be opened in WhatsApp before it
                  is sent. No information is stored on this website.
                </p>

              </form>

            </div>

          </motion.div>

        </div>


        {/* ===================================================
            BOTTOM CTA
        =================================================== */}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="
          mt-20
          text-center
          rounded-3xl
          border
          border-cyan-400/20
          bg-cyan-500/5
          p-10
          "
        >

          <h2
            className="
            text-3xl
            sm:text-4xl
            font-bold
            text-white
            "
          >
            Have a project in mind?
          </h2>

          <p className="mt-3 text-slate-400">
            Let's turn your engineering idea into a practical solution.
          </p>

          <a
            href="https://wa.me/919580630193"
            target="_blank"
            rel="noopener noreferrer"
            className="
            mt-6
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
            transition
            "
          >

            Start a Conversation

            <ArrowRight size={20} />

          </a>

        </motion.div>

      </div>

    </main>
  );
}