import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FiFileText, 
  FiUsers, 
  FiAlertCircle, 
  FiCreditCard, 
  FiCpu, 
  FiSliders,
  FiArrowLeft,
  FiSearch,
  FiCheckCircle,
  FiHelpCircle
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

const TermsOfService = () => {
  const [activeSection, setActiveSection] = useState("agreement");
  const [searchQuery, setSearchQuery] = useState("");

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      id: "agreement",
      title: "1. Agreement to Terms",
      icon: <FiFileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>
            These Terms of Service ("Terms") constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and <strong>The Spot Campus</strong> ("we," "us," or "our"), concerning your access to and use of our web platform and Flutter student mobile application (the "Platform"). The Platform is developed and powered by <strong>Tech Creature Solution</strong>.
          </p>
          <p>
            By accessing the Platform, you acknowledge that you have read, understood, and agreed to be bound by all of these Terms. If you do not agree with all of these Terms, then you are expressly prohibited from using the Platform, and you must discontinue use immediately.
          </p>
        </div>
      )
    },
    {
      id: "user-accounts",
      title: "2. User Accounts & Multi-Role Access",
      icon: <FiUsers className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>
            The Spot Campus is a multi-role campus recruitment ecosystem. Different features and rules apply based on your user role:
          </p>
          <div className="space-y-3.5 mt-2">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <strong className="text-slate-800 text-xs uppercase tracking-wider block mb-1">Student Candidates:</strong>
              <p className="text-xs text-slate-600 leading-relaxed">
                You agree to provide true, current, and complete academic details, grades, and resume documents. You are solely responsible for all actions taken under your credentials during placement examinations.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <strong className="text-slate-800 text-xs uppercase tracking-wider block mb-1">Companies & Recruiters:</strong>
              <p className="text-xs text-slate-600 leading-relaxed">
                You are responsible for posting accurate job descriptions and maintaining confidentiality of applicant portfolios, exam papers, and candidate proctoring snapshots.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <strong className="text-slate-800 text-xs uppercase tracking-wider block mb-1">Colleges, Universities & TPOs:</strong>
              <p className="text-xs text-slate-600 leading-relaxed">
                Administrators agree to verify student academic records and maintain oversight over recruitment drives.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "proctoring-rules",
      title: "3. Exam Rules & Proctoring Consent",
      icon: <FiAlertCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>
            To participate in placement examinations on the Platform, students must strictly adhere to the following **Proctoring Regulations**:
          </p>
          
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-3.5">
            <h4 className="font-bold text-indigo-900 text-sm">Strict Code of Conduct during Exams:</h4>
            <ul className="list-decimal pl-5 text-xs text-slate-600 space-y-2">
              <li>
                <strong>Camera & Audio Consent:</strong> You must grant the Platform access to your camera. Periodic snapshots will be taken and processed to detect face count. Denying access or blocking the camera violates the integrity of the exam.
              </li>
              <li>
                <strong>Tab Lock & Full-Screen:</strong> Exams must be taken in Full-Screen Mode. Any attempts to minimize the browser window, open developer tools, resize the frame, or switch browser tabs will be registered as a proctoring violation.
              </li>
              <li>
                <strong>Input Restrictions:</strong> Right-clicking, copying, pasting, or using keyboard shortcuts like PrintScreen are disabled and logged as violations.
              </li>
              <li>
                <strong>Auto-Submit Thresholds:</strong> Cumulative violations reduce your real-time <strong>Trust Score</strong>. If your Trust Score falls below the minimum threshold set by the company, your exam session will automatically submit.
              </li>
              <li>
                <strong>Disciplinary Action:</strong> Cheating or bypassing proctoring protocols will result in a zero trust rating and immediate reporting to college TPOs, which may lead to suspension from the placement portal.
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "ai-content",
      title: "4. AI-Generated Materials Disclaimer",
      icon: <FiCpu className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>
            The Spot Campus utilizes OpenAI’s GPT models to dynamically generate MCQ examinations and mock test papers directly from uploaded Job Descriptions (JDs).
          </p>
          <ul className="list-check space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <FiCheckCircle className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
              <span>We do not guarantee that AI-generated questions are completely error-free, syllabus-compliant, or fit for any specific academic criteria.</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheckCircle className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
              <span>Companies are solely responsible for reviewing and editing exam papers generated from their Job Descriptions before publishing them to candidates.</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheckCircle className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
              <span>We assume no liability for candidate failures resulting from technical glitches, AI inaccuracies, or difficulty scaling parameters.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "billing-payments",
      title: "5. Billing, Payments & Razorpay",
      icon: <FiCreditCard className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>
            Certain features, such as premium resume builder tools, advanced mock exams, company recruitment plans, or subscription portals, require paid access.
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1.5">
            <li><strong>Razorpay Integration:</strong> All payments are processed securely via <strong>Razorpay</strong>. By subscribing, you agree to Razorpay's terms of service and billing policies.</li>
            <li><strong>Refund Policy:</strong> All subscription fees and portal charges are final and non-refundable unless specified otherwise by the company hosting the placement drive.</li>
            <li><strong>Account Suspensions:</strong> Suspensions due to verified cheating or proctoring fraud do not entitle the user to a refund of any paid services.</li>
          </ul>
        </div>
      )
    },
    {
      id: "limitations",
      title: "6. Limitations of Liability",
      icon: <FiSliders className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>
            In no event will The Spot Campus, Tech Creature Solution, or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the Platform.
          </p>
          <p>
            We are not responsible for any hiring decisions, corporate interview outcomes, or college-level rejection rates. The Platform acts solely as an evaluation and facilitation intermediary connecting students with employers.
          </p>
        </div>
      )
    }
  ];

  // Search filter logic
  const filteredSections = sections.filter(sec => 
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    JSON.stringify(sec.content).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSectionClick = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col justify-between selection:bg-[#3730a3] selection:text-white">
      <SEO 
        title="Terms of Service"
        description="Read the Terms of Service for using The Spot Campus platform, applications, and recruitment services."
        keywords="terms of service, user agreement, candidate terms, exam rules"
        canonical="https://thespotcampus.com/terms-of-service"
      />
      <Navbar />

      {/* Hero Header */}
      <header className="relative bg-slate-950 text-white pt-36 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-primary-900/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition duration-150 mb-2 uppercase tracking-widest"
          >
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to home
          </Link>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base font-medium">
            Read the terms, rules, and conditions for utilizing our evaluation tools, mobile application, and recruitment workflows.
          </p>
          <div className="text-xs text-slate-500 font-bold">
            Last Updated: July 6, 2026
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto pt-6">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20 transition-all placeholder:text-slate-500 text-white"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Navigation Sidebar (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4 space-y-2 sticky top-28 self-start">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md shadow-indigo-950/5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 px-2">Table of Contents</h3>
              <nav className="space-y-1.5">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => handleSectionClick(sec.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-extrabold transition-all duration-150 active:scale-98 ${
                      activeSection === sec.id
                        ? "bg-[#3730a3] text-white shadow-lg shadow-indigo-950/15"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {sec.icon}
                    <span>{sec.title.substring(3)}</span>
                  </button>
                ))}
              </nav>

              <div className="h-px bg-slate-100 my-6" />
              
              <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50 text-center">
                <FiHelpCircle className="w-8 h-8 text-[#3730a3] mx-auto mb-2" />
                <h4 className="text-xs font-black text-slate-800">Need legal support?</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">
                  Connect with our compliance team for assistance.
                </p>
                <a 
                  href="mailto:support@thespotcampus.com"
                  className="inline-block mt-3 bg-white hover:bg-indigo-50 border border-indigo-100 text-[#3730a3] font-bold text-xs px-3.5 py-1.5 rounded-lg transition"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </aside>

          {/* Policy Text Area */}
          <section className="lg:col-span-8 space-y-8">
            {filteredSections.length > 0 ? (
              filteredSections.map((sec) => (
                <article
                  key={sec.id}
                  id={sec.id}
                  className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md shadow-indigo-950/5 hover:border-slate-300 transition duration-200"
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[#3730a3]">
                      {sec.icon}
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      {sec.title}
                    </h2>
                  </div>
                  <div className="text-slate-600 text-sm leading-relaxed space-y-4">
                    {sec.content}
                  </div>
                </article>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-md shadow-indigo-950/5 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <FiSearch className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-800">No matching terms found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Try searching for keywords like "proctoring", "GPT", "liability", or "Razorpay".
                </p>
                <button 
                  onClick={() => setSearchQuery("")}
                  className="vibrant-btn text-white font-bold text-xs px-4 py-2.5 rounded-xl active:scale-95 transition"
                >
                  Clear Search Filter
                </button>
              </div>
            )}
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
