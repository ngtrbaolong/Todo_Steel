// src/controllers/authController.js
import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_EXPIRES || "30m";
const REFRESH_TOKEN_TTL_MS = Number(process.env.REFRESH_TOKEN_EXPIRES_MS) || 14 * 24 * 60 * 60 * 1000; // 14 ngày

// helper: cookie options tùy môi trường
const getRefreshCookieOptions = () => {
    const isProd = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProd, // secure true chỉ dùng trong production (https)
        sameSite: isProd ? "none" : "lax",
        maxAge: REFRESH_TOKEN_TTL_MS,
        path: "/",
    };
};

export const signUp = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body;

        if (!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json({
                message: "Không thể thiếu username, password, email, firstName và lastName",
            });
        }

        const duplicate = await User.findOne({ username });
        if (duplicate) {
            return res.status(409).json({ message: "username đã tồn tại" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            hashedPassword,
            email,
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`,
        });

        // trả về user tối giản (không có password)
        const safeUser = {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            displayName: newUser.displayName,
        };

        return res.status(201).json({ message: "Đăng ký thành công", user: safeUser });
    } catch (error) {
        console.error("[authController.signUp] error:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const signIn = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Thiếu username hoặc password." });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "username hoặc password không chính xác" });
        }

        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if (!passwordCorrect) {
            return res.status(401).json({ message: "username hoặc password không chính xác" });
        }

        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        // refresh token (random string) + persist in Session collection
        const refreshToken = crypto.randomBytes(64).toString("hex");
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        });

        // set cookie (options depend on env)
        res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

        // trả về accessToken và user (safe)
        const safeUser = {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        };

        return res.status(200).json({
            message: `User ${safeUser.displayName} đã đăng nhập!`,
            accessToken,
            user: safeUser,
        });
    } catch (error) {
        console.error("[authController.signIn] error:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const signOut = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            await Session.deleteOne({ refreshToken: token });
            // clear cookie với cùng options (path, sameSite, secure)
            res.clearCookie("refreshToken", {
                path: "/",
                ...(process.env.NODE_ENV === "production"
                    ? { sameSite: "none", secure: true }
                    : { sameSite: "lax", secure: false }),
            });
        }
        return res.sendStatus(204);
    } catch (error) {
        console.error("[authController.signOut] error:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            return res.status(401).json({ message: "Token không tồn tại." });
        }

        const session = await Session.findOne({ refreshToken: token });
        if (!session) {
            return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
        }

        if (session.expiresAt < new Date()) {
            await Session.deleteOne({ refreshToken: token }); // optional: cleanup
            return res.status(403).json({ message: "Token đã hết hạn." });
        }

        const accessToken = jwt.sign(
            { userId: session.userId },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        return res.status(200).json({ accessToken });
    } catch (error) {
        console.error("[authController.refreshToken] error:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
