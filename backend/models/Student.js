const mongoose = require("mongoose");
const User = require("./user");

const studentSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    trim: true,
    default: ""
  }
});

const Student =
  User.discriminators?.student || User.discriminator("student", studentSchema);

module.exports = Student;
