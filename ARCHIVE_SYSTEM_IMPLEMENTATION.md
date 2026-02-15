# Archive System Implementation

## Overview
Implemented a comprehensive archiving system with a separate `ArchivedUser` table for managing archived accounts. Users can now be archived and restored, with teachers able to manage their students' archive status.

## Changes Made

### 1. Database Schema (Prisma)
**File:** `Backend/prisma/schema.prisma`

- Added new `ArchivedUser` model to store archived users in a separate table
- Fields include:
  - `userId`: Reference to original user ID
  - `username`, `email`, `role`, `firstName`, `lastName`: User details
  - `teacherId`: For maintaining teacher-student relationship
  - `archivedAt`: Timestamp when archived
  - `archivedBy`: ID of user who performed the archiving
  - `archiveReason`: Optional reason for archiving
  - `userData`: Complete user data as JSON for restoration

**Migration:** Created migration `20260215090326_add_archived_users_table`

### 2. Backend Controllers
**File:** `Backend/src/controllers/userController.js`

#### New Functions:
- **`deleteUser()`** - Enhanced to move users to archive table
  - Creates entry in `ArchivedUser` table
  - Marks user as archived in main `User` table (soft delete)
  - Uses transaction to ensure data integrity
  - Includes archive reason tracking

- **`restoreUser()`** - Restores archived users
  - Updates user's `isArchived` status to `false`
  - Removes entry from `ArchivedUser` table
  - Uses transaction for atomicity

- **`getArchivedUsers()`** - Retrieves archived users
  - Supports pagination
  - Teachers see only their archived students
  - Super admins see all archived users
  - Supports search functionality

#### Updated Functions:
- **`getMyStudents()`** - Now explicitly filters by archive status
  - `isArchived: false` by default (shows only active students)
  - Pass `isArchived: 'true'` to get archived students

### 3. Backend Routes
**File:** `Backend/src/routes/userRoutes.js`

#### New Endpoints:
- `GET /api/users/archived` - Get archived users list
- `POST /api/users/:id/restore` - Restore an archived user

### 4. Frontend API Client
**File:** `Frontend/src/utils/api.js`

#### New Functions:
- `userAPI.deleteUser(id, reason)` - Archive user with optional reason
- `userAPI.restoreUser(id)` - Restore archived user
- `userAPI.getArchivedUsers(params)` - Fetch archived users

### 5. Teacher Page UI
**File:** `Frontend/src/pages/TeacherPage.jsx`

#### New Features:
- **Active/Archived Tabs:** Toggle between viewing active and archived students
- **Archive Action:** Button to archive active students with confirmation
- **Restore Action:** Button to restore archived students with confirmation
- **Visual Indicators:** 
  - Active students: Green badge with "Active" status
  - Archived students: Orange badge with "Archived" status
  - Grayed-out styling for archived entries

#### State Management:
- `studentViewTab`: Tracks current view ('active' or 'archived')
- `archivedStudents`: Stores list of archived students
- Auto-reloads data after archive/restore operations

## Usage

### For Teachers:

#### To Archive a Student:
1. Navigate to the "Students" tab
2. Ensure you're on the "Active" sub-tab
3. Click the "📦 Archive" button next to the student
4. Confirm the action in the dialog
5. Student is moved to the "Archived" tab

#### To Restore a Student:
1. Navigate to the "Students" tab
2. Click the "Archived" sub-tab
3. Click the "↩️ Restore" button next to the student
4. Confirm the action in the dialog
5. Student is moved back to the "Active" tab

### For Super Admins:
- Can archive/restore any user (teachers or students)
- Can view all archived users across the system
- Access through `/api/users/archived` endpoint

## API Endpoints

### Archive User
```http
DELETE /api/users/:id
Content-Type: application/json

{
  "reason": "Optional reason for archiving"
}
```

### Restore User
```http
POST /api/users/:id/restore
```

### Get Archived Users
```http
GET /api/users/archived?page=1&limit=10&search=query
```

### Get Active Students (Teacher)
```http
GET /api/users/my-students?isArchived=false
```

### Get Archived Students (Teacher)
```http
GET /api/users/my-students?isArchived=true
```

## Permissions

### Teachers:
- ✅ Can archive their own students
- ✅ Can restore their own students
- ✅ Can view their archived students
- ❌ Cannot archive themselves
- ❌ Cannot archive other teachers
- ❌ Cannot archive super admins

### Super Admins:
- ✅ Can archive any user
- ✅ Can restore any user
- ✅ Can view all archived users
- ❌ Cannot archive themselves

### Students:
- ❌ Cannot archive any users
- ❌ Cannot restore any users
- ✅ Can view their own status

## Database Structure

### ArchivedUser Table
```prisma
model ArchivedUser {
  id            String     @id @default(cuid())
  userId        String     @unique
  username      String
  email         String
  role          UserRole
  firstName     String?
  lastName      String?
  teacherId     String?
  archivedAt    DateTime   @default(now())
  archivedBy    String
  archiveReason String?
  userData      Json

  @@map("archived_users")
}
```

## Benefits

1. **Data Preservation:** Complete user data is preserved in the archive table
2. **Audit Trail:** Track who archived users and when
3. **Easy Restoration:** Users can be fully restored with all relationships intact
4. **Clean Separation:** Archived users don't clutter active user lists
5. **Flexible Management:** Teachers can manage their students independently

## Testing

### Manual Testing Steps:

1. **Start Backend Server:**
   ```bash
   cd Backend
   npm start
   ```

2. **Start Frontend:**
   ```bash
   cd Frontend
   npm run dev
   ```

3. **Test Archive Flow:**
   - Login as teacher
   - Navigate to Students tab
   - Archive a student
   - Verify student appears in "Archived" tab
   - Check database for entry in `archived_users` table

4. **Test Restore Flow:**
   - From Archived tab, click Restore
   - Verify student reappears in "Active" tab
   - Check that `archived_users` entry is removed

## Future Enhancements

- Add archive history/audit log
- Batch archive/restore operations
- Export archived user data
- Set automatic archive after inactivity period
- Add archive search filters
- Email notifications on archive/restore

## Troubleshooting

### Issue: Permission error on Prisma generate
**Solution:** Stop any running servers and try again, or restart VS Code

### Issue: Archived students not appearing
**Solution:** Check that `isArchived` query parameter is set correctly in API call

### Issue: Cannot restore student
**Solution:** Verify teacher has permission to restore (must be their student)

## Migration Instructions

If deploying to production:

1. Run the migration:
   ```bash
   cd Backend
   npx prisma migrate deploy
   ```

2. Verify the new table exists:
   ```bash
   npx prisma studio
   ```

3. Test archive functionality in staging first

4. Monitor for any data inconsistencies

5. Backup database before migration
