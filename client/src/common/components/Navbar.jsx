import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX, FiShield, FiArrowRight } from "react-icons/fi";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-100/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-600 via-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-black text-xl tracking-wider">S</span>
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              The Spot <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Campus</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 font-semibold hover:text-primary-600 hover:-translate-y-0.5 transition-all duration-200">Features</a>
            <a href="#about" className="text-gray-600 font-semibold hover:text-primary-600 hover:-translate-y-0.5 transition-all duration-200">About</a>
            <a href="#contact" className="text-gray-600 font-semibold hover:text-primary-600 hover:-translate-y-0.5 transition-all duration-200">Contact</a>
            
            <Link 
              to="/sign-in" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-primary-500/10 hover:shadow-lg hover:shadow-primary-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Login <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50/50 rounded-xl transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-5 border-t border-gray-100/50 animate-fadeIn">
            <div className="flex flex-col gap-4 px-2">
              <a 
                href="#features" 
                className="text-gray-600 font-semibold hover:text-primary-600 py-2 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#about" 
                className="text-gray-600 font-semibold hover:text-primary-600 py-2 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <a 
                href="#contact" 
                className="text-gray-600 font-semibold hover:text-primary-600 py-2 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              
              <div className="h-px bg-gray-100 my-2" />

              <Link 
                to="/sign-in" 
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition text-center"
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
