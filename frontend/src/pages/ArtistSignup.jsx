import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = '/api'

export default function ArtistSignupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState(1)

  // Form state
  const [fullName, setFullName] = useState('')
  const [artistProfile, setArtistProfile] = useState('')
  const [nationality, setNationality] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selfPhotoDoc, setSelfPhotoDoc] = useState(null)
  const [nationalIdDoc, setNationalIdDoc] = useState(null)

  const handleFileChange = (setter) => (e) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

if (!fullName || !artistProfile || !nationality || !phone || !email || !password) {
      setError('Full name, artist profile name, nationality, phone, email, and password are required.')
      return
    }

    setLoading(true)

    try {
      // First login to get the token
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      })

      const loginData = await loginRes.json()

      if (!loginRes.ok) {
        setError(loginData.message || 'Login failed. Please check your credentials.')
        setLoading(false)
        return
      }

      const token = loginData.token

      // Submit artist verification
      const formData = new FormData()
      formData.append('fullName', fullName)
      formData.append('artistProfile', artistProfile)
      formData.append('nationality', nationality)
      formData.append('phone', phone)

      if (selfPhotoDoc) {
        formData.append('selfPhotoDoc', selfPhotoDoc)
      }
      if (nationalIdDoc) {
        formData.append('nationalIdDoc', nationalIdDoc)
      }

      const res = await fetch(`${API_BASE}/artists/signup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Artist verification submission failed.')
        setLoading(false)
        return
      }

      setSuccess('Artist verification submitted successfully! Awaiting admin approval.')
      setStep(3)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 3) {
    return (
      <div className="auth-page">
        <div className="auth-bg-orb auth-bg-orb--peach" />
        <div className="auth-bg-orb auth-bg-orb--blue" />

        <div className="auth-layout">
          <div className="auth-content">
            <div className="auth-brand">
              <div className="auth-brand-logo">DebiNyce</div>
              <div className="auth-brand-tagline">Sync To The Groove.</div>
            </div>

            <div
              style={{
                textAlign: 'center',
                padding: '40px 0',
              }}
            >
              <div
                style={{
                  fontSize: '3rem',
                  marginBottom: '16px',
                }}
              >
                ✅
              </div>
              <h1 className="auth-title">Verification Submitted</h1>
              <p className="auth-subtitle">
                Your artist application is now under review.
              </p>

              {success && (
                <div
                  style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    color: '#22c55e',
                    fontSize: '0.9375rem',
                    margin: '24px auto',
                    maxWidth: '400px',
                  }}
                >
                  {success}
                </div>
              )}

              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  marginBottom: '32px',
                }}
              >
                You'll receive an email once your account is approved.
                Until then, you can explore DebiNyce as a listener.
              </p>

              <button
                className="btn btn-primary"
                onClick={() => navigate('/')}
                style={{ marginTop: '8px' }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
              Ready to share your sound with the world?
              Join DebiNyce as an artist and reach listeners who
              appreciate your music.
            </div>
          </div>
        </div>

        {/* Right side: form */}
        <div className="auth-content">
          <div className="auth-brand">
            <div className="auth-brand-logo">DebiNyce</div>
            <div className="auth-brand-tagline">Sync To The Groove.</div>
          </div>

          <h1 className="auth-title">Become an Artist</h1>
          <p className="auth-subtitle">
            Share your music with the world — requires admin approval
          </p>

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
            {/* Login info */}
            <div
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '8px',
              }}
            >
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                Sign in with the account you want to convert to an artist account
              </p>

              <div className="form-group">
                <label className="label" htmlFor="artist-email">Email</label>
                <input
                  id="artist-email"
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="artist-password">Password</label>
                <div className="password-input">
                  <input
                    id="artist-password"
                    className="input"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </div>

            <div className="divider" style={{ margin: '8px 0' }} />

            {/* Artist info */}
            <div className="form-group">
              <label className="label" htmlFor="artist-fullname">Full Name *</label>
              <input
                id="artist-fullname"
                className="input"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="artist-profile">Artist Profile Name *</label>
              <input
                id="artist-profile"
                className="input"
                type="text"
                placeholder="Lina Waves"
                value={artistProfile}
                onChange={(e) => setArtistProfile(e.target.value)}
                required
              />
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                This is the name fans will see on your profile
              </span>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="artist-nationality">Nationality *</label>
              <input
                id="artist-nationality"
                className="input"
                type="text"
                placeholder="American, Nigerian, British..."
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="artist-phone">Phone Number *</label>
              <input
                id="artist-phone"
                className="input"
                type="tel"
                placeholder="+1 234 567 890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </div>

            {/* Document uploads */}
            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '16px',
                marginTop: '8px',
              }}
            >
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                Verification Documents (optional but recommended for faster approval)
              </p>

              <div className="form-group">
                <label className="label" htmlFor="artist-self-photo">
                  Self Photo (optional)
                </label>
                <input
                  id="artist-self-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange(setSelfPhotoDoc)}
                  style={{
                    fontWeight: 'normal',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                  }}
                />
                {selfPhotoDoc && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--peach-300)' }}>
                    ✓ {selfPhotoDoc.name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="label" htmlFor="artist-national-id">
                  National ID (optional)
                </label>
                <input
                  id="artist-national-id"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange(setNationalIdDoc)}
                  style={{
                    fontWeight: 'normal',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                  }}
                />
                {nationalIdDoc && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--peach-300)' }}>
                    ✓ {nationalIdDoc.name}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? 'Submitting…' : 'Submit for Approval'}
            </button>

            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                lineHeight: 1.6,
              }}
            >
              After submission, your application will be reviewed by an admin.
              You'll be notified once approved and can start uploading music.
            </p>
          </form>

          {/* Back to signup */}
          <div className="auth-footer" style={{ marginTop: '24px' }}>
            Not an artist?{' '}
            <a href="/signup">Sign up as a listener</a>
          </div>
        </div>
      </div>
    </div>
  )
}
