import React, { useState, useEffect } from 'react'
import {
  X,
  FileQuestion,
  Award,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Layers,
  Building2,
  Tag,
  Calendar,
  Send,
  HelpCircle,
  Edit3
} from 'lucide-react'

const OnlineExamModal = ({
  assignment,
  student,
  isOpen,
  onClose,
  onSubmitSuccess
}) => {
  if (!isOpen || !assignment) return null

  const isResubmission = assignment.submissionStatus === 'rejected'
  const previousRejectionReason = assignment.mySubmission?.rejectionReason
  const questions = assignment.questions || []

  // Initialize student answers from previous attempt or empty
  const [answers, setAnswers] = useState(() => {
    const prevAnswers = assignment.mySubmission?.answers || []
    return questions.map((q, idx) => {
      const match = prevAnswers.find((pa) => pa.questionNumber === q.questionNumber)
      return {
        questionNumber: q.questionNumber || idx + 1,
        questionText: q.questionText,
        questionMarks: q.marks || 10,
        answerText: match ? match.answerText : ''
      }
    })
  })

  const [studentNote, setStudentNote] = useState(
    assignment.mySubmission?.studentNote || ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnswerChange = (index, value) => {
    const updated = [...answers]
    updated[index].answerText = value
    setAnswers(updated)
  }

  const handleSubmitExam = async (e) => {
    e.preventDefault()
    setError('')

    // Validate that at least some answers are entered
    const hasAnyAnswer = answers.some((a) => a.answerText.trim())
    if (!hasAnyAnswer) {
      setError('Please answer at least one question before submitting your exam.')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('taskflowToken')
      const response = await fetch(
        `http://localhost:5000/api/assignments/${assignment._id}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: student?.name,
            title: assignment.title,
            subject: assignment.subject,
            answers,
            studentNote: studentNote.trim()
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit online exam.')
      }

      onSubmitSuccess(
        isResubmission
          ? 'Online exam re-submitted successfully! Faculty has been notified.'
          : 'Online exam submitted successfully! Sent to faculty for grading.'
      )
      onClose()
    } catch (err) {
      setError(err.message || 'An error occurred during exam submission.')
    } finally {
      setLoading(false)
    }
  }

  const totalAnswered = answers.filter((a) => a.answerText.trim()).length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card online-exam-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-header-info">
            <span className="modal-badge exam-badge">
              <Edit3 size={14} />
              {isResubmission ? 'Re-take Online Exam' : 'Online Examination Portal'}
            </span>
            <h2>{assignment.title}</h2>
            <div className="modal-tags">
              <span className="modal-tag">
                <Tag size={12} /> {assignment.subject}
              </span>
              <span className="modal-tag">
                <Building2 size={12} /> {assignment.department || student?.department}
              </span>
              <span className="modal-tag">
                <Layers size={12} /> Sec {assignment.section}
              </span>
              <span className="modal-tag exam-marks-tag">
                <Award size={12} /> Total Marks: {assignment.maxMarks || 100}
              </span>
              <span className="modal-tag">
                <Calendar size={12} /> Due: {assignment.dueDate}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Rejection Alert Notice if student was asked to re-take/re-submit */}
        {isResubmission && previousRejectionReason && (
          <div className="rejection-notice-box">
            <div className="notice-header">
              <AlertTriangle size={18} />
              <strong>Faculty Rejection Feedback:</strong>
            </div>
            <p className="notice-body">"{previousRejectionReason}"</p>
            <span className="notice-tip">
              Please review the feedback above and revise your answers to the questions below.
            </span>
          </div>
        )}

        {/* Exam instructions if provided */}
        {assignment.instructions && (
          <div className="exam-instructions-banner">
            <HelpCircle size={16} />
            <div>
              <strong>Exam Instructions from Faculty:</strong>
              <p>{assignment.instructions}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="auth-alert-message error-alert exam-error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Progress tracker */}
        <div className="exam-progress-bar-strip">
          <span>
            Questions Answered: <strong>{totalAnswered} of {questions.length}</strong>
          </span>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: questions.length > 0 ? `${(totalAnswered / questions.length) * 100}%` : '0%'
              }}
            />
          </div>
        </div>

        {/* Exam Form with Questions and Answer Inputs */}
        <form onSubmit={handleSubmitExam} className="online-exam-form">
          <div className="exam-questions-list">
            {questions.length === 0 ? (
              <div className="empty-questions-notice">
                <FileQuestion size={32} />
                <p>No questions have been attached to this online exam yet.</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <article key={idx} className="student-question-card">
                  <div className="question-card-header">
                    <span className="q-badge">Question {q.questionNumber || idx + 1}</span>
                    <span className="q-points-badge">
                      <Award size={13} /> {q.marks || 10} Marks
                    </span>
                  </div>

                  <p className="question-prompt-text">{q.questionText}</p>

                  <div className="student-answer-box">
                    <label className="answer-label">
                      <span>Your Answer:</span>
                      <textarea
                        rows={5}
                        placeholder={`Type your answer for Question ${q.questionNumber || idx + 1} here...`}
                        value={answers[idx]?.answerText || ''}
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                        className="answer-textarea"
                      />
                    </label>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Student comments */}
          <label className="form-label full-width-label">
            <span className="label-text">Additional Remarks for Faculty (Optional)</span>
            <textarea
              rows={2}
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              placeholder="e.g. Completed all questions. For question 2, assumed optimal cache policy as stated in lectures."
            />
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={loading || questions.length === 0}
            >
              {loading ? (
                'Submitting Exam...'
              ) : (
                <>
                  <Send size={15} />
                  {isResubmission ? 'Re-Submit Online Exam' : 'Submit Exam to Faculty'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OnlineExamModal
