import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'

const vizState = { wired: false, analyser: null, dataArray: null, ctx: null, source: null }

function ensureWired(audioEl) {
  if (vizState.wired || !audioEl) return
  try {
    vizState.ctx = new (window.AudioContext || window.webkitAudioContext)()
    vizState.analyser = vizState.ctx.createAnalyser()
    vizState.analyser.fftSize = 256
    vizState.source = vizState.ctx.createMediaElementSource(audioEl)
    vizState.source.connect(vizState.analyser)
    vizState.analyser.connect(vizState.ctx.destination)
    vizState.dataArray = new Uint8Array(vizState.analyser.frequencyBinCount)
  } catch {
    // Audio graph not available for this source
  }
  vizState.wired = true
}

const SLEEP_OPTIONS = [
  { label: 'Off', seconds: null },
  { label: '10 min', seconds: 600 },
  { label: '20 min', seconds: 1200 },
  { label: '30 min', seconds: 1800 },
  { label: 'End of Track', seconds: -1 },
]

function LyricLine({ lyric, isActive, isPast }) {
  const lyricRef = useRef(null)
  useEffect(() => {
    if (isActive && lyricRef.current) {
      lyricRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [isActive])
  return (
    <div
      ref={lyricRef}
      className={`lyric-line ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
    >
      {lyric.lyricText}
    </div>
  )
}

export default function PlayerOverlay() {
  const {
    currentSong,
    queue,
    queueIndex,
    upNext,
    shuffle,
    repeat,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    showQueue,
    sleepRemaining,
    sleepEndTrack,
    playSong,
    playIndex,
    togglePlay,
    seek,
    seekBy,
    next,
    prev,
    cycleRepeat,
    toggleShuffle,
    setVolumeValue,
    toggleMute,
    closePlayer,
    toggleFull,
    toggleQueue,
    setSleep,
    clearSleep,
    setSleepEndTrack,
    like,
    share,
    formatTime,
  } = usePlayer()

  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const [showLyrics, setShowLyrics] = useState(true)
  const [showSleepMenu, setShowSleepMenu] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let mounted = true

    const draw = () => {
      if (!mounted) return
      if (!vizState.analyser || !vizState.dataArray) {
        animationRef.current = requestAnimationFrame(draw)
        return
      }
      const width = canvas.width
      const height = canvas.height
      ctx.fillStyle = 'rgba(10, 10, 14, 0.25)'
      ctx.fillRect(0, 0, width, height)
      vizState.analyser.getByteFrequencyData(vizState.dataArray)

      const bars = 48
      const bw = width / bars
      const grad = ctx.createLinearGradient(0, height, 0, 0)
      grad.addColorStop(0, '#f8a68b')
      grad.addColorStop(0.55, '#3b82f6')
      grad.addColorStop(1, '#88a9ff')

      for (let i = 0; i < bars; i++) {
        const v = vizState.dataArray[Math.floor((i / bars) * vizState.dataArray.length * 0.7)] / 255
        const bh = Math.max(2, v * height * 0.85)
        ctx.fillStyle = grad
        ctx.globalAlpha = 0.35 + v * 0.65
        ctx.beginPath()
        ctx.roundRect(i * bw + 2, height - bh, bw - 6, bh, 3)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      animationRef.current = requestAnimationFrame(draw)
    }

    const onPlay = () => {
      if (vizState.ctx && vizState.ctx.state === 'suspended') vizState.ctx.resume().catch(() => {})
      ensureWired(document.querySelector('#global-audio-source'))
      animationRef.current = requestAnimationFrame(draw)
    }

    window.addEventListener('playerplay', onPlay)
    if (isPlaying) onPlay()

    return () => {
      mounted = false
      window.removeEventListener('playerplay', onPlay)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  useEffect(() => {
    if (isPlaying) window.dispatchEvent(new Event('playerplay'))
  }, [isPlaying])

  if (!currentSong) return null

  const progress = duration ? (currentTime / duration) * 100 : 0

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    seek(pos * duration)
  }

  const sleepLabel = sleepRemaining === null
    ? 'Sleep timer'
    : sleepRemaining === -1
      ? 'Until end of track'
      : `Zzz ${Math.ceil(sleepRemaining / 60)} min`

  return (
    <div className="player-overlay">
      <div className="player-overlay-bg" />

      {showQueue && queue.length > 0 && (
        <div className="queue-drawer">
          <div className="queue-drawer-head">
            <h3>Up Next</h3>
            <span className="muted-note">{queue.length} in queue</span>
          </div>

          {queueIndex >= 0 && (
            <div className="queue-item playing">
              <div className="queue-thumb">
                {currentSong.albumArtUrl ? (
                  <img src={currentSong.albumArtUrl} alt={currentSong.title} />
                ) : (
                  <span>♪</span>
                )}
                <span className="queue-speaker" />
              </div>
              <div className="queue-info">
                <div className="queue-title">{currentSong.title}</div>
                <div className="queue-artist">
                  {currentSong.artist?.artistProfile || currentSong.artist?.fullName || 'Unknown Artist'}
                </div>
              </div>
              <span className="queue-now">Now playing</span>
            </div>
          )}

          {upNext.map((song, i) => (
            <div
              className="queue-item"
              key={song.id}
              onClick={() => playIndex(queueIndex + 1 + i)}
            >
              <div className="queue-thumb">
                {song.albumArtUrl ? <img src={song.albumArtUrl} alt={song.title} /> : <span>♪</span>}
              </div>
              <div className="queue-info">
                <div className="queue-title">{song.title}</div>
                <div className="queue-artist">
                  {song.artist?.artistProfile || song.artist?.fullName || 'Unknown Artist'}
                </div>
              </div>
            </div>
          ))}

          {upNext.length === 0 && (
            <p className="queue-empty">
              Nothing up next. Play more songs to keep the vibes going.
            </p>
          )}
        </div>
      )}

      <header className="player-overlay-top">
        <button className="btn btn-ghost btn-sm" onClick={toggleFull}>
          ← Back
        </button>
        <span className="player-overlay-brand">Now Playing</span>
        <button className="player-overlay-close" onClick={closePlayer} aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </header>

      <div className="player-overlay-body">
        <div className="player-art-large">
          {currentSong.albumArtUrl ? (
            <img src={currentSong.albumArtUrl} alt={currentSong.title} />
          ) : (
            <div className="player-art-large-ph">♪</div>
          )}

          {showLyrics && (
            <div className="lyrics-overlay">
              <div className="lyrics-content">
                {currentSong.lyrics && currentSong.lyrics.length > 0 ? (
                  currentSong.lyrics.map((lyric, index) => {
                    const t = lyric.timestamp / 1000
                    const isActive = currentTime >= t && currentTime < t + 4
                    const isPast = currentTime >= t + 4
                    return (
                      <LyricLine
                        key={lyric.id || index}
                        lyric={lyric}
                        isActive={isActive}
                        isPast={isPast}
                      />
                    )
                  })
                ) : (
                  <p className="no-lyrics">No lyrics available for this song</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="player-art-info">
          <h2 className="player-art-title">{currentSong.title}</h2>
          <p className="player-art-artist">
            {currentSong.artist?.artistProfile || currentSong.artist?.fullName || 'Unknown Artist'}
          </p>

          <div className="player-art-actions">
            <button className="icon-btn" onClick={like} aria-label="Like">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 21s-6.5-4.35-9.33-8.11C.7 9.9 1.85 6.5 5.1 6.5c1.9 0 3.1 1.1 3.9 2.15.8-1.05 2-2.15 3.9-2.15 3.25 0 4.4 3.4 2.43 6.39C18.5 16.65 12 21 12 21z" />
              </svg>
              <span>{currentSong.likes || 0}</span>
            </button>
            <button className="icon-btn" onClick={share} aria-label="Share">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
              </svg>
              <span>{currentSong.shares || 0}</span>
            </button>
            <span className="icon-btn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 4H3a1 1 0 0 0-1 1v4c2.76 0 5 2.24 5 5s-2.24 5-5 5v4a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-4c-2.76 0-5-2.24-5-5s2.24-5 5-5V5a1 1 0 0 0-1-1z" />
              </svg>
              <span>{currentSong.plays || 0} plays</span>
            </span>
          </div>
        </div>

        <div className="player-viz">
          <canvas ref={canvasRef} className="player-viz-canvas" />
        </div>

        <div className="player-overlay-controls">
          <div className="player-seek" onClick={handleSeek}>
            <div className="player-seek-fill" style={{ width: `${progress}%` }} />
            <div className="player-seek-handle" style={{ left: `${progress}%` }} />
          </div>
          <div className="player-times">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="player-buttons">
            <div className="player-toolbar">
              <button
                className={`icon-btn ${shuffle ? 'active-ctrl' : ''}`}
                onClick={toggleShuffle}
                aria-label="Shuffle"
                title="Shuffle"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                  <path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                </svg>
              </button>

              <button
                className={`icon-btn ${repeat !== 'off' ? 'active-ctrl' : ''}`}
                onClick={cycleRepeat}
                aria-label="Repeat"
                title={`Repeat: ${repeat}`}
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                  <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                </svg>
                {repeat === 'one' && <span className="repeat-one">1</span>}
              </button>
            </div>

            <button className="icon-btn player-main-btn" onClick={() => seekBy(-15)} aria-label="Back 15s" title="-15s">
              <span className="skip-label">15</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 6a6 6 0 1 1-5.47 8l2.12-1.13A4 4 0 1 0 13.15 6V3.5L9.5 7l3.65 3.5V8a6 6 0 1 1-1.15 3.87L9.88 13A8 8 0 1 0 12 6z" transform="rotate(180 12 12)" />
              </svg>
            </button>

            <button className="icon-btn player-main-btn" onClick={prev} aria-label="Previous">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button className="player-play-btn" onClick={togglePlay} aria-label="Play or pause">
              {isPlaying ? (
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button className="icon-btn player-main-btn" onClick={next} aria-label="Next">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6z" />
              </svg>
            </button>

            <button className="icon-btn player-main-btn" onClick={() => seekBy(15)} aria-label="Forward 15s" title="+15s">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 6a6 6 0 1 1-5.47 8l2.12-1.13A4 4 0 1 0 13.15 6V3.5L9.5 7l3.65 3.5V8a6 6 0 1 1-1.15 3.87L9.88 13A8 8 0 1 0 12 6z" />
              </svg>
              <span className="skip-label">15</span>
            </button>

            <div className="player-toolbar">
              <button className="icon-btn" onClick={toggleMute} aria-label="Mute">
                {isMuted || volume === 0 ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 3.27 3 20h2l-.47-.47C2.5 19.5 2 17.8 2 16c0-2.5.5-4.8 1.5-6.7L4.27 3zm2.36 2.03c-.18.11-.36.23-.55.35L3.5 9.5 13 13l2.25-1.15L8 6.83z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.87 7-4.45 7-8.77s-2.99-7.89-7-8.77z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                className="player-vol-slider"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolumeValue(e.target.value)}
              />
            </div>

            <div className="player-toolbar sleep-wrap">
              <button className="icon-btn" onClick={() => setShowSleepMenu((v) => !v)} aria-label="Sleep timer" title="Sleep timer">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12.47 3C8.96 3 5.98 4.75 4.24 7.5 2.5 10.25 2.5 13.75 4.24 16.5 5.98 19.25 8.96 21 12.47 21c3.51 0 6.49-1.75 8.23-4.5 1.74-2.75 1.74-6.25 0-9C18.96 4.75 15.98 3 12.47 3zm0 4.25c-.88 0-1.6-.62-1.6-1.38v-.27c1.96-.56 3.95-.56 5.91 0-.01.76-.73 1.65-1.61 1.65-.82 0-1.49.63-1.49 1.37v2.33c0 .74.67 1.37 1.49 1.37.31 0 .6.11.83.29l.02.01v-3.02c0-.74.67-1.37 1.49-1.37.88 0 1.6-.62 1.6-1.38.02.83-.2 1.66-.63 2.4 1.4 1.78 2.21 3.94 2.21 6.23v.13c-2.7 3.44-8.46 3.44-11.16 0H4.8c1.7-2.76 4.36-4.58 7.67-4.58.71 0 1.4.05 2.08.15V9.4A2.57 2.57 0 0 0 12.47 7.25z" />
                </svg>
                {sleepRemaining !== null && <span className="sleep-active" />}
                {sleepEndTrack && <span className="sleep-active" style={{ right: 14 }} />}
              </button>

              {showSleepMenu && (
                <div className="sleep-menu">
                  <div className="sleep-menu-title">Sleep timer</div>
                  {SLEEP_OPTIONS.map((o) => (
                    <button
                      key={o.label}
                      className="sleep-option"
                      onClick={() => {
                        if (o.seconds === null) clearSleep()
                        else if (o.seconds === -1) setSleepEndTrack(true)
                        else setSleep(o.seconds)
                        setShowSleepMenu(false)
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
              {(sleepRemaining !== null && sleepRemaining < 1e8) && (
                <span className="sleep-chip">{sleepLabel}</span>
              )}
              {sleepEndTrack && <span className="sleep-chip">Until end of track</span>}
            </div>

            <button className={`icon-btn ${showQueue ? 'active-ctrl' : ''}`} onClick={toggleQueue} aria-label="Up next" title="Up next">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M3 6h13v1.5H3V6zm0 5h13v1.5H3V11zm0 5h8v1.5H3V16zm13-1.5c.6-1.2 3-3.9 4-3.9V18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2" />
              </svg>
            </button>

            <button className="icon-btn" onClick={toggleFull} aria-label="Minimize" title="Minimize">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M6 9h12v1.5H6V9zM4 3h16v1.5H4V3zm0 10.5V15l1.5 1.5V18H9v1.5H4V22h1.5v-5H9v-1.5H5.5V13.5H4zm16-2.5H4v1.5h16V11z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}