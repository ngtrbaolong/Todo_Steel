import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
        console.log("Liên kết MongoDB thành công");
    } catch (error) {
        console.error("Lỗi khi kết nối MongoDB:", error);
        process.exit(1);
    }
};