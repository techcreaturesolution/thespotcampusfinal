import React, { useState } from "react";
import { Link } from "react-router-dom";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { toast } from "react-toastify";
import {
  FiBookOpen,
  FiUsers,
  FiBriefcase,
  FiShield,
  FiCamera,
  FiLock,
  FiCpu,
  FiSmartphone,
  FiArrowRight,
  FiMail,
  FiPhone,
  FiMapPin,
  FiMenu,
  FiX,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    contact: "",
    subject: "",
    message: "",
  });

  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      await customFetch.post("/contact/", contactForm);
      toast.success("Thank you for contacting us!");
      setContactForm({ name: "", email: "", contact: "", subject: "", message: "" });
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Something went wrong");
    }
  };

  const features = [
    {
      icon: <FiCpu className="w-8 h-8" />,
      title: "AI-Powered Exam Generation",
      desc: "Generate exam papers automatically from Job Descriptions using advanced AI. Questions are tailored to the exact skills required.",
    },
    {
      icon: <FiLock className="w-8 h-8" />,
      title: "Tab Lock & Anti-Cheat",
      desc: "Complete tab lock during exams. Any attempt to switch tabs is detected, logged, and can trigger auto-submission.",
    },
    {
      icon: <FiCamera className="w-8 h-8" />,
      title: "Camera Proctoring",
      desc: "Periodic camera captures detect face presence and multiple faces. Real-time trust score calculation with violation tracking.",
    },
    {
      icon: <FiShield className="w-8 h-8" />,
      title: "Secure Assessment",
      desc: "Full-screen exam mode, copy-paste disabled, right-click blocked, screenshot prevention, and DevTools detection.",
    },
    {
      icon: <FiBriefcase className="w-8 h-8" />,
      title: "Smart Placement",
      desc: "AI-matched job recommendations, multi-level recruitment process, and automated application tracking for companies.",
    },
    {
      icon: <FiSmartphone className="w-8 h-8" />,
      title: "Flutter Student App",
      desc: "Native mobile app for students with job browsing, exam notifications, application tracking, and push notifications.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                The Spot <span className="text-primary-600">Campus</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-primary-600 transition">Features</a>
              <a href="#about" className="text-gray-600 hover:text-primary-600 transition">About</a>
              <a href="#contact" className="text-gray-600 hover:text-primary-600 transition">Contact</a>
              <Link to="/sign-in" className="btn-secondary text-sm">Sign In</Link>
              <Link to="/sign-up-student" className="btn-primary text-sm">Get Started</Link>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-3">
                <a href="#features" className="text-gray-600 py-2">Features</a>
                <a href="#about" className="text-gray-600 py-2">About</a>
                <a href="#contact" className="text-gray-600 py-2">Contact</a>
                <Link to="/sign-in" className="btn-secondary text-sm text-center">Sign In</Link>
                <Link to="/sign-up-student" className="btn-primary text-sm text-center">Get Started</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <FiCpu className="w-4 h-4" /> AI-Powered Campus Placement Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Smart Campus Placement
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">
              With AI & Proctoring
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Transform campus recruitment with AI-generated exams from Job Descriptions,
            secure proctoring with tab lock & camera monitoring, and a complete
            placement management ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/sign-up-student"
              className="btn-primary text-lg px-8 py-3 flex items-center justify-center gap-2"
            >
              Register as Student <FiArrowRight />
            </Link>
            <Link
              to="/sign-up-company"
              className="btn-secondary text-lg px-8 py-3"
            >
              Register as Company
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-16 bg-spot-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { end: 500, suffix: "+", label: "Universities" },
              { end: 10000, suffix: "+", label: "Students" },
              { end: 200, suffix: "+", label: "Companies" },
              { end: 5000, suffix: "+", label: "Placements" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white">
                  {statsInView ? (
                    <CountUp end={stat.end} duration={2.5} suffix={stat.suffix} />
                  ) : (
                    "0"
                  )}
                </p>
                <p className="text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Advanced Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need for a secure, AI-powered campus placement platform
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-gray-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                About The Spot Campus
              </h2>
              <p className="text-gray-600 mb-4">
                The Spot Campus is a comprehensive AI-powered campus placement
                platform that bridges the gap between educational institutions,
                companies, and students.
              </p>
              <p className="text-gray-600 mb-6">
                Our platform features advanced exam proctoring with tab-lock
                technology, real-time camera monitoring, and AI-generated
                question papers based on Job Descriptions, ensuring fair and
                secure assessments.
              </p>
              <div className="space-y-3">
                {[
                  "AI exam generation from Job Descriptions",
                  "Tab lock & camera proctoring during exams",
                  "Multi-role access: Admin, University, College, TPO, Company, Student",
                  "Flutter mobile app for students",
                  "Razorpay payment integration",
                  "Real-time violation tracking & trust scoring",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 bg-primary-600 rounded-full" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Platform Roles</h3>
              <div className="space-y-4">
                {[
                  { role: "Admin", desc: "Full platform management & analytics" },
                  { role: "University", desc: "Manage colleges, degrees & branches" },
                  { role: "College", desc: "Handle student placements & TPO" },
                  { role: "TPO", desc: "Coordinate between companies & students" },
                  { role: "Company", desc: "Post jobs, create exams from JD, proctor" },
                  { role: "Student", desc: "Apply for jobs, take secure exams" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FiUsers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.role}</p>
                      <p className="text-white/80 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get In Touch
            </h2>
            <p className="text-lg text-gray-600">
              Have questions? We'd love to hear from you.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="input-field"
                  value={contactForm.name}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, name: e.target.value })
                  }
                  required
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="input-field"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="input-field"
                  value={contactForm.contact}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, contact: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Subject"
                  className="input-field"
                  value={contactForm.subject}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, subject: e.target.value })
                  }
                  required
                />
              </div>
              <textarea
                placeholder="Your Message"
                rows="5"
                className="input-field"
                value={contactForm.message}
                onChange={(e) =>
                  setContactForm({ ...contactForm, message: e.target.value })
                }
                required
              />
              <button type="submit" className="btn-primary w-full">
                Send Message
              </button>
            </form>
            <div className="space-y-6">
              {[
                { icon: <FiMail />, title: "Email", value: "info@thespotcampus.com" },
                { icon: <FiPhone />, title: "Phone", value: "+91 98765 43210" },
                { icon: <FiMapPin />, title: "Address", value: "Gujarat, India" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-gray-600">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-spot-dark text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold">The Spot Campus</span>
              </div>
              <p className="text-gray-400">
                AI-Powered Campus Placement Platform with advanced proctoring
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-gray-400">
                <a href="#features" className="block hover:text-white transition">Features</a>
                <a href="#about" className="block hover:text-white transition">About</a>
                <a href="#contact" className="block hover:text-white transition">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Users</h4>
              <div className="space-y-2 text-gray-400">
                <Link to="/sign-up-student" className="block hover:text-white transition">Student Registration</Link>
                <Link to="/sign-up-company" className="block hover:text-white transition">Company Registration</Link>
                <Link to="/sign-in" className="block hover:text-white transition">Login</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-gray-400">
                <p className="hover:text-white transition cursor-pointer">Privacy Policy</p>
                <p className="hover:text-white transition cursor-pointer">Terms of Service</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} The Spot Campus. All rights reserved. Powered by Tech Creature Solution.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
