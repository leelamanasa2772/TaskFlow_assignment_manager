import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Layers,
  Building2,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  Clock,
  Award
} from 'lucide-react'
import FacultyAnalytics from '../components/FacultyAnalytics.jsx'
import AddAssignment from '../components/AddAssignment.jsx'
import AssignmentList from '../components/AssignmentList.jsx'

const API_URL = 'http://localhost:5000/api'

const FacultyDashboard = ({ user }) => {
  const [assignments, setAssignments] = useState([])
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState('')

  const token = localStorage.getItem('taskflowToken')

  const fetchFacultyData = async () => {
    try {
      setError('')
      setLoading(true)

      // 1. Fetch assignments
      const resAssignments = await fetch(`${API_URL}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const assignmentsData = await resAssignments.json()
      if (!resAssignments.ok) {
        throw new Error(assignmentsData.message || 'Could not load assignments.')
      }
      setAssignments(assignmentsData)

      // 2. Fetch analytics
      const resAnalytics = await fetch(`${API_URL}/assignments/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const analyticsRes = await resAnalytics.json()
      if (resAnalytics.ok) {
        setAnalyticsData(analyticsRes)
      }
    } catch (err) {
      setError(err.message || 'Error fetching faculty dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFacultyData()
  }, [user?.id])

  const handleAddAssignment = async (newAssignment) => {
    try {
      setError('')
      setNotification('')
      const response = await fetch(`${API_URL}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAssignment),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not add assignment.')
      }

      setNotification(
        `Assignment "${data.title}" posted successfully to ${data.department} (Section ${data.section})!`
      )
      setTimeout(() => setNotification(''), 4000)

      // Reload assignments and analytics
      await fetchFacultyData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteAssignment = async (id) => {
    try {
      setError('')
      setNotification('')
      const response = await fetch(`${API_URL}/assignments/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not delete assignment.')
      }

      setNotification('Assignment and all student submissions deleted successfully.')
      setTimeout(() => setNotification(''), 4000)

      // Update local state and reload analytics
      setAssignments((current) => current.filter((item) => item._id !== id))
      fetchFacultyData()
    } catch (err) {
      setError(err.message)
    }
  }

  const pendingReviews = analyticsData?.pendingReviewsCount || 0

  return (
    <main className="dashboard faculty-dashboard-page">
      {/* Faculty Hero Banner */}
      <section className="dashboard-hero faculty-hero">
        <div className="hero-content">
          <div className="hero-badge-strip">
            <span className="role-badge role-badge-faculty">
              <GraduationCap size={15} /> Faculty Portal
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

          <h1>Welcome back, Professor {user?.name}</h1>
          <p className="hero-subtext">
            Manage course assignments, publish online or offline coursework to students in{' '}
            <strong>{user?.department} (Section {user?.section})</strong>, evaluate PDF/Word submissions,
            and assign marks or request re-submissions.
          </p>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={fetchFacultyData}
          disabled={loading}
          title="Refresh Dashboard Data"
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          <span>{loading ? 'Refreshing...' : 'Sync Data'}</span>
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

      {/* Pending Reviews Notice Banner */}
      {pendingReviews > 0 && (
        <div className="attention-banner" role="status">
          <Clock size={18} />
          <span>
            You have <strong>{pendingReviews} student submission{pendingReviews > 1 ? 's' : ''}</strong> awaiting review. Click "View Submissions & Grade" on an assignment to download documents and assign marks.
          </span>
        </div>
      )}

      {/* 1. Faculty Data Analytics */}
      <FacultyAnalytics
        analyticsData={analyticsData}
        section={user?.section || 'A'}
        department={user?.department || 'Computer Science & Engineering'}
      />

      {/* 2. Add Assignment Form (Faculty only) */}
      <AddAssignment
        onAdd={handleAddAssignment}
        defaultSection={user?.section || 'A'}
        defaultDepartment={user?.department || 'Computer Science & Engineering'}
      />

      {/* 3. Assignment Management List */}
      <AssignmentList
        assignments={assignments}
        role="faculty"
        user={user}
        onDelete={handleDeleteAssignment}
        onRefreshData={fetchFacultyData}
      />
    </main>
  )
}

export default FacultyDashboard
