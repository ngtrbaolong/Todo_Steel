import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';

const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60; //14 ngày tính bằng giây

export const signUp = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body;
        if (!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json({ message: "Vui lòng điền tất cả các trường bắt buộc." });
        }
        //kiểm tra username hoặc email đã tồn tại chưa
        const duplicate = await User.findOne({ username });
        if (duplicate) {
            return res.status(409).json({ message: "Tên người dùng đã tồn tại. Vui lòng chọn tên khác." });
        }
        //mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        //tao người dùng mới
        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${firstName} ${lastName}`,
        });

        //trả về phản hồi thành công
        res.status(204).json({ message: "Người dùng đã được tạo thành công." });
    } catch (error) {
        console.error("Lỗi đăng ký người dùng:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau." });
    }
};

export const signIn = async (req, res) => {
    try {
        //lấy inputs
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Thiếu usernmae hoặc password" });
        }
        //lấy hashpassword từ db để so sánh với password input
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Sai username hoặc password" });
        }
        //kiểm tra password
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if (!passwordCorrect) {
            return res.status(401).json({ message: "Sai username hoặc password" });
        }
        //nếu khớp, tạo access token với JWT
        const accessToken = jwt.sign({ userId: user._id }
            , process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL });
        //tạo refresh token
        const refreshToken = crypto.randomBytes(64).toString('hex');
        //tạo session mới để lưu refresh token
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        });
        //trả về refresh token cho cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameStite: 'none',
            maxAge: REFRESH_TOKEN_TTL,
        });
        //trả về access token cho res
        return res
            .status(200)
            .json({ message: `User ${user.displayName} đã logged in!`, accessToken });
    } catch (error) {
        console.error("Lỗi đăng nhập người dùng:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau." });
    }
};

export const signOut = async (req, res) => {
    try {
        // lấy refresh token từ cookie
        const token = req.cookies?.refreshToken;
        if (token) {
            // xóa refresh token trong session
            await Session.deleteOne({ refreshToken: token });
            // xóa cookie refresh token
            res.clearCookie('refreshToken');
        }
        return res.status(204).end();
    } catch (error) {
        console.error("Lỗi đăng xuất người dùng:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau." });
    }
};