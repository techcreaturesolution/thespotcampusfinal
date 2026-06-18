import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiCamera,
  FiAlertTriangle,
  FiClock,
  FiLock,
  FiShield,
  FiChevronLeft,
  FiChevronRight,
  FiSend,
  FiUser,
  FiCheckCircle,
  FiInfo,
  FiActivity,
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";

const ExamPaper = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [paperId, setPaperId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [violations, setViolations] = useState([]);
  const [totalViolations, setTotalViolations] = useState(0);
  const [trustScore, setTrustScore] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violationMessage, setViolationMessage] = useState("");
  const [cameraStream, setCameraStream] = useState(null);
  const [examStarted, setExamStarted] = useState(false);
  const [cameraViolation, setCameraViolation] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const videoRef = useRef(node => { videoRef.current = node; }); // We keep the callback ref structure intact
  const canvasRef = useRef(null);
  const cameraIntervalRef = useRef(null);
  const isFullScreenRef = useRef(false);
  const consecutiveMissingFaceCount = useRef(0);
  const consecutiveMultipleFacesCount = useRef(0);
  const isSubmittingRef = useRef(false);

  // Callback ref to bind stream and auto-play immediately upon mounting
  const setVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node && cameraStream) {
      node.srcObject = cameraStream;
      node.play().catch((err) => console.warn("Video auto-play failed", err));
    }
  }, [cameraStream]);


  // Load tracking.js dynamically from CDN for universal browser face detection support
  useEffect(() => {
    if (window.tracking) return;

    const script1 = document.createElement("script");
    script1.src = "https://cdnjs.cloudflare.com/ajax/libs/tracking.js/1.1.3/tracking-min.js";
    script1.async = true;
    document.body.appendChild(script1);

    script1.onload = () => {
      const script2 = document.createElement("script");
      script2.src = "https://cdnjs.cloudflare.com/ajax/libs/tracking.js/1.1.3/data/face-min.js";
      script2.async = true;
      document.body.appendChild(script2);
    };

    return () => {
      // Clean up scripts if needed
    };
  }, []);

  // Load user profile details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await customFetch.get("/login/current-user");
        setCurrentUser(data.user);
      } catch (err) {
        console.warn("Failed to fetch user details", err);
      }
    };
    fetchUser();
  }, []);

  // Load exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await customFetch.get(`/exam/${id}`);
        setExam(data.exam);
        setTimeLeft(data.exam.timeLimit * 60);
        setLoading(false);
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.response?.data?.message || "";
        if (errorMsg.includes("No Exam") || error.response?.status === 404) {
          toast.warning("Exam not created yet for this job");
        } else {
          toast.error("Failed to load exam");
        }
        navigate("/dashboard/student/apply-list");
      }
    };
    fetchExam();
  }, [id, navigate]);

  // Start exam session
  const startExam = async () => {
    // Start camera if enabled and verify permissions
    if (exam?.proctoring?.cameraEnabled) {
      const stream = await startCamera();
      if (!stream) {
        toast.error("Camera access is compulsory to start this exam. Please grant camera permission.");
        return;
      }
    }

    try {
      // Start exam session
      const { data } = await customFetch.post(`/paper/session/${id}`, {
        browserInfo: navigator.userAgent,
      });
      setPaperId(data.paper._id);

      // Request fullscreen
      if (exam?.proctoring?.fullScreenRequired) {
        try {
          await document.documentElement.requestFullscreen();
          setIsFullScreen(true);
          isFullScreenRef.current = true;
        } catch (err) {
          console.warn("Fullscreen not available");
          toast.error("Fullscreen mode is required to take this exam.");
          return;
        }
      }

      setExamStarted(true);
    } catch (error) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      if (error.response?.status === 400) {
        toast.error("You have already submitted this exam");
        navigate("/dashboard/student/apply-list");
      } else {
        toast.error("Failed to start exam session");
      }
    }
  };

  // Camera setup
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 320, height: 240 },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.warn("Camera access denied:", err);
      return null;
    }
  };



  // Shared face detection helper that supports native FaceDetector, tracking.js, and covered-camera brightness thresholds
  const checkFacePresence = async (canvas, ctx) => {
    let faceDetected = true; // default to true to prevent false positives if detection is unavailable
    let multipleFaces = false;

    const nativeAvailable = "FaceDetector" in window;
    const trackingAvailable = !!(window.tracking && window.tracking.ObjectTracker);

    if (nativeAvailable || trackingAvailable) {
      let nativeSuccess = false;
      let nativeFaces = [];

      if (nativeAvailable) {
        try {
          const faceDetector = new window.FaceDetector({
            maxDetectedFaces: 5,
            fastMode: true,
          });
          nativeFaces = await faceDetector.detect(canvas);
          nativeSuccess = true;
        } catch (err) {
          console.warn("Native face detector error:", err);
        }
      }

      let trackingSuccess = false;
      let trackingFaces = [];

      if (trackingAvailable && (!nativeSuccess || nativeFaces.length === 0)) {
        try {
          const tracker = new window.tracking.ObjectTracker("face");
          tracker.setInitialScale(4);
          tracker.setStepSize(2);
          tracker.setEdgesDensity(0.1);

          tracker.once("track", (event) => {
            trackingFaces = event.data || [];
          });

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          tracker.track(imageData.data, canvas.width, canvas.height);
          trackingSuccess = true;
        } catch (err) {
          console.warn("Tracking.js error:", err);
        }
      }

      if (nativeSuccess && nativeFaces.length > 0) {
        faceDetected = true;
        multipleFaces = nativeFaces.length > 1;
      } else if (trackingSuccess && trackingFaces.length > 0) {
        faceDetected = true;
        multipleFaces = trackingFaces.length > 1;
      } else {
        faceDetected = false;
      }
    }

    // Brightness check as an absolute fallback & covered camera check
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let r, g, b, avg;
      let colorSum = 0;
      for (let x = 0, len = data.length; x < len; x += 4) {
        r = data[x];
        g = data[x + 1];
        b = data[x + 2];
        avg = Math.floor((r + g + b) / 3);
        colorSum += avg;
      }
      const brightness = Math.floor(colorSum / (canvas.width * canvas.height));
      if (brightness < 12) {
        faceDetected = false;
      }
    } catch (err) {
      console.warn("Brightness check failed:", err);
    }

    return { faceDetected, multipleFaces };
  };

  // Camera snapshot and backend upload
  const captureSnapshot = useCallback(async () => {
    if (isSubmittingRef.current) return;
    if (!canvasRef.current || !videoRef.current || !paperId) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 320, 240);

    const imageUrl = canvas.toDataURL("image/jpeg", 0.5);

    // Sync status based directly on our robust 2-second rolling averages to prevent single frame glitches
    const faceDetected = consecutiveMissingFaceCount.current < 3;
    const multipleFaces = consecutiveMultipleFacesCount.current >= 3;

    if (!faceDetected || multipleFaces) {
      const msg = !faceDetected
        ? "No face detected! Please look at the camera."
        : "Multiple faces detected! Please ensure you are alone.";
      setViolationMessage(msg);
      setShowViolationWarning(true);
      setTimeout(() => setShowViolationWarning(false), 4000);
    }

    try {
      const { data } = await customFetch.post(`/paper/${paperId}/snapshot`, {
        imageUrl,
        faceDetected,
        multipleFaces,
      });
      setTotalViolations(data.totalViolations);
      setTrustScore(data.trustScore);
    } catch (err) {
      console.warn("Snapshot upload failed");
    }
  }, [paperId]);

  // Local real-time face detection checker (runs every 2 seconds for instant visual feedback on camera box and updating rolling averages)
  useEffect(() => {
    if (!examStarted || !cameraStream || !exam?.proctoring?.cameraEnabled) return;

    const localCheck = async () => {
      if (isSubmittingRef.current) return;
      if (!canvasRef.current || !videoRef.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, 320, 240);

      const { faceDetected, multipleFaces } = await checkFacePresence(canvas, ctx);

      if (!faceDetected) {
        consecutiveMissingFaceCount.current += 1;
      } else {
        consecutiveMissingFaceCount.current = 0;
      }

      if (multipleFaces) {
        consecutiveMultipleFacesCount.current += 1;
      } else {
        consecutiveMultipleFacesCount.current = 0;
      }

      // Flag a violation visually only if thresholds are met (3 consecutive checks = 6 seconds)
      if (consecutiveMissingFaceCount.current >= 3 || consecutiveMultipleFacesCount.current >= 3) {
        setCameraViolation(true);
      } else {
        setCameraViolation(false);
      }
    };

    const intervalId = setInterval(localCheck, 2000);
    return () => clearInterval(intervalId);
  }, [examStarted, cameraStream, exam]);

  // Camera interval for backend snapshot sync (runs every 10 seconds by default for responsive testing)
  useEffect(() => {
    if (examStarted && cameraStream && exam?.proctoring?.cameraEnabled) {
      const interval = (exam.proctoring.cameraIntervalSeconds || 10) * 1000;
      cameraIntervalRef.current = setInterval(captureSnapshot, interval);
      return () => clearInterval(cameraIntervalRef.current);
    }
  }, [examStarted, cameraStream, exam, captureSnapshot]);

  // Tab visibility detection
  useEffect(() => {
    if (!examStarted || !exam?.proctoring?.tabLockEnabled) return;

    const handleVisibilityChange = async () => {
      if (isSubmittingRef.current) return;
      if (document.hidden) {
        const newViolation = {
          type: "tab_switch",
          timestamp: new Date(),
          details: "Student switched to another tab",
        };
        setViolations((prev) => [...prev, newViolation]);
        setTotalViolations((prev) => prev + 1);
        setTrustScore((prev) => Math.max(0, prev - 10));

        setViolationMessage("Tab switch detected! This has been recorded.");
        setShowViolationWarning(true);
        setTimeout(() => setShowViolationWarning(false), 5000);

        if (paperId) {
          try {
            await customFetch.post(`/paper/${paperId}/violation`, {
              type: "tab_switch",
              details: "Student switched to another tab",
            });
          } catch (err) {
            console.warn("Failed to log violation");
          }
        }

        // Auto-submit on max violations
        if (
          exam?.proctoring?.autoSubmitOnMaxViolations &&
          totalViolations + 1 >= (exam?.proctoring?.maxViolations || 5)
        ) {
          handleAutoSubmit("Maximum violations exceeded");
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [examStarted, exam, paperId, totalViolations]);

  // Prevent copy/paste and right-click
  useEffect(() => {
    if (!examStarted) return;

    const preventCopy = (e) => {
      if (isSubmittingRef.current) return;
      if (exam?.proctoring?.copyPasteDisabled) {
        e.preventDefault();
        recordViolation("copy_paste", "Copy/paste attempt detected");
      }
    };

    const preventRightClick = (e) => {
      if (isSubmittingRef.current) return;
      if (exam?.proctoring?.rightClickDisabled) {
        e.preventDefault();
        recordViolation("right_click", "Right-click attempt detected");
      }
    };

    const preventKeyCombo = (e) => {
      if (isSubmittingRef.current) return;
      // Prevent Ctrl+C, Ctrl+V, Ctrl+A, PrintScreen, F12
      if (
        (e.ctrlKey && ["c", "v", "a", "p"].includes(e.key.toLowerCase())) ||
        e.key === "PrintScreen" ||
        e.key === "F12"
      ) {
        e.preventDefault();
        recordViolation("screenshot_attempt", `Key combo: ${e.key}`);
      }
    };

    document.addEventListener("copy", preventCopy);
    document.addEventListener("paste", preventCopy);
    document.addEventListener("contextmenu", preventRightClick);
    document.addEventListener("keydown", preventKeyCombo);

    return () => {
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("paste", preventCopy);
      document.removeEventListener("contextmenu", preventRightClick);
      document.removeEventListener("keydown", preventKeyCombo);
    };
  }, [examStarted, exam]);

  // Fullscreen exit detection
  useEffect(() => {
    if (!examStarted) return;

    const handleFullscreenChange = () => {
      if (isSubmittingRef.current) return;
      if (!document.fullscreenElement && exam?.proctoring?.fullScreenRequired && isFullScreenRef.current) {
        setIsFullScreen(false);
        isFullScreenRef.current = false;
        recordViolation("browser_resize", "Exited fullscreen mode");
      } else if (document.fullscreenElement) {
        setIsFullScreen(true);
        isFullScreenRef.current = true;
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [examStarted, exam]);

  const recordViolation = async (type, details) => {
    if (isSubmittingRef.current) return;
    setTotalViolations((prev) => prev + 1);
    setTrustScore((prev) => Math.max(0, prev - 5));

    setViolationMessage(details);
    setShowViolationWarning(true);
    setTimeout(() => setShowViolationWarning(false), 3000);

    if (paperId) {
      try {
        await customFetch.post(`/paper/${paperId}/violation`, { type, details });
      } catch (err) {
        console.warn("Failed to log violation");
      }
    }
  };

  // Auto-submit when total violations reach or exceed the limit
  useEffect(() => {
    if (
      examStarted &&
      exam?.proctoring?.autoSubmitOnMaxViolations &&
      totalViolations >= (exam?.proctoring?.maxViolations || 5)
    ) {
      handleAutoSubmit("Maximum violations exceeded");
    }
  }, [totalViolations, examStarted, exam]);

  // Timer
  useEffect(() => {
    if (!examStarted || timeLeft <= 0) return;

    if (timeLeft <= 0) {
      handleAutoSubmit("Time limit exceeded");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoSubmit("Time limit exceeded");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeLeft]);

  const handleAutoSubmit = async (reason) => {
    isSubmittingRef.current = true;
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    const answers = Object.entries(selectedAnswers).map(([qid, val]) => ({
      question_id: qid,
      selectedOption: Array.isArray(val) ? val : [val],
    }));

    try {
      if (paperId) {
        await customFetch.post(`/paper/${paperId}/auto-submit`, {
          reason,
          answers,
        });
      } else {
        await customFetch.post(`/paper/${id}/`, { answers });
      }
      toast.warning(`Exam auto-submitted: ${reason}`);
      navigate("/dashboard/student/apply-list");
    } catch {
      toast.error("Failed to auto-submit exam.");
      navigate("/dashboard/student/apply-list");
    }
  };

  const handleSubmit = async () => {
    isSubmittingRef.current = true;
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    const answers = Object.entries(selectedAnswers).map(([qid, val]) => ({
      question_id: qid,
      selectedOption: Array.isArray(val) ? val : [val],
    }));

    try {
      await customFetch.post(`/paper/${id}/`, {
        answers,
        proctoring: {
          violations,
          totalViolations,
          trustScore,
          startedAt: new Date(Date.now() - (exam.timeLimit * 60 - timeLeft) * 1000),
        },
      });
      toast.success("Exam submitted successfully!");
      navigate("/dashboard/student/apply-list");
    } catch (error) {
      toast.error("Failed to submit exam.");
    }
  };

  const handleOptionChange = (questionId, optionId, questionType) => {
    setSelectedAnswers((prev) => {
      if (questionType === "single") {
        return { ...prev, [questionId]: optionId };
      }
      const selections = prev[questionId] || [];
      return {
        ...prev,
        [questionId]: selections.includes(optionId)
          ? selections.filter((id) => id !== optionId)
          : [...selections, optionId],
      };
    });
  };

  const formatTime = (secs) =>
    `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Exam not found</p>
      </div>
    );
  }

  // Pre-exam instructions screen
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between select-none">
        {/* Simple Branding Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <img src="/logo_TSC.webp" alt="The Spot Campus" width="130" height="40" className="h-10 object-contain" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              Exam Terminal
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 py-8">
          <div className="max-w-3xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
            <div className="bg-gradient-to-r from-[#3730a3] to-[#2563eb] h-2 w-full" />
            
            <div className="p-6 sm:p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#3730a3]">
                  <FiShield className="w-8 h-8 shrink-0" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">{exam.title}</h1>
                <p className="text-xs font-black text-indigo-650 uppercase tracking-wider mt-1.5">{exam.subject || "General Subject"}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3.5 p-4 bg-slate-50 border border-slate-150 rounded-2xl text-left">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm shrink-0 border border-blue-100">
                    <FiClock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Duration</p>
                    <p className="text-sm font-extrabold text-slate-700 mt-0.5">{exam.timeLimit} Minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 p-4 bg-slate-50 border border-slate-150 rounded-2xl text-left">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-650 flex items-center justify-center shadow-sm shrink-0 border border-purple-100">
                    <FiBookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Questions</p>
                    <p className="text-sm font-extrabold text-slate-700 mt-0.5">{exam.noOfQuestion} MCQs</p>
                  </div>
                </div>
              </div>

              {exam.proctoring?.enabled && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 text-left">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 mb-3.5 flex items-center gap-2">
                    <FiLock className="w-4 h-4 text-[#3730a3] shrink-0" /> Secure Exam Proctoring Rules
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-600">
                    {exam.proctoring.tabLockEnabled && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                        <span>Tab switches are tracked as violations</span>
                      </div>
                    )}
                    {exam.proctoring.cameraEnabled && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                        <span>Camera snapshots taken every {exam.proctoring.cameraIntervalSeconds}s</span>
                      </div>
                    )}
                    {exam.proctoring.fullScreenRequired && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                        <span>Fullscreen mode is strictly required</span>
                      </div>
                    )}
                    {exam.proctoring.copyPasteDisabled && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                        <span>Copy/paste and right-click disabled</span>
                      </div>
                    )}
                    {exam.proctoring.autoSubmitOnMaxViolations && (
                      <div className="flex items-center gap-2.5 col-span-1 sm:col-span-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0 animate-pulse" />
                        <span>Auto-submit triggered after {exam.proctoring.maxViolations} violations</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {exam.instructions && (
                <div className="p-4 bg-amber-50/75 border border-amber-150 rounded-2xl mb-6 text-left text-xs font-semibold text-amber-800 leading-relaxed">
                  <span className="font-extrabold block mb-1 uppercase tracking-wide">Special Instructions:</span>
                  {exam.instructions}
                </div>
              )}

              {exam.job_id && (
                <div className="border-t border-slate-200/80 pt-5 mt-5 text-left">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 mb-3.5">
                    Position Details & Requirements
                  </h3>
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 text-xs space-y-3 font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-400 uppercase tracking-wider w-20 shrink-0">Role:</span>
                      <span className="text-slate-700 font-extrabold">{exam.job_id.job_title} ({exam.job_id.job_position})</span>
                    </div>
                    {exam.job_id.job_skills && (
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-400 uppercase tracking-wider w-20 shrink-0">Skills:</span>
                        <span className="text-slate-600 font-extrabold">{exam.job_id.job_skills}</span>
                      </div>
                    )}
                    {exam.job_id.job_desc && (
                      <div className="border-t border-slate-200/60 pt-3 mt-1.5">
                        <span className="font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">Job Description:</span>
                        <p className="text-slate-550 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line bg-white/50 p-3 rounded-xl border border-slate-100">
                          {exam.job_id.job_desc}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={startExam}
                className="mt-8 bg-gradient-to-r from-[#3730a3] to-[#2563eb] hover:from-[#2e288a] hover:to-[#1d4ed8] text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all duration-200 shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 w-full text-base flex items-center justify-center gap-2.5 active:scale-99"
              >
                <FiShield className="w-5 h-5 shrink-0" /> Start Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-4 border-t border-slate-200 bg-white text-center text-[10px] font-bold text-slate-450 uppercase tracking-wider">
          © {new Date().getFullYear()} The Spot Campus. All rights reserved.
        </div>
      </div>
    );
  }

  // Non-dismissible fullscreen block overlay
  if (examStarted && exam?.proctoring?.fullScreenRequired && !isFullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900/98 backdrop-blur-sm flex flex-col items-center justify-center z-[11000] p-6 text-center select-none">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-red-100 relative overflow-hidden">
          <div className="bg-red-500 h-1.5 w-full absolute top-0 left-0" />
          <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5 animate-bounce">
            <FiAlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">Fullscreen Mode Exited!</h2>
          <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">
            This assessment requires fullscreen mode to prevent external assistance. Exiting fullscreen counts as a proctoring violation. 
            You must re-enter fullscreen immediately to continue the exam.
          </p>
          <button
            onClick={async () => {
              try {
                await document.documentElement.requestFullscreen();
                setIsFullScreen(true);
                isFullScreenRef.current = true;
              } catch (err) {
                toast.error("Failed to enter fullscreen. Please try again or check browser settings.");
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg w-full flex items-center justify-center gap-2 active:scale-98 text-sm"
          >
            <FiShield className="w-5 h-5 shrink-0" /> Re-enter Fullscreen Mode
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = (timeLeft / (exam.timeLimit * 60)) * 100;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#eff2f9] to-[#eef1f8] select-none ${exam.proctoring?.fullScreenRequired ? "fixed inset-0 w-screen h-screen z-[9999] overflow-y-auto" : ""}`}>
      {/* Violation Warning Overlay */}
      {showViolationWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000]">
          <div className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce border border-red-500">
            <FiAlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-bold text-xs uppercase tracking-wider">{violationMessage}</span>
          </div>
        </div>
      )}

      {/* Modern Light Header Bar */}
      <div className="bg-white text-slate-800 border-b border-slate-200 px-6 py-3.5 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <img src="/logo_TSC.webp" alt="The Spot Campus" width="117" height="36" className="h-9 object-contain" />
            <div className="h-6 w-[1px] bg-slate-250 hidden sm:block" />
            <div>
              <h2 className="text-sm font-black text-slate-800 tracking-tight leading-snug truncate max-w-[200px] sm:max-w-xs">{exam.title}</h2>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mt-0.5">
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
            {/* Trust Score */}
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
              trustScore >= 70 
                ? "bg-emerald-50/60 border-emerald-150 text-emerald-700 font-bold" 
                : trustScore >= 40 
                ? "bg-amber-50 border-amber-150 text-amber-700 font-bold" 
                : "bg-rose-50 border-rose-150 text-rose-700 font-bold"
            }`}>
              <FiShield className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-black tracking-wide">Trust: {trustScore}%</span>
            </div>

            {/* Violations */}
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
              totalViolations > 0 
                ? "bg-rose-50/60 border-rose-150 text-rose-700 font-bold" 
                : "bg-slate-50 border-slate-200 text-slate-500 font-bold"
            }`}>
              <FiAlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-black tracking-wide">
                Violations: {totalViolations}/{exam.proctoring?.maxViolations || 5}
              </span>
            </div>

            {/* Countdown Monospace Timer */}
            <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs font-black tracking-widest ${
              timeLeft < 60 
                ? "bg-rose-50/60 border-rose-150 text-rose-700 animate-pulse" 
                : timeLeft < 300 
                ? "bg-amber-50 border-amber-150 text-amber-700" 
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              <FiClock className="w-3.5 h-3.5 shrink-0" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Camera indicator */}
            {exam.proctoring?.cameraEnabled && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500">
                <FiCamera className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              </div>
            )}

            {/* Lock indicator */}
            {exam.proctoring?.tabLockEnabled && (
              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl shrink-0" title="Tab Lock Enabled">
                <FiLock className="w-3.5 h-3.5 text-indigo-650" />
              </div>
            )}
          </div>
        </div>

        {/* Dynamic progress bar under header */}
        <div className="max-w-7xl mx-auto mt-3">
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                timeLeft < 60 ? "bg-red-500" : timeLeft < 300 ? "bg-amber-500" : "bg-gradient-to-r from-[#3730a3] to-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question panel (left) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-md border border-slate-200/80 overflow-hidden">
              
              {/* Question Header Panel with soft indigo-slate tint */}
              <div className="bg-gradient-to-br from-indigo-50/60 via-indigo-50/20 to-slate-50/10 p-6 sm:p-8 border-b border-slate-150 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-[#3730a3] text-white text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider shadow-xs">
                    Question {currentQuestionIndex + 1}
                  </span>
                  {currentQuestion.difficulty && (
                    <span className={`text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider border ${
                      currentQuestion.difficulty === "hard"
                        ? "bg-rose-50 border-rose-150 text-rose-700"
                        : currentQuestion.difficulty === "medium"
                        ? "bg-amber-50 border-amber-150 text-amber-700"
                        : "bg-emerald-50 border-emerald-150 text-emerald-700"
                    }`}>
                      {currentQuestion.difficulty}
                    </span>
                  )}
                  <span className="text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider border bg-slate-50 border-slate-200 text-slate-500 ml-auto">
                    {currentQuestion.questionType === "single" ? "Single Choice" : "Multiple Selection"}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-800 leading-snug pr-8 relative z-10">
                  {currentQuestion.questionText}
                </h3>
              </div>

              {/* Options list */}
              <div className="p-6 sm:p-8 text-left bg-white space-y-3.5">
                {currentQuestion.questionType !== "single" && (
                  <div className="p-3.5 bg-indigo-50/50 border border-indigo-150/80 rounded-2xl text-[11px] font-bold text-indigo-700 flex items-center gap-2 mb-2">
                    <FiInfo className="w-4 h-4 shrink-0 text-[#3730a3]" />
                    <span>Multiple Selection: You can choose more than one option for this question.</span>
                  </div>
                )}
                {currentQuestion.options.map((option, idx) => {
                  const isSelected =
                    currentQuestion.questionType === "single"
                      ? selectedAnswers[currentQuestion._id] === option._id
                      : (selectedAnswers[currentQuestion._id] || []).includes(option._id);

                  return (
                    <label
                      key={option._id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-255 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                        isSelected
                          ? "border-[#3730a3] bg-gradient-to-r from-indigo-50/60 to-blue-50/30 text-slate-850 ring-2 ring-indigo-500/5 shadow-xs"
                          : "border-slate-200 hover:border-indigo-250 bg-white hover:bg-indigo-50/5 text-slate-650"
                      }`}
                    >
                      <input
                        type={currentQuestion.questionType === "single" ? "radio" : "checkbox"}
                        name={`question-${currentQuestion._id}`}
                        value={option._id}
                        checked={isSelected}
                        onChange={() =>
                          handleOptionChange(
                            currentQuestion._id,
                            option._id,
                            currentQuestion.questionType
                          )
                        }
                        className="sr-only"
                      />
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border uppercase tracking-wider shrink-0 transition-all ${
                        isSelected 
                          ? "bg-gradient-to-br from-[#3730a3] to-[#2563eb] border-transparent text-white shadow-sm shadow-indigo-500/20 scale-105" 
                          : "bg-slate-50 border-slate-200 text-slate-450"
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className={`text-xs sm:text-sm font-bold leading-relaxed flex-1 ${
                        isSelected ? "font-extrabold text-[#3730a3]" : "text-slate-650"
                      }`}>
                        {option.optionText.replace(/^Option\s*\d+\s*[:.-]?\s*/i, "")}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#3730a3] shrink-0 shadow-2xs">
                          <FiCheckCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </label>
                  );
                })}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="bg-slate-50 hover:bg-slate-100/80 text-slate-700 font-extrabold py-2.5 px-5 rounded-xl border border-slate-200 transition-all duration-200 flex items-center gap-2 text-xs uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95 animate-transition shrink-0"
                  >
                    <FiChevronLeft className="w-4 h-4 shrink-0" /> Previous
                  </button>

                  {currentQuestionIndex === exam.questions.length - 1 ? (
                    <button
                      onClick={handleSubmit}
                      className="bg-gradient-to-r from-[#3730a3] to-[#2563eb] hover:from-[#2e288a] hover:to-[#1d4ed8] text-white font-extrabold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-md shadow-indigo-500/10 hover:shadow-lg flex items-center gap-2 text-xs uppercase tracking-wider active:scale-95 shrink-0"
                    >
                      <FiSend className="w-4 h-4 shrink-0" /> Submit Exam
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        setCurrentQuestionIndex((prev) =>
                          Math.min(exam.questions.length - 1, prev + 1)
                        )
                      }
                      className="bg-gradient-to-r from-[#3730a3] to-[#2563eb] hover:from-[#2e288a] hover:to-[#1d4ed8] text-white font-extrabold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-md shadow-indigo-500/10 hover:shadow-lg flex items-center gap-2 text-xs uppercase tracking-wider active:scale-95 shrink-0"
                    >
                      Next <FiChevronRight className="w-4 h-4 shrink-0" />
                    </button>
                  )}
                </div>              </div>
            </div>

            {/* Security Monitor & Progress Overview side-by-side */}
            <div className={`grid grid-cols-1 ${exam.proctoring?.enabled ? "md:grid-cols-2" : ""} gap-5 mt-5`}>
              {/* AI Proctor Status Panel */}
              {exam.proctoring?.enabled && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-left relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <FiShield className="w-4 h-4 text-indigo-650" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security Monitor</span>
                    <span className="ml-auto text-[9px] font-black text-emerald-655 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-150 flex items-center gap-1 animate-pulse">
                      <FiActivity className="w-2.5 h-2.5" /> Secured
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-xs font-semibold text-slate-600">
                    {exam.proctoring.cameraEnabled && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-slate-550">
                          <FiCamera className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          Camera Monitor
                        </span>
                        <span className="text-[10px] font-black uppercase text-emerald-600">Active</span>
                      </div>
                    )}
                    {exam.proctoring.tabLockEnabled && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-slate-550">
                          <FiLock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          Tab Focus Monitor
                        </span>
                        <span className="text-[10px] font-black uppercase text-emerald-600">Secured</span>
                      </div>
                    )}
                    {exam.proctoring.fullScreenRequired && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-slate-550">
                          <FiShield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          Fullscreen Guard
                        </span>
                        <span className="text-[10px] font-black uppercase text-emerald-600">Active</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1 text-[10px] uppercase font-bold text-slate-450">
                      <span>Integrity Index</span>
                      <span className={`font-black ${trustScore >= 70 ? "text-emerald-600" : trustScore >= 40 ? "text-amber-600" : "text-rose-650"}`}>
                        {trustScore}% ({trustScore >= 70 ? "High" : trustScore >= 40 ? "Warning" : "Alert"})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Exam Summary Progress Stats */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-left">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3.5">Progress Overview</h4>
                
                <div className="space-y-3 text-xs font-semibold">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total Questions</span>
                    <span className="text-slate-800 font-extrabold">{exam.questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                      Answered
                    </span>
                    <span className="text-emerald-700 font-extrabold">
                      {Object.keys(selectedAnswers).filter(qid => {
                        const ans = selectedAnswers[qid];
                        return Array.isArray(ans) ? ans.length > 0 : ans !== undefined && ans !== null;
                      }).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-slate-300 rounded-full shrink-0" />
                      Unanswered
                    </span>
                    <span className="text-slate-750 font-extrabold">
                      {exam.questions.length - Object.keys(selectedAnswers).filter(qid => {
                        const ans = selectedAnswers[qid];
                        return Array.isArray(ans) ? ans.length > 0 : ans !== undefined && ans !== null;
                      }).length}
                    </span>
                  </div>
                  
                  {/* Stats progress bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-355"
                      style={{ 
                        width: `${(Object.keys(selectedAnswers).filter(qid => {
                          const ans = selectedAnswers[qid];
                          return Array.isArray(ans) ? ans.length > 0 : ans !== undefined && ans !== null;
                        }).length / exam.questions.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Camera & palette (right) */}
          <div className="space-y-5">
            {/* Candidate Info Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-[#3730a3]/5 rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#3730a3] to-blue-500 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm shrink-0 border border-white ring-2 ring-indigo-500/10">
                  {currentUser?.student_name ? currentUser.student_name.split(" ").map(n => n[0]).join("").substring(0, 2) : "ST"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-indigo-650 uppercase tracking-widest leading-none">Candidate</p>
                  <h4 className="text-xs font-extrabold text-slate-800 truncate mt-1" title={currentUser?.student_name}>
                    {currentUser?.student_name || "Student Candidate"}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-450 truncate" title={currentUser?.student_email}>
                    {currentUser?.student_email || "student@thespotcampus.com"}
                  </p>
                </div>
              </div>
              
              {currentUser?.student_enrollment && (
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>ID / Roll No:</span>
                  <span className="font-extrabold text-slate-700 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    {currentUser.student_enrollment}
                  </span>
                </div>
              )}
            </div>

            {/* Camera widget */}
            {exam.proctoring?.cameraEnabled && (
              <div className={`bg-white rounded-2xl shadow-sm border p-4 transition-all duration-200 text-left ${
                (cameraViolation || showViolationWarning)
                  ? "border-rose-500 ring-4 ring-rose-500/10 animate-pulse"
                  : "border-slate-200"
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <FiCamera className={`w-4 h-4 ${(cameraViolation || showViolationWarning) ? "text-rose-500 animate-pulse" : "text-slate-500"}`} />
                  <span className={`text-[10px] font-black uppercase tracking-wider ${(cameraViolation || showViolationWarning) ? "text-rose-500" : "text-slate-500"}`}>
                    {(cameraViolation || showViolationWarning) ? "Proctoring Alert!" : "Proctoring Feed"}
                  </span>
                  <div className={`w-2 h-2 rounded-full ml-auto ${(cameraViolation || showViolationWarning) ? "bg-red-500 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
                </div>
                
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-150 shadow-inner">
                  <video
                    ref={setVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full"
                    style={{ height: "140px", objectFit: "cover" }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>
            )}

            {/* Question palette widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-left">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3.5">Question Palette</h4>
              
              <div className="grid grid-cols-5 gap-2">
                {exam.questions.map((q, i) => {
                  const isAnswered = selectedAnswers[q._id] !== undefined && selectedAnswers[q._id] !== null && (Array.isArray(selectedAnswers[q._id]) ? selectedAnswers[q._id].length > 0 : true);
                  
                  return (
                    <button
                      key={q._id}
                      onClick={() => setCurrentQuestionIndex(i)}
                      className={`w-8.5 h-8.5 rounded-xl text-xs font-black transition-all border ${
                        i === currentQuestionIndex
                          ? "bg-gradient-to-br from-[#3730a3] to-[#2563eb] border-transparent text-white shadow-sm shadow-indigo-500/20 scale-105"
                          : isAnswered
                          ? "bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200/50"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-650 border-slate-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex flex-col gap-2 mt-5 pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-555 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-100 border border-emerald-350 rounded-md shrink-0 shadow-2xs flex items-center justify-center text-emerald-800 font-black text-[9px]">&#10003;</div>
                  <span className="text-slate-700 font-extrabold">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-55 border border-slate-200 rounded-md shrink-0 shadow-2xs" />
                  <span className="text-slate-600 font-semibold">Not Answered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Import for instructions section
const FiBookOpen = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

export default ExamPaper;
