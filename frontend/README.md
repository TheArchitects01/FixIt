# Campus Report — Setup Guide

This repo contains a React Native app built with Expo (frontend) and a Node.js/Express API with MongoDB (backend).

## Prerequisites
- Node.js LTS (v18+ recommended)
- npm (comes with Node) or yarn
- Git
- Mobile device with Expo Go installed (Android/iOS) or an emulator/simulator
- MongoDB Atlas account (or local MongoDB)

---
## Project Structure
- `app/`, `components/`, `services/`, etc. — Expo frontend
- `campus-report-backend/` — Express + Mongoose backend

---
## 1) Backend Setup (Node/Express + MongoDB)

1. Install dependencies
   - Windows PowerShell:
     ```bash
     cd campus-report-backend
     npm install
     ```

2. Create `.env` in `campus-report-backend/`
   Example values:
   ```env
   # Use Atlas SRV or standard URI. If DNS blocks SRV, switch to standard mongodb://
   MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.i9pdsqo.mongodb.net
   MONGODB_DB=fixit

   # Server
   PORT=4000

   # Auth
   JWT_SECRET=super_secret_change_me
   ```
   Tips:
   - If your network blocks SRV/TXT DNS (mongodb+srv), use the Atlas “Standard connection string” (mongodb://host1,host2,host3/db?replicaSet=...)
   - Or change Windows DNS to public (8.8.8.8 / 1.1.1.1) and retry.

3. Start the backend
   ```bash
   # From campus-report-backend/
   npm run dev   # if available
   # or
   npm start
   ```
   Backend should log that it’s listening on `PORT` and “Connected to MongoDB”.

---
## 2) Frontend Setup (Expo)

1. Install dependencies
   ```bash
   # From repository root
   npm install
   ```

2. Create `.env` at the project root for the frontend
   ```env
   # Point to your backend API (local IP so Expo Go on phone can reach it)
   EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LOCAL_IP>:4000
   ```
   - Get your local IP: `ipconfig` (Windows) and use the IPv4 address of your active adapter.
   - Example: `http://192.168.1.50:4000`

3. Start Expo
   ```bash
   npx expo start
   # or to clear cache
   npx expo start --clear
   ```

4. Open on device
   - Install Expo Go from App Store/Play Store.
   - Scan the QR code from the terminal/Expo Dev Tools.

Notes:
- If the app can’t reach the API from your phone, it’s usually the base URL or your phone not on the same Wi‑Fi.

---
## Environment Variables Summary

Backend (`campus-report-backend/.env`):
- `MONGODB_URI` — Atlas SRV or standard connection string
- `MONGODB_DB` — Database name (e.g., fixit)
- `PORT` — API port (e.g., 4000)
- `JWT_SECRET` — Secret for signing tokens

Frontend (`.env` in repo root):
- `EXPO_PUBLIC_API_BASE_URL` — e.g., `http://192.168.x.x:4000`

---
## Common Workflows

- Login in Expo CLI (optional but helpful):
  ```bash
  npx expo login
  ```

- Change API base URL after switching networks:
  - Update `EXPO_PUBLIC_API_BASE_URL` in root `.env`.
  - Restart Expo with `--clear` if needed.

- Remove/Hide admin-only UI
  - The “Add Admin” button is visible only for `role === 'admin'` in `app/(tabs)/profile.tsx`.
  - Admin Dashboard button was removed in `components/dashboard/AdminDashboard.tsx`.

---
## MongoDB Atlas DNS Troubleshooting

If you see errors like `queryTxt ETIMEOUT cluster0.i9pdsqo.mongodb.net`:
- Your DNS may block SRV/TXT lookups required by `mongodb+srv://`.
- Options:
  - Switch to Atlas “Standard connection string” (mongodb://...).
  - Change Windows DNS to public: 8.8.8.8 (Google) / 1.1.1.1 (Cloudflare).
  - Use DNS over HTTPS (Windows 11) for the active adapter.
  - Try a different network (mobile hotspot).

Quick tests (PowerShell):
```powershell
nslookup cluster0.i9pdsqo.mongodb.net
nslookup -type=txt _mongodb._tcp.cluster0.i9pdsqo.mongodb.net
ipconfig /flushdns
```

---
## Feature Notes

- Status updates by admins now require a note:
  - Implemented in `components/reports/AdminReports.tsx`.
  - A modal prompts for a note; it is sent as `adminNotes` with the PATCH request.

---
## Troubleshooting Checklist

- App in Expo Go cannot reach API
  - Ensure phone and dev machine are on the same network.
  - Use machine’s local IP in `EXPO_PUBLIC_API_BASE_URL` (not localhost).
  - Windows Firewall may block inbound connections on the backend port — allow Node.js/port through.

- Backend cannot connect to MongoDB
  - Verify `MONGODB_URI` and user credentials.
  - If SRV fails, use standard `mongodb://` string from Atlas.
  - Confirm network allows outbound to MongoDB ports (27017+)

- Stale cache/UI
  - `npx expo start --clear`

---
## Scripts Reference

- Frontend (root):
  ```bash
  npx expo start
  ```
- Backend (`campus-report-backend/`):
  ```bash
  npm run dev   # if defined
  # or
  npm start
  ```

---
## License
Internal/Private project (update as needed).
