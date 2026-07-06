import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const MobileAppShowcase = () => {
  const sectionRef = useRef(null);
  const perspectiveRef = useRef(null);
  const tiltRef = useRef(null);
  const leftPhoneRef = useRef(null);
  const rightPhoneRef = useRef(null);
  const leftFloatRef = useRef(null);
  const rightFloatRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth <= 640;
    const isTablet = window.innerWidth <= 1024 && window.innerWidth > 640;

    // Final resting X positions — enough gap so they don't overlap
    const finalXLeft = isMobile ? -80 : isTablet ? -130 : -180;
    const finalXRight = isMobile ? 80 : isTablet ? 130 : 180;

    // Accessibility: static pose if reduced motion
    if (prefersReduced) {
      gsap.set(leftPhoneRef.current, { x: finalXLeft, y: 0, z: 0, rotationY: 0, rotationX: 0, opacity: 1 });
      gsap.set(rightPhoneRef.current, { x: finalXRight, y: 0, z: 0, rotationY: 0, rotationX: 0, opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      // Create a master timeline linked to ScrollTrigger
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 95%",
          end: "bottom 5%",
          scrub: 1, // Smooth sync with scroll
        }
      });

      // ─── Phase 1: Entry & Join (t: 0 -> 0.5) ───
      // Left Phone: slide in, rotate to front, face user
      tl.fromTo(
        leftPhoneRef.current,
        {
          x: isMobile ? "-50vw" : "-70vw",
          y: isMobile ? 40 : 100,
          z: isMobile ? -300 : -600,
          rotationY: -180,
          rotationX: isMobile ? 8 : 12,
          opacity: 0,
        },
        {
          x: finalXLeft,
          y: 0,
          z: 0,
          rotationY: 0,
          rotationX: 0,
          opacity: 1,
          ease: "power1.out",
          duration: 0.5,
        }
      );

      // Right Phone: slide in, rotate to front, face user
      tl.fromTo(
        rightPhoneRef.current,
        {
          x: isMobile ? "50vw" : "70vw",
          y: isMobile ? 40 : 100,
          z: isMobile ? -300 : -600,
          rotationY: 180,
          rotationX: isMobile ? 8 : 12,
          opacity: 0,
        },
        {
          x: finalXRight,
          y: 0,
          z: 0,
          rotationY: 0,
          rotationX: 0,
          opacity: 1,
          ease: "power1.out",
          duration: 0.5,
        },
        0 // Align start with left phone
      );

      // ─── Phase 2: Exit & Separate (t: 0.5 -> 1.0) ───
      // Left Phone: slide out, rotate away as section scrolls past
      tl.to(
        leftPhoneRef.current,
        {
          x: isMobile ? "-50vw" : "-70vw",
          y: isMobile ? -40 : -100,
          z: isMobile ? -300 : -600,
          rotationY: -180,
          rotationX: isMobile ? -8 : -12,
          opacity: 0,
          ease: "power1.in",
          duration: 0.5,
        },
        0.5 // Start after landing at center
      );

      // Right Phone: slide out, rotate away as section scrolls past
      tl.to(
        rightPhoneRef.current,
        {
          x: isMobile ? "50vw" : "70vw",
          y: isMobile ? -40 : -100,
          z: isMobile ? -300 : -600,
          rotationY: 180,
          rotationX: isMobile ? -8 : -12,
          opacity: 0,
          ease: "power1.in",
          duration: 0.5,
        },
        0.5 // Start after landing at center
      );

      // ─── GENTLE FLOATING BREEDING ───
      gsap.to(leftFloatRef.current, {
        y: -10,
        rotationZ: -0.8,
        duration: 5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      gsap.to(rightFloatRef.current, {
        y: -10,
        rotationZ: 0.8,
        duration: 5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 0.6,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // ─── MOUSE TILT (Desktop only, max 5°) ───
  const handleMouseMove = (e) => {
    if (window.innerWidth <= 768 || !tiltRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(tiltRef.current, {
      rotationY: x * 5,
      rotationX: -y * 5,
      duration: 0.6,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handleMouseLeave = () => {
    if (!tiltRef.current) return;
    gsap.to(tiltRef.current, {
      rotationY: 0,
      rotationX: 0,
      duration: 1,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  return (
    <section
      id="mobile-app"
      ref={sectionRef}
      className="relative py-6 px-6 bg-transparent"
    >
      <div className="max-w-[1480px] mx-auto flex flex-col items-center justify-center">

        {/* 3D Showcase Stage */}
        <div
          ref={perspectiveRef}
          className="relative flex items-center justify-center h-[400px] sm:h-[460px] md:h-[600px] lg:h-[700px] w-full max-w-6xl"
          style={{ perspective: "1200px" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={tiltRef}
            className="relative flex items-center justify-center w-full h-full"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* ── Left Phone ── */}
            <div
              ref={leftPhoneRef}
              className="absolute select-none"
              style={{ transformStyle: "preserve-3d", willChange: "transform, opacity" }}
            >
              <div ref={leftFloatRef} style={{ transformStyle: "preserve-3d" }}>
                <img
                  src="/MobileScreen.png"
                  alt="App Screen Left"
                  className="w-[120px] sm:w-[280px] md:w-[400px] lg:w-[480px] h-auto pointer-events-none drop-shadow-[0_30px_60px_rgba(55,48,163,0.22)]"
                />
              </div>
            </div>

            {/* ── Right Phone ── */}
            <div
              ref={rightPhoneRef}
              className="absolute select-none"
              style={{ transformStyle: "preserve-3d", willChange: "transform, opacity" }}
            >
              <div ref={rightFloatRef} style={{ transformStyle: "preserve-3d" }}>
                <img
                  src="/MobileScreen2.png"
                  alt="App Screen Right"
                  className="w-[120px] sm:w-[280px] md:w-[400px] lg:w-[480px] h-auto pointer-events-none drop-shadow-[0_30px_60px_rgba(55,48,163,0.22)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* App Store / Play Store Badges */}
        <div className="flex flex-wrap justify-center gap-5 pt-8 relative z-20">
          <a
            href="#"
            className="inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-950 text-white px-7 py-3.5 rounded-2xl transition duration-300 hover:scale-[1.03] active:scale-97 shadow-lg shadow-slate-900/10 cursor-pointer border border-slate-800"
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
            className="inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-950 text-white px-7 py-3.5 rounded-2xl transition duration-300 hover:scale-[1.03] active:scale-97 shadow-lg shadow-slate-900/10 cursor-pointer border border-slate-800"
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
    </section>
  );
};

export default MobileAppShowcase;
