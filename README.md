# Personal Health Assistant (PHA)

A React Native mobile application with a Node.js backend for personal health assistance via an AI Chatbot.

## Prerequisites
- Node.js & npm
- Docker (for PostgreSQL)
- Expo Go app on your phone (or Android Emulator/iOS Simulator)

## Project Structure
- `/backend`: Node.js, Express, Prisma, TypeScript.
- `/frontend`: React Native, Expo, TypeScript.
- `docker-compose.yml`: Database configuration.

## Getting Started

### 1. Database for local development
Start the PostgreSQL database:
```bash
docker-compose up -d
```

### 2. Backend
The backend runs on port 3000.
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Frontend
Start the Expo development server.
```bash
cd frontend
npm install
npx expo start
```
- Scan the QR code with **Expo Go** (Android/iOS).
- Or press `a` for Android Emulator, `i` for iOS Simulator.

## VPS Testing with Expo Go

Use this setup when testers scan the Expo Go QR code from different networks.
The backend API is published at:

```text
https://api.anxietypha.my.id
```

### 1. Prepare environment files on the VPS

Create root `.env` from `.env.example`:

```bash
cp .env.example .env
```

Set a strong `POSTGRES_PASSWORD`.

Create backend `.env` from `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Set `JWT_SECRET` and `GEMINI_API_KEY`. The `DATABASE_URL` used by Docker is
provided by `docker-compose.yml`, so keep the example value only for manual
backend runs.

### 2. Start the VPS stack

```bash
docker compose up -d --build
```

The stack runs:
- PostgreSQL on the internal Docker network only.
- Backend Node/Express on the internal Docker network.
- Caddy on public ports `80` and `443`, proxying `api.anxietypha.my.id` to the backend.

Check the backend from outside the VPS:

```bash
curl https://api.anxietypha.my.id/health
curl https://api.anxietypha.my.id/
```

Do not expose PostgreSQL port `5432` publicly.

### 3. Run Expo for remote testers

Create `frontend/.env` from `frontend/.env.example`:

```bash
cp frontend/.env.example frontend/.env
```

Then start Expo with a tunnel:

```bash
cd frontend
npx expo start --tunnel --clear
```

Testers scan the QR code with Expo Go. The mobile app will call
`https://api.anxietypha.my.id` through `EXPO_PUBLIC_API_URL`.

## Features
- **Authentication**: Register & Login.
- **Profile**: Edit user details (Name, Age, Language).
- **Chatbot**: Chat with Gemini AI (Context-aware).


login sebagai admin
Email: admin@admin.com
Password: admin123
