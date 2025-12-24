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

### 1. Database
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

## Features
- **Authentication**: Register & Login.
- **Profile**: Edit user details (Name, Age, Language).
- **Chatbot**: Chat with Gemini AI (Context-aware).
