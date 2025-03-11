const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
require("dotenv").config(); // To load environment variables

//!User Registration
const usersController = {
  //!Register
  register: asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    //!Validate
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    //!Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    //!Hash the user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    //! Create the user and save into db
    const userCreated = await User.create({
      email,
      username,
      password: hashedPassword,
    });
    //! Send the response
    res.status(201).json({
      username: userCreated.username,
      email: userCreated.email,
      id: userCreated._id,
    });
  }),

  //!Login
  login: asyncHandler(async (req, res) => {
    //! Get the user data
    const { email, password } = req.body;
    //!check if email is valid
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid login credentials" });
    }
    //! Compare the user password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid login credentials" });
    }
    //! Generate a token using the secret from .env file
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d", // Token expiration set to 30 days
    });
    //!Send the response with token
    res.status(200).json({
      message: "Login Success",
      token,
      id: user._id,
      email: user.email,
      username: user.username,
    });
  }),

  //!Profile
  profile: asyncHandler(async (req, res) => {
    //! Ensure user is authenticated and userId is present in req.user
    const userId = req.user; // req.user should be set by a middleware (like JWT Auth middleware)
    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    //! Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    //!Send the response with user data
    res.status(200).json({ username: user.username, email: user.email });
  }),

  //! Change password
  changeUserPassword: asyncHandler(async (req, res) => {
    const { newPassword } = req.body;
    //! Ensure user is authenticated and userId is present in req.user
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    //! Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //! Hash the new password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;

    //! ReSave the user with the new password
    await user.save({
      validateBeforeSave: false,
    });

    //!Send the response
    res.status(200).json({ message: "Password Changed successfully" });
  }),

  //! Update user profile
  updateUserProfile: asyncHandler(async (req, res) => {
    const { email, username } = req.body;

    //! Ensure user is authenticated and userId is present in req.user
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    //! Find and update the user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { email, username },
      { new: true }
    );

    //! Check if user exists
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User profile updated successfully",
      updatedUser,
    });
  }),
};

module.exports = usersController;
