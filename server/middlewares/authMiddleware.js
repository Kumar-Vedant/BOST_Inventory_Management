require("dotenv").config();

const jwt = require("jsonwebtoken");

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: "Access forbidden: insufficient privileges" });
    }
    next();
  };
}

function verifyToken(req, res, next) {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  try {
    // decode token and pass it on in req
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRoles = decoded.userRoles;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { verifyToken, authorizeRoles };
