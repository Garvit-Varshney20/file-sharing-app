const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Access denied ❌");
  }

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, "secretkey");
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send("Invalid token ❌");
  }
};
