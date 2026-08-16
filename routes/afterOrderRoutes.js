import express from "express";
import crypto from "crypto";
import {
  checkoutSchema,
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
} from "../validators/typecheck.js";
import Order from "../models/ordersModel.js";
import { RazorPayInstance } from "../config/razorPay.js";

let router = express.Router();
const paymentAmount = Number(process.env.AMOUNT || process.env.VITE_AMOUNT || 299);
const amountInPaise = Math.round(paymentAmount * 100);

const saveOrder = async (orderDetails, res) => {
  try {
    let doc = await Order.insertOne(orderDetails);
    return res.json({
      msg: "your Order has been confirmed",
      orderId: doc.id,
    });
  } catch (error) {
    if (error.code == 11000) {
      let document = await Order.findOne({
        $or: [{ email: orderDetails.email }, { phone: orderDetails.phone }],
      });
      return res.json({
        msg: "your order is already submited, it will take 1hr to process your Order",
        orderId: document.id,
      });
    }

    throw error;
  }
};

router.post("/create-razorpay-order", async (req, res, next) => {
  let { data, error } = createRazorpayOrderSchema.safeParse(req.body);
  if (!data) {
    return res.status(400).json({ error: error.flatten() });
  }

  try {
    if (!process.env.RAZOR_KEY || !process.env.RAZOR_SECRET) {
      return res.status(500).json({
        success: false,
        msg: "Razorpay credentials are missing on server.",
      });
    }

    const razorpayOrder = await RazorPayInstance().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `gta_${Date.now()}`,
      notes: {
        email: data.email,
        phone: data.phone,
        fullname: data.fullname,
      },
    });

    return res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZOR_KEY,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/verify-razorpay-payment", async (req, res, next) => {
  let { data, error } = verifyRazorpayPaymentSchema.safeParse(req.body);
  if (!data) {
    return res.status(400).json({ error: error.flatten() });
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZOR_SECRET)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== data.razorpaySignature) {
      return res.status(400).json({
        success: false,
        msg: "Payment verification failed.",
      });
    }

    return saveOrder(
      {
        ...data,
        hasPaid: true,
        transactionRef: data.razorpayPaymentId,
      },
      res,
    );
  } catch (error) {
    next(error);
  }
});

router.post("/orderConfirm", async (req, res, next) => {
  let { data, error } = checkoutSchema.safeParse(req.body);
  if (!data) {
    return res.status(400).json({ error: error.flatten() });
  }
  try {
    return saveOrder(data, res);
  } catch (error) {
    next(error);
  }
});

router.get("/thankyou", async (req, res) => {
  let document = await Order.findOne({ phone: req.signedCookies.token });

  res.json({
    id: document.id,
    fullname: document.fullname,
    email: document.email,
    phone: document.phone,
  });
});
export default router;
