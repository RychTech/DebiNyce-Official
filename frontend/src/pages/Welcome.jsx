export default function WelcomeOverlay({ onClose }) {
  return (
    <div className="welcome-overlay" role="dialog" aria-modal="true" aria-label="Welcome">
      <h1 className="welcome-title">Welcome To DebiNyce</h1>
      <p className="welcome-tagline">Sync To The Groove.</p>

      <button
        className="btn btn-primary"
        style={{ marginTop: '40px', position: 'relative', zIndex: 1 }}
        onClick={onClose}
      >
        Let's Go
      </button>
    </div>
  )
}
