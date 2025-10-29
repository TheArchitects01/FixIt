# FixIt - Campus Reporting System

A comprehensive campus maintenance reporting system built with React Native (Expo) and Node.js.

## Features
- 🎓 **Student**: Report issues, view campus reports, manage profile
- 👔 **Staff**: View assigned reports, update status, chat with admins
- 👨‍💼 **Admin**: Assign reports to staff, manage users, full oversight

## Tech Stack
- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Node.js, Express, MongoDB
- **Real-time**: Socket.IO for live chat and updates
- **Authentication**: JWT tokens with bcrypt password hashing

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)
3. **Git** - [Download here](https://git-scm.com/)
4. **Expo Go App** on your phone (for testing)
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/Ehsanultanjil/Fixit.git
cd Fixit
```

### Step 2: Backend Setup

1. **Navigate to the backend folder**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   
   Create a `.env` file in the `backend` folder with the following:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/fixit
   JWT_SECRET=your_secret_key_here
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   - **Windows**: MongoDB should start automatically if installed as a service
   - **Mac/Linux**: Run `mongod` in a terminal

5. **Start the backend server**
   ```bash
   npm start
   ```
   
   You should see: `✓ Server running on port 5000` and `✓ Connected to MongoDB`

### Step 3: Frontend Setup

1. **Open a new terminal** and navigate to the frontend folder
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Update API URL** (if needed)
   
   Open `frontend/services/api.ts` and make sure the API URL matches your backend:
   ```typescript
   const API_URL = 'http://192.168.x.x:5000/api';  // Use your computer's IP address
   ```

4. **Start the Expo development server**
   ```bash
   npm start
   ```

5. **Run the app**
   - Scan the QR code with **Expo Go** app on your phone
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator (Mac only)

### Step 4: Create Admin Account

1. **Option 1: Using the app**
   - Open the app and go to the "Create Admin" page
   - Fill in the admin details and submit

2. **Option 2: Using the script**
   ```bash
   cd backend
   node src/scripts/createAdmin.js
   ```

## Usage

1. **Login** with your account (student/staff/admin)
2. **Students** can:
   - Report new issues
   - View their own reports
   - View all campus reports
   - Update their profile
3. **Staff** can:
   - View assigned reports
   - Update report status
   - Chat with admins in report details
4. **Admins** can:
   - View all reports
   - Assign reports to staff members
   - Create staff and admin accounts
   - Manage all users



## Project Structure

```
FixIt/
├── frontend/              # React Native mobile app
│   ├── app/              # Expo Router pages
│   │   ├── (tabs)/      # Tab navigation screens
│   │   ├── reports/     # Report detail screens
│   │   ├── login.tsx    # Login screen
│   │   └── ...
│   ├── components/       # Reusable components
│   ├── contexts/         # React contexts (Auth, Socket, Theme)
│   ├── services/         # API services
│   └── types/            # TypeScript types
│
└── backend/              # Node.js + Express + MongoDB API
    ├── src/
    │   ├── routes/       # API endpoints
    │   ├── models/       # MongoDB models (User, Report)
    │   ├── config/       # Database and Socket.io config
    │   ├── middleware/   # Auth middleware
    │   └── utils/        # JWT utilities
    └── package.json
```
