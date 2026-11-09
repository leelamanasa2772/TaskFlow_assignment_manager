import React, { useState } from 'react'
import {
  PlusCircle,
  BookOpen,
  Calendar,
  Layers,
  Building2,
  Tag,
  Globe,
  FileText,
  Award,
  HelpCircle,
  Plus,
  Trash2,
  FileQuestion
} from 'lucide-react'

const AddAssignment = ({
  onAdd,
  defaultSection = '',
  defaultDepartment = 'Computer Science & Engineering'
}) => {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [department, setDepartment] = useState(defaultDepartment)
  const [section, setSection] = useState(defaultSection)
  const [mode, setMode] = useState('offline') // 'offline' (document upload) | 'online' (prepare questions / exam)
  const [maxMarks, setMaxMarks] = useState(100)
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(false)

  // Questions for Online Exam mode
  const [questions, setQuestions] = useState([
    { questionNumber: 1, questionText: '', marks: 10 },
    { questionNumber: 2, questionText: '', marks: 10 }
  ])

  const today = new Date().toISOString().split('T')[0]

  // Add a new question to the exam
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionNumber: questions.length + 1,
        questionText: '',
        marks: 10
      }
    ])
  }

  // Remove a question
  const handleRemoveQuestion = (index) => {
    if (questions.length <= 1) {
      alert('An online exam must have at least one question.')
      return
    }
    const updated = questions
      .filter((_, idx) => idx !== index)
      .map((q, idx) => ({ ...q, questionNumber: idx + 1 }))
    setQuestions(updated)
  }

  // Update question text or marks
  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions]
    updated[index][field] = field === 'marks' ? Number(value) : value
    setQuestions(updated)
  }

  // Total marks calculated from questions if in online mode
  const totalExamMarks =
    mode === 'online'
      ? questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)
      : Number(maxMarks) || 100

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!title.trim() || !subject.trim() || !dueDate) return

    if (mode === 'online') {
      const validQuestions = questions.filter((q) => q.questionText.trim())
      if (validQuestions.length === 0) {
        alert('Please enter text for at least one question in your online exam.')
        return
      }
    }

    setLoading(true)
    try {
      await onAdd({
        title: title.trim(),
        subject: subject.trim(),
        dueDate,
        department: (department || defaultDepartment).trim(),
        section: (section || defaultSection).trim().toUpperCase(),
        mode,
        maxMarks: totalExamMarks,
        instructions: instructions.trim(),
        questions:
          mode === 'online'
            ? questions
                .filter((q) => q.questionText.trim())
                .map((q, idx) => ({
                  questionNumber: idx + 1,
                  questionText: q.questionText.trim(),
                  marks: Number(q.marks) || 10
                }))
            : []
      })

      setTitle('')
      setSubject('')
      setDueDate('')
      setInstructions('')
      setQuestions([
        { questionNumber: 1, questionText: '', marks: 10 },
        { questionNumber: 2, questionText: '', marks: 10 }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-assignment-container">
      <div className="add-assignment-header">
        <div className="form-badge">
          <PlusCircle size={18} />
          <span>Faculty Assignment Creator</span>
        </div>
        <h3>Post New Assignment to {department || defaultDepartment}</h3>
        <p>
          Create an <strong>Offline Written Assignment</strong> (students upload PDF/Word up to 20MB) or an{' '}
          <strong>Online Exam</strong> (prepare questions for students to answer in the portal).
        </p>
      </div>

      <form className="add-assignment-form" onSubmit={handleSubmit}>
        {/* Mode Selector */}
        <div className="assignment-mode-selection">
          <label className="mode-selection-label">
            Assignment Mode <span>(Choose assignment type)</span>
          </label>
          <div className="mode-toggle-grid">
            <button
              type="button"
              className={`mode-toggle-card ${mode === 'offline' ? 'active' : ''}`}
              onClick={() => setMode('offline')}
            >
              <div className="mode-card-icon offline-icon">
                <FileText size={20} />
              </div>
              <div className="mode-card-details">
                <strong>Offline Assignment (Paper / Document)</strong>
                <span>
                  Students write answers on paper and submit a scanned PDF or Word document (20MB limit).
                </span>
              </div>
            </button>

            <button
              type="button"
              className={`mode-toggle-card ${mode === 'online' ? 'active' : ''}`}
              onClick={() => setMode('online')}
            >
              <div className="mode-card-icon online-icon">
                <Globe size={20} />
              </div>
              <div className="mode-card-details">
                <strong>Online Exam (Write in Portal)</strong>
                <span>
                  Prepare questions below. Students write their exam answers directly in their dashboard.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="form-group-grid">
          <label className="form-label">
            <span className="label-text">
              <BookOpen size={15} /> Assignment Title
            </span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={
                mode === 'online'
                  ? 'e.g. Unit 2 Midterm Exam: Operating Systems'
                  : 'e.g. Unit 3 Lab: Operating System Scheduling'
              }
              required
            />
          </label>

          <label className="form-label">
            <span className="label-text">
              <Tag size={15} /> Course / Subject
            </span>
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Operating Systems, DBMS"
              required
            />
          </label>

          <label className="form-label">
            <span className="label-text">
              <Calendar size={15} /> Due Date
            </span>
            <input
              type="date"
              value={dueDate}
              min={today}
              onChange={(event) => setDueDate(event.target.value)}
              required
            />
          </label>

          {mode === 'offline' ? (
            <label className="form-label">
              <span className="label-text">
                <Award size={15} /> Maximum Marks
              </span>
              <input
                type="number"
                min={5}
                max={500}
                value={maxMarks}
                onChange={(event) => setMaxMarks(event.target.value)}
                required
              />
            </label>
          ) : (
            <label className="form-label">
              <span className="label-text">
                <Award size={15} /> Total Exam Marks (Auto-summed)
              </span>
              <input
                type="text"
                value={`${totalExamMarks} Marks (${questions.length} questions)`}
                disabled
                className="disabled-input"
              />
            </label>
          )}

          <label className="form-label">
            <span className="label-text">
              <Building2 size={15} /> Department
            </span>
            <input
              type="text"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              placeholder="e.g. Computer Science & Engineering"
              required
            />
          </label>

          <label className="form-label">
            <span className="label-text">
              <Layers size={15} /> Target Section
            </span>
            <input
              type="text"
              value={section}
              onChange={(event) => setSection(event.target.value.toUpperCase())}
              placeholder="e.g. A, B, CSE-A"
              required
            />
          </label>
        </div>

        {/* Instructions */}
        <label className="form-label full-width-label">
          <span className="label-text">
            <HelpCircle size={15} /> Instructions / Guidelines (Optional)
          </span>
          <textarea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder={
              mode === 'online'
                ? 'e.g. Answer all questions within the allocated marks. Be concise and provide code/diagrams where applicable.'
                : 'e.g. Write answers on paper, scan as a PDF or Word document up to 20MB, and submit through the portal.'
            }
            rows={2}
            className="instructions-textarea"
          />
        </label>

        {/* ONLINE EXAM QUESTION BUILDER (When mode === 'online') */}
        {mode === 'online' && (
          <div className="exam-question-builder">
            <div className="builder-header">
              <div className="builder-title">
                <FileQuestion size={18} />
                <h4>Prepare Exam Questions ({questions.length} Questions)</h4>
              </div>
              <span className="total-marks-pill">
                <Award size={14} /> Total: {totalExamMarks} Marks
              </span>
            </div>

            <div className="questions-list">
              {questions.map((q, idx) => (
                <div key={idx} className="question-builder-card">
                  <div className="q-card-header">
                    <span className="q-number-badge">Question {idx + 1}</span>
                    <div className="q-marks-control">
                      <span>Marks:</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={q.marks}
                        onChange={(e) =>
                          handleQuestionChange(idx, 'marks', e.target.value)
                        }
                        className="q-marks-input"
                        required
                      />
                    </div>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        className="q-delete-btn"
                        onClick={() => handleRemoveQuestion(idx)}
                        title="Delete question"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={3}
                    placeholder={`Enter Question ${idx + 1} prompt (e.g. Describe the Banker's Algorithm for deadlock avoidance with state transitions.)`}
                    value={q.questionText}
                    onChange={(e) =>
                      handleQuestionChange(idx, 'questionText', e.target.value)
                    }
                    className="question-textarea"
                    required
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              className="add-question-btn"
              onClick={handleAddQuestion}
            >
              <Plus size={16} />
              <span>Add Another Question</span>
            </button>
          </div>
        )}

        {/* Dynamic button label properly reflecting selected mode */}
        <button type="submit" className="add-submit-btn" disabled={loading}>
          <PlusCircle size={18} />
          {loading
            ? 'Publishing...'
            : `Publish ${mode === 'online' ? 'Online Exam' : 'Offline Assignment'} to Section ${section || defaultSection || '...'}`}
        </button>
      </form>
    </div>
  )
}

export default AddAssignment
