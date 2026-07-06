import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhone,
  FiMessageSquare, FiSend, FiMaximize2, FiMinimize2,
  FiUser, FiClock, FiStar, FiCheck,
} from "react-icons/fi";
import { io } from "socket.io-client";
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
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isEarly, setIsEarly] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);
  const iceCandidatesQueue = useRef([]);

  const userId = user?._id || user?.student_id || "unknown";
  const userName = user?.student_name || user?.company_name || "User";

  useEffect(() => {
    fetchInterview();
    return () => cleanup();
  }, [roomId]);

  const endCallRef = useRef(null);
  useEffect(() => {
    endCallRef.current = endCall;
  }, [endCall]);

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

  const fetchInterview = async () => {
    try {
      const { data } = await customFetch.get(`/interviews/room/${roomId}`);
      const interviewData = data.interview;
      if (interviewData.status === "completed" || interviewData.status === "cancelled") {
        toast.warning("This interview has already ended.");
        navigate(-1);
        return;
      }
      setInterview(interviewData);
      initializeMedia();
    } catch (error) {
      toast.error("Interview room not found");
      navigate(-1);
    } finally {
      setLoading(false);
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
      setMessages((prev) => [...prev, data]);
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
          // Fallback if no streams array is present
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

  const startTimer = () => {};

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
      await customFetch.patch(`/interviews/${interview._id}/end`, {
        interviewer_notes: role === "Company" ? "Ended by interviewer" : "Ended by student",
        rating: null,
        recommendation: "",
      });
      if (socketRef.current) {
        socketRef.current.emit("end-interview", { roomId, userId, userName });
      }
    } catch (error) {
      console.error("Failed to end interview:", error);
    }
    cleanup();
    toast.info("Interview ended");
    navigate(-1);
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[80vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
          <span className="text-white text-sm font-medium">
            {interview?.job_id?.job_title || "Interview"} — {connected ? "Connected" : "Waiting..."}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`${isEarly ? "text-cyan-400 font-semibold animate-pulse" : timeLeft !== null && timeLeft < 60 ? "text-red-500 font-extrabold animate-pulse" : "text-gray-400"} text-sm flex items-center gap-1.5 transition-colors duration-300`}>
            <FiClock className="w-3.5 h-3.5" /> 
            {isEarly ? "Starts in: " : "Time Remaining: "}
            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
          </span>
          {remoteUser && (
            <span className="text-gray-400 text-sm flex items-center gap-1">
              <FiUser className="w-3.5 h-3.5" /> {remoteUser.userName}
            </span>
          )}
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 bg-gray-900 relative flex">
        <div className={`flex-1 flex ${chatOpen ? "" : "items-center justify-center"}`}>
          {/* Remote Video (main) */}
          <div className="flex-1 relative">
            <video ref={remoteVideoRef} autoPlay playsInline
              className="w-full h-full object-cover" />
            {!connected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="w-20 h-20 bg-gray-850/80 rounded-full flex items-center justify-center mb-5 animate-pulse border border-gray-700/50">
                  <FiUser className="w-9 h-9 text-slate-400" />
                </div>
                <h3 className="text-base font-extrabold tracking-tight">
                  {role === "Student" ? "Interviewer has not joined yet" : "Candidate has not joined yet"}
                </h3>
                <p className="text-xs font-semibold text-gray-400 mt-2 max-w-xs leading-relaxed">
                  They will join the video conference shortly. Please keep your camera/microphone enabled and wait.
                </p>
              </div>
            )}

            {/* Local Video (PiP) */}
            <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
              <video ref={localVideoRef} autoPlay playsInline muted
                className="w-full h-full object-cover" />
              {!videoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <FiVideoOff className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          {chatOpen && (
            <div className="w-80 bg-white flex flex-col border-l border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm text-gray-700">Chat</div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`${msg.userId === userId ? "text-right" : ""}`}>
                    <p className="text-xs text-gray-400">{msg.userName}</p>
                    <div className={`inline-block px-3 py-1.5 rounded-lg text-sm mt-0.5 ${
                      msg.userId === userId ? "bg-primary-100 text-primary-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-100">
                <div className="flex gap-2">
                  <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 text-sm flex-1" value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)} placeholder="Type a message..."
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
                  <button onClick={sendMessage} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md p-2"><FiSend className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-4 py-3 bg-gray-900 rounded-b-xl">
        <button onClick={toggleAudio}
          className={`p-3 rounded-full transition-colors ${audioEnabled ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-red-500 text-white"}`}>
          {audioEnabled ? <FiMic className="w-5 h-5" /> : <FiMicOff className="w-5 h-5" />}
        </button>
        <button onClick={toggleVideo}
          className={`p-3 rounded-full transition-colors ${videoEnabled ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-red-500 text-white"}`}>
          {videoEnabled ? <FiVideo className="w-5 h-5" /> : <FiVideoOff className="w-5 h-5" />}
        </button>
        <button onClick={() => setChatOpen(!chatOpen)}
          className={`p-3 rounded-full transition-colors ${chatOpen ? "bg-primary-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"}`}>
          <FiMessageSquare className="w-5 h-5" />
        </button>
        <button onClick={endCall} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium flex items-center gap-2">
          <FiPhone className="w-5 h-5 rotate-[135deg]" /> End
        </button>
      </div>

    </div>
  );
};

export default VideoInterview;
