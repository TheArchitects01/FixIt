# ========================================
# Push Student Part 2 to GitHub Repository
# Repository: https://github.com/hshanto707/FixIt
# Branch: student-part2
# ========================================

Write-Host "Starting Student Part 2 push to GitHub..." -ForegroundColor Cyan

# Configuration
$repoUrl = "https://github.com/hshanto707/FixIt.git"
$tempDir = "C:\Users\WALTON\OneDrive\Desktop\fixit-temp"
$projectDir = "C:\Users\WALTON\OneDrive\Desktop\project"

# Step 1: Clone the repository
Write-Host "`n[1/5] Cloning repository..." -ForegroundColor Yellow
if (Test-Path $tempDir) {
    Write-Host "Removing existing temp directory..." -ForegroundColor Gray
    Remove-Item -Recurse -Force $tempDir
}
git clone $repoUrl $tempDir
Set-Location $tempDir

# Step 2: Create and checkout student-part2 branch
Write-Host "`n[2/5] Creating student-part2 branch..." -ForegroundColor Yellow
git checkout -b student-part2

# Step 3: Copy Student Part 2 files
Write-Host "`n[3/5] Copying Student Part 2 files..." -ForegroundColor Yellow

# Create directory structure
New-Item -ItemType Directory -Force -Path "components\reports" | Out-Null
New-Item -ItemType Directory -Force -Path "components\profile" | Out-Null
New-Item -ItemType Directory -Force -Path "app\(tabs)" | Out-Null

# Copy files
Write-Host "  - StudentReports.tsx (517 lines)" -ForegroundColor Gray
Copy-Item "$projectDir\components\reports\StudentReports.tsx" "components\reports\StudentReports.tsx"

Write-Host "  - campus-reports.tsx (452 lines)" -ForegroundColor Gray
Copy-Item "$projectDir\app\campus-reports.tsx" "app\campus-reports.tsx"

Write-Host "  - profile.tsx (405 lines)" -ForegroundColor Gray
Copy-Item "$projectDir\app\(tabs)\profile.tsx" "app\(tabs)\profile.tsx"

Write-Host "  - ChangePassword.tsx (385 lines)" -ForegroundColor Gray
Copy-Item "$projectDir\components\profile\ChangePassword.tsx" "components\profile\ChangePassword.tsx"

# Step 4: Create README for this branch
Write-Host "`n[4/5] Creating branch README..." -ForegroundColor Yellow
$readmeContent = @"
# FixIt - Student Part 2 🎓

## Overview
This branch contains **Student Part 2** of the FixIt campus reporting system.

## Files Included (1,759 lines total)
1. **StudentReports.tsx** (517 lines)
   - Path: ``components/reports/StudentReports.tsx``
   - View and filter student's own reports
   - Status filtering (pending, in-progress, completed, rejected)

2. **campus-reports.tsx** (452 lines)
   - Path: ``app/campus-reports.tsx``
   - View all campus reports with admin notes
   - Search functionality across reports

3. **profile.tsx** (405 lines)
   - Path: ``app/(tabs)/profile.tsx``
   - User profile management
   - Avatar upload, logout, settings

4. **ChangePassword.tsx** (385 lines)
   - Path: ``components/profile/ChangePassword.tsx``
   - Secure password change functionality
   - Form validation and error handling

## Dependencies
This part requires the following from the main branch:
- ``contexts/AuthContext.tsx``
- ``contexts/SocketContext.tsx``
- ``services/api.ts``
- ``components/common/ThemeProvider.tsx``
- ``components/common/StatusBadge.tsx``
- ``components/common/Card.tsx``
- Backend API running

## Setup Instructions
1. Clone the repository
   ``````bash
   git clone https://github.com/hshanto707/FixIt.git
   cd FixIt
   ``````

2. Checkout this branch
   ``````bash
   git checkout student-part2
   ``````

3. Install dependencies
   ``````bash
   npm install
   ``````

4. Make sure backend is running
   ``````bash
   cd campus-report-backend
   npm install
   npm start
   ``````

5. Start the app
   ``````bash
   npm run dev
   ``````

## Features
- ✅ View personal reports with filtering
- ✅ Browse all campus reports
- ✅ User profile management
- ✅ Secure password changes
- ✅ Real-time status updates
- ✅ Search and filter capabilities

## Tech Stack
- React Native
- Expo Router
- TypeScript
- Socket.IO Client
- Async Storage

---
**Branch**: student-part2  
**Total Lines**: 1,759  
**Last Updated**: $(Get-Date -Format 'MMMM dd, yyyy')
"@

Set-Content -Path "README.md" -Value $readmeContent

# Step 5: Commit and push
Write-Host "`n[5/5] Committing and pushing to GitHub..." -ForegroundColor Yellow
git add .
git commit -m "feat: Add Student Part 2 - Reports viewing, campus reports, and profile management (1,759 lines)"
git push -u origin student-part2

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ Student Part 2 successfully pushed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nBranch URL: https://github.com/hshanto707/FixIt/tree/student-part2" -ForegroundColor Cyan
Write-Host "`nFiles pushed:" -ForegroundColor White
Write-Host "  1. components/reports/StudentReports.tsx (517 lines)" -ForegroundColor Gray
Write-Host "  2. app/campus-reports.tsx (452 lines)" -ForegroundColor Gray
Write-Host "  3. app/(tabs)/profile.tsx (405 lines)" -ForegroundColor Gray
Write-Host "  4. components/profile/ChangePassword.tsx (385 lines)" -ForegroundColor Gray
Write-Host "  Total: 1,759 lines" -ForegroundColor Cyan

# Cleanup option
Write-Host "`n"
$cleanup = Read-Host "Do you want to remove the temporary directory? (Y/N)"
if ($cleanup -eq "Y" -or $cleanup -eq "y") {
    Set-Location $projectDir
    Remove-Item -Recurse -Force $tempDir
    Write-Host "Temporary directory removed." -ForegroundColor Green
} else {
    Write-Host "Temporary directory kept at: $tempDir" -ForegroundColor Yellow
}

Write-Host "`nDone! 🚀" -ForegroundColor Magenta
