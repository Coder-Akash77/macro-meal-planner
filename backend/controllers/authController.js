
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
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 80
    ) {
      return res.status(400).json({
        error: "Name must be between 2 and 80 characters",
      });
    }

    if (!validEmail(email)) {
      return res.status(400).json({
        error: "Please provide a valid email address",
      });
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 72) {
      return res.status(400).json({
        error: "Password must be between 8 and 72 characters",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: "Authentication is not configured on the server",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists",
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
      return res.status(409).json({
        error: "An account with this email already exists",
      });
    }

    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!validEmail(email) || typeof password !== "string" || !password) {
      return res.status(400).json({
        error: "Valid email and password are required",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: "Authentication is not configured on the server",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: "Invalid email or password",
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
