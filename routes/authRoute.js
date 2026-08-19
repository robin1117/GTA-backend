import express from "express";
import {
  isThisString,
  loginCheck,
  registerCheck,
} from "../validators/typecheck.js";
import User from "../models/userModel.js";
import { auth } from "../utils/firebaseadmin.js";
import Order from "../models/ordersModel.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

let router = express.Router();

const escapeRegex = (text = "") => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cookieSecure = process.env.COOKIE_SECURE !== "false";
const adminSessionValue = process.env.ADMIN_SESSION_VALUE;
const registrationEnabled = process.env.REGISTRATION_ENABLED === "true";

if (!adminSessionValue) {
  throw new Error("ADMIN_SESSION_VALUE is required");
}

router.post("/login", async (req, res, next) => {
  try {
    let { data, success, error } = loginCheck.safeParse(req.body);
    if (!data) {
      return res
        .status(401)
        .json({ error: "invalid user Inputs", success: false });
    }
    let user = await User.findOne({ userName: data.userName });
    if (!user || !(await verifyPassword(data.password, user.password))) {
      return res
        .status(401)
        .json({ error: "invalid Credentials", success: false });
    }

    res.cookie("sid", adminSessionValue, {
      maxAge: 1000 * 60 * 60,
      secure: cookieSecure,
      httpOnly: true, // Blocks XSS access
      sameSite: "none", // as my backend and frontend is on different origin 
      signed: true,
    });
    return res.status(200).json({ message: "Logged In Status", success: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(401).json({
        success: false,
        message: "Try with login",
      });
    }
    next(error);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    if (!registrationEnabled) {
      return res.status(403).json({
        success: false,
        message: "Registration is disabled",
      });
    }

    let { data, success, error } = registerCheck.safeParse(req.body);
    if (!data) {
      return res.status(404).json({ error: error.flatten });
    }
    await User.insertOne({
      ...data,
      password: await hashPassword(data.password),
    });
    res.json({ success: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Try with login",
      });
    }
    next(error);
  }
});

router.post("/verifiy", async (req, res, next) => {
  try {
    const { _tokenResponse } = req.body;
    let { idToken } = _tokenResponse;
    const decoded = await auth.verifyIdToken(idToken);
    res.cookie("token", decoded.phone_number, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      signed: true,
      maxAge: 1000 * 60 * 2,
    });

    res.json({
      success: true,
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/orders", async (req, res, next) => {
  try {
    let { sid } = req.signedCookies;
    if (sid !== adminSessionValue) {
      return res.status(403).json({ msg: "not logged in", sucess: false });
    }

    let { data, success, error } = isThisString.safeParse(req.query);
    if (!data) {
      return res
        .status(401)
        .json({ error: "invalid user Inputs", success: false });
    }
    const search = data.search?.trim();
    const query = search
      ? { fullname: { $regex: `^${escapeRegex(search)}`, $options: "i" } }
      : {};
    let orderList = await Order.find(query).lean();
    res.status(200).json(orderList);
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
