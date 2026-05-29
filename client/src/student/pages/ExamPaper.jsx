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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraIntervalRef = useRef(null);

  // Load exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await customFetch.get(`/exam/${id}`);
        setExam(data.exam);
        setTimeLeft(data.exam.timeLimit * 60);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load exam");
        navigate("/dashboard/apply-list");
      }
    };
    fetchExam();
  }, [id, navigate]);

  // Start exam session
  const startExam = async () => {
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
        } catch (err) {
          console.warn("Fullscreen not available");
        }
      }

      // Start camera if enabled
      if (exam?.proctoring?.cameraEnabled) {
        await startCamera();
      }

      setExamStarted(true);
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error("You have already submitted this exam");
        navigate("/dashboard/apply-list");
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
    } catch (err) {
      toast.warning("Camera access denied. Proctoring will continue without camera.");
    }
  };

  // Camera snapshot
  const captureSnapshot = useCallback(async () => {
    if (!canvasRef.current || !videoRef.current || !paperId) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 320, 240);

    const imageUrl = canvas.toDataURL("image/jpeg", 0.5);

    try {
      const { data } = await customFetch.post(`/paper/${paperId}/snapshot`, {
        imageUrl,
        faceDetected: true,
        multipleFaces: false,
      });
      setTotalViolations(data.totalViolations);
      setTrustScore(data.trustScore);
    } catch (err) {
      console.warn("Snapshot upload failed");
    }
  }, [paperId]);

  // Camera interval
  useEffect(() => {
    if (examStarted && cameraStream && exam?.proctoring?.cameraEnabled) {
      const interval = (exam.proctoring.cameraIntervalSeconds || 30) * 1000;
      cameraIntervalRef.current = setInterval(captureSnapshot, interval);
      return () => clearInterval(cameraIntervalRef.current);
    }
  }, [examStarted, cameraStream, exam, captureSnapshot]);

  // Tab visibility detection
  useEffect(() => {
    if (!examStarted || !exam?.proctoring?.tabLockEnabled) return;

    const handleVisibilityChange = async () => {
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
      if (exam?.proctoring?.copyPasteDisabled) {
        e.preventDefault();
        recordViolation("copy_paste", "Copy/paste attempt detected");
      }
    };

    const preventRightClick = (e) => {
      if (exam?.proctoring?.rightClickDisabled) {
        e.preventDefault();
        recordViolation("right_click", "Right-click attempt detected");
      }
    };

    const preventKeyCombo = (e) => {
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
      if (!document.fullscreenElement && exam?.proctoring?.fullScreenRequired) {
        setIsFullScreen(false);
        recordViolation("browser_resize", "Exited fullscreen mode");
        // Re-request fullscreen
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [examStarted, exam]);

  const recordViolation = async (type, details) => {
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
      navigate("/dashboard/apply-list");
    } catch {
      toast.error("Failed to auto-submit exam.");
      navigate("/dashboard/apply-list");
    }
  };

  const handleSubmit = async () => {
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
      navigate("/dashboard/apply-list");
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiShield className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
            <p className="text-gray-500 mt-2">{exam.subject}</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <FiClock className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800">Time Limit: {exam.timeLimit} minutes</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <FiBookOpen className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800">Questions: {exam.noOfQuestion}</span>
            </div>

            {exam.proctoring?.enabled && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FiLock className="w-4 h-4" /> Proctoring Rules
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {exam.proctoring.tabLockEnabled && (
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        Tab switching is NOT allowed and will be recorded
                      </li>
                    )}
                    {exam.proctoring.cameraEnabled && (
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        Camera will capture snapshots every {exam.proctoring.cameraIntervalSeconds}s
                      </li>
                    )}
                    {exam.proctoring.fullScreenRequired && (
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        Full-screen mode is required
                      </li>
                    )}
                    {exam.proctoring.copyPasteDisabled && (
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        Copy/paste is disabled
                      </li>
                    )}
                    {exam.proctoring.autoSubmitOnMaxViolations && (
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        Auto-submit after {exam.proctoring.maxViolations} violations
                      </li>
                    )}
                  </ul>
                </div>
              </>
            )}

            {exam.instructions && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-amber-800 text-sm">{exam.instructions}</p>
              </div>
            )}
          </div>

          <button
            onClick={startExam}
            className="btn-primary w-full text-lg py-3 flex items-center justify-center gap-2"
          >
            <FiShield className="w-5 h-5" /> Start Exam
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = (timeLeft / (exam.timeLimit * 60)) * 100;

  return (
    <div className={`min-h-screen bg-gray-50 no-select ${exam.proctoring?.fullScreenRequired ? "exam-fullscreen" : ""}`}>
      {/* Violation Warning Overlay */}
      {showViolationWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000]">
          <div className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
            <FiAlertTriangle className="w-5 h-5" />
            <span className="font-medium">{violationMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{exam.title}</h2>
            <p className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {exam.questions.length}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Trust Score */}
            <div className="flex items-center gap-2">
              <FiShield className={`w-4 h-4 ${trustScore >= 70 ? "text-green-600" : trustScore >= 40 ? "text-amber-600" : "text-red-600"}`} />
              <span className={`text-sm font-medium ${trustScore >= 70 ? "text-green-600" : trustScore >= 40 ? "text-amber-600" : "text-red-600"}`}>
                Trust: {trustScore}%
              </span>
            </div>

            {/* Violations */}
            <div className="flex items-center gap-2">
              <FiAlertTriangle className={`w-4 h-4 ${totalViolations > 0 ? "text-red-600" : "text-gray-400"}`} />
              <span className={`text-sm font-medium ${totalViolations > 0 ? "text-red-600" : "text-gray-500"}`}>
                {totalViolations}/{exam.proctoring?.maxViolations || 5}
              </span>
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${timeLeft < 60 ? "bg-red-100" : timeLeft < 300 ? "bg-amber-100" : "bg-gray-100"}`}>
              <FiClock className={`w-4 h-4 ${timeLeft < 60 ? "text-red-600" : timeLeft < 300 ? "text-amber-600" : "text-gray-600"}`} />
              <span className={`text-sm font-bold ${timeLeft < 60 ? "text-red-600" : timeLeft < 300 ? "text-amber-600" : "text-gray-700"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Camera indicator */}
            {exam.proctoring?.cameraEnabled && (
              <div className="flex items-center gap-1">
                <FiCamera className="w-4 h-4 text-green-600" />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            )}

            {/* Lock indicator */}
            {exam.proctoring?.tabLockEnabled && (
              <FiLock className="w-4 h-4 text-primary-600" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-6xl mx-auto mt-2">
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${timeLeft < 60 ? "bg-red-500" : timeLeft < 300 ? "bg-amber-500" : "bg-primary-500"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question */}
          <div className="lg:col-span-3">
            <div className="card">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    Q{currentQuestionIndex + 1}
                  </span>
                  {currentQuestion.difficulty && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      currentQuestion.difficulty === "hard"
                        ? "bg-red-100 text-red-700"
                        : currentQuestion.difficulty === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {currentQuestion.difficulty}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {currentQuestion.questionText}
                </h3>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected =
                    currentQuestion.questionType === "single"
                      ? selectedAnswers[currentQuestion._id] === option._id
                      : (selectedAnswers[currentQuestion._id] || []).includes(option._id);

                  return (
                    <label
                      key={option._id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
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
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className={`text-sm ${isSelected ? "text-primary-900 font-medium" : "text-gray-700"}`}>
                        {option.optionText}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                >
                  <FiChevronLeft /> Previous
                </button>

                {currentQuestionIndex === exam.questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FiSend /> Submit Exam
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setCurrentQuestionIndex((prev) =>
                        Math.min(exam.questions.length - 1, prev + 1)
                      )
                    }
                    className="btn-primary flex items-center gap-2"
                  >
                    Next <FiChevronRight />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Question palette & camera */}
          <div className="space-y-4">
            {/* Camera preview */}
            {exam.proctoring?.cameraEnabled && (
              <div className="card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FiCamera className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-medium text-gray-600">Camera</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto" />
                </div>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full rounded-lg bg-gray-900"
                  style={{ height: "120px", objectFit: "cover" }}
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {/* Question palette */}
            <div className="card p-3">
              <h4 className="text-xs font-medium text-gray-600 mb-3">Questions</h4>
              <div className="grid grid-cols-5 gap-1.5">
                {exam.questions.map((q, i) => (
                  <button
                    key={q._id}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                      i === currentQuestionIndex
                        ? "bg-primary-600 text-white"
                        : selectedAnswers[q._id]
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
                  Answered
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-100 rounded" />
                  Not answered
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
