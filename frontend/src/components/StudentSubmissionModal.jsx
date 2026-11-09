import React, { useState, useRef } from 'react'
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  AlertTriangle,
  Layers,
  Building2,
  User,
  BookOpen,
  Tag,
  FolderOpen
} from 'lucide-react'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

const StudentSubmissionModal = ({
  assignment,
  student,
  isOpen,
  onClose,
  onSubmitSuccess
}) => {
  if (!isOpen || !assignment) return null

  const isResubmission = assignment.submissionStatus === 'rejected'
  const previousRejectionReason = assignment.mySubmission?.rejectionReason

  const fileInputRef = useRef(null)
  const [studentName, setStudentName] = useState(student?.name || '')
  const [title, setTitle] = useState(assignment.title || '')
  const [subject, setSubject] = useState(assignment.subject || '')
  const [studentNote, setStudentNote] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileBase64, setFileBase64] = useState('')
  const [fileError, setFileError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleProcessFile = (file) => {
    setFileError('')
    setError('')
    if (!file) return

    const lowerName = file.name.toLowerCase()
    const validExtensions = ['.pdf', '.doc', '.docx']
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext))

    if (!isValid) {
      setFileError('Invalid file type! Please upload a PDF (.pdf) or Word document (.doc, .docx).')
      setSelectedFile(null)
      setFileBase64('')
      return
    }

    // 20MB Limit validation
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 20MB limit. Please upload a file smaller than 20MB.`)
      setSelectedFile(null)
      setFileBase64('')
      return
    }

    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = () => {
      setFileBase64(reader.result)
    }
    reader.onerror = () => {
      setFileError('Could not read the selected file. Please try again.')
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    handleProcessFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    handleProcessFile(file)
  }

  const handleTriggerFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!fileBase64 || !selectedFile) {
      setFileError('Please attach your PDF or Word document before submitting.')
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
            name: studentName.trim() || student?.name,
            title: title.trim() || assignment.title,
            subject: subject.trim() || assignment.subject,
            fileName: selectedFile.name,
            fileType: selectedFile.type || 'application/pdf',
            fileSize: selectedFile.size,
            fileData: fileBase64,
            studentNote: studentNote.trim()
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Submission failed.')
      }

      onSubmitSuccess(
        isResubmission
          ? 'Assignment re-submitted successfully (20MB limit verified)! Sent to faculty.'
          : 'Assignment document submitted successfully to faculty dashboard!'
      )
      onClose()
    } catch (err) {
      setError(err.message || 'An error occurred while submitting.')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB'
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card submission-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-header-info">
            <span className="modal-badge offline-badge">
              <FileText size={14} />
              {isResubmission ? 'Re-Submit Offline Written Assignment' : 'Submit Offline Assignment Document'}
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
              <span className="modal-tag file-limit-tag">
                20MB Limit (PDF / Word)
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

        {/* If rejected, show previous rejection feedback from faculty */}
        {isResubmission && previousRejectionReason && (
          <div className="rejection-notice-box">
            <div className="notice-header">
              <AlertTriangle size={18} />
              <strong>Faculty Rejection Feedback:</strong>
            </div>
            <p className="notice-body">"{previousRejectionReason}"</p>
            <span className="notice-tip">
              Please review the feedback above and attach your revised document below (max 20MB).
            </span>
          </div>
        )}

        {error && (
          <div className="auth-alert-message error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="submission-form">
          <div className="submission-grid-2">
            <label className="form-label">
              <span className="label-text">
                <User size={14} /> Student Full Name
              </span>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
            </label>

            <label className="form-label">
              <span className="label-text">
                <BookOpen size={14} /> Assignment Title
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>

            <label className="form-label">
              <span className="label-text">
                <Tag size={14} /> Subject
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </label>

            <label className="form-label">
              <span className="label-text">
                <Building2 size={14} /> Department & Section
              </span>
              <input
                type="text"
                value={`${assignment.department || student?.department} (Section ${assignment.section})`}
                disabled
                className="disabled-input"
              />
            </label>
          </div>

          {/* Document Upload Area with 20MB limit */}
          <div className="file-upload-section">
            <div className="upload-label">
              <span>Attached Document (PDF or Word)</span>
              <span className="upload-types-pill">
                <strong>Max Limit: 20MB</strong> • .pdf, .doc, .docx
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <div
              className={`file-dropzone ${selectedFile ? 'has-file' : ''} ${
                isDragging ? 'dragging' : ''
              }`}
              onClick={handleTriggerFilePicker}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              title="Click to open file explorer or drop file here"
            >
              {selectedFile ? (
                <div className="selected-file-preview">
                  <div className="file-icon-box">
                    <FileCheck size={28} />
                  </div>
                  <div className="file-info-text">
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-meta">
                      {formatFileSize(selectedFile.size)} of 20MB •{' '}
                      {selectedFile.name.endsWith('.pdf') ? 'PDF Document' : 'Word Document'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="change-file-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTriggerFilePicker()
                    }}
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div className="dropzone-empty-state">
                  <FolderOpen size={36} className="upload-icon" />
                  <p>
                    <strong>Click to browse file explorer</strong> or drop your file here
                  </p>
                  <span>
                    Upload your written assignment as PDF or Word document (Strict limit: 20MB)
                  </span>
                </div>
              )}
            </div>

            {fileError && <p className="file-error-text">{fileError}</p>}
          </div>

          {/* Student Note */}
          <label className="form-label full-width-label">
            <span className="label-text">Notes for Faculty (Optional)</span>
            <textarea
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              placeholder="e.g. Scanned 4 pages of handwritten solutions. Questions 1 to 5 completed."
              rows={2}
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
              disabled={loading}
            >
              {loading ? (
                'Uploading Document (20MB limit)...'
              ) : (
                <>
                  <Upload size={16} />
                  {isResubmission ? 'Submit Again to Faculty' : 'Send to Faculty Dashboard'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StudentSubmissionModal
