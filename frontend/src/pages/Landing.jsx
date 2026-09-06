export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Background */}
      <div className="landing-bg" />
      <div className="landing-bg-orb landing-bg-orb--1" />
      <div className="landing-bg-orb landing-bg-orb--2" />

      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <span className="landing-brand">DebiNyce</span>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="/login" className="landing-nav-link">Log In</a>
            <a href="/signup" className="btn btn-primary btn-sm">Sign Up</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-badge">
          <span className="landing-hero-badge-dot" />
          The Next-Gen Music Library & Player
        </div>

        <h1 className="landing-hero-title">
          <span className="landing-hero-title-main">DebiNyce</span>
          <span className="landing-hero-title-accent">Sync To The Groove.</span>
        </h1>

        <p className="landing-hero-desc">
          A Spotify-like experience built for listeners and artists — with synced
          lyrics, real-time visualizations, and a platform where musicians own
          their sound.
        </p>

        <div className="landing-hero-actions">
          <a href="/signup" className="btn btn-primary btn-lg">Get Started — Free</a>
          <a href="/login" className="btn btn-ghost btn-lg">Already a Listener? Log In</a>
        </div>

        {/* Mock player card */}
        <div className="landing-hero-visual">
          <div className="player-mock">
            <div className="player-mock-art">
              <span className="player-mock-art-icon">♪</span>
            </div>
            <div className="player-mock-body">
              <div className="player-mock-title">Midnight Drift</div>
              <div className="player-mock-artist">by Lina Waves</div>
              <div className="player-mock-controls">
                <span className="player-mock-time">1:24</span>
                <div className="player-mock-progress">
                  <div className="player-mock-progress-fill" />
                </div>
                <span className="player-mock-time">3:10</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features" id="features">
        <h2 className="landing-features-title">Built for the music, not the metrics</h2>

        <div className="landing-features-grid">
          <div className="feature-card">
            <div className="feature-icon">▶️</div>
            <div className="feature-title">A player that follows you</div>
            <div className="feature-desc">
              Keep the music playing while you browse anywhere. Minimize the player, skip, shuffle, queue up tracks or set a sleep timer — the groove never stops.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <div className="feature-title">Live charts & real-time analytics</div>
            <div className="feature-desc">
              Rankings for the most played, streamed, liked and shared tracks, plus an admin console with live activity feeds, interactive graphs and top artists.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🌊</div>
            <div className="feature-title">Real-time audio visuals</div>
            <div className="feature-desc">
              A water-ripple animation on the lyric background that reacts live to the song's beat intensity and FFT frequency via the Web Audio API.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <div className="feature-title">Artist-first uploads</div>
            <div className="feature-desc">
              Artists upload music files directly, design album art, choose backgrounds, and pick from multiple fonts. No gatekeeping — just approval and a platform that listens.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <div className="feature-title">Collaborate with other artists</div>
            <div className="feature-desc">
              Send friend requests, then collaboration requests. When accepted, bios and contact info are shared so you can work together directly.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <div className="feature-title">Share playlists with codes & links</div>
            <div className="feature-desc">
              Build public or private playlists. Share an invitation code or a link so others can join. Your music community, your way.
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-brand">DebiNyce</div>
        <div className="landing-footer-text">Sync To The Groove.</div>
      </footer>
    </div>
  )
}
