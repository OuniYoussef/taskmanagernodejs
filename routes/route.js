const express = require("express");

const login = require("../controller/login");
const createUser = require("../controller/signup");

const router = express.Router();

router.post("/signup", createUser);
router.post("/login", login);
router.get("/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,  // Ensures it matches how the cookie was set
        sameSite: "Strict",
        path: "/",
    });
    res.json({ message: "Logged out successfully" });
});

module.exports = router;