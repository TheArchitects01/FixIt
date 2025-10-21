# Admin-Staff Messaging Feature

## Overview
A bidirectional messaging system that allows admins and staff to communicate about specific reports until they are completed.

## How It Works

### For Staff:
1. When viewing an assigned report (not completed), staff can see an "Admin-Staff Conversation" section
2. All messages between admin and staff appear in a chat-like interface
3. Staff messages appear on the right side (green background)
4. Admin messages appear on the left side (red background)
5. Click "Add Message" button to send a message to admin
6. Messages are visible only when the report is assigned to staff and not completed

### For Admin:
1. When viewing a report that has been assigned to staff, admin can see the conversation section
2. All messages are displayed in chronological order
3. Admin messages appear on the left side (red background)
4. Staff messages appear on the right side (green background)
5. Click "Add Message" button to send a message to staff
6. Can continue messaging until the report is marked as completed

### Message Display:
- Each message shows:
  - Sender's name and role (admin/staff)
  - Timestamp
  - Message content
- Messages are color-coded by sender
- Conversation history is preserved

## Technical Implementation

### Backend Changes:
1. **Model Update** (`campus-report-backend/src/models/Report.js`):
   - Added `conversationNotes` array field
   - Each note contains: sender, senderName, message, createdAt

2. **API Update** (`campus-report-backend/src/routes/reports.js`):
   - Added `conversationNote` parameter handling
   - Admin can add conversation notes via PATCH /reports/:id
   - Staff can add conversation notes via PATCH /reports/:id
   - Notes are pushed to the conversationNotes array

### Frontend Changes:
1. **Report Details Screen** (`app/reports/[id].tsx`):
   - Added conversation UI section
   - Added modal for composing messages
   - Color-coded message bubbles
   - Real-time display of conversation history

## Usage Example

1. Admin assigns a report to Staff Member A
2. Staff Member A starts work and sends message: "I need replacement parts"
3. Admin sees the message and responds: "Parts ordered, arriving tomorrow"
4. Staff Member A replies: "Great, will complete once parts arrive"
5. Next day, staff completes the report
6. Conversation history is preserved but no new messages can be added

## Benefits
- Clear communication channel for each report
- Message history preserved for reference
- Role-based access (only admin and assigned staff can see/send)
- Improves coordination and reduces delays
- Transparent workflow documentation
