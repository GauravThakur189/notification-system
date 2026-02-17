const express = require("express");
const { connectDB } = require("./models");
require('dotenv').config();
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send(`Smart Notification System running on port ${PORT}`);
});

// Error Handler
app.use(errorHandler);


app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});