import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Training", path: "/training" },
    { name: "Portfolio", path: "/portfolio" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header
      className={`
        fixed
        top-0
        left-0
        w-full
        z-50
        transition-all
        duration-300
        ${
          scrolled
            ? "bg-slate-950/80 backdrop-blur-xl shadow-xl border-b border-cyan-500/10"
            : "bg-slate-950/95"
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="h-20 flex items-center justify-between">

          {/* Logo */}

          <Link to="/" className="flex flex-col">

            <h1 className="text-2xl lg:text-3xl font-black text-cyan-400 leading-none">
              Funda Global Solutions
            </h1>

          </Link>

          {/* Desktop Menu */}

          <div className="hidden lg:flex items-center gap-10">

            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `
                  relative
                  font-medium
                  transition-colors
                  duration-300
                  ${
                    isActive
                      ? "text-cyan-400"
                      : "text-white hover:text-cyan-300"
                  }
                `
                }
              >
                {({ isActive }) => (
                  <>
                    {item.name}

                    <span
                      className={`
                        absolute
                        left-0
                        -bottom-2
                        h-[2px]
                        bg-cyan-400
                        transition-all
                        duration-300
                        ${
                          isActive
                            ? "w-full"
                            : "w-0 group-hover:w-full"
                        }
                      `}
                    />
                  </>
                )}
              </NavLink>
            ))}

          </div>

              {/* Right Button */}

              <div className="hidden lg:flex items-center gap-4">

                <Link
                  to="/contact"
                  className="
                    px-6
                    py-3

                    rounded-xl

                    bg-cyan-500

                    hover:bg-cyan-400

                    text-white

                    font-semibold

                    transition-all

                    duration-300

                    flex

                    items-center

                    gap-2

                    shadow-lg

                    hover:shadow-cyan-500/30
                  "
                >
                  Get Quote

                  <ArrowRight size={18} />
                </Link>

              </div>

          {/* Mobile Menu Button */}

          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="lg:hidden text-white"
          >
            {mobileMenu ? (
              <X size={30} />
            ) : (
              <Menu size={30} />
            )}
          </button>

        </div>

        {/* Mobile Menu */}

        {mobileMenu && (

          <div
            className="
            lg:hidden

            pb-6

            flex

            flex-col

            gap-5

            text-lg
            "
          >

            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenu(false)}
                className={({ isActive }) =>
                  isActive
                    ? "text-cyan-400 font-semibold"
                    : "text-white"
                }
              >
                {item.name}
              </NavLink>
            ))}

            <button
              className="
              mt-3

              bg-cyan-500

              hover:bg-cyan-400

              text-white

              rounded-xl

              py-3

              font-semibold

              transition
              "
            >
              Get Quote
            </button>

          </div>

        )}

      </div>
    </header>
  );
}