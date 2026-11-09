import React, { useState, useEffect } from 'react'
import {
  X,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Award,
  RefreshCw,
  MessageSquare,
  Building2,
  Layers,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  Globe
} from 'lucide-react'

const FacultySubmissionsModal = ({ assignment, isOpen, onClose, onRefreshData }) => {
  if (!isOpen || !assignment) return null

  const isOnlineExam = assignment.mode === 'online'
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // State for grading / rejecting forms keyed by submissionId
  const [activeAction, setActiveAction] = useState({})
  const [marksInput, setMarksInput] = useState({})
  const [feedbackInput, setFeedbackInput] = useState({})
  const [rejectionInput, setRejectionInput] = useState({})
  const [processingId, setProcessingId] = useState(null)

  const token = localStorage.getItem('taskflowToken')

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(
        `http://localhost:5000/api/assignments/${assignment._id}/submissions`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Could not load student submissions.')
      }
      setSubmissions(data.submissions || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch submissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [assignment._id])

  const handleDownloadFile = (sub) => {
    try {
      if (!sub.fileData) {
        alert('File data is missing.')
        return
      }

      const link = document.createElement('a')
      link.href = sub.fileData
      link.download = sub.fileName || 'submission.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      alert('Could not download file: ' + err.message)
    }
  }

  const handleGradeSubmission = async (subId) => {
    const marks = marksInput[subId]
    const feedback = feedbackInput[subId] || ''
    const maxMarks = assignment.maxMarks || 100

    if (marks === undefined || marks === '' || isNaN(marks)) {
      alert('Please enter a valid marks score.')
      return
    }

    if (Number(marks) < 0 || Number(marks) > maxMarks) {
      alert(`Marks must be between 0 and ${maxMarks}.`)
      return
    }

    setProcessingId(subId)
    setError('')
    setActionSuccess('')

    try {
      const res = await fetch(
        `http://localhost:5000/api/assignments/${assignment._id}/submissions/${subId}/grade`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ marks: Number(marks), feedback })
        }
      )
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Could not assign marks.')
      }

      setActionSuccess(data.message || 'Marks assigned successfully!')
      setActiveAction((prev) => ({ ...prev, [subId]: null }))
      await fetchSubmissions()
      if (onRefreshData) onRefreshData()
      setTimeout(() => setActionSuccess(''), 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectSubmission = async (subId) => {
    const reason = rejectionInput[subId]

    if (!reason?.trim()) {
      alert('Please provide a reason for rejection so the student knows what to correct.')
      return
    }

    setProcessingId(subId)
    setError('')
    setActionSuccess('')

    try {
      const res = await fetch(
        `http://localhost:5000/api/assignments/${assignment._id}/submissions/${subId}/reject`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ rejectionReason: reason.trim() })
        }
      )
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Could not reject submission.')
      }

      setActionSuccess(
        isOnlineExam
          ? 'Exam submission rejected. The student has been notified to re-write and submit their exam.'
          : 'Document rejected. The student dashboard has been updated with your message to re-submit.'
      )
      setActiveAction((prev) => ({ ...prev, [subId]: null }))
      await fetchSubmissions()
      if (onRefreshData) onRefreshData()
      setTimeout(() => setActionSuccess(''), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB'
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  const pendingCount = submissions.filter((s) => s.status === 'submitted').length
  const gradedCount = submissions.filter((s) => s.status === 'graded').length
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card submissions-manager-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-header-info">
            <span className="modal-badge faculty-theme-badge">
              <Award size={14} /> Evaluation & Grading Portal
            </span>
            <h2>{assignment.title}</h2>
            <div className="modal-tags">
              <span className="modal-tag">
                <Building2 size={12} /> {assignment.department}
              </span>
              <span className="modal-tag">
                <Layers size={12} /> Section {assignment.section}
              </span>
              <span className="modal-tag">
                <Award size={12} /> Max Marks: {assignment.maxMarks || 100}
              </span>
              <span className="modal-tag">
                {isOnlineExam ? (
                  <>
                    <Globe size={12} /> Online Exam
                  </>
                ) : (
                  <>
                    <FileText size={12} /> Offline Document (Max 20MB)
                  </>
                )}
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

        {/* Status Summary Strip */}
        <div className="submissions-summary-strip">
          <div className="summary-pill total-pill">
            <span className="pill-number">{submissions.length}</span>
            <span className="pill-label">Total Submissions</span>
          </div>
          <div className="summary-pill pending-pill">
            <span className="pill-number">{pendingCount}</span>
            <span className="pill-label">Awaiting Grading</span>
          </div>
          <div className="summary-pill graded-pill">
            <span className="pill-number">{gradedCount}</span>
            <span className="pill-label">Graded & Approved</span>
          </div>
          <div className="summary-pill rejected-pill">
            <span className="pill-number">{rejectedCount}</span>
            <span className="pill-label">Rejected (Needs Resubmit)</span>
          </div>

          <button
            type="button"
            className="refresh-subs-btn"
            onClick={fetchSubmissions}
            disabled={loading}
            title="Refresh submissions"
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            <span>Sync</span>
          </button>
        </div>

        {error && (
          <div className="auth-alert-message error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="auth-alert-message success-alert">
            <CheckCircle2 size={16} />
            <span>{actionSuccess}</span>
          </div>
        )}

        <div className="submissions-body-list">
          {loading && submissions.length === 0 ? (
            <div className="empty-submissions-box">
              <RefreshCw size={24} className="spinning" />
              <p>Loading student submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="empty-submissions-box">
              <FileText size={32} />
              <h4>No Submissions Yet</h4>
              <p>
                Students from <strong>{assignment.department} (Section {assignment.section})</strong>{' '}
                have not submitted their {isOnlineExam ? 'online exam answers' : 'written document (PDF/Word)'} yet.
              </p>
            </div>
          ) : (
            submissions.map((sub) => {
              const isGrading = activeAction[sub._id] === 'grade'
              const isRejecting = activeAction[sub._id] === 'reject'
              const subIsOnline = sub.mode === 'online' || isOnlineExam

              return (
                <article
                  key={sub._id}
                  className={`faculty-sub-card status-${sub.status}`}
                >
                  <div className="sub-card-top">
                    <div className="student-profile-info">
                      <div className="student-avatar-circle">
                        {sub.studentName?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <div className="student-text-group">
                        <h4 className="student-name">{sub.studentName}</h4>
                        <div className="student-meta-details">
                          <span className="student-email">{sub.studentEmail}</span>
                          <span className="meta-dot">•</span>
                          <span>
                            {sub.studentDepartment} (Sec {sub.studentSection})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="submission-badge-col">
                      <span className={`status-pill pill-${sub.status}`}>
                        {sub.status === 'graded' && (
                          <>
                            <CheckCircle2 size={13} /> Graded: {sub.marks} /{' '}
                            {sub.maxMarks || 100}
                          </>
                        )}
                        {sub.status === 'submitted' && (
                          <>
                            <Clock size={13} /> Needs Evaluation
                          </>
                        )}
                        {sub.status === 'rejected' && (
                          <>
                            <XCircle size={13} /> Rejected (Pending Re-submit)
                          </>
                        )}
                      </span>
                      <span className="submitted-time-text">
                        Submitted: {new Date(sub.submittedAt).toLocaleDateString()}{' '}
                        {new Date(sub.submittedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Submission Title & Notes */}
                  <div className="sub-details-box">
                    <div className="sub-title-row">
                      <strong>Submission Title:</strong> <span>{sub.title}</span>
                    </div>
                    {sub.studentNote && (
                      <div className="student-note-row">
                        <MessageSquare size={13} />
                        <em>Student Note: "{sub.studentNote}"</em>
                      </div>
                    )}
                  </div>

                  {/* CONTENT DISPLAY: ONLINE EXAM ANSWERS vs OFFLINE DOCUMENT ATTACHMENT */}
                  {subIsOnline ? (
                    /* 1. ONLINE EXAM ANSWERS VIEW */
                    <div className="exam-answers-review-section">
                      <div className="review-section-header">
                        <FileQuestion size={16} />
                        <span>Student's Written Exam Answers ({sub.answers?.length || 0} Questions):</span>
                      </div>

                      <div className="answers-review-list">
                        {(sub.answers || []).map((ans, aIdx) => (
                          <div key={aIdx} className="faculty-answer-card">
                            <div className="faculty-answer-header">
                              <span className="q-badge">Question {ans.questionNumber || aIdx + 1}</span>
                              <span className="q-points-badge">
                                <Award size={12} /> {ans.questionMarks || 10} Marks
                              </span>
                            </div>
                            <p className="q-prompt-display">
                              <strong>Prompt:</strong> {ans.questionText}
                            </p>
                            <div className="student-response-block">
                              <span className="response-tag">Student's Answer:</span>
                              <p className="response-text">
                                {ans.answerText || <em>[No answer provided]</em>}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* 2. OFFLINE DOCUMENT ATTACHMENT (Max 20MB) */
                    <div className="sub-attachment-row">
                      <div className="attachment-file-pill">
                        <FileText size={18} className="file-icon" />
                        <div className="file-details">
                          <span className="file-name">{sub.fileName}</span>
                          <span className="file-meta">
                            {formatFileSize(sub.fileSize)} (within 20MB limit) •{' '}
                            {sub.fileName?.toLowerCase().endsWith('.pdf')
                              ? 'PDF Document'
                              : 'Word Document'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="download-sub-btn"
                        onClick={() => handleDownloadFile(sub)}
                        title="Download or preview student document"
                      >
                        <Download size={15} />
                        <span>Download / View Document</span>
                      </button>
                    </div>
                  )}

                  {/* Graded info */}
                  {sub.status === 'graded' && (
                    <div className="graded-feedback-banner">
                      <Award size={16} />
                      <div className="feedback-content">
                        <strong>
                          Marks Awarded: {sub.marks} / {sub.maxMarks || 100}
                        </strong>
                        {sub.feedback && <p>Feedback: "{sub.feedback}"</p>}
                        <span className="reviewed-by-text">
                          Evaluated by {sub.reviewedByName || 'Faculty'} on{' '}
                          {sub.reviewedAt
                            ? new Date(sub.reviewedAt).toLocaleDateString()
                            : 'Recently'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Rejection info */}
                  {sub.status === 'rejected' && (
                    <div className="rejected-feedback-banner">
                      <XCircle size={16} />
                      <div className="feedback-content">
                        <strong>Rejection Reason Sent to Student:</strong>
                        <p>"{sub.rejectionReason}"</p>
                        <span className="rejected-hint">
                          The student has been prompted on their dashboard to re-submit this assignment.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Controls for Faculty */}
                  <div className="sub-actions-toolbar">
                    <button
                      type="button"
                      className={`action-btn-grade ${isGrading ? 'active' : ''}`}
                      onClick={() => {
                        setActiveAction((prev) => ({
                          ...prev,
                          [sub._id]: prev[sub._id] === 'grade' ? null : 'grade'
                        }))
                        if (!marksInput[sub._id] && sub.marks !== null) {
                          setMarksInput((prev) => ({ ...prev, [sub._id]: sub.marks }))
                        }
                        if (!feedbackInput[sub._id] && sub.feedback) {
                          setFeedbackInput((prev) => ({ ...prev, [sub._id]: sub.feedback }))
                        }
                      }}
                    >
                      <CheckCircle2 size={15} />
                      <span>{sub.status === 'graded' ? 'Update Marks' : 'Assign Marks & Approve'}</span>
                      {isGrading ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <button
                      type="button"
                      className={`action-btn-reject ${isRejecting ? 'active' : ''}`}
                      onClick={() => {
                        setActiveAction((prev) => ({
                          ...prev,
                          [sub._id]: prev[sub._id] === 'reject' ? null : 'reject'
                        }))
                        if (!rejectionInput[sub._id] && sub.rejectionReason) {
                          setRejectionInput((prev) => ({
                            ...prev,
                            [sub._id]: sub.rejectionReason
                          }))
                        }
                      }}
                    >
                      <XCircle size={15} />
                      <span>Reject & Request Re-submit</span>
                      {isRejecting ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Inline Form: Assign Marks */}
                  {isGrading && (
                    <div className="inline-action-form grading-form">
                      <div className="form-row-marks">
                        <label className="marks-input-label">
                          <span>Marks (out of {assignment.maxMarks || 100}):</span>
                          <input
                            type="number"
                            min={0}
                            max={assignment.maxMarks || 100}
                            placeholder="e.g. 95"
                            value={marksInput[sub._id] ?? ''}
                            onChange={(e) =>
                              setMarksInput({
                                ...marksInput,
                                [sub._id]: e.target.value
                              })
                            }
                            required
                          />
                        </label>

                        <label className="feedback-input-label">
                          <span>Feedback / Remarks (Optional):</span>
                          <input
                            type="text"
                            placeholder="e.g. Well formulated answers and accurate explanations!"
                            value={feedbackInput[sub._id] ?? ''}
                            onChange={(e) =>
                              setFeedbackInput({
                                ...feedbackInput,
                                [sub._id]: e.target.value
                              })
                            }
                          />
                        </label>
                      </div>

                      <div className="inline-buttons-row">
                        <button
                          type="button"
                          className="btn-confirm-grade"
                          disabled={processingId === sub._id}
                          onClick={() => handleGradeSubmission(sub._id)}
                        >
                          <CheckCircle2 size={15} />
                          {processingId === sub._id
                            ? 'Saving Marks...'
                            : 'Approve & Save Marks'}
                        </button>
                        <button
                          type="button"
                          className="btn-cancel-inline"
                          onClick={() =>
                            setActiveAction((prev) => ({ ...prev, [sub._id]: null }))
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Form: Reject Submission */}
                  {isRejecting && (
                    <div className="inline-action-form rejecting-form">
                      <label className="rejection-input-label">
                        <span>Reason for Rejection (Displayed to student to fix):</span>
                        <textarea
                          rows={2}
                          placeholder={
                            subIsOnline
                              ? 'e.g. Answers to questions 2 and 3 are incomplete. Please review concepts and re-write.'
                              : 'e.g. Incomplete answers on page 2, or handwritten pages are blurry. Please re-scan clearly and submit again.'
                          }
                          value={rejectionInput[sub._id] ?? ''}
                          onChange={(e) =>
                            setRejectionInput({
                              ...rejectionInput,
                              [sub._id]: e.target.value
                            })
                          }
                          required
                        />
                      </label>

                      <div className="inline-buttons-row">
                        <button
                          type="button"
                          className="btn-confirm-reject"
                          disabled={processingId === sub._id}
                          onClick={() => handleRejectSubmission(sub._id)}
                        >
                          <XCircle size={15} />
                          {processingId === sub._id
                            ? 'Sending Rejection...'
                            : 'Send Rejection Notice to Student'}
                        </button>
                        <button
                          type="button"
                          className="btn-cancel-inline"
                          onClick={() =>
                            setActiveAction((prev) => ({ ...prev, [sub._id]: null }))
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default FacultySubmissionsModal
