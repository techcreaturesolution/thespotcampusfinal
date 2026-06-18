import Razorpay from "razorpay";
import tbl_payment from "./payment.model.js";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
import tbl_student from "../student/student.model.js";
import { RecruitmentPlan } from "./subscription.model.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

export const createOrder = async (req, res) => {
  try {
    const student = await tbl_student.findById(req.user.userId);
    if (!student) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Student profile not found" });
    }

    const { amount, currency, receipt, notes, plan_name, description } = req.body;
    if (!plan_name || !amount) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "plan_name and amount are required to purchase a plan" });
    }

    const options = {
      amount: amount * 100,
      currency: currency || "INR",
      receipt: receipt || `student_rcpt_${Date.now()}`,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    const payment = await tbl_payment.create({
      orderId: order.id,
      receiptId: options.receipt,
      user_id: req.user.userId,
      user_name: student.student_name || "N/A",
      user_enrollment: student.student_enrollment || "N/A",
      user_email: student.student_email || "N/A",
      user_contact: student.student_contact || "N/A",
      plan_name,
      description: description || `Student Subscription Plan - ${plan_name}`,
      amount,
      currency: options.currency,
    });

    res.status(StatusCodes.CREATED).json({ order, payment, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const payment = await tbl_payment.findOne({ orderId: razorpay_order_id });
      if (!payment) {
        return res.status(StatusCodes.NOT_FOUND).json({ msg: "Payment record not found" });
      }

      // Query the validity_days of this student plan
      const plan = await RecruitmentPlan.findOne({
        plan_name: payment.plan_name,
        plan_for: "student",
      });

      const validityDays = plan ? plan.validity_days : 30;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

      payment.paymentId = razorpay_payment_id;
      payment.signature = razorpay_signature;
      payment.status = "Paid";
      payment.expires_at = expiresAt;
      payment.is_active = true;
      await payment.save();

      res.status(StatusCodes.OK).json({ msg: "Payment verified successfully", payment });
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({ msg: "Payment verification failed" });
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const payments = await tbl_payment.find({}).populate("user_id").sort("-createdAt");
    res.status(StatusCodes.OK).json({ payments });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getUserPayments = async (req, res) => {
  try {
    const payments = await tbl_payment
      .find({ user_id: req.user.userId })
      .sort("-createdAt");
    res.status(StatusCodes.OK).json({ payments });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Check if student has active subscription
export const checkStudentSubscription = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const now = new Date();

    const payment = await tbl_payment.findOne({
      user_id: studentId,
      status: "Paid",
      expires_at: { $gt: now },
    }).sort("-createdAt");

    res.status(StatusCodes.OK).json({
      hasSubscription: !!payment,
      subscription: payment,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

