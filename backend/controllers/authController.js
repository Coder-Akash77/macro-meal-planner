
const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function createToken(userId) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function validEmail(email) {
  return (
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

exports.register = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const message = "Database connection is unavailable. Please try again later.";
      return res.status(503).json({
        message,
        error: message,
      });
    }

    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 80
    ) {
      const message = "Name must be between 2 and 80 characters";
      return res.status(400).json({
        message,
        error: message,
      });
    }

    if (!validEmail(email)) {
      const message = "Please provide a valid email address";
      return res.status(400).json({
        message,
        error: message,
      });
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 72) {
      const message = "Password must be between 8 and 72 characters";
      return res.status(400).json({
        message,
        error: message,
      });
    }

    if (!process.env.JWT_SECRET) {
      const message = "Authentication is not configured on the server";
      return res.status(500).json({
        message,
        error: message,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      const message = "An account with this email already exists";
      return res.status(409).json({
        message,
        error: message,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = createToken(user._id.toString());

    return res.status(201).json({
      message: "Account created successfully",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      const message = "An account with this email already exists";
      return res.status(409).json({
        message,
        error: message,
      });
    }

    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const message = "Database connection is unavailable. Please try again later.";
      return res.status(503).json({
        message,
        error: message,
      });
    }

    const { email, password } = req.body || {};

    if (!validEmail(email) || typeof password !== "string" || !password) {
      const message = "Valid email and password are required";
      return res.status(400).json({
        message,
        error: message,
      });
    }

    if (!process.env.JWT_SECRET) {
      const message = "Authentication is not configured on the server";
      return res.status(500).json({
        message,
        error: message,
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      const message = "Invalid email or password";
      return res.status(401).json({
        message,
        error: message,
      });
    }

    const token = createToken(user._id.toString());

    return res.status(200).json({
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res) => {
  return res.status(200).json({
    user: publicUser(req.user),
  });
};
