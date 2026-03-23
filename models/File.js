const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: String,
  path: String,
  size: Number,
  userId: String
}, { timestamps: true });

module.exports = mongoose.model("File", fileSchema);