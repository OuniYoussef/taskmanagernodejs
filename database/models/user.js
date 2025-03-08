const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    password: { type: String, required: true },
}, { timestamps: true });  // Automatically adds `createdAt` and `updatedAt`

module.exports = mongoose.model("User", userSchema);