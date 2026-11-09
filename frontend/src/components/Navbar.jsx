import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, BookOpen, Layers, Building2, LogOut } from 'lucide-react'

const Navbar = ({ isLoggedIn, user, onLogout }) => {
  const navigate = useNavigate()

  const handleLogoutClick = () => {
    onLogout()
    navigate('/login')
  }

  // Get a readable short department tag for the navbar pill
  const getDeptShort = (dept) => {
    if (!dept) return 'Dept'
    if (dept.includes('Computer Science')) return 'CSE'
    if (dept.includes('Information Technology')) return 'IT'
    if (dept.includes('Electronics & Communication')) return 'ECE'
    if (dept.includes('Electrical & Electronics')) return 'EEE'
    if (dept.includes('Mechanical')) return 'MECH'
    if (dept.includes('Civil')) return 'CIVIL'
    if (dept.includes('Artificial Intelligence')) return 'AI/DS'
    return dept.length > 8 ? dept.slice(0, 8) + '...' : dept
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo-link">
        <h2>TaskFlow</h2>
      </Link>

      <nav>
        <Link to="/">Home</Link>

        {isLoggedIn ? (
          <>
            {user?.role === 'faculty' ? (
              <>
                <Link to="/faculty-dashboard" className="nav-dashboard-link">
                  Faculty Dashboard
                </Link>
                <Link to="/assignments"></Link>
              </>
            ) : (
              <>
                <Link to="/student-dashboard" className="nav-dashboard-link">
                  Student Dashboard
                </Link>
                <Link to="/assignments"></Link>
              </>
            )}

            <div className="navbar-user-chip">
              <span
                className={`navbar-role-pill ${
                  user?.role === 'faculty' ? 'faculty-pill' : 'student-pill'
                }`}
              >
                {user?.role === 'faculty' ? (
                  <>
                    <BookOpen size={12} /> Faculty
                  </>
                ) : (
                  <>
                    <GraduationCap size={12} /> Student
                  </>
                )}
                <span className="pill-divider">•</span>
                <span className="pill-dept" title={user?.department}>
                  {getDeptShort(user?.department)}
                </span>
                <span className="pill-divider">•</span>
                <span className="pill-section">Sec {user?.section || 'A'}</span>
              </span>

              <span className="navbar-username">
                {user?.name || user?.email || 'User'}
              </span>
            </div>

            <button
              type="button"
              className="navbar-logout-btn"
              onClick={handleLogoutClick}
              title="Log out of TaskFlow"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/about">About</Link>
            <Link to="/help">Help</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/login" className="nav-auth-link">Login</Link>
            <Link to="/register" className="nav-register-btn">Register</Link>
          </>
        )}
      </nav>
    </header>
  )
}

export default Navbar
