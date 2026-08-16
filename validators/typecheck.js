import { z } from "zod";

export const registerCheck = z.object({
  userName: z.string().min(3, "Username must be 3+ characters").trim(),
  email: z.string().email("Invalid email format"),
  password: z.string(),
});

export const loginCheck = z.object({
  userName: z.string().min(3, "Username must be 3+ characters").trim(),
  password: z.string(),
});

export const checkoutSchema = z.object({
  fullname: z.string().min(1, "Full name is required").trim(),
  email: z.string().email("Invalid email address").trim(),
  phone: z.string().min(10, "Invalid phone number").trim(),
  country: z.string().min(1, "Country is required").trim(),
  address: z.string().min(1, "Address is required").trim(),
  city: z.string().min(1, "City is required").trim(),
  zip: z.string().min(5, "Invalid ZIP code").trim(),
  paymentMethod: z.enum(["upi", "card", "cod", "razorpay"]),
  upiId: z.string().min(3, "Invalid UPI ID").trim().optional(),
  transactionRef: z.string().min(1, "Transaction reference is required"),
  hasPaid: z.boolean(),
  razorpayPaymentId: z.string().trim().optional(),
  razorpayOrderId: z.string().trim().optional(),
  razorpaySignature: z.string().trim().optional(),
});

export const createRazorpayOrderSchema = checkoutSchema
  .omit({
    transactionRef: true,
    hasPaid: true,
    razorpayPaymentId: true,
    razorpayOrderId: true,
    razorpaySignature: true,
  })
  .extend({
    paymentMethod: z.literal("razorpay"),
  });

export const verifyRazorpayPaymentSchema = createRazorpayOrderSchema.extend({
  razorpayPaymentId: z.string().min(1, "Razorpay payment id is required"),
  razorpayOrderId: z.string().min(1, "Razorpay order id is required"),
  razorpaySignature: z.string().min(1, "Razorpay signature is required"),
});

export const isThisString = z.object({ search: z.string() });
