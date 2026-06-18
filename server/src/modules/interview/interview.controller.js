import tbl_interview from "./interview.model.js";
import tbl_candidate_round from "./round.model.js";
import tbl_application from "../application/application.model.js";
import tbl_jobpost from "../job/job.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../../errors/customErrors.js";
import crypto from "crypto";
import { RecruitmentSubscription } from "../subscription/subscription.model.js";

const generateRoomId = () => `room_${crypto.randomBytes(8).toString("hex")}`;

const autoExpirePastInterviews = async (query) => {
  try {
    const pastInterviews = await tbl_interview.find({
      ...query,
      status: { $in: ["scheduled", "in_progress"] },
    });

    for (const interview of pastInterviews) {
      const scheduledTime = new Date(interview.scheduled_at).getTime();
      const durationMs = (interview.duration_minutes || 60) * 60 * 1000;
      const expiredTime = scheduledTime + durationMs;

      if (Date.now() > expiredTime) {
        interview.status = "no_show";
        await interview.save();

        let candidateRoundId = interview.candidate_round_id;
        if (!candidateRoundId) {
          const cr = await tbl_candidate_round.findOne({
            job_id: interview.job_id,
            student_id: interview.student_id,
            round_id: interview.round_id,
          });
          if (cr) {
            candidateRoundId = cr._id;
          }
        }

        if (candidateRoundId) {
          await tbl_candidate_round.findByIdAndUpdate(candidateRoundId, {
            status: "absent",
            remarks: "Candidate was a no-show for the scheduled interview slot",
          });
        }
      }
    }
  } catch (error) {
    console.error("Failed to auto-expire past interviews:", error);
  }
};

// Schedule an interview
export const scheduleInterview = async (req, res) => {
  try {
    const {
      job_id, round_id, student_id, scheduled_at,
      duration_minutes, interview_mode,
    } = req.body;

    const roomId = generateRoomId();
    const meetingLink = `/dashboard/video-interview/${roomId}`;

    // Subscription check & increment
    const activeSub = await RecruitmentSubscription.findOne({
      company_id: req.user.userId,
      status: "Paid",
      is_active: true,
      expires_at: { $gt: new Date() },
    }).populate("plan_id");

    if (activeSub) {
      const maxAllowed = activeSub.plan_id?.features?.max_interviews_per_month || 50;
      const actualCount = await tbl_interview.countDocuments({
        company_id: req.user.userId,
        createdAt: { $gte: activeSub.starts_at },
      });

      if (actualCount >= maxAllowed) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: `You have reached your subscription limit of ${maxAllowed} interviews. Please upgrade your subscription plan.`,
        });
      }
      activeSub.interviews_used = actualCount + 1;
      await activeSub.save();
    }

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

    // Subscription check for bulk schedule
    const activeSub = await RecruitmentSubscription.findOne({
      company_id: req.user.userId,
      status: "Paid",
      is_active: true,
      expires_at: { $gt: new Date() },
    }).populate("plan_id");

    if (activeSub) {
      const maxAllowed = activeSub.plan_id?.features?.max_interviews_per_month || 50;
      const actualCount = await tbl_interview.countDocuments({
        company_id: req.user.userId,
        createdAt: { $gte: activeSub.starts_at }
      });

      if (actualCount + interviews.length > maxAllowed) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: `Scheduling these interviews would exceed your subscription limit. You have ${maxAllowed - actualCount} interviews remaining.`,
        });
      }
      activeSub.interviews_used = actualCount + interviews.length;
      await activeSub.save();
    }

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

    await autoExpirePastInterviews({ job_id: jobId, company_id: req.user.userId });

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
    await autoExpirePastInterviews({ student_id: req.user.userId });

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

    await autoExpirePastInterviews({ _id: id });

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

    await autoExpirePastInterviews({ room_id: roomId });

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
    let candidateRoundId = interview.candidate_round_id;
    if (!candidateRoundId) {
      const cr = await tbl_candidate_round.findOne({
        job_id: interview.job_id,
        student_id: interview.student_id,
        round_id: interview.round_id,
      });
      if (cr) {
        candidateRoundId = cr._id;
      }
    }

    if (candidateRoundId) {
      if (recommendation) {
        const passed = ["strong_yes", "yes", "maybe"].includes(recommendation);
        await tbl_candidate_round.findByIdAndUpdate(candidateRoundId, {
          status: passed ? "passed" : "failed",
          score: rating,
          max_score: 10,
          remarks: interviewer_notes,
          completed_at: new Date(),
          evaluated_by: req.user.userId,
        });
      } else {
        await tbl_candidate_round.findByIdAndUpdate(candidateRoundId, {
          status: "completed",
          remarks: interviewer_notes || "",
        });
      }
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
    await autoExpirePastInterviews({ company_id: req.user.userId });

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

// Update / Reschedule an interview
export const updateInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_at, duration_minutes, interview_mode } = req.body;

    const interview = await tbl_interview.findById(id);
    if (!interview) throw new NotFoundError(`No interview with id: ${id}`);

    // Verify ownership
    if (interview.company_id.toString() !== req.user.userId) {
      return res.status(StatusCodes.FORBIDDEN).json({ error: "Not authorized to update this interview" });
    }

    if (scheduled_at) interview.scheduled_at = new Date(scheduled_at);
    if (duration_minutes) interview.duration_minutes = duration_minutes;
    if (interview_mode) interview.interview_mode = interview_mode;

    // Reset status if rescheduled
    if (scheduled_at && ["cancelled", "no_show", "completed"].includes(interview.status)) {
      interview.status = "scheduled";
    }

    await interview.save();

    res.status(StatusCodes.OK).json({ msg: "Interview updated successfully", interview });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
