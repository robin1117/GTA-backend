import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    zip: {
      type: String,
      required: [true, "ZIP code is required"],
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: "upi",
      enum: ["upi", "card", "cod", "netbanking"], // Restricts values to these options
    },
    upiId: {
      type: String,
      trim: true,
      // Validation runs only if the user chooses UPI payment
      required: function () {
        return this.paymentMethod === "upi";
      },
    },
    transactionRef: {
      type: String,
      trim: true,
      default: "",
    },
    hasPaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically creates 'createdAt' and 'updatedAt' fields
  },
);
const Order = mongoose.model("Order", orderSchema);

export default Order;
