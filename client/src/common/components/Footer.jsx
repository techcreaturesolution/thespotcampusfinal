import React from "react";
import { Link } from "react-router-dom";
import { FiGithub, FiLinkedin, FiTwitter } from "react-icons/fi";

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
            <Link to="/" className="flex items-center justify-start group">
              <img src="/logo_TSC.png" alt="The Spot Campus" width="130" height="40" className="h-10 object-contain" />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              An AI-powered campus placement ecosystem. Simplifying recruitment with automated examinations, proctored environments, and secure user management.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" aria-label="Twitter" className="p-2 rounded-lg bg-slate-900 hover:bg-gradient-to-r hover:from-[#3730a3] hover:to-[#0ea5e9] hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                <FiTwitter className="w-4 h-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="p-2 rounded-lg bg-slate-900 hover:bg-gradient-to-r hover:from-[#3730a3] hover:to-[#0ea5e9] hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                <FiLinkedin className="w-4 h-4" />
              </a>
              <a href="#" aria-label="GitHub" className="p-2 rounded-lg bg-slate-900 hover:bg-gradient-to-r hover:from-[#3730a3] hover:to-[#0ea5e9] hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                <FiGithub className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-white font-bold tracking-wider uppercase text-xs mb-5">Quick Links</p>
            <div className="space-y-3 text-sm">
              <a href="#features" className="block text-slate-400 hover:text-white transition-colors duration-150">Features</a>
              <a href="#mobile-app" className="block text-slate-400 hover:text-white transition-colors duration-150">Mobile App</a>
              <a href="#about" className="block text-slate-400 hover:text-white transition-colors duration-150">About</a>
              <a href="#contact" className="block text-slate-400 hover:text-white transition-colors duration-150">Contact Us</a>
            </div>
          </div>

          {/* For Users */}
          <div>
            <p className="text-white font-bold tracking-wider uppercase text-xs mb-5">For Users</p>
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
            <p className="text-white font-bold tracking-wider uppercase text-xs mb-5">Legal & Support</p>
            <div className="space-y-3 text-sm">
              <Link to="/privacy-policy" className="block text-slate-400 hover:text-white transition-colors duration-150">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="block text-slate-400 hover:text-white transition-colors duration-150">
                Terms of Service
              </Link>
              <Link 
                to="/account-deletion-request"
                className="block text-slate-400 hover:text-rose-500 transition-colors duration-150 font-medium"
              >
                Account Deletion Request
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-slate-900 pt-8 mt-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} The Spot Campus. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Powered by <a href="https://techcreaturesolution.com" target="_blank" rel="noopener noreferrer" className="text-slate-300 font-semibold hover:text-primary-400 transition-colors">Tech Creature Solution</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
