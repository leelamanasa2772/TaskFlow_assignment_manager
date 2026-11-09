import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Users,
  BookOpen,
  Layers,
  Building2,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react'

const COMMON_DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence & Data Science'
]

const Register = () => {
  const [role, setRole] = useState('student') // 'student' | 'faculty'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Department state
  const [department, setDepartment] = useState('Computer Science & Engineering')
  const [customDepartment, setCustomDepartment] = useState('')
  const [useCustomDepartment, setUseCustomDepartment] = useState(false)

  // Section state - clean input box without fixed A, B, C, D buttons
  const [section, setSection] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const finalDepartment = (useCustomDepartment ? customDepartment : department).trim()
  const finalSection = section.trim().toUpperCase()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setIsSuccess(false)

    if (!finalDepartment) {
      setMessage('Please choose or enter a valid Department.')
      return
    }

    if (!finalSection) {
      setMessage('Please enter your Section.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match. Please re-enter.')
      return
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          department: finalDepartment,
          section: finalSection,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.')
      }

      setIsSuccess(true)
      setMessage(
        `${role === 'faculty' ? 'Faculty' : 'Student'} account created successfully for ${finalDepartment} (Section ${finalSection})! Redirecting to login...`
      )
      setTimeout(() => navigate('/login'), 1500)
    } catch (error) {
      setIsSuccess(false)
      setMessage(error.message || 'Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card register-card" onSubmit={handleSubmit}>
        <h1>Create an Account</h1>
        <p>Register as a student or faculty member to access TaskFlow.</p>

        {/* 1. Role Selection (Student vs Faculty) */}
        <div className="role-selector-container">
          <label className="role-selector-label">
            Account Type <span>(Choose your role)</span>
          </label>
          <div className="role-options-grid">
            <button
              type="button"
              className={`role-option-btn ${role === 'student' ? 'selected' : ''}`}
              onClick={() => setRole('student')}
            >
              <div className="role-btn-icon">
                <GraduationCap size={22} />
              </div>
              <div className="role-btn-text">
                <strong>Student</strong>
                <span>View department assignments, write exams & submit documents</span>
              </div>
            </button>

            <button
              type="button"
              className={`role-option-btn ${role === 'faculty' ? 'selected' : ''}`}
              onClick={() => setRole('faculty')}
            >
              <div className="role-btn-icon faculty-icon">
                <BookOpen size={22} />
              </div>
              <div className="role-btn-text">
                <strong>Faculty / Teacher</strong>
                <span>Prepare online exams, post offline coursework & assign marks</span>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Department Selector */}
        <div className="department-selector-container">
          <label className="section-label">
            <Building2 size={15} /> Academic Department
            <span className="section-hint">
              (Students and faculty in the same department will share coursework)
            </span>
          </label>

          <div className="department-select-wrapper">
            <select
              value={useCustomDepartment ? '__CUSTOM__' : department}
              onChange={(e) => {
                if (e.target.value === '__CUSTOM__') {
                  setUseCustomDepartment(true)
                } else {
                  setUseCustomDepartment(false)
                  setDepartment(e.target.value)
                }
              }}
              className="department-dropdown"
            >
              {COMMON_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
              <option value="__CUSTOM__">+ Other / Enter Custom Department...</option>
            </select>
          </div>

          {useCustomDepartment && (
            <input
              type="text"
              placeholder="Enter your department name (e.g. Chemical Engineering, Biotechnology)"
              value={customDepartment}
              onChange={(e) => setCustomDepartment(e.target.value)}
              className="custom-section-input"
              required
            />
          )}
        </div>

        {/* 3. Section Input Box (Removed fixed A, B, C, D buttons as requested) */}
        <div className="section-selector-container">
          <label className="section-label">
            <Layers size={15} /> Classroom Section
            <span className="section-hint">
              (Type your section code, e.g. A, B, C, CSE-A)
            </span>
          </label>

          <input
            type="text"
            placeholder="Enter Section (e.g. A, B, C, D, CSE-A)"
            value={section}
            onChange={(e) => setSection(e.target.value.toUpperCase())}
            className="section-text-input"
            required
          />
        </div>

        <div className="sync-info-box">
          <Info size={16} />
          <span>
            <strong>Department & Section Sync:</strong> Faculty assignments will only be visible to students enrolled in the same <em>Department</em> and <em>Section</em>.
          </span>
        </div>

        {/* 4. Name */}
        <label>
          Full Name
          <input
            type="text"
            placeholder={role === 'faculty' ? 'e.g. Dr. Jane Smith' : 'e.g. John Doe'}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        {/* 5. Email */}
        <label>
          Email Address
          <span className="field-note">
            (Teacher and student email addresses cannot be the same)
          </span>
          <input
            type="email"
            placeholder={
              role === 'faculty'
                ? 'faculty@university.edu'
                : 'student@university.edu'
            }
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        {/* 6. Password */}
        <label>
          Password
          <input
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        {/* 7. Confirm Password */}
        <label>
          Confirm Password
          <input
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        {message && (
          <div
            className={`auth-alert-message ${
              isSuccess ? 'success-alert' : 'error-alert'
            }`}
            role="status"
          >
            {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message}</span>
          </div>
        )}

        <button type="submit" disabled={loading} className="register-submit-btn">
          {loading
            ? 'Creating account...'
            : `Register as ${role === 'faculty' ? 'Faculty' : 'Student'} (${finalDepartment || 'Dept'}, Sec ${finalSection || '...'})`}
        </button>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </main>
  )
}

export default Register
