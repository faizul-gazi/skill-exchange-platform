# Skill Exchange Platform

A full-stack skill-sharing platform where users can register, build profiles, discover matching people based on skills, send requests, and chat.

## Features

- User authentication (register/login) with JWT
- Private routes and guest-only routes
- Profile management (name, avatar, offered skills, wanted skills, availability)
- Match discovery with dynamic filters (skill, level, category)
- Detailed user profile page via dynamic route (`/users/:userId`)
- Request flow between matched users
- Chat and dashboard pages
- Admin dashboard route

## Tech Stack

### Frontend
- React
- React Router
- Axios
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JWT + bcrypt

## Project Structure

```text
skill-exchange/
  src/                # Frontend app
  server/             # Backend API
  package.json        # Frontend scripts
  server/package.json # Backend scripts
```

## Environment Setup

### 1) Backend env

Copy `server/.env.example` to `server/.env`, then set values:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
```

## Installation

From project root:

```bash
npm install
npm install --prefix server
```

## Run Locally

Open two terminals from project root.

### Terminal 1: Backend

```bash
npm run server:dev
```

### Terminal 2: Frontend

```bash
npm run dev
```

For Windows PowerShell execution-policy issues, use:

```bash
npm.cmd run server:dev
npm.cmd run dev
```

## Available Scripts

### Frontend (root)

- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run preview` - preview build
- `npm run lint` - run ESLint

### Backend (`server`)

- `npm run dev --prefix server` - run API in watch mode
- `npm run start --prefix server` - run API in normal mode

## API Base

- Frontend calls API via `/api` (proxied in Vite)
- Default local backend: `http://localhost:5000`

## Notes

- Keep secrets in `server/.env` only.
- Do not commit credentials or tokens.
- `server/.env` is gitignored.
