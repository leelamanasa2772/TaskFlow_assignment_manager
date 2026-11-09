const express = require("express");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const User = require("../models/user");
const auth = require("../middleware/auth");

const router = express.Router();

// Helper: check if file is PDF or Word Document
const isPdfOrWord = (fileName = "", fileType = "") => {
  const lowerName = fileName.toLowerCase();
  const lowerType = fileType.toLowerCase();
  const validExtensions = [".pdf", ".doc", ".docx"];
  const validMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
  const hasValidMime = validMimes.some((mime) => lowerType.includes(mime));

  return hasValidExt || hasValidMime;
};

// 1. Get assignments for the logged-in user based on Department & Section
router.get("/", auth, async (req, res) => {
  try {
    const user = req.user;
    const userDepartment = (user.department || "Computer Science & Engineering").trim();

    if (user.role === "faculty") {
      // Faculty sees assignments in their Department matching their section or created by them
      const assignments = await Assignment.find({
        $or: [
          { createdBy: user._id },
          {
            department: new RegExp(`^${userDepartment}$`, "i"),
            section: user.section
          }
        ]
      }).sort({ createdAt: -1 });

      const assignmentIds = assignments.map((a) => a._id);
      const submissions = await Submission.find({
        assignmentId: { $in: assignmentIds }
      });

      const totalStudents = await User.countDocuments({
        role: "student",
        department: new RegExp(`^${userDepartment}$`, "i"),
        section: user.section
      });

      const enriched = assignments.map((item) => {
        const obj = item.toObject();
        const itemSubs = submissions.filter(
          (s) => s.assignmentId.toString() === item._id.toString()
        );

        obj.totalSubmissions = itemSubs.length;
        obj.pendingReviews = itemSubs.filter((s) => s.status === "submitted").length;
        obj.gradedCount = itemSubs.filter((s) => s.status === "graded").length;
        obj.rejectedCount = itemSubs.filter((s) => s.status === "rejected").length;
        obj.submissionsCount = (item.completedBy || []).length;
        obj.totalStudents = totalStudents;
        obj.submissionRate =
          totalStudents > 0
            ? Math.round((obj.submissionsCount / totalStudents) * 100)
            : 0;

        return obj;
      });

      return res.json(enriched);
    } else {
      // Student sees assignments where department and section match
      const assignments = await Assignment.find({
        section: user.section,
        $or: [
          { department: new RegExp(`^${userDepartment}$`, "i") },
          { department: { $exists: false } },
          { department: null },
          { department: "" }
        ]
      }).sort({ dueDate: 1 });

      const assignmentIds = assignments.map((a) => a._id);
      const studentSubmissions = await Submission.find({
        assignmentId: { $in: assignmentIds },
        studentId: user._id
      });

      const studentAssignments = assignments.map((item) => {
        const obj = item.toObject();
        const submission = studentSubmissions.find(
          (s) => s.assignmentId.toString() === item._id.toString()
        );

        if (submission) {
          obj.mySubmission = {
            id: submission._id,
            mode: submission.mode,
            status: submission.status,
            marks: submission.marks,
            maxMarks: submission.maxMarks,
            feedback: submission.feedback,
            rejectionReason: submission.rejectionReason,
            fileName: submission.fileName,
            fileType: submission.fileType,
            fileSize: submission.fileSize,
            answers: submission.answers,
            studentNote: submission.studentNote,
            submittedAt: submission.submittedAt,
            reviewedAt: submission.reviewedAt,
            reviewedByName: submission.reviewedByName
          };
          obj.submissionStatus = submission.status;
          obj.completed = submission.status === "graded";
        } else {
          obj.mySubmission = null;
          obj.submissionStatus = "not_submitted";
          const isCompleted = (item.completedBy || []).some(
            (studentId) => studentId.toString() === user._id.toString()
          );
          obj.completed = isCompleted;
        }

        return obj;
      });

      return res.json(studentAssignments);
    }
  } catch (error) {
    console.error("Error loading assignments:", error);
    return res.status(500).json({ message: "Could not load assignments." });
  }
});

// 2. Add an assignment (FACULTY ONLY)
// - mode: 'offline' -> Students write on paper & upload PDF/Word doc up to 20MB
// - mode: 'online'  -> Faculty prepares questions & students write the exam in portal
router.post("/", auth, async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "faculty") {
      return res.status(403).json({
        message: "Access denied. Only faculty members can add assignments."
      });
    }

    const {
      title,
      subject,
      dueDate,
      section,
      department,
      mode = "offline",
      maxMarks = 100,
      instructions = "",
      questions = []
    } = req.body;

    if (!title?.trim() || !subject?.trim() || !dueDate) {
      return res.status(400).json({
        message: "Title, subject, and due date are required."
      });
    }

    const targetSection = (section || user.section).trim().toUpperCase();
    const targetDepartment = (department || user.department || "Computer Science & Engineering").trim();
    const assignmentMode = mode === "online" ? "online" : "offline";

    // Clean and validate questions if online exam
    let cleanedQuestions = [];
    let calculatedMaxMarks = Number(maxMarks) || 100;

    if (assignmentMode === "online") {
      if (Array.isArray(questions) && questions.length > 0) {
        cleanedQuestions = questions
          .filter((q) => q && q.questionText && q.questionText.trim())
          .map((q, idx) => ({
            questionNumber: idx + 1,
            questionText: q.questionText.trim(),
            marks: Number(q.marks) || 10
          }));

        if (cleanedQuestions.length > 0) {
          calculatedMaxMarks = cleanedQuestions.reduce(
            (acc, curr) => acc + (curr.marks || 0),
            0
          );
        }
      }

      if (cleanedQuestions.length === 0) {
        return res.status(400).json({
          message: "Please add at least one question for this online exam."
        });
      }
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      subject: subject.trim(),
      dueDate,
      department: targetDepartment,
      section: targetSection,
      mode: assignmentMode,
      maxMarks: calculatedMaxMarks,
      instructions: instructions.trim(),
      questions: cleanedQuestions,
      createdBy: user._id,
      teacherName: user.name,
      teacherEmail: user.email,
      completedBy: [],
      completed: false
    });

    const totalStudents = await User.countDocuments({
      role: "student",
      department: new RegExp(`^${targetDepartment}$`, "i"),
      section: targetSection
    });

    const responseObj = assignment.toObject();
    responseObj.submissionsCount = 0;
    responseObj.totalStudents = totalStudents;
    responseObj.submissionRate = 0;
    responseObj.totalSubmissions = 0;
    responseObj.pendingReviews = 0;
    responseObj.gradedCount = 0;
    responseObj.rejectedCount = 0;

    return res.status(201).json(responseObj);
  } catch (error) {
    console.error("Error creating assignment:", error);
    return res.status(500).json({
      message: error.message || "Could not add assignment."
    });
  }
});

// 3. Submit assignment:
// - If assignment.mode === 'offline': student uploads PDF or Word doc (limit 20MB)
// - If assignment.mode === 'online': student submits written exam answers
router.post("/:id/submit", auth, async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "student") {
      return res.status(403).json({
        message: "Access denied. Only students can submit assignments."
      });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    // Check if student belongs to same department and section
    const studentDept = (user.department || "").trim().toLowerCase();
    const assignDept = (assignment.department || "").trim().toLowerCase();

    if (studentDept && assignDept && studentDept !== assignDept) {
      return res.status(403).json({
        message: `This assignment belongs to ${assignment.department}. You belong to ${user.department}.`
      });
    }

    if (assignment.section !== user.section) {
      return res.status(403).json({
        message: `This assignment is for Section ${assignment.section}. You are registered in Section ${user.section}.`
      });
    }

    const {
      name,
      title,
      subject,
      fileName,
      fileType,
      fileSize,
      fileData,
      answers,
      studentNote = ""
    } = req.body;

    const submissionTitle = (title || assignment.title).trim();
    const submissionSubject = (subject || assignment.subject).trim();
    const studentName = (name || user.name).trim();

    // Mode-specific validation
    if (assignment.mode === "offline") {
      // OFFLINE MODE: PDF or Word document upload (Limit 20MB)
      if (!fileName || !fileData) {
        return res.status(400).json({
          message: "Please attach your written assignment document (PDF or Word)."
        });
      }

      if (!isPdfOrWord(fileName, fileType)) {
        return res.status(400).json({
          message: "Invalid file format. Only PDF (.pdf) and Word documents (.doc, .docx) are accepted."
        });
      }

      const limitBytes = 20 * 1024 * 1024; // 20 MB
      if (fileSize && fileSize > limitBytes) {
        return res.status(400).json({
          message: "File size exceeds the 20MB limit. Please upload a smaller file."
        });
      }
    } else {
      // ONLINE MODE: Written exam answers in portal
      if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
          message: "Please provide your answers for the exam questions."
        });
      }
    }

    // Check if student already submitted
    let submission = await Submission.findOne({
      assignmentId: assignment._id,
      studentId: user._id
    });

    if (submission) {
      if (submission.status === "graded") {
        return res.status(400).json({
          message: "This assignment has already been evaluated and approved by your faculty."
        });
      }

      // Re-submitting or updating
      submission.studentName = studentName;
      submission.title = submissionTitle;
      submission.subject = submissionSubject;
      submission.mode = assignment.mode;
      submission.studentNote = studentNote.trim();
      submission.status = "submitted";
      submission.submittedAt = new Date();
      submission.rejectionReason = "";
      submission.feedback = "";

      if (assignment.mode === "offline") {
        submission.fileName = fileName;
        submission.fileType = fileType || "application/pdf";
        submission.fileSize = fileSize || 0;
        submission.fileData = fileData;
        submission.answers = [];
      } else {
        submission.answers = answers.map((ans, idx) => ({
          questionNumber: ans.questionNumber || idx + 1,
          questionText: ans.questionText || `Question ${idx + 1}`,
          questionMarks: ans.questionMarks || 10,
          answerText: (ans.answerText || "").trim()
        }));
        submission.fileName = "";
        submission.fileData = "";
      }

      await submission.save();

      return res.json({
        message:
          assignment.mode === "online"
            ? "Online exam answers submitted successfully! Sent to faculty for grading."
            : "Assignment document re-submitted successfully (20MB limit verified)! Sent to faculty.",
        submission: {
          id: submission._id,
          status: submission.status,
          mode: submission.mode,
          fileName: submission.fileName,
          submittedAt: submission.submittedAt
        }
      });
    } else {
      // Create new submission
      const newSubmissionData = {
        assignmentId: assignment._id,
        studentId: user._id,
        studentName,
        studentEmail: user.email,
        studentDepartment: user.department || assignment.department,
        studentSection: user.section,
        title: submissionTitle,
        subject: submissionSubject,
        mode: assignment.mode,
        studentNote: studentNote.trim(),
        status: "submitted",
        maxMarks: assignment.maxMarks || 100,
        submittedAt: new Date()
      };

      if (assignment.mode === "offline") {
        newSubmissionData.fileName = fileName;
        newSubmissionData.fileType = fileType || "application/pdf";
        newSubmissionData.fileSize = fileSize || 0;
        newSubmissionData.fileData = fileData;
        newSubmissionData.answers = [];
      } else {
        newSubmissionData.answers = answers.map((ans, idx) => ({
          questionNumber: ans.questionNumber || idx + 1,
          questionText: ans.questionText || `Question ${idx + 1}`,
          questionMarks: ans.questionMarks || 10,
          answerText: (ans.answerText || "").trim()
        }));
      }

      submission = await Submission.create(newSubmissionData);

      return res.status(201).json({
        message:
          assignment.mode === "online"
            ? "Online exam submitted successfully! Sent to faculty dashboard."
            : "Assignment document submitted successfully to faculty dashboard!",
        submission: {
          id: submission._id,
          status: submission.status,
          mode: submission.mode,
          fileName: submission.fileName,
          submittedAt: submission.submittedAt
        }
      });
    }
  } catch (error) {
    console.error("Error submitting assignment:", error);
    return res.status(500).json({
      message: error.message || "Failed to submit assignment. Please try again."
    });
  }
});

// 4. View all submissions for an assignment (FACULTY ONLY)
router.get("/:id/submissions", auth, async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "faculty") {
      return res.status(403).json({
        message: "Access denied. Only faculty members can view submissions."
      });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    const submissions = await Submission.find({
      assignmentId: assignment._id
    }).sort({ submittedAt: -1 });

    return res.json({
      assignment: {
        id: assignment._id,
        title: assignment.title,
        subject: assignment.subject,
        dueDate: assignment.dueDate,
        department: assignment.department,
        section: assignment.section,
        mode: assignment.mode,
        maxMarks: assignment.maxMarks || 100,
        questions: assignment.questions || [],
        instructions: assignment.instructions || ""
      },
      submissions
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return res.status(500).json({ message: "Could not load submissions." });
  }
});

// 5. Faculty assigns marks and approves submission (FACULTY ONLY)
router.patch("/:id/submissions/:submissionId/grade", auth, async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "faculty") {
      return res.status(403).json({
        message: "Access denied. Only faculty can assign marks."
      });
    }

    const { marks, feedback = "" } = req.body;

    if (marks === undefined || marks === null || isNaN(marks)) {
      return res.status(400).json({ message: "Please provide a valid marks value." });
    }

    const numMarks = Number(marks);
    if (numMarks < 0) {
      return res.status(400).json({ message: "Marks cannot be negative." });
    }

    const submission = await Submission.findOne({
      _id: req.params.submissionId,
      assignmentId: req.params.id
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found." });
    }

    const maxMarks = submission.maxMarks || 100;
    if (numMarks > maxMarks) {
      return res.status(400).json({
        message: `Marks cannot exceed maximum marks (${maxMarks}).`
      });
    }

    submission.status = "graded";
    submission.marks = numMarks;
    submission.feedback = feedback.trim();
    submission.rejectionReason = "";
    submission.reviewedBy = user._id;
    submission.reviewedByName = user.name;
    submission.reviewedAt = new Date();

    await submission.save();

    // Add student to assignment.completedBy
    const assignment = await Assignment.findById(req.params.id);
    if (assignment) {
      const studentIdStr = submission.studentId.toString();
      const alreadyCompleted = (assignment.completedBy || []).some(
        (id) => id.toString() === studentIdStr
      );
      if (!alreadyCompleted) {
        assignment.completedBy.push(submission.studentId);
        await assignment.save();
      }
    }

    return res.json({
      message: `Marks (${numMarks}/${maxMarks}) assigned successfully! Submission marked as approved.`,
      submission
    });
  } catch (error) {
    console.error("Error grading submission:", error);
    return res.status(500).json({ message: "Could not assign marks." });
  }
});

// 6. Faculty rejects submission with a message (FACULTY ONLY)
router.patch("/:id/submissions/:submissionId/reject", auth, async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "faculty") {
      return res.status(403).json({
        message: "Access denied. Only faculty can reject submissions."
      });
    }

    const { rejectionReason = "" } = req.body;

    if (!rejectionReason?.trim()) {
      return res.status(400).json({
        message: "Please provide a reason for rejection so the student knows what to correct before re-submitting."
      });
    }

    const submission = await Submission.findOne({
      _id: req.params.submissionId,
      assignmentId: req.params.id
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found." });
    }

    submission.status = "rejected";
    submission.marks = null;
    submission.rejectionReason = rejectionReason.trim();
    submission.feedback = rejectionReason.trim();
    submission.reviewedBy = user._id;
    submission.reviewedByName = user.name;
    submission.reviewedAt = new Date();

    await submission.save();

    // Remove student from assignment.completedBy if present
    const assignment = await Assignment.findById(req.params.id);
    if (assignment) {
      const studentIdStr = submission.studentId.toString();
      assignment.completedBy = (assignment.completedBy || []).filter(
        (id) => id.toString() !== studentIdStr
      );
      await assignment.save();
    }

    return res.json({
      message: "Submission rejected. The student will be notified on their dashboard to re-submit.",
      submission
    });
  } catch (error) {
    console.error("Error rejecting submission:", error);
    return res.status(500).json({ message: "Could not reject submission." });
  }
});

// 7. Toggle completion status
router.patch("/:id", auth, async (req, res) => {
  try {
    const user = req.user;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    if (user.role === "student") {
      if (assignment.section !== user.section) {
        return res.status(403).json({
          message: "You can only interact with assignments in your section."
        });
      }

      const studentIdStr = user._id.toString();
      const existingIndex = assignment.completedBy.findIndex(
        (id) => id.toString() === studentIdStr
      );

      let isNowCompleted = false;
      if (existingIndex > -1) {
        assignment.completedBy.splice(existingIndex, 1);
        isNowCompleted = false;
      } else {
        assignment.completedBy.push(user._id);
        isNowCompleted = true;
      }

      await assignment.save();

      const obj = assignment.toObject();
      obj.completed = isNowCompleted;
      return res.json(obj);
    } else {
      assignment.completed =
        req.body.completed !== undefined
          ? Boolean(req.body.completed)
          : !assignment.completed;

      await assignment.save();

      const totalStudents = await User.countDocuments({
        role: "student",
        department: assignment.department,
        section: assignment.section
      });

      const obj = assignment.toObject();
      obj.submissionsCount = assignment.completedBy.length;
      obj.totalStudents = totalStudents;
      obj.submissionRate =
        totalStudents > 0
          ? Math.round((obj.submissionsCount / totalStudents) * 100)
          : 0;
      return res.json(obj);
    }
  } catch (error) {
    console.error("Error updating assignment:", error);
    return res.status(500).json({ message: "Could not update assignment." });
  }
});

// 8. Delete an assignment (FACULTY ONLY)
router.delete("/:id", auth, async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "faculty") {
      return res.status(403).json({
        message: "Access denied. Only faculty members can delete assignments."
      });
    }

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    if (
      assignment.createdBy.toString() !== user._id.toString() &&
      assignment.section !== user.section
    ) {
      return res.status(403).json({
        message: "You can only delete assignments created for your department & section."
      });
    }

    await Submission.deleteMany({ assignmentId: assignment._id });
    await assignment.deleteOne();

    return res.json({ message: "Assignment and related submissions deleted successfully." });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return res.status(500).json({ message: "Could not delete assignment." });
  }
});

// 9. Data Analytics endpoint
router.get("/analytics", auth, async (req, res) => {
  try {
    const user = req.user;
    const userDepartment = (user.department || "Computer Science & Engineering").trim();

    if (user.role === "faculty") {
      const assignments = await Assignment.find({
        $or: [
          { createdBy: user._id },
          {
            department: new RegExp(`^${userDepartment}$`, "i"),
            section: user.section
          }
        ]
      });

      const students = await User.find({
        role: "student",
        department: new RegExp(`^${userDepartment}$`, "i"),
        section: user.section
      }).select("name email createdAt department section");

      const assignmentIds = assignments.map((a) => a._id);
      const allSubmissions = await Submission.find({
        assignmentId: { $in: assignmentIds }
      });

      const totalAssignments = assignments.length;
      const totalStudents = students.length;

      const subjectMap = {};
      assignments.forEach((item) => {
        const sub = (item.subject || "General").trim();
        if (!subjectMap[sub]) {
          subjectMap[sub] = { subject: sub, count: 0, submissions: 0 };
        }
        subjectMap[sub].count += 1;
        subjectMap[sub].submissions += (item.completedBy || []).length;
      });

      const studentRoster = students.map((st) => {
        const stSubs = allSubmissions.filter(
          (s) => s.studentId.toString() === st._id.toString()
        );
        const gradedCount = stSubs.filter((s) => s.status === "graded").length;
        const pendingCount = totalAssignments - gradedCount;
        const rate =
          totalAssignments > 0
            ? Math.round((gradedCount / totalAssignments) * 100)
            : 0;

        return {
          id: st._id,
          name: st.name,
          email: st.email,
          completedCount: gradedCount,
          pendingCount: Math.max(0, pendingCount),
          rate
        };
      });

      const totalPossibleSubmissions = totalAssignments * totalStudents;
      const actualSubmissions = allSubmissions.filter((s) => s.status === "graded").length;
      const overallSubmissionRate =
        totalPossibleSubmissions > 0
          ? Math.round((actualSubmissions / totalPossibleSubmissions) * 100)
          : 0;

      return res.json({
        role: "faculty",
        department: userDepartment,
        section: user.section,
        totalAssignments,
        totalStudents,
        actualSubmissions,
        totalPossibleSubmissions,
        overallSubmissionRate,
        pendingReviewsCount: allSubmissions.filter((s) => s.status === "submitted").length,
        rejectedCount: allSubmissions.filter((s) => s.status === "rejected").length,
        subjects: Object.values(subjectMap),
        students: studentRoster
      });
    } else {
      const assignments = await Assignment.find({
        section: user.section,
        $or: [
          { department: new RegExp(`^${userDepartment}$`, "i") },
          { department: { $exists: false } },
          { department: null },
          { department: "" }
        ]
      });

      const assignmentIds = assignments.map((a) => a._id);
      const studentSubmissions = await Submission.find({
        assignmentId: { $in: assignmentIds },
        studentId: user._id
      });

      const teachers = await User.find({
        role: "faculty",
        department: new RegExp(`^${userDepartment}$`, "i"),
        section: user.section
      }).select("name email department");

      const total = assignments.length;
      const completedCount = studentSubmissions.filter((s) => s.status === "graded").length;
      const rejectedCount = studentSubmissions.filter((s) => s.status === "rejected").length;
      const pendingReviewCount = studentSubmissions.filter((s) => s.status === "submitted").length;
      const pendingCount = total - completedCount;
      const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

      const subjectMap = {};
      assignments.forEach((item) => {
        const sub = (item.subject || "General").trim();
        const subDone = studentSubmissions.some(
          (s) => s.assignmentId.toString() === item._id.toString() && s.status === "graded"
        );

        if (!subjectMap[sub]) {
          subjectMap[sub] = { subject: sub, count: 0, completed: 0, pending: 0 };
        }
        subjectMap[sub].count += 1;
        if (subDone) {
          subjectMap[sub].completed += 1;
        } else {
          subjectMap[sub].pending += 1;
        }
      });

      return res.json({
        role: "student",
        department: userDepartment,
        section: user.section,
        total,
        completedCount,
        pendingCount,
        rejectedCount,
        pendingReviewCount,
        rate,
        subjects: Object.values(subjectMap),
        teachers: teachers.map((t) => ({ name: t.name, email: t.email, department: t.department }))
      });
    }
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return res.status(500).json({ message: "Could not load analytics data." });
  }
});

module.exports = router;
