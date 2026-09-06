import { useState, useRef } from 'react'

const PALETTE = {
  PLAY: '#f8a68b',
  STREAM: '#3b82f6',
  LIKE: '#f472b6',
  SHARE: '#34d399',
  SIGNUP: '#a78bfa',
  ARTIST_SIGNUP: '#f59e0b',
  users: '#3b82f6',
  artists: '#f8a68b',
}

const KEY_LABEL = (k) => (k === 'users' ? 'New Users' : k.replace('_', ' '))

export function Legend({ keys, hidden = [], onToggle, palette = PALETTE }) {
  return (
    <div className="chart-legend chart-legend-ctrl">
      {keys.map((k) => {
        const off = hidden.includes(k)
        return (
          <button
            key={k}
            className={`chart-legend-item ${off ? 'dimmed' : ''}`}
            onClick={() => onToggle?.(k)}
            title="Click to show/hide"
          >
            <span className="chart-legend-dot" style={{ background: off ? '#555' : palette[k] || '#888' }} />
            {KEY_LABEL(k)}
          </button>
        )
      })}
    </div>
  )
}

export function ActivityChart({ series, keys = ['PLAY', 'STREAM', 'LIKE', 'SHARE'], height = 240, toggleable = true }) {
  const [hidden, setHidden] = useState([])
  const [hover, setHover] = useState(null)
  const wrapRef = useRef(null)

  const activeKeys = keys.filter((k) => !hidden.includes(k))
  const W = 1000
  const padX = 12
  const padY = 22
  const innerW = W - padX * 2
  const innerH = height - padY * 2

  const step = series.length > 1 ? innerW / (series.length - 1) : innerW
  const max = Math.max(1, ...series.flatMap((s) => activeKeys.map((k) => s[k] || 0)))

  const point = (i, v) => [padX + (series.length === 1 ? 0 : i * step), height - padY - (v / max) * innerH]

  const pathForKey = (k) =>
    series
      .map((s, i) => {
        const [x, y] = point(i, s[k] || 0)
        return `${i === 0 ? 'M' : 'L'}${x},${y}`
      })
      .join(' ')

  const areaFor = (k) => {
    if (!series.length) return ''
    const line = pathForKey(k)
    const [, yBase] = point(0, 0)
    return `${line} L${point(series.length - 1, 0)[0]},${yBase} L${point(0, 0)[0]},${yBase} Z`
  }

  const gridLines = 4
  const yTicks = Array.from({ length: gridLines + 1 }, (_, i) => i)

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || series.length === 0) return
    const pct = (e.clientX - rect.left) / rect.width
    const idx = Math.round(pct * (series.length - 1))
    setHover(Math.max(0, Math.min(series.length - 1, idx)))
  }

  const handleLeave = () => setHover(null)

  const tooltip = hover !== null ? series[hover] : null
  const tipX = hover !== null ? (point(hover, 0)[0] / W) * 100 : 0

  return (
    <div className="chart-wrap">
      {toggleable && <Legend keys={keys} hidden={hidden} onToggle={(k) => setHidden((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k]))} />}

      <div className="chart-inner" ref={wrapRef}>
        {tooltip && (
          <div
            className="chart-tooltip"
            style={{
              left: `calc(${tipX}% ${tipX > 85 ? '- 120px' : '+ 8px'})`,
            }}
          >
            <div className="chart-tooltip-label">{tooltip.label}</div>
            {activeKeys.map((k) => (
              <div className="chart-tooltip-row" key={k}>
                <span className="tt-dot" style={{ background: PALETTE[k] || '#888' }} />
                {KEY_LABEL(k)}: <strong>{tooltip[k] || 0}</strong>
              </div>
            ))}
          </div>
        )}

        <svg
          viewBox={`0 0 ${W} ${height}`}
          className="chart-svg"
          preserveAspectRatio="none"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        >
          {yTicks.map((t) => {
            const y = padY + (innerH / gridLines) * (gridLines - t)
            return (
              <g key={t}>
                <line x1={padX} x2={W - padX} y1={y} y2={y} className="chart-gridline" />
                <text x={2} y={y + 4} className="chart-ytick">{Math.round((max / gridLines) * t)}</text>
              </g>
            )
          })}

          {activeKeys.map((k) => (
            <path key={k + 'area'} d={areaFor(k)} fill={PALETTE[k]} opacity="0.08" />
          ))}

          {activeKeys.map((k) => (
            <path
              key={k}
              d={pathForKey(k)}
              fill="none"
              stroke={PALETTE[k] || '#888'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="chart-polyline"
            />
          ))}

          {activeKeys.map((k) =>
            series.map((s, i) => {
              const [x, y] = point(i, s[k] || 0)
              return (
                <circle
                  key={`${k}-${i}`}
                  cx={x}
                  cy={y}
                  r="4.5"
                  className={`chart-dot ${hover === i ? 'chart-dot-hot' : ''}`}
                  fill={hover === i ? PALETTE[k] : 'transparent'}
                  stroke={PALETTE[k]}
                  strokeWidth="2"
                />
              )
            })
          )}

          {hover !== null && (
            <g>
              <line
                x1={point(hover, 0)[0]}
                x2={point(hover, 0)[0]}
                y1={padY}
                y2={height - padY}
                className="chart-hvline"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}

export function BarChart({ items, metric, limit = 8, height = 260 }) {
  const rows = (items || []).slice(0, limit)
  const max = Math.max(1, ...rows.map((r) => r[metric] || 0))

  const color =
    metric === 'plays' ? '#f8a68b' :
    metric === 'streams' ? '#3b82f6' :
    metric === 'likes' ? '#f472b6' :
    metric === 'shares' ? '#34d399' : '#a78bfa'

  return (
    <div className="chart-wrap chart-bars">
      {rows.map((row, i) => {
        const pct = (row[metric] || 0) / max
        return (
          <div className="bar-row" key={row.id || i}>
            <div className="bar-row-label">
              <span className="bar-rank">{i + 1}</span>
              <span className="bar-title">{row.title}</span>
              <span className="bar-artist">
                {row.artist?.artistProfile || row.artist?.fullName || 'Unknown'}
              </span>
              <span className="bar-value">{row[metric] || 0}</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${pct * 100}%`, background: color }}
                title={`${row.title}: ${row[metric] || 0}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ArtistBarChart({ items, limit = 8 }) {
  const rows = (items || []).slice(0, limit)
  const max = Math.max(1, ...rows.map((r) => r.plays || 0))

  return (
    <div className="chart-wrap chart-bars">
      {rows.map((row, i) => {
        const pct = (row.plays || 0) / max
        return (
          <div className="bar-row" key={row.id || i}>
            <div className="bar-row-label">
              <span className="bar-rank">{i + 1}</span>
              <span className="bar-avatar">
                {row.photo ? <img src={row.photo} alt="" /> : <span>♪</span>}
              </span>
              <span className="bar-title">{row.name}</span>
              <span className="bar-artist">{row.songCount} track{row.songCount === 1 ? '' : 's'}</span>
              <span className="bar-value">{row.plays || 0} plays</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${pct * 100}%`, background: 'linear-gradient(90deg,#f8a68b,#3b82f6)' }}
                title={`${row.name}: ${row.plays || 0} plays`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const EVENT_META = {
  PLAY: { icon: '▶', color: '#f8a68b', label: 'played' },
  STREAM: { icon: '📶', color: '#3b82f6', label: 'streamed' },
  LIKE: { icon: '♥', color: '#f472b6', label: 'liked' },
  UNLIKE: { icon: '♡', color: '#64748b', label: 'unliked' },
  SHARE: { icon: '↗', color: '#34d399', label: 'shared' },
  SIGNUP: { icon: '👤', color: '#a78bfa', label: 'signed up' },
  ARTIST_SIGNUP: { icon: '🎤', color: '#f59e0b', label: 'applied as artist' },
  ARTIST_APPROVED: { icon: '✅', color: '#34d399', label: 'approved' },
  ARTIST_REJECTED: { icon: '⛔', color: '#ef4444', label: 'rejected' },
  PLAYER_OPEN: { icon: '🎛', color: '#22d3ee', label: 'opened player' },
}

export function LiveFeed({ events }) {
  return (
    <div className="live-feed">
      {!events || events.length === 0 ? (
        <div className="empty-state compact-empty">
          <p>No live activity yet. Events appear here in real time.</p>
        </div>
      ) : (
        events.map((e, i) => {
          const meta = EVENT_META[e.type] || { icon: '•', color: '#888', label: e.type }
          return (
            <div className="feed-item" key={e.id || i} style={{ animationDelay: `${i * 40}ms` }}>
              <span className="feed-icon" style={{ background: `${meta.color}22`, color: meta.color }}>
                {meta.icon}
              </span>
              <div className="feed-body">
                <div className="feed-text">
                  <strong>{e.actor || 'Someone'}</strong> {meta.label}
                  {e.songTitle && <> <em>"{e.songTitle}"</em></>}
                </div>
                <div className="feed-time">{timeAgo(e.createdAt)}</div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function timeAgo(dateString) {
  if (!dateString) return ''
  const diff = (Date.now() - new Date(dateString).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function StatCard({ label, value, icon, accent }) {
  return (
    <div className="stat-card admin-stat-card">
      <div className="admin-stat-icon" style={{ background: accent }}>
        {icon}
      </div>
      <div className="admin-stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}