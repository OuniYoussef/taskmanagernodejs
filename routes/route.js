const express = require("express");

const login = require("../controller/login");
const createUser = require("../controller/Signup");

const router = express.Router();

router.post("/signup", createUser);
router.post("/login", login);
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/api/login.html");
});
module.exports = router;