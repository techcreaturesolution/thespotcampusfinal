import Razorpay from "razorpay";
import tbl_payment from "../models/PaymentModel.js";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

export const createOrder = async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;
    const options = {
      amount: amount * 100,
      currency: currency || "INR",
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    const payment = await tbl_payment.create({
      orderId: order.id,
      receiptId: options.receipt,
      user_id: req.user.userId,
      user_name: req.body.user_name,
      user_enrollment: req.body.user_enrollment,
      user_email: req.body.user_email,
      user_contact: req.body.user_contact,
      plan_name: req.body.plan_name,
      description: req.body.description,
      amount: req.body.amount,
      currency: options.currency,
    });

    res.status(StatusCodes.CREATED).json({ order, payment });
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
      await tbl_payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: "Paid",
        }
      );
      res.status(StatusCodes.OK).json({ msg: "Payment verified successfully" });
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
