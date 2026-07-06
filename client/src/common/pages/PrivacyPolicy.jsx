import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FiLock, 
  FiCamera, 
  FiEye, 
  FiShare2, 
  FiShield, 
  FiDatabase, 
  FiArrowLeft,
  FiSearch,
  FiCheckCircle,
  FiHelpCircle
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState("introduction");
  const [searchQuery, setSearchQuery] = useState("");

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      id: "introduction",
      title: "1. Introduction",
      icon: <FiShield className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>
            Welcome to <strong>The Spot Campus</strong> ("we," "our," or "us"). We are committed to protecting your privacy and providing transparency about our data practices.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our web platform and the Flutter student mobile application (collectively, the "Platform"). The Platform is developed and powered by <strong>Tech Creature Solution</strong>.
          </p>
          <p>
            By accessing or using the Platform, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this Privacy Policy, please do not access or use the Platform.
          </p>
        </div>
      )
    },
    {
      id: "information-we-collect",
      title: "2. Information We Collect",
      icon: <FiDatabase className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>We collect personal information that you voluntarily provide to us when registering, creating a profile, or using the Platform. This includes:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3730a3]" /> User Registration Data
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full name, email address, password hashes, phone number, and account roles (Student, Company, College, TPO, University, Admin).
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3730a3]" /> Academic & Placement Profiles
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Colleges attended, degrees, branches of study, CGPA, graduation years, portfolios, and uploaded resume documents.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3730a3]" /> Company Recruitment Details
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Corporate credentials, job descriptions, evaluation thresholds, and placement details.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3730a3]" /> Financial Information
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Payment logs and transaction references. All billing is processed securely via <strong>Razorpay</strong>, and we do not store raw card credentials.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "ai-proctoring",
      title: "3. Advanced AI Proctoring & Exam Data",
      icon: <FiCamera className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>
            The Spot Campus utilizes an advanced proctoring engine to ensure the integrity of online examinations. When a student takes an exam, the Platform collects the following data:
          </p>
          
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
              <FiLock className="w-4 h-4 text-[#3730a3]" /> Active Proctoring Mechanisms:
            </h4>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-2">
              <li>
                <strong>Camera Snapshots:</strong> With your permission, the Platform captures periodic photos during your exam via your web camera or mobile device camera. These images are uploaded securely to <strong>Cloudinary</strong> and processed with face detection tracking to verify your identity and ensure single-person presence.
              </li>
              <li>
                <strong>Tab & Window Tracking:</strong> The system records instances of tab-switching, browser resizing, or losing page focus.
              </li>
              <li>
                <strong>System Monitoring:</strong> Clipboard operations (copy/paste prevention) are disabled and tracked. Right-click controls, developer tool access, and print-screen requests are blocked and registered.
              </li>
              <li>
                <strong>App Lifecycle Tracking (Mobile):</strong> The Flutter mobile application monitors application pauses, minimizing, or multitasking events.
              </li>
              <li>
                <strong>Proctoring Trust Score:</strong> The system runs an algorithm that aggregates all above violations into a real-time <strong>Trust Score (0-100)</strong>. High violations trigger an automatic submission of the exam paper.
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "how-we-use-data",
      title: "4. How We Use Your Data",
      icon: <FiEye className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>We use the collected information for various purposes, including:</p>
          <ul className="list-check space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
              <span>To host and administer the secure exam environment, generate MCQ exams from job descriptions using AI, and process student applications.</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
              <span>To calculate test scores and assess anti-cheating violations.</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
              <span>To connect qualified student candidates with companies during recruitment drives.</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
              <span>To process subscriptions and billing plans via Razorpay.</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
              <span>To monitor the health and performance of the Platform, prevent security breaches, and detect fraud.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "data-sharing",
      title: "5. Data Sharing & Placements",
      icon: <FiShare2 className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>
            Because The Spot Campus is a shared campus placement network, data sharing is built into the workflow to enable job placements. Here is how your information is shared:
          </p>
          <div className="space-y-3 text-slate-600 text-sm">
            <div className="border-l-4 border-[#3730a3] pl-4 py-1">
              <strong>With Recruiting Companies:</strong> When you apply for a job post, your profile, resume, exam answers, proctoring snapshots, trust scores, and performance analytics are shared with the respective company for hiring evaluation.
            </div>
            <div className="border-l-4 border-indigo-400 pl-4 py-1">
              <strong>With Colleges and TPOs:</strong> Your academic and activity reports (including test results and violations) are accessible by your college’s Training and Placement Officer (TPO) to audit candidate performance.
            </div>
            <div className="border-l-4 border-slate-400 pl-4 py-1">
              <strong>With University Administrators:</strong> The university has oversight over colleges and student enrollment statistics, including general performance aggregates.
            </div>
          </div>
        </div>
      )
    },
    {
      id: "data-retention",
      title: "6. Data Retention & Deletion",
      icon: <FiLock className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>
            We retain your personal data for as long as your account remains active or as needed to provide our services. 
          </p>
          <p>
            <strong>Account Deletion:</strong> You can submit a deletion request via our <Link to="/account-deletion-request" className="text-[#3730a3] font-bold hover:underline">Account Deletion Request Page</Link>. Upon receiving your request, personal profile data, resume uploads, and app portfolios will be deleted within 7-14 business days.
          </p>
          <p>
            <strong>Important Exception:</strong> Completed exam answer keys, proctoring violation logs, and financial transactions via Razorpay are maintained for compliance, academic records, and auditing requirements of universities and companies.
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
            Privacy Policy
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base font-medium">
            Learn how The Spot Campus securely manages, monitors, and protects your personal and academic information.
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
                placeholder="Search privacy topics..."
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
                <h4 className="text-xs font-black text-slate-800">Have questions?</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">
                  Our privacy compliance desk is here to help.
                </p>
                <a 
                  href="mailto:support@thespotcampus.com"
                  className="inline-block mt-3 bg-white hover:bg-indigo-50 border border-indigo-100 text-[#3730a3] font-bold text-xs px-3.5 py-1.5 rounded-lg transition"
                >
                  Contact Desk
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
                <h3 className="text-lg font-black text-slate-800">No matching privacy topics</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Try searching for keywords like "proctoring", "snapshots", "delete", or "Razorpay".
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

export default PrivacyPolicy;
