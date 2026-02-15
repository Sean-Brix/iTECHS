# Archive Feature - User Guide

## Accessing the Archive Feature

### For Teachers:

1. **Login** to your teacher account at http://localhost:3001/
2. Navigate to the **"Students"** tab in the left sidebar (👥 icon)
3. You'll see **two sub-tabs** at the top of the main content area:

   ```
   ┌─────────────────────────────────────┐
   │  Active (5)  │  Archived (2)        │
   └─────────────────────────────────────┘
   ```

## Managing Students

### To Archive a Student:
1. Go to the **"Active"** tab
2. Find the student in the table
3. Click the **"📦 Archive"** button in the Actions column
4. Confirm the action in the popup dialog
5. The student will disappear from the Active tab and move to Archived

### To Restore a Student:
1. Go to the **"Archived"** tab
2. Find the student in the table
3. Click the **"↩️ Restore"** button in the Actions column
4. Confirm the action in the popup dialog
5. The student will move back to the Active tab

## Visual Indicators

### Active Students:
- ✅ Green "Active" badge
- Blue avatar background
- Full color display
- Actions: "👀 View" and "📦 Archive" buttons

### Archived Students:
- 🔶 Orange "Archived" badge
- Gray avatar background
- Muted/grayed out styling
- Actions: "↩️ Restore" button only

## Tab Counter

The counter next to each tab shows how many students are in that category:
- **Active (5)** - You have 5 active students
- **Archived (2)** - You have 2 archived students

## Confirmation Dialogs

For safety, both archive and restore actions require confirmation:

**Archive:**
```
Are you sure you want to archive [Student Name]?
[OK] [Cancel]
```

**Restore:**
```
Are you sure you want to restore [Student Name]?
[OK] [Cancel]
```

## Success Messages

After each action, you'll see a toast notification:
- ✅ "Student archived successfully"
- ✅ "Student restored successfully"

## Important Notes

1. **Archived students cannot login** to the system
2. **All student data is preserved** when archived
3. **Restoration is instant** - students can login immediately after being restored
4. **Teachers can only manage their own students**
5. **You cannot archive yourself**

## Troubleshooting

### Can't see the tabs?
- Make sure you're logged in as a teacher (not student or super admin)
- Make sure you're on the "Students" tab (👥 icon in sidebar)
- Try refreshing the page (Ctrl+R or F5)

### Archive button not working?
- Check browser console for errors (F12)
- Make sure backend server is running
- Verify you have permission to archive that student

### No students showing?
- Check that you have students assigned to you
- Try switching between Active and Archived tabs
- Refresh the page

## Backend Requirements

Make sure your backend server is running:
```bash
cd Backend
npm start
```

The backend should be running on http://localhost:5000

## API Endpoints Used

The feature uses these API endpoints:
- `GET /api/users/my-students?isArchived=false` - Get active students
- `GET /api/users/my-students?isArchived=true` - Get archived students
- `DELETE /api/users/:id` - Archive a student
- `POST /api/users/:id/restore` - Restore a student

## Database

Archived users are stored in the `archived_users` table with:
- Complete user information
- Archive timestamp
- Who archived them
- Reason for archiving

The original user record is marked as `isArchived: true` but not deleted.
