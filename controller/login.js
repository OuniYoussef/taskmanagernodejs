const User = require("../database/models/user");
const bcrypt = require("bcrypt");
const env = require("dotenv");
const { createSecretToken } = require("../tokenGeneration/generateToken");

env.config();

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = createSecretToken(user._id);
        res.cookie("token", token, {
            path: "/",
            expires: new Date(Date.now() +  3 * 24 * 60 * 60 * 1000),
            secure: true,
            httpOnly: true,
            sameSite: "None",
        });

        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = login;