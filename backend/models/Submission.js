const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  questionMarks: {
    type: Number,
    default: 10
  },
  answerText: {
    type: String,
    default: "",
    trim: true
  }
});

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true
    },
    studentEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    studentDepartment: {
      type: String,
      required: true,
      trim: true
    },
    studentSection: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    title: {
      type: String,
      required: [true, "Submission title is required"],
      trim: true
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true
    },
    mode: {
      type: String,
      enum: ["online", "offline"],
      default: "offline"
    },
    // For Offline mode (PDF or Word document up to 20MB)
    fileName: {
      type: String,
      default: ""
    },
    fileType: {
      type: String,
      default: ""
    },
    fileSize: {
      type: Number,
      default: 0
    },
    fileData: {
      type: String,
      default: ""
    },
    // For Online mode (Written answers in portal)
    answers: [answerSchema],
    studentNote: {
      type: String,
      default: "",
      trim: true
    },
    status: {
      type: String,
      enum: ["submitted", "graded", "rejected"],
      default: "submitted",
      index: true
    },
    marks: {
      type: Number,
      default: null
    },
    maxMarks: {
      type: Number,
      default: 100
    },
    feedback: {
      type: String,
      default: "",
      trim: true
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: {
      type: Date
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedByName: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

submissionSchema.index({ assignmentId: 1, studentId: 1 });

module.exports =
  mongoose.models.Submission || mongoose.model("Submission", submissionSchema);
