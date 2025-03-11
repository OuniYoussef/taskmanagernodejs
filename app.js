require('dotenv').config(); 

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const connectDB = require('./database/db');
const taskRoutes = require('./routes/taskRoutes');
const authRoute = require("./routes/route");
const http = require('http');
const { Server } = require('socket.io');
const verifyToken = require("./middlewares/authMiddleware");
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 8000;


connectDB();


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get("/api/auth-check", (req, res) => {
    if (req.cookies && req.cookies.token) {
        return res.json({ authenticated: true });
    } else {
        return res.json({ authenticated: false });
    }
});

// Secure routes
app.use((req, res, next) => {
    const publicRoutes = ["/login", "/register","/api/login", "/api/signup"];

    if (publicRoutes.includes(req.path)) {
        return next(); // Allow public access
    }

    verifyToken(req, res, next); // Protect all other routes
});







app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});


const indexRouter = require('./routes/index');
app.use('/', indexRouter);
app.use('/api/tasks', taskRoutes);
app.use('/api', authRoute);
app.use('/api/users', userRoutes);

const server = http.createServer(app);
global.io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"]
    }
});


global.io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
    });
});


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


module.exports = { app };
