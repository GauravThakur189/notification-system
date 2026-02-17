const express = require("express");
const { connectDB } = require("./models");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

app.get("/", (req, res) => {
    res.send(`smart notification system is running on the port ${PORT}`);
});


app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});