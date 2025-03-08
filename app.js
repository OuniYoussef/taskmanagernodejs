require('dotenv').config(); // ✅ Load environment variables first

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
// 🔹 Initialize Express App
const app = express();
const PORT = process.env.PORT || 8000;

// 🔹 Connect to Database
connectDB();

// 🔹 Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// 🔹 Auth Check Route (Ensures WebSocket starts only for logged-in users)
app.get("/api/auth-check", (req, res) => {
    if (req.cookies && req.cookies.token) {
        return res.json({ authenticated: true });
    } else {
        return res.json({ authenticated: false });
    }
});
app.get("/", verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});


// 🔹 CORS Middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

// 🔹 Routes
const indexRouter = require('./routes/index');
app.use('/', indexRouter);
app.use('/api/tasks', taskRoutes);
app.use('/api', authRoute);

// 🔹 Create HTTP & WebSocket Server (after initializing `app`)
const server = http.createServer(app);
global.io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"]
    }
});

// 🔹 WebSocket Connection
global.io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
    });
});

// 🔹 Start Server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// 🔹 Export app and WebSocket server
module.exports = { app };
