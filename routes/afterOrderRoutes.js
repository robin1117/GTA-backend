import express from "express";
import { checkoutSchema } from "../validators/typecheck.js";
import Order from "../models/ordersModel.js";

let router = express.Router();

router.post("/orderConfirm", async (req, res) => {
  let { success, data, error } = checkoutSchema.safeParse(req.body);
  if (!data) {
    return res.status(404).json({ error: error.flatten });
  }
  try {
    let doc = await Order.insertOne(data);
    return res.json({
      msg: "your Order has been confirmed",
      orderId: doc.id,
    });
  } catch (error) {
    if (error.code == 11000) {
      let document = await Order.findOne({ email: error.keyValue.email });
      res.json({
        msg: "your order is already submited, it will take 1hr to process your Order",
        orderId: document.id,
      });
    }
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
