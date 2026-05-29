import tbl_interview from "../models/InterviewModel.js";
import tbl_candidate_round from "../models/CandidateRoundModel.js";
import tbl_application from "../models/ApplicationModel.js";
import tbl_jobpost from "../models/JobModel.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../errors/customErrors.js";
import crypto from "crypto";

const generateRoomId = () => `room_${crypto.randomBytes(8).toString("hex")}`;

// Schedule an interview
export const scheduleInterview = async (req, res) => {
  try {
    const {
      job_id, round_id, student_id, scheduled_at,
      duration_minutes, interview_mode,
    } = req.body;

    const roomId = generateRoomId();
    const meetingLink = `/dashboard/video-interview/${roomId}`;

    const interview = await tbl_interview.create({
      job_id,
      round_id,
      student_id,
      company_id: req.user.userId,
      interview_mode: interview_mode || "video_conference",
      scheduled_at,
      duration_minutes: duration_minutes || 60,
      room_id: roomId,
      meeting_link: meetingLink,
    });

    // Link to candidate round
    const candidateRound = await tbl_candidate_round.findOne({
      job_id,
      student_id,
      round_id,
    });
    if (candidateRound) {
      candidateRound.status = "in_progress";
      candidateRound.started_at = new Date();
      await candidateRound.save();
      interview.candidate_round_id = candidateRound._id;
      await interview.save();
    }

    res.status(StatusCodes.CREATED).json({ interview });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Schedule interviews in bulk
export const bulkScheduleInterviews = async (req, res) => {
  try {
    const { job_id, round_id, interviews } = req.body;
    const created = [];

    for (const item of interviews) {
      const roomId = generateRoomId();
      const interview = await tbl_interview.create({
        job_id,
        round_id,
        student_id: item.student_id,
        company_id: req.user.userId,
        interview_mode: item.interview_mode || "video_conference",
        scheduled_at: item.scheduled_at,
        duration_minutes: item.duration_minutes || 60,
        room_id: roomId,
        meeting_link: `/dashboard/video-interview/${roomId}`,
      });

      const candidateRound = await tbl_candidate_round.findOne({
        job_id,
        student_id: item.student_id,
        round_id,
      });
      if (candidateRound) {
        candidateRound.status = "in_progress";
        await candidateRound.save();
        interview.candidate_round_id = candidateRound._id;
        await interview.save();
      }

      created.push(interview);
    }

    res.status(StatusCodes.CREATED).json({ interviews: created, count: created.length });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Get interviews for a job round (company view)
export const getJobInterviews = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { round_id } = req.query;

    const query = { job_id: jobId, company_id: req.user.userId };
    if (round_id) query.round_id = round_id;

    const interviews = await tbl_interview
      .find(query)
      .populate("student_id")
      .populate("job_id", "job_title")
      .sort("scheduled_at");

    res.status(StatusCodes.OK).json({ interviews });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Get interviews for a student
export const getStudentInterviews = async (req, res) => {
  try {
    const interviews = await tbl_interview
      .find({ student_id: req.user.userId })
      .populate("company_id", "company_name company_email")
      .populate("job_id", "job_title job_position")
      .sort("scheduled_at");

    res.status(StatusCodes.OK).json({ interviews });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Get a single interview (for joining the room)
export const getInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await tbl_interview
      .findById(id)
      .populate("student_id")
      .populate("company_id", "company_name")
      .populate("job_id", "job_title");

    if (!interview) throw new NotFoundError(`No interview with id: ${id}`);
    res.status(StatusCodes.OK).json({ interview });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Get interview by room ID
export const getInterviewByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const interview = await tbl_interview
      .findOne({ room_id: roomId })
      .populate("student_id")
      .populate("company_id", "company_name")
      .populate("job_id", "job_title");

    if (!interview) throw new NotFoundError(`No interview room: ${roomId}`);
    res.status(StatusCodes.OK).json({ interview });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Start interview
export const startInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await tbl_interview.findByIdAndUpdate(
      id,
      { status: "in_progress", started_at: new Date() },
      { new: true }
    );
    if (!interview) throw new NotFoundError(`No interview with id: ${id}`);
    res.status(StatusCodes.OK).json({ interview });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// End interview with evaluation
export const endInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { interviewer_notes, rating, recommendation } = req.body;

    const interview = await tbl_interview.findByIdAndUpdate(
      id,
      {
        status: "completed",
        ended_at: new Date(),
        interviewer_notes: interviewer_notes || "",
        rating: rating || null,
        recommendation: recommendation || "",
      },
      { new: true }
    );
    if (!interview) throw new NotFoundError(`No interview with id: ${id}`);

    // Update candidate round status based on recommendation
    if (interview.candidate_round_id) {
      const passed = ["strong_yes", "yes", "maybe"].includes(recommendation);
      await tbl_candidate_round.findByIdAndUpdate(interview.candidate_round_id, {
        status: passed ? "passed" : "failed",
        score: rating,
        max_score: 10,
        remarks: interviewer_notes,
        completed_at: new Date(),
        evaluated_by: req.user.userId,
      });
    }

    res.status(StatusCodes.OK).json({ msg: "Interview completed", interview });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Cancel interview
export const cancelInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const interview = await tbl_interview.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );
    if (!interview) throw new NotFoundError(`No interview with id: ${id}`);

    if (interview.candidate_round_id) {
      await tbl_candidate_round.findByIdAndUpdate(interview.candidate_round_id, {
        status: "pending",
        remarks: reason || "Interview cancelled",
      });
    }

    res.status(StatusCodes.OK).json({ msg: "Interview cancelled", interview });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Get all interviews for company
export const getAllCompanyInterviews = async (req, res) => {
  try {
    const interviews = await tbl_interview
      .find({ company_id: req.user.userId })
      .populate("student_id")
      .populate("job_id", "job_title job_position")
      .sort("-scheduled_at");

    res.status(StatusCodes.OK).json({ interviews });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
