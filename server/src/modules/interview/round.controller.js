import tbl_jobpost from "../job/job.model.js";
import tbl_application from "../application/application.model.js";
import tbl_candidate_round from "./round.model.js";
import tbl_interview from "./interview.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../../errors/customErrors.js";

// Add rounds to a job
export const addRoundsToJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { rounds } = req.body;

    const job = await tbl_jobpost.findById(id);
    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    const formattedRounds = rounds.map((r, index) => ({
      round_number: index + 1,
      round_type: r.round_type,
      round_name: r.round_name,
      round_description: r.round_description || "",
      is_eliminatory: r.is_eliminatory !== false,
      interview_mode: r.interview_mode || "none",
      duration_minutes: r.duration_minutes || 60,
      status: "pending",
    }));

    job.has_multiple_rounds = true;
    job.rounds = formattedRounds;
    await job.save();

    // Update existing applications with round info
    await tbl_application.updateMany(
      { job_id: id },
      { total_rounds: formattedRounds.length, round_status: "not_started" }
    );

    res.status(StatusCodes.OK).json({ msg: "Rounds configured", job });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Get rounds for a job
export const getJobRounds = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await tbl_jobpost.findById(id).select("rounds has_multiple_rounds job_title");
    if (!job) throw new NotFoundError(`No job with id: ${id}`);
    res.status(StatusCodes.OK).json({ rounds: job.rounds, job_title: job.job_title });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Update a specific round's status
export const updateRoundStatus = async (req, res) => {
  try {
    const { jobId, roundId } = req.params;
    const { status } = req.body;

    const job = await tbl_jobpost.findById(jobId);
    if (!job) throw new NotFoundError(`No job with id: ${jobId}`);

    const round = job.rounds.id(roundId);
    if (!round) throw new NotFoundError(`No round with id: ${roundId}`);

    round.status = status;
    await job.save();

    res.status(StatusCodes.OK).json({ msg: "Round status updated", round });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Get candidates for a specific round
export const getRoundCandidates = async (req, res) => {
  try {
    const { jobId, roundNumber } = req.params;

    const candidateRounds = await tbl_candidate_round
      .find({ job_id: jobId, round_number: parseInt(roundNumber) })
      .populate({
        path: "student_id",
        populate: [
          { path: "college_id", select: "college_name" },
          { path: "university_id", select: "university_name" },
        ]
      })
      .sort("-createdAt");

    res.status(StatusCodes.OK).json({ candidates: candidateRounds });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Advance candidates to next round (bulk)
export const advanceCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { student_ids, current_round, action } = req.body;

    const job = await tbl_jobpost.findById(jobId);
    if (!job) throw new NotFoundError(`No job with id: ${jobId}`);

    // If the job does not have multiple rounds configured
    if (!job.has_multiple_rounds || !job.rounds || job.rounds.length === 0) {
      for (const studentId of student_ids) {
        if (action === "pass") {
          await tbl_application.findOneAndUpdate(
            { job_id: jobId, student_id: studentId },
            { round_status: "all_cleared", final_result: "selected" }
          );
        } else {
          await tbl_application.findOneAndUpdate(
            { job_id: jobId, student_id: studentId },
            { round_status: "eliminated", final_result: "rejected" }
          );
        }
      }
      return res.status(StatusCodes.OK).json({ msg: `Candidates ${action === "pass" ? "selected" : "rejected"}` });
    }

    const nextRound = current_round + 1;
    const totalRounds = job.rounds.length;

    for (const studentId of student_ids) {
      const app = await tbl_application.findOne({ job_id: jobId, student_id: studentId });
      if (!app) continue;

      const currentRoundData = job.rounds.find((r) => r.round_number === current_round) || job.rounds[0];

      // Update current round status (upsert in case round wasn't initialized)
      await tbl_candidate_round.findOneAndUpdate(
        { job_id: jobId, student_id: studentId, round_number: current_round },
        {
          job_id: jobId,
          student_id: studentId,
          application_id: app._id,
          round_id: currentRoundData._id,
          round_number: current_round,
          round_type: currentRoundData.round_type,
          status: action === "pass" ? "passed" : "failed",
          completed_at: new Date(),
        },
        { upsert: true, new: true }
      );

      if (action === "pass" && nextRound <= totalRounds) {
        const nextRoundData = job.rounds.find((r) => r.round_number === nextRound);
        // Create next round entry
        await tbl_candidate_round.findOneAndUpdate(
          { job_id: jobId, student_id: studentId, round_number: nextRound },
          {
            job_id: jobId,
            student_id: studentId,
            application_id: app._id,
            round_id: nextRoundData._id,
            round_number: nextRound,
            round_type: nextRoundData.round_type,
            status: "pending",
          },
          { upsert: true, new: true }
        );

        // Update application
        await tbl_application.findOneAndUpdate(
          { job_id: jobId, student_id: studentId },
          { current_round: nextRound, round_status: "in_progress" }
        );
      } else if (action === "pass" && nextRound > totalRounds) {
        // All rounds cleared
        await tbl_application.findOneAndUpdate(
          { job_id: jobId, student_id: studentId },
          { round_status: "all_cleared", final_result: "selected" }
        );
      } else {
        // Failed
        await tbl_application.findOneAndUpdate(
          { job_id: jobId, student_id: studentId },
          { round_status: "eliminated", final_result: "rejected" }
        );
      }
    }

    // Auto-update round configuration statuses on candidate advancement
    const currentRoundConfig = job.rounds.find((r) => r.round_number === current_round);
    if (currentRoundConfig) {
      currentRoundConfig.status = "completed";
    }

    if (action === "pass" && nextRound <= totalRounds) {
      const nextRoundConfig = job.rounds.find((r) => r.round_number === nextRound);
      if (nextRoundConfig) {
        nextRoundConfig.status = "active";
      }
    }

    await job.save();

    res.status(StatusCodes.OK).json({ msg: `Candidates ${action === "pass" ? "advanced" : "eliminated"}` });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Update individual candidate round result
export const updateCandidateRound = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await tbl_candidate_round.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) throw new NotFoundError(`No candidate round with id: ${id}`);

    // Sync score and remarks to any associated interview
    if (req.body.score !== undefined || req.body.remarks !== undefined) {
      await tbl_interview.findOneAndUpdate(
        { candidate_round_id: id },
        {
          status: "completed",
          ended_at: new Date(),
          rating: req.body.score,
          interviewer_notes: req.body.remarks,
        }
      );
    }

    res.status(StatusCodes.OK).json({ msg: "Updated", candidateRound: updated });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Initialize first round for all approved applications
export const initializeFirstRound = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await tbl_jobpost.findById(jobId);
    if (!job) throw new NotFoundError(`No job with id: ${jobId}`);
    if (!job.rounds || job.rounds.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "No rounds configured for this job" });
    }

    const firstRound = job.rounds[0];
    const applications = await tbl_application.find({
      job_id: jobId,
    });

    const created = [];
    for (const app of applications) {
      const existing = await tbl_candidate_round.findOne({
        job_id: jobId,
        student_id: app.student_id,
        round_number: 1,
      });

      if (!existing) {
        const cr = await tbl_candidate_round.create({
          job_id: jobId,
          student_id: app.student_id,
          application_id: app._id,
          round_id: firstRound._id,
          round_number: 1,
          round_type: firstRound.round_type,
        });
        created.push(cr);

        await tbl_application.findByIdAndUpdate(app._id, {
          current_round: 1,
          total_rounds: job.rounds.length,
          round_status: "in_progress",
          application_status: "1",
        });
      }
    }

    // Activate first round
    firstRound.status = "active";
    await job.save();

    res.status(StatusCodes.OK).json({
      msg: `${created.length} candidates initialized for Round 1`,
      count: created.length,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Get round progress summary for a job
export const getRoundProgress = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await tbl_jobpost.findById(jobId);
    if (!job) throw new NotFoundError(`No job with id: ${jobId}`);

    let updatedRounds = false;

    // Self-healing: Advancing passed candidates who are missing their next round entries
    for (let roundNumber = 1; roundNumber < job.rounds.length; roundNumber++) {
      const passedCandidates = await tbl_candidate_round.find({
        job_id: job._id,
        round_number: roundNumber,
        status: "passed",
      });

      const nextRoundNumber = roundNumber + 1;
      const nextRoundData = job.rounds.find((r) => r.round_number === nextRoundNumber);

      if (nextRoundData) {
        for (const candidate of passedCandidates) {
          const existingNext = await tbl_candidate_round.findOne({
            job_id: job._id,
            student_id: candidate.student_id,
            round_number: nextRoundNumber,
          });

          if (!existingNext) {
            await tbl_candidate_round.create({
              job_id: job._id,
              student_id: candidate.student_id,
              application_id: candidate.application_id,
              round_id: nextRoundData._id,
              round_number: nextRoundNumber,
              round_type: nextRoundData.round_type,
              status: "pending",
            });

            await tbl_application.findOneAndUpdate(
              { job_id: job._id, student_id: candidate.student_id },
              { current_round: nextRoundNumber, round_status: "in_progress" }
            );

            updatedRounds = true;
          }
        }
      }
    }

    const progress = [];

    for (const round of job.rounds) {
      const stats = await tbl_candidate_round.aggregate([
        { $match: { job_id: job._id, round_number: round.round_number } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const statusMap = {};
      stats.forEach((s) => {
        statusMap[s._id] = s.count;
      });

      const total = Object.values(statusMap).reduce((a, b) => a + b, 0);
      const pending = statusMap.pending || 0;
      const in_progress = statusMap.in_progress || 0;
      const passed = statusMap.passed || 0;
      const failed = statusMap.failed || 0;
      const absent = statusMap.absent || 0;

      // Dynamically calculate round configuration status based on candidate progress
      let dynamicStatus = round.status;
      if (total > 0) {
        if (pending === 0 && in_progress === 0) {
          dynamicStatus = "completed";
        } else {
          dynamicStatus = "active";
        }
      } else {
        if (round.round_number > 1) {
          dynamicStatus = "pending";
        }
      }

      // Check if we need to dynamically transition round configuration status
      if (round.status !== dynamicStatus) {
        round.status = dynamicStatus;
        updatedRounds = true;
      }

      progress.push({
        round_number: round.round_number,
        round_name: round.round_name,
        round_type: round.round_type,
        duration_minutes: round.duration_minutes,
        status: dynamicStatus,
        candidates: {
          total,
          pending,
          in_progress,
          passed,
          failed,
          absent,
        },
      });
    }

    // Save changes to database if any round status was auto-corrected
    if (updatedRounds) {
      await job.save();
    }

    const totalApplications = await tbl_application.countDocuments({ job_id: jobId });
    const initializedCount = await tbl_candidate_round.countDocuments({ job_id: jobId, round_number: 1 });
    const uninitializedCount = Math.max(0, totalApplications - initializedCount);

    res.status(StatusCodes.OK).json({ 
      progress, 
      job_title: job.job_title,
      uninitialized_count: uninitializedCount
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Get student's round status for a job
export const getStudentRoundStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const studentId = req.user.userId;

    const job = await tbl_jobpost.findById(jobId).select("rounds job_title has_multiple_rounds");
    const rounds = await tbl_candidate_round
      .find({ job_id: jobId, student_id: studentId })
      .sort("round_number");
    const application = await tbl_application.findOne({ job_id: jobId, student_id: studentId });

    res.status(StatusCodes.OK).json({
      job_title: job?.job_title,
      total_rounds: job?.rounds?.length || 0,
      rounds_config: job?.rounds || [],
      my_rounds: rounds,
      application,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
