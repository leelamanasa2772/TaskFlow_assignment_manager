import React, { useState } from 'react'
import {
  Search,
  Calendar,
  User,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Tag,
  Layers,
  Building2,
  Users,
  Globe,
  FileText,
  Upload,
  Award,
  XCircle,
  HelpCircle,
  FolderOpen,
  Edit3,
  FileQuestion
} from 'lucide-react'
import StudentSubmissionModal from './StudentSubmissionModal.jsx'
import OnlineExamModal from './OnlineExamModal.jsx'
import FacultySubmissionsModal from './FacultySubmissionsModal.jsx'

const AssignmentList = ({
  assignments = [],
  role = 'student',
  user,
  onToggleComplete,
  onDelete,
  onRefreshData
}) => {
  const [filter, setFilter] = useState('All')
  const [modeFilter, setModeFilter] = useState('All') // 'All' | 'online' | 'offline'
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('Soonest')

  // Modals state
  const [selectedOfflineAssignment, setSelectedOfflineAssignment] = useState(null)
  const [selectedOnlineAssignment, setSelectedOnlineAssignment] = useState(null)
  const [selectedFacultyAssignment, setSelectedFacultyAssignment] = useState(null)
  const [successToast, setSuccessToast] = useState('')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const filteredAssignments = assignments
    .filter((assignment) => {
      // Status filter
      let matchesStatus = true
      if (filter === 'Pending') {
        matchesStatus = !assignment.completed
      } else if (filter === 'Completed') {
        matchesStatus = assignment.completed
      } else if (filter === 'Rejected') {
        matchesStatus = assignment.submissionStatus === 'rejected'
      }

      // Mode filter
      const matchesMode =
        modeFilter === 'All' || assignment.mode === modeFilter

      // Search filter
      const search = searchTerm.toLowerCase()
      const matchesSearch =
        (assignment.title || '').toLowerCase().includes(search) ||
        (assignment.subject || '').toLowerCase().includes(search) ||
        (assignment.department || '').toLowerCase().includes(search) ||
        (assignment.teacherName || '').toLowerCase().includes(search)

      return matchesStatus && matchesMode && matchesSearch
    })
    .sort((a, b) => {
      const dateA = new Date(a.dueDate)
      const dateB = new Date(b.dueDate)
      return sortOrder === 'Soonest' ? dateA - dateB : dateB - dateA
    })

  const isDueSoon = (assignment) => {
    if (assignment.completed || !assignment.dueDate) return false
    const dueDate = new Date(`${assignment.dueDate}T00:00:00`)
    return dueDate >= today && dueDate <= tomorrow
  }

  const handleStudentSubmitSuccess = (message) => {
    setSuccessToast(message)
    setTimeout(() => setSuccessToast(''), 5000)
    if (onRefreshData) onRefreshData()
  }

  return (
    <section className="assignments-section" aria-label="Assignments List">
      {/* Toast Notification */}
      {successToast && (
        <div className="auth-alert-message success-alert floating-toast" role="status">
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
        </div>
      )}

      <div className="assignments-section-header">
        <div>
          <h2>
            {role === 'faculty'
              ? 'Department Coursework & Examinations'
              : 'Assignments for My Department & Section'}
          </h2>
          <p className="section-header-sub">
            {role === 'faculty'
              ? 'Manage online exams and offline paper coursework. Grade student submissions and assign marks.'
              : 'Tasks and exams assigned by your faculty. Write online exams or submit written papers (PDF/Word up to 20MB).'}
          </p>
        </div>
        <span className="count-pill">
          {filteredAssignments.length}{' '}
          {filteredAssignments.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="list-controls-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by title, subject, department, or faculty..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="assignment-search"
          />
        </div>

        <div className="controls-right-group">
          <label className="sort-label">
            <span>Type:</span>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="offline">Offline (Doc Upload)</option>
              <option value="online">Online (Exam Portal)</option>
            </select>
          </label>

          <label className="sort-label">
            <span>Sort:</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            >
              <option value="Soonest">Soonest first</option>
              <option value="Latest">Latest first</option>
            </select>
          </label>

          <div className="assignment-filters">
            {['All', 'Pending', 'Completed', ...(role === 'student' ? ['Rejected'] : [])].map(
              (filterOption) => (
                <button
                  key={filterOption}
                  type="button"
                  className={filter === filterOption ? 'active-filter' : ''}
                  onClick={() => setFilter(filterOption)}
                >
                  {filterOption}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="empty-assignments-box">
          <FolderOpen size={36} />
          <p>No matching assignments found.</p>
          {role === 'faculty' ? (
            <span>Use the creator form above to post your first assignment or exam!</span>
          ) : (
            <span>Check back soon or sync tasks to refresh coursework from your department faculty.</span>
          )}
        </div>
      ) : (
        <div className="assignments-list">
          {filteredAssignments.map((assignment) => {
            const isOnline = assignment.mode === 'online'
            const subStatus = assignment.submissionStatus
            const isRejected = subStatus === 'rejected'
            const isGraded = subStatus === 'graded'
            const isSubmitted = subStatus === 'submitted'

            return (
              <article
                className={`assignment-card ${
                  assignment.completed ? 'is-completed' : ''
                } ${isRejected ? 'card-rejected' : ''}`}
                key={assignment._id}
              >
                <div className="assignment-card-main">
                  {/* Tags Strip */}
                  <div className="assignment-card-tags">
                    {/* Mode Badge */}
                    <span
                      className={`mode-badge-pill ${
                        isOnline ? 'mode-online' : 'mode-offline'
                      }`}
                    >
                      {isOnline ? (
                        <>
                          <Globe size={12} /> Online Exam ({assignment.questions?.length || 0} Qs)
                        </>
                      ) : (
                        <>
                          <FileText size={12} /> Offline Document (PDF/Word)
                        </>
                      )}
                    </span>

                    <span className="subject-chip">
                      <Tag size={12} /> {assignment.subject}
                    </span>

                    <span className="dept-chip">
                      <Building2 size={12} /> {assignment.department || 'Computer Science'}
                    </span>

                    <span className="section-chip">
                      <Layers size={12} /> Sec {assignment.section}
                    </span>

                    <span className="marks-chip">
                      <Award size={12} /> Max: {assignment.maxMarks || 100} pts
                    </span>

                    {assignment.teacherName && (
                      <span className="teacher-chip">
                        <User size={12} /> Faculty: {assignment.teacherName}
                      </span>
                    )}
                  </div>

                  <h3 className="assignment-title">{assignment.title}</h3>

                  {assignment.instructions && (
                    <p className="assignment-instructions-text">
                      <HelpCircle size={13} /> {assignment.instructions}
                    </p>
                  )}

                  <div className="assignment-meta-row">
                    <span className="meta-item">
                      <Calendar size={14} /> Due: <strong>{assignment.dueDate}</strong>
                    </span>

                    {/* Faculty metrics */}
                    {role === 'faculty' && (
                      <div className="faculty-meta-counters">
                        <span className="meta-item submissions-badge">
                          <Users size={14} /> Submissions:{' '}
                          <strong>{assignment.totalSubmissions || 0}</strong>
                        </span>

                        {(assignment.pendingReviews || 0) > 0 && (
                          <span className="meta-item attention-badge">
                            <Clock size={13} /> Needs Grading:{' '}
                            <strong>{assignment.pendingReviews}</strong>
                          </span>
                        )}

                        {(assignment.gradedCount || 0) > 0 && (
                          <span className="meta-item success-badge">
                            <CheckCircle2 size={13} /> Graded:{' '}
                            <strong>{assignment.gradedCount}</strong>
                          </span>
                        )}

                        {(assignment.rejectedCount || 0) > 0 && (
                          <span className="meta-item rejected-badge">
                            <XCircle size={13} /> Rejected:{' '}
                            <strong>{assignment.rejectedCount}</strong>
                          </span>
                        )}
                      </div>
                    )}

                    {isDueSoon(assignment) && (
                      <span className="due-soon">
                        <AlertCircle size={13} /> Due soon
                      </span>
                    )}
                  </div>

                  {/* STUDENT SUBMISSION STATUS BANNERS */}
                  {role === 'student' && (
                    <div className="student-status-container">
                      {/* 1. REJECTED BANNER WITH FACULTY MESSAGE */}
                      {isRejected && (
                        <div className="student-rejection-alert">
                          <div className="rejection-alert-top">
                            <AlertTriangle size={18} className="alert-icon" />
                            <strong>Submission Rejected by Faculty</strong>
                          </div>
                          <p className="rejection-alert-msg">
                            Faculty Message: "{assignment.mySubmission?.rejectionReason}"
                          </p>
                          <span className="rejection-prompt">
                            {isOnline
                              ? 'Your exam submission was rejected. Please review faculty feedback and click "Re-write & Submit Exam" to update your answers.'
                              : 'Your document submission was not accepted. Please review faculty comments and click "Submit Again" to upload a revised PDF or Word document (max 20MB).'}
                          </span>
                        </div>
                      )}

                      {/* 2. GRADED & APPROVED BANNER */}
                      {isGraded && (
                        <div className="student-graded-alert">
                          <div className="graded-alert-top">
                            <Award size={18} className="graded-icon" />
                            <strong>
                              Evaluated & Approved • Marks:{' '}
                              <span className="highlight-score">
                                {assignment.mySubmission?.marks} / {assignment.maxMarks || 100}
                              </span>
                            </strong>
                          </div>
                          {assignment.mySubmission?.feedback && (
                            <p className="graded-feedback">
                              Faculty Remarks: "{assignment.mySubmission?.feedback}"
                            </p>
                          )}
                          <span className="graded-evaluator">
                            Evaluated by Prof. {assignment.mySubmission?.reviewedByName || assignment.teacherName}
                          </span>
                        </div>
                      )}

                      {/* 3. SUBMITTED & PENDING REVIEW */}
                      {isSubmitted && (
                        <div className="student-pending-alert">
                          <div className="pending-alert-top">
                            <Clock size={16} />
                            <strong>Submitted & Awaiting Faculty Evaluation</strong>
                          </div>
                          <span className="pending-file-info">
                            {isOnline ? (
                              <>
                                Exam answers submitted ({assignment.mySubmission?.answers?.length || 0} questions) on{' '}
                                {new Date(assignment.mySubmission?.submittedAt).toLocaleDateString()}
                              </>
                            ) : (
                              <>
                                File attached: <em>{assignment.mySubmission?.fileName}</em> (Submitted{' '}
                                {new Date(assignment.mySubmission?.submittedAt).toLocaleDateString()})
                              </>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Assignment Action Buttons */}
                <div className="assignment-actions">
                  {/* STUDENTS ACTIONS */}
                  {role === 'student' && (
                    <>
                      {/* CASE 1: OFFLINE DOCUMENT ASSIGNMENT */}
                      {!isOnline && (
                        <>
                          {subStatus === 'not_submitted' && (
                            <button
                              type="button"
                              className="btn-submit-work"
                              onClick={() => setSelectedOfflineAssignment(assignment)}
                              title="Upload written document as PDF or Word (20MB limit)"
                            >
                              <Upload size={15} />
                              <span>Submit Document (PDF/Word, 20MB)</span>
                            </button>
                          )}

                          {isRejected && (
                            <button
                              type="button"
                              className="btn-resubmit-work"
                              onClick={() => setSelectedOfflineAssignment(assignment)}
                              title="Re-upload revised document (max 20MB)"
                            >
                              <Upload size={15} />
                              <span>Submit Again (Upload Doc)</span>
                            </button>
                          )}

                          {isSubmitted && (
                            <button
                              type="button"
                              className="btn-update-work"
                              onClick={() => setSelectedOfflineAssignment(assignment)}
                            >
                              <Upload size={14} />
                              <span>Update Document</span>
                            </button>
                          )}

                          {isGraded && (
                            <div className="graded-badge-pill">
                              <CheckCircle2 size={14} />
                              <span>Approved ({assignment.mySubmission?.marks} pts)</span>
                            </div>
                          )}
                        </>
                      )}

                      {/* CASE 2: ONLINE EXAM ASSIGNMENT */}
                      {isOnline && (
                        <>
                          {subStatus === 'not_submitted' && (
                            <button
                              type="button"
                              className="btn-take-exam"
                              onClick={() => setSelectedOnlineAssignment(assignment)}
                              title="Open online examination and write your answers"
                            >
                              <Edit3 size={15} />
                              <span>Write Online Exam</span>
                            </button>
                          )}

                          {isRejected && (
                            <button
                              type="button"
                              className="btn-resubmit-work"
                              onClick={() => setSelectedOnlineAssignment(assignment)}
                              title="Re-write exam answers and submit again"
                            >
                              <Edit3 size={15} />
                              <span>Re-write & Submit Exam</span>
                            </button>
                          )}

                          {isSubmitted && (
                            <button
                              type="button"
                              className="btn-update-work"
                              onClick={() => setSelectedOnlineAssignment(assignment)}
                            >
                              <Edit3 size={14} />
                              <span>Review / Edit Answers</span>
                            </button>
                          )}

                          {isGraded && (
                            <button
                              type="button"
                              className="btn-view-answers"
                              onClick={() => setSelectedOnlineAssignment(assignment)}
                            >
                              <FileQuestion size={14} />
                              <span>View My Exam Answers</span>
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* FACULTY ACTIONS */}
                  {role === 'faculty' && (
                    <div className="faculty-action-buttons-group">
                      <button
                        type="button"
                        className="btn-view-submissions"
                        onClick={() => setSelectedFacultyAssignment(assignment)}
                        title="View student submissions and evaluate"
                      >
                        <FileText size={15} />
                        <span>View Submissions & Grade</span>
                        {(assignment.pendingReviews || 0) > 0 && (
                          <span className="pending-bubble">
                            {assignment.pendingReviews}
                          </span>
                        )}
                      </button>

                      {onDelete && (
                        <button
                          type="button"
                          className="delete-assignment-btn"
                          onClick={() => {
                            const confirmed = window.confirm(
                              `Are you sure you want to delete "${assignment.title}"? All student submissions will also be deleted.`
                            )
                            if (confirmed) {
                              onDelete(assignment._id)
                            }
                          }}
                          title="Delete this assignment (Faculty only)"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Offline Student Document Submission Modal (PDF or Word, 20MB limit) */}
      {selectedOfflineAssignment && (
        <StudentSubmissionModal
          assignment={selectedOfflineAssignment}
          student={user}
          isOpen={Boolean(selectedOfflineAssignment)}
          onClose={() => setSelectedOfflineAssignment(null)}
          onSubmitSuccess={handleStudentSubmitSuccess}
        />
      )}

      {/* Online Exam Modal (Student writes exam in dashboard) */}
      {selectedOnlineAssignment && (
        <OnlineExamModal
          assignment={selectedOnlineAssignment}
          student={user}
          isOpen={Boolean(selectedOnlineAssignment)}
          onClose={() => setSelectedOnlineAssignment(null)}
          onSubmitSuccess={handleStudentSubmitSuccess}
        />
      )}

      {/* Faculty Submissions Evaluation Modal */}
      {selectedFacultyAssignment && (
        <FacultySubmissionsModal
          assignment={selectedFacultyAssignment}
          isOpen={Boolean(selectedFacultyAssignment)}
          onClose={() => setSelectedFacultyAssignment(null)}
          onRefreshData={onRefreshData}
        />
      )}
    </section>
  )
}

export default AssignmentList
