const mongoose = require("mongoose");
const User = require("./user");

const teacherSchema = new mongoose.Schema({
  facultyCode: {
    type: String,
    trim: true,
    default: ""
  }
});

const Teacher =
  User.discriminators?.faculty || User.discriminator("faculty", teacherSchema);

module.exports = Teacher;
