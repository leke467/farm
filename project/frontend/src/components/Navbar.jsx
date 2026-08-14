import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiArrowRight, FiZap, FiCheckCircle, FiShield } from "react-icons/fi";
import Logo from "./Logo";
import { useUser } from "../context/UserContext";

function Navbar({ dark = false }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Features", path: "/features" },
    { name: "Plans & Pricing", path: "/pricing" },
    { name: "About Us", path: "/about" },
    { name: "Contact Us", path: "/contact" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
      dark 
        ? "bg-slate-950/80 border-slate-800/80 text-white" 
        : "bg-white/80 border-emerald-100 text-gray-900"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <Logo size={36} />
            <div className="flex flex-col">
              <span className={`font-display font-extrabold text-xl md:text-2xl tracking-tight transition-colors ${
                dark ? "text-white group-hover:text-emerald-400" : "text-emerald-900 group-hover:text-emerald-600"
              }`}>
                Livesteads
              </span>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-emerald-500 -mt-1">
                Farm OS
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 bg-emerald-500/10 p-1.5 rounded-full border border-emerald-500/20">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    active
                      ? dark
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                        : "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : dark
                        ? "text-slate-300 hover:text-white hover:bg-slate-800/50"
                        : "text-gray-700 hover:text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {(user?.is_superuser || user?.is_staff) && (
              <Link
                to="/admin/dashboard"
                className="text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-purple-600/20"
              >
                <FiShield size={14} />
                <span>Superadmin Portal</span>
              </Link>
            )}

            <Link
              to="/login"
              className={`text-sm font-semibold px-4 py-2 rounded-xl transition ${
                dark
                  ? "text-slate-300 hover:text-white hover:bg-slate-800"
                  : "text-gray-700 hover:text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all transform active:scale-95 flex items-center gap-2"
            >
              <span>Get Started</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2.5 rounded-xl border transition ${
              dark
                ? "bg-slate-900 border-slate-800 text-white"
                : "bg-emerald-50 border-emerald-200 text-emerald-900"
            }`}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden mt-4 pt-4 border-t border-emerald-500/20"
            >
              <div className="flex flex-col gap-2 pb-4">
                {navLinks.map((link) => {
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-3 rounded-xl text-base font-semibold transition ${
                        active
                          ? dark
                            ? "bg-emerald-500 text-slate-950 font-bold"
                            : "bg-emerald-600 text-white font-bold"
                          : dark
                            ? "text-slate-300 hover:bg-slate-900"
                            : "text-gray-700 hover:bg-emerald-50"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}

                <div className="pt-4 mt-2 border-t border-emerald-500/10 flex flex-col gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full py-3 text-center rounded-xl font-semibold border ${
                      dark
                        ? "border-slate-800 text-white bg-slate-900"
                        : "border-gray-200 text-gray-800 bg-gray-50"
                    }`}
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3.5 text-center rounded-xl font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <span>Get Started Free</span>
                    <FiArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

export default Navbar;
