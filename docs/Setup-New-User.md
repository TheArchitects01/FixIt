# Campus Report — Setup Guide for New Users (Windows)

This guide is for someone starting from zero (no tools installed). Follow each step in order.

---
## 0) What you’ll need
- A Windows PC with internet
- A phone with Expo Go installed (Android/iOS), or an Android emulator

---
## 1) Install required tools

1) Install Node.js (includes npm)
- Download LTS from: https://nodejs.org
- After install, open PowerShell and check:
  ```powershell
  node -v
  npm -v
  ```

2) Install Git
- Download from: https://git-scm.com/download/win
- After install, check version:
  ```powershell
  git --version
  ```

3) (Optional) Android Emulator
- Install Android Studio: https://developer.android.com/studio
- In Android Studio: install SDK + create a Virtual Device (AVD)
- You can also use your physical phone with the Expo Go app (recommended for simplicity)

4) Install Expo Go on your phone
- iOS: App Store → Expo Go
- Android: Play Store → Expo Go

---
## 2) Get the project code

1) Choose a folder, then clone:
```powershell
cd C:\Users\<YourUser>\Desktop
git clone <YOUR_REPO_URL> project
cd project
```

2) Install frontend dependencies (repo root):
```powershell
npm install
```

3) Install backend dependencies:
```powershell
cd campus-report-backend
npm install
cd ..
```

---
## 3) Configure environment variables

There are two `.env` files: one for backend, one for frontend.

1) Backend env (file: `campus-report-backend/.env`)
```env
# MongoDB (use Atlas or local MongoDB)
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.i9pdsqo.mongodb.net
MONGODB_DB=fixit

# Server port
PORT=4000

# Auth secret
JWT_SECRET=super_secret_change_me
```
Notes:
- If your network blocks SRV DNS (mongodb+srv), use Atlas “Standard connection string” (mongodb://host1,host2,host3/...)
- Or set Windows DNS to 8.8.8.8 / 1.1.1.1 and try again

2) Frontend env (file: `.env` at project root)
```env
# Use your PC’s local IP so your phone can reach it
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LOCAL_IP>:4000
```
Find your local IP:
```powershell
ipconfig   # Use IPv4 address of your active adapter, e.g. 192.168.1.50
```

---
## 4) Run the backend (API)

In a PowerShell window:
```powershell
cd project/campus-report-backend
npm run dev   # or: npm start
```
You should see logs like “Connected to MongoDB” and “Server listening on 4000”.

Windows Firewall: If prompted, allow Node.js to accept connections on private networks.

---
## 5) Run the mobile app (Expo)

Open a second PowerShell window:
```powershell
cd project
npm i -g eas-cli
npx expo start
```
- A QR code will appear in the terminal or browser (Expo Dev Tools)
- On your phone (same Wi‑Fi as PC), open Expo Go and scan the QR code

If you see caching issues:
```powershell
npx expo start --clear
```
If LAN/QR doesn’t connect, try a tunnel:
```powershell
npx expo start --tunnel
```

---
## 6) Log in and test
- Create/test users as needed via the app
- Admin UI is visible only to users with role `admin`
- Admin status changes require a note (modal appears)

---
## 7) Common issues & fixes

- App can’t reach API from phone
  - Ensure phone and PC are on the same Wi‑Fi
  - Confirm `EXPO_PUBLIC_API_BASE_URL` points to your PC’s IP (not localhost)
  - Allow Node.js through Windows Firewall or temporarily disable for testing

- MongoDB Atlas DNS errors (e.g., ETIMEOUT on mongodb+srv)
  - Use Atlas “Standard connection string” (mongodb://...)
  - Change Windows DNS to 8.8.8.8 / 1.1.1.1 (and `ipconfig /flushdns`)
  - Try a different network (mobile hotspot)

- Emulator not found
  - In Expo CLI, press “a” to open Android emulator (after AVD configured)
  - Or use Expo Go on your phone

---
## 8) Useful commands (recap)
```powershell
# Backend
cd campus-report-backend
npm run dev   # or npm start

# Frontend
cd ..
npx expo start
npx expo start --clear
npx expo start --tunnel
```

---
## 9) Export this guide to PDF

Option A — VS Code extension
- Install “Markdown PDF” (yzane.markdown-pdf)
- Open `docs/Setup-New-User.md`
- Command Palette → “Markdown PDF: Export (pdf)”

Option B — Browser print to PDF
- Install the VS Code “Markdown: Open Preview to the Side” (built-in) or use an online Markdown viewer
- Print (Ctrl+P) → Destination: “Save as PDF” → Save

---
## 10) Support
- If you’re stuck, share screenshots of errors and your `.env` values (hide passwords)
- Confirm your IP and port, and that both backend and Expo are running
