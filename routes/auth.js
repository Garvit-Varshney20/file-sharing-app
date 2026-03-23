const express = require("express");
const router = express.Router();
const multer = require("multer");

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const File = require("../models/File");
const authMiddleware = require("../middleware/authMiddleware");

const aws = require("aws-sdk");
const multerS3 = require("multer-s3");

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION
});


const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,

    contentType: multerS3.AUTO_CONTENT_TYPE, 

    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "-" + file.originalname);
    }
  })
});


router.post("/upload", authMiddleware, upload.array("files", 5), async (req, res) => {
  try {
    const files = req.files;

    const savedFiles = [];

    for (let file of files) {
      const newFile = new File({
        filename: file.key,
        path: file.location,
        size: file.size,
        userId: req.user.userId
      });

      await newFile.save();
      savedFiles.push(newFile);
    }

    res.json({
      message: "Multiple files uploaded to S3 ✅",
      files: savedFiles
    });

  } catch (err) {
    console.error(err); 
    res.status(500).send("Error uploading files");
  }
});

router.get("/test", (req, res) => {
  res.send("Auth route working ✅");
});

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword
    });

    await user.save();

    res.send("User registered ✅");
  } catch (err) {
    res.status(500).send("Error creating user");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.status(400).send("User not found");

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) return res.status(400).send("Wrong password");

  const token = jwt.sign(
    { userId: user._id ,email: user.email },
    "secretkey",
    { expiresIn: "1d" }
  );

  res.json({ token });
});

router.get("/profile", authMiddleware, (req, res) => {
  res.send(`Welcome user ${req.user.userId} 🎉`);
});

router.get("/files", authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.userId });
    res.json(files);
  } catch (err) {
    res.status(500).send("Error fetching files");
  }
});

module.exports = router;

router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const fileId = req.params.id;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).send("File not found");
    }

    if (file.userId.toString() !== req.user.userId) {
      return res.status(403).send("Unauthorized");
    }

    await s3.deleteObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.filename 
    }).promise();

    await File.findByIdAndDelete(fileId);

    res.json({ message: "File deleted successfully 🗑️" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting file");
  }
});
