const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: ["student", "faculty"],
      default: "student"
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      default: "Computer Science & Engineering"
    },
    section: {
      type: String,
      required: [true, "Section is required"],
      trim: true,
      uppercase: true
    }
  },
  {
    timestamps: true,
    discriminatorKey: "role"
  }
);

// Prevent re-compilation of model in dev/hot reload
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
