import "dotenv/config";
import helmet from "helmet";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import userRoute from "./routes/authRoute.js";
import cookieParser from "cookie-parser";
import { authorization } from "./middleware/auth.js";
import oneceOrderCompleted from "./routes/afterOrderRoutes.js";

await connectDB();

const app = express();
const PORT = process.env.PORT || 3000;
const cookieSecret = process.env.COOKIE_SECRET;

if (!cookieSecret) {
  throw new Error("COOKIE_SECRET is required");
}
console.log(process.env.CLIENT_ORIGIN);
// Global Middleware
app.use(helmet()); // Secures HTTP headers
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
); // Enables cross-origin requests
app.use(express.json()); // Parses incoming JSON requests

app.use(cookieParser(cookieSecret));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

app.use("/auth", userRoute);

app.use("/", authorization, oneceOrderCompleted);

app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  res
    .status(500)
    .json({ error: "Internal Server Error", message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
