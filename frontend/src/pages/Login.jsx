import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = '/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Login failed. Check your credentials.')
        return
      }
      // Store token and user
      localStorage.setItem('token', data.token)
      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        navigate('/admin')
      } else if (data.user.role === 'ARTIST' && data.user.artistStatus === 'APPROVED') {
        navigate('/artist-dashboard')
      } else {
        navigate('/')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = (provider) => {
    window.location.href = `${API_BASE}/auth/${provider}`
  }

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="auth-bg-orb auth-bg-orb--peach" />
      <div className="auth-bg-orb auth-bg-orb--blue" />

      <div className="auth-layout">
        {/* Left side: visual (desktop only) */}
        <div className="auth-visual">
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '4rem',
                fontWeight: 900,
                background: 'var(--gradient-brand)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.03em',
                marginBottom: '12px',
              }}
            >
              DebiNyce
            </div>
            <div
              style={{
                color: 'var(--peach-300)',
                fontSize: '1.25rem',
                fontWeight: 400,
              }}
            >
              Sync To The Groove.
            </div>
            <div
              style={{
                marginTop: '48px',
                color: 'var(--black-400)',
                fontSize: '0.875rem',
                maxWidth: '280px',
                lineHeight: 1.6,
              }}
            >
              A music library and player built for listeners and artists — with synced
              lyrics, real-time visuals, and a platform that puts musicians first.
            </div>
          </div>
        </div>

        {/* Right side: form */}
        <div className="auth-content">
          <div className="auth-brand">
            <div className="auth-brand-logo">DebiNyce</div>
            <div className="auth-brand-tagline">Sync To The Groove.</div>
          </div>

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Log in to your listening library</p>

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                color: '#ef4444',
                fontSize: '0.875rem',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="label" htmlFor="login-username">Username or Email</label>
              <input
                id="login-username"
                className="input"
                type="text"
                placeholder="Enter username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="login-password">Password</label>
              <div className="password-input">
                <input
                  id="login-password"
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>

          {/* OAuth buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
            <div className="divider" style={{ margin: 0 }} />
            <span style={{ color: 'var(--black-400)', fontSize: '0.8125rem', textAlign: 'center', marginTop: '8px' }}>
              Or continue with
            </span>

            <button
              type="button"
              className="btn-oauth"
              onClick={() => handleOAuth('google')}
              style={{ marginTop: '10px' }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.604-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.887 12 24 12c3.114 0 5.938 1.108 8.196 2.902l6.571 4.819c.722 0 1.35-.555 1.35-1.35 0-.796-.639-1.528-1.408-1.768l-8.533-6.52C20.639 6.089 17.044 4 12.997 4 9.706 4 6.817 5.702 5.317 8.081l-6.57 4.82C.081 13.698-.18 14.406 0 15.155c0 .748.63 1.357 1.384 1.357z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-2.138 13.409-5.658l-6.197-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.571 4.819C9.086 39.545 16.26 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-7.75-3.26l-4.516-3.535A11.91 11.91 0 0 0 24 12c4.768 0 8.959 2.52 11.303 6.233l4.516-3.536z"/>
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              className="btn-oauth"
              onClick={() => handleOAuth('facebook')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#1877F2"
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.947 4.340 10.93 10.022 11.884v-8.281h-3.79v-3.907h3.79V9.723c0-3.92 2.617-6.357 5.917-6.357v-4.323h3.79v4.354C22.667 9.74 24 11.176 24 12.073z"
                />
              </svg>
              Continue with Facebook
            </button>
          </div>
        </div>
      </div>

      <div className="auth-footer">
        Don't have an account?{' '}
        <a href="/signup">Sign up for free</a>
      </div>
    </div>
  )
}
