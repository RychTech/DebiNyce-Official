import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PlayerProvider from './context/PlayerContext'
import MiniPlayer from './components/MiniPlayer'
import PlayerOverlay from './components/PlayerOverlay'
import LandingPage from './pages/Landing.jsx'
import LoginPage from './pages/Login.jsx'
import SignupPage from './pages/Signup.jsx'
import ArtistSignupPage from './pages/ArtistSignup.jsx'
import ArtistDashboard from './pages/ArtistDashboard.jsx'
import HomePage from './pages/Home.jsx'
import SongDetailPage from './pages/SongDetail.jsx'
import ChartsPage from './pages/Charts.jsx'
import LikedPage from './pages/Liked.jsx'
import ArtistPage from './pages/ArtistPage.jsx'
import PlaylistsPage from './pages/Playlists.jsx'
import PlaylistInvitePage from './pages/PlaylistInvite.jsx'
import AdminPage from './pages/Admin.jsx'
import WelcomeOverlay from './pages/Welcome.jsx'

const API_BASE = '/api'

function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = (token) => {
    return fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => (data.success && data.user ? data.user : null))
      .catch(() => null)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    fetchMe(token)
      .then((u) => {
        if (!u) localStorage.removeItem('token')
        setUser(u)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return { user, loading, login, logout }
}

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes({ user, logout, loading }) {
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/home" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/home" replace /> : <SignupPage />} />
      <Route path="/artistsignup" element={user ? <Navigate to="/home" replace /> : <ArtistSignupPage />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute user={user}>
            <HomePage user={user} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/artist-dashboard"
        element={
          <ProtectedRoute user={user}>
            <ArtistDashboard user={user} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route path="/songs/:id" element={<SongDetailPage user={user} onLogout={logout} />} />
      <Route path="/artists/:id" element={<ArtistPage user={user} onLogout={logout} />} />
      <Route
        path="/charts"
        element={
          <ProtectedRoute user={user}>
            <ChartsPage user={user} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/liked"
        element={
          <ProtectedRoute user={user}>
            <LikedPage user={user} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/playlists"
        element={
          <ProtectedRoute user={user}>
            <PlaylistsPage user={user} onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route path="/playlists/invite/:code" element={<PlaylistInvitePage />} />
      <Route
        path="/dashboard"
        element={
          user ? (
            <Navigate
              to={
                user.role === 'ADMIN'
                  ? '/admin'
                  : user.role === 'ARTIST' && user.artistStatus === 'APPROVED'
                    ? '/artist-dashboard'
                    : '/home'
              }
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute user={user}>
            <AdminPage user={user} onLogout={logout} />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(false)
  const { user, loading, login, logout } = useAuth()

  useEffect(() => {
    if (user?.isFirstLogin && !showWelcome) {
      const timer = setTimeout(() => setShowWelcome(true), 800)
      return () => clearTimeout(timer)
    }
  }, [user, showWelcome])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            login(token, data.user)
            window.history.replaceState({}, '', '/home')
            if (data.user.isFirstLogin) {
              setTimeout(() => setShowWelcome(true), 600)
            }
          }
        })
        .catch(() => window.history.replaceState({}, '', '/'))
    }
  }, [])

  if (loading) return null

  return (
    <PlayerProvider>
      <BrowserRouter>
        <AppRoutes user={user} logout={logout} loading={loading} />
        <MiniPlayer />
      </BrowserRouter>
      {showWelcome && <WelcomeOverlay onClose={() => setShowWelcome(false)} />}
      <PlayerOverlay />
    </PlayerProvider>
  )
}