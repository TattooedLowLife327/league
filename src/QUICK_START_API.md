# Quick Start: API Integration

This guide will help you quickly integrate your backend API with the dashboard.

## Step 1: Convert Static Data to State

Currently, data is defined as constants. You'll need to convert these to state hooks.

### Example: League Info

**Before (Current):**
```typescript
const leagueInfo = {
  format: "",
  prizePerWin: 0,
  // ...
};
```

**After (With API):**
```typescript
const [leagueInfo, setLeagueInfo] = useState({
  format: "",
  prizePerWin: 0,
  // ...
});

useEffect(() => {
  fetch('/api/league/info')
    .then(res => res.json())
    .then(data => setLeagueInfo(data))
    .catch(err => console.error('Error fetching league info:', err));
}, []);
```

## Step 2: Key Data Endpoints You Need

### User & League Data
```typescript
// GET /api/league/info
{
  "format": "Standard 1v1",
  "prizePerWin": 50,
  "currentWeek": 12,
  "totalWeeks": 16,
  "potTotal": 2400,
  "payouts": [
    { "place": "1st", "amount": 1000 },
    { "place": "2nd", "amount": 600 },
    { "place": "3rd", "amount": 400 }
  ]
}

// GET /api/user/me
{
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "standingsPlace": 3,
  "paymentStatus": "paid",
  "weekMatchStatus": "completed"
}

// GET /api/users (All players/standings)
[
  {
    "id": 1,
    "name": "Player Name",
    "avatar": "url",
    "crRating": 9.2,
    "o1Rating": 8.8,
    "overallRating": 9.0,
    "wins": 8
  }
]
```

### Schedule & Matches
```typescript
// GET /api/schedule
[
  {
    "id": 1,
    "opponent": {
      "name": "Opponent Name",
      "avatar": "url",
      "rating": 9.0
    },
    "week": 12,
    "paymentStatus": "paid",
    "scheduledDate": "Dec 20, 2025",
    "scheduledTime": "7:00 PM EST",
    "result": null,
    "finalScore": null
  }
]

// GET /api/match/current
{
  "id": 1,
  "opponent": { ... },
  "week": 12,
  "scheduledDate": "Dec 20, 2025",
  "scheduledTime": "7:00 PM EST",
  "canSchedule": true,
  "isConfirmed": true
}
```

### Messaging
```typescript
// GET /api/messages/:opponentId
[
  {
    "id": 1,
    "sender": "opponent", // or "user"
    "text": "Hey! When are you free?",
    "timestamp": "Dec 16, 2:30 PM"
  }
]

// POST /api/messages
{
  "opponentId": 2,
  "text": "I'm free after 7pm"
}
```

## Step 3: WebSocket for Real-Time Features

For real-time features like messaging and match lobby, you'll want WebSockets:

```typescript
useEffect(() => {
  const ws = new WebSocket('wss://your-api.com/ws');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
      case 'NEW_MESSAGE':
        setMessages(prev => [...prev, data.message]);
        setHasUnreadMessages(true);
        break;
      case 'OPPONENT_READY':
        setOpponentReady(true);
        break;
      case 'SCHEDULE_CONFIRMED':
        handleScheduleConfirmed(data.dateTime, false);
        break;
      case 'SCORE_CONFIRMED':
        // Handle score confirmation
        break;
    }
  };
  
  return () => ws.close();
}, []);
```

## Step 4: Update Critical Functions

### Sending Messages
Find the `handleSendMessage` function and update it:

```typescript
const handleSendMessage = async () => {
  if (!message.trim()) return;
  
  // Add to local state immediately for responsiveness
  const newMessage = {
    id: Date.now(),
    sender: "user" as const,
    text: message,
    timestamp: new Date().toLocaleString()
  };
  setMessages([...messages, newMessage]);
  setMessage("");
  
  // Send to backend
  try {
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        opponentId: opponent.id,
        text: message
      })
    });
  } catch (err) {
    console.error('Failed to send message:', err);
    // Optionally show error to user
  }
};
```

### Submitting Match Scores
In `MatchLobbyWidget.tsx`, update `handleSubmitScore`:

```typescript
const handleSubmitScore = async () => {
  setMatchSubmitted(true);
  
  try {
    const response = await fetch('/api/match/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId: matchId, // You'll need to pass this as a prop
        playerScore: playerScore,
        opponentScore: opponentScore,
        games: gameScores
      })
    });
    
    const result = await response.json();
    
    if (result.confirmed) {
      onMatchComplete(true);
    } else if (result.disputed) {
      setScoreDisputed(true);
    }
  } catch (err) {
    console.error('Failed to submit score:', err);
    // Handle error
  }
};
```

## Step 5: Environment Variables

Create a `.env` file:

```env
VITE_API_URL=https://your-api.com
VITE_WS_URL=wss://your-api.com/ws
```

Use in your code:

```typescript
const API_URL = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL;

fetch(`${API_URL}/api/league/info`)
```

## Step 6: Error Handling & Loading States

Add loading and error states:

```typescript
const [leagueInfo, setLeagueInfo] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetch('/api/league/info')
    .then(res => res.json())
    .then(data => {
      setLeagueInfo(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
}, []);

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;
```

## Common Pitfalls

1. **CORS Issues**: Make sure your backend allows requests from your frontend domain
2. **Authentication**: You'll likely need to add JWT tokens or session cookies
3. **Date Formats**: Be consistent with date/time formats between frontend and backend
4. **WebSocket Reconnection**: Implement reconnection logic for when connections drop
5. **Optimistic Updates**: Update UI immediately, then sync with backend

## Testing Your Integration

1. Start with read-only endpoints (GET requests)
2. Test each widget independently
3. Add write operations (POST/PUT/DELETE)
4. Finally, add real-time WebSocket features
5. Test error scenarios (network failures, invalid data)

## Admin View Integration

If the logged-in user has role "OWNER" or "THE_MAN", they will see an admin toggle in the header.

### Admin-Specific Endpoints

```typescript
// GET /api/admin/stats
{
  "totalPlayers": 24,
  "pendingApprovalsCount": 3,
  "paidCount": 20,
  "dueCount": 3,
  "lateCount": 1,
  "completedMatches": 10,
  "totalMatches": 12
}

// GET /api/admin/pending
[
  {
    "id": 1,
    "name": "New Player",
    "avatar": "url",
    "overall_numeric": 8.5,
    "submitted_date": "Dec 15, 2025"
  }
]

// GET /api/admin/players
[
  {
    "id": 1,
    "name": "Player Name",
    "avatar": "url",
    "division": "Premier",
    "wins": 8,
    "losses": 2,
    "points": 24,
    "is_division_leader": true,
    "is_dqd": false
  }
]

// POST /api/admin/players/approve
{
  "playerId": 1,
  "division": "Elite"
}

// PUT /api/admin/players/:id/record
{
  "wins": 10,
  "losses": 2,
  "points": 30
}

// POST /api/admin/players/:id/disqualify
{
  "reason": "Violated league rules"
}

// POST /api/admin/announcements
{
  "message": "League finals this Saturday!"
}
```

## Need Help?

See [DATA_INTEGRATION_GUIDE.md](./DATA_INTEGRATION_GUIDE.md) for detailed data structure documentation.
