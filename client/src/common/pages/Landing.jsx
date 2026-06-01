import React, { useState } from "react";
import { Link } from "react-router-dom";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { toast } from "react-toastify";
import {
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
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Landing = () => {
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
      icon: <FiCpu className="w-6 h-6" />,
      title: "AI Exam Generation",
      desc: "Generate exam papers automatically from Job Descriptions using advanced AI models. Tailor questions to the exact skills required.",
      badge: "AI Powered",
    },
    {
      icon: <FiLock className="w-6 h-6" />,
      title: "Tab Lock & Anti-Cheat",
      desc: "Maintain extreme integrity with browser-level tab locking. Automatically logs switches and handles auto-submission on violations.",
    },
    {
      icon: <FiCamera className="w-6 h-6" />,
      title: "Active Proctoring",
      desc: "Periodic camera snapshots combined with face detection alerts. Real-time trust score calculations to monitor student integrity.",
    },
    {
      icon: <FiShield className="w-6 h-6" />,
      title: "Secure Environment",
      desc: "Includes full-screen lock enforcement, keyboard and mouse block lists (copy-paste, right-click), and DevTools protection.",
    },
    {
      icon: <FiBriefcase className="w-6 h-6" />,
      title: "Recruitment Suite",
      desc: "End-to-end recruitment pipelines for companies. Custom round creation, live dashboard results, and easy applicant filters.",
    },
    {
      icon: <FiSmartphone className="w-6 h-6" />,
      title: "Student Mobile App",
      desc: "Elegant and highly optimized Flutter mobile application for students. Quick applications, results, and proctored mobile assessments.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 overflow-x-hidden selection:bg-primary-600 selection:text-white">
      {/* Separate Navbar Component */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
        {/* Soft Ambient Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary-200/20 to-indigo-200/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-indigo-200/20 to-violet-200/20 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto text-center relative">
          {/* Subtle animated floating badge */}
          <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-100/80 text-primary-700 rounded-full px-5 py-2 text-sm font-semibold mb-8 hover:scale-102 transition-transform duration-200 cursor-pointer">
            <FiCpu className="w-4 h-4 text-primary-600 animate-pulse" />
            <span>AI-Driven Placement & Proctoring Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 mb-8 leading-tight tracking-tight">
            Accelerate Placement
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-indigo-600 to-violet-600">
              With Intellect & Integrity
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            A comprehensive web and mobile ecosystem featuring automated AI exam generation from JDs, strict real-time tab & camera proctoring, and structured recruiter workflows.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <Link
              to="/sign-up-student"
              className="group inline-flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl shadow-lg hover:shadow-primary-500/20 hover:-translate-y-1 transition-all duration-200"
            >
              <span className="font-bold text-lg">Student Portal</span>
              <span className="text-xs text-white/80 mt-1 flex items-center gap-1 group-hover:gap-1.5 transition-all">Create Profile & Apply <FiArrowRight /></span>
            </Link>
            <Link
              to="/sign-up-company"
              className="group inline-flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-200"
            >
              <span className="font-bold text-lg">Company Portal</span>
              <span className="text-xs text-white/80 mt-1 flex items-center gap-1 group-hover:gap-1.5 transition-all">Post Jobs & Proctors <FiArrowRight /></span>
            </Link>
            <Link
              to="/sign-up-university"
              className="group inline-flex flex-col items-center justify-center p-6 bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-2xl shadow-lg hover:shadow-violet-500/20 hover:-translate-y-1 transition-all duration-200"
            >
              <span className="font-bold text-lg">University Portal</span>
              <span className="text-xs text-white/80 mt-1 flex items-center gap-1 group-hover:gap-1.5 transition-all">Manage Colleges & Affiliates <FiArrowRight /></span>
            </Link>
            <Link
              to="/sign-up-college"
              className="group inline-flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-200"
            >
              <span className="font-bold text-lg">College Portal</span>
              <span className="text-xs text-white/80 mt-1 flex items-center gap-1 group-hover:gap-1.5 transition-all">Affiliate Register & Verify <FiArrowRight /></span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section with sleek glowing cards */}
      <section ref={statsRef} className="py-12 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-14 shadow-2xl shadow-indigo-950/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
              {[
                { end: 500, suffix: "+", label: "Universities Listed" },
                { end: 10000, suffix: "+", label: "Registered Students" },
                { end: 200, suffix: "+", label: "Global Recruiters" },
                { end: 5000, suffix: "+", label: "Successful Placements" },
              ].map((stat, i) => (
                <div key={i} className="text-center md:border-r border-slate-800 last:border-0 px-2">
                  <p className="text-3xl sm:text-5xl font-black text-white mb-2">
                    {statsInView ? (
                      <CountUp end={stat.end} duration={2.5} suffix={stat.suffix} />
                    ) : (
                      "0"
                    )}
                  </p>
                  <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block text-primary-600 font-bold tracking-wider uppercase text-xs mb-3 px-3 py-1 bg-primary-50 rounded-full">
              Why Choose Us
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 mb-4 tracking-tight">
              Powerful Core Capabilities
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
              A comprehensive toolkit tailored to guarantee secure, fair, and seamless placement workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group bg-white border border-slate-100 hover:border-primary-100/50 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                {feature.badge && (
                  <span className="absolute top-4 right-4 bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {feature.badge}
                  </span>
                )}
                <div className="w-12 h-12 bg-gradient-to-br from-primary-50 to-indigo-50 group-hover:from-primary-600 group-hover:to-indigo-600 text-primary-600 group-hover:text-white rounded-xl flex items-center justify-center mb-6 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary-600 transition-colors duration-200">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Platform & Roles */}
      <section id="about" className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* About text */}
            <div className="space-y-6">
              <div className="inline-block text-primary-600 font-bold tracking-wider uppercase text-xs px-3 py-1 bg-primary-50 rounded-full">
                About Our Platform
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-950 mb-4 tracking-tight leading-tight">
                An Integrated Placement Ecosystem
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed">
                The Spot Campus is a unified cloud recruitment and examination platform connecting educational institutes, HR managers, and aspiring students. 
              </p>
              <p className="text-slate-600 leading-relaxed">
                By automating standard procedures, validating test environment configurations, generating skill-oriented questionnaire formats, and facilitating clean performance analytical reports, we minimize friction at every step of recruitment.
              </p>
              
              <div className="space-y-4 pt-4">
                {[
                  "On-demand AI Question Generation from Job Descriptions",
                  "Integrated anti-cheat tab monitors & camera proctors",
                  "Consolidated Multi-Role access configurations",
                  "Comprehensive Flutter Student mobile app integration",
                  "Direct secure checkout gates powered by Razorpay",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary-50 border border-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-2.5 h-2.5 bg-primary-600 rounded-full" />
                    </div>
                    <span className="text-slate-700 font-semibold text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Roles card container */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl -z-10" />
              
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-8 text-white tracking-tight">Structured Platform Roles</h3>
              
              <div className="space-y-5">
                {[
                  { role: "Super Admin", desc: "Global administrative controls and statistics summaries" },
                  { role: "University Partner", desc: "Organize campus branches, configure affiliated colleges" },
                  { role: "College Administration", desc: "Oversee specific departments and coordinate placement officers" },
                  { role: "Training & Placement Officer (TPO)", desc: "Direct bridge coordinating company criteria with candidate listings" },
                  { role: "Company Recruiter", desc: "Publish requirements, generate AI evaluations, review proctor logs" },
                  { role: "Student Candidate", desc: "Construct profile histories, apply to active openings, clear examinations" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors duration-150">
                    <div className="w-10 h-10 bg-primary-600/30 text-primary-400 border border-primary-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiUsers className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-base">{item.role}</p>
                      <p className="text-slate-300 text-xs mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form & Details */}
      <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block text-primary-600 font-bold tracking-wider uppercase text-xs px-3 py-1 bg-primary-50 rounded-full mb-3">
              Reach Out
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 mb-4 tracking-tight">
              Get In Touch With Us
            </h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto font-medium">
              Have any questions or inquiry requests? Contact our helpdesk.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Contact Form */}
            <form onSubmit={handleContactSubmit} className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-indigo-900/5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3"
                    value={contactForm.contact}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, contact: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                  <input
                    type="text"
                    placeholder="Partnership Inquiry"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3"
                    value={contactForm.subject}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, subject: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Message</label>
                <textarea
                  placeholder="Tell us what you are looking for..."
                  rows="5"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 rounded-xl px-4 py-3"
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                Send Message
              </button>
            </form>

            {/* Contact details */}
            <div className="lg:col-span-5 space-y-8 lg:pl-6">
              {[
                { icon: <FiMail className="w-5 h-5" />, title: "Send an Email", value: "info@thespotcampus.com", desc: "Response within 24 hours" },
                { icon: <FiPhone className="w-5 h-5" />, title: "Call Support Line", value: "+91 98765 43210", desc: "Monday to Friday, 9am - 6pm" },
                { icon: <FiMapPin className="w-5 h-5" />, title: "Corporate Address", value: "Gujarat, India", desc: "Tech Creature Solutions Hub" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-white border border-slate-100 text-primary-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-900/5 flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg mb-1">{item.title}</p>
                    <p className="text-primary-600 font-extrabold text-base mb-1">{item.value}</p>
                    <p className="text-slate-500 text-xs font-semibold">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Separate Footer Component */}
      <Footer />
    </div>
  );
};

export default Landing;
