import React, { useEffect, useState, useRef } from "react";
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
  FiMail,
  FiPhone,
  FiMapPin,
  FiSearch,
  FiCheck,
  FiX,
  FiArrowRight,
  FiPlay,
  FiActivity,
  FiCheckCircle,
  FiVideo,
  FiTrendingUp,
  FiFileText,
  FiBookOpen,
} from "react-icons/fi";
import { FaGraduationCap, FaHandshake, FaChartLine } from "react-icons/fa";
import customFetch from "../../utils/customFetch";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileAppShowcase from "../components/MobileAppShowcase";
import SEO from "../components/SEO";

const Landing = () => {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    contact: "",
    subject: "",
    message: "",
  });
  const [studentPlans, setStudentPlans] = useState([]);
  const [studentPlansLoading, setStudentPlansLoading] = useState(true);

  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  useEffect(() => {
    fetchStudentPlans();
  }, []);

  // Smooth scroll to section if URL contains a hash (e.g. from routing redirect)
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 400);
    }
  }, []);

  const fetchStudentPlans = async () => {
    try {
      const { data } = await customFetch.get(
        "/recruitment-subscription/plans/active?plan_for=student",
      );
      setStudentPlans(data.plans || []);
    } catch {
      setStudentPlans([]);
    } finally {
      setStudentPlansLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] overflow-x-hidden selection:bg-[#3730a3] selection:text-white">
      <SEO 
        title="AI-Powered Placement & Proctored Exam Platform"
        description="The Spot Campus connects campus talent with top recruiters. Explore AI-driven recruitment, secure proctored exams, resume building, and placement coordination tools."
        keywords="The Spot Campus, campus placements, AI proctoring, online exam portal, recruitment platform, TPO portal, student jobs, online placement coordination"
        canonical="https://thespotcampus.com/"
      />
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes floatGlow {
          0% {
            transform: translateY(0px) scale(1);
            filter: drop-shadow(0 15px 30px rgba(55,48,163,0.15));
          }
          50% {
            transform: translateY(-20px) scale(1.02);
            filter: drop-shadow(0 30px 60px rgba(55,48,163,0.3));
          }
          100% {
            transform: translateY(0px) scale(1);
            filter: drop-shadow(0 15px 30px rgba(55,48,163,0.15));
          }
        }
        @keyframes subtlePulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-float-glow {
          animation: floatGlow 6s ease-in-out infinite;
        }
        .animate-pulse-subtle {
          animation: subtlePulse 8s ease-in-out infinite;
        }
        .animation-delay-100 { animation-delay: 150ms; }
        .animation-delay-200 { animation-delay: 300ms; }
        .animation-delay-300 { animation-delay: 450ms; }
      `}</style>

      {/* Premium Glassmorphic Navbar */}
      <Navbar />

      <main>
        {/* Hero Section */}
        <section id="home" className="relative pt-36 pb-14 overflow-hidden px-6 lg:px-16">
          {/* Soft Ambient Background Glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 blur-[100px] rounded-full pointer-events-none -z-10 animate-pulse-subtle" />
          <div className="absolute bottom-10 left-1/4 w-[450px] h-[450px] bg-indigo-400/10 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse-subtle animation-delay-200" />

          <div className="max-w-[1480px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="z-10 text-left">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel mb-8 border border-white/40 shadow-sm animate-fade-in-up">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="font-semibold text-xs tracking-wider text-[#3730a3] uppercase">
                  AI-Driven Placement & Proctoring Platform
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[50px] font-extrabold leading-tight tracking-tight mb-6 animate-fade-in-up animation-delay-100">
                The Hub of <br />
                <span className="text-gradient font-black">Academic</span> Excellence
              </h1>

              <p className="text-base sm:text-lg text-slate-600 mb-10 max-w-lg leading-relaxed animate-fade-in-up animation-delay-200">
                Connect campus talent with top recruiters through a unified platform built for students, companies, and placement officers.
              </p>

              <div className="flex flex-wrap gap-4 animate-fade-in-up animation-delay-300">
                <Link
                  to="/sign-in"
                  className="vibrant-btn text-white px-8 py-4 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 active:scale-95 transition-all duration-150"
                >
                  Get Started <FiArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#about"
                  className="glass-panel text-[#3730a3] border border-indigo-200/50 hover:bg-indigo-50/50 px-8 py-4 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 active:scale-95 transition-all duration-150"
                >
                  <FiPlay className="w-4 h-4 fill-current" /> Watch Demo
                </a>
              </div>
            </div>

            {/* Premium Right Side Illustration Container */}
            <div className="relative animate-float-glow">
              <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#39b8fd]/10 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-[#3730a3]/10 blur-[100px] rounded-full pointer-events-none"></div>

              <div className="relative glass-panel rounded-[2rem] overflow-hidden p-3 glow-soft group border border-white/60">
                <img
                  alt="Placement Dashboard View"
                  width={600}
                  height={400}
                  fetchpriority="high"
                  className="w-full h-auto rounded-[1.8rem] transition-transform duration-700 group-hover:scale-103 shadow-md object-cover max-h-[420px]"
                  src="/hero_section.webp"
                  onError={(e) => {
                    // Fallback offline display if image fails to load
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                {/* Premium Offline Fallback UI */}
                <div
                  className="hidden w-full h-[320px] bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[1.8rem] flex-col items-center justify-center p-8 text-center text-white"
                >
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 mb-4 animate-bounce">
                    <FiCpu className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">The Spot Placement System</h3>
                  <p className="text-slate-400 text-xs max-w-sm">
                    Proctored exams, AI evaluations, and recruiter dashboards — all in one platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Portals Access Section */}
        <section id="portals" className="py-14 px-6 lg:px-16 bg-[#f8f9ff] border-t border-b border-slate-100/50">
          <div className="max-w-[1480px] mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block text-[#3730a3] font-bold tracking-wider uppercase text-xs mb-3 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                Access Gateways
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Select Your Placement Role</h2>
              <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto mt-2">
                Sign up or log in to access your dedicated dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1380px] mx-auto">
              {/* Student Card */}
              <Link
                to="/sign-up-student"
                className="group glass-panel p-6 pb-8 rounded-2xl border border-white/50 text-left hover:border-indigo-400 hover:shadow-[0_20px_40px_rgba(55,48,163,0.1)] hover:-translate-y-2.5 hover:scale-[1.03] transition-all duration-300 flex flex-col justify-between min-h-[250px] bg-white/80"
              >
                <div>
                  <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 text-[#3730a3] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#3730a3] group-hover:text-white transition duration-300">
                    <FaGraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-[#3730a3] transition">
                    Student Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Build your profile, earn skill badges, and apply to placements.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#3730a3] flex items-center gap-1 mt-4">
                  Register Candidate <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              {/* Recruiter Card */}
              <Link
                to="/sign-up-company"
                className="group glass-panel p-6 pb-8 rounded-2xl border border-white/50 text-left hover:border-indigo-400 hover:shadow-[0_20px_40px_rgba(55,48,163,0.1)] hover:-translate-y-2.5 hover:scale-[1.03] transition-all duration-300 flex flex-col justify-between min-h-[250px] bg-white/80"
              >
                <div>
                  <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 text-[#3730a3] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#3730a3] group-hover:text-white transition duration-300">
                    <FiBriefcase className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-[#3730a3] transition">
                    Company Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Post jobs, set up proctored exams, and hire verified candidates.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#3730a3] flex items-center gap-1 mt-4">
                  Register Recruiter <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              {/* University Card */}
              <Link
                to="/sign-up-university"
                className="group glass-panel p-6 pb-8 rounded-2xl border border-white/50 text-left hover:border-indigo-400 hover:shadow-[0_20px_40px_rgba(55,48,163,0.1)] hover:-translate-y-2.5 hover:scale-[1.03] transition-all duration-300 flex flex-col justify-between min-h-[250px] bg-white/80"
              >
                <div>
                  <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 text-[#3730a3] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#3730a3] group-hover:text-white transition duration-300">
                    <FiUsers className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-[#3730a3] transition">
                    University Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Manage affiliated colleges, run large-scale drives, and track performance.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#3730a3] flex items-center gap-1 mt-4">
                  Register University <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              {/* College Card */}
              <Link
                to="/sign-up-college"
                className="group glass-panel p-6 pb-8 rounded-2xl border border-white/50 text-left hover:border-indigo-400 hover:shadow-[0_20px_40px_rgba(55,48,163,0.1)] hover:-translate-y-2.5 hover:scale-[1.03] transition-all duration-300 flex flex-col justify-between min-h-[250px] bg-white/80"
              >
                <div>
                  <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 text-[#3730a3] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#3730a3] group-hover:text-white transition duration-300">
                    <FiShield className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-[#3730a3] transition">
                    College Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Verify students, manage departments, and schedule placement activities.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#3730a3] flex items-center gap-1 mt-4">
                  Register College <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Student Plans */}
        <section id="plans" className="relative py-20 px-6 lg:px-16 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-100/50 overflow-hidden">
          {/* Soft Ambient Background Glows */}
          <div className="absolute top-1/4 left-1/10 w-72 h-72 bg-blue-300/10 blur-[100px] rounded-full pointer-events-none -z-10" />
          <div className="absolute bottom-1/4 right-1/10 w-80 h-80 bg-indigo-300/10 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="max-w-[1480px] mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block text-[#3730a3] font-bold tracking-wider uppercase text-xs mb-3 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                Student Plans
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Upgrade Your <span className="text-gradient font-black">Placement Journey</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto mt-4 leading-relaxed">
                Choose a plan that fits your needs and unlock premium features.
              </p>
            </div>

            {studentPlansLoading ? (
              <div className="text-center py-20 text-slate-400 font-semibold min-h-[480px] flex items-center justify-center">Loading plans...</div>
            ) : studentPlans.length === 0 ? (
              <div className="text-center py-12 text-slate-400 min-h-[480px] flex flex-col items-center justify-center">
                <p className="text-lg font-bold text-slate-700">No plans available right now.</p>
                <p className="text-xs text-slate-500 mt-1">Please check back later.</p>
              </div>
            ) : (
              (() => {
                // Find the index of the plan to feature (the highest priced, or middle one if exactly 3)
                let featuredIndex = 0;
                if (studentPlans.length > 1) {
                  if (studentPlans.length === 3) {
                    featuredIndex = 1; // Center plan for 3 plans
                  } else {
                    let maxPrice = -1;
                    studentPlans.forEach((plan, idx) => {
                      if (plan.price > maxPrice) {
                        maxPrice = plan.price;
                        featuredIndex = idx;
                      }
                    });
                  }
                }

                return (
                  <div className="flex flex-wrap justify-center gap-8 max-w-[1380px] mx-auto py-4">
                    {studentPlans.map((plan, index) => {
                      const isFeatured = index === featuredIndex;
                      return (
                        <div
                          key={plan._id}
                          className={`bg-white/90 backdrop-blur-md rounded-3xl p-8 flex flex-col relative transition-all duration-300 w-full sm:w-[440px] md:w-[470px] hover:-translate-y-3.5 hover:scale-[1.03] ${isFeatured
                            ? "border-2 border-[#3730a3] shadow-[0_20px_50px_rgba(55,48,163,0.12)] hover:shadow-[0_25px_60px_rgba(55,48,163,0.22)] scale-100 md:scale-105 z-10"
                            : "border border-slate-200/80 shadow-md hover:shadow-xl hover:border-indigo-300"
                            }`}
                        >
                          {isFeatured && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#3730a3] to-[#2563eb] text-white text-[10px] font-black tracking-widest uppercase py-1.5 px-4 rounded-full shadow-md z-10 border border-white/20 whitespace-nowrap">
                              Best Choice
                            </div>
                          )}

                          {/* Compact Header: Name, Price, Description, Validity */}
                          <div className="border-b border-slate-100 pb-5 mb-5">
                            <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{plan.plan_name}</h3>
                              <div className="text-right whitespace-nowrap flex-shrink-0 flex items-baseline gap-1 bg-slate-50 border border-slate-100/70 px-3 py-1.5 rounded-xl">
                                <span className="text-2xl font-black text-[#3730a3]">₹{plan.price}</span>
                                <span className="text-slate-500 text-xs font-bold">/{plan.validity_days} Days</span>
                              </div>
                            </div>
                            <p className="text-[12.5px] text-slate-500 mt-4 leading-relaxed min-h-[38px]">{plan.description}</p>
                          </div>

                          <div className="space-y-3.5 text-[13px] text-slate-650 flex-grow">
                            {/* Active Applications */}
                            <div className="flex items-center gap-3.5 py-1 px-1.5 rounded-xl hover:bg-slate-50/50 transition-all duration-150">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#3730a3] flex items-center justify-center flex-shrink-0 border border-indigo-100/50 shadow-xs">
                                <FiBriefcase className="w-4 h-4" />
                              </div>
                              <span className="font-semibold text-slate-700">
                                Up to <strong className="text-slate-900 font-extrabold">{plan.features?.max_rounds_per_job}</strong> active applications
                              </span>
                            </div>

                            {/* Video Interviews */}
                            <div className="flex items-center gap-3.5 py-1 px-1.5 rounded-xl hover:bg-slate-50/50 transition-all duration-150">
                              {plan.features?.video_interview_enabled ? (
                                <>
                                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-100/50 shadow-xs">
                                    <FiVideo className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold text-slate-700">Video interview prep & room access</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center flex-shrink-0 border border-slate-200/50">
                                    <FiVideo className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold text-slate-400 line-through">Video interview prep & room access</span>
                                </>
                              )}
                            </div>

                            {/* Interviews Per Month */}
                            <div className="flex items-center gap-3.5 py-1 px-1.5 rounded-xl hover:bg-slate-50/50 transition-all duration-150">
                              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100/50 shadow-xs">
                                <FiActivity className="w-4 h-4" />
                              </div>
                              <span className="font-semibold text-slate-700">
                                Max <strong className="text-slate-900 font-extrabold">{plan.features?.max_interviews_per_month}</strong> interviews/month
                              </span>
                            </div>

                            {/* Advanced Analytics */}
                            <div className="flex items-center gap-3.5 py-1 px-1.5 rounded-xl hover:bg-slate-50/50 transition-all duration-150">
                              {plan.features?.advanced_analytics ? (
                                <>
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100/50 shadow-xs">
                                    <FiTrendingUp className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold text-slate-700">Profile performance insights</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center flex-shrink-0 border border-slate-200/50">
                                    <FiTrendingUp className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold text-slate-400 line-through">Profile performance insights</span>
                                </>
                              )}
                            </div>

                            {/* Support */}
                            <div className="flex items-center gap-3.5 py-1 px-1.5 rounded-xl hover:bg-slate-50/50 transition-all duration-150">
                              {plan.features?.priority_support ? (
                                <>
                                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0 border border-violet-100/50 shadow-xs">
                                    <FiShield className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold text-slate-700">Priority placement support</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center flex-shrink-0 border border-slate-200/50">
                                    <FiShield className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold text-slate-400 line-through">Priority placement support</span>
                                </>
                              )}
                            </div>

                            {/* CV Builder */}
                            <div className="flex items-center gap-3.5 py-1 px-1.5 rounded-xl hover:bg-slate-50/50 transition-all duration-150">
                              {plan.features?.cv_builder_enabled ? (
                                <>
                                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 border border-teal-100/50 shadow-xs">
                                    <FiFileText className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold text-slate-700">Professional CV Builder & Templates</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center flex-shrink-0 border border-slate-200/50">
                                    <FiFileText className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold text-slate-400 line-through">Professional CV Builder & Templates</span>
                                </>
                              )}
                            </div>

                            {/* Exam Prep Hub */}
                            <div className="flex items-center gap-3.5 py-1 px-1.5 rounded-xl hover:bg-slate-50/50 transition-all duration-150">
                              {plan.features?.exam_preparation_enabled ? (
                                <>
                                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100/50 shadow-xs">
                                    <FiBookOpen className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold text-slate-700">MCQ & Mock Exam Prep Hub</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center flex-shrink-0 border border-slate-200/50">
                                    <FiBookOpen className="w-4 h-4" />
                                  </div>
                                  <span className="font-semibold text-slate-400 line-through">MCQ & Mock Exam Prep Hub</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="mt-8 pt-4 border-t border-slate-100">
                            <Link
                              to="/sign-in"
                              className={`w-full font-extrabold py-4 px-6 rounded-xl transition duration-200 text-sm flex items-center justify-center gap-1.5 active:scale-98 ${isFeatured
                                ? "vibrant-btn text-white shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 hover:scale-[1.02]"
                                : "bg-[#f8f9ff] text-[#3730a3] hover:bg-indigo-50 border border-indigo-100 hover:scale-[1.02]"
                                }`}
                            >
                              Get Started <FiArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </section>

        {/* Success Stats with CountUp */}
        <section id="stats" ref={statsRef} className="py-8 bg-white px-6 lg:px-16">
          <div className="max-w-[1480px] mx-auto">
            <div className="bg-[#0b1c30] border border-slate-800 rounded-3xl p-8 md:p-14 shadow-2xl shadow-indigo-950/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                {[
                  { label: "Global Recruiters", value: 500, border: "md:border-r border-slate-800/80", suffix: "+" },
                  { label: "Active Students", value: 50000, border: "md:border-r border-slate-800/80", suffix: "+" },
                  { label: "Placement Rate", value: 85, border: "md:border-r border-slate-800/80", suffix: "%" },
                  { label: "Partner TPOs", value: 200, border: "last:border-0", suffix: "+" },
                ].map((stat, idx) => (
                  <div key={idx} className={`text-center ${stat.border} px-2`}>
                    <div className="text-3xl sm:text-5xl font-black text-white mb-2">
                      {statsInView ? (
                        <CountUp end={stat.value} duration={2.5} suffix={stat.suffix} separator="," />
                      ) : (
                        "0"
                      )}
                    </div>
                    <div className="text-slate-400 text-xs sm:text-sm font-semibold tracking-wide uppercase">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Stakeholders Section */}
        <section id="features" className="py-14 bg-slate-50/70 border-t border-b border-slate-100/50 px-6 lg:px-16">
          <div className="max-w-[1480px] mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block text-[#3730a3] font-bold tracking-wider uppercase text-xs mb-3 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                Capabilities
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Tailored for Every Stakeholder</h2>
              <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto mt-2">
                Purpose-built tools for students, placement officers, and recruiters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-auto md:auto-rows-[280px]">
              {/* Students Card - md:col-span-8 */}
              <div className="md:col-span-8 bg-gradient-to-br from-white to-[#eff6ff] p-8 rounded-3xl relative overflow-hidden group shadow-sm border border-blue-100/50">
                <div className="relative z-10 h-full flex flex-col justify-between md:pr-[310px]">
                  <div>
                    <div className="w-12 h-12 bg-indigo-50 text-[#3730a3] rounded-xl flex items-center justify-center mb-4">
                      <FaGraduationCap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-slate-900">For Candidates</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Create verified profiles, apply to placements, and take secure proctored exams.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs">
                      Smart CV
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs">
                      Verified Badges
                    </span>
                  </div>
                </div>

                {/* High-Fidelity Mock Student Profile Dashboard Widget */}
                <div className="absolute top-6 right-6 w-72 h-[228px] bg-white border border-slate-100 rounded-2xl p-5 shadow-lg hidden md:flex flex-col justify-between text-xs z-0 hover:scale-102 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Verified Candidate</span>
                    <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full scale-90 border border-emerald-100">Active</span>
                  </div>
                  <div className="space-y-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Name</span>
                      <span className="font-bold text-slate-800">Rohit Sharma</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Integrity Score</span>
                      <span className="font-bold text-[#3730a3]">98% (Excellent)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assessed Skill</span>
                      <span className="font-bold text-slate-800">React, Node.js, Python</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400">
                    <span>Last Active: 2 mins ago</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  </div>
                </div>
              </div>

              {/* Recruiters Card - md:col-span-4 (Indigo bg) */}
              <div className="md:col-span-4 bg-gradient-to-br from-[#0b1c30] to-[#1e3a8a] p-8 rounded-3xl glow-soft text-white flex flex-col justify-between group border border-[#1e3a8a]/20">
                <div>
                  <div className="w-12 h-12 bg-white/20 text-white rounded-xl flex items-center justify-center mb-4 border border-white/20">
                    <FiBriefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">For Recruiters</h3>
                  <p className="text-indigo-100 text-sm leading-relaxed">
                    Auto-generate exam papers from JDs, conduct proctored tests, and rate candidates in real time.
                  </p>
                </div>
                <Link
                  to="/sign-up-company"
                  className="w-full py-3 bg-white text-[#0b1c30] text-center font-bold text-sm rounded-xl active:scale-95 transition-all mt-4"
                >
                  Start Hiring
                </Link>
              </div>

              {/* TPO Card - md:col-span-4 */}
              <div className="md:col-span-4 bg-gradient-to-br from-white to-[#eff6ff] p-6 rounded-3xl group border border-blue-100/50 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 border border-blue-100">
                    <FiActivity className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900">For Training Officers</h3>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-3">
                    Organize drives, invite companies, monitor exams, and generate reports.
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-slate-500 mt-1.5 font-semibold">
                    <li className="flex items-center gap-1.5"><FiCheck className="text-emerald-500 w-3.5 h-3.5" /> Organize Placement Drives</li>
                    <li className="flex items-center gap-1.5"><FiCheck className="text-emerald-500 w-3.5 h-3.5" /> Monitor Tab-Locks Live</li>
                  </ul>
                </div>
                <Link
                  to="/sign-up-college"
                  className="mt-3 border-t border-slate-100 pt-3 flex items-center justify-between text-[#3730a3] hover:text-[#0ea5e9] font-bold text-xs sm:text-sm transition"
                >
                  <span>TPO Setup</span>
                  <FiArrowRight className="group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </div>

              {/* Interactive Analytics SVG Chart Card - md:col-span-8 */}
              <div className="md:col-span-8 bg-gradient-to-br from-white to-[#eff6ff] rounded-3xl relative overflow-hidden shadow-sm border border-blue-100/50 p-8">
                <div className="flex flex-col sm:flex-row items-center gap-8 h-full">
                  <div className="flex-1 text-left">
                    <h3 className="text-xl font-bold mb-2 text-slate-900">Placement Trends</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-4">
                      Track placement trends, active openings, and recruitment progress at a glance.
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                      <span className="text-xs text-slate-500 font-semibold">Active Offers</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400 ml-4"></span>
                      <span className="text-xs text-slate-500 font-semibold">Applications</span>
                    </div>
                  </div>
                  {/* Premium SaaS styled card wrapper for the SVG */}
                  <div className="w-full sm:w-72 h-44 flex-shrink-0 bg-white border border-slate-100 rounded-2xl p-4 shadow-lg relative hover:scale-102 transition-all duration-300">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                      <span className="text-[10px] text-slate-600 font-extrabold uppercase tracking-wider">Live Analytics</span>
                      <span className="text-[10px] text-[#3730a3] font-bold flex items-center gap-1">Vitals <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span></span>
                    </div>
                    <svg className="w-full h-24" viewBox="0 0 100 50">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3730a3" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#3730a3" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="10" x2="100" y2="10" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
                      <line x1="0" y1="25" x2="100" y2="25" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
                      <line x1="0" y1="40" x2="100" y2="40" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
                      <path d="M 0 45 Q 20 20 40 30 T 80 15 T 100 5 L 100 50 L 0 50 Z" fill="url(#chartGrad)" />
                      <path d="M 0 45 Q 20 20 40 30 T 80 15 T 100 5" fill="none" stroke="#3730a3" strokeWidth="2" strokeLinecap="round" />
                      <path d="M 0 48 Q 25 35 50 42 T 80 25 T 100 12" fill="none" stroke="#39b8fd" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1.5" />
                      <circle cx="40" cy="30" r="2" fill="#3730a3" stroke="#fff" strokeWidth="0.8" />
                      <circle cx="80" cy="15" r="2" fill="#3730a3" stroke="#fff" strokeWidth="0.8" />
                    </svg>
                    <span className="absolute bottom-2 right-4 text-[9px] text-slate-600 font-extrabold uppercase tracking-wider">Placement drive 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile App Download Section */}
        <MobileAppShowcase />

        {/* Recruitment process map */}
        <section id="about" className="py-14 px-6 lg:px-16 relative">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-20">
              <div className="inline-block text-[#3730a3] font-bold tracking-wider uppercase text-xs mb-3 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                Process
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Streamlined Placement Flow</h2>
              <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto mt-2">
                From registration to final offer — four simple steps to get placed.
              </p>
            </div>

            <div className="relative">
              {/* Center Timeline line indicator */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-indigo-100 -translate-x-1/2"></div>

              <div className="space-y-16 md:space-y-24">
                {/* Step 1: Onboarding & Verification */}
                <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 text-left group">
                  {/* Text (Left on Desktop, Right on Mobile) */}
                  <div className="w-full md:w-1/2 md:text-right order-3 md:order-1 pl-16 md:pl-0">
                    <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-1.5 sm:mb-2 group-hover:text-[#3730a3] transition-colors duration-200">
                      1. Academic Onboarding
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                      Colleges set up branches and departments. Students create verified profiles via web or mobile app.
                    </p>
                  </div>

                  {/* Circle Number (Absolute on Mobile, Centered on Desktop) */}
                  <div className="absolute left-3.5 md:relative md:left-0 z-10 w-9 h-9 md:w-14 md:h-14 rounded-full bg-[#3730a3] text-white flex items-center justify-center font-bold text-sm md:text-lg border-4 border-[#f8f9ff] shadow-md order-1 md:order-2 flex-shrink-0 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-300">
                    1
                  </div>

                  {/* Icon Card (Right on Desktop, Below Text on Mobile) */}
                  <div className="w-full md:w-1/2 order-4 md:order-3 pl-16 md:pl-0 flex justify-start">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-md shadow-slate-100/50 group-hover:scale-105 group-hover:border-indigo-100 transition-all duration-300">
                      <FiShield className="w-6 h-6 md:w-8 md:h-8 text-[#3730a3]" />
                    </div>
                  </div>
                </div>

                {/* Step 2: AI JD Exam Creation */}
                <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 text-left group">
                  {/* Icon Card (Left on Desktop, Below Text on Mobile) */}
                  <div className="w-full md:w-1/2 order-4 md:order-1 pl-16 md:pl-0 flex justify-start md:justify-end">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-md shadow-slate-100/50 group-hover:scale-105 group-hover:border-blue-100 transition-all duration-300">
                      <FiCpu className="w-6 h-6 md:w-8 md:h-8 text-[#2563eb]" />
                    </div>
                  </div>

                  {/* Circle Number (Absolute on Mobile, Centered on Desktop) */}
                  <div className="absolute left-3.5 md:relative md:left-0 z-10 w-9 h-9 md:w-14 md:h-14 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm md:text-lg border-4 border-[#f8f9ff] shadow-md order-1 md:order-2 flex-shrink-0 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
                    2
                  </div>

                  {/* Text (Right on Desktop, Right on Mobile) */}
                  <div className="w-full md:w-1/2 order-3 md:order-3 pl-16 md:pl-0">
                    <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-1.5 sm:mb-2 group-hover:text-[#2563eb] transition-colors duration-200">
                      2. AI JD-to-Exam Generation
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                      Recruiters post JDs, and our AI instantly generates skill-matched exam papers. TPOs approve and schedule the drive.
                    </p>
                  </div>
                </div>

                {/* Step 3: Proctored Assessments */}
                <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 text-left group">
                  {/* Text (Left on Desktop, Right on Mobile) */}
                  <div className="w-full md:w-1/2 md:text-right order-3 md:order-1 pl-16 md:pl-0">
                    <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-1.5 sm:mb-2 group-hover:text-[#3730a3] transition-colors duration-200">
                      3. Proctored Exam Sitting
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                      Students take secure exams with tab-lock, copy-paste prevention, and AI-powered webcam monitoring.
                    </p>
                  </div>

                  {/* Circle Number (Absolute on Mobile, Centered on Desktop) */}
                  <div className="absolute left-3.5 md:relative md:left-0 z-10 w-9 h-9 md:w-14 md:h-14 rounded-full bg-[#3730a3] text-white flex items-center justify-center font-bold text-sm md:text-lg border-4 border-[#f8f9ff] shadow-md order-1 md:order-2 flex-shrink-0 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-300">
                    3
                  </div>

                  {/* Icon Card (Right on Desktop, Below Text on Mobile) */}
                  <div className="w-full md:w-1/2 order-4 md:order-3 pl-16 md:pl-0 flex justify-start">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-md shadow-slate-100/50 group-hover:scale-105 group-hover:border-indigo-100 transition-all duration-300">
                      <FiCamera className="w-6 h-6 md:w-8 md:h-8 text-[#3730a3]" />
                    </div>
                  </div>
                </div>

                {/* Step 4: Integrity Review & Selection */}
                <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 text-left group">
                  {/* Icon Card (Left on Desktop, Below Text on Mobile) */}
                  <div className="w-full md:w-1/2 order-4 md:order-1 pl-16 md:pl-0 flex justify-start md:justify-end">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-md shadow-slate-100/50 group-hover:scale-105 group-hover:border-blue-100 transition-all duration-300">
                      <FaHandshake className="w-6 h-6 md:w-8 md:h-8 text-[#2563eb]" />
                    </div>
                  </div>

                  {/* Circle Number (Absolute on Mobile, Centered on Desktop) */}
                  <div className="absolute left-3.5 md:relative md:left-0 z-10 w-9 h-9 md:w-14 md:h-14 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm md:text-lg border-4 border-[#f8f9ff] shadow-md order-1 md:order-2 flex-shrink-0 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
                    4
                  </div>

                  {/* Text (Right on Desktop, Right on Mobile) */}
                  <div className="w-full md:w-1/2 order-3 md:order-3 pl-16 md:pl-0">
                    <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-1.5 sm:mb-2 group-hover:text-[#2563eb] transition-colors duration-200">
                      4. Integrity Selection & Offer
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                      Review proctor logs and trust scores. Top candidates receive verified offers directly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-14 bg-slate-50/70 border-t border-slate-100/50 px-6 lg:px-16">
          <div className="max-w-[1480px] mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block text-[#3730a3] font-bold tracking-wider uppercase text-xs mb-3 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                Contact Desk
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Have Any Inquiry?</h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mt-2">
                Reach out and our team will get back to you shortly.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-[1380px] mx-auto items-start">
              {/* Contact Form */}
              <form
                onSubmit={handleContactSubmit}
                className="lg:col-span-7 bg-white/90 glass-panel p-8 rounded-3xl border border-white shadow-xl shadow-indigo-950/5 space-y-6 text-left"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Name</label>
                    <input
                      type="text"
                      placeholder="Enter name"
                      className="w-full px-4 py-3 bg-[#f8f9ff] border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Email Address</label>
                    <input
                      type="email"
                      placeholder="name@university.edu"
                      className="w-full px-4 py-3 bg-[#f8f9ff] border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Phone</label>
                    <input
                      type="tel"
                      placeholder="Contact number"
                      className="w-full px-4 py-3 bg-[#f8f9ff] border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200"
                      value={contactForm.contact}
                      onChange={(e) => setContactForm({ ...contactForm, contact: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Subject</label>
                    <input
                      type="text"
                      placeholder="Academic Partnership"
                      className="w-full px-4 py-3 bg-[#f8f9ff] border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Your Message</label>
                  <textarea
                    placeholder="Outline your requirements..."
                    rows="4"
                    className="w-full px-4 py-3 bg-[#f8f9ff] border border-slate-200 focus:border-[#3730a3] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 resize-none"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full vibrant-btn text-white font-bold py-4 rounded-xl active:scale-95 transition-all text-sm tracking-wide uppercase"
                >
                  Send Message
                </button>
              </form>

              {/* Side Information */}
              <div className="lg:col-span-5 space-y-6 text-left lg:pl-6">
                {[
                  { icon: <FiMail className="w-5 h-5 text-indigo-600" />, title: "Contact Email", val: "info@thespotcampus.com", desc: "For university affiliations" },
                  { icon: <FiPhone className="w-5 h-5 text-blue-500" />, title: "Support Hotline", val: "+91 98765 43210", desc: "Monday - Friday, 9:00 AM - 6:00 PM" },
                  { icon: <FiMapPin className="w-5 h-5 text-indigo-600" />, title: "Corporate Hub", val: "Gujarat, India", desc: "Tech Creature Solutions Hub" },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-5 items-start p-4 bg-white/70 rounded-2xl border border-white/50 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50/50 flex items-center justify-center border border-indigo-100/50 flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm mb-0.5">{item.title}</h3>
                      <p className="text-[#3730a3] font-bold text-sm mb-0.5">{item.val}</p>
                      <p className="text-slate-600 font-semibold text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Drive Section */}
        <section className="py-14 px-6 lg:px-16 bg-gradient-to-r from-[#0b1c30] to-[#1e3a8a] relative overflow-hidden text-center text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 blur-[100px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3" />

          <div className="max-w-4xl mx-auto relative z-10">
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-4">
              Ready to Transform Your Placement Drive?
            </h2>
            <p className="text-indigo-100 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
              Hundreds of institutes and thousands of students already trust The Spot Campus.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/sign-in"
                className="bg-white text-[#0b1c30] px-8 py-3.5 rounded-xl font-bold text-sm hover:shadow-xl active:scale-95 transition-all duration-150"
              >
                Get Started Free
              </Link>
              <a
                href="#contact"
                className="border border-white/40 hover:bg-white/10 text-white px-8 py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-all duration-150"
              >
                Request Enterprise Demo
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Dynamic Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
