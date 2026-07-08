import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhone,
  FiMessageSquare, FiSend, FiMaximize2, FiMinimize2,
  FiUser, FiClock, FiStar, FiCheck, FiChevronLeft,
  FiGrid, FiCalendar, FiUsers, FiSettings, FiCopy,
  FiActivity, FiFileText, FiSliders, FiCpu, FiPenTool, FiShare2,
  FiLayers, FiMail, FiPhoneCall, FiExternalLink, FiHelpCircle,
  FiSmile, FiPaperclip, FiSun, FiMoon
} from "react-icons/fi";
import { io } from "socket.io-client";
import gsap from "gsap";
import customFetch from "../../utils/customFetch";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: [
        "stun:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp"
      ],
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ],
};

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && !import.meta.env.DEV) {
    return envUrl.replace(/\/api$/, "");
  }
  return window.location.origin;
};

const VideoInterview = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useOutletContext();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [remoteUser, setRemoteUser] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // UI Panels and Mock States
  const [activeTab, setActiveTab] = useState("profile"); // default to candidate profile
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isEarly, setIsEarly] = useState(false);

  // New Interview platform states
  const [interviewStage, setInterviewStage] = useState("Introduction");
  const [raisedHand, setRaisedHand] = useState(false);
  const [blurBackground, setBlurBackground] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [pipPosition, setPipPosition] = useState("bottom-right"); // bottom-right, bottom-left, top-right, top-left
  const [isPipPinned, setIsPipPinned] = useState(false);
  const [isMainFullscreen, setIsMainFullscreen] = useState(false);
  
  // Evaluation Rubrics (for Company Interviewers)
  const [interviewerNotes, setInterviewerNotes] = useState("");
  const [overallRating, setOverallRating] = useState(5);
  const [recommendation, setRecommendation] = useState("");
  const [rubricScores, setRubricScores] = useState({
    communication: 3,
    technical: 3,
    problemSolving: 3,
    confidence: 3,
    behavior: 3,
    cultureFit: 3
  });

  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

  // WebRTC & Socket Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const canvasRef = useRef(null);

  // Whiteboard drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [whiteboardColor, setWhiteboardColor] = useState("#6366f1");
  const [brushSize, setBrushSize] = useState(4);

  const userId = user?._id || user?.student_id || "unknown";
  const userName = user?.student_name || user?.company_name || "User";

  const isMediaInitialized = useRef(false);

  useEffect(() => {
    let active = true;
    
    const startFetch = async () => {
      try {
        const { data } = await customFetch.get(`/interviews/room/${roomId}`);
        const interviewData = data.interview;
        
        if (!active) return;

        if (interviewData.status === "completed" || interviewData.status === "cancelled") {
          toast.warning("This interview has already ended.");
          navigate(-1);
          return;
        }
        setInterview(interviewData);
        
        if (interviewData.interviewer_notes) setInterviewerNotes(interviewData.interviewer_notes);
        if (interviewData.rating) setOverallRating(interviewData.rating);
        if (interviewData.recommendation) setRecommendation(interviewData.recommendation);
        
        if (!isMediaInitialized.current) {
          isMediaInitialized.current = true;
          initializeMedia();
        }
      } catch (error) {
        toast.error("Interview room not found");
        navigate(-1);
      } finally {
        if (active) setLoading(false);
      }
    };

    startFetch();

    return () => {
      active = false;
      isMediaInitialized.current = false;
      cleanup();
    };
  }, [roomId]);

  const endCallRef = useRef(null);
  useEffect(() => {
    endCallRef.current = endCall;
  }, [interviewerNotes, overallRating, recommendation]);

  // GSAP Entrance Animations
  useEffect(() => {
    if (!loading) {
      gsap.fromTo(".sidebar-item", 
        { opacity: 0, x: -30 }, 
        { opacity: 1, x: 0, stagger: 0.05, ease: "power3.out", duration: 0.6 }
      );
      gsap.fromTo(".header-item", 
        { opacity: 0, y: -20 }, 
        { opacity: 1, y: 0, stagger: 0.04, ease: "power3.out", duration: 0.6 }
      );
      gsap.fromTo(".control-btn", 
        { opacity: 0, scale: 0.8, y: 30 }, 
        { opacity: 1, scale: 1, y: 0, stagger: 0.03, ease: "back.out(1.5)", duration: 0.6 }
      );
      gsap.fromTo(".panel-slide", 
        { opacity: 0, x: 40 }, 
        { opacity: 1, x: 0, ease: "power3.out", duration: 0.5 }
      );
    }
  }, [loading]);

  useEffect(() => {
    if (interview?.scheduled_at) {
      const scheduledStart = new Date(interview.scheduled_at).getTime();
      const durationMs = (interview.duration_minutes || 60) * 60 * 1000;
      const scheduledEnd = scheduledStart + durationMs;

      const updateTimer = () => {
        const now = Date.now();

        if (now >= scheduledEnd) {
          setTimeLeft(0);
          setIsEarly(false);
          toast.error("The interview duration has expired. Ending call automatically.");
          if (endCallRef.current) {
            endCallRef.current();
          }
          return;
        }

        if (now < scheduledStart) {
          setIsEarly(true);
          setTimeLeft(Math.floor((scheduledStart - now) / 1000));
        } else {
          setIsEarly(false);
          setTimeLeft(Math.floor((scheduledEnd - now) / 1000));
        }
      };

      updateTimer();
      const intervalId = setInterval(updateTimer, 1000);
      return () => clearInterval(intervalId);
    }
  }, [interview?.scheduled_at, interview?.duration_minutes]);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (peerRef.current) peerRef.current.close();
    if (socketRef.current) {
      socketRef.current.emit("leave-interview", { roomId, userId, userName });
      socketRef.current.disconnect();
    }
  };


  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      initSocket(stream);
    } catch (error) {
      toast.error("Camera/microphone access required");
      if (role === "Student") {
        navigate("/dashboard/student/my-interviews");
      } else {
        navigate("/dashboard/company/company-interviews");
      }
    }
  };

  const initSocket = (stream) => {
    const socketUrl = getSocketUrl();
    console.log("Connecting socket to:", socketUrl);
    const socket = io(socketUrl, { withCredentials: true });
    socketRef.current = socket;

    const joinRoom = () => {
      socket.emit("join-interview", { roomId, userId, userName, role });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.on("connect", joinRoom);
    }

    socket.on("user-joined", async (data) => {
      if (data.userId === userId) return;
      setRemoteUser(data);
      await createOffer(stream);
    });

    socket.on("interview-offer", async (data) => {
      if (data.userId === userId) return;
      if (data.userName) {
        setRemoteUser({ userId: data.userId, userName: data.userName, role: data.role });
      }
      await handleOffer(data.offer, stream);
    });

    socket.on("interview-answer", async (data) => {
      if (data.userId === userId) return;
      if (data.userName) {
        setRemoteUser({ userId: data.userId, userName: data.userName, role: data.role });
      }
      if (peerRef.current) {
        try {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          await processIceQueue();
        } catch (err) {
          console.error("Error setting remote description from answer:", err);
        }
      }
    });

    socket.on("interview-ice-candidate", async (data) => {
      if (data.userId === userId) return;
      const candidate = new RTCIceCandidate(data.candidate);
      if (peerRef.current && peerRef.current.remoteDescription && peerRef.current.remoteDescription.type) {
        try {
          await peerRef.current.addIceCandidate(candidate);
        } catch (err) {
          console.error("Error adding ICE candidate directly:", err);
        }
      } else {
        iceCandidatesQueue.current.push(candidate);
      }
    });

    socket.on("interview-chat", (data) => {
      setMessages((prev) => {
        const isDuplicate = prev.some(
          (msg) => 
            msg.userId === data.userId && 
            msg.message === data.message && 
            Math.abs(new Date(msg.timestamp || new Date()).getTime() - new Date(data.timestamp || new Date()).getTime()) < 1000
        );
        if (isDuplicate) return prev;
        return [...prev, data];
      });
      // Highlight chat tab if panel is not already open
      if (!chatOpen || activeTab !== "chat") {
        toast.info(`New message from ${data.userName}`);
      }
    });

    socket.on("user-left", (data) => {
      if (data.userId === userId) return;
      setRemoteUser(null);
      setConnected(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      toast.info(`${data.userName} left the interview`);
    });

    socket.on("interview-ended-by-peer", (data) => {
      if (data.userId === userId) return;
      toast.info("The interview has been ended by the other participant");
      cleanup();
      navigate(-1);
    });
  };

  const createPeer = (stream) => {
    if (peerRef.current) {
      try {
        peerRef.current.close();
      } catch (err) {
        console.error("Error closing existing peer connection:", err);
      }
    }
    const peer = new RTCPeerConnection(ICE_SERVERS);
    peerRef.current = peer;

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.ontrack = (e) => {
      console.log("Remote track received:", e.track.kind);
      if (remoteVideoRef.current) {
        if (e.streams && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
        } else {
          if (!remoteVideoRef.current.srcObject) {
            const newStream = new MediaStream();
            newStream.addTrack(e.track);
            remoteVideoRef.current.srcObject = newStream;
          } else {
            remoteVideoRef.current.srcObject.addTrack(e.track);
          }
        }
        remoteVideoRef.current.play().catch((err) => {
          console.warn("Auto-play of remote video was prevented/failed:", err);
        });
      }
    };

    peer.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("interview-ice-candidate", {
          roomId, candidate: e.candidate, userId,
        });
      }
    };

    peer.onconnectionstatechange = () => {
      console.log("Peer connection state:", peer.connectionState);
      if (peer.connectionState === "connected") {
        setConnected(true);
      } else if (
        peer.connectionState === "failed" ||
        peer.connectionState === "disconnected" ||
        peer.connectionState === "closed"
      ) {
        setConnected(false);
      }
    };

    return peer;
  };

  const createOffer = async (stream) => {
    const peer = createPeer(stream);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socketRef.current.emit("interview-offer", { roomId, offer, userId, userName, role });
  };

  const handleOffer = async (offer, stream) => {
    try {
      const peer = createPeer(stream);
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      await processIceQueue();
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socketRef.current.emit("interview-answer", { roomId, answer, userId, userName, role });
    } catch (err) {
      console.error("Error handling offer:", err);
    }
  };

  const processIceQueue = async () => {
    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      if (peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(candidate);
        } catch (e) {
          console.error("Error adding queued ice candidate:", e);
        }
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setAudioEnabled(!audioEnabled);
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !socketRef.current) return;
    socketRef.current.emit("interview-chat", {
      roomId, userId, userName, message: messageInput.trim(),
    });
    setMessageInput("");
  };

  const endCall = async () => {
    try {
      const notesWithRubric = `
Recommendation: ${recommendation.toUpperCase()}
Overall Rating: ${overallRating}/10

Rubric Evaluations:
- Communication: ${rubricScores.communication}/5
- Technical Skills: ${rubricScores.technical}/5
- Problem Solving: ${rubricScores.problemSolving}/5
- Confidence: ${rubricScores.confidence}/5
- Behavior: ${rubricScores.behavior}/5
- Culture Fit: ${rubricScores.cultureFit}/5

Notes:
${interviewerNotes || "No specific comments added."}
      `.trim();

      await customFetch.patch(`/interviews/${interview._id}/end`, {
        interviewer_notes: role === "Company" ? notesWithRubric : "Ended by student",
        rating: overallRating,
        recommendation: recommendation || "maybe",
      });
      
      if (socketRef.current) {
        socketRef.current.emit("end-interview", { roomId, userId, userName });
      }
    } catch (error) {
      console.error("Failed to end interview:", error);
    }
    cleanup();
    toast.info("Interview ended and evaluation saved.");
    navigate(-1);
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success("Meeting ID copied to clipboard!");
  };

  // Interactive Whiteboard drawing logic
  const handleStartDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    // Support mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const handleDrawing = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = whiteboardColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const updateRubricScore = (criteria, val) => {
    setRubricScores(prev => ({
      ...prev,
      [criteria]: val
    }));
  };

  const cyclePipPosition = () => {
    const positions = ["bottom-right", "bottom-left", "top-left", "top-right"];
    const nextIndex = (positions.indexOf(pipPosition) + 1) % positions.length;
    setPipPosition(positions[nextIndex]);
  };

  const handleTabToggle = (tabName) => {
    if (chatOpen && activeTab === tabName) {
      setChatOpen(false);
    } else {
      setChatOpen(true);
      setActiveTab(tabName);
    }
  };

  const getRoundName = () => {
    if (!interview) return "Interview Round";
    if (interview.job_id?.rounds) {
      const matchedRound = interview.job_id.rounds.find(
        (r) => r._id === interview.round_id || r.id === interview.round_id
      );
      if (matchedRound) {
        const namesMap = {
          mcq: "MCQ Exam",
          technical_interview: "Technical Interview",
          hr_interview: "HR Interview",
          coding_test: "Coding Test",
          video_interview: "Video Interview",
          assignment: "Assignment",
          custom: matchedRound.custom_name || "Custom Round"
        };
        return namesMap[matchedRound.round_type] || matchedRound.custom_name || "Interview Round";
      }
    }
    return "Interview Round";
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[90vh] bg-slate-950 text-slate-200">
        <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-indigo-500 mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Initializing interview session room...</p>
      </div>
    );
  }

  // Stage indicator index
  const stages = ["Introduction", "Technical Round", "Coding Round", "Discussion", "Feedback", "Completed"];
  const currentStageIndex = stages.indexOf(interviewStage);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* ------------------------------------------------
            TOP HEADER
            ------------------------------------------------ */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4 header-item">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold select-none border border-slate-700/50">
              <FiChevronLeft className="w-4 h-4" /> Back
            </button>
            <div className="h-5 w-px bg-slate-800" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-wide text-slate-100 uppercase">
                  {interview?.job_id?.job_title || "Standard Video Round"}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                  {role} View
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Candidate: <span className="text-slate-300 font-semibold">{interview?.student_id?.student_name || "Applicant"}</span>
              </p>
            </div>
          </div>

          {/* Center Stage Round Name Indicator */}
          <div className="hidden md:flex items-center gap-2.5 header-item bg-indigo-500/10 border border-indigo-500/20 px-4.5 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              Active Round: {getRoundName()}
            </span>
          </div>

          <div className="flex items-center gap-4 header-item">
            {/* Live Recording Indicator */}
            <div className="flex items-center gap-1.5 bg-red-950/30 border border-red-900/30 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-red-400">REC</span>
            </div>

            {/* Time Left & Session Timer */}
            <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-800 px-3 py-1.5 rounded-xl">
              <FiClock className={`w-3.5 h-3.5 ${isEarly ? "text-cyan-400 animate-pulse" : timeLeft !== null && timeLeft < 300 ? "text-red-400 animate-pulse" : "text-slate-400"}`} />
              <span className={`text-xs font-bold font-mono tracking-tight ${isEarly ? "text-cyan-400" : timeLeft !== null && timeLeft < 300 ? "text-red-400 animate-pulse" : "text-slate-200"}`}>
                {isEarly ? "Starts in: " : ""}
                {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
              </span>
            </div>

            {/* Signal Strength Quality */}
            <div className="flex items-center gap-1.5" title="Network Connection Strength">
              <FiActivity className={`w-4 h-4 ${connected ? "text-emerald-400" : "text-amber-400 animate-pulse"}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">
                {connected ? "Excellent" : "Connecting"}
              </span>
            </div>
          </div>
        </header>

        {/* ------------------------------------------------
            MAIN SCREEN AREA
            ------------------------------------------------ */}
        <main className="flex-1 relative flex overflow-hidden bg-slate-950">
          
          <div className="flex-1 flex flex-col relative p-6 justify-between overflow-hidden">
            
            {/* Video Streams Frame Container */}
            <div className="flex-1 w-full bg-slate-900/40 border border-slate-900 rounded-3xl relative overflow-hidden flex items-center justify-center shadow-2xl">
              
              {/* Whiteboard overlay inside video player frame */}
              {whiteboardOpen && (
                <div className="absolute inset-0 bg-slate-950 z-30 flex flex-col transition-all duration-300">
                  <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FiPenTool className="text-indigo-400 w-4 h-4" />
                      <span className="text-xs font-bold tracking-wide uppercase text-slate-350">Interactive Whiteboard (Shared Screen)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Color Palette */}
                      <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        {["#ef4444", "#3b82f6", "#10b981", "#eab308", "#6366f1", "#ffffff"].map((c) => (
                          <button
                            key={c}
                            onClick={() => setWhiteboardColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-4.5 h-4.5 rounded-full transition-all duration-200 ${
                              whiteboardColor === c ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 scale-110" : "opacity-80 hover:opacity-100"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Brush size slider */}
                      <input
                        type="range"
                        min="2"
                        max="12"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-20 accent-indigo-500 cursor-pointer"
                        title="Brush Size"
                      />

                      <button onClick={clearCanvas} className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition-colors uppercase">
                        Clear Canvas
                      </button>
                      <button onClick={() => setWhiteboardOpen(false)} className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold text-white transition-colors uppercase">
                        Close Board
                      </button>
                    </div>
                  </div>
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleStartDrawing}
                    onMouseMove={handleDrawing}
                    onMouseUp={handleStopDrawing}
                    onMouseLeave={handleStopDrawing}
                    onTouchStart={handleStartDrawing}
                    onTouchMove={handleDrawing}
                    onTouchEnd={handleStopDrawing}
                    width={900}
                    height={550}
                    className="flex-1 w-full bg-slate-950 cursor-crosshair touch-none"
                  />
                </div>
              )}

              {/* AI Copilot Panel Overlay */}
              {aiAssistantOpen && (
                <div className="absolute top-4 left-4 w-72 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-xl z-20 transition-all duration-300 animate-scale-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-2.5">
                    <div className="flex items-center gap-1.5 text-indigo-400">
                      <FiCpu className="w-4 h-4 animate-spin-slow" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-200">AI Recruiter Assistant</span>
                    </div>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold uppercase">Beta</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-400 font-semibold leading-relaxed">
                      💡 Suggested questions based on the candidate's Resume & Round stage:
                    </p>
                    <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
                      <li>"Explain the core differences between microservices and monolith architecture."</li>
                      <li>"How do you optimize asynchronous fetching performance in React?"</li>
                      <li>"Can you write a simple debounce function on the screen whiteboard?"</li>
                    </ul>
                    <div className="mt-3 bg-slate-950/60 rounded-xl p-2.5 border border-slate-850">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Live Sentiment Indicators</p>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Speech Speed:</span>
                        <span className="text-indigo-400 font-bold">140 words/min (Ideal)</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] mt-1">
                        <span className="text-slate-400">Clarity & Confidence:</span>
                        <span className="text-emerald-400 font-bold">High (92%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Remote stream (Candidate Video) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover transition-all duration-300 ${
                  blurBackground ? "filter blur-md brightness-50" : ""
                } ${isMainFullscreen ? "absolute inset-0 z-10" : ""}`}
              />

              {/* Waiting status screen overlay if not connected */}
              {!connected && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
                  <div className="w-24 h-24 bg-gradient-to-tr from-indigo-950 to-indigo-900 border border-indigo-500/30 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-lg shadow-indigo-500/5">
                    <FiUser className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-200 tracking-wide">
                    {role === "Student" ? "Interviewer has not joined yet" : "Candidate has not joined yet"}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 mt-2 max-w-sm leading-relaxed">
                    Connecting to secure media stream... Please ensure your camera and microphone are toggled ON.
                  </p>
                  <div className="flex gap-2.5 mt-6">
                    <span className="px-3 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-bold uppercase tracking-wider">WebSockets Connected</span>
                    <span className="px-3 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-bold uppercase tracking-wider">WebRTC Peer Pending</span>
                  </div>
                </div>
              )}

              {/* Remote stream HUD Info Overlay */}
              {connected && remoteUser && (
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-lg select-none z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="text-xs font-extrabold text-slate-100">{remoteUser.userName}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">{remoteUser.role || "Participant"}</p>
                  </div>
                </div>
              )}

              {/* Speaking pulse wave indicator (Visual representation of microphone stream) */}
              {connected && (
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-indigo-950/70 border border-indigo-500/20 px-2.5 py-1.5 rounded-lg z-10 select-none">
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-indigo-400 rounded animate-bounce-slow h-2" style={{ animationDelay: "0.1s" }} />
                    <span className="w-0.5 bg-indigo-450 rounded animate-bounce-slow h-3" style={{ animationDelay: "0.2s" }} />
                    <span className="w-0.5 bg-indigo-400 rounded animate-bounce-slow h-1" style={{ animationDelay: "0.3s" }} />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Speaking</span>
                </div>
              )}

              {/* Fullscreen stream button */}
              <button
                onClick={() => setIsMainFullscreen(!isMainFullscreen)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-slate-950/80 border border-slate-850 text-slate-400 hover:text-white transition-all z-20"
                title="Fullscreen Stream"
              >
                {isMainFullscreen ? <FiMinimize2 className="w-4.5 h-4.5" /> : <FiMaximize2 className="w-4.5 h-4.5" />}
              </button>

              {/* ------------------------------------------------
                  INTERVIEWER VIDEO (Floating / Corner PiP window)
                  ------------------------------------------------ */}
              <div
                className={`absolute w-44 h-32 rounded-2xl overflow-hidden shadow-2xl border-2 transition-all duration-300 z-20 ${
                  isPipPinned ? "border-indigo-500/70 ring-4 ring-indigo-500/10 scale-105" : "border-slate-800/80"
                } ${
                  pipPosition === "bottom-right" ? "bottom-4 right-4" :
                  pipPosition === "bottom-left" ? "bottom-4 left-4" :
                  pipPosition === "top-left" ? "top-4 left-4" :
                  "top-4 right-4"
                }`}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover bg-slate-950"
                />
                
                {/* Visual Camera Off placeholder */}
                {!videoEnabled && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center">
                    <FiVideoOff className="w-6 h-6 text-red-500 mb-1" />
                    <span className="text-[9px] uppercase font-bold text-slate-500">Camera Off</span>
                  </div>
                )}

                {/* PiP Controls Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-1.5 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <span className="text-[9px] text-slate-200 font-bold ml-1">You</span>
                  <div className="flex gap-1">
                    <button
                      onClick={cyclePipPosition}
                      className="p-1 rounded bg-slate-900 text-slate-300 hover:text-white text-[8px] font-bold"
                      title="Move Position"
                    >
                      Swap
                    </button>
                    <button
                      onClick={() => setIsPipPinned(!isPipPinned)}
                      className="p-1 rounded bg-slate-900 text-slate-300 hover:text-white text-[8px] font-bold"
                      title="Pin Frame"
                    >
                      {isPipPinned ? "Unpin" : "Pin"}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* ------------------------------------------------
                BOTTOM CONTROL BAR (Glassmorphism Floating Toolbar)
                ------------------------------------------------ */}
            <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800/70 px-3.5 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl shadow-xl w-full max-w-full sm:w-fit mx-auto mt-4 z-10 select-none overflow-x-auto whitespace-nowrap scrollbar-none">
              
              <button
                onClick={toggleAudio}
                className={`control-btn p-3 rounded-xl transition-all duration-200 flex items-center justify-center relative hover:scale-105 ${
                  audioEnabled
                    ? "bg-slate-800 text-slate-200 border border-slate-700/80 hover:bg-slate-750"
                    : "bg-red-650 text-white hover:bg-red-700 shadow-lg shadow-red-500/20"
                }`}
                title={audioEnabled ? "Mute Mic" : "Unmute Mic"}
              >
                {audioEnabled ? <FiMic className="w-5 h-5" /> : <FiMicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`control-btn p-3 rounded-xl transition-all duration-200 flex items-center justify-center relative hover:scale-105 ${
                  videoEnabled
                    ? "bg-slate-800 text-slate-200 border border-slate-700/80 hover:bg-slate-750"
                    : "bg-red-650 text-white hover:bg-red-700 shadow-lg shadow-red-500/20"
                }`}
                title={videoEnabled ? "Turn Off Video" : "Turn On Video"}
              >
                {videoEnabled ? <FiVideo className="w-5 h-5" /> : <FiVideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setScreenSharing(!screenSharing)}
                className={`control-btn p-3 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105 ${
                  screenSharing
                    ? "bg-indigo-600 text-white hover:bg-indigo-750"
                    : "bg-slate-800 text-slate-300 border border-slate-700/80 hover:bg-slate-750"
                }`}
                title="Share Screen"
              >
                <FiShare2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => setWhiteboardOpen(!whiteboardOpen)}
                className={`control-btn p-3 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105 ${
                  whiteboardOpen
                    ? "bg-indigo-600 text-white hover:bg-indigo-750"
                    : "bg-slate-800 text-slate-300 border border-slate-700/80 hover:bg-slate-750"
                }`}
                title="Whiteboard Canvas"
              >
                <FiPenTool className="w-5 h-5" />
              </button>

              <button
                onClick={() => setRaisedHand(!raisedHand)}
                className={`control-btn p-3 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105 ${
                  raisedHand
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-slate-800 text-slate-300 border border-slate-700/80 hover:bg-slate-750"
                }`}
                title="Raise Hand"
              >
                <span className="text-base font-bold leading-none">✋</span>
              </button>

              <button
                onClick={() => setBlurBackground(!blurBackground)}
                className={`control-btn p-3 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105 ${
                  blurBackground
                    ? "bg-indigo-600 text-white hover:bg-indigo-750"
                    : "bg-slate-800 text-slate-300 border border-slate-700/80 hover:bg-slate-750"
                }`}
                title="Blur Stream Background"
              >
                <span className="text-base font-bold leading-none">✨</span>
              </button>

              <div className="w-px h-8 bg-slate-800" />

              {/* Panel Toggles */}
              <button
                onClick={() => handleTabToggle("chat")}
                className={`control-btn p-3 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105 ${
                  chatOpen && activeTab === "chat"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750"
                }`}
                title="Toggle Room Chat"
              >
                <FiMessageSquare className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleTabToggle("participants")}
                className={`control-btn p-3 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105 ${
                  chatOpen && activeTab === "participants"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750"
                }`}
                title="Participants List"
              >
                <FiUsers className="w-5 h-5" />
              </button>

              {role === "Company" && (
                <button
                  onClick={() => handleTabToggle("notes")}
                  className={`control-btn p-3 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105 ${
                    chatOpen && activeTab === "notes"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750"
                  }`}
                  title="Interviewer Evaluation Rubrics"
                >
                  <FiStar className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
                className={`control-btn p-3 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105 ${
                  aiAssistantOpen
                    ? "bg-gradient-to-tr from-indigo-600 to-violet-500 text-white"
                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750"
                }`}
                title="AI Recruiting Assistant hints"
              >
                <FiCpu className="w-5 h-5 animate-pulse" />
              </button>

              <div className="w-px h-8 bg-slate-800" />

              {/* End / Leave button */}
              <button
                onClick={() => setShowEndConfirmation(true)}
                className="control-btn px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all duration-200 hover:scale-105 flex items-center gap-2 text-sm shadow-lg shadow-red-900/10"
              >
                <FiPhone className="w-4.5 h-4.5 rotate-[135deg]" />
                <span>Leave Session</span>
              </button>

            </div>

          </div>

          {/* ------------------------------------------------
              RIGHT SIDEBAR PANEL (Collapsible Tabs System)
              ------------------------------------------------ */}
          {chatOpen && (
            <div className="w-full md:w-96 border-l border-slate-800/80 bg-slate-900 flex flex-col justify-between absolute md:relative inset-y-0 right-0 z-40 panel-slide select-none h-full md:h-auto">
              
              {/* Tab selector menu bar */}
              <div className="bg-slate-950 p-2.5 border-b border-slate-800/60 flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all duration-200 ${
                    activeTab === "profile" ? "bg-slate-900 text-indigo-400 border border-slate-800" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Applicant
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all duration-200 ${
                    activeTab === "chat" ? "bg-slate-900 text-indigo-400 border border-slate-800" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Room Chat
                </button>
                <button
                  onClick={() => setActiveTab("participants")}
                  className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all duration-200 ${
                    activeTab === "participants" ? "bg-slate-900 text-indigo-400 border border-slate-800" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Members
                </button>
                {role === "Company" && (
                  <button
                    onClick={() => setActiveTab("notes")}
                    className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all duration-200 ${
                      activeTab === "notes" ? "bg-slate-900 text-indigo-400 border border-slate-800" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Rubrics
                  </button>
                )}
              </div>

              {/* Tab Contents Frame */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                
                {/* 1. CANDIDATE PROFILE TAB */}
                {activeTab === "profile" && (
                  <div className="space-y-4 animate-scale-in">
                    <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-center">
                      <div className="w-16 h-16 rounded-full bg-indigo-950 border border-indigo-500/20 mx-auto flex items-center justify-center shadow-inner mb-3">
                        {interview?.student_id?.student_image ? (
                          <img
                            src={interview.student_id.student_image}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <FiUser className="w-7 h-7 text-indigo-400" />
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-100">{interview?.student_id?.student_name || "Applicant Name"}</h4>
                      <p className="text-[10px] text-indigo-400 mt-1 uppercase tracking-wider font-semibold">Candidate Profile Card</p>
                      
                      <div className="mt-4 flex flex-col gap-2 text-left bg-slate-900/60 rounded-xl p-3 border border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <FiMail className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-300 select-all truncate">{interview?.student_id?.student_email || "Not Provided"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiPhoneCall className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-300">{interview?.student_id?.student_contact || "Not Provided"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                      <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2.5">Key Capabilities & Skills</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {interview?.student_id?.student_skills ? (
                          interview.student_id.student_skills.split(",").map((s) => (
                            <span key={s} className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-medium font-mono uppercase">
                              {s.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-xs">No specific skill keywords parsed.</span>
                        )}
                      </div>
                    </div>

                    {/* Resume / Documents */}
                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                      <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2.5 font-sans">Uploaded Marksheets / CV Link</h5>
                      {interview?.student_id?.student_last_marksheet ? (
                        <a
                          href={interview.student_id.student_last_marksheet}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-all group"
                        >
                          <span className="flex items-center gap-2">
                            <FiFileText className="w-4 h-4 text-indigo-400 group-hover:scale-105 transition-transform" />
                            View Candidate Document
                          </span>
                          <FiExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <p className="text-slate-500 text-xs">No marksheets/document uploaded yet.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. ROOM CHAT TAB */}
                {activeTab === "chat" && (
                  <div className="flex flex-col h-full animate-scale-in justify-between">
                    <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center select-none opacity-60">
                          <FiMessageSquare className="w-8 h-8 text-slate-600 mb-2.5" />
                          <p className="text-xs font-semibold text-slate-500">Secure Room Chat Session</p>
                          <p className="text-[10px] text-slate-600 mt-1">Messages sent here are visible during calls.</p>
                        </div>
                      ) : (
                        messages.map((msg, idx) => (
                          <div key={idx} className={`flex flex-col ${msg.userId === userId ? "items-end" : "items-start"}`}>
                            <span className="text-[9px] text-slate-500 font-bold px-1">{msg.userName}</span>
                            <div className={`px-3 py-2 rounded-2xl text-xs mt-1 max-w-[85%] font-sans leading-relaxed ${
                              msg.userId === userId
                                ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-500/10"
                                : "bg-slate-850 text-slate-200 rounded-tl-none border border-slate-800"
                            }`}>
                              {msg.message}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {/* Chat Input Field Box */}
                    <div className="pt-3 border-t border-slate-800/80 mt-4 flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          className="w-full pl-3.5 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-xs text-slate-200 placeholder-slate-650"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Send message to room..."
                          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                          <FiSmile className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={sendMessage}
                        className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold p-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 active:scale-95"
                      >
                        <FiSend className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. MEMBERS / PARTICIPANTS TAB */}
                {activeTab === "participants" && (
                  <div className="space-y-3 animate-scale-in">
                    
                    {/* Host User Item */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-850 flex items-center justify-center border border-slate-800 font-bold text-xs text-slate-200 uppercase">
                          {userName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{userName} (You)</p>
                          <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase mt-0.5 inline-block tracking-wider">
                            {role}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {audioEnabled ? <FiMic className="w-3.5 h-3.5 text-slate-400" /> : <FiMicOff className="w-3.5 h-3.5 text-red-500" />}
                        {videoEnabled ? <FiVideo className="w-3.5 h-3.5 text-slate-400" /> : <FiVideoOff className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                    </div>

                    {/* Remote User Item */}
                    {remoteUser ? (
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-950 flex items-center justify-center border border-indigo-500/20 font-bold text-xs text-indigo-400 uppercase">
                            {remoteUser.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200">{remoteUser.userName}</p>
                            <span className="text-[9px] bg-indigo-950/30 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase mt-0.5 inline-block tracking-wider">
                              {remoteUser.role || "Participant"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiActivity className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[9px] font-bold text-slate-500 uppercase">Connected</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950/20 border border-slate-900 rounded-xl text-center">
                        <p className="text-xs text-slate-500 font-semibold select-none">No active peers in this meeting room yet.</p>
                      </div>
                    )}

                  </div>
                )}

                {/* 4. EVALUATION notes TAB (For Company Interviewers) */}
                {activeTab === "notes" && role === "Company" && (
                  <div className="space-y-4 animate-scale-in pb-6">
                    <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-2.5">Grading Criteria Rubrics</h4>
                      
                      <div className="space-y-3 text-xs">
                        {[
                          { key: "communication", label: "Communication Skills" },
                          { key: "technical", label: "Technical Competence" },
                          { key: "problemSolving", label: "Problem Solving / Algorithms" },
                          { key: "confidence", label: "Candidate Confidence" },
                          { key: "behavior", label: "Behavioral Parameters" },
                          { key: "cultureFit", label: "Culture Fitment" }
                        ].map((item) => (
                          <div key={item.key} className="space-y-1.5 bg-slate-900/50 p-2.5 rounded-xl border border-slate-850">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-350 font-medium">{item.label}</span>
                              <span className="text-indigo-400 font-extrabold">{rubricScores[item.key]} / 5</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => updateRubricScore(item.key, star)}
                                  className="focus:outline-none"
                                >
                                  <FiStar
                                    className={`w-3.5 h-3.5 ${
                                      star <= rubricScores[item.key] ? "text-indigo-400 fill-indigo-400" : "text-slate-700"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Overall recommendation and score */}
                    <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Final Recommendation</label>
                        <select
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          value={recommendation}
                          onChange={(e) => setRecommendation(e.target.value)}
                        >
                          <option value="">-- Choose recommendation --</option>
                          <option value="strong_yes">Strong Yes (Must Hire)</option>
                          <option value="yes">Yes (Pass Round)</option>
                          <option value="maybe">Maybe (No Opinion)</option>
                          <option value="no">No (Reject)</option>
                          <option value="strong_no">Strong No (Strong Reject)</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overall Score Rating</label>
                          <span className="text-xs font-bold text-indigo-400">{overallRating} / 10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={overallRating}
                          onChange={(e) => setOverallRating(parseInt(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase tracking-wider mt-1 px-0.5">
                          <span>1 (Poor)</span>
                          <span>5 (Average)</span>
                          <span>10 (Excellent)</span>
                        </div>
                      </div>
                    </div>

                    {/* Evaluator Comments / Notes */}
                    <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Technical Interview Notes</label>
                      <textarea
                        className="w-full min-h-[140px] bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans leading-relaxed"
                        value={interviewerNotes}
                        onChange={(e) => setInterviewerNotes(e.target.value)}
                        placeholder="Write down details regarding candidate performance, problem-solving speed, technical edge..."
                      />
                      <span className="text-[9px] text-slate-500 block text-right mt-1.5">Auto-saves to database upon Ending Call.</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Sidebar Footer details */}
              <div className="bg-slate-950 p-4 border-t border-slate-850 flex items-center justify-between text-xs text-slate-500 select-none">
                <span className="flex items-center gap-1" onClick={copyRoomId} title="Copy Meeting ID">
                  <FiCopy className="w-3.5 h-3.5 cursor-pointer hover:text-slate-350" />
                  Room ID: <span className="text-slate-400 font-mono tracking-tight font-semibold cursor-pointer truncate max-w-[120px]">{roomId}</span>
                </span>
                <span className="text-[10px] font-bold text-indigo-400">RTC SECURE</span>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ------------------------------------------------
          END INTERVIEW CONFIRMATION DIALOG MODAL (shadcn/ui style overlay)
          ------------------------------------------------ */}
      {showEndConfirmation && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative animate-scale-in text-center select-none">
            
            <div className="w-14 h-14 rounded-full bg-red-950 border border-red-900/35 flex items-center justify-center mx-auto mb-4">
              <FiPhone className="w-6 h-6 text-red-500 rotate-[135deg]" />
            </div>

            <h3 className="text-base font-bold text-slate-200 tracking-wide">End Video Interview Session</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
              Are you sure you want to exit the conference? {role === "Company" ? "This will finalize and save all rubric marks and interview details." : "This will leave the room."}
            </p>

            {role === "Company" && (
              <div className="my-4 p-3 bg-slate-950/60 rounded-xl border border-slate-850 text-left text-xs text-slate-300 space-y-1.5">
                <p>Overall Rating Score: <span className="text-indigo-400 font-bold">{overallRating} / 10</span></p>
                <p>Recommendation: <span className="text-indigo-400 font-bold uppercase">{recommendation || "NONE"}</span></p>
                <p className="truncate text-slate-500">Comments: {interviewerNotes || "No comments written"}</p>
              </div>
            )}

            <div className="flex gap-3.5 mt-6">
              <button
                onClick={() => setShowEndConfirmation(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-750"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setShowEndConfirmation(false);
                  endCall();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-650 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-900/10"
              >
                Confirm End
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VideoInterview;
