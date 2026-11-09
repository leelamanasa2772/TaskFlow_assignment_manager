import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Layers,
  Building2,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  User,
  Mail,
  BookOpen
} from 'lucide-react'
import AssignmentChart from '../components/AssigmentChart.jsx'
import AssignmentList from '../components/AssignmentList.jsx'

const API_URL = 'http://localhost:5000/api'

const StudentDashboard = ({ user }) => {
  const [assignments, setAssignments] = useState([])
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState('')

  const token = localStorage.getItem('taskflowToken')

  const fetchStudentData = async () => {
    try {
      setError('')
      setLoading(true)

      // 1. Fetch student's department & section assignments
      const resAssignments = await fetch(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const assignmentsData = await resAssignments.json()
      if (!resAssignments.ok) {
        throw new Error(assignmentsData.message || 'Could not load assignments.')
      }
      setAssignments(assignmentsData)

      // 2. Fetch student analytics
      const resAnalytics = await fetch(`${API_URL}/assignments/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const analyticsRes = await resAnalytics.json()
      if (resAnalytics.ok) {
        setAnalyticsData(analyticsRes)
      }
    } catch (err) {
      setError(err.message || 'Error fetching student dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudentData()
  }, [user?.id])

  const handleToggleComplete = async (id) => {
    try {
      setError('')
      const response = await fetch(`${API_URL}/assignments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not update assignment status.')
      }

      setAssignments((current) =>
        current.map((item) => (item._id === id ? { ...item, completed: data.completed } : item))
      )

      setNotification(
        data.completed
          ? 'Great job! Assignment marked as completed.'
          : 'Assignment moved back to pending.'
      )
      setTimeout(() => setNotification(''), 3000)

      // Refresh analytics data
      const resAnalytics = await fetch(`${API_URL}/assignments/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const analyticsRes = await resAnalytics.json()
      if (resAnalytics.ok) {
        setAnalyticsData(analyticsRes)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const completedCount = assignments.filter((a) => a.completed).length
  const pendingCount = assignments.length - completedCount
  const rejectedCount = assignments.filter((a) => a.submissionStatus === 'rejected').length
  const teachers = analyticsData?.teachers || []

  return (
    <main className="dashboard student-dashboard-page">
      {/* Student Hero Banner */}
      <section className="dashboard-hero student-hero">
        <div className="hero-content">
          <div className="hero-badge-strip">
            <span className="role-badge role-badge-student">
              <GraduationCap size={15} /> Student Portal
            </span>
            <span className="department-badge">
              <Building2 size={14} /> {user?.department || 'Computer Science & Engineering'}
            </span>
            <span className="section-badge">
              <Layers size={14} /> Section {user?.section || 'A'}
            </span>
            <span className="email-badge">
              {user?.email}
            </span>
          </div>

          <h1>Welcome, {user?.name}</h1>
          <p className="hero-subtext">
            Here are the coursework assignments published by faculty in{' '}
            <strong>{user?.department || 'your department'}</strong> (Section{' '}
            <strong>{user?.section}</strong>). Submit your written assignments as PDF or Word documents
            to receive marks and feedback.
          </p>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={fetchStudentData}
          disabled={loading}
          title="Refresh Dashboard Data"
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          <span>{loading ? 'Refreshing...' : 'Sync Tasks'}</span>
        </button>
      </section>

      {/* Alert Notifications */}
      {error && (
        <div className="error-banner" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {notification && (
        <div className="success-banner" role="status">
          <UserCheck size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* Rejected Assignments Alert Warning Banner */}
      {rejectedCount > 0 && (
        <div className="error-banner rejection-global-warning" role="alert">
          <AlertTriangle size={20} />
          <div>
            <strong>Action Needed: {rejectedCount} Assignment{rejectedCount > 1 ? 's' : ''} Rejected</strong>
            <p>
              Your faculty has rejected {rejectedCount} submission{rejectedCount > 1 ? 's' : ''}. Check the assignments below to read the faculty message and click <strong>Submit Again</strong> to re-upload.
            </p>
          </div>
        </div>
      )}

      {/* Teachers for this Department & Section Card */}
      {teachers.length > 0 && (
        <section className="section-instructors-card">
          <div className="instructors-card-header">
            <BookOpen size={18} />
            <span>Course Instructors ({user?.department}, Sec {user?.section}):</span>
          </div>
          <div className="instructors-list">
            {teachers.map((t, idx) => (
              <div className="instructor-item" key={idx}>
                <span className="instructor-name">
                  <User size={13} /> Prof. {t.name}
                </span>
                <span className="instructor-email">
                  <Mail size={13} /> {t.email}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 1. Student Data Analysis (Charts & KPI breakdown) */}
      <AssignmentChart
        assignments={assignments}
        completed={completedCount}
        pending={pendingCount}
        section={user?.section || 'A'}
      />

      {/* 2. Assignments List */}
      <AssignmentList
        assignments={assignments}
        role="student"
        user={user}
        onToggleComplete={handleToggleComplete}
        onRefreshData={fetchStudentData}
      />
    </main>
  )
}

export default StudentDashboard
