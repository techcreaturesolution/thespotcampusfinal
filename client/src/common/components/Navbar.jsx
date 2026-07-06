import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMenu, FiX, FiArrowRight } from "react-icons/fi";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Portals", href: "#portals" },
  { label: "Plans", href: "#plans" },
  { label: "Mobile App", href: "#mobile-app" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-100/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center group">
            <img src="/logo_TSC.png" alt="The Spot Campus" width="143" height="44" className="h-11 object-contain group-hover:scale-105 transition duration-300" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            {navLinks.map((link) => {
              const hrefVal = isHomePage ? link.href : `/${link.href}`;
              return (
                <a
                  key={link.href}
                  href={hrefVal}
                  className="text-sm text-gray-600 font-semibold hover:text-primary-600 hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
                >
                  {link.label}
                </a>
              );
            })}
            
            <Link 
              to="/sign-in" 
              className="vibrant-btn inline-flex items-center gap-2 text-white font-bold px-6 py-2.5 rounded-xl active:scale-95 transition-all duration-150"
            >
              Login <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50/50 rounded-xl transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-5 border-t border-gray-100/50 animate-fadeIn">
            <div className="flex flex-col gap-4 px-2">
              {navLinks.map((link) => {
                const hrefVal = isHomePage ? link.href : `/${link.href}`;
                return (
                  <a
                    key={link.href}
                    href={hrefVal}
                    className="text-gray-600 font-semibold hover:text-primary-600 py-2 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                );
              })}
              
              <div className="h-px bg-gray-100 my-2" />

              <Link 
                to="/sign-in" 
                className="vibrant-btn flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl text-center active:scale-95 transition-all duration-150"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
