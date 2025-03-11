const jwt = require("jsonwebtoken");

const isAuthenticated = async (req, res, next) => {
  // Get the token from the header
  const token = req.headers?.authorization?.split(" ")[1];
  
  if (!token) {
    const err = new Error("No token, authorization denied");
    res.status(401);
    return next(err);
  }

  try {
    // Verify the token with async/await and the secret from the .env file
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use process.env.JWT_SECRET for security
    req.user = decoded.id; // Attach the user ID to the request object
    next(); // Call next() to continue to the next middleware or route handler
  } catch (err) {
    // Handle token errors like expiration or invalid signature
    const error = new Error("Token is not valid or expired");
    res.status(401); // Unauthorized
    next(error);
  }
};

module.exports = isAuthenticated;
