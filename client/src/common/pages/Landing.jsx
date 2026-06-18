import React, { useEffect, useState } from "react";
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
} from "react-icons/fi";
import { FaGraduationCap, FaHandshake, FaChartLine } from "react-icons/fa";
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
  const [studentPlans, setStudentPlans] = useState([]);
  const [studentPlansLoading, setStudentPlansLoading] = useState(true);

  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  useEffect(() => {
    fetchStudentPlans();
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
      {/* Premium Glassmorphic Navbar */}
      <Navbar />

      <main>
        {/* Hero Section */}
        <section id="home" className="relative pt-24 pb-14 overflow-hidden px-6 lg:px-16">
          {/* Soft Ambient Background Glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 blur-[100px] rounded-full pointer-events-none -z-10" />
          <div className="absolute bottom-10 left-1/4 w-[450px] h-[450px] bg-indigo-400/10 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="z-10 text-left">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel mb-8 border border-white/40 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="font-semibold text-xs tracking-wider text-[#3730a3] uppercase">
                  AI-Driven Placement & Proctoring Platform
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-extrabold leading-tight tracking-tight mb-6">
                The Hub of <br />
                <span className="text-gradient font-black">Academic</span> Excellence
              </h1>

              <p className="text-base sm:text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
                Bridge the gap between campus talent and industry leaders with a glass-precise cloud ecosystem designed for students, recruiters, and placement officers.
              </p>

              <div className="flex flex-wrap gap-4">
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
            <div className="relative">
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
                    Proctored exams, automated AI evaluations, and centralized recruiter dashboards in one high-integrity cloud application.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Portals Access Section */}
        <section id="portals" className="py-14 px-6 lg:px-16 bg-[#f8f9ff] border-t border-b border-slate-100/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block text-[#3730a3] font-bold tracking-wider uppercase text-xs mb-3 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                Access Gateways
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Select Your Placement Role</h2>
              <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto mt-2">
                Log in or register under your specific category to access tailored placement control boards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {/* Student Card */}
              <Link
                to="/sign-up-student"
                className="group glass-panel p-6 pb-8 rounded-2xl border border-white/50 text-left hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[250px] bg-white/80"
              >
                <div>
                  <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 text-[#3730a3] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#3730a3] group-hover:text-white transition duration-300">
                    <FaGraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-[#3730a3] transition">
                    Student Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Create your profile, compile skill badges, and apply directly to campus placements.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#3730a3] flex items-center gap-1 mt-4">
                  Register Candidate <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              {/* Recruiter Card */}
              <Link
                to="/sign-up-company"
                className="group glass-panel p-6 pb-8 rounded-2xl border border-white/50 text-left hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[250px] bg-white/80"
              >
                <div>
                  <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 text-[#3730a3] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#3730a3] group-hover:text-white transition duration-300">
                    <FiBriefcase className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-[#3730a3] transition">
                    Company Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Publish openings, configure anti-cheat proctored exams, and recruit validated candidates.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#3730a3] flex items-center gap-1 mt-4">
                  Register Recruiter <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              {/* University Card */}
              <Link
                to="/sign-up-university"
                className="group glass-panel p-6 pb-8 rounded-2xl border border-white/50 text-left hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[250px] bg-white/80"
              >
                <div>
                  <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 text-[#3730a3] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#3730a3] group-hover:text-white transition duration-300">
                    <FiUsers className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-[#3730a3] transition">
                    University Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Configure affiliated colleges, orchestrate mega placements, and review institutional metrics.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#3730a3] flex items-center gap-1 mt-4">
                  Register University <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              {/* College Card */}
              <Link
                to="/sign-up-college"
                className="group glass-panel p-6 pb-8 rounded-2xl border border-white/50 text-left hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[250px] bg-white/80"
              >
                <div>
                  <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 text-[#3730a3] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#3730a3] group-hover:text-white transition duration-300">
                    <FiShield className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-[#3730a3] transition">
                    College Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Verify branch students, verify profiles, and manage local department schedules.
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

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block text-[#3730a3] font-bold tracking-wider uppercase text-xs mb-3 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                Student Plans
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Upgrade Your <span className="text-gradient font-black">Placement Journey</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto mt-4 leading-relaxed">
                Choose a plan to unlock premium placement opportunities and more visibility in the portal.
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
                  <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto py-4">
                    {studentPlans.map((plan, index) => {
                      const isFeatured = index === featuredIndex;
                      return (
                        <div
                          key={plan._id}
                          className={`bg-white/90 backdrop-blur-md rounded-3xl p-8 flex flex-col relative transition-all duration-300 w-full sm:w-[360px] md:w-[380px] hover:-translate-y-1.5 ${isFeatured
                            ? "border-2 border-[#3730a3] shadow-[0_20px_50px_rgba(55,48,163,0.12)] scale-100 md:scale-105 z-10"
                            : "border border-slate-200/80 shadow-md hover:shadow-lg hover:border-slate-300"
                            }`}
                        >
                          {isFeatured && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#3730a3] to-[#2563eb] text-white text-[10px] font-black tracking-widest uppercase py-1.5 px-4 rounded-full shadow-md z-10 border border-white/20 whitespace-nowrap">
                              Best Choice
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">{plan.plan_name}</h3>
                              <p className="text-xs text-slate-500 mt-2 min-h-[36px] leading-relaxed">{plan.description}</p>
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-[#3730a3] border border-indigo-100/50 whitespace-nowrap flex-shrink-0">
                              {plan.validity_days} Days
                            </span>
                          </div>

                          <div className="mt-6 bg-[#f8f9ff]/80 border border-slate-100/80 rounded-2xl p-5 flex flex-col gap-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-black text-slate-900 tracking-tight">₹{plan.price}</span>
                              <span className="text-slate-400 text-xs font-bold">/ plan</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold">Includes all portal access & verified badges</span>
                          </div>

                          <div className="mt-6 space-y-4 text-xs text-slate-600 border-t border-slate-100 pt-6 flex-grow">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                                <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                              <span className="font-medium text-slate-700">Up to <strong className="text-slate-900 font-bold">{plan.features?.max_rounds_per_job}</strong> rounds per job</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {plan.features?.video_interview_enabled ? (
                                <>
                                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                                    <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                  <span className="font-medium text-slate-700">Premium video interviews included</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-5 h-5 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center flex-shrink-0 border border-slate-200">
                                    <FiX className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-medium text-slate-400 line-through">Video interviews</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                                <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                              <span className="font-medium text-slate-700"><strong className="text-slate-900 font-bold">{plan.features?.max_interviews_per_month}</strong> interviews per month</span>
                            </div>
                          </div>

                          <div className="mt-8 pt-4 border-t border-slate-100">
                            <Link
                              to="/sign-in"
                              className={`w-full font-bold py-3.5 px-6 rounded-xl transition duration-200 text-xs flex items-center justify-center gap-1.5 active:scale-98 ${isFeatured
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
          <div className="max-w-7xl mx-auto">
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
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block text-[#3730a3] font-bold tracking-wider uppercase text-xs mb-3 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                Capabilities
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Tailored for Every Stakeholder</h2>
              <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto mt-2">
                Our cloud suite provides modular structures dedicated to ensuring placement success for candidates, officers, and companies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[280px]">
              {/* Students Card - md:col-span-8 */}
              <div className="md:col-span-8 bg-gradient-to-br from-white to-[#eff6ff] p-8 rounded-3xl relative overflow-hidden group shadow-sm border border-blue-100/50">
                <div className="relative z-10 h-full flex flex-col justify-between md:pr-[310px]">
                  <div>
                    <div className="w-12 h-12 bg-indigo-50 text-[#3730a3] rounded-xl flex items-center justify-center mb-4">
                      <FaGraduationCap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-slate-900">For Candidates</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Build dynamic profiles, highlight verified badges, apply to premium placements, and undertake anti-cheat exams directly in a secure student portal.
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
                    Automate screening with AI question papers generated instantly from JDs, proctored exams, and real-time candidate rating.
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
                    Coordinate placement drives, invite companies, monitor live proctored exams, and generate performance sheets.
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
                      Monitor live recruitment graphs and analytical tracking matrices indicating historical placement ratios and active openings.
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
        </section>      {/* Mobile App Download Section */}
        <section id="mobile-app" className="relative py-24 px-6 lg:px-16 overflow-hidden bg-gradient-to-b from-[#f8f9ff] via-white to-[#f8f9ff] text-slate-900 border-t border-b border-slate-100/50">
          {/* Modern Tech Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Glowing Background Radial Effects */}
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-200/20 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
            {/* Mockup Container (Left Column on Desktop) */}            <div className="lg:col-span-5 flex justify-center order-2 lg:order-1 relative py-8">
              {/* Ambient Background Glow behind the mockup */}
              <div className="absolute inset-0 w-80 h-[500px] bg-indigo-600/10 blur-[85px] rounded-full mx-auto my-auto pointer-events-none" />

              {/* Phone Mockup Frame */}
              <div className="w-[285px] h-[570px] bg-slate-955 border-[10px] border-slate-900 rounded-[2.8rem] shadow-[0_30px_70px_-15px_rgba(99,102,241,0.2),0_0_40px_rgba(55,48,163,0.06)] relative overflow-hidden flex flex-col justify-between p-3.5 ring-4 ring-slate-100/50 hover:border-slate-800 transition-colors duration-500">
                {/* Dynamic Island / Notch */}
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-slate-950 rounded-full z-30 flex items-center justify-between px-3">
                  <span className="w-1 h-1 rounded-full bg-slate-900"></span>
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-950/60 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  </div>
                </div>

                {/* App Mockup UI */}
                <div className="w-full h-full bg-gradient-to-b from-[#fcfdff] to-[#f4f6ff] rounded-[2.1rem] overflow-hidden flex flex-col justify-between text-slate-800 relative p-4 pt-10 border border-slate-200/50">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center text-[8.5px] text-slate-405 px-1.5 font-bold">
                    <span>9:41 AM</span>
                    <div className="flex items-center gap-1.5">
                      {/* Custom Wifi SVG Outline */}
                      <svg className="w-3.5 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                        <line x1="12" y1="20" x2="12.01" y2="20" />
                      </svg>
                      <span className="font-extrabold leading-none">5G</span>
                      {/* Custom Battery SVG Outline */}
                      <svg className="w-4.5 h-2.5 text-slate-400" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="1" width="18" height="10" rx="2.5" />
                        <line x1="23" y1="4" x2="23" y2="8" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* App Header */}
                  <div className="flex justify-between items-center mt-3 bg-white border border-slate-100 rounded-2xl p-2.5 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#3730a3] to-[#2563eb] flex items-center justify-center border border-white/20">
                        <FiSmartphone className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-[11px] tracking-tight block text-slate-850">SpotCampus</span>
                        <span className="text-[7px] text-slate-400 font-extrabold block uppercase tracking-widest leading-none mt-0.5">Candidate UI</span>
                      </div>
                    </div>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>

                  {/* Active Exam Card */}
                  <div className="bg-white border-l-4 border-[#3730a3] border-t border-r border-b border-slate-100 rounded-2xl p-4 shadow-xs my-auto text-left relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 blur-xl rounded-full" />

                    <div className="flex justify-between items-center relative z-10">
                      <span className="font-extrabold text-[8px] text-indigo-700 uppercase tracking-wider block">Upcoming Round</span>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 font-extrabold text-[7px] px-2 py-0.5 rounded-full uppercase tracking-wider scale-90">Live Exam</span>
                    </div>

                    <div className="relative z-10 mt-1">
                      <div className="font-black text-xs text-slate-800 leading-snug">React & Node.js Developer</div>
                      <p className="text-[9px] text-slate-700 font-bold mt-0.5">Google Recruitment Drive</p>
                    </div>

                    <div className="flex justify-between items-center text-[8.5px] text-slate-600 pt-2.5 border-t border-slate-100 font-bold relative z-10 mt-1">
                      <span className="flex items-center gap-1"><FiCamera className="text-indigo-600 w-3 h-3" /> Web Cam Enabled</span>
                      <span className="font-black text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded">Duration: 60m</span>
                    </div>
                  </div>

                  {/* Secure Proctor Widget */}
                  <div className="bg-rose-50/70 border border-rose-100/60 rounded-2xl p-3 flex items-start gap-2.5 text-left mb-2">
                    <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600 shrink-0">
                      <FiLock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-black text-[9.5px] text-rose-700">AI Integrity Shield</div>
                      <p className="text-[8px] text-rose-600 font-semibold leading-normal mt-0.5">Secure dual-camera proctoring and browser tab lock active.</p>
                    </div>
                  </div>

                  {/* Mock Phone App Bottom Bar */}
                  <div className="flex justify-around items-center border-t border-slate-150 pt-2.5 text-slate-400 text-[10px] bg-white/60 backdrop-blur-md -mx-4 -mb-4 p-4 rounded-b-[2.1rem]">
                    <div className="flex flex-col items-center gap-0.5 text-indigo-700 cursor-pointer">
                      <FiSmartphone className="w-4 h-4" />
                      <span className="text-[6.5px] font-black uppercase tracking-widest">Home</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 hover:text-slate-800 transition cursor-pointer">
                      <FiBriefcase className="w-4 h-4" />
                      <span className="text-[6.5px] font-black uppercase tracking-widest">Drives</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 hover:text-slate-800 transition cursor-pointer">
                      <FiUsers className="w-4 h-4" />
                      <span className="text-[6.5px] font-black uppercase tracking-widest">Profile</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Container */}
            <div className="lg:col-span-7 text-left order-1 lg:order-2 space-y-7 lg:pl-10">
              {/* Flutter Feature Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-indigo-50/80 border border-indigo-100/60 shadow-xs backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                </span>
                <span className="font-extrabold text-[10px] tracking-wider text-indigo-755 uppercase">
                  Flutter Mobile App Available
                </span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-slate-900">
                Placement Portability <br />
                <span className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 bg-clip-text text-transparent font-black">In Your Hand</span>
              </h2>

              <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl font-semibold">
                Unlock placement success on the go. Attend secure proctored exams, maintain your placement profile, and get real-time job shortlist alerts directly on your smartphone.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                {/* Feature 1 */}
                <div className="p-6 bg-white border border-slate-150 rounded-3xl hover:border-indigo-300 hover:shadow-[0_20px_40px_rgba(99,102,241,0.06)] transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 rounded-full blur-xl pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-550 text-white flex items-center justify-center shadow-lg shadow-indigo-150 shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <FiCamera className="w-5.5 h-5.5" />
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                      AI Proctor
                    </span>
                  </div>
                  <div className="mt-5 space-y-2 text-left">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Mobile AI Proctoring</h3>
                    <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                      Take secure exams directly from your mobile device.
                    </p>
                    <ul className="space-y-1.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 font-bold">
                      <li className="flex items-center gap-1.5"><FiCheck className="text-emerald-500 w-4 h-4 stroke-[3]" /> Live tab-locking protection</li>
                      <li className="flex items-center gap-1.5"><FiCheck className="text-emerald-500 w-4 h-4 stroke-[3]" /> Secure camera feed tracking</li>
                    </ul>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="p-6 bg-white border border-slate-150 rounded-3xl hover:border-blue-300 hover:shadow-[0_20px_40px_rgba(37,99,235,0.06)] transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/30 rounded-full blur-xl pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-550 text-white flex items-center justify-center shadow-lg shadow-blue-150 shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <FiSmartphone className="w-5.5 h-5.5" />
                    </div>
                    <span className="bg-blue-50 text-blue-700 font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Real-time
                    </span>
                  </div>
                  <div className="mt-5 space-y-2 text-left">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Instant Alerts</h3>
                    <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                      Never miss an interview or placement milestone.
                    </p>
                    <ul className="space-y-1.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 font-bold">
                      <li className="flex items-center gap-1.5"><FiCheck className="text-emerald-500 w-4 h-4 stroke-[3]" /> Shortlist status updates</li>
                      <li className="flex items-center gap-1.5"><FiCheck className="text-emerald-500 w-4 h-4 stroke-[3]" /> Exam result notifications</li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* App Store / Play Store Badges */}
              <div className="flex flex-wrap gap-4 pt-6">
                <a
                  href="#"
                  className="inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-950 text-white px-6 py-3 rounded-2xl transition duration-300 hover:scale-[1.03] active:scale-97 shadow-lg shadow-slate-900/10 cursor-pointer border border-slate-800"
                >
                  <svg className="w-6 h-6 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 5.25V18.75c0 .35.07.68.21.98l7.54-7.54L3.21 4.27c-.14.3-.21.63-.21.98zm11.75 6.75l3.54-3.54L3.79 3.19C3.94 3.07 4.12 3 4.31 3c.33 0 .64.13.88.37l9.56 8.63zm4.5-2.04v6.08c0 .28-.06.55-.17.79L15.25 13l3.83-3.83c.11.24.17.51.17.79zm-4.5 5.87l-9.56 8.63c-.24.24-.55.37-.88.37-.19 0-.37-.07-.52-.19l10.96-10.96 3.54 3.54c-.11.24-.17.51-.17.79z" />
                  </svg>
                  <div className="text-left">
                    <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider leading-none">Get it on</span>
                    <span className="text-sm font-black text-white block mt-1 leading-none">Google Play</span>
                  </div>
                </a>

                <a
                  href="#"
                  className="inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-950 text-white px-6 py-3 rounded-2xl transition duration-300 hover:scale-[1.03] active:scale-97 shadow-lg shadow-slate-900/10 cursor-pointer border border-slate-800"
                >
                  <svg className="w-6 h-6 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.63.73-1.18 1.87-1.03 2.97 1.12.09 2.27-.58 2.98-1.42z" />
                  </svg>
                  <div className="text-left">
                    <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider leading-none">Download on the</span>
                    <span className="text-sm font-black text-white block mt-1 leading-none">App Store</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Recruitment process map */}
        <section id="about" className="py-14 px-6 lg:px-16 relative">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-block text-[#3730a3] font-bold tracking-wider uppercase text-xs mb-3 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                Process
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Streamlined Placement Flow</h2>
              <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto mt-2">
                Four verified stages ensuring a seamless, high-integrity bridge from academic onboarding to direct employment.
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
                      College admins and TPOs register, configure branches, degree curriculums, and department rosters. Students sign up on the web or the Flutter mobile app to build verified profiles, locking in authentic candidate data.
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
                      Recruiters post Job Descriptions (JDs) on the company portal, and our advanced AI engine instantly generates custom MCQ exam papers matching the exact required skills and difficulty distribution. TPOs approve the drive to schedule it.
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
                      Candidates take secure proctored exams on the web or via our Flutter mobile app. Assessments run under absolute lock down, featuring live browser tab-locking, copy-paste blocks, and AI camera face snapshots.
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
                      Companies and TPOs audit proctor logs, webcam snapshot timelines, and real-time trust scores. High-integrity top candidates are instantly selected and verified for direct secure offer dispatch.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-14 bg-slate-50/70 border-t border-slate-100/50 px-6 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block text-[#3730a3] font-bold tracking-wider uppercase text-xs mb-3 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                Contact Desk
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Have Any Inquiry?</h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mt-2">
                Send us a message, and our college and partner support desks will coordinate with you.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto items-start">
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
              Join hundreds of institutes and thousands of students already leveraging the power of The Spot Campus cloud.
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
