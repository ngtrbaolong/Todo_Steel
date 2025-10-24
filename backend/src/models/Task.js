import mongoose from 'mongoose';

const taskScheama = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ["active", "complete"],
        default: "active",
    },
    completeAt: {
        type: Date,
        default: null,
    },
}, {
     timestamps: true // createdAt và updateAt tự động thêm vào
    });