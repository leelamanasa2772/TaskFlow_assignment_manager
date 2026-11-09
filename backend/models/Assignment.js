const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true
  },
  questionText: {
    type: String,
    required: [true, "Question text is required"],
    trim: true
  },
  marks: {
    type: Number,
    default: 10
  }
});

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true
    },
    dueDate: {
      type: String,
      required: [true, "Due date is required"]
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
    },
    mode: {
      type: String,
      enum: ["online", "offline"],
      default: "offline"
    },
    maxMarks: {
      type: Number,
      default: 100
    },
    instructions: {
      type: String,
      default: "",
      trim: true
    },
    // Questions prepared by faculty for Online assignments / exams
    questions: [questionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Faculty creator is required"]
    },
    teacherName: {
      type: String,
      default: "Faculty"
    },
    teacherEmail: {
      type: String,
      default: ""
    },
    completedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    completed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);
