# FixIt - Campus Reporting System

A comprehensive campus maintenance reporting system built with React Native (Expo) and Node.js.

## Project Structure

```
FixIt/
├── frontend/          # React Native mobile app
│   ├── app/          # Expo Router pages
│   ├── components/   # Reusable components
│   ├── contexts/     # React contexts (Auth, Socket)
│   ├── services/     # API services
│   └── ...
│
└── backend/          # Node.js + Express + MongoDB API
    ├── src/
    │   ├── routes/   # API routes
    │   ├── models/   # MongoDB models
    │   ├── config/   # Configuration
    │   └── ...
    └── package.json
```

## Setup Instructions

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Features
- 🎓 Student: Report issues, view campus reports, manage profile
- 👔 Staff: View assigned reports, update status, chat with students
- 👨‍💼 Admin: Assign reports to staff, manage users, full oversight

## Tech Stack
- **Frontend:** React Native, Expo, TypeScript, Socket.IO Client
- **Backend:** Node.js, Express, MongoDB, Socket.IO, JWT
- **Real-time:** Socket.IO for live chat and status updates
