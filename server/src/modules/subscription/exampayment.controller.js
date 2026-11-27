import Razorpay from "razorpay";
import tbl_exam_payment from "./exampayment.model.js";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

export const createExamOrder = async (req, res) => {
  try {
    const { examId } = req.body;
    if (!examId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "examId is required" });
    }

    // Authoritative server-side exam fee (never trust client-supplied amount)
    const authoritativeAmount = Number(process.env.AI_EXAM_PRICE || 499);
    const options = {
      amount: Math.round(authoritativeAmount * 100),
      currency: "INR",
      receipt: `exam_rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const payment = await tbl_exam_payment.create({
      user_id: req.user.userId,
      examId,
      orderId: order.id,
      receiptId: options.receipt,
      amount: authoritativeAmount,
    });

    res.status(StatusCodes.CREATED).json({ order, payment });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const verifyExamPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Missing Razorpay verification fields" });
    }

    const payment = await tbl_exam_payment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Exam payment record not found" });
    }

    if (req.user.role !== "Admin" && payment.user_id.toString() !== req.user.userId) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Access denied for this exam payment" });
    }

    if (payment.status === "Paid") {
      return res.status(StatusCodes.OK).json({ msg: "Exam payment already verified" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
      .update(body.toString())
      .digest("hex");

    const sigBuf = Buffer.from(String(razorpay_signature), "utf8");
    const expBuf = Buffer.from(expectedSignature, "utf8");
    const isValidSignature = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (isValidSignature) {
      payment.paymentId = razorpay_payment_id;
      payment.signature = razorpay_signature;
      payment.status = "Paid";
      await payment.save();
      res.status(StatusCodes.OK).json({ msg: "Exam payment verified successfully" });
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({ msg: "Payment verification failed" });
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const verifyExamAccess = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== "Admin" && req.user.userId !== id) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Access denied" });
    }
    const payment = await tbl_exam_payment.findOne({
      user_id: id,
      status: "Paid",
    });
    res.status(StatusCodes.OK).json({ payment, hasAccess: !!payment });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
