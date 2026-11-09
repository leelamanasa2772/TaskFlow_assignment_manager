const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const auth = require("../middleware/auth");

const router = express.Router();

// Register (Faculty or Student)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "student", department, section } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required."
      });
    }

    const normalizedRole = role.toLowerCase().trim();
    if (!["student", "faculty"].includes(normalizedRole)) {
      return res.status(400).json({
        message: "Role must be either 'student' or 'faculty'."
      });
    }

    if (!department?.trim()) {
      return res.status(400).json({
        message: "Department is required (e.g., Computer Science & Engineering, Information Technology)."
      });
    }

    if (!section?.trim()) {
      return res.status(400).json({
        message: "Section is required (e.g., Section A, Section B)."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedDepartment = department.trim();
    const normalizedSection = section.trim().toUpperCase();

    // Check if an account with this email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      const existingRoleLabel =
        existingUser.role === "faculty" ? "Faculty / Teacher" : "Student";
      return res.status(409).json({
        message: `An account with this email already exists as a ${existingRoleLabel}. Teacher and student emails cannot be the same.`
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let newUser;
    if (normalizedRole === "faculty") {
      newUser = await Teacher.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "faculty",
        department: normalizedDepartment,
        section: normalizedSection
      });
    } else {
      newUser = await Student.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "student",
        department: normalizedDepartment,
        section: normalizedSection
      });
    }

    const token = jwt.sign(
      {
        userId: newUser._id,
        role: newUser.role,
        department: newUser.department,
        section: newUser.section
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: `${normalizedRole === "faculty" ? "Faculty" : "Student"} account created successfully.`,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        section: newUser.section
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: error.message || "Failed to create account. Please try again."
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    // Default department if older record
    const userDepartment = user.department || "Computer Science & Engineering";

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        department: userDepartment,
        section: user.section
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: userDepartment,
        section: user.section
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: error.message || "An unexpected error occurred during login."
    });
  }
});

// Get current user profile
router.get("/me", auth, async (req, res) => {
  try {
    return res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department || "Computer Science & Engineering",
        section: req.user.section
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch user profile." });
  }
});

module.exports = router;
