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
const paymentAmount = Number(
  process.env.AMOUNT || process.env.VITE_AMOUNT || 299,
);
const amountInPaise = Math.round(paymentAmount * 100);

const saveOrder = async (orderDetails, res) => {
  try {
    let document = await Order.findOne({ hasPaid: true });
    if (document) {
      return res.json({
        msg: "your order is already submited, it will take 1hr to process your Order",
        orderId: document.id,
      });
    }
    let doc = await Order.findOneAndUpdate(
      { phone: orderDetails.phone },
      { $set: orderDetails },
      { returnDocument: "after" },
    );
    return res.json({
      msg: "your Order has been confirmed",
      orderId: doc.id,
    });
  } catch (error) {
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
    let doc = await Order.findOne({ phone: data.phone.toString() });

    if (!doc) {
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

      await Order.insertOne({
        ...data,
        razorpayOrderId: razorpayOrder.id,
      });

      return res.json({
        success: true,
        orderId: razorpayOrder.id,
        key: process.env.RAZOR_KEY,
      });
    }

    if (doc.hasPaid) {
      return res.json({
        msg: `your order ${doc.id} is already submited, it will take 1hr to process your Order`,
        orderId: doc.id,
      });
    }
    return res.json({
      success: true,
      orderId: doc.razorpayOrderId,
      key: process.env.RAZOR_KEY,
    });
  } catch (error) {
    console.log(error);
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
