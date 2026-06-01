import React from "react";
import { Link } from "react-router-dom";
import { FiMail, FiPhone, FiMapPin, FiGithub, FiLinkedin, FiTwitter } from "react-icons/fi";

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 py-16 px-4 relative overflow-hidden">
      {/* Decorative radial gradients for high-end look */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/10">
                <span className="text-white font-black text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                The Spot <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">Campus</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              An AI-powered campus placement ecosystem. Simplifying recruitment with automated examinations, proctored environments, and secure user management.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="p-2 rounded-lg bg-slate-900 hover:bg-primary-600 hover:text-white transition-all duration-200">
                <FiTwitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-900 hover:bg-primary-600 hover:text-white transition-all duration-200">
                <FiLinkedin className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-900 hover:bg-primary-600 hover:text-white transition-all duration-200">
                <FiGithub className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold tracking-wider uppercase text-xs mb-5">Quick Links</h4>
            <div className="space-y-3 text-sm">
              <a href="#features" className="block text-slate-400 hover:text-white transition-colors duration-150">Features</a>
              <a href="#about" className="block text-slate-400 hover:text-white transition-colors duration-150">About</a>
              <a href="#contact" className="block text-slate-400 hover:text-white transition-colors duration-150">Contact Us</a>
            </div>
          </div>

          {/* For Users */}
          <div>
            <h4 className="text-white font-bold tracking-wider uppercase text-xs mb-5">For Users</h4>
            <div className="space-y-3 text-sm">
              <Link to="/sign-up-student" className="block text-slate-400 hover:text-white transition-colors duration-150">Student Registration</Link>
              <Link to="/sign-up-company" className="block text-slate-400 hover:text-white transition-colors duration-150">Company Registration</Link>
              <Link to="/sign-up-university" className="block text-slate-400 hover:text-white transition-colors duration-150">University Registration</Link>
              <Link to="/sign-up-college" className="block text-slate-400 hover:text-white transition-colors duration-150">College Registration</Link>
              <Link to="/sign-in" className="block text-slate-400 hover:text-white transition-colors duration-150">Account Sign In</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold tracking-wider uppercase text-xs mb-5">Legal & Support</h4>
            <div className="space-y-3 text-sm">
              <p className="text-slate-400 hover:text-white transition-colors duration-150 cursor-pointer">Privacy Policy</p>
              <p className="text-slate-400 hover:text-white transition-colors duration-150 cursor-pointer">Terms of Service</p>
              <p className="text-slate-400 hover:text-white transition-colors duration-150 cursor-pointer">Security Protocol</p>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-slate-900 pt-8 mt-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} The Spot Campus. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Powered by <a href="https://techcreaturesolution.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 font-semibold hover:text-primary-400 transition-colors">Tech Creature Solution</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
