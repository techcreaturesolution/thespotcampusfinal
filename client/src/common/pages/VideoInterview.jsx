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
  ],
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
  const [elapsed, setElapsed] = useState(0);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluation, setEvaluation] = useState({ rating: 5, recommendation: "", notes: "" });

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);

  const userId = user?._id || user?.student_id || "unknown";
  const userName = user?.student_name || user?.company_name || "User";

  useEffect(() => {
    fetchInterview();
    return () => cleanup();
  }, [roomId]);

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
      setInterview(data.interview);
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
    }
  };

  const initSocket = (stream) => {
    const socket = io(window.location.origin, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-interview", { roomId, userId, userName, role });
    });

    socket.on("user-joined", async (data) => {
      setRemoteUser(data);
      setConnected(true);
      startTimer();
      await createOffer(stream);
    });

    socket.on("interview-offer", async (data) => {
      await handleOffer(data.offer, stream);
    });

    socket.on("interview-answer", async (data) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    socket.on("interview-ice-candidate", async (data) => {
      if (peerRef.current) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    socket.on("interview-chat", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("user-left", (data) => {
      setRemoteUser(null);
      setConnected(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      toast.info(`${data.userName} left the interview`);
    });
  };

  const createPeer = (stream) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    peerRef.current = peer;

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
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
      if (peer.connectionState === "connected") {
        setConnected(true);
        startTimer();
      }
    };

    return peer;
  };

  const createOffer = async (stream) => {
    const peer = createPeer(stream);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socketRef.current.emit("interview-offer", { roomId, offer, userId });
  };

  const handleOffer = async (offer, stream) => {
    const peer = createPeer(stream);
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socketRef.current.emit("interview-answer", { roomId, answer, userId });
    setConnected(true);
    startTimer();
  };

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
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
    if (role === "Company") {
      setShowEvaluation(true);
    } else {
      cleanup();
      toast.info("Interview ended");
      navigate(-1);
    }
  };

  const submitEvaluation = async () => {
    try {
      await customFetch.patch(`/interviews/${interview._id}/end`, {
        interviewer_notes: evaluation.notes,
        rating: evaluation.rating,
        recommendation: evaluation.recommendation,
      });
      toast.success("Interview completed with evaluation");
      cleanup();
      navigate(-1);
    } catch (error) {
      toast.error("Failed to save evaluation");
    }
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
          <span className="text-gray-400 text-sm flex items-center gap-1">
            <FiClock className="w-3.5 h-3.5" /> {formatTime(elapsed)}
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
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <FiUser className="w-10 h-10" />
                </div>
                <p className="text-lg">Waiting for participant to join...</p>
                <p className="text-sm text-gray-400 mt-2">Share the interview link with the other participant</p>
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
                  <input type="text" className="input-field text-sm flex-1" value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)} placeholder="Type a message..."
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
                  <button onClick={sendMessage} className="btn-primary p-2"><FiSend className="w-4 h-4" /></button>
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

      {/* Evaluation Modal (Company only) */}
      {showEvaluation && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Evaluation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-10)</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button key={n} onClick={() => setEvaluation({ ...evaluation, rating: n })}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        n <= evaluation.rating ? "bg-yellow-400 text-yellow-900" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recommendation</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "strong_yes", label: "Strong Yes", color: "bg-green-100 text-green-700 border-green-300" },
                    { value: "yes", label: "Yes", color: "bg-green-50 text-green-600 border-green-200" },
                    { value: "maybe", label: "Maybe", color: "bg-yellow-50 text-yellow-700 border-yellow-300" },
                    { value: "no", label: "No", color: "bg-red-50 text-red-600 border-red-200" },
                    { value: "strong_no", label: "Strong No", color: "bg-red-100 text-red-700 border-red-300" },
                  ].map((opt) => (
                    <button key={opt.value} onClick={() => setEvaluation({ ...evaluation, recommendation: opt.value })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                        evaluation.recommendation === opt.value ? opt.color + " ring-2 ring-offset-1 ring-primary-300" : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows="3" className="input-field" value={evaluation.notes}
                  onChange={(e) => setEvaluation({ ...evaluation, notes: e.target.value })}
                  placeholder="Interview notes and observations..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { cleanup(); navigate(-1); }} className="btn-secondary">Skip & End</button>
              <button onClick={submitEvaluation} className="btn-primary flex items-center gap-1">
                <FiCheck className="w-4 h-4" /> Submit Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoInterview;
