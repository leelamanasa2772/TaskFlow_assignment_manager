import React, { useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
} from 'react-router-dom'
import { GraduationCap, BookOpen, Layers, ArrowRight, CheckCircle2, BarChart3 } from 'lucide-react'

import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'

import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import FacultyDashboard from './pages/FacultyDashboard.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import About from './pages/About.jsx'
import Help from './pages/Help.jsx'
import Contact from './pages/Contact.jsx'

import './App.css'

const App = () => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('taskflowUser')) || null
    } catch {
      return null
    }
  })

  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    Boolean(localStorage.getItem('taskflowToken'))
  )

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('taskflowToken')
    localStorage.removeItem('taskflowUser')
    setUser(null)
    setIsLoggedIn(false)
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar
          isLoggedIn={isLoggedIn}
          user={user}
          onLogout={handleLogout}
        />

        <Routes>
          {/* Home Route: If logged in, directs to respective dashboard, else shows Landing */}
          <Route
            path="/"
            element={
              isLoggedIn ? (
                user?.role === 'faculty' ? (
                  <FacultyDashboard user={user} />
                ) : (
                  <StudentDashboard user={user} />
                )
              ) : (
                <main className="dashboard landing-page">
                  <section className="home-intro">
                    <div className="landing-badge">
                      <GraduationCap size={16} />
                      <span>Section-Based Academic Task Platform</span>
                    </div>

                    <h1>
                      Organize Coursework with <span className="text-gradient">TaskFlow</span>
                    </h1>

                    <p>
                      TaskFlow connects faculty and students through smart classroom sections.
                      Teachers create and manage assignments; students stay on track with real-time
                      completion analytics.
                    </p>

                    <div className="landing-action-buttons">
                      <Link to="/register" className="primary-button hero-btn">
                        <span>Get Started Free</span>
                        <ArrowRight size={16} />
                      </Link>
                      <Link to="/login" className="secondary-button hero-btn">
                        <span>Sign In</span>
                      </Link>
                    </div>
                  </section>

                  {/* Dual Role Feature Showcases */}
                  <section className="home-info">
                    <h2>Two Dedicated Portals in One System</h2>

                    <div className="info-grid dual-portal-grid">
                      <article className="info-card portal-card faculty-showcase">
                        <div className="portal-card-badge faculty-theme">
                          <BookOpen size={20} />
                          <span>Faculty Portal</span>
                        </div>
                        <h3>For Instructors & Teachers</h3>
                        <p>
                          Publish assignments targeted to your specific classroom section. Only
                          faculty have permissions to add and delete coursework.
                        </p>
                        <ul className="portal-feature-list">
                          <li><CheckCircle2 size={14} /> Add & delete section assignments</li>
                          <li><CheckCircle2 size={14} /> Real-time student completion rates</li>
                          <li><CheckCircle2 size={14} /> Interactive submission analytics</li>
                          <li><CheckCircle2 size={14} /> Enrolled student roster progress</li>
                        </ul>
                      </article>

                      <article className="info-card portal-card student-showcase">
                        <div className="portal-card-badge student-theme">
                          <GraduationCap size={20} />
                          <span>Student Portal</span>
                        </div>
                        <h3>For Students</h3>
                        <p>
                          Assignments created by your section teacher automatically sync to your
                          personal dashboard. Mark tasks complete and monitor your deadlines.
                        </p>
                        <ul className="portal-feature-list">
                          <li><CheckCircle2 size={14} /> View section teacher assignments</li>
                          <li><CheckCircle2 size={14} /> Personal completion status tracking</li>
                          <li><CheckCircle2 size={14} /> Interactive workload charts & metrics</li>
                          <li><CheckCircle2 size={14} /> Urgent due-soon deadline alerts</li>
                        </ul>
                      </article>
                    </div>
                  </section>
                </main>
              )
            }
          />

          {/* Dedicated Faculty Dashboard Route */}
          <Route
            path="/faculty-dashboard"
            element={
              isLoggedIn ? (
                user?.role === 'faculty' ? (
                  <FacultyDashboard user={user} />
                ) : (
                  <Navigate to="/student-dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Dedicated Student Dashboard Route */}
          <Route
            path="/student-dashboard"
            element={
              isLoggedIn ? (
                user?.role === 'student' ? (
                  <StudentDashboard user={user} />
                ) : (
                  <Navigate to="/faculty-dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Assignments Route (Smart redirection based on role) */}
          <Route
            path="/assignments"
            element={
              isLoggedIn ? (
                user?.role === 'faculty' ? (
                  <FacultyDashboard user={user} />
                ) : (
                  <StudentDashboard user={user} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/login"
            element={
              isLoggedIn ? (
                <Navigate
                  to={user?.role === 'faculty' ? '/faculty-dashboard' : '/student-dashboard'}
                  replace
                />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />

          <Route
            path="/register"
            element={
              isLoggedIn ? (
                <Navigate
                  to={user?.role === 'faculty' ? '/faculty-dashboard' : '/student-dashboard'}
                  replace
                />
              ) : (
                <Register />
              )
            }
          />

          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
