const User = require("../database/models/user");
const { createSecretToken } = require("../tokenGeneration/generateToken");
const bcrypt = require("bcrypt");

const createUser = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ message: "User already exists. Please login." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            username,
            email,
            password: hashedPassword,
        });

        const savedUser = await newUser.save();
        const token = createSecretToken(savedUser._id);

        res.cookie("token", token, {
            path: "/",
            expires: new Date(Date.now() +  3 * 24 * 60 * 60 * 1000),
            secure: true,
            httpOnly: true,
            sameSite: "None",
        });

        console.log("User created successfully");

        res.status(201).json({ user: { id: savedUser._id, name: savedUser.name, email: savedUser.email } });

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = createUser;