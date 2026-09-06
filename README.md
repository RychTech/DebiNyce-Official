# DebiNyce — The Next-Gen Music Library & Player

> **Tagline:** _"Sync To The Groove."_

DebiNyce is a Spotify-like music streaming **web app** — mobile-first with full desktop support — built around a **peach, black, and gradient-blue** theme. It delivers an immersive, animated listening experience for listeners while giving artists powerful tools to upload, customize, and collaborate on their music.

---

## Table of Contents

1. [Overview](#overview)
2. [Visual Identity & UI](#visual-identity--ui)
3. [User Roles](#user-roles)
4. [Features](#features)
5. [Authentication & Authorization](#authentication--authorization)
6. [Infrastructure & Stack](#infrastructure--stack)
7. [Phase Plan](#phase-plan)
8. [Technical Flow](#technical-flow)
9. [API Structure](#api-structure)

---

## Overview

DebiNyce is a full-featured music streaming web application. Listeners get an animated, synced-lyric playback experience. Artists get a complete toolkit to upload music, design album art, synchronize lyrics, and collaborate with other musicians. Admins manage the platform through a dedicated admin panel at `/admin`.

---

## Visual Identity & UI

- **Theme:** Peach-dominant with black accents and gradient-blue highlights throughout.
- **Landing Page (Login / Sign-Up):**
  - Visually polished with smooth animations: fade-in, phase-in, and other motion effects that fit the app's personality.
  - The landing page is the first impression — it needs to feel premium and on-brand.
- **Welcome Message:**
  - On first login, the user sees:
    ```
    Welcome To DebiNyce
    Sync To The Groove.
    ```
- **Responsive Design:**
  - **Mobile-first** — optimized for phones as the primary experience.
  - **Desktop support** — the full experience is available on larger screens as well.

---

## User Roles

### 1. Listener (Normal User)

- Can freely sign up and sign in — **no admin approval required.**
- Browse and play music.
- View synced lyrics flowing over album art (transparent background, no visual interference).
- Experience the lyric-background water-ripple animation synced to the song's real-time audio via the **Web Audio API**.
- Create playlists (public or private), and share them via **invitation links + codes**.
- Lyrics highlight when active and dim when their time has passed.

### 2. Artist

- **Sign-up:** Visit `/artistsignup` on the domain.
- **Verification (required before approval):**
  - A photo of themselves
  - A national ID (if available)
  - Full names
  - Artist profile name
  - Nationality
  - Phone number
  - Email
- Once submitted, this information lands in the **Admin Panel** for approval.
- **After approval**, the artist can:
  - Upload music
  - Customize each song's background and album art
  - Use the **Lyric Timeline Panel** to set lyrics in time sequences:
    - Select a timestamp (minutes, seconds, microseconds)
    - Type the lyric for that timestamp
    - During playback, lyrics appear in sync with the song timeline
  - **OR** upload a pre-made **lyric video** (created in a studio or anywhere else) to use as the background/visual — this **entirely replaces** the lyric timeline view for that song
  - Choose from various fonts for their lyrics (when using the timeline panel)
  - Send and receive **friend requests** with other artists
  - Once friend requests are accepted, artists can send **collaboration requests** to each other
  - When a collab request is accepted, both artists' **bio and contact info are shared** so they can message each other directly (contact exposure only — no in-app chat)

### 3. Admin

- Access the admin panel at `domain + "/admin"`.
- Approve or reject artist sign-up requests.
- Admin panel features will be added **in phases** — starting with artist approval, then expanding to user management, content moderation, stats, etc.

---

## Features

### Music Playback

- Full music player with album art display.
- Synced lyric display — lyrics float over album art with a transparent background.

### Lyric Synchronization

- **Timeline-based lyrics:** Artists set lyrics at precise timestamps (min/sec/microsec) via the Lyric Timeline Panel.
- **Visual effect:** Lyrics highlight when active and dim when their time has passed.
- **Background animation:** A water-ripple effect on the lyric flow background that reacts in **real time** to the song's audio using the **Web Audio API** (beat intensity + FFT frequency analysis).
- **Lyric video option:** Artists can upload a pre-made lyric video. When set, it **entirely replaces** the timeline-based lyric view for that song (it is separate from the album art background).

### Playlists

- Creators can make playlists.
- Each playlist can be **public** or **private**.
- Playlists support **invitations** via **shareable links + alphanumeric invitation codes**.

### Artist Collaboration

- **Friend requests** between artists.
- Once accepted, artists can send **collaboration requests**.
- When a collab request is accepted, **bio and contact info are shared** — artists reach out externally (no in-app messaging).

### Customization

- Custom album art designed by musicians.
- Artists can customize the music background and album art per song.
- Multiple font options for lyrics (timeline-based).
- Option to upload a pre-made lyric video as an alternative to timeline-based lyrics.

---

## Authentication & Authorization

- **JWT** (JSON Web Tokens) for stateless authentication.
- **Session-based auth** as a supported option (express-session).
- **OAuth** via Passport.js for third-party login.
- **Social login:** Google + Facebook.
- Listeners sign up freely without admin approval.
- Artists go through a verification and admin-approval flow before gaining access.

---

## Infrastructure & Stack

### Phase 1 Stack (Locked)

| Component | Choice |
|---|---|
| **Frontend** | React + Vite |
| **Backend** | Node.js + Express |
| **Database** | MySQL (hosted on InfinityFree) |
| **ORM** | Prisma (MySQL mode) |
| **Auth** | JWT + express-session + Passport.js (Google + Facebook OAuth) |
| **Storage** | Cloud storage (to be wired in — provider TBD) |

### MySQL Connection (InfinityFree)

| Field | Value |
|---|---|
| **Hostname** | `sql211.infinityfree.com` |
| **Port** | `3306` |
| **Username** | `if0_42835106` |
| **Database** | `if0_42835106_DebiNyce` |
| **Domain** | `debinyce.freedev.app` |

> ⚠️ The MySQL password is stored in `backend/.env` (not committed). Rotate it in InfinityFree if needed.

### Project Structure

```
DebiNyce-Official/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Data models (User, Song, Lyric, Playlist, etc.)
│   ├── src/
│   │   ├── config/             # DB client, env config
│   │   ├── middleware/         # Auth middleware, error handler
│   │   ├── routes/             # API route handlers
│   │   ├── controllers/        # Request handlers
│   │   └── index.js            # Express server entry point
│   ├── .env                    # Environment variables (gitignored)
│   ├── .env.example            # Env template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components (landing, login, etc.)
│   │   ├── styles/             # Global CSS + theme variables
│   │   └── App.jsx             # Main app component + routing
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Phase Plan

### Phase 1 — Foundation & Auth
- [x] Project scaffold (frontend + backend structure)
- [x] Prisma schema + MySQL connection
- [ ] Express server + API routes setup
- [ ] JWT + session + Google/Facebook OAuth
- [ ] Landing page with animations (fade-in, phase-in)
- [ ] Listener signup/login flow
- [ ] Welcome message on first login
- [ ] Basic dashboard layout

### Phase 2 — Music Upload & Playback (Artists)
- [ ] Artist signup (`/artistsignup`) with verification docs
- [ ] Admin panel — artist approval (basic)
- [ ] Music upload (audio + album art + background)
- [ ] Song playback UI
- [ ] Album art display

### Phase 3 — Lyrics & Visualization
- [ ] Lyric Timeline Panel (set lyrics at timestamps)
- [ ] Web Audio API water-ripple animation (real-time beat + FFT)
- [ ] Lyric video upload option (replaces timeline view)
- [ ] Font selection for lyrics

### Phase 4 — Playlists & Collaboration
- [ ] Playlist creation (public/private)
- [ ] Invitation codes + shareable links
- [ ] Friend requests between artists
- [ ] Collaboration requests
- [ ] Contact info sharing on accepted collab

### Phase 5 — Admin Panel & Polish
- [ ] Full admin panel (artist approval, user management, content moderation)
- [ ] Stats / analytics dashboard
- [ ] UI polish, animations, responsive fine-tuning
- [ ] Deployment

---

## Technical Flow (High-Level)

1. **Listener** → signs up freely → lands on animated landing page → sees welcome message → browses and plays music → lyrics animate in sync with real-time Web Audio API analysis → creates playlists → shares invitation links/codes.
2. **Artist** → signs up at `/artistsignup` → submits verification docs & info → info goes to Admin Panel → Admin approves → Artist gets access to upload & customize music → sets lyrics via timeline panel **OR** uploads a lyric video → publishes → connects with other artists via friend/collab requests → contact info shared on accepted collab.
3. **Admin** → accesses `/admin` → reviews artist applications → approves/rejects.

---

## API Structure (Planned)

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new listener or artist |
| POST | `/api/auth/login` | Login with email + password |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| GET | `/auth/google` | Google OAuth login |
| GET | `/auth/google/callback` | Google OAuth callback |
| GET | `/auth/facebook` | Facebook OAuth login |
| GET | `/auth/facebook/callback` | Facebook OAuth callback |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update profile |
| POST | `/api/users/artist-signup` | Submit artist verification |

### Songs
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/songs` | Upload a new song (artist only) |
| GET | `/api/songs` | List published songs |
| GET | `/api/songs/:id` | Get song details + lyrics |
| PUT | `/api/songs/:id` | Update song info |
| DELETE | `/api/songs/:id` | Delete a song |

### Playlists
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/playlists` | Create a playlist |
| GET | `/api/playlists` | Get user's playlists |
| GET | `/api/playlists/public` | Get public playlists |
| POST | `/api/playlists/join` | Join via invitation code/link |
| PUT | `/api/playlists/:id` | Update playlist |
| DELETE | `/api/playlists/:id` | Delete playlist |

### Artists
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/artists/signup` | Artist verification submission |
| GET | `/api/artists/pending` | Admin: get pending artist requests |
| PUT | `/api/artists/:id/approve` | Admin: approve artist |
| PUT | `/api/artists/:id/reject` | Admin: reject artist |

### Social (Artists)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/friends/request` | Send friend request |
| GET | `/api/friends/requests` | Get friend requests |
| PUT | `/api/friends/accept` | Accept friend request |
| POST | `/api/collab/request` | Send collab request |
| GET | `/api/collab/requests` | Get collab requests |
| PUT | `/api/collab/accept` | Accept collab (shares contact info) |

---

*This README is a living document — we'll refine it as we build through each phase.*
