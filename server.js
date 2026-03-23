const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// 🔥 IMPORTANT: frontend serve karne ke liye
app.use(express.static("frontend"));

app.use("/api/auth", require("./routes/auth"));

// MongoDB connect
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected ✅"))
.catch(err => console.log(err));

// Test route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});