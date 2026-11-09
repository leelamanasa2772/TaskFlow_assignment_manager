const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication required. Please log in first." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ message: "User account no longer exists. Please log in again." });
    }

    req.user = user;
    req.userRole = user.role;
    req.userSection = user.section;
    req.userDepartment = user.department;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid or expired session. Please log in again." });
  }
};

module.exports = auth;
