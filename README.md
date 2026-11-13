# SaiFlix: a Netflix-style streaming web app

**Created by Devarinti Saiprasad**

A full-stack, Netflix-inspired web application. Users sign in, choose a profile ("Who's watching?"),
browse rows of titles, build a personal **My List**, like titles, and **continue watching** from where they stopped.
Admins manage the catalogue and users.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12%2B-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

> Learning project. The catalogue is made up and the app is not affiliated with Netflix or any streaming service.
> The player plays a short sample clip, not full movies.

## Screenshots
> Add your screenshots to `docs/screenshots/` and link them here, for example:
> `![Home](docs/screenshots/home.png)`

## Features
- **Authentication:** register and sign in with **JWT** tokens and **bcrypt** password hashing
- **Multiple profiles** per account (up to 4), like Netflix: add, rename and delete
- **Home page:** hero banner, Trending Now, one row per genre, scroll arrows
- **Continue Watching:** the player saves your position per profile and resumes later
- **My List** and **Likes**, saved per profile in PostgreSQL
- **Search** by title, genre or description
- **Title details** pop-up with a "More like this" section
- **Role-based access:** `admin` and `member`. Admin routes return `403 Forbidden` for members
- **Admin page:** statistics, add and delete titles, change user roles, delete users
- Poster art is drawn with CSS gradients, so no image files are needed
- Responsive layout for phones and desktops

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js, REST API |
| Database | PostgreSQL (`pg`) |
| Security | JWT (`jsonwebtoken`), bcrypt (`bcryptjs`) |

## Project structure
```
backend/
  server.js            Express app and start-up
  db.js                PostgreSQL pool, creates the database and tables
  schema.sql           Table definitions (users, profiles, titles, my_list, likes, watch_progress)
  seed.js, seedData.js Sample catalogue and optional admin account
  middleware/auth.js   JWT check and role check
  routes/              auth, profiles (catalogue, list, likes, progress), admin
frontend/
  src/components/      Sign in, profile picker, Browse, Row, Poster, DetailModal, Player, Admin
```

## Getting started

### Requirements
- Node.js 18 or newer
- PostgreSQL 12 or newer, running on the default port 5432

### 1. Clone
```bash
git clone https://github.com/Devarintisaiprasad/Saiflix.git
cd Saiflix
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env
```
Edit `backend/.env` and set `DATABASE_URL` (your PostgreSQL password) and `JWT_SECRET`.
```bash
npm install
npm run dev
```
The database `saiflix`, its tables and the sample catalogue are created automatically.
The backend runs at http://localhost:5100.

### 3. Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173.

### 4. First admin
Either **sign up**, because the first account becomes admin, or set `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD` in `backend/.env` before the first start. Later sign-ups are members.

## Environment variables (`backend/.env`)
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://postgres:YOUR_PASSWORD@localhost:5432/saiflix` |
| `JWT_SECRET` | Yes | Long random text for signing tokens |
| `PORT` | No | Default 5100 |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | No | Creates an admin at start-up |
| `ADMIN_EMAIL` | No | This email becomes admin when it signs up |

## API overview
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Public |
| GET | `/api/auth/me` | Logged in |
| GET, POST | `/api/profiles` | Logged in |
| PATCH, DELETE | `/api/profiles/:pid` | Owner |
| GET | `/api/profiles/:pid/titles` | Owner |
| PUT, DELETE | `/api/profiles/:pid/list/:tid`, `/likes/:tid`, `/progress/:tid` | Owner |
| GET | `/api/admin/stats`, `/api/admin/users` | Admin |
| PATCH, DELETE | `/api/admin/users/:id...` | Admin |
| POST, DELETE | `/api/admin/titles...` | Admin |

## Security notes
- Never commit `backend/.env`. It is listed in `.gitignore`.
- Passwords are stored only as bcrypt hashes. Profiles can only be used by the account that owns them.
- This is a learning project. Add rate limiting and HTTPS before using it in production.

## Roadmap
- Real posters and trailers from an API such as TMDB
- Episodes and seasons for series
- Subscription plans
- Docker setup

## License
MIT. See [LICENSE](LICENSE).

## Author
**Devarinti Saiprasad**
