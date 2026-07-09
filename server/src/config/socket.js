export const setupSocketIO = (io) => {
  io.on("connection", (socket) => {
    console.log("Proctoring client connected:", socket.id);

    socket.on("join-exam", (data) => {
      socket.join(`exam-${data.examId}`);
      socket.join(`student-${data.studentId}`);
    });

    socket.on("violation", (data) => {
      io.to(`exam-${data.examId}`).emit("student-violation", {
        studentId: data.studentId,
        type: data.type,
        timestamp: new Date(),
        details: data.details,
      });
    });

    socket.on("camera-snapshot", (data) => {
      io.to(`exam-${data.examId}`).emit("student-snapshot", {
        studentId: data.studentId,
        imageUrl: data.imageUrl,
        faceDetected: data.faceDetected,
        multipleFaces: data.multipleFaces,
        timestamp: new Date(),
      });
    });

    socket.on("exam-auto-submit", (data) => {
      io.to(`student-${data.studentId}`).emit("force-submit", {
        reason: data.reason,
      });
    });

    // Video Interview signaling
    socket.on("join-interview", (data) => {
      socket.join(`interview-${data.roomId}`);
      socket.to(`interview-${data.roomId}`).emit("user-joined", {
        userId: data.userId,
        userName: data.userName,
        role: data.role,
      });
    });

    socket.on("interview-offer", (data) => {
      socket.to(`interview-${data.roomId}`).emit("interview-offer", {
        offer: data.offer,
        userId: data.userId,
        userName: data.userName,
        role: data.role,
      });
    });

    socket.on("interview-answer", (data) => {
      socket.to(`interview-${data.roomId}`).emit("interview-answer", {
        answer: data.answer,
        userId: data.userId,
        userName: data.userName,
        role: data.role,
      });
    });

    socket.on("interview-ice-candidate", (data) => {
      socket.to(`interview-${data.roomId}`).emit("interview-ice-candidate", {
        candidate: data.candidate,
        userId: data.userId,
      });
    });

    socket.on("interview-chat", (data) => {
      io.to(`interview-${data.roomId}`).emit("interview-chat", {
        userId: data.userId,
        userName: data.userName,
        message: data.message,
        timestamp: new Date(),
      });
    });

    socket.on("leave-interview", (data) => {
      socket.to(`interview-${data.roomId}`).emit("user-left", {
        userId: data.userId,
        userName: data.userName,
      });
      socket.leave(`interview-${data.roomId}`);
    });
    
    socket.on("screen-share-started", (data) => {
      socket.to(`interview-${data.roomId}`).emit("screen-share-started", {
        userId: data.userId,
        userName: data.userName,
        role: data.role,
      });
    });

    socket.on("screen-share-stopped", (data) => {
      socket.to(`interview-${data.roomId}`).emit("screen-share-stopped", {
        userId: data.userId,
        userName: data.userName,
        role: data.role,
      });
    });

    socket.on("screen-track-replaced", (data) => {
      socket.to(`interview-${data.roomId}`).emit("screen-track-replaced", {
        userId: data.userId,
        trackType: data.trackType,
      });
    });

    socket.on("screen-share-error", (data) => {
      socket.to(`interview-${data.roomId}`).emit("screen-share-error", {
        userId: data.userId,
        error: data.error,
      });
    });

    socket.on("end-interview", (data) => {
      socket.to(`interview-${data.roomId}`).emit("interview-ended-by-peer", {
        userId: data.userId,
        userName: data.userName,
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
