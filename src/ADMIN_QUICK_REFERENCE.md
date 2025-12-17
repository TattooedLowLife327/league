# Admin View Quick Reference

## Enable Admin View

Set user role in `/components/SidebarDemo.tsx`:
```typescript
const currentUser = {
  name: "Admin Name",
  avatar: "url",
  role: "OWNER" // or "THE_MAN"
};
```

## Admin View Toggle
Located in header next to "League Name"
- **Player View**: Normal player experience
- **Admin View**: League management dashboard

## Overview Widget (Admin Mode)

Shows league-wide stats:
- Total Players
- Pending Approvals (with badge)
- Payment Status (Paid/Due/Late)
- Week Progress (Matches completed)

## Management Widget Tabs

### 1. Pending Tab
**Purpose:** Approve new player applications

**Actions:**
- Select division from dropdown
- ✅ Approve player
- ❌ Reject application

**Auto-suggested divisions by rating:**
- 9.0+ → Premier
- 8.0-8.9 → Elite
- 7.0-7.9 → Advanced
- <7.0 → Open

### 2. Players Tab
**Purpose:** Manage active roster

**View:**
- Players grouped by division
- Click division to expand/collapse
- Click player to show actions

**Actions:**
- ✏️ Edit W/L/Points
- 👑 Set/Remove Division Leader
- 🚫 Disqualify (requires reason)
- ↩️ Reinstate (if DQ'd)

### 3. Alternates Tab
**Purpose:** Manage waitlist

**Actions:**
- ⬆️ Promote to Active
- ❌ Remove from waitlist

## Announcement Feature

**Location:** Header (Admin View only)
**Button:** "Announce"
**Purpose:** Broadcast message to all players

## Disputed Matches

**Indicator:** Yellow ⚠️ warning icon
**Location:** Next to match result in Schedule
**Meaning:** Scores didn't match - needs review

## Data to Replace (API Integration)

```typescript
// Line 85-96 in SidebarDemo.tsx
const pendingApprovals = []; // GET /api/admin/pending
const allPlayers = [];        // GET /api/admin/players  
const alternates = [];        // GET /api/admin/alternates
const leagueStats = { ... };  // GET /api/admin/stats
```

## API Endpoints Needed

### Read Operations
- `GET /api/admin/stats`
- `GET /api/admin/pending`
- `GET /api/admin/players`
- `GET /api/admin/alternates`

### Write Operations
- `POST /api/admin/players/approve`
- `POST /api/admin/players/reject`
- `PUT /api/admin/players/:id/record`
- `PUT /api/admin/players/:id/division-leader`
- `POST /api/admin/players/:id/disqualify`
- `POST /api/admin/players/:id/reinstate`
- `POST /api/admin/alternates/:id/promote`
- `DELETE /api/admin/alternates/:id`
- `POST /api/admin/announcements`

## Quick Test

1. Set `currentUser.role = "OWNER"`
2. Refresh page
3. Look for toggle in header
4. Click "Admin View"
5. Verify:
   - Overview shows league stats
   - Management widget has 3 tabs
   - Announce button visible
6. Test each tab and modal

## Styling Notes

- Blue = Active/Selected
- Green = Approve/Success
- Yellow = Pending/Warning
- Red = Reject/Error/DQ
- All transitions: `transition-all`
- Modals use `createPortal()`

## Related Documentation

- `ADMIN_VIEW_GUIDE.md` - Full feature guide
- `ADMIN_VIEW_IMPLEMENTATION.md` - Technical details
- `DATA_INTEGRATION_GUIDE.md` - Data structures
- `QUICK_START_API.md` - API examples
