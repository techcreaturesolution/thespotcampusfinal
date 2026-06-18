import Razorpay from "razorpay";
import {
  RecruitmentPlan,
  RecruitmentSubscription,
} from "./subscription.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../../errors/customErrors.js";
import crypto from "crypto";
import tbl_interview from "../interview/interview.model.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

// ===== ADMIN: Plan Management =====

export const createPlan = async (req, res) => {
  try {
    const plan = await RecruitmentPlan.create(req.body);
    res.status(StatusCodes.CREATED).json({ plan });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getAllPlans = async (req, res) => {
  try {
    const plans = await RecruitmentPlan.find().sort("-createdAt");
    res.status(StatusCodes.OK).json({ plans });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getActivePlans = async (req, res) => {
  try {
    const { plan_for } = req.query;

    let filter = { is_active: true };
    if (plan_for === "student") {
      filter = { ...filter, plan_for: "student" };
    } else if (plan_for === "all") {
      filter = { is_active: true };
    } else {
      filter = {
        ...filter,
        $or: [{ plan_for: "company" }, { plan_for: { $exists: false } }],
      };
    }

    const plans = await RecruitmentPlan.find(filter).sort("price");
    res.status(StatusCodes.OK).json({ plans });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await RecruitmentPlan.findByIdAndUpdate(id, req.body, { new: true });
    if (!plan) throw new NotFoundError(`No plan with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "Plan updated", plan });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await RecruitmentPlan.findByIdAndDelete(id);
    if (!plan) throw new NotFoundError(`No plan with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "Plan deleted" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// ===== COMPANY: Subscription Purchase =====

export const createSubscriptionOrder = async (req, res) => {
  try {
    const { plan_id } = req.body;
    const plan = await RecruitmentPlan.findById(plan_id);
    if (!plan) throw new NotFoundError("Plan not found");
    if (plan.plan_for === "student") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Invalid plan type for company subscription" });
    }

    const options = {
      amount: plan.price * 100,
      currency: plan.currency || "INR",
      receipt: `recruit_rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const subscription = await RecruitmentSubscription.create({
      company_id: req.user.userId,
      plan_id: plan._id,
      orderId: order.id,
      receiptId: options.receipt,
      amount: plan.price,
      currency: plan.currency || "INR",
    });

    res.status(StatusCodes.CREATED).json({ order, subscription, plan, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const subscription = await RecruitmentSubscription.findOne({ orderId: razorpay_order_id });
      if (!subscription) throw new NotFoundError("Subscription not found");

      const plan = await RecruitmentPlan.findById(subscription.plan_id);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (plan.validity_days || 30) * 24 * 60 * 60 * 1000);

      subscription.paymentId = razorpay_payment_id;
      subscription.signature = razorpay_signature;
      subscription.status = "Paid";
      subscription.is_active = true;
      subscription.starts_at = now;
      subscription.expires_at = expiresAt;
      await subscription.save();

      res.status(StatusCodes.OK).json({ msg: "Subscription activated successfully", subscription });
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({ msg: "Payment verification failed" });
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Check if company has active subscription
export const checkSubscription = async (req, res) => {
  try {
    const companyId = req.params.id || req.user.userId;
    const now = new Date();

    const subscription = await RecruitmentSubscription.findOne({
      company_id: companyId,
      status: "Paid",
      is_active: true,
      expires_at: { $gt: now },
    }).populate("plan_id");

    if (subscription) {
      const actualCount = await tbl_interview.countDocuments({
        company_id: companyId,
        createdAt: { $gte: subscription.starts_at }
      });

      if (subscription.interviews_used !== actualCount) {
        subscription.interviews_used = actualCount;
        await subscription.save();
      }
    }

    res.status(StatusCodes.OK).json({
      hasSubscription: !!subscription,
      subscription,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Get company's subscription history
export const getCompanySubscriptions = async (req, res) => {
  try {
    const subscriptions = await RecruitmentSubscription.find({
      company_id: req.user.userId,
    })
      .populate("plan_id")
      .sort("-createdAt");

    res.status(StatusCodes.OK).json({ subscriptions });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Admin: Get all subscriptions
export const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await RecruitmentSubscription.find()
      .populate("company_id", "company_name company_email")
      .populate("plan_id")
      .sort("-createdAt");

    res.status(StatusCodes.OK).json({ subscriptions });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
