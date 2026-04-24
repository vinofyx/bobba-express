const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const apiResponse = require("../shared/utils/apiResponse");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return apiResponse(res, 401, "Authentication token missing or malformed.");
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const msg = err.name === "TokenExpiredError"
        ? "Session expired. Please log in again."
        : "Invalid token. Please log in again.";
      return apiResponse(res, 401, msg);
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      return apiResponse(res, 401, "Account not found or deactivated.");
    }

    req.user = user;
    next();
  } catch (err) {
    return apiResponse(res, 500, "Authentication error.");
  }
};

module.exports = authenticate;
