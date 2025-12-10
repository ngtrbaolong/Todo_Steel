// server.js (improved)
import express from "express";
import taskRoute from "./routes/taskRoutes.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMiddleware.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

const app = express();

// If your app runs behind a proxy (nginx / hosting), enable trust proxy
// This matters for secure cookies when using HTTPS behind a proxy.
if (process.env.TRUST_PROXY === "1" || process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// Basic request logging (dev)
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
        console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    }
    next();
});

// middlewares
app.use(express.json());
app.use(cookieParser());

// CORS: single, correct config (support credentials)
const allowedOrigin =
    process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : "http://localhost:5173";

app.use(
    cors({
        origin: allowedOrigin,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
);

// Simple health check
app.get("/health", (req, res) => res.status(200).json({ ok: true }));

// Public routes (no auth)
app.use("/api/auth", authRoute);

// Protect specific routes explicitly.
app.use("/api/users", protectedRoute, userRoute);

// Protect task routes too
app.use("/api/tasks", protectedRoute, taskRoute);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    });
}

// Global error handler (nice JSON response)
app.use((err, req, res, next) => {
    console.error("[GLOBAL ERROR]", err);
    const status = err.status || 500;
    res.status(status).json({
        message: err.message || "Internal Server Error",
    });
});

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to DB", err);
        process.exit(1);
    });
