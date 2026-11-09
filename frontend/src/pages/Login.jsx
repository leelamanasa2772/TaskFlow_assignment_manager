import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, AlertCircle, CheckCircle2 } from 'lucide-react'

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.')
      }

      if (!data.token || !data.user) {
        throw new Error('Login response is missing user information.')
      }

      localStorage.setItem('taskflowToken', data.token)
      localStorage.setItem('taskflowUser', JSON.stringify(data.user))

      // Update login state in parent App
      onLogin(data.user)

      setMessage('Login successful! Redirecting to your dashboard...')

      setTimeout(() => {
        if (data.user.role === 'faculty') {
          navigate('/faculty-dashboard')
        } else {
          navigate('/student-dashboard')
        }
      }, 700)
    } catch (error) {
      setMessage(error.message || 'Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Welcome Back</h1>
        <p>Log in to access your student or faculty dashboard.</p>

        <label>
          Email Address
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {message && (
          <div
            className={`auth-alert-message ${
              message.includes('successful') ? 'success-alert' : 'error-alert'
            }`}
            role="status"
          >
            {message.includes('successful') ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{message}</span>
          </div>
        )}

        <button type="submit" disabled={loading} className="login-submit-btn">
          <LogIn size={17} />
          {loading ? 'Logging in...' : 'Sign In'}
        </button>

        <p className="auth-footer-text">
          Don’t have an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </main>
  )
}

export default Login
