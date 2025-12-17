# Data Integration Guide

This guide explains what mock data has been removed and what you need to replace with your backend API.

## Files Modified

- `/components/SidebarDemo.tsx` - Main dashboard component
- `/components/MatchLobbyWidget.tsx` - Match lobby system

## Data That Needs Backend Integration

### 1. League Information (`leagueInfo`)
**Location:** `/components/SidebarDemo.tsx` (lines 14-21)

**Current State:** Empty/zero values

**Required API Data:**
```typescript
{
  format: string,           // e.g., "Standard 1v1"
  prizePerWin: number,      // e.g., 50
  currentWeek: number,      // e.g., 12
  totalWeeks: number,       // e.g., 16
  potTotal: number,         // e.g., 2400
  payouts: Array<{
    place: string,          // e.g., "1st", "2nd", "3rd"
    amount: number          // Prize amount
  }>
}
```

### 2. User Status (`userStatus`)
**Location:** `/components/SidebarDemo.tsx` (lines 23-27)

**Current State:** Default values (place: 0, status: "paid")

**Required API Data:**
```typescript
{
  standingsPlace: number,           // User's rank in league
  paymentStatus: "paid" | "due" | "late",
  weekMatchStatus: "completed" | "pending" | "late"
}
```

### 3. Current User (`currentUser`)
**Location:** 
- `/components/SidebarDemo.tsx` (lines 32-36)
- `/components/MatchLobbyWidget.tsx` (lines 3-7)

**Current State:** Empty strings

**Required API Data:**
```typescript
{
  name: string,    // User's display name
  avatar: string,  // URL to user's avatar image
  role: string     // "OWNER", "THE_MAN", or "PLAYER" (for admin access)
}
```

### 4. Users/Players List (`mockUsers`)
**Location:** `/components/SidebarDemo.tsx` (line 34)

**Current State:** Empty array `[]`

**Required API Data:**
```typescript
Array<{
  id: number,
  name: string,
  avatar: string,           // URL to avatar
  crRating: number,         // e.g., 9.2
  o1Rating: number,         // e.g., 8.8
  overallRating: number,    // e.g., 9.0
  wins: number             // Number of wins
}>
```

### 5. Current Week Matchup (`currentMatchup`)
**Location:** `/components/SidebarDemo.tsx` (lines 36-46)

**Current State:** Empty/default values

**Required API Data:**
```typescript
{
  id: number,
  opponent: {
    name: string,
    avatar: string,
    rating: number
  },
  week: number,
  paymentStatus: "paid" | "unpaid",
  scheduledDate: string,      // e.g., "Dec 20, 2025"
  scheduledTime: string,      // e.g., "7:00 PM EST"
  canSchedule: boolean,
  isConfirmed: boolean
}
```

### 6. Full Schedule (`fullSchedule`)
**Location:** `/components/SidebarDemo.tsx` (line 48)

**Current State:** Empty array `[]`

**Required API Data:**
```typescript
Array<{
  id: number,
  opponent: {
    name: string,
    avatar: string,
    rating: number
  },
  week: number,
  paymentStatus: "paid" | "unpaid",
  scheduledDate: string | null,
  scheduledTime: string | null,
  result: "win" | "loss" | null,
  finalScore: {
    user: number,
    opponent: number
  } | null,
  disputed: boolean  // True if scores didn't match and flagged for admin review
}>
```

### 7. Payment Options (`paymentOptions`)
**Location:** `/components/SidebarDemo.tsx` (lines 50-65)

**Current State:** Empty usernames

**Required Data:**
```typescript
Array<{
  name: string,        // "Venmo", "PayPal", "Chime"
  icon: string,        // Image import
  url: string,         // Payment service URL
  username: string     // Your payment username/email
}>
```

### 8. Messages (`mockMessages`)
**Location:** `/components/SidebarDemo.tsx` (line 67)

**Current State:** Empty array `[]`

**Required API Data:**
```typescript
Array<{
  id: number,
  sender: "opponent" | "user",
  text: string,
  timestamp: string    // e.g., "Dec 16, 2:30 PM"
}>
```

### 9. Match Lobby Data
**Location:** `/components/SidebarDemo.tsx` (line 1830)

**Current State:** `matchLobbyTime` is `null`

**What to do:** When a match is scheduled and confirmed, set `matchLobbyTime` to a Date object representing when the match starts. The lobby will automatically appear 5 minutes before.

**Example:**
```typescript
const matchTime = new Date("2025-12-20T19:00:00"); // Match at 7:00 PM
setMatchLobbyTime(matchTime);
```

### 10. User Game Statistics
**Location:** `/components/SidebarDemo.tsx` (lines 1141-1148)

**Current State:** All zeros

**Required API Data:** For each opponent matchup, you need:
```typescript
{
  gamesPlayed: number,
  avg501: number,    // Average 501 score
  avgCR: number,     // Average CR rating
  avgCH: number      // Average CH rating
}
```

## Features That Need Backend Implementation

### 1. Messaging System
- Sending messages (currently just adds to local state)
- Receiving messages from opponent (no real-time updates)
- Schedule confirmation workflow (opponent needs to confirm/decline)
- Chat commands (`/forfeit`, `/help`, `/stats`)

### 2. Match Scheduling
- Proposing a schedule
- Opponent confirmation/decline
- Storing confirmed schedule times

### 3. Match Lobby
- Real-time opponent ready status
- Game-by-game score reporting
- Score confirmation (both players need to submit)
- Score dispute handling when scores don't match

### 4. Payment Tracking
- Payment status updates
- Payment modal submission
- Admin tracking of dues

### 5. Standings/Rankings
- Real-time standings updates
- Win/loss record tracking
- Rating calculations

## Recommended Backend Architecture

### WebSocket/Real-Time Updates Needed For:
- Messaging between players
- Match lobby opponent ready status
- Score confirmations
- Schedule confirmations

### REST API Endpoints Needed:
- `GET /api/league/info` - League information
- `GET /api/user/status` - Current user status
- `GET /api/users` - All users/standings
- `GET /api/schedule` - User's schedule
- `GET /api/matches/:matchId` - Match details
- `POST /api/messages` - Send message
- `GET /api/messages/:opponentId` - Get messages with opponent
- `POST /api/schedule/propose` - Propose match time
- `POST /api/schedule/confirm` - Confirm/decline schedule
- `POST /api/match/score` - Submit match score
- `POST /api/payment` - Submit payment
- `POST /api/match/forfeit` - Forfeit match

## Next Steps

1. Set up your backend API
2. Replace the empty/default values in the const declarations with API calls
3. Add `useEffect` hooks to fetch data when components mount
4. Add WebSocket connection for real-time features
5. Replace TODO comments with actual API calls
6. Test all workflows end-to-end

## Example: Fetching League Info

```typescript
useEffect(() => {
  async function fetchLeagueInfo() {
    const response = await fetch('/api/league/info');
    const data = await response.json();
    // Update your state with the data
    setLeagueInfo(data);
  }
  fetchLeagueInfo();
}, []);
```

You'll need to convert the `const` declarations to `useState` hooks to make them dynamic.

## Admin View Data

### 8. Pending Approvals (`pendingApprovals`)
**Location:** `/components/SidebarDemo.tsx` (line 85)

**Current State:** Empty array `[]`

**Required API Data:**
```typescript
Array<{
  id: number,
  name: string,
  avatar: string,
  overall_numeric: number,  // Overall rating for division suggestion
  submitted_date: string    // e.g., "Dec 15, 2025"
}>
```

### 9. All Players with Division Info (`allPlayers`)
**Location:** `/components/SidebarDemo.tsx` (line 86)

**Current State:** Empty array `[]`

**Required API Data:**
```typescript
Array<{
  id: number,
  name: string,
  avatar: string,
  division: string,          // e.g., "Premier", "Elite", "Advanced", "Open"
  wins: number,
  losses: number,
  points: number,
  is_division_leader: boolean,
  is_dqd: boolean,          // Is disqualified
  dq_reason?: string        // Reason for DQ if applicable
}>
```

### 10. Alternates/Waitlist (`alternates`)
**Location:** `/components/SidebarDemo.tsx` (line 87)

**Current State:** Empty array `[]`

**Required API Data:**
```typescript
Array<{
  id: number,
  name: string,
  avatar: string,
  overall_numeric: number,
  date_added: string        // e.g., "Dec 10, 2025"
}>
```

### 11. League Stats (`leagueStats`)
**Location:** `/components/SidebarDemo.tsx` (lines 88-96)

**Current State:** All zero values

**Required API Data:**
```typescript
{
  totalPlayers: number,
  pendingApprovalsCount: number,
  paidCount: number,          // Players who paid
  dueCount: number,           // Players with payment due
  lateCount: number,          // Players with late payment
  completedMatches: number,   // Matches completed this week
  totalMatches: number        // Total matches scheduled this week
}
```

## Admin View Functionality

The admin view is accessible only to users with role "OWNER" or "THE_MAN". When toggled on:

### Admin Features Needed:
1. **Approve/Reject Players** - API endpoints to approve or reject pending applications
2. **Edit Player Records** - Update wins, losses, and points
3. **Set Division Leaders** - Toggle division leader status
4. **Disqualify Players** - DQ players with a reason
5. **Reinstate Players** - Undo disqualification
6. **Promote Alternates** - Move players from alternate to active roster
7. **Send Announcements** - Broadcast messages to all league participants

### Additional REST API Endpoints for Admin:
- `POST /api/admin/players/approve` - Approve pending player
- `POST /api/admin/players/reject` - Reject pending player
- `PUT /api/admin/players/:id/record` - Update player record
- `PUT /api/admin/players/:id/division-leader` - Toggle division leader
- `POST /api/admin/players/:id/disqualify` - Disqualify player
- `POST /api/admin/players/:id/reinstate` - Reinstate player
- `POST /api/admin/alternates/:id/promote` - Promote alternate to active
- `DELETE /api/admin/alternates/:id` - Remove alternate
- `POST /api/admin/announcements` - Send announcement to all players
