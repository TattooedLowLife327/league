# Admin View Guide

## Overview

The Gaming League Dashboard now includes a comprehensive admin view for league owners and administrators. This view is automatically available to users with the role "OWNER" or "THE_MAN".

## Accessing Admin View

When logged in as an admin, you'll see a toggle switch in the header next to "League Name":
- **Player View**: Standard player experience
- **Admin View**: Administrative dashboard with league management tools

## Admin View Features

### 1. Overview Widget (League Stats)

When in Admin View, the Overview widget transforms to show league-wide statistics:

- **Total Players**: Current number of active players in the league
- **Pending Approvals**: Number of players awaiting approval (with yellow badge notification)
- **Payment Status Breakdown**:
  - Paid: Players current on dues
  - Due: Players with upcoming payment
  - Late: Players overdue on payment
- **Current Week Progress**: X of Y matches completed

### 2. Management Widget

Replaces the Schedule widget in admin view with three tabbed sections:

#### Pending Tab
- Lists all players awaiting approval
- Each entry shows:
  - Player avatar and name
  - Overall rating
  - Submission date
- Division assignment dropdown (auto-suggests based on rating):
  - Premier (9.0+)
  - Elite (8.0-8.9)
  - Advanced (7.0-7.9)
  - Open (<7.0)
- Actions:
  - ✅ Green checkmark to approve
  - ❌ Red X to reject

#### Players Tab
- Players grouped by division (collapsible sections)
- Division header shows division name and player count
- Each player row shows:
  - Avatar
  - Crown icon (if division leader)
  - Name
  - Win-Loss record
- Click player to expand and see:
  - **Edit Record**: Inline editing for Wins/Losses/Points
  - **Set/Remove Division Leader**: Toggle division leader status
  - **Disqualify Player**: Opens modal requesting reason
- Disqualified players show:
  - Grayed-out appearance
  - DQ reason displayed
  - "Reinstate Player" button

#### Alternates Tab
- Lists players on waitlist/substitute roster
- Each entry shows:
  - Avatar and name
  - Overall rating
  - Date added to waitlist
- Actions:
  - "Promote to Active": Moves player to main roster (requires division assignment)
  - Remove button

### 3. Send Announcement Feature

Located in the header (only visible in Admin View):
- Click "Announce" button
- Opens modal to compose message
- Message broadcasts to all league participants
- Useful for league-wide updates, schedule changes, etc.

### 4. Enhanced Player Profiles

Click any player anywhere in the admin view to open their full profile modal showing:
- Complete statistics
- Match history
- Payment history
- Contact information

## Standings Widget

Remains unchanged in Admin View - works the same as Player View for easy reference.

## Visual Design

The admin view maintains the same glassmorphic dark theme with:
- Smooth toggle transitions
- Color-coded status indicators
- Touch-friendly mobile interface
- Responsive layout

## API Integration Required

To make the admin view functional, you need to integrate the following:

### Data Endpoints
- `GET /api/admin/stats` - League statistics
- `GET /api/admin/pending` - Pending player approvals
- `GET /api/admin/players` - All players with division info
- `GET /api/admin/alternates` - Waitlist players

### Action Endpoints
- `POST /api/admin/players/approve` - Approve pending player
- `POST /api/admin/players/reject` - Reject application
- `PUT /api/admin/players/:id/record` - Update player record
- `PUT /api/admin/players/:id/division-leader` - Toggle division leader
- `POST /api/admin/players/:id/disqualify` - DQ player with reason
- `POST /api/admin/players/:id/reinstate` - Undo disqualification
- `POST /api/admin/alternates/:id/promote` - Promote to active roster
- `DELETE /api/admin/alternates/:id` - Remove from waitlist
- `POST /api/admin/announcements` - Send league announcement

## User Roles

Set the `role` property in `currentUser` object:
```typescript
const currentUser = {
  name: "Admin Name",
  avatar: "url",
  role: "OWNER" // or "THE_MAN" for admin access, "PLAYER" for regular users
};
```

## Security Considerations

- Always verify admin permissions on the backend
- Don't rely solely on frontend role checks
- Validate all admin actions server-side
- Log all administrative actions for audit trail
- Implement proper authentication and authorization

## Current State (No Backend Connected)

Since all mock data has been removed:
- Admin toggle will appear if `currentUser.role` is set to "OWNER" or "THE_MAN"
- All tabs will show "No [items]" messages
- Buttons are functional but won't persist changes without API integration
- Follow the DATA_INTEGRATION_GUIDE.md to connect your backend

## Development Notes

All admin view code is in `/components/SidebarDemo.tsx`:
- `ManagementWidget` component (lines ~1198-1574)
- Admin view toggle logic in `Dashboard` component
- Conditional rendering based on `isAdminView` state
- Announcement modal (lines ~2504-2547)
