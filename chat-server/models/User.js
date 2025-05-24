const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    // Fields from MySQL students table
    first_name: {
        type: String,
        required: true,
        trim: true,
    },
    last_name: {
        type: String,
        required: true,
        trim: true,
    },
    birthday: {
        type: Date,
        required: true,
    },
    // Additional fields for chat functionality
    username: {
        type: String,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: false,
        unique: false,
        trim: true,
    },
    password: {
        type: String,
        required: false,
    },
    avatar: {
        type: String,
        default: "default-avatar.png",
    },
    status: {
        type: String,
        enum: ["online", "offline"],
        default: "offline",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastActive: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("User", userSchema);
