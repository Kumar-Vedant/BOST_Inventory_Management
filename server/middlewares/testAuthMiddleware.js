require("dotenv").config();

const jwt = require("jsonwebtoken");

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    // Use req.userRoles (plural) and check if any role matches allowedRoles
    // If req.userRoles is an array, check if intersection is not empty
    // if (
    //   !req.userRoles ||
    //   !req.userRoles.some(role => allowedRoles.includes(role))
    // ) {
    //   return res.status(403).json({ error: "Access forbidden: insufficient privileges" });
    // }
    next();
  };
}

function verifyToken(req, res, next) {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  try {
    // If you want to test without JWT decoding, comment the next two lines and use mock data:
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.userId = decoded.userId;
    // req.userRoles = decoded.userRoles;

    // Mock user data for testing:
    req.userId = "683f3f0a478e1d8b1e4f23f9";
    req.userRoles = "Admin";  // must be an array

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { verifyToken, authorizeRoles };
