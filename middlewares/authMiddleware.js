const jwt = require("jsonwebtoken");
const path = require("path");

const verifyToken = (req, res, next) => {
    if (!req.cookies || !req.cookies.token) {
        // ✅ Handle API requests differently
        if (req.headers.accept && req.headers.accept.includes("application/json")) {
            return res.status(401).json({ message: "Unauthorized, please login." });
        }
        return res.sendFile(path.join(__dirname, "../public/login.html"));
    }

    try {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (req.headers.accept && req.headers.accept.includes("application/json")) {
            return res.status(403).json({ message: "Invalid token, please login again." });
        }
        return res.sendFile(path.join(__dirname, "../public/login.html"));
    }
};

module.exports = verifyToken;