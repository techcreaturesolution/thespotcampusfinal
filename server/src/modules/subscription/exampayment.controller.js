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
    const { amount, examId } = req.body;
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `exam_rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const payment = await tbl_exam_payment.create({
      user_id: req.user.userId,
      examId,
      orderId: order.id,
      receiptId: options.receipt,
      amount,
    });

    res.status(StatusCodes.CREATED).json({ order, payment });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const verifyExamPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      await tbl_exam_payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: "Paid",
        }
      );
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
    const payment = await tbl_exam_payment.findOne({
      user_id: id,
      status: "Paid",
    });
    res.status(StatusCodes.OK).json({ payment, hasAccess: !!payment });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
